(ns ^:no-doc frontend.handler.editor
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as w]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.diff :as diff]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.fs :as fs]
            [frontend.handler.block :as block-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.export :as export]
            [frontend.handler.notification :as notification]
            [frontend.handler.repeated :as repeated]
            [frontend.handler.route :as route-handler]
            [frontend.handler.assets :as assets-handler]
            [frontend.idb :as idb]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.modules.outliner.tree :as tree]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.template :as template]
            [frontend.util :as util :refer [profile]]
            [frontend.util.clock :as clock]
            [frontend.util.cursor :as cursor]
            [frontend.util.drawer :as drawer]
            [frontend.util.keycode :as keycode]
            [frontend.util.list :as list]
            [frontend.util.marker :as marker]
            [frontend.util.property :as property]
            [frontend.util.text :as text-util]
            [frontend.util.thingatpt :as thingatpt]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.db.schema :as db-schema]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [promesa.core :as p]
            [rum.core :as rum]))

;; FIXME: should support multiple images concurrently uploading

(defonce *asset-uploading? (atom false))
(defonce *asset-uploading-process (atom 0))
(defonce *selected-text (atom nil))

(defn get-selection-and-format
  []
  (when-let [block (state/get-edit-block)]
    (when (:block/uuid block)
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (let [selection-start (util/get-selection-start input)
                selection-end (util/get-selection-end input)
                value (gobj/get input "value")
                selection (when (not= selection-start selection-end)
                            (subs value selection-start selection-end))
                selection-start (+ selection-start
                                   (count (take-while #(= " " %) selection)))
                selection-end (- selection-end
                                 (count (take-while #(= " " %) (reverse selection))))]
            {:selection-start selection-start
             :selection-end selection-end
             :selection (some-> selection
                                string/trim)
             :format (:block/format block)
             :value value
             :block block
             :edit-id edit-id
             :input input}))))))

(defn- format-text!
  [pattern-fn]
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format selection value edit-id input]} m
          pattern (pattern-fn format)
          pattern-count (count pattern)
          pattern-prefix (subs value (max 0 (- selection-start pattern-count)) selection-start)
          pattern-suffix (subs value selection-end (min (count value) (+ selection-end pattern-count)))
          already-wrapped? (= pattern pattern-prefix pattern-suffix)
          prefix (if already-wrapped?
                   (subs value 0 (- selection-start pattern-count))
                   (subs value 0 selection-start))
          postfix (if already-wrapped?
                    (subs value (+ selection-end pattern-count))
                    (subs value selection-end))
          inner-value (cond-> selection
                        (not already-wrapped?)
                        (#(str pattern % pattern)))
          new-value (str prefix inner-value postfix)]
      (state/set-edit-content! edit-id new-value)
      (cond
        already-wrapped? (cursor/set-selection-to input (- selection-start pattern-count) (- selection-end pattern-count))
        selection (cursor/move-cursor-to input (+ selection-end pattern-count))
        :else (cursor/set-selection-to input (+ selection-start pattern-count) (+ selection-end pattern-count))))))

(defn bold-format! []
  (format-text! config/get-bold))

(defn italics-format! []
  (format-text! config/get-italic))

(defn highlight-format! []
  (when-let [block (state/get-edit-block)]
    (let [format (:block/format block)]
      (format-text! #(config/get-highlight format)))))

(defn strike-through-format! []
  (format-text! config/get-strike-through))

(defn html-link-format!
  ([]
   (html-link-format! nil))
  ([link]
   (when-let [m (get-selection-and-format)]
     (let [{:keys [selection-start selection-end format selection value edit-id input]} m
           cur-pos (cursor/pos input)
           empty-selection? (= selection-start selection-end)
           selection-link? (and selection (gp-util/url? selection))
           [content forward-pos] (cond
                                   empty-selection?
                                   (config/get-empty-link-and-forward-pos format)

                                   link
                                   (config/with-label-link format selection link)

                                   selection-link?
                                   (config/with-default-link format selection)

                                   :else
                                   (config/with-default-label format selection))
           new-value (str
                      (subs value 0 selection-start)
                      content
                      (subs value selection-end))
           cur-pos (or selection-start cur-pos)]
       (state/set-edit-content! edit-id new-value)
       (cursor/move-cursor-to input (+ cur-pos forward-pos))))))

(defn open-block-in-sidebar!
  [block-id]
  (when block-id
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [page? (nil? (:block/page block))]
        (state/sidebar-add-block!
         (state/get-current-repo)
         (:db/id block)
         (if page? :page :block))))))

(defn reset-cursor-range!
  [node]
  (when node
    (state/set-cursor-range! (util/caret-range node))))

(defn restore-cursor-pos!
  [id markup]
  (when-let [node (gdom/getElement (str id))]
    (let [cursor-range (state/get-cursor-range)
          pos (or (state/get-editor-last-pos)
                  (and cursor-range
                       (diff/find-position markup cursor-range)))]
      (cursor/move-cursor-to node pos)
      (state/clear-editor-last-pos!))))

(defn highlight-block!
  [block-uuid]
  (let [blocks (array-seq (js/document.getElementsByClassName (str block-uuid)))]
    (doseq [block blocks]
      (dom/add-class! block "block-highlight"))))

(defn unhighlight-blocks!
  []
  (let [blocks (some->> (array-seq (js/document.getElementsByClassName "block-highlight"))
                        (repeat 2)
                        (apply concat))]
    (doseq [block blocks]
      (gdom-classes/remove block "block-highlight"))))

(defn- get-edit-input-id-with-block-id
  [block-id]
  (when-let [first-block (util/get-first-block-by-id block-id)]
    (string/replace (gobj/get first-block "id")
                    "ls-block"
                    "edit-block")))

(defn clear-selection!
  []
  (state/clear-selection!)
  (util/select-unhighlight! (dom/by-class "selected")))

(defn- text-range-by-lst-fst-line [content [direction pos]]
  (case direction
    :up
    (let [last-new-line (or (string/last-index-of content \newline) -1)
          end (+ last-new-line pos 1)]
      (subs content 0 end))
    :down
    (-> (string/split-lines content)
        first
        (or "")
        (subs 0 pos))))

;; id: block dom id, "ls-block-counter-uuid"
(defn edit-block!
  ([block pos id]
   (edit-block! block pos id nil))
  ([block pos id {:keys [custom-content tail-len move-cursor?]
                  :or {tail-len 0
                       move-cursor? true}}]
   (when-not config/publishing?
     (when-let [block-id (:block/uuid block)]
       (let [block (or (db/pull [:block/uuid block-id]) block)
             edit-input-id (if (uuid? id)
                             (get-edit-input-id-with-block-id id)
                             (-> (str (subs id 0 (- (count id) 36)) block-id)
                                 (string/replace "ls-block" "edit-block")))
             content (or custom-content (:block/content block) "")
             content-length (count content)
             text-range (cond
                          (vector? pos)
                          (text-range-by-lst-fst-line content pos)

                          (and (> tail-len 0) (>= (count content) tail-len))
                          (subs content 0 (- (count content) tail-len))

                          (or (= :max pos) (<= content-length pos))
                          content

                          :else
                          (subs content 0 pos))
             content (-> (property/remove-built-in-properties (:block/format block)
                                                              content)
                         (drawer/remove-logbook))]
         (clear-selection!)
         (state/set-editing! edit-input-id content block text-range move-cursor?))))))

(defn- another-block-with-same-id-exists?
  [current-id block-id]
  (when-let [id (and (string? block-id) (parse-uuid block-id))]
    (and (not= current-id id)
         (db/entity [:block/uuid id]))))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (or
                   (and (vector? x)
                        (= :block/uuid (first x))
                        (nil? (db/entity x)))
                   (nil? x))) refs))

(defn- with-marker-time
  [content block format new-marker old-marker]
  (if (and (state/enable-timetracking?) new-marker)
    (try
      (let [logbook-exists? (and (:block/body block) (drawer/get-logbook (:block/body block)))
            new-marker (string/trim (string/lower-case (name new-marker)))
            old-marker (when old-marker (string/trim (string/lower-case (name old-marker))))
            new-content (cond
                          (or (and (nil? old-marker) (or (= new-marker "doing")
                                                         (= new-marker "now")))
                              (and (= old-marker "todo") (= new-marker "doing"))
                              (and (= old-marker "later") (= new-marker "now"))
                              (and (= old-marker new-marker "now") (not logbook-exists?))
                              (and (= old-marker new-marker "doing") (not logbook-exists?)))
                          (clock/clock-in format content)

                          (or
                           (and (= old-marker "doing") (= new-marker "todo"))
                           (and (= old-marker "now") (= new-marker "later"))
                           (and (contains? #{"now" "doing"} old-marker)
                                (= new-marker "done")))
                          (clock/clock-out format content)

                          :else
                          content)]
        new-content)
      (catch :default _e
        content))
    content))

(defn- with-timetracking
  [block value]
  (if (and (state/enable-timetracking?)
           (not= (:block/content block) value))
    (let [format (:block/format block)
          new-marker (last (util/safe-re-find (marker/marker-pattern format) (or value "")))
          new-value (with-marker-time value block format
                      new-marker
                      (:block/marker block))]
      new-value)
    value))

(defn wrap-parse-block
  [{:block/keys [content format left page uuid level pre-block?] :as block}]
  (let [block (or (and (:db/id block) (db/pull (:db/id block))) block)
        block (merge block
                     (block/parse-title-and-body uuid format pre-block? (:block/content block)))
        properties (-> (:block/properties block)
                       (dissoc :heading))
        real-content (:block/content block)
        content (if (and (seq properties) real-content (not= real-content content))
                  (property/with-built-in-properties properties content format)
                  content)
        content (drawer/with-logbook block content)
        content (with-timetracking block content)
        first-block? (= left page)
        ast (mldoc/->edn (string/trim content) (gp-mldoc/default-config format))
        first-elem-type (first (ffirst ast))
        first-elem-meta (second (ffirst ast))
        properties? (contains? #{"Property_Drawer" "Properties"} first-elem-type)
        markdown-heading? (and (= format :markdown)
                               (= "Heading" first-elem-type)
                               (nil? (:size first-elem-meta)))
        block-with-title? (mldoc/block-with-title? first-elem-type)
        content (string/triml content)
        content (string/replace content (block-ref/->block-ref uuid) "")
        [content content'] (cond
                             (and first-block? properties?)
                             [content content]

                             markdown-heading?
                             [content content]

                             :else
                             (let [content' (str (config/get-block-pattern format) (if block-with-title? " " "\n") content)]
                               [content content']))
        block (assoc block
                     :block/content content'
                     :block/format format)
        block (apply dissoc block (remove #{:block/pre-block?} db-schema/retract-attributes))
        block (block/parse-block block)
        block (if (and first-block? (:block/pre-block? block))
                block
                (dissoc block :block/pre-block?))
        block (update block :block/refs remove-non-existed-refs!)
        new-properties (merge
                        (select-keys properties (property/hidden-properties))
                        (:block/properties block))]
    (-> block
        (dissoc :block/top?
                :block/bottom?)
        (assoc :block/content content
               :block/properties new-properties)
        (merge (if level {:block/level level} {})))))

(defn- save-block-inner!
  [block value {}]
  (let [block (assoc block :block/content value)
        block (apply dissoc block db-schema/retract-attributes)]
    (profile
     "Save block: "
     (let [block' (wrap-parse-block block)]
       (outliner-tx/transact!
         {:outliner-op :save-block}
         (outliner-core/save-block! block'))

       ;; sanitized page name changed
       (when-let [title (get-in block' [:block/properties :title])]
         (if (string? title)
           (when-let [old-page-name (:block/name (db/entity (:db/id (:block/page block'))))]
             (when (and (:block/pre-block? block')
                        (not (string/blank? title))
                        (not= (util/page-name-sanity-lc title) old-page-name))
               (state/pub-event! [:page/title-property-changed old-page-name title])))
           (js/console.error (str "Title is not a string: " title))))))))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys [force?]
     :as opts}]
   (let [{:block/keys [uuid page format repo content properties]} block
         repo (or repo (state/get-current-repo))
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         block-id (when (map? properties) (get properties :id))
         content (-> (property/remove-built-in-properties format content)
                     (drawer/remove-logbook))]
     (cond
       (another-block-with-same-id-exists? uuid block-id)
       (notification/show!
        [:p.content
         (util/format "Block with the id %s already exists!" block-id)]
        :error)

       force?
       (save-block-inner! block value opts)

       :else
       (let [content-changed? (not= (string/trim content) (string/trim value))]
         (when (and content-changed? page)
           (save-block-inner! block value opts)))))))

(defn- compute-fst-snd-block-text
  [value pos]
  (when (string? value)
    (let [fst-block-text (subs value 0 pos)
          snd-block-text (string/triml (subs value pos))]
      [fst-block-text snd-block-text])))

(declare save-current-block!)
(defn outliner-insert-block!
  [config current-block new-block {:keys [sibling? keep-uuid?
                                          replace-empty-target?]}]
  (let [ref-query-top-block? (and (or (:ref? config)
                                      (:custom-query? config))
                                  (not (:ref-query-child? config)))
        has-children? (db/has-children? (:block/uuid current-block))
        sibling? (cond
                   ref-query-top-block?
                   false

                   (boolean? sibling?)
                   sibling?

                   (util/collapsed? current-block)
                   true

                   :else
                   (not has-children?))]
    (outliner-tx/transact!
     {:outliner-op :insert-blocks}
      (save-current-block! {:current-block current-block})
     (outliner-core/insert-blocks! [new-block] current-block {:sibling? sibling?
                                                              :keep-uuid? keep-uuid?
                                                              :replace-empty-target? replace-empty-target?}))))

(defn- block-self-alone-when-insert?
  [config uuid]
  (let [current-page (state/get-current-page)
        block-id (or (some-> (:id config) parse-uuid)
                     (some-> current-page parse-uuid))]
    (= uuid block-id)))

(defn insert-new-block-before-block-aux!
  [config block _value {:keys [ok-handler]}]
  (let [new-m {:block/uuid (db/new-block-id)
               :block/content ""}
        prev-block (-> (merge (select-keys block [:block/parent :block/left :block/format
                                                  :block/page :block/journal?]) new-m)
                       (wrap-parse-block))
        left-block (db/pull (:db/id (:block/left block)))]
    (profile
     "outliner insert block"
     (let [sibling? (not= (:db/id left-block) (:db/id (:block/parent block)))]
       (outliner-insert-block! config left-block prev-block {:sibling? sibling?
                                                             :keep-uuid? true})))
    (ok-handler prev-block)))

(defn insert-new-block-aux!
  [config
   {:block/keys [uuid]
    :as block}
   value
   {:keys [ok-handler]
    :as _opts}]
  (let [block-self? (block-self-alone-when-insert? config uuid)
        input (gdom/getElement (state/get-edit-input-id))
        pos (cursor/pos input)
        [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
        current-block (assoc block :block/content fst-block-text)
        current-block (apply dissoc current-block db-schema/retract-attributes)
        current-block (wrap-parse-block current-block)
        new-m {:block/uuid (db/new-block-id)
               :block/content snd-block-text}
        next-block (-> (merge (select-keys block [:block/parent :block/left :block/format
                                                  :block/page :block/journal?]) new-m)
                       (wrap-parse-block))
        sibling? (when block-self? false)]
    (outliner-insert-block! config current-block next-block {:sibling? sibling?
                                                             :keep-uuid? true})
    (util/set-change-value input fst-block-text)
    (ok-handler next-block)))

(defn clear-when-saved!
  []
  (commands/restore-state))

(defn get-state
  []
  (let [[{:keys [on-hide block block-id block-parent-id format sidebar?]} id config] (state/get-editor-args)
        node (gdom/getElement id)]
    (when node
      (let [value (gobj/get node "value")
            pos (util/get-selection-start node)]
        {:config config
         :on-hide on-hide
         :sidebar? sidebar?
         :format format
         :id id
         :block (or (db/pull [:block/uuid (:block/uuid block)]) block)
         :block-id block-id
         :block-parent-id block-parent-id
         :node node
         :value value
         :pos pos}))))

(defn insert-new-block!
  "Won't save previous block content - remember to save!"
  ([state]
   (insert-new-block! state nil))
  ([_state block-value]
   (when (and (not config/publishing?)
              (not= :insert (state/get-editor-op)))
     (state/set-editor-op! :insert)
     (when-let [state (get-state)]
       (let [{:keys [block value id config]} state
             value (if (string? block-value) block-value value)
             block-id (:block/uuid block)
             block (or (db/pull [:block/uuid block-id])
                       block)
             block-self? (block-self-alone-when-insert? config block-id)
             input (gdom/getElement (state/get-edit-input-id))
             pos (cursor/pos input)
             [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
             insert-fn (cond
                         block-self?
                         insert-new-block-aux!

                         (and (string/blank? fst-block-text) (not (string/blank? snd-block-text)))
                         insert-new-block-before-block-aux!

                         :else
                         insert-new-block-aux!)]
         (insert-fn config block value
                    {:ok-handler
                     (fn [last-block]
                       (clear-when-saved!)
                       (edit-block! last-block 0 id))}))))
   (state/set-editor-op! nil)))

(defn api-insert-new-block!
  [content {:keys [page block-uuid sibling? before? properties
                   custom-uuid replace-empty-target? edit-block?]
            :or {sibling? false
                 before? false
                 edit-block? true}}]
  (when (or page block-uuid)
    (let [before? (if page false before?)
          sibling? (boolean sibling?)
          sibling? (if before? true (if page false sibling?))
          block (if page
                  (db/entity [:block/name (util/page-name-sanity-lc page)])
                  (db/entity [:block/uuid block-uuid]))]
      (when block
        (let [last-block (when (not sibling?)
                           (let [children (:block/_parent block)
                                 blocks (db/sort-by-left children block)
                                 last-block-id (:db/id (last blocks))]
                             (when last-block-id
                               (db/pull last-block-id))))
              format (or
                      (:block/format block)
                      (db/get-page-format (:db/id block))
                      (state/get-preferred-format))
              content (if (seq properties)
                        (property/insert-properties format content properties)
                        content)
              new-block (-> (select-keys block [:block/page :block/journal?
                                                :block/journal-day])
                            (assoc :block/content content
                                   :block/format format))
              new-block (assoc new-block :block/page
                               (if page
                                 (:db/id block)
                                 (:db/id (:block/page new-block))))
              new-block (-> new-block
                            (wrap-parse-block)
                            (assoc :block/uuid (or custom-uuid (db/new-block-id))))
              [block-m sibling?] (cond
                                   before?
                                   (let [first-child? (->> [:block/parent :block/left]
                                                           (map #(:db/id (get block %)))
                                                           (apply =))
                                         block (db/pull (:db/id (:block/left block)))
                                         sibling? (if (or first-child? ;; insert as first child
                                                          (:block/name block))
                                                    false sibling?)]
                                     [block sibling?])

                                   sibling?
                                   [(db/pull (:db/id block)) sibling?]

                                   last-block
                                   [last-block true]

                                   block
                                   [(db/pull (:db/id block)) sibling?]

                                   ;; FIXME: assert
                                   :else
                                   nil)]
          (when block-m
            (outliner-insert-block! {} block-m new-block {:sibling? sibling?
                                                          :keep-uuid? true
                                                          :replace-empty-target? replace-empty-target?})
            (when edit-block?
              (if (and replace-empty-target?
                       (string/blank? (:block/content last-block)))
                ;; 20ms of waiting for DOM to load the block, to avoid race condition.
                ;; It's ensuring good response under M1 pro
                ;; Used to be 10ms before, but is causing occasional failure on M1 pro with a full page of blocks,
                ;; or failing E2E with a small number of blocks.
                ;; Should be related to the # of elements in page
                (js/setTimeout #(edit-block! last-block :max (:block/uuid last-block)) 20)
                (js/setTimeout #(edit-block! new-block :max (:block/uuid new-block)) 20)))
            new-block))))))

(defn insert-first-page-block-if-not-exists!
  ([page-title]
   (insert-first-page-block-if-not-exists! page-title {}))
  ([page-title opts]
   (when (and (string? page-title)
              (not (string/blank? page-title)))
     (state/pub-event! [:page/create page-title opts]))))

(defn properties-block
  [properties format page]
  (let [content (property/insert-properties format "" properties)
        refs (gp-block/get-page-refs-from-properties properties
                                                     (db/get-db (state/get-current-repo))
                                                     (state/get-date-formatter)
                                                     (state/get-config))]
    {:block/pre-block? true
     :block/uuid (db/new-block-id)
     :block/properties properties
     :block/properties-order (keys properties)
     :block/refs refs
     :block/left page
     :block/format format
     :block/content content
     :block/parent page
     :block/page page}))

(defn update-timestamps-content!
  [{:block/keys [repeated? marker format] :as block} content]
  (if repeated?
    (let [scheduled-ast (block-handler/get-scheduled-ast block)
          deadline-ast (block-handler/get-deadline-ast block)
          content (some->> (filter repeated/repeated? [scheduled-ast deadline-ast])
                           (map (fn [ts]
                                  [(repeated/timestamp->text ts)
                                   (repeated/next-timestamp-text ts)]))
                           (reduce (fn [content [old new]]
                                     (string/replace content old new))
                                   content))
          content (string/replace-first
                   content marker
                   (case marker
                     "DOING"
                     "TODO"

                     "NOW"
                     "LATER"

                     marker))
          content (clock/clock-out format content)
          content (drawer/insert-drawer
                   format content "logbook"
                   (util/format (str (if (= :org format) "-" "*")
                                     " State \"DONE\" from \"%s\" [%s]")
                                marker
                                (date/get-date-time-string-3)))]
      content)
    content))

(defn check
  [{:block/keys [marker content repeated? uuid] :as block}]
  (let [new-content (string/replace-first content marker "DONE")
        new-content (if repeated?
                      (update-timestamps-content! block content)
                      new-content)
        input-id (state/get-edit-input-id)]
    (if (and input-id
             (string/ends-with? input-id (str uuid)))
      (state/set-edit-content! input-id new-content)
      (save-block-if-changed! block new-content))))

(defn uncheck
  [{:block/keys [content uuid] :as block}]
  (let [marker (if (= :now (state/get-preferred-workflow))
                 "LATER"
                 "TODO")
        new-content (string/replace-first content "DONE" marker)
        input-id (state/get-edit-input-id)]
    (if (and input-id
             (string/ends-with? input-id (str uuid)))
      (state/set-edit-content! input-id new-content)
      (save-block-if-changed! block new-content))))

(defn get-selected-blocks
  []
  (distinct (seq (state/get-selection-blocks))))

(defn set-marker
  "The set-marker will set a new marker on the selected block.
  if the `new-marker` is nil, it will generate it automatically."
  ([block]
   (set-marker block nil))
  ([{:block/keys [marker content format] :as block} new-marker]
   (let [[new-content _] (marker/cycle-marker content marker new-marker format (state/get-preferred-workflow))]
     (save-block-if-changed! block new-content))))

(defn cycle-todos!
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))]
      (doseq [id ids]
        (let [block (db/pull [:block/uuid id])]
          (when (not-empty (:block/content block))
            (set-marker block)))))))

(defn cycle-todo!
  []
  #_:clj-kondo/ignore
  (if-let [blocks (seq (get-selected-blocks))]
    (cycle-todos!)
    (when (state/get-edit-block)
      (let [edit-input-id (state/get-edit-input-id)
            current-input (gdom/getElement edit-input-id)
            content (state/get-edit-content)
            format (or (db/get-page-format (state/get-current-page))
                       (state/get-preferred-format))
            [new-content marker] (marker/cycle-marker content nil nil format (state/get-preferred-workflow))
            new-pos (commands/compute-pos-delta-when-change-marker
                     content marker (cursor/pos current-input))]
        (state/set-edit-content! edit-input-id new-content)
        (cursor/move-cursor-to current-input new-pos)))))

(defn set-priority
  [{:block/keys [priority content] :as block} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-block-if-changed! block new-content)))

(defn delete-block-aux!
  [{:block/keys [uuid repo] :as _block} children?]
  (let [repo (or repo (state/get-current-repo))
        block (db/pull repo '[*] [:block/uuid uuid])]
    (when block
      (outliner-tx/transact!
       {:outliner-op :delete-blocks}
       (outliner-core/delete-blocks! [block] {:children? children?})))))

(defn- move-to-prev-block
  [repo sibling-block format id value]
  (when (and repo sibling-block)
    (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
      (when-let [block (db/pull repo '[*] [:block/uuid (uuid sibling-block-id)])]
        (let [original-content (util/trim-safe (:block/content block))
              value' (-> (property/remove-built-in-properties format original-content)
                         (drawer/remove-logbook))
              new-value (str value' value)
              tail-len (count value)
              pos (max
                   (if original-content
                     (gobj/get (utf8/encode original-content) "length")
                     0)
                   0)]
          (edit-block! block pos id
                       {:custom-content new-value
                        :tail-len tail-len
                        :move-cursor? false}))))))

(defn delete-block!
  ([repo]
   (delete-block! repo true))
  ([repo delete-children?]
   (state/set-editor-op! :delete)
   (let [{:keys [id block-id block-parent-id value format]} (get-state)]
     (when block-id
       (let [page-id (:db/id (:block/page (db/entity [:block/uuid block-id])))
             page-blocks-count (and page-id (db/get-page-blocks-count repo page-id))]
         (when (> page-blocks-count 1)
           (let [block (db/entity [:block/uuid block-id])
                 has-children? (seq (:block/_parent block))
                 block (db/pull (:db/id block))
                 left (tree/-get-left (outliner-core/block block))
                 left-has-children? (and left
                                         (when-let [block-id (:block/uuid (:data left))]
                                           (let [block (db/entity [:block/uuid block-id])]
                                             (seq (:block/_parent block)))))]
             (when-not (and has-children? left-has-children?)
               (when block-parent-id
                 (let [block-parent (gdom/getElement block-parent-id)
                       sibling-block (util/get-prev-block-non-collapsed-non-embed block-parent)]
                   (delete-block-aux! block delete-children?)
                   (move-to-prev-block repo sibling-block format id value)))))))))
   (state/set-editor-op! nil)))

(defn delete-blocks!
  [repo block-uuids blocks dom-blocks]
  (when (seq block-uuids)
    (let [uuid->dom-block (zipmap block-uuids dom-blocks)
          block (first blocks)
          block-parent (get uuid->dom-block (:block/uuid block))
          sibling-block (when block-parent (util/get-prev-block-non-collapsed-non-embed block-parent))]
      (outliner-tx/transact!
       {:outliner-op :delete-blocks}
       (outliner-core/delete-blocks! blocks {}))
      (when sibling-block
        (move-to-prev-block repo sibling-block
                            (:block/format block)
                            (dom/attr sibling-block "id")
                            "")))))

(defn- batch-set-block-property!
  "col: a collection of [block-id property-key property-value]."
  [col]
  #_:clj-kondo/ignore
  (when-let [repo (state/get-current-repo)]
    (outliner-tx/transact!
     {:outliner-op :save-block}
     (doseq [[block-id key value] col]
       (let [block-id (if (string? block-id) (uuid block-id) block-id)]
         (when-let [block (db/entity [:block/uuid block-id])]
           (let [format (:block/format block)
                 content (:block/content block)
                 properties (:block/properties block)
                 properties (if (nil? value)
                              (dissoc properties key)
                              (assoc properties key value))
                 content (if (nil? value)
                           (property/remove-property format key content)
                           (property/insert-property format content key value))
                 content (property/remove-empty-properties content)
                 block {:block/uuid block-id
                        :block/properties properties
                        :block/properties-order (keys properties)
                        :block/content content}]
             (outliner-core/save-block! block))))))

    (let [block-id (ffirst col)
          block-id (if (string? block-id) (uuid block-id) block-id)
          input-pos (or (state/get-edit-pos) :max)]
      ;; update editing input content
      (when-let [editing-block (state/get-edit-block)]
        (when (= (:block/uuid editing-block) block-id)
          (edit-block! editing-block
                       input-pos
                       (state/get-edit-input-id)))))))

(defn remove-block-property!
  [block-id key]
  (let [key (keyword key)]
    (batch-set-block-property! [[block-id key nil]])))

(defn set-block-property!
  [block-id key value]
  (let [key (keyword key)]
    (batch-set-block-property! [[block-id key value]])))

(defn set-block-query-properties!
  [block-id all-properties key add?]
  (when-let [block (db/entity [:block/uuid block-id])]
    (let [query-properties (-> (get-in block [:block/properties :query-properties] "")
                               (common-handler/safe-read-string "Failed to parse query properties"))
          query-properties (if (seq query-properties)
                             query-properties
                             all-properties)
          query-properties (if add?
                             (distinct (conj query-properties key))
                             (remove #{key} query-properties))
          query-properties (vec query-properties)]
      (if (seq query-properties)
        (set-block-property! block-id :query-properties (str query-properties))
        (remove-block-property! block-id :query-properties)))))

(defn set-block-timestamp!
  [block-id key value]
  (let [key (string/lower-case key)
        block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))
        value (str value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [content]} block
            content (or content (state/get-edit-content))
            new-content (-> (text-util/remove-timestamp content key)
                            (text-util/add-timestamp key value))]
        (when (not= content new-content)
          (let [input-id (state/get-edit-input-id)]
            (if (and input-id
                     (string/ends-with? input-id (str block-id)))
              (state/set-edit-content! input-id new-content)
              (save-block-if-changed! block new-content))))))))

(defn set-blocks-id!
  "Persist block uuid to file if the uuid is valid, and it's not persisted in file.
   Accepts a list of uuids."
  [block-ids]
  (let [block-ids (remove nil? block-ids)
        col (map (fn [block-id]
                   (when-let [block (db/entity [:block/uuid block-id])]
                     (when-not (:block/pre-block? block)
                       [block-id :id (str block-id)])))
                 block-ids)
        col (remove nil? col)]
    (batch-set-block-property! col)))

(defn copy-block-ref!
  ([block-id]
   (copy-block-ref! block-id #(str %)))
  ([block-id tap-clipboard]
   (set-blocks-id! [block-id])
   (util/copy-to-clipboard! (tap-clipboard block-id))))

(defn select-block!
  [block-uuid]
  (block-handler/select-block! block-uuid))

(defn- compose-copied-blocks-contents
  [repo block-ids]
  (let [blocks (db-utils/pull-many repo '[*] (mapv (fn [id] [:block/uuid id]) block-ids))
        top-level-block-uuids (->> (outliner-core/get-top-level-blocks blocks)
                                   (map :block/uuid))
        content (export/export-blocks-as-markdown
                 repo top-level-block-uuids
                 (state/get-export-block-text-indent-style)
                 (into [] (state/get-export-block-text-remove-options)))]
    [top-level-block-uuids content]))

(defn- get-all-blocks-by-ids
  [repo ids]
  (loop [ids ids
         result []]
    (if (seq ids)
      (let [blocks (db/get-block-and-children repo (first ids))
            result (vec (concat result blocks))]
        (recur (remove (set (map :block/uuid result)) (rest ids)) result))
      result)))

(defn copy-selection-blocks
  [html?]
  (when-let [blocks (seq (state/get-selection-blocks))]
    (let [repo (state/get-current-repo)
          ids (distinct (keep #(when-let [id (dom/attr % "blockid")]
                                 (uuid id)) blocks))
          [top-level-block-uuids content] (compose-copied-blocks-contents repo ids)
          block (db/entity [:block/uuid (first ids)])]
      (when block
        (let [html (export/export-blocks-as-html repo top-level-block-uuids)]
          (common-handler/copy-to-clipboard-without-id-property! (:block/format block) content (when html? html)))
        (state/set-copied-blocks! content (get-all-blocks-by-ids repo top-level-block-uuids))
        (notification/show! "Copied!" :success)))))

(defn copy-block-refs
  []
  (when-let [selected-blocks (seq (get-selected-blocks))]
    (let [blocks (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                        (let [level (dom/attr % "level")]
                                          {:id (uuid id)
                                           :level (int level)}))
                                     selected-blocks))
                      (remove nil?))
          first-block (first blocks)
          first-root-level-index (ffirst
                                  (filter (fn [[_ block]] (= (:level block) 1))
                                          (map-indexed vector blocks)))
          root-level (atom (:level first-block))
          adjusted-blocks (map-indexed
                           (fn [index {:keys [id level]}]
                             {:id id
                              :level (if (< index first-root-level-index)
                                       (if (< level @root-level)
                                         (do
                                           (reset! root-level level)
                                           1)
                                         (inc (- level @root-level)))
                                       level)})
                           blocks)
          block (db/pull [:block/uuid (:id first-block)])
          copy-str (some->> adjusted-blocks
                            (map (fn [{:keys [id level]}]
                                   (condp = (:block/format block)
                                     :org
                                     (str (string/join (repeat level "*")) " " (block-ref/->block-ref id))
                                     :markdown
                                     (str (string/join (repeat (dec level) "\t")) "- " (block-ref/->block-ref id)))))
                            (string/join "\n\n"))]
      (set-blocks-id! (map :id blocks))
      (util/copy-to-clipboard! copy-str))))

(defn copy-block-embeds
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))
          ids-str (some->> ids
                           (map (fn [id] (util/format "{{embed ((%s))}}" id)))
                           (string/join "\n\n"))]
      (set-blocks-id! ids)
      (util/copy-to-clipboard! ids-str))))

(defn get-selected-toplevel-block-uuids
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [repo (state/get-current-repo)
          block-ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                           (uuid id)) blocks))
                         (remove nil?))
          blocks (db-utils/pull-many repo '[*] (mapv (fn [id] [:block/uuid id]) block-ids))
          page-id (:db/id (:block/page (first blocks)))
          ;; filter out blocks not belong to page with 'page-id'
          blocks* (remove (fn [block] (some-> (:db/id (:block/page block)) (not= page-id))) blocks)]
      (->> (outliner-core/get-top-level-blocks blocks*)
           (map :block/uuid)))))

(defn cut-selection-blocks
  [copy?]
  (when copy? (copy-selection-blocks true))
  (when-let [blocks (seq (get-selected-blocks))]
    ;; remove embeds, references and queries
    (let [dom-blocks (remove (fn [block]
                              (or (= "true" (dom/attr block "data-transclude"))
                                  (= "true" (dom/attr block "data-query")))) blocks)
          dom-blocks (if (seq dom-blocks) dom-blocks
                         (remove (fn [block]
                                   (= "true" (dom/attr block "data-transclude"))) blocks))]
      (when (seq dom-blocks)
        (let [repo (state/get-current-repo)
              block-uuids (distinct (map #(uuid (dom/attr % "blockid")) dom-blocks))
              lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
              blocks (db/pull-many repo '[*] lookup-refs)
              top-level-blocks (outliner-core/get-top-level-blocks blocks)
              sorted-blocks (mapcat (fn [block]
                                      (tree/get-sorted-block-and-children repo (:db/id block)))
                                    top-level-blocks)]
          (delete-blocks! repo (map :block/uuid sorted-blocks) sorted-blocks dom-blocks))))))

(def url-regex
  "Didn't use link/plain-link as it is incorrectly detects words as urls."
  #"[^\s\(\[]+://[^\s\)\]]+")

(defn extract-nearest-link-from-text
  [text pos & additional-patterns]
  (let [;; didn't use page-ref regexs b/c it handles page-ref and org link cases
        page-pattern #"\[\[([^\]]+)]]"
        tag-pattern #"#\S+"
        page-matches (util/re-pos page-pattern text)
        block-matches (util/re-pos block-ref/block-ref-re text)
        tag-matches (util/re-pos tag-pattern text)
        additional-matches (mapcat #(util/re-pos % text) additional-patterns)
        matches (->> (concat page-matches block-matches tag-matches additional-matches)
                     (remove nil?))
        [_ match] (first (sort-by
                          (fn [[start-pos content]]
                            (let [end-pos (+ start-pos (count content))]
                              (cond
                                (< pos start-pos)
                                (- pos start-pos)

                                (> pos end-pos)
                                (- end-pos pos)

                                :else
                                0)))
                          >
                          matches))]
    (when match
      (cond
        (some #(re-find % match) additional-patterns)
        match
        (string/starts-with? match "#")
        (subs match 1 (count match))
        :else
        (subs match 2 (- (count match) 2))))))

(defn- get-nearest-page-or-url
  "Return the nearest page-name (not dereferenced, may be an alias), block, tag or url"
  []
  (when-let [block (state/get-edit-block)]
    (when (:block/uuid block)
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (when-let [pos (cursor/pos input)]
            (let [value (gobj/get input "value")]
              (extract-nearest-link-from-text value pos url-regex))))))))

(defn- get-nearest-page
  "Return the nearest page-name (not dereferenced, may be an alias), block or tag"
  []
  (when-let [block (state/get-edit-block)]
    (when (:block/uuid block)
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (when-let [pos (cursor/pos input)]
            (let [value (gobj/get input "value")]
              (extract-nearest-link-from-text value pos))))))))

(defn follow-link-under-cursor!
  []
  (when-let [page (get-nearest-page-or-url)]
    (when-not (string/blank? page)
      (if (re-find url-regex page)
        (js/window.open page)
        (let [page-name (db-model/get-redirect-page-name page)]
          (state/clear-edit!)
          (insert-first-page-block-if-not-exists! page-name))))))

(defn open-link-in-sidebar!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)
          block? (util/uuid-string? page-name)]
      (when-let [page (db/get-page page-name)]
        (if block?
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :block)
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :page))))))

(defn zoom-in! []
  (if (state/editing?)
    (when-let [id (some-> (state/get-edit-block)
                          :block/uuid
                          ((fn [id] [:block/uuid id]))
                          db/entity
                          :block/uuid)]
      (let [pos (state/get-edit-pos)]
        (route-handler/redirect-to-page! id)
        (js/setTimeout #(edit-block! {:block/uuid id} pos id) 0)))
    (js/window.history.forward)))

(defn zoom-out!
  []
  (if (state/editing?)
    (let [page (state/get-current-page)
          block-id (and (string? page) (parse-uuid page))]
      (when block-id
        (let [block-parent (db/get-block-parent block-id)]
          (if-let [id (and
                       (nil? (:block/name block-parent))
                       (:block/uuid block-parent))]
            (do
              (route-handler/redirect-to-page! id)
              (js/setTimeout #(edit-block! {:block/uuid block-id} :max block-id) 0))
            (let [page-id (some-> (db/entity [:block/uuid block-id])
                                  :block/page
                                  :db/id)]

              (when-let [page-name (:block/name (db/entity page-id))]
                (route-handler/redirect-to-page! page-name)
                (js/setTimeout #(edit-block! {:block/uuid block-id} :max block-id) 0)))))))
    (js/window.history.back)))

(defn cut-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [repo (state/get-current-repo)
          ;; TODO: support org mode
          [_top-level-block-uuids md-content] (compose-copied-blocks-contents repo [block-id])
          html (export/export-blocks-as-html repo [block-id])
          sorted-blocks (tree/get-sorted-block-and-children repo (:db/id block))]
      (state/set-copied-blocks! md-content sorted-blocks)
      (common-handler/copy-to-clipboard-without-id-property! (:block/format block) md-content html)
      (delete-block-aux! block true))))

(defn clear-last-selected-block!
  []
  (state/drop-last-selection-block!))

(defn highlight-selection-area!
  [end-block]
  (when-let [start-block (state/get-selection-start-block-or-first)]
    (let [blocks (util/get-nodes-between-two-nodes start-block end-block "ls-block")
          direction (util/get-direction-between-two-nodes start-block end-block "ls-block")
          blocks (if (= :up direction)
                   (reverse blocks)
                   blocks)]
      (state/exit-editing-and-set-selected-blocks! blocks direction))))

(defn- select-block-up-down
  [direction]
  (cond
    ;; when editing, quit editing and select current block
    (state/editing?)
    (state/exit-editing-and-set-selected-blocks! [(gdom/getElement (state/get-editing-block-dom-id))])

    ;; when selection and one block selected, select next block
    (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed-skip)
          element (f (first (state/get-selection-blocks)))]
      (when element
        (state/conj-selection-block! element direction)))

    ;; if same direction, keep conj on same direction
    (and (state/selection?) (= direction (state/get-selection-direction)))
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed-skip)
          first-last (if (= :up direction) first last)
          element (f (first-last (state/get-selection-blocks)))]
      (when element
        (state/conj-selection-block! element direction)))

    ;; if different direction, keep clear until one left
    (state/selection?)
    (clear-last-selected-block!))
  nil)

(defn on-select-block
  [direction]
  (fn [_event]
    (select-block-up-down direction)))

(defn save-block-aux!
  [block value opts]
  (let [value (string/trim value)]
    ;; FIXME: somehow frontend.components.editor's will-unmount event will loop forever
    ;; maybe we shouldn't save the block/file in "will-unmount" event?
    (save-block-if-changed! block value
                            (merge
                             {:init-properties (:block/properties block)}
                             opts))))

(defn save-block!
  ([repo block-or-uuid content]
   (let [block (if (or (uuid? block-or-uuid)
                       (string? block-or-uuid))
                 (db-model/query-block-by-uuid block-or-uuid) block-or-uuid)
         format (:block/format block)]
     (save-block! {:block block :repo repo :format format} content)))
  ([{:keys [block repo] :as _state} value]
   (when (:db/id (db/entity repo [:block/uuid (:block/uuid block)]))
     (save-block-aux! block value {}))))

(defn save-current-block!
  "skip-properties? if set true, when editing block is likely be properties, skip saving"
  ([]
   (save-current-block! {}))
  ([{:keys [force? skip-properties? current-block] :as opts}]
   ;; non English input method
   (when-not (or (state/editor-in-composition?)
                 (:editor/skip-saving-current-block? @state/state))
     (when (state/get-current-repo)
       (when-not (state/get-editor-action)
         (try
           (let [input-id (state/get-edit-input-id)
                 block (state/get-edit-block)
                 db-block (when-let [block-id (:block/uuid block)]
                            (db/pull [:block/uuid block-id]))
                 elem (and input-id (gdom/getElement input-id))
                 db-content (:block/content db-block)
                 db-content-without-heading (and db-content
                                                 (gp-util/safe-subs db-content (:block/level db-block)))
                 value (if (= (:block/uuid current-block) (:block/uuid block))
                         (:block/content current-block)
                         (and elem (gobj/get elem "value")))]
             (when value
               (cond
                 force?
                 (save-block-aux! db-block value opts)

                 (and skip-properties?
                      (db-model/top-block? block)
                      (when elem (thingatpt/properties-at-point elem)))
                 nil

                 (and block value db-content-without-heading
                      (not= (string/trim db-content-without-heading)
                            (string/trim value)))
                 (save-block-aux! db-block value opts))))
           (catch :default error
             (log/error :save-block-failed error))))))
   (state/set-state! :editor/skip-saving-current-block? false)))

(defn- clean-content!
  [format content]
  (->> (text/remove-level-spaces content format (config/get-block-pattern format))
       (drawer/remove-logbook)
       (property/remove-properties format)
       string/trim))

(defn insert-command!
  [id command-output format {:keys [restore?]
                             :or {restore? true}
                             :as option}]
  (cond
    ;; replace string
    (string? command-output)
    (commands/insert! id command-output option)

    ;; steps
    (vector? command-output)
    (commands/handle-steps command-output format)

    (fn? command-output)
    (let [s (command-output)]
      (commands/insert! id s option))

    :else
    nil)

  (when restore?
    (commands/restore-state)))

(defn get-asset-file-link
  [format url file-name image?]
  (let [pdf? (and url (string/ends-with? (string/lower-case url) ".pdf"))
        video? (and url (util/ext-of-video? url))]
    (case (keyword format)
      :markdown (util/format (str (when (or image? video? pdf?) "!") "[%s](%s)") file-name url)
      :org (if image?
             (util/format "[[%s]]" url)
             (util/format "[[%s][%s]]" url file-name))
      nil)))

(defn- ensure-assets-dir!
  [repo]
  (p/let [repo-dir (config/get-repo-dir repo)
          assets-dir "assets"
          _ (fs/mkdir-if-not-exists (str repo-dir "/" assets-dir))]
    [repo-dir assets-dir]))

(defn get-asset-path
  "Get asset path from filename, ensure assets dir exists"
  [filename]
  (p/let [[repo-dir assets-dir] (ensure-assets-dir! (state/get-current-repo))]
    (util/safe-path-join repo-dir assets-dir filename)))

(defn save-assets!
  ([_ repo files]
   (p/let [[repo-dir assets-dir] (ensure-assets-dir! repo)]
     (save-assets! repo repo-dir assets-dir files
                   (fn [index file-base]
                     ;; TODO: maybe there're other chars we need to handle?
                     (let [file-base (-> file-base
                                         (string/replace " " "_")
                                         (string/replace "%" "_")
                                         (string/replace "/" "_"))
                           file-name (str file-base "_" (.now js/Date) "_" index)]
                       (string/replace file-name #"_+" "_"))))))
  ([repo dir path files gen-filename]
   (p/all
    (for [[index ^js file] (map-indexed vector files)]
      ;; WARN file name maybe fully qualified path when paste file
      (let [file-name (util/node-path.basename (.-name file))
            [file-base ext-full ext-base] (if file-name
                              (let [ext-base (util/node-path.extname file-name)
                                    ext-full (if-not (config/extname-of-supported? ext-base)
                                               (util/full-path-extname file-name) ext-base)]
                                [(subs file-name 0 (- (count file-name)
                                                      (count ext-full))) ext-full ext-base])
                              ["" "" ""])
            filename  (str (gen-filename index file-base) ext-full)
            filename  (str path "/" filename)
            matched-alias (assets-handler/get-matched-alias-by-ext ext-base)
              filename (cond-> filename
                         (not (nil? matched-alias))
                         (string/replace #"^[.\/\\]*assets[\/\\]+" ""))
              dir (or (:dir matched-alias) dir)]

        (if (util/electron?)
          (let [from (.-path file)
                from (if (string/blank? from) nil from)]

            (js/console.debug "Debug: Copy Asset #" dir filename from)

            (-> (js/window.apis.copyFileToAssets dir filename from)
                (p/then
                 (fn [dest]
                   [filename
                    (if (string? dest) (js/File. #js[] dest) file)
                    (.join util/node-path dir filename)
                    matched-alias]))
                (p/catch #(js/console.error "Debug: Copy Asset Error#" %))))

          (p/then (fs/write-file! repo dir filename (.stream file) nil)
                  #(p/resolved [filename file nil matched-alias]))))))))

(defonce *assets-url-cache (atom {}))

(defn make-asset-url
  [path] ;; path start with "/assets" or compatible for "../assets"
  (if config/publishing? path
    (let [repo      (state/get-current-repo)
          repo-dir  (config/get-repo-dir repo)
          path      (string/replace path "../" "/")
          full-path (util/node-path.join repo-dir path)
          data-url? (string/starts-with? path "data:")]
      (cond
        data-url?
        path ;; just return the original

        (and (assets-handler/alias-enabled?)
             (assets-handler/check-alias-path? path))
        (assets-handler/resolve-asset-real-path-url (state/get-current-repo) path)

        (util/electron?)
        (str "assets://" full-path)

        (mobile-util/native-platform?)
        (mobile-util/convert-file-src full-path)

        :else
        (let [handle-path (str "handle" full-path)
              cached-url  (get @*assets-url-cache (keyword handle-path))]
          (if cached-url
            (p/resolved cached-url)
            (p/let [handle (idb/get-item handle-path)
                    file   (and handle (.getFile handle))]
              (when file
                (p/let [url (js/URL.createObjectURL file)]
                  (swap! *assets-url-cache assoc (keyword handle-path) url)
                  url)))))))))

(defn delete-asset-of-block!
  [{:keys [repo href full-text block-id local? delete-local?] :as _opts}]
  (let [block (db-model/query-block-by-uuid block-id)
        _ (or block (throw (str block-id " not exists")))
        text (:block/content block)
        content (string/replace text full-text "")]
    (save-block! repo block content)
    (when (and local? delete-local?)
      ;; FIXME: should be relative to current block page path
      (when-let [href (if (util/electron?) href
                        (second (re-find #"\((.+)\)$" full-text)))]
        (fs/unlink! repo
                    (config/get-repo-path
                     repo (-> href
                              (string/replace #"^../" "/")
                              (string/replace #"^assets://" ""))) nil)))))

;; assets/journals_2021_02_03_1612350230540_0.png
(defn resolve-relative-path
  [file-path]
  (if-let [current-file (or (db-model/get-block-file-path (state/get-edit-block))
                            ;; fix dummy file path of page
                            (and (util/electron?)
                                 (util/node-path.join
                                  (config/get-repo-dir (state/get-current-repo))
                                  (config/get-pages-directory) "_.md")))]
    (util/get-relative-path current-file file-path)
    file-path))

(defn upload-asset
  [id ^js files format uploading? drop-or-paste?]
  (let [repo (state/get-current-repo)
        block (state/get-edit-block)]
    (when (config/local-db? repo)
      (-> (save-assets! block repo (js->clj files))
          (p/then
           (fn [res]
             (when-let [[asset-file-name file full-file-path matched-alias] (and (seq res) (first res))]
               (let [image? (util/ext-of-image? asset-file-name)]
                 (insert-command!
                  id
                  (get-asset-file-link format
                                       (if matched-alias
                                         (str
                                          (if image? "../assets/" "")
                                          "@" (:name matched-alias) "/" asset-file-name)
                                         (resolve-relative-path (or full-file-path asset-file-name)))
                                       (if file (.-name file) (if image? "image" "asset"))
                                       image?)
                  format
                  {:last-pattern (if drop-or-paste? "" (state/get-editor-command-trigger))
                   :restore?     true
                   :command      :insert-asset})))))
          (p/finally
            (fn []
              (reset! uploading? false)
              (reset! *asset-uploading? false)
              (reset! *asset-uploading-process 0)))))))

;; Editor should track some useful information, like editor modes.
;; For example:
;; 1. Which file format is it, markdown or org mode?
;; 2. Is it in the properties area? Then we can enable the ":" autopair
(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"
   "`" "`"
   "~" "~"
   "*" "*"
   "_" "_"
   "^" "^"
   "=" "="
   "/" "/"
   "+" "+"})
;; ":" ":"                              ; TODO: only properties editing and org mode tag

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(def autopair-when-selected
  #{"*" "^" "_" "=" "+" "/"})

(def delete-map
  (assoc autopair-map
         "$" "$"
         ":" ":"))

(defn autopair
  [input-id prefix _format _option]
  (let [value (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected value)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
      (when-not (string/blank? selected) (reset! *selected-text selected))
      (let [[prefix _pos] (commands/simple-replace! input-id value selected
                                                    {:backward-pos (count postfix)
                                                     :check-fn (fn [new-value prefix-pos]
                                                                 (when (>= prefix-pos 0)
                                                                   [(subs new-value prefix-pos (+ prefix-pos 2))
                                                                    (+ prefix-pos 2)]))})]
        (cond
          (= prefix page-ref/left-brackets)
          (do
            (commands/handle-step [:editor/search-page])
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)}))

          (= prefix block-ref/left-parens)
          (do
            (commands/handle-step [:editor/search-block :reference])
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})))))))

(defn surround-by?
  [input before end]
  (when input
    (let [value (gobj/get input "value")
          pos (cursor/pos input)]
      (text-util/surround-by? value pos before end))))

(defn- autopair-left-paren?
  [input key]
  (and (= key "(")
       (or
         (surround-by? input :start "")
         (surround-by? input " " "")
         (surround-by? input "]" "")
         (surround-by? input "(" ""))))

(defn wrapped-by?
  [input before end]
  (when input
    (let [value (gobj/get input "value")
          pos (cursor/pos input)]
      (when (>= pos 0)
        (text-util/wrapped-by? value pos before end)))))

(defn get-matched-pages
  "Return matched page names"
  [q]
  (let [block (state/get-edit-block)
        editing-page (and block
                          (when-let [page-id (:db/id (:block/page block))]
                            (:block/name (db/entity page-id))))
        pages (search/page-search q 100)]
    (if editing-page
      ;; To prevent self references
      (remove (fn [p] (= (util/page-name-sanity-lc p) editing-page)) pages)
      pages)))

(defn get-matched-blocks
  [q block-id]
  ;; remove current block
  (let [current-block (state/get-edit-block)
        block-parents (set (->> (db/get-block-parents (state/get-current-repo)
                                                      block-id
                                                      99)
                                (map (comp str :block/uuid))))
        current-and-parents (set/union #{(str (:block/uuid current-block))} block-parents)]
    (p/let [result (search/block-search (state/get-current-repo) q {:limit 20})]
      (remove
       (fn [h]
         (contains? current-and-parents (:block/uuid h)))
       result))))

(defn get-matched-templates
  [q]
  (search/template-search q))

(defn get-matched-properties
  [q]
  (search/property-search q))

(defn get-matched-property-values
  [property q]
  (search/property-value-search property q))

(defn get-matched-commands
  [input]
  (try
    (let [edit-content (or (gobj/get input "value") "")
          pos (cursor/pos input)
          last-slash-caret-pos (:pos (:pos (state/get-editor-action-data)))
          last-command (and last-slash-caret-pos (subs edit-content last-slash-caret-pos pos))]
      (when (> pos 0)
        (or
         (and (= (state/get-editor-command-trigger) (util/nth-safe edit-content (dec pos)))
              @commands/*initial-commands)
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch :default e
      (js/console.error e)
      nil)))

(defn get-matched-block-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (cursor/pos input)
          last-command (subs edit-content
                             (:pos (:pos (state/get-editor-action-data)))
                             pos)]
      (when (> pos 0)
        (or
         (and (= \< (util/nth-safe edit-content (dec pos)))
              (commands/block-commands-map))
         (and last-command
              (commands/get-matched-commands
               last-command
               (commands/block-commands-map))))))
    (catch :default _error
      nil)))

(defn auto-complete?
  []
  (or @*asset-uploading?
      (state/get-editor-action)))

(defn get-current-input-char
  [input]
  (when-let [pos (cursor/pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(defn move-up-down
  [up?]
  (fn [event]
    (util/stop event)
    (let [edit-block-id (:block/uuid (state/get-edit-block))
          move-nodes (fn [blocks]
                       (outliner-tx/transact!
                        {:outliner-op :move-blocks}
                        (save-current-block!)
                        (outliner-core/move-blocks-up-down! blocks up?))
                       (when-let [block-node (util/get-first-block-by-id (:block/uuid (first blocks)))]
                         (.scrollIntoView block-node #js {:behavior "smooth" :block "nearest"})))]
      (if edit-block-id
        (when-let [block (db/pull [:block/uuid edit-block-id])]
          (let [blocks [block]]
            (move-nodes blocks))
          (when-let [input-id (state/get-edit-input-id)]
            (when-let [input (gdom/getElement input-id)]
              (.focus input)
              (js/setTimeout #(util/scroll-editor-cursor input) 100))))
        (let [ids (state/get-selection-block-ids)]
          (when (seq ids)
            (let [lookup-refs (map (fn [id] [:block/uuid id]) ids)
                  blocks (db/pull-many (state/get-current-repo) '[*] lookup-refs)]
              (move-nodes blocks))))))))

(defn get-selected-ordered-blocks
  []
  (let [repo (state/get-current-repo)
        ids (state/get-selection-block-ids)
        lookup-refs (->> (map (fn [id] [:block/uuid id]) ids)
                         (remove nil?))]
    (db/pull-many repo '[*] lookup-refs)))

(defn on-tab
  "`direction` = :left | :right."
  [direction]
  (let [blocks (get-selected-ordered-blocks)]
    (when (seq blocks)
      (outliner-tx/transact!
       {:outliner-op :move-blocks
        :real-outliner-op :indent-outdent}
       (outliner-core/indent-outdent-blocks! blocks (= direction :right))))))

(defn- get-link [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "[%s](%s)" label link)
      :org (util/format "[[%s][%s]]" link label)
      nil)))

(defn- get-image-link
  [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "![%s](%s)" label link)
      :org (util/format "[[%s]]"))))

(defn handle-command-input-close [id]
  (state/set-editor-show-input! nil)
  (when-let [saved-cursor (state/get-editor-last-pos)]
    (when-let [input (gdom/getElement id)]
      (.focus input)
      (cursor/move-cursor-to input saved-cursor))))

(defn handle-command-input [command id format m]
  ;; TODO: Add error handling for when user doesn't provide a required field.
  ;; (The current behavior is to just revert back to the editor.)
  (case command

    :link (let [{:keys [link label]} m]
            (when-not (or (string/blank? link) (string/blank? label))
              (insert-command!
               id
               (get-link format link label)
               format
               {:last-pattern (str (state/get-editor-command-trigger) "link")
                :command :link})))

    :image-link (let [{:keys [link label]} m]
                  (when (not (string/blank? link))
                    (insert-command!
                     id
                     (get-image-link format link label)
                     format
                     {:last-pattern (str (state/get-editor-command-trigger) "link")
                      :command :image-link})))

    nil)

  (handle-command-input-close id))

(defn- close-autocomplete-if-outside
  [input]
  (when (and input
             (contains? #{:page-search :page-search-hashtag :block-search} (state/get-editor-action))
             (not (wrapped-by? input page-ref/left-brackets page-ref/right-brackets))
             (not (wrapped-by? input block-ref/left-parens block-ref/right-parens))
             (not (wrapped-by? input "#" "")))
    (state/clear-editor-action!)))

(defn resize-image!
  [block-id metadata full_text size]
  (let [new-meta (merge metadata size)
        image-part (first (string/split full_text #"\{"))
        new-full-text (str image-part (pr-str new-meta))
        block (db/pull [:block/uuid block-id])
        value (:block/content block)
        new-value (string/replace value full_text new-full-text)]
    (save-block-aux! block new-value {})))

(defn- mark-last-input-time!
  [repo]
  (when repo
    (state/set-editor-last-input-time! repo (util/time-ms))
    (db/clear-repo-persistent-job! repo)))

(defonce *auto-save-timeout (atom nil))
(defn edit-box-on-change!
  [e _block id]
  (let [value (util/evalue e)
        repo (state/get-current-repo)]
    (state/set-edit-content! id value false)
    (when @*auto-save-timeout
      (js/clearTimeout @*auto-save-timeout))
    (mark-last-input-time! repo)
    (reset! *auto-save-timeout
            (js/setTimeout
             (fn []
               (when (state/input-idle? repo :diff 500)
                 (state/set-editor-op! :auto-save)
                 ; don't auto-save for page's properties block
                 (save-current-block! {:skip-properties? true})
                 (state/set-editor-op! nil)))
             500))))

(defn handle-last-input []
  (let [input           (state/get-input)
        pos             (cursor/pos input)
        last-input-char (util/nth-safe (.-value input) (dec pos))
        last-prev-input-char (util/nth-safe (.-value input) (dec (dec pos)))
        prev-prev-input-char (util/nth-safe (.-value input) (- pos 3))]

    ;; TODO: is it cross-browser compatible?
    ;; (not= (gobj/get native-e "inputType") "insertFromPaste")
    (cond
      ;; By default, "/" is also used as namespace separator in Logseq.
      (and (= last-input-char (state/get-editor-command-trigger))
           (not (contains? #{:page-search-hashtag} (state/sub :editor/action))))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (commands/reinit-matched-commands!)
        (state/set-editor-show-commands!))

      (= last-input-char commands/angle-bracket)
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (commands/reinit-matched-block-commands!)
        (state/set-editor-show-block-commands!))

      (and (= last-input-char last-prev-input-char commands/colon)
           (or (nil? prev-prev-input-char)
               (= prev-prev-input-char "\n")))
      (do
        (cursor/move-cursor-backward input 2)
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-action! :property-search))

      (and
       (not= :property-search (state/get-editor-action))
       (let [{:keys [line start-pos]} (text-util/get-current-line-by-pos (.-value input) (dec pos))]
         (text-util/wrapped-by? line (- pos start-pos) "" gp-property/colons)))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-action! :property-search))

      (and (= last-input-char commands/colon) (= :property-search (state/get-editor-action)))
      (state/clear-editor-action!)

      ;; Open "Search page or New page" auto-complete
      (and (= last-input-char commands/hashtag)
           ;; Only trigger at beginning of line or before whitespace
           (or (= 1 pos) (contains? #{" " "\t"} (get (.-value input) (- pos 2)))))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-last-pos! pos)
        (state/set-editor-action! :page-search-hashtag))

      :else
      nil)))

(defn block-on-chosen-handler
  [_input id q format]
  (fn [chosen _click?]
    (state/clear-editor-action!)
    (let [uuid-string (str (:block/uuid chosen))]

      ;; block reference
      (insert-command! id
                       (block-ref/->block-ref uuid-string)
                       format
                       {:last-pattern (str block-ref/left-parens (if @*selected-text "" q))
                        :end-pattern block-ref/right-parens
                        :postfix-fn   (fn [s] (util/replace-first block-ref/right-parens s ""))
                        :forward-pos 3
                        :command :block-ref})

      ;; Save it so it'll be parsed correctly in the future
      (set-block-property! (:block/uuid chosen)
                           :id
                           uuid-string)

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/clear-editor-action!)
    (cursor/move-cursor-forward input 2)))

(defn- paste-block-cleanup
  [block page exclude-properties format content-update-fn keep-uuid?]
  (let [new-content
        (if content-update-fn
          (content-update-fn (:block/content block))
          (:block/content block))
        new-content
        (cond->> new-content
             (not keep-uuid?) (property/remove-property format "id")
             true             (property/remove-property format "custom_id"))]
    (merge (dissoc block
                   :block/pre-block?
                   :block/meta)
           {:block/page {:db/id (:db/id page)}
            :block/format format
            :block/properties (apply dissoc (:block/properties block)
                                (concat
                                  (when (not keep-uuid?) [:id])
                                  [:custom_id :custom-id]
                                  exclude-properties))
            :block/content new-content})))

(defn- edit-last-block-after-inserted!
  [result]
  (js/setTimeout
   (fn []
     (when-let [last-block (last (:blocks result))]
       (clear-when-saved!)
       (let [last-block' (db/pull [:block/uuid (:block/uuid last-block)])]
         (edit-block! last-block' :max (:block/uuid last-block')))))
   0))

(defn- nested-blocks
  [blocks]
  (let [ids (set (map :db/id blocks))]
    (some? (some #(ids (:db/id (:block/parent %))) blocks))))

(defn paste-blocks
  "Given a vec of blocks, insert them into the target page.
   keep-uuid?: if true, keep the uuid provided in the block structure."
  [blocks {:keys [content-update-fn
                  exclude-properties
                  target-block
                  sibling?
                  keep-uuid?]
           :or {exclude-properties []}}]
  (let [editing-block (when-let [editing-block (state/get-edit-block)]
                        (some-> (db/pull (:db/id editing-block))
                                (assoc :block/content (state/get-edit-content))))
        has-unsaved-edits (and editing-block
                               (not= (:block/content (db/pull (:db/id editing-block)))
                                     (state/get-edit-content)))
        target-block (or target-block editing-block)
        block (db/entity (:db/id target-block))
        page (if (:block/name block) block
                 (when target-block (:block/page (db/entity (:db/id target-block)))))
        empty-target? (string/blank? (:block/content target-block))
        paste-nested-blocks? (nested-blocks blocks)
        target-block-has-children? (db/has-children? (:block/uuid target-block))
        replace-empty-target? (if (and paste-nested-blocks? empty-target?
                                       target-block-has-children?)
                                false
                                true)
        target-block' (if replace-empty-target? target-block
                          (db/pull (:db/id (:block/left target-block))))
        sibling? (cond
                   (and paste-nested-blocks? empty-target?)
                   (if (= (:block/parent target-block') (:block/parent target-block))
                     true
                     false)

                   (some? sibling?)
                   sibling?

                   target-block-has-children?
                   false

                   :else
                   true)]

    (when has-unsaved-edits
      (outliner-tx/transact!
        {:outliner-op :save-block}
        (outliner-core/save-block! editing-block)))

    (outliner-tx/transact!
      {:outliner-op :insert-blocks}
      (when target-block'
        (let [format (or (:block/format target-block') (state/get-preferred-format))
              blocks' (map (fn [block]
                             (paste-block-cleanup block page exclude-properties format content-update-fn keep-uuid?))
                           blocks)
              result (outliner-core/insert-blocks! blocks' target-block' {:sibling? sibling?
                                                                          :outliner-op :paste
                                                                          :replace-empty-target? replace-empty-target?
                                                                          :keep-uuid? keep-uuid?})]
          (edit-last-block-after-inserted! result))))))

(defn- block-tree->blocks
  "keep-uuid? - maintain the existing :uuid in tree vec"
  [tree-vec format keep-uuid?]
  (->> (outliner-core/tree-vec-flatten tree-vec)
       (map (fn [block]
              (let [content (:content block)
                    props (into [] (:properties block))
                    content* (str (if (= :markdown format) "- " "* ")
                                  (property/insert-properties format content props))
                    ast (mldoc/->edn content* (gp-mldoc/default-config format))
                    blocks (block/extract-blocks ast content* format {})
                    fst-block (first blocks)
                    fst-block (if (and keep-uuid? (uuid? (:uuid block)))
                                (assoc fst-block :block/uuid (:uuid block))
                                fst-block)]
                (assert fst-block "fst-block shouldn't be nil")
                (assoc fst-block :block/level (:block/level block)))))))

(defn insert-block-tree
  "`tree-vec`: a vector of blocks.
   A block element: {:content :properties :children [block-1, block-2, ...]}"
  [tree-vec format {:keys [target-block keep-uuid?] :as opts}]
  (let [blocks (block-tree->blocks tree-vec format keep-uuid?)
        page-id (:db/id (:block/page target-block))
        blocks (gp-block/with-parent-and-left page-id blocks)
        block-refs (->> (mapcat :block/refs blocks)
                        (set)
                        (filter (fn [ref] (and (vector? ref) (= :block/uuid (first ref))))))]
    (when (seq block-refs)
      (db/transact! (map (fn [[_ id]] {:block/uuid id}) block-refs)))
    (paste-blocks
     blocks
     opts)))

(defn insert-block-tree-after-target
  "`tree-vec`: a vector of blocks.
   A block element: {:content :properties :children [block-1, block-2, ...]}"
  [target-block-id sibling? tree-vec format keep-uuid?]
  (insert-block-tree tree-vec format
                     {:target-block (db/pull target-block-id)
                      :keep-uuid?   keep-uuid?
                      :sibling?     sibling?}))

(defn insert-template!
  ([element-id db-id]
   (insert-template! element-id db-id {}))
  ([element-id db-id {:keys [target] :as opts}]
   (when-let [db-id (if (integer? db-id)
                      db-id
                      (:db/id (db-model/get-template-by-name (name db-id))))]
     (let [journal? (:block/journal? target)
           repo (state/get-current-repo)
           target (or target (state/get-edit-block))
           block (db/entity db-id)
           format (:block/format block)
           block-uuid (:block/uuid block)
           template-including-parent? (not (false? (:template-including-parent (:block/properties block))))
           blocks (db/get-block-and-children repo block-uuid)
           root-block (db/pull db-id)
           blocks-exclude-root (remove (fn [b] (= (:db/id b) db-id)) blocks)
           sorted-blocks (tree/sort-blocks blocks-exclude-root root-block)
           sorted-blocks (cons
                          (-> (first sorted-blocks)
                              (update :block/properties-text-values dissoc :template)
                              (update :block/properties-order (fn [keys]
                                                                (vec (remove #{:template} keys)))))
                          (rest sorted-blocks))
           blocks (if template-including-parent?
                    sorted-blocks
                    (drop 1 sorted-blocks))]
       (when element-id
         (insert-command! element-id "" format {}))
       (let [exclude-properties [:id :template :template-including-parent]
             content-update-fn (fn [content]
                                 (->> content
                                      (property/remove-property format "template")
                                      (property/remove-property format "template-including-parent")
                                      template/resolve-dynamic-template!))
             page (if (:block/name block) block
                      (when target (:block/page (db/entity (:db/id target)))))
             blocks' (map (fn [block]
                            (paste-block-cleanup block page exclude-properties format content-update-fn false))
                          blocks)
             sibling? (:sibling? opts)
             sibling?' (cond
                         (some? sibling?)
                         sibling?

                         (db/has-children? (:block/uuid target))
                         false

                         :else
                         true)]
         (outliner-tx/transact!
           {:outliner-op :insert-blocks
            :created-from-journal-template? journal?}
           (save-current-block!)
           (let [result (outliner-core/insert-blocks! blocks'
                                                      target
                                                      (assoc opts
                                                             :sibling? sibling?'))]
             (edit-last-block-after-inserted! result))))))))

(defn template-on-chosen-handler
  [element-id]
  (fn [[_template db-id] _click?]
    (insert-template! element-id db-id
                      {:replace-empty-target? true})))

(defn get-searching-property
  [input]
  (let [value (.-value input)
        pos (util/get-selection-start input)
        postfix (subs value pos)
        end-index (when-let [idx (string/index-of postfix gp-property/colons)]
                    (+ (max 0 (count (subs value 0 pos))) idx))
        start-index (or (when-let [p (string/last-index-of (subs value 0 pos) "\n")]
                          (inc p))
                        0)]
    {:end-index end-index
     :searching-property (when (and start-index end-index (>= end-index start-index))
                           (subs value start-index end-index))}))

(defn property-on-chosen-handler
  [element-id q]
  (fn [property]
    (when-let [input (gdom/getElement element-id)]
      (let [{:keys [end-index searching-property]} (get-searching-property input)]
        (cursor/move-cursor-to input (+ end-index 2))
        (commands/insert! element-id (str (or property q) gp-property/colons " ")
                          {:last-pattern (str searching-property gp-property/colons)})
        (state/clear-editor-action!)
        (js/setTimeout (fn []
                         (let [pos (let [input (gdom/getElement element-id)]
                                     (cursor/get-caret-pos input))]
                           (state/set-editor-action-data! {:property (or property q)
                                                           :pos pos})
                           (state/set-editor-action! :property-value-search)))
                       50)))))

(defn property-value-on-chosen-handler
  [element-id q]
  (fn [property-value]
    (commands/insert! element-id (str gp-property/colons " " (or property-value q))
                      {:last-pattern (str gp-property/colons " " q)})
    (state/clear-editor-action!)))

(defn parent-is-page?
  [{{:block/keys [parent page]} :data :as node}]
  {:pre [(tree/satisfied-inode? node)]}
  (= parent page))

(defn outdent-on-enter
  [node]
  (when-not (parent-is-page? node)
    (let [parent-node (tree/-get-parent node)]
      (outliner-tx/transact!
       {:outliner-op :move-blocks
        :real-outliner-op :indent-outdent}
       (save-current-block!)
       (outliner-core/move-blocks! [(:data node)] (:data parent-node) true)))))

(defn- last-top-level-child?
  [{:keys [id]} current-node]
  (when id
    (when-let [entity (if-let [id' (parse-uuid (str id))]
                        (db/entity [:block/uuid id'])
                        (db/entity [:block/name (util/page-name-sanity-lc id)]))]
      (= (:block/uuid entity) (tree/-get-parent-id current-node)))))

(defn insert
  ([insertion]
   (insert insertion false))
  ([insertion auto-complete-enabled?]
   (when (or auto-complete-enabled?
             (not (auto-complete?)))
     (let [^js input (state/get-input)
           selected-start (util/get-selection-start input)
           selected-end (util/get-selection-end input)
           value (.-value input)
           s1 (subs value 0 selected-start)
           s2 (subs value selected-end)]
       (state/set-edit-content! (state/get-edit-input-id)
                                (str s1 insertion s2))
       (cursor/move-cursor-to input (+ selected-start (count insertion)))))))

(defn- keydown-new-line
  []
  (insert "\n"))

(declare delete-and-update)

(defn- dwim-in-properties
  [state]
  (when-not (auto-complete?)
    (let [{:keys [block]} (get-state)]
      (when block
        (let [input (state/get-input)
              content (gobj/get input "value")
              format (:block/format (:block (get-state)))
              property-key (:raw-content (thingatpt/property-key-at-point input))
              org? (= format :org)
              move-to-pos (if org? 2 3)]
          (if org?
            (cond
              (and property-key (not= property-key ""))
              (case property-key
                ;; When cursor in "PROPERTIES", add :|: in a new line and move cursor to |
                "PROPERTIES"
                (do (cursor/move-cursor-to-line-end input)
                    (insert "\n:: ")
                    (cursor/move-cursor-backward input move-to-pos))
                ;; When cursor in "END", new block (respect the previous enter behavior)
                "END"
                (do
                  (cursor/move-cursor-to-end input)
                  (save-current-block!)
                  (insert-new-block! state))
                ;; cursor in other positions of :ke|y: or ke|y::, move to line end for inserting value.
                (if (property/property-key-exist? format content property-key)
                  (notification/show!
                   [:p.content
                    (util/format "Property key \"%s\" already exists!" property-key)]
                   :error)
                  (cursor/move-cursor-to-line-end input)))

              ;; when cursor in empty property key
              (and property-key (= property-key ""))
              (do (delete-and-update
                   input
                   (cursor/line-beginning-pos input)
                   (inc (cursor/line-end-pos input)))
                  (property/goto-properties-end format input)
                  (cursor/move-cursor-to-line-end input))
              :else
              ;;When cursor in other place of PROPERTIES drawer, add :|: in a new line and move cursor to |
              (do
                (insert "\n:: ")
                (cursor/move-cursor-backward input move-to-pos)))
            (insert "\n")))))))

(defn toggle-list-checkbox
  [{:block/keys [content] :as block} old-item-content new-item-content]
  (let [new-content (string/replace-first content old-item-content new-item-content)]
    (save-block-if-changed! block new-content)))

(defn- dwim-in-list
  []
  (when-not (auto-complete?)
    (let [{:keys [block]} (get-state)]
      (when block
        (let [input (state/get-input)]
          (when-let [item (thingatpt/list-item-at-point input)]
            (let [{:keys [full-content indent bullet checkbox ordered _]} item
                  next-bullet (if ordered (str (inc bullet) ".") bullet)
                  checkbox (when checkbox "[ ] ")]
              (if (and
                   (= (count full-content)
                      (+ (if ordered (+ (count (str bullet)) 2) 2) (when checkbox (count checkbox))))
                   (string/includes? (.-value input) "\n"))
                (delete-and-update input (cursor/line-beginning-pos input) (cursor/line-end-pos input))
                (let [start-pos (util/get-selection-start input)
                      value (.-value input)
                      before (subs value 0 start-pos)
                      after (subs value start-pos)
                      cursor-in-item-content? (and (re-find #"^(\d+){1}\." (last (string/split-lines before)))
                                                   (not (string/blank? (first (string/split-lines after)))))]
                  (when-not cursor-in-item-content?
                    (cursor/move-cursor-to-line-end input)
                    (insert (str "\n" indent next-bullet " " checkbox)))
                  (when ordered
                    (let [value (.-value input)
                          start-pos (util/get-selection-start input)
                          after-lists-str (string/trim (subs value start-pos))
                          after-lists-str (if cursor-in-item-content?
                                            (str indent next-bullet " " after-lists-str)
                                            after-lists-str)
                          lines (string/split-lines after-lists-str)
                          after-lists-str' (list/re-order-items lines (if cursor-in-item-content? bullet (inc bullet)))
                          value' (str (subs value 0 start-pos) "\n" after-lists-str')
                          cursor' (if cursor-in-item-content?
                                    (inc (count (str (subs value 0 start-pos) indent next-bullet " ")))
                                    (+ (:end item) (count next-bullet) 2))]
                      (state/set-edit-content! (state/get-edit-input-id) value')
                      (cursor/move-cursor-to input cursor'))))))))))))

(defn toggle-page-reference-embed
  [parent-id]
  (let [{:keys [block]} (get-state)]
    (when block
      (let [input (state/get-input)
            new-pos (cursor/get-caret-pos input)
            page-ref-fn (fn [bounds backward-pos]
                          (commands/simple-insert!
                           parent-id bounds
                           {:backward-pos backward-pos
                            :check-fn (fn [_ _ _]
                                        (state/set-editor-action-data! {:pos new-pos})
                                        (commands/handle-step [:editor/search-page]))}))]
        (state/clear-editor-action!)
        (let [selection (get-selection-and-format)
              {:keys [selection-start selection-end selection]} selection]
          (if selection
            (do (delete-and-update input selection-start selection-end)
                (insert (page-ref/->page-ref selection)))
            (if-let [embed-ref (thingatpt/embed-macro-at-point input)]
              (let [{:keys [raw-content start end]} embed-ref]
                (delete-and-update input start end)
                (if (= 5 (count raw-content))
                  (page-ref-fn page-ref/left-and-right-brackets 2)
                  (insert raw-content)))
              (if-let [page-ref (thingatpt/page-ref-at-point input)]
                (let [{:keys [start end full-content raw-content]} page-ref]
                  (delete-and-update input start end)
                  (if (= raw-content "")
                    (page-ref-fn "{{embed [[]]}}" 4)
                    (insert (util/format "{{embed %s}}" full-content))))
                (page-ref-fn page-ref/left-and-right-brackets 2)))))))))

(defn toggle-block-reference-embed
  [parent-id]
  (let [{:keys [block]} (get-state)]
    (when block
      (let [input (state/get-input)
            new-pos (cursor/get-caret-pos input)
            block-ref-fn (fn [bounds backward-pos]
                           (commands/simple-insert!
                            parent-id bounds
                            {:backward-pos backward-pos
                             :check-fn     (fn [_ _ _]
                                             (state/set-editor-action-data! {:pos new-pos})
                                             (commands/handle-step [:editor/search-block]))}))]
        (state/clear-editor-action!)
        (if-let [embed-ref (thingatpt/embed-macro-at-point input)]
          (let [{:keys [raw-content start end]} embed-ref]
            (delete-and-update input start end)
            (if (= 5 (count raw-content))
              (block-ref-fn block-ref/left-and-right-parens 2)
              (insert raw-content)))
          (if-let [page-ref (thingatpt/block-ref-at-point input)]
            (let [{:keys [start end full-content raw-content]} page-ref]
              (delete-and-update input start end)
              (if (= raw-content "")
                (block-ref-fn "{{embed (())}}" 4)
                (insert (util/format "{{embed %s}}" full-content))))
            (block-ref-fn block-ref/left-and-right-parens 2)))))))

(defn- keydown-new-block
  [state]
  (when-not (auto-complete?)
    (let [{:keys [block config]} (get-state)]
      (when block
        (let [input (state/get-input)
              content (gobj/get input "value")
              pos (cursor/pos input)
              current-node (outliner-core/block block)
              has-right? (-> (tree/-get-right current-node)
                             (tree/satisfied-inode?))
              thing-at-point ;intern is not supported in cljs, need a more elegant solution
              (or (when (thingatpt/get-setting :admonition&src?)
                    (thingatpt/admonition&src-at-point input))
                  (when (thingatpt/get-setting :markup?)
                    (thingatpt/markup-at-point input))
                  (when (thingatpt/get-setting :block-ref?)
                    (thingatpt/block-ref-at-point input))
                  (when (thingatpt/get-setting :page-ref?)
                    (thingatpt/page-ref-at-point input))
                  (when (thingatpt/get-setting :properties?)
                    (thingatpt/properties-at-point input))
                  (when (thingatpt/get-setting :list?)
                    (and (not (cursor/beginning-of-line? input))
                         (thingatpt/list-item-at-point input))))]
          (cond
            thing-at-point
            (case (:type thing-at-point)
              "markup" (let [right-bound (:bounds thing-at-point)]
                         (cursor/move-cursor-to
                          input
                          (+ (string/index-of content right-bound pos)
                             (count right-bound))))
              "admonition-block" (keydown-new-line)
              "source-block" (do
                               (keydown-new-line)
                               (case (:action thing-at-point)
                                 :into-code-editor
                                 (state/into-code-editor-mode!)
                                 nil))
              "block-ref" (open-block-in-sidebar! (:link thing-at-point))
              "page-ref" (when-not (string/blank? (:link thing-at-point))
                           (let [page (:link thing-at-point)
                                 page-name (db-model/get-redirect-page-name page)]
                             (insert-first-page-block-if-not-exists! page-name)))
              "list-item" (dwim-in-list)
              "properties-drawer" (dwim-in-properties state))

            (and
             (string/blank? content)
             (not has-right?)
             (not (last-top-level-child? config current-node)))
            (outdent-on-enter current-node)

            :else
            (profile
             "Insert block"
             (do (save-current-block!)
                 (insert-new-block! state)))))))))

(defn- inside-of-single-block
  "When we are in a single block wrapper, we should always insert a new line instead of new block"
  [el]
  (some? (dom/closest el ".single-block")))

(defn keydown-new-block-handler [state e]
  (if (or (state/doc-mode-enter-for-new-line?) (inside-of-single-block (rum/dom-node state)))
    (keydown-new-line)
    (do
      (.preventDefault e)
      (keydown-new-block state))))

(defn keydown-new-line-handler [state e]
  (if (and (state/doc-mode-enter-for-new-line?) (not (inside-of-single-block (rum/dom-node state))))
    (keydown-new-block state)
    (do
      (.preventDefault e)
      (keydown-new-line))))

(defn- scroll-to-block
  [block]
  (when block
    (when-not (util/element-visible? block)
      (.scrollIntoView block #js {:behavior "smooth"
                                  :block "center"}))))

(defn- select-first-last
  "Select first or last block in viewpoint"
  [direction]
  (let [f (case direction :up last :down first)
        block (->> (util/get-blocks-noncollapse)
                   (f))]
    (when block
      (scroll-to-block block)
      (state/exit-editing-and-set-selected-blocks! [block]))))

(defn- select-up-down [direction]
  (let [selected-blocks (state/get-selection-blocks)
        selected (case direction
                   :up (first selected-blocks)
                   :down (last selected-blocks))
        f (case direction
            :up util/get-prev-block-non-collapsed
            :down util/get-next-block-non-collapsed)
        sibling-block (f selected)]
    (when (and sibling-block (dom/attr sibling-block "blockid"))
      (scroll-to-block sibling-block)
      (state/exit-editing-and-set-selected-blocks! [sibling-block]))))

(defn- move-cross-boundary-up-down
  [direction]
  (let [input (state/get-input)
        line-pos (util/get-first-or-last-line-pos input)
        repo (state/get-current-repo)
        f (case direction
            :up util/get-prev-block-non-collapsed
            :down util/get-next-block-non-collapsed)
        sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))
        {:block/keys [uuid content format]} (state/get-edit-block)]
    (when sibling-block
      (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
        (let [value (state/get-edit-content)]
          (when (not= (clean-content! format content)
                      (string/trim value))
            (save-block! repo uuid value)))

        (let [new-id (string/replace (gobj/get sibling-block "id") "ls-block" "edit-block")
              new-uuid (cljs.core/uuid sibling-block-id)
              block (db/pull repo '[*] [:block/uuid new-uuid])]
          (edit-block! block
                       [direction line-pos]
                       new-id))))))

(defn keydown-up-down-handler
  [direction]
  (let [input (state/get-input)
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)
        up? (= direction :up)
        down? (= direction :down)]
    (cond
      (not= selected-start selected-end)
      (if up?
        (cursor/move-cursor-to input selected-start)
        (cursor/move-cursor-to input selected-end))

      (or (and up? (cursor/textarea-cursor-first-row? input))
          (and down? (cursor/textarea-cursor-last-row? input)))
      (move-cross-boundary-up-down direction)

      :else
      (if up?
        (cursor/move-cursor-up input)
        (cursor/move-cursor-down input)))))

(defn- move-to-block-when-cross-boundary
  [direction]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:block/keys [format uuid] :as block} (state/get-edit-block)
        id (state/get-edit-input-id)
        repo (state/get-current-repo)
        f (if up? util/get-prev-block-non-collapsed util/get-next-block-non-collapsed)
        sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))]
    (when sibling-block
      (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
        (let [content (:block/content block)
              value (state/get-edit-content)]
          (when (not= (clean-content! format content)
                      (string/trim value))
            (save-block! repo uuid value)))
        (let [block (db/pull repo '[*] [:block/uuid (cljs.core/uuid sibling-block-id)])]
          (edit-block! block pos id))))))

(defn keydown-arrow-handler
  [direction]
  (let [input (state/get-input)
        element js/document.activeElement
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)
        left? (= direction :left)
        right? (= direction :right)]
    (when (= input element)
      (cond
        (not= selected-start selected-end)
        (if left?
          (cursor/move-cursor-to input selected-start)
          (cursor/move-cursor-to input selected-end))

        (or (and left? (cursor/start? input))
            (and right? (cursor/end? input)))
        (move-to-block-when-cross-boundary direction)

        :else
        (if left?
          (cursor/move-cursor-backward input)
          (cursor/move-cursor-forward input))))))

(defn- delete-and-update [^js input start end]
  (util/safe-set-range-text! input "" start end)
  (state/set-edit-content! (state/get-edit-input-id) (.-value input)))

(defn- delete-concat [current-block]
  (let [input-id (state/get-edit-input-id)
        ^js input (state/get-input)
        current-pos (cursor/pos input)
        value (gobj/get input "value")
        right (outliner-core/get-right-node (outliner-core/block current-block))
        current-block-has-children? (db/has-children? (:block/uuid current-block))
        collapsed? (util/collapsed? current-block)
        first-child (:data (tree/-get-down (outliner-core/block current-block)))
        next-block (if (or collapsed? (not current-block-has-children?))
                     (:data right)
                     first-child)]
    (cond
      (and collapsed? right (db/has-children? (tree/-get-id right)))
      nil

      (and (not collapsed?) first-child (db/has-children? (:block/uuid first-child)))
      nil

      :else
      (do
        (delete-block-aux! next-block false)
        (state/set-edit-content! input-id (str value "" (:block/content next-block)))
        (cursor/move-cursor-to input current-pos)))))

(defn keydown-delete-handler
  [_e]
  (let [^js input (state/get-input)
        current-pos (cursor/pos input)
        value (gobj/get input "value")
        end? (= current-pos (count value))
        current-block (state/get-edit-block)
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)]
    (when current-block
      (cond
        (not= selected-start selected-end)
        (delete-and-update input selected-start selected-end)

        (and end? current-block)
        (delete-concat current-block)

        :else
        (delete-and-update input current-pos (inc current-pos))))))

(defn keydown-backspace-handler
  [cut? e]
  (let [^js input (state/get-input)
        id (state/get-edit-input-id)
        current-pos (cursor/pos input)
        value (gobj/get input "value")
        deleted (and (> current-pos 0)
                     (util/nth-safe value (dec current-pos)))
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)
        block (state/get-edit-block)
        repo (state/get-current-repo)
        top-block? (= (:block/left block) (:block/page block))
        single-block? (inside-of-single-block (.-target e))
        root-block? (= (:block/container block) (str (:block/uuid block)))]
    (mark-last-input-time! repo)
    (cond
      (not= selected-start selected-end)
      (do
        (util/stop e)
        (when cut?
          (js/document.execCommand "copy"))
        (delete-and-update input selected-start selected-end))

      (zero? current-pos)
      (do
        (util/stop e)
        (when (and (if top-block? (string/blank? value) true)
                   (not root-block?)
                   (not single-block?))
          (delete-block! repo false)))

      (and (> current-pos 1)
           (= (util/nth-safe value (dec current-pos)) (state/get-editor-command-trigger)))
      (do
        (util/stop e)
        (commands/restore-state)
        (delete-and-update input (dec current-pos) current-pos))

      (and (> current-pos 1)
           (= (util/nth-safe value (dec current-pos)) commands/angle-bracket))
      (do
        (util/stop e)
        (commands/restore-state)
        (delete-and-update input (dec current-pos) current-pos))

      ;; pair
      (and
       deleted
       (contains?
        (set (keys delete-map))
        deleted)
       (>= (count value) (inc current-pos))
       (= (util/nth-safe value current-pos)
          (get delete-map deleted)))

      (do
        (util/stop e)
        (commands/delete-pair! id)
        (cond
          (and (= deleted "[") (state/get-editor-show-page-search?))
          (state/clear-editor-action!)

          (and (= deleted "(") (state/get-editor-show-block-search?))
          (state/clear-editor-action!)

          :else
          nil))

      ;; deleting hashtag
      (and (= deleted "#") (state/get-editor-show-page-search-hashtag?))
      (do
        (state/clear-editor-action!)
        (delete-and-update input (dec current-pos) current-pos))

      ;; just delete
      :else
      (when-not (mobile-util/native-ios?)
        (util/stop e)
        (delete-and-update
         input (util/safe-dec-current-pos-from-end (.-value input) current-pos) current-pos)))))

(defn indent-outdent
  [indent?]
  (state/set-editor-op! :indent-outdent)
  (let [pos (some-> (state/get-input) cursor/pos)
        {:keys [block]} (get-state)]
    (when block
      (state/set-editor-last-pos! pos)
      (outliner-tx/transact!
       {:outliner-op :move-blocks
        :real-outliner-op :indent-outdent}
       (save-current-block!)
       (outliner-core/indent-outdent-blocks! [block] indent?)))
    (state/set-editor-op! :nil)))

(defn keydown-tab-handler
  [direction]
  (fn [e]
    (cond
      (state/editing?)
      (when-not (state/get-editor-action)
        (util/stop e)
        (indent-outdent (not (= :left direction))))

      (state/selection?)
      (do
        (util/stop e)
        (on-tab direction)))
    nil))

(defn ^:large-vars/cleanup-todo keydown-not-matched-handler
  "NOTE: Keydown cannot be used on Android platform"
  [format]
  (fn [e _key-code]
    (let [input-id (state/get-edit-input-id)
          input (state/get-input)
          key (gobj/get e "key")
          value (gobj/get input "value")
          ctrlKey (gobj/get e "ctrlKey")
          metaKey (gobj/get e "metaKey")
          pos (cursor/pos input)
          hashtag? (or (surround-by? input "#" " ")
                       (surround-by? input "#" :end)
                       (= key "#"))]
      (cond
        (and (contains? #{"ArrowLeft" "ArrowRight"} key)
             (contains? #{:property-search :property-value-search} (state/get-editor-action)))
        (state/clear-editor-action!)

        (and (util/event-is-composing? e true) ;; #3218
             (not hashtag?) ;; #3283 @Rime
             (not (state/get-editor-show-page-search-hashtag?))) ;; #3283 @MacOS pinyin
        nil

        (or ctrlKey metaKey)
        nil

        ;; FIXME: On mobile, a backspace click to call keydown-backspace-handler
        ;; does not work if cursor is at the beginning of a block, hence the block
        ;; can't be deleted. Need to figure out why and find a better solution.
        (and (mobile-util/native-platform?)
             (= key "Backspace")
             (zero? pos))
        (do
          (util/stop e)
          (let [block (state/get-edit-block)
                top-block? (= (:block/left block) (:block/page block))
                root-block? (= (:block/container block) (str (:block/uuid block)))
                repo (state/get-current-repo)]
            (when (and (if top-block? (string/blank? value) true)
                       (not root-block?))
              (delete-block! repo false))))

        (and (= key "#")
             (and (> pos 0)
                  (= "#" (util/nth-safe value (dec pos)))))
        (state/clear-editor-action!)

        (and (contains? (set/difference (set (keys reversed-autopair-map))
                                        #{"`"})
                        key)
             (= (get-current-input-char input) key))
        (do (util/stop e)
            (cursor/move-cursor-forward input))

        (and (autopair-when-selected key) (string/blank? (util/get-selected-text)))
        nil

        (and (not (string/blank? (util/get-selected-text)))
             (contains? keycode/left-square-brackets-keys key))
        (do (autopair input-id "[" format nil)
            (util/stop e))

        (and (not (string/blank? (util/get-selected-text)))
             (contains? keycode/left-paren-keys key))
        (do (util/stop e)
            (autopair input-id "(" format nil))

        ;; If you type `xyz`, the last backtick should close the first and not add another autopair
        ;; If you type several backticks in a row, each one should autopair to accommodate multiline code (```)
        (-> (keys autopair-map)
            set
            (disj "(")
            (contains? key)
            (or (autopair-left-paren? input key)))
        (let [curr (get-current-input-char input)
                  prev (util/nth-safe value (dec pos))]
            (util/stop e)
            (if (and (= key "`") (= "`" curr) (not= "`" prev))
              (cursor/move-cursor-forward input)
              (autopair input-id key format nil)))

        (let [sym "$"]
          (and (= key sym)
               (>= (count value) 1)
               (> pos 0)
               (= (nth value (dec pos)) sym)
               (if (> (count value) pos)
                 (not= (nth value pos) sym)
                 true)))
        (commands/simple-insert! input-id "$$" {:backward-pos 2})

        (let [sym "^"]
          (and (= key sym)
               (>= (count value) 1)
               (> pos 0)
               (= (nth value (dec pos)) sym)
               (if (> (count value) pos)
                 (not= (nth value pos) sym)
                 true)))
        (commands/simple-insert! input-id "^^" {:backward-pos 2})

        :else
        nil))))

(defn ^:large-vars/cleanup-todo keyup-handler
  [_state input input-id]
  (fn [e key-code]
    (when-not (util/event-is-composing? e)
      (let [current-pos (cursor/pos input)
            value (gobj/get input "value")
            c (util/nth-safe value (dec current-pos))
            [key-code k code is-processed?]
            (if (and c
                     (mobile-util/native-android?)
                     (or (= key-code 229)
                         (= key-code 0)))
              [(.charCodeAt value (dec current-pos))
               c
               (cond
                 (= c " ")
                 "Space"

                 (parse-long c)
                 (str "Digit" c)

                 :else
                 (str "Key" (string/upper-case c)))
               false]
              [key-code
               (gobj/get e "key")
               (if (mobile-util/native-android?)
                 (gobj/get e "key")
                 (gobj/getValueByKeys e "event_" "code"))
               (util/event-is-composing? e true)]) ;; #3440
            format (:format (get-state))
            last-key-code (state/get-last-key-code)
            blank-selected? (string/blank? (util/get-selected-text))
            non-enter-processed? (and is-processed? ;; #3251
                                      (not= code keycode/enter-code))  ;; #3459
            editor-action (state/get-editor-action)]
        (cond
          ;; When you type something after /
          (and (= :commands (state/get-editor-action)) (not= k (state/get-editor-command-trigger)))
          (let [matched-commands (get-matched-commands input)]
            (if (seq matched-commands)
              (reset! commands/*matched-commands matched-commands)
              (state/clear-editor-action!)))

          ;; When you type search text after < (and when you release shift after typing <)
          (and (= :block-commands editor-action) (not= key-code 188)) ; not <
          (let [matched-block-commands (get-matched-block-commands input)]
            (if (seq matched-block-commands)
              (cond
                (= key-code 9)          ;tab
                (do
                  (util/stop e)
                  (insert-command! input-id
                                   (last (first matched-block-commands))
                                   format
                                   {:last-pattern commands/angle-bracket
                                    :command :block-commands}))

                :else
                (reset! commands/*matched-block-commands matched-block-commands))
              (state/clear-editor-action!)))

          ;; When you type two spaces after a command character (may always just be handled by the above instead?)
          (and (contains? #{:commands :block-commands} (state/get-editor-action))
               (= c (util/nth-safe value (dec (dec current-pos))) " "))
          (state/clear-editor-action!)

          ;; When you type a space after a #
          (and (state/get-editor-show-page-search-hashtag?)
               (= c " "))
          (state/clear-editor-action!)

          :else
          (when (and (not editor-action) (not non-enter-processed?))
            (cond
              ;; When you type text inside square brackets
              (and (not (contains? #{"ArrowDown" "ArrowLeft" "ArrowRight" "ArrowUp" "Escape"} k))
                   (wrapped-by? input page-ref/left-brackets page-ref/right-brackets))
              (let [orig-pos (cursor/get-caret-pos input)
                    value (gobj/get input "value")
                    square-pos (string/last-index-of (subs value 0 (:pos orig-pos)) page-ref/left-brackets)
                    pos (+ square-pos 2)
                    _ (state/set-editor-last-pos! pos)
                    pos (assoc orig-pos :pos pos)
                    command-step (if (= \# (util/nth-safe value (dec square-pos)))
                                   :editor/search-page-hashtag
                                   :editor/search-page)]
                (commands/handle-step [command-step])
                (state/set-editor-action-data! {:pos pos}))

              ;; Handle non-ascii square brackets
              (and blank-selected?
                   (contains? keycode/left-square-brackets-keys k)
                   (= (:key last-key-code) k)
                   (> current-pos 0)
                   (not (wrapped-by? input page-ref/left-brackets page-ref/right-brackets)))
              (do
                (commands/handle-step [:editor/input page-ref/left-and-right-brackets {:backward-truncate-number 2
                                                             :backward-pos 2}])
                (commands/handle-step [:editor/search-page])
                (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)}))

              ;; Handle non-ascii parentheses
              (and blank-selected?
                   (contains? keycode/left-paren-keys k)
                   (= (:key last-key-code) k)
                   (> current-pos 0)
                   (not (wrapped-by? input block-ref/left-parens block-ref/right-parens)))
              (do
                (commands/handle-step [:editor/input block-ref/left-and-right-parens {:backward-truncate-number 2
                                                             :backward-pos 2}])
                (commands/handle-step [:editor/search-block :reference])
                (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)}))

              ;; Handle non-ascii angle brackets
              (and (= "〈" c)
                   (= "《" (util/nth-safe value (dec (dec current-pos))))
                   (> current-pos 0))
              (do
                (commands/handle-step [:editor/input commands/angle-bracket {:last-pattern "《〈"
                                                                             :backward-pos 0}])
                (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
                (state/set-editor-show-block-commands!))

              :else
              nil)))

        (close-autocomplete-if-outside input)

        (when-not (or (= k "Shift") is-processed?)
          (state/set-last-key-code! {:key-code key-code
                                     :code code
                                     :key k
                                     :shift? (.-shiftKey e)}))))))

(defn editor-on-click!
  [id]
  (fn [_e]
    (let [input (gdom/getElement id)]
      (util/scroll-editor-cursor input)
      (close-autocomplete-if-outside input))))

(defn editor-on-change!
  [block id search-timeout]
  (fn [e]
    (if (= :block-search (state/sub :editor/action))
      (let [timeout 300]
        (when @search-timeout
          (js/clearTimeout @search-timeout))
        (reset! search-timeout
                (js/setTimeout
                 #(edit-box-on-change! e block id)
                 timeout)))
      (let [input (gdom/getElement id)]
        (edit-box-on-change! e block id)
        (util/scroll-editor-cursor input)))))

(defn- cut-blocks-and-clear-selections!
  [copy?]
  (when-not (get-in @state/state [:ui/find-in-page :active?])
    (cut-selection-blocks copy?)
    (clear-selection!)))

(defn shortcut-copy-selection
  [_e]
  (copy-selection-blocks true))

(defn shortcut-cut-selection
  [e]
  (util/stop e)
  (cut-blocks-and-clear-selections! true))

(defn shortcut-delete-selection
  [e]
  (util/stop e)
  (cut-blocks-and-clear-selections! false))

(defn- copy-current-block-ref
  [format]
  (when-let [current-block (state/get-edit-block)]
    (when-let [block-id (:block/uuid current-block)]
      (if (= format "embed")
       (copy-block-ref! block-id #(str "{{embed ((" % "))}}"))
       (copy-block-ref! block-id block-ref/->block-ref))
      (notification/show!
       [:div
        [:span.mb-1.5 (str "Block " format " copied!")]
        [:div [:code.whitespace.break-all (if (= format "embed")
                                         (str "{{embed ((" block-id "))}}")
                                         (block-ref/->block-ref block-id))]]]
       :success true
       ;; use uuid to make sure there is only one toast a time
       (str "copied-block-ref:" block-id)))))

(defn copy-current-block-embed []
  (copy-current-block-ref "embed"))

(defn shortcut-copy
  "shortcut copy action:
  * when in selection mode, copy selected blocks
  * when in edit mode but no text selected, copy current block ref
  * when in edit mode with text selected, copy selected text as normal"
  [e]
  (when-not (auto-complete?)
    (cond
      (state/selection?)
      (shortcut-copy-selection e)

      (state/editing?)
      (let [input (state/get-input)
            selected-start (util/get-selection-start input)
            selected-end (util/get-selection-end input)]
        (if (= selected-start selected-end)
          (copy-current-block-ref "ref")
          (js/document.execCommand "copy")))

      :else
      (js/document.execCommand "copy"))))

(defn shortcut-copy-text
  "shortcut copy action:
  * when in selection mode, copy selected blocks
  * when in edit mode with text selected, copy selected text as normal"
  [_e]
  (when-not (auto-complete?)
    (cond
      (state/selection?)
      (copy-selection-blocks false)

      :else
      (js/document.execCommand "copy"))))

(defn shortcut-cut
  "shortcut cut action:
  * when in selection mode, cut selected blocks
  * when in edit mode with text selected, cut selected text
  * otherwise nothing need to be handled."
  [e]
  (cond
    (state/selection?)
    (shortcut-cut-selection e)

    (and (state/editing?) (util/input-text-selected?
                           (gdom/getElement (state/get-edit-input-id))))
    (keydown-backspace-handler true e)

    :else
    nil))

(defn delete-selection
  [e]
  (when (state/selection?)
    (shortcut-delete-selection e)))

(defn editor-delete
  [_state e]
  (when (state/editing?)
    (util/stop e)
    (keydown-delete-handler e)))

(defn editor-backspace
  [_state e]
  (when (state/editing?)
    (keydown-backspace-handler false e)))

(defn- slide-focused?
  []
  (some-> (first (dom/by-class "reveal"))
          (dom/has-class? "focused")))

(defn shortcut-up-down [direction]
  (fn [e]
    (when (and (not (auto-complete?))
               (not (slide-focused?)))
      (util/stop e)
      (cond
        (state/editing?)
        (keydown-up-down-handler direction)

        (state/selection?)
        (select-up-down direction)

        ;; if there is an edit-input-id set, we are probably still on editing mode, that is not fully initialized
        (not (state/get-edit-input-id))
        (select-first-last direction)))
    nil))

(defn shortcut-select-up-down [direction]
  (fn [e]
    (util/stop e)
    (if (state/editing?)
      (let [input (state/get-input)
            selected-start (util/get-selection-start input)
            selected-end (util/get-selection-end input)
            [anchor cursor] (case (util/get-selection-direction input)
                              "backward" [selected-end selected-start]
                              [selected-start selected-end])
            cursor-rect (cursor/get-caret-pos input cursor)]
        (if
          ;; if the move is to cross block boundary, select the whole block
         (or (and (= direction :up) (cursor/textarea-cursor-rect-first-row? cursor-rect))
             (and (= direction :down) (cursor/textarea-cursor-rect-last-row? cursor-rect)))
          (select-block-up-down direction)
          ;; simulate text selection
          (cursor/select-up-down input direction anchor cursor-rect)))
      (select-block-up-down direction))))

(defn open-selected-block!
  [direction e]
  (let [selected-blocks (state/get-selection-blocks)
        f (case direction
            :left first
            :right last)]
    (when-let [block-id (some-> selected-blocks
                                f
                                (dom/attr "blockid")
                                uuid)]
      (util/stop e)
      (let [block    {:block/uuid block-id}
            block-id (-> selected-blocks
                         f
                         (gobj/get "id")
                         (string/replace "ls-block" "edit-block"))
            left?    (= direction :left)]
        (edit-block! block
                    (if left? 0 :max)
                    block-id)))))

(defn shortcut-left-right [direction]
  (fn [e]
    (when-not (auto-complete?)
      (cond
        (state/editing?)
        (do
          (util/stop e)
          (keydown-arrow-handler direction))

        (state/selection?)
        (do
          (util/stop e)
          (open-selected-block! direction e))

        :else
        nil))))

(defn clear-block-content! []
  (save-current-block! {:force? true})
  (state/set-edit-content! (state/get-edit-input-id) ""))

(defn kill-line-before! []
  (save-current-block! {:force? true})
  (util/kill-line-before! (state/get-input)))

(defn kill-line-after! []
  (save-current-block! {:force? true})
  (util/kill-line-after! (state/get-input)))

(defn beginning-of-block []
  (cursor/move-cursor-to (state/get-input) 0))

(defn end-of-block []
  (cursor/move-cursor-to-end (state/get-input)))

(defn cursor-forward-word []
  (cursor/move-cursor-forward-by-word (state/get-input)))

(defn cursor-backward-word []
  (cursor/move-cursor-backward-by-word (state/get-input)))

(defn backward-kill-word []
  (let [input (state/get-input)]
    (save-current-block! {:force? true})
    (util/backward-kill-word input)
    (state/set-edit-content! (state/get-edit-input-id) (.-value input))))

(defn forward-kill-word []
  (let [input (state/get-input)]
    (save-current-block! {:force? true})
    (util/forward-kill-word input)
    (state/set-edit-content! (state/get-edit-input-id) (.-value input))))



(defn block-with-title?
  [format content semantic?]
  (and (string/includes? content "\n")
       (if semantic?
         (let [ast (mldoc/->edn content (gp-mldoc/default-config format))
               first-elem-type (first (ffirst ast))]
           (mldoc/block-with-title? first-elem-type))
         true)))

(defn collapsable?
  ([block-id]
   (collapsable? block-id {}))
  ([block-id {:keys [semantic?]
              :or {semantic? false}}]
   (when block-id
     (if-let [block (db-model/query-block-by-uuid block-id)]
       (or (db-model/has-children? block-id)
           (and
            (:outliner/block-title-collapse-enabled? (state/get-config))
            (block-with-title? (:block/format block)
                               (:block/content block)
                               semantic?)))
       false))))

(defn all-blocks-with-level
  "Return all blocks associated with correct level
   if :root-block is not nil, only return root block with its children
   if :expanded? true, return expanded children
   if :collapse? true, return without any collapsed children
   if :incremental? true, collapse/expand will be step by step
   for example:
   - a
    - b (collapsed)
     - c
     - d
    - e
   return:
    blocks
    [{:block a :level 1}
     {:block b :level 2}
     {:block e :level 2}]"
  [{:keys [collapse? expanded? incremental? root-block]
    :or {collapse? false expanded? false incremental? true root-block nil}}]
  (when-let [page (or (state/get-current-page)
                      (date/today))]
    (let [block-id (or root-block (parse-uuid page))
          blocks (if block-id
                   (db/get-block-and-children (state/get-current-repo) block-id)
                   (db/get-page-blocks-no-cache page))
          root-block (or block-id root-block)]
      (if incremental?
        (let [blocks (tree/blocks->vec-tree blocks (or block-id page))]
          (->>
           (cond->> blocks
             root-block
             (map (fn find [root]
                    (if (= root-block (:block/uuid root))
                      root
                      (first (filter find (:block/children root []))))))

             collapse?
             (w/postwalk
              (fn [b]
                (if (and (map? b)
                         (util/collapsed? b)
                         (not= root-block (:block/uuid b)))
                  (assoc b :block/children []) b)))

             true
             (mapcat (fn [x] (tree-seq map? :block/children x)))

             expanded?
             (filter (fn [b] (collapsable? (:block/uuid b))))

             true
             (map (fn [x] (dissoc x :block/children))))
           (remove nil?)))

        (cond->> blocks
          collapse?
          (filter util/collapsed?)

          expanded?
          (filter (fn [b] (collapsable? (:block/uuid b))))

          true
          (remove nil?))))))

(defn- skip-collapsing-in-db?
  []
  (let [config (last (state/get-editor-args))]
    (:ref? config)))

(defn- set-blocks-collapsed!
  [block-ids value]
  (let [block-ids (map (fn [block-id] (if (string? block-id) (uuid block-id) block-id)) block-ids)
        repo (state/get-current-repo)
        value (boolean value)]
    (when repo
      (save-current-block!) ;; Save the input contents before collapsing
      (outliner-tx/transact! ;; Save the new collapsed state as an undo transaction (if it changed)
        {:outliner-op :collapse-expand-blocks}
        (doseq [block-id block-ids]
          (when-let [block (db/entity [:block/uuid block-id])]
            (let [current-value (boolean (:block/collapsed? block))]
              (when-not (= current-value value)
                (let [block {:block/uuid block-id
                             :block/collapsed? value}]
                  (outliner-core/save-block! block)))))))
      (doseq [block-id block-ids]
        (state/set-collapsed-block! block-id value)))))

(defn collapse-block! [block-id]
  (when (collapsable? block-id)
    (when-not (skip-collapsing-in-db?)
      (set-blocks-collapsed! [block-id] true))))

(defn expand-block! [block-id]
  (when-not (skip-collapsing-in-db?)
    (set-blocks-collapsed! [block-id] false)))

(defn expand!
  ([e] (expand! e false))
  ([e clear-selection?]
   (util/stop e)
   (cond
     (state/editing?)
     (when-let [block-id (:block/uuid (state/get-edit-block))]
       (expand-block! block-id))

     (state/selection?)
     (do
       (->> (get-selected-blocks)
            (map (fn [dom]
                   (-> (dom/attr dom "blockid")
                       uuid
                       expand-block!)))
            doall)
       (and clear-selection? (clear-selection!)))
     :else
     ;; expand one level
     (let [blocks-with-level (all-blocks-with-level {})
           max-level (or (apply max (map :block/level blocks-with-level)) 99)]
       (loop [level 1]
         (if (> level max-level)
           nil
           (let [blocks-to-expand (->> blocks-with-level
                                       (filter (fn [b] (= (:block/level b) level)))
                                       (filter util/collapsed?))]
             (if (empty? blocks-to-expand)
               (recur (inc level))
               (doseq [{:block/keys [uuid]} blocks-to-expand]
                 (expand-block! uuid))))))))))

(defn collapse!
  ([e] (collapse! e false))
  ([e clear-selection?]
   (when e (util/stop e))
   (cond
     (state/editing?)
     (when-let [block-id (:block/uuid (state/get-edit-block))]
       (collapse-block! block-id))

     (state/selection?)
     (do
       (->> (get-selected-blocks)
            (map (fn [dom]
                   (-> (dom/attr dom "blockid")
                       uuid
                       collapse-block!)))
            doall)
       (and clear-selection? (clear-selection!)))

     :else
     ;; collapse by one level from outside
     (let [blocks-with-level
           (all-blocks-with-level {:collapse? true})
           max-level (or (apply max (map :block/level blocks-with-level)) 99)]
       (loop [level max-level]
         (if (zero? level)
           nil
           (let [blocks-to-collapse
                 (->> blocks-with-level
                      (filter (fn [b] (= (:block/level b) level)))
                      (filter (fn [b] (collapsable? (:block/uuid b)))))]
             (if (empty? blocks-to-collapse)
               (recur (dec level))
               (doseq [{:block/keys [uuid]} blocks-to-collapse]
                 (collapse-block! uuid))))))))))

(defn collapse-all!
  ([]
   (collapse-all! nil {}))
  ([block-id {:keys [collapse-self?]
              :or {collapse-self? true}}]
   (let [blocks (all-blocks-with-level {:incremental? false
                                        :expanded? true
                                        :root-block block-id})
         block-ids (cond->> (mapv :block/uuid blocks)
                     (not collapse-self?)
                     (remove #{block-id}))]
     (set-blocks-collapsed! block-ids true))))

(defn expand-all!
  ([]
   (expand-all! nil))
  ([block-id]
   (let [blocks (all-blocks-with-level {:incremental? false
                                        :collapse? true
                                        :root-block block-id})
         block-ids (map :block/uuid blocks)]
     (set-blocks-collapsed! block-ids false))))

(defn toggle-open! []
  (let [all-expanded? (empty? (all-blocks-with-level {:incremental? false
                                                      :collapse? true}))]
    (if all-expanded?
      (collapse-all!)
      (expand-all!))))

(defn toggle-open-block-children! [block-id]
  (let [all-expanded? (empty? (all-blocks-with-level {:incremental? false
                                                      :collapse? true
                                                      :root-block block-id}))]
    (if all-expanded?
      (collapse-all! block-id {:collapse-self? false})
      (expand-all! block-id))))

(defn select-all-blocks!
  []
  (if-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          blocks-container (util/rec-get-blocks-container input)
          blocks (dom/by-class blocks-container "ls-block")]
      (state/exit-editing-and-set-selected-blocks! blocks))
    (->> (all-blocks-with-level {:collapse? true})
         (map (comp gdom/getElementByClass str :block/uuid))
         state/exit-editing-and-set-selected-blocks!)))

(defn escape-editing
  ([]
   (escape-editing true))
  ([select?]
   (when (state/editing?)
     (if select?
       (->> (:block/uuid (state/get-edit-block))
            select-block!)
       (state/clear-edit!)))))

(defn replace-block-reference-with-content-at-point
  []
  (when-let [{:keys [start end link]} (thingatpt/block-ref-at-point)]
    (when-let [block (db/pull [:block/uuid link])]
      (let [block-content (:block/content block)
            format (or (:block/format block) :markdown)
            block-content-without-prop (-> (property/remove-properties format block-content)
                                           (drawer/remove-logbook))]
        (when-let [input (state/get-input)]
          (when-let [current-block-content (gobj/get input "value")]
            (let [block-content* (str (subs current-block-content 0 start)
                                      block-content-without-prop
                                      (subs current-block-content end))]
              (state/set-block-content-and-last-pos! input block-content* 1))))))))

(defn copy-current-ref
  [block-id]
  (when block-id
    (util/copy-to-clipboard! (block-ref/->block-ref block-id))))

(defn delete-current-ref!
  [block ref-id]
  (when (and block ref-id)
    (let [match (re-pattern (str "\\s?"
                                 (string/replace (block-ref/->block-ref ref-id) #"([\(\)])" "\\$1")))
          content (string/replace-first (:block/content block) match "")]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn replace-ref-with-text!
  [block ref-id]
  (when (and block ref-id)
    (let [match (block-ref/->block-ref ref-id)
          ref-block (db/entity [:block/uuid ref-id])
          block-ref-content (->> (or (:block/content ref-block)
                                     "")
                                 (property/remove-built-in-properties (:block/format ref-block))
                                 (drawer/remove-logbook))
          content (string/replace-first (:block/content block) match
                                        block-ref-content)]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn replace-ref-with-embed!
  [block ref-id]
  (when (and block ref-id)
    (let [match (block-ref/->block-ref ref-id)
          content (string/replace-first (:block/content block) match
                                        (util/format "{{embed ((%s))}}"
                                                     (str ref-id)))]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn block-default-collapsed?
  "Whether a block should be collapsed by default.
  Currently, this handles several cases:
  1. References.
  2. Custom queries."
  [block config]
  (or
   (and
    (or (:ref? config) (:custom-query? config))
    (>= (:block/level block) (state/get-ref-open-blocks-level))
    ;; has children
    (first (:block/_parent (db/entity (:db/id block)))))
   (util/collapsed? block)))

(defn set-heading!
  [block-id format heading]
  (if (= format :markdown)
    (let [repo (state/get-current-repo)
          block (db/entity [:block/uuid block-id])
          heading (if (true? heading) 2 heading)
          content' (commands/set-markdown-heading (:block/content block) heading)]
      (save-block! repo block-id content'))
    (do
      (save-current-block!)
      (set-block-property! block-id "heading" heading))))

(defn remove-heading!
  [block-id format]
  (remove-block-property! block-id "heading")
  (when (= format :markdown)
    (let [repo (state/get-current-repo)
          block (db/entity [:block/uuid block-id])
          content' (commands/clear-markdown-heading (:block/content block))]
      (save-block! repo block-id content'))))

(defn block->data-transfer!
  "Set block or page name to the given event's dataTransfer. Used in dnd."
  [block-or-page-name event]
  (.setData (gobj/get event "dataTransfer")
            (if (db-model/page? block-or-page-name) "page-name" "block-uuid")
            (str block-or-page-name)))
