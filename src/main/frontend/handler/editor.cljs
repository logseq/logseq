(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [clojure.walk :as w]
            [lambdaisland.glogi :as log]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.db-schema :as db-schema]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.block :as block-handler]
            [frontend.format.mldoc :as mldoc]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.image :as image]
            [frontend.db :as db]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [clojure.string :as string]
            [clojure.set :as set]
            [clojure.zip :as zip]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [dommy.core :as dom]
            [frontend.utf8 :as utf8]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.diff :as diff]
            [frontend.search :as search]
            [frontend.handler.image :as image-handler]
            [frontend.commands :as commands
             :refer [*show-commands
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *show-block-commands]]
            [frontend.extensions.html-parser :as html-parser]
            [medley.core :as medley]
            [frontend.text :as text]
            [frontend.util.property :as property]
            [frontend.date :as date]
            [frontend.handler.repeated :as repeated]
            [frontend.template :as template]
            [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [cljs.core.match :refer-macros [match]]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.db.outliner :as outliner-db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.debug :as debug]
            [datascript.core :as d]
            [frontend.util.marker :as marker]))

;; FIXME: should support multiple images concurrently uploading


(defonce *asset-pending-file (atom nil))
(defonce *asset-uploading? (atom false))
(defonce *asset-uploading-process (atom 0))
(defonce *selected-text (atom nil))

(defn- get-selection-and-format
  []
  (when-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          {:selection-start (gobj/get input "selectionStart")
           :selection-end (gobj/get input "selectionEnd")
           :format (:block/format block)
           :value (gobj/get input "value")
           :block block
           :edit-id edit-id
           :input input})))))

(defn- format-text!
  [pattern-fn]
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value block edit-id input]} m
          empty-selection? (= selection-start selection-end)
          pattern (pattern-fn format)
          pattern-count (count pattern)
          prefix (subs value 0 selection-start)
          wrapped-value (str pattern
                             (subs value selection-start selection-end)
                             pattern)
          postfix (subs value selection-end)
          new-value (str prefix wrapped-value postfix)]
      (state/set-edit-content! edit-id new-value)
      (if empty-selection?
        (util/cursor-move-back input (count pattern))
        (let [new-pos (count (str prefix wrapped-value))]
          (util/move-cursor-to input new-pos))))))

(defn bold-format! []
  (format-text! config/get-bold))

(defn italics-format! []
  (format-text! config/get-italic))

(defn highlight-format! []
  (format-text! config/get-highlight))

(defn html-link-format! []
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value block edit-id input]} m
          cur-pos (:pos (util/get-caret-pos input))
          empty-selection? (= selection-start selection-end)
          selection (subs value selection-start selection-end)
          selection-link? (and selection (or (util/starts-with? selection "http://")
                                             (util/starts-with? selection "https://")))
          [content forward-pos] (cond
                                  empty-selection?
                                  (config/get-empty-link-and-forward-pos format)

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
      (util/move-cursor-to input (+ cur-pos forward-pos)))))

(defn open-block-in-sidebar!
  [block-id]
  (when block-id
    (when-let [block (db/pull [:block/uuid block-id])]
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id block)
       :block
       block))))

(defn reset-cursor-range!
  [node]
  (when node
    (state/set-cursor-range! (util/caret-range node))))

(defn restore-cursor-pos!
  [id markup]
  (when-let [node (gdom/getElement (str id))]
    (when-let [cursor-range (state/get-cursor-range)]
      (when-let [range cursor-range]
        (let [pos (diff/find-position markup range)]
          (util/set-caret-pos! node pos))))))

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

;; FIXME: children' :block/path-ref-pages
(defn compute-retract-refs
  "Computes old references to be retracted."
  [eid {:block/keys [refs]} old-refs]
  ;; TODO:
  )

(defn- get-edit-input-id-with-block-id
  [block-id]
  (when-let [first-block (util/get-first-block-by-id block-id)]
    (string/replace (gobj/get first-block "id")
                    "ls-block"
                    "edit-block")))

(defn clear-selection!
  [_e]
  (doseq [block (dom/by-class "selected")]
    (dom/remove-class! block "selected")
    (dom/remove-class! block "noselect"))
  (state/clear-selection!))

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
  ([block pos format id]
   (edit-block! block pos format id nil))
  ([block pos format id {:keys [custom-content tail-len move-cursor?]
                         :or {tail-len 0
                              move-cursor? true}}]
   (when-not config/publishing?
     (when-let [block-id (:block/uuid block)]
       (let [block (or (db/pull [:block/uuid block-id]) block)
             edit-input-id (if (uuid? id)
                             (get-edit-input-id-with-block-id id)
                             (str (subs id 0 (- (count id) 36)) block-id))
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
             content (property/remove-built-in-properties (:block/format block)
                                                          content)]
         (clear-selection! nil)
         (state/set-editing! edit-input-id content block text-range move-cursor?))))))

(defn edit-last-block-for-new-page!
  [last-block pos]
  (when-let [first-block (util/get-first-block-by-id (:block/uuid last-block))]
    (edit-block!
     last-block
     pos
     (:block/format last-block)
     (string/replace (gobj/get first-block "id")
                     "ls-block"
                     "edit-block"))))

(defn- another-block-with-same-id-exists?
  [current-id block-id]
  (and (string? block-id)
       (util/uuid-string? block-id)
       (not= current-id (cljs.core/uuid block-id))
       (db/entity [:block/uuid (cljs.core/uuid block-id)])))

(defn- attach-page-properties-if-exists!
  [block]
  (if (and (:block/pre-block? block)
           (seq (:block/properties block)))
    (let [page-properties (:block/properties block)
          str->page (fn [n] {:block/name (string/lower-case n) :block/original-name n})
          refs (->> page-properties
                    (filter (fn [[_ v]] (coll? v)))
                    (vals)
                    (apply concat)
                    (set)
                    (map str->page)
                    (concat (:block/refs block))
                    (util/distinct-by :block/name))
          {:keys [tags alias]} page-properties
          page-tx (let [id (:db/id (:block/page block))
                        retract-attributes (mapv (fn [attribute]
                                                   [:db/retract id attribute])
                                                 [:block/properties :block/tags :block/alias])
                        tx (cond-> {:db/id id
                                    :block/properties page-properties}
                             (seq tags)
                             (assoc :block/tags (map str->page tags))
                             (seq alias)
                             (assoc :block/alias (map str->page alias)))]
                    (conj retract-attributes tx))]
      (assoc block
             :block/refs refs
             :db/other-tx page-tx))
    block))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (and (vector? x)
                      (= :block/uuid (first x))
                      (nil? (db/entity x)))) refs))

(defn- wrap-parse-block
  [{:block/keys [content format parent left page uuid pre-block?] :as block}]
  (let [block (or (and (:db/id block) (db/pull (:db/id block))) block)
        properties (:block/properties block)
        real-content (:block/content block)
        content (if (and (seq properties) real-content (not= real-content content))
                  (property/with-built-in-properties properties content format)
                  content)
        first-block? (= left page)
        ast (mldoc/->edn (string/trim content) (mldoc/default-config format))
        first-elem-type (first (ffirst ast))
        properties? (contains? #{"Property_Drawer" "Properties"} first-elem-type)
        top-level? (= parent page)
        markdown-heading? (and (= format :markdown)
                               (= "Heading" first-elem-type))
        block-with-title? (mldoc/block-with-title? first-elem-type)
        content (string/triml content)
        content (string/replace content (util/format "((%s))" (str uuid)) "")
        [content content'] (cond
                             (and first-block? properties?)
                             [content content]

                             (and markdown-heading? top-level?)
                             [content content]

                             markdown-heading?
                             (let [content (string/replace content #"^#+\s+" "")]
                               [content (str (config/get-block-pattern format) " " content)])

                             :else
                             (let [content' (str (config/get-block-pattern format) (if block-with-title? " " "\n") content)]
                               [content content']))
        block (assoc block :block/content content')
        block (apply dissoc block (remove #{:block/pre-block?} db-schema/retract-attributes))
        block (block/parse-block block)
        block (if (and first-block? (:block/pre-block? block))
                block
                (dissoc block :block/pre-block?))
        block (update block :block/refs remove-non-existed-refs!)
        block (attach-page-properties-if-exists! block)
        new-properties (merge
                        (select-keys properties property/built-in-properties)
                        (:block/properties block))]
    (-> block
        (dissoc :block/top?
                :block/block-refs-count)
        (assoc :block/content content
               :block/properties new-properties))))

(defn- save-block-inner!
  [repo block value {:keys [refresh?]
                     :or {refresh? true}}]
  (let [block (assoc block :block/content value)
        block (apply dissoc block db-schema/retract-attributes)]
    (profile
     "Save block: "
     (let [block (wrap-parse-block block)]
       (-> (outliner-core/block block)
           (outliner-core/save-node))
       (when refresh?
         (let [opts {:key :block/change
                     :data [block]}]
           (db/refresh! repo opts)))))

    (repo-handler/push-if-auto-enabled! repo)))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys [force?]
     :as opts}]
   (let [{:block/keys [uuid file page format repo content properties]} block
         repo (or repo (state/get-current-repo))
         e (db/entity repo [:block/uuid uuid])
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         block-id (when (map? properties) (get properties :id))
         content (property/remove-built-in-properties format content)]
     (cond
       (another-block-with-same-id-exists? uuid block-id)
       (notification/show!
        [:p.content
         (util/format "Block with the id % already exists!" block-id)]
        :error)

       force?
       (save-block-inner! repo block value opts)

       :else
       (let [content-changed? (not= (string/trim content) (string/trim value))]
         (when (and content-changed? page)
           (save-block-inner! repo block value opts)))))))

(defn- compute-fst-snd-block-text
  [value pos]
  (let [fst-block-text (subs value 0 pos)
        snd-block-text (string/triml (subs value pos))]
    [fst-block-text snd-block-text]))

(defn outliner-insert-block!
  [config current-block new-block sibling?]
  (let [ref-top-block? (and (:ref? config)
                            (not (:ref-child? config)))
        [current-node new-node]
        (mapv outliner-core/block [current-block new-block])
        has-children? (db/has-children? (state/get-current-repo)
                                        (tree/-get-id current-node))
        sibling? (cond
                   ref-top-block?
                   false

                   (boolean? sibling?)
                   sibling?

                   (:collapsed (:block/properties current-block))
                   true

                   :else
                   (not has-children?))]
    (let [*blocks (atom [current-node])]
      (outliner-core/save-node current-node)
      (outliner-core/insert-node new-node current-node sibling? {:blocks-atom *blocks
                                                                 :skip-transact? false})
      {:blocks @*blocks
       :sibling? sibling?})))

(defn- block-self-alone-when-insert?
  [config uuid]
  (let [current-page (state/get-current-page)
        block-id (or
                  (and (:id config)
                       (util/uuid-string? (:id config))
                       (:id config))
                  (and current-page
                       (util/uuid-string? current-page)
                       current-page))]
    (= uuid (and block-id (medley/uuid block-id)))))

;; FIXME: painful
(defn update-cache-for-block-insert!
  "Currently, this only affects current editor container to improve the performance."
  [repo config {:block/keys [page uuid] :as block} blocks]
  (let [blocks (map :data blocks)
        [first-block last-block right-block] blocks
        child? (= (first (:block/parent last-block))
                  (:block/uuid first-block))
        blocks-container-id (when-let [id (:id config)]
                             (and (util/uuid-string? id) (medley/uuid id)))]
    (let [new-last-block (let [first-block-id {:db/id (:db/id first-block)}]
                           (assoc last-block
                                  :block/left first-block-id
                                  :block/parent (if child?
                                                  first-block-id
                                                  ;; sibling
                                                  (:block/parent first-block))))
          blocks [first-block new-last-block]
          blocks-atom (if blocks-container-id
                        (db/get-block-blocks-cache-atom repo blocks-container-id)
                        (db/get-page-blocks-cache-atom repo (:db/id page)))
          [before-part after-part] (and blocks-atom
                                        (split-with
                                         #(not= uuid (:block/uuid %))
                                         @blocks-atom))
          after-part (rest after-part)
          blocks (concat before-part blocks after-part)
          blocks (if right-block
                   (map (fn [block]
                          (if (= (:block/uuid right-block) (:block/uuid block))
                            (assoc block :block/left (:block/left right-block))
                            block)) blocks)
                   blocks)]
      (when blocks-atom
        (reset! blocks-atom blocks)))))

(defn insert-new-block-before-block-aux!
  [config
   {:block/keys [uuid content repo format page]
    db-id :db/id
    :as block}
   value
   {:keys [ok-handler]
    :as opts}]
  (let [input (gdom/getElement (state/get-edit-input-id))
        pos (util/get-input-pos input)
        repo (or repo (state/get-current-repo))
        [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
        current-block (assoc block :block/content snd-block-text)
        current-block (apply dissoc current-block db-schema/retract-attributes)
        current-block (wrap-parse-block current-block)
        new-m {:block/uuid (db/new-block-id)
               :block/content fst-block-text}
        prev-block (-> (merge (select-keys block [:block/parent :block/left :block/format
                                                  :block/page :block/file :block/journal?]) new-m)
                       (wrap-parse-block))
        left-block (db/pull (:db/id (:block/left block)))
        _ (outliner-core/save-node (outliner-core/block current-block))
        sibling? (not= (:db/id left-block) (:db/id (:block/parent block)))
        {:keys [sibling? blocks]} (profile
                                   "outliner insert block"
                                   (outliner-insert-block! config left-block prev-block sibling?))]

    (db/refresh! repo {:key :block/insert :data [prev-block left-block current-block]})
    (profile "ok handler" (ok-handler prev-block))))

(defn insert-new-block-aux!
  [config
   {:block/keys [uuid content repo format page]
    db-id :db/id
    :as block}
   value
   {:keys [ok-handler]
    :as opts}]
  (let [block-self? (block-self-alone-when-insert? config uuid)
        input (gdom/getElement (state/get-edit-input-id))
        pos (util/get-input-pos input)
        repo (or repo (state/get-current-repo))
        [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
        current-block (assoc block :block/content fst-block-text)
        current-block (apply dissoc current-block db-schema/retract-attributes)
        current-block (wrap-parse-block current-block)
        new-m {:block/uuid (db/new-block-id)
               :block/content snd-block-text}
        next-block (-> (merge (select-keys block [:block/parent :block/left :block/format
                                                  :block/page :block/file :block/journal?]) new-m)
                       (wrap-parse-block))
        sibling? (when block-self? false)
        {:keys [sibling? blocks]} (profile
                                   "outliner insert block"
                                   (outliner-insert-block! config current-block next-block sibling?))
        refresh-fn (fn []
                     (let [opts {:key :block/insert
                                 :data [current-block next-block]}]
                       (db/refresh! repo opts)))]
    (do
      (if (or (:ref? config) (not sibling?))
        (refresh-fn)
        (do
          (profile "update cache " (update-cache-for-block-insert! repo config block blocks))
          (state/add-tx! refresh-fn)))
      ;; WORKAROUND: The block won't refresh itself even if the content is empty.
      (when block-self?
        (gobj/set input "value" ""))
      (profile "ok handler" (ok-handler next-block)))))

(defn clear-when-saved!
  []
  (state/set-editor-show-input! nil)
  (state/set-editor-show-date-picker! false)
  (state/set-editor-show-page-search! false)
  (state/set-editor-show-block-search! false)
  (state/set-editor-show-template-search! false)
  (commands/restore-state true))

(defn get-state
  []
  (let [[{:keys [on-hide block block-id block-parent-id format sidebar?]} id config] (state/get-editor-args)
        node (gdom/getElement id)]
    (when node
      (let [value (gobj/get node "value")
            pos (gobj/get node "selectionStart")]
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

(defn- with-timetracking-properties
  [block value]
  (let [new-marker (first (util/safe-re-find marker/bare-marker-pattern (or value "")))
        new-marker (if new-marker (string/lower-case (string/trim new-marker)))
        new-marker? (and
                     new-marker
                     (not= new-marker (string/lower-case (or (:block/marker block) "")))
                     (state/enable-timetracking?))
        ts (util/time-ms)
        properties (if new-marker?
                     (assoc (:block/properties block) new-marker ts)
                     (:block/properties block))
        value (or
               (when new-marker?
                 (property/insert-property (:block/format block)
                                        value
                                        new-marker
                                        ts))
               value)]
    [properties value]))


(defn insert-new-block!
  ([state]
   (insert-new-block! state nil))
  ([state block-value]
   (when (and (not config/publishing?)
              (not= :insert (state/get-editor-op)))
     (state/set-editor-op! :insert)
     (when-let [state (get-state)]
       (let [{:keys [block value format id config]} state
             value (if (string? block-value) block-value value)
             block-id (:block/uuid block)
             block (or (db/pull [:block/uuid block-id])
                       block)
             repo (or (:block/repo block) (state/get-current-repo))
             [properties value] (with-timetracking-properties block value)
             block-self? (block-self-alone-when-insert? config block-id)
             input (gdom/getElement (state/get-edit-input-id))
             pos (util/get-input-pos input)
             repo (or repo (state/get-current-repo))
             [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
             insert-fn (match (mapv boolean [block-self? (seq fst-block-text) (seq snd-block-text)])
                         [true _ _] insert-new-block-aux!
                         [_ false true] insert-new-block-before-block-aux!
                         [_ _ _] insert-new-block-aux!)]
         (insert-fn
          config
          (assoc block :block/properties properties)
          value
          {:ok-handler
           (fn [last-block]
             (edit-block! last-block 0 format id)
             (clear-when-saved!))}))))
   (state/set-editor-op! nil)))

(defn api-insert-new-block!
  [content {:keys [page block-uuid sibling? attributes]}]
  (when (or page block-uuid)
    (when-let [block (if block-uuid
                       (db/pull [:block/uuid block-uuid])
                       (let [page (db/entity [:block/name (string/lower-case page)])
                             block-uuid (:block/uuid page)
                             children (:block/_parent page)
                             blocks (db/sort-by-left children page)
                             last-block-id (or (:db/id (last blocks))
                                               (:db/id page))]
                         (db/pull last-block-id)))]
      ;; TODO: DRY
      (let [new-block (-> (select-keys block [:block/parent :block/left :block/format
                                              :block/page :block/file :block/journal?])
                          (assoc :block/content content)
                          (wrap-parse-block))
            repo (state/get-current-repo)]
        (outliner-insert-block! {} block new-block sibling?)
        (db/refresh! repo {:key :block/insert
                           :data [new-block]})))))

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
                                   content))]
      (when content
        (str (string/trimr content)
             "\n"
             (util/format (str (if (= format :org) "-" "*") " %s -> DONE [%s]")
                          marker
                          (date/get-local-date-time-string)))))
    content))

(defn- with-marker-time
  [content format marker]
  (if (state/enable-timetracking?)
    (let [marker (string/lower-case marker)]
      (property/insert-property format content marker (util/time-ms)))
    content))

(defn check
  [{:block/keys [uuid marker content format repeated?] :as block}]
  (let [new-content (string/replace-first content marker "DONE")
        new-content (->
                     (if repeated?
                       (update-timestamps-content! block content)
                       new-content)
                     (with-marker-time format "DONE"))]
    (save-block-if-changed! block new-content)))

(defn uncheck
  [{:block/keys [uuid marker content format] :as block}]
  (let [marker (if (= :now (state/get-preferred-workflow))
                 "LATER"
                 "TODO")
        new-content (-> (string/replace-first content "DONE" marker)
                        (with-marker-time format marker))]
    (save-block-if-changed! block new-content)))

(defn cycle-todo!
  []
  (when-let [block (state/get-edit-block)]
    (let [edit-input-id (state/get-edit-input-id)
          current-input (gdom/getElement edit-input-id)
          content (state/get-edit-content)
          format (or (db/get-page-format (state/get-current-page))
                     (state/get-preferred-format))
          cond-fn (fn [marker] (or (and (= :markdown format)
                                        (util/safe-re-find (re-pattern (str "#*\\s*" marker)) content))
                                     (util/starts-with? content "TODO")))
          [new-content marker] (cond
                                 (cond-fn "TODO")
                                 [(string/replace-first content "TODO" "DOING") "DOING"]
                                 (cond-fn "DOING")
                                 [(string/replace-first content "DOING" "DONE") "DONE"]
                                 (cond-fn "LATER")
                                 [(string/replace-first content "LATER" "NOW") "NOW"]
                                 (cond-fn "NOW")
                                 [(string/replace-first content "NOW" "DONE") "DONE"]
                                 (cond-fn "DONE")
                                 [(string/replace-first content "DONE" "") nil]
                                 :else
                                 (let [marker (if (= :now (state/get-preferred-workflow))
                                                "LATER"
                                                "TODO")]
                                   [(marker/add-or-update-marker (string/triml content) format marker)  marker]))
          new-content (string/triml new-content)]
      (let [new-pos (commands/compute-pos-delta-when-change-marker
                     current-input content new-content marker (util/get-input-pos current-input))]
        (state/set-edit-content! edit-input-id new-content)
        (util/set-caret-pos! current-input new-pos)))))


(defn set-marker
  [{:block/keys [uuid marker content format properties] :as block} new-marker]
  (let [new-content (-> (string/replace-first content marker new-marker)
                        (with-marker-time format new-marker))]
    (save-block-if-changed! block new-content)))

(defn set-priority
  [{:block/keys [uuid marker priority content] :as block} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-block-if-changed! block new-content)))

(defn- get-prev-block-non-collapsed
  [block]
  (when-let [blocks (util/get-blocks-noncollapse)]
    (when-let [index (.indexOf blocks block)]
      (let [idx (dec index)]
        (when (>= idx 0)
          (nth blocks idx))))))

(defn- get-next-block-non-collapsed
  [block]
  (when-let [blocks (util/get-blocks-noncollapse)]
    (when-let [index (.indexOf blocks block)]
      (let [idx (inc index)]
        (when (>= (count blocks) idx)
          (util/nth-safe blocks idx))))))

(defn delete-block-aux!
  [{:block/keys [uuid content repo refs] :as block} children?]
  (let [repo (or repo (state/get-current-repo))
        block (db/pull repo '[*] [:block/uuid uuid])]
    (when block
      (->
       (outliner-core/block block)
       (outliner-core/delete-node children?))
      (db/refresh! repo {:key :block/change :data [block]}))))

(defn delete-block!
  ([repo e]
   (delete-block! repo e true))
  ([repo e delete-children?]
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
              (let [block-parent (gdom/getElement block-parent-id)
                    sibling-block (get-prev-block-non-collapsed block-parent)]
                (delete-block-aux! block delete-children?)
                (when (and repo sibling-block)
                  (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
                    (when-let [block (db/pull repo '[*] [:block/uuid (uuid sibling-block-id)])]
                      (let [original-content (util/trim-safe (:block/content block))
                            new-value (str original-content " " (string/triml value))
                            tail-len (count (string/triml value))
                            pos (max
                                 (if original-content
                                   (utf8/length (utf8/encode original-content))
                                   0)
                                 0)]
                        (edit-block! block pos format id
                                     {:custom-content new-value
                                      :tail-len tail-len
                                      :move-cursor? false}))))))))))))
   (state/set-editor-op! nil)))

(defn- get-end-block-parent
  [end-block blocks]
  (if-let [parent (let [id (:db/id (:block/parent end-block))]
                    (some (fn [block] (when (= (:db/id block) id) block)) blocks))]
    (recur parent blocks)
    end-block))

(defn- get-top-level-end-node
  [blocks]
  (let [end-block (last blocks)
        end-block-parent (get-end-block-parent end-block blocks)]
    (outliner-core/block end-block-parent)))

(defn- reorder-blocks
  [blocks]
  (if (<= (count blocks) 1)
    blocks
    (let [[f s & others] blocks]
      (if (= (or (:block/left s)
                 (:block/parent s))
             {:db/id (:db/id f)})
        blocks
        (reverse blocks)))))

(defn delete-blocks!
  [repo block-uuids]
  (when (seq block-uuids)
    (let [lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
          blocks (db/pull-many repo '[*] lookup-refs)
          blocks (reorder-blocks blocks)]
      (let [start-node (outliner-core/block (first blocks))
            end-node (get-top-level-end-node blocks)]
        (if (= start-node end-node)
          (delete-block-aux! (first blocks) true)
          (when (outliner-core/delete-nodes start-node end-node lookup-refs)
            (let [opts {:key :block/change
                        :data blocks}]
              (db/refresh! repo opts)
              (ui-handler/re-render-root!))))))))

(defn- block-property-aux!
  [block-id key value]
  (let [block-id (if (string? block-id) (uuid block-id) block-id)
        repo (state/get-current-repo)]
    (when repo
      (when-let [block (db/entity [:block/uuid block-id])]
        (let [format (:block/format block)
              content (:block/content block)
              properties (:block/properties block)
              properties (if value        ; add
                           (assoc properties key value)
                           (dissoc properties key))
              content (if value
                        (property/insert-property format content key value)
                        (property/remove-property format key content))
              block (outliner-core/block {:block/uuid block-id
                                          :block/properties properties
                                          :block/content content})]
          (outliner-core/save-node block)
          (let [opts {:key :block/change
                      :data [block]}]
            (db/refresh! repo opts)))))))

(defn remove-block-property!
  [block-id key]
  (let [key (keyword key)]
    (block-property-aux! block-id key nil))
  (db/refresh! (state/get-current-repo)
               {:key :block/change
                :data [(db/pull [:block/uuid block-id])]}))

(defn set-block-property!
  [block-id key value]
  (let [key (keyword key)]
    (block-property-aux! block-id key value))
  (db/refresh! (state/get-current-repo)
               {:key :block/change
                :data [(db/pull [:block/uuid block-id])]}))

(defn set-block-timestamp!
  [block-id key value]
  (let [key (string/lower-case key)
        block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))
        value (str value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [content scheduled deadline format]} block
            content (or (state/get-edit-content) content)
            new-line (str (string/upper-case key) ": " value)
            new-content (let [lines (string/split-lines content)
                              new-lines (map (fn [line]
                                               (if (string/starts-with? (string/lower-case line) key)
                                                 new-line
                                                 line))
                                             lines)
                              new-lines (if (not= lines new-lines)
                                          new-lines
                                          (cons (first new-lines) ;; title
                                                (cons
                                                 new-line
                                                 (rest new-lines))))]
                          (string/join "\n" new-lines))]
        (when (not= content new-content)
          (if-let [input-id (state/get-edit-input-id)]
            (state/set-edit-content! input-id new-content)
            (save-block-if-changed! block new-content)))))))

(defn copy-block-ref!
  ([block-id] (copy-block-ref! block-id #(str %)))
  ([block-id tap-clipboard]
   (let [block (db/entity [:block/uuid block-id])]
     (when-not (:block/pre-block? block)
       (set-block-property! block-id "id" (str block-id))))
   (util/copy-to-clipboard! (tap-clipboard block-id))))

(defn exit-editing-and-set-selected-blocks!
  ([blocks]
   (exit-editing-and-set-selected-blocks! blocks :down))
  ([blocks direction]
   (util/clear-selection!)
   (state/clear-edit!)
   (state/set-selection-blocks! blocks direction)
   (util/select-highlight! blocks)))

(defn select-block!
  [block-uuid]
  (when-let [block (-> (str block-uuid)
                       (js/document.getElementsByClassName)
                       first)]
    (exit-editing-and-set-selected-blocks! [block])))

(defn select-all-blocks!
  []
  (when-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          blocks-container (util/rec-get-blocks-container input)
          blocks (dom/by-class blocks-container "ls-block")]
      (exit-editing-and-set-selected-blocks! blocks))))

(defn- get-selected-blocks-with-children
  []
  (when-let [blocks (seq (get @state/state :selection/blocks))]
    (mapcat (fn [block]
              (cons block
                    (array-seq (dom/by-class block "ls-block"))))
            blocks)))

(defn- blocks-with-level
  [blocks]
  (let [level-blocks (mapv #(assoc % :level 1) blocks)
        level-blocks-map (into {} (mapv (fn [b] [(:db/id b) b]) level-blocks))
        [level-blocks-map _]
        (reduce (fn [[r state] [id block]]
                  (if-let [parent-level (get-in state [(:db/id (:block/parent block)) :level])]
                    [(conj r [id (assoc block :level (inc parent-level))])
                     (assoc-in state [(:db/id block) :level] (inc parent-level))]
                    [(conj r [id block])
                     state]))
                [{} level-blocks-map] level-blocks-map)]
    level-blocks-map))

(defn- blocks-vec->tree
  [blocks]
  (let [loc (reduce (fn [loc {:keys [level] :as block}]
                      (let [loc*
                            (loop [loc (zip/vector-zip (zip/root loc))
                                   level level]
                              (if (> level 1)
                                (if-let [down (zip/rightmost (zip/down loc))]
                                  (let [down-node (zip/node down)]
                                    (if (or (and (vector? down-node)
                                                 (>= (:level (first down-node)) (:level block)))
                                            (>= (:level down-node) (:level block)))
                                      down
                                      (recur down (dec level))))
                                  loc)
                                loc))
                            loc**
                            (if (vector? (zip/node loc*))
                              (zip/append-child loc* block)
                              (-> loc*
                                  zip/up
                                  (zip/append-child [block])))]
                        loc**)) (zip/vector-zip []) blocks)]

    (clojure.walk/postwalk (fn [e] (if (map? e) (dissoc e :level) e)) (zip/root loc))))

(defn- compose-copied-blocks-contents-&-block-tree
  [repo block-ids]
  (let [blocks (db-utils/pull-many repo '[*] (mapv (fn [id] [:block/uuid id]) block-ids))
        blocks* (flatten
                 (mapv (fn [b] (if (:collapsed (:block/properties b))
                                 (vec (tree/sort-blocks (db/get-block-children repo (:block/uuid b)) b))
                                 [b])) blocks))
        block-ids* (mapv :block/uuid blocks*)
        unordered? (:block/unordered (first blocks*))
        format (:block/format (first blocks*))
        level-blocks-map (blocks-with-level blocks*)
        level-blocks-uuid-map (into {} (mapv (fn [b] [(:block/uuid b) b]) (vals level-blocks-map)))
        level-blocks (mapv (fn [uuid] (get level-blocks-uuid-map uuid)) block-ids*)
        tree (blocks-vec->tree level-blocks)
        contents
        (mapv (fn [block]
                (let [header
                      (if (and unordered? (= format :markdown))
                        (str (string/join (repeat (- (:level block) 1) "  ")) "-")
                        (let [header-char (if (= format :markdown) "#" "*")
                              init-char (if (= format :markdown) "##" "*")]
                          (str (string/join (repeat (:level block) header-char)) init-char)))]
                  (str header " " (:block/content block) "\n")))
              level-blocks)
        content-without-properties
        (mapv
         (fn [content]
           (let [ast (mldoc/->edn content (mldoc/default-config format))
                 properties-loc
                 (->> ast
                      (filterv (fn [[[type _] loc]] (= type "Property_Drawer")))
                      (mapv second)
                      first)]
             (if properties-loc
               (utf8/delete! content (:start_pos properties-loc) (:end_pos properties-loc))
               content)))
         contents)]
    [(string/join content-without-properties) tree]))

(defn copy-selection-blocks
  []
  (when-let [blocks (seq (get-selected-blocks-with-children))]
    (let [repo (dom/attr (first blocks) "repo")
          ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))
          ids (if (= :up (state/get-selection-direction))
                (reverse ids)
                ids)
          [content tree] (compose-copied-blocks-contents-&-block-tree repo ids)
          block (db/pull [:block/uuid (first ids)])]
      (common-handler/copy-to-clipboard-without-id-property! (:block/format block) content)
      (state/set-copied-blocks content tree)
      (notification/show! "Copied!" :success))))

(defn cut-selection-blocks
  [copy?]
  (when copy? (copy-selection-blocks))
  (when-let [blocks (seq (get-selected-blocks-with-children))]
    ;; remove embeds and references
    (let [blocks (remove (fn [block] (= "true" (dom/attr block "data-transclude"))) blocks)]
      (when (seq blocks)
        (let [repo (dom/attr (first blocks) "repo")
             ids (distinct (map #(uuid (dom/attr % "blockid")) blocks))
             ids (if (= :up (state/get-selection-direction))
                   (reverse ids)
                   ids)]
         (delete-blocks! repo ids))))))

(defn- get-nearest-page
  []
  (when-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (when-let [pos (util/get-input-pos input)]
            (let [value (gobj/get input "value")
                  page-pattern #"\[\[([^\]]+)]]"
                  block-pattern #"\(\(([^\)]+)\)\)"
                  page-matches (util/re-pos page-pattern value)
                  block-matches (util/re-pos block-pattern value)
                  matches (->> (concat page-matches block-matches)
                               (remove nil?))
                  [_ page] (first (sort-by
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
              (when page
                (subs page 2 (- (count page) 2))))))))))

(defn follow-link-under-cursor!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)]
      (state/clear-edit!)
      (route-handler/redirect! {:to :page
                                :path-params {:name page-name}}))))

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
           :block
           page)
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :page
           {:page page}))))))

(defn zoom-in! []
  (if (state/editing?)
    (when-let [id (some-> (state/get-edit-block)
                          :block/uuid
                          ((fn [id] [:block/uuid id]))
                          db/entity
                          :block/uuid)]
      (let [pos (state/get-edit-pos)]
        (route-handler/redirect! {:to          :page
                                  :path-params {:name (str id)}})
        (edit-block! {:block/uuid id} pos nil id)))
    (js/window.history.forward)))
(defn zoom-out!
  []
  (if (state/editing?)
    (let [page (state/get-current-page)
          block-id (and
                    (string? page)
                    (util/uuid-string? page)
                    (medley/uuid page))]
      (when block-id
        (let [block-parent (db/get-block-parent block-id)]
          (if-let [id (and
                       (nil? (:block/name block-parent))
                       (:block/uuid block-parent))]
            (do
              (route-handler/redirect! {:to :page
                                        :path-params {:name (str id)}})

              (edit-block! {:block/uuid block-id} :max nil block-id))
            (let [page-id (some-> (db/entity [:block/uuid block-id])
                                  :block/page
                                  :db/id

                                  )]
              (when-let [page-name (:block/name (db/entity page-id))]
                (route-handler/redirect! {:to :page
                                          :path-params {:name page-name}})
                (edit-block! {:block/uuid block-id} :max nil block-id)))))))
    (js/window.history.back)))

(defn cut-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (common-handler/copy-to-clipboard-without-id-property! (:block/format block) content)
      (delete-block-aux! block true))))

(defn clear-last-selected-block!
  []
  (let [block (state/drop-last-selection-block!)]
    (dom/remove-class! block "selected")
    (dom/remove-class! block "noselect")))

(defn input-start-or-end?
  ([input]
   (input-start-or-end? input nil))
  ([input up?]
   (let [value (gobj/get input "value")
         start (gobj/get input "selectionStart")
         end (gobj/get input "selectionEnd")]
     (if (nil? up?)
       (or (= start 0) (= end (count value)))
       (or (and (= start 0) up?)
           (and (= end (count value)) (not up?)))))))

(defn highlight-selection-area!
  [end-block]
  (when-let [start-block (state/get-selection-start-block)]
    (clear-selection! nil)
    (let [blocks (util/get-nodes-between-two-nodes start-block end-block "ls-block")
          direction (util/get-direction-between-two-nodes start-block end-block "ls-block")

          blocks (if (= :up direction)
                   (reverse blocks)
                   blocks)]
      (exit-editing-and-set-selected-blocks! blocks direction))))

(defn on-select-block
  [direction]
  (fn [e]
    (cond
      ;; when editing, quit editing and select current block
      (state/editing?)
      (exit-editing-and-set-selected-blocks! [(gdom/getElement (state/get-editing-block-dom-id))])

      ;; when selection and one block selected, select next block
      (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
      (let [f (if (= :up direction) util/get-prev-block util/get-next-block)
            element (f (first (state/get-selection-blocks)))]
        (when element
          (state/conj-selection-block! element direction)))

      ;; if same direction, keep conj on same direction
      (and (state/selection?) (= direction (state/get-selection-direction)))
      (let [f (if (= :up direction) util/get-prev-block util/get-next-block)
            element (f (last (state/get-selection-blocks)))]
        (when element
          (state/conj-selection-block! element direction)))

      ;; if different direction, keep clear until one left
      (state/selection?)
      (clear-last-selected-block!))))

(defn save-block-aux!
  [block value format opts]
  (let [value (string/trim value)
        [properties value] (with-timetracking-properties block value)]
    ;; FIXME: somehow frontend.components.editor's will-unmount event will loop forever
    ;; maybe we shouldn't save the block/file in "will-unmount" event?
    (save-block-if-changed! block value
                            (merge
                             {:init-properties properties}
                             opts))))

(defn save-block!
  ([repo block-or-uuid content]
   (let [block (if (or (uuid? block-or-uuid)
                       (string? block-or-uuid))
                 (db-model/query-block-by-uuid block-or-uuid) block-or-uuid)
         format (:block/format block)]
     (save-block! {:block block :repo repo :format format} content)))
  ([{:keys [format block repo] :as state} value]
   (when (:db/id (db/entity repo [:block/uuid (:block/uuid block)]))
     (save-block-aux! block value format {}))))

(defn save-current-block!
  ([]
   (save-current-block! {}))
  ([{:keys [force?] :as opts}]
   ;; non English input method
   (when-not (state/editor-in-composition?)
     (when-let [repo (state/get-current-repo)]
       (when (and (not @commands/*show-commands)
                  (not @commands/*show-block-commands)
                  (not (state/get-editor-show-page-search?))
                  (not (state/get-editor-show-page-search-hashtag?))
                  (not (state/get-editor-show-block-search?))
                  (not (state/get-editor-show-date-picker?))
                  (not (state/get-editor-show-template-search?))
                  (not (state/get-editor-show-input)))
         (try
           (let [input-id (state/get-edit-input-id)
                 block (state/get-edit-block)
                 db-block (when-let [block-id (:block/uuid block)]
                            (db/pull [:block/uuid block-id]))
                 elem (and input-id (gdom/getElement input-id))
                 db-content (:block/content db-block)
                 db-content-without-heading (and db-content
                                                 (util/safe-subs db-content (:block/level db-block)))
                 value (and elem (gobj/get elem "value"))]
             (cond
               force?
               (save-block-aux! db-block value (:block/format db-block) opts)

               (and block value db-content-without-heading
                    (or
                     (not= (string/trim db-content-without-heading)
                           (string/trim value))))
               (save-block-aux! db-block value (:block/format db-block) opts)))
           (catch js/Error error
             (log/error :save-block-failed error))))))))

(defn- clean-content!
  [format content]
  (->> (text/remove-level-spaces content format)
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
    (let [restore-slash-caret-pos? (if (and
                                        (seq? command-output)
                                        (= :editor/click-hidden-file-input
                                           (ffirst command-output)))
                                     false
                                     true)]
      (commands/restore-state restore-slash-caret-pos?))))

(defn- get-asset-file-link
  [format url file-name image?]
  (case (keyword format)
    :markdown (util/format (str (when image? "!") "[%s](%s)") file-name url)
    :org (if image?
           (util/format "[[%s]]" url)
           (util/format "[[%s][%s]]" url file-name))
    nil))

(defn- get-asset-link
  [url]
  (str "/" url))

(defn ensure-assets-dir!
  [repo]
  (let [repo-dir (config/get-repo-dir repo)
        assets-dir "assets"]
    (p/then
     (fs/mkdir-if-not-exists (str repo-dir "/" assets-dir))
     (fn [] [repo-dir assets-dir]))))

(defn save-assets!
  ([{block-id :block/uuid} repo files]
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
      (do
        ;; WARN file name maybe fully qualified path when paste file
        (let [file-name (util/node-path.basename (.-name file))
              [file-base ext] (if file-name
                                (let [last-dot-index (string/last-index-of file-name ".")]
                                  [(subs file-name 0 last-dot-index)
                                   (subs file-name last-dot-index)])
                                ["" ""])
              filename (str (gen-filename index file-base) ext)
              filename (str path "/" filename)]
                                        ;(js/console.debug "Write asset #" dir filename file)
         (if (util/electron?)
           (let [from (.-path file)]
             (p/then (js/window.apis.copyFileToAssets dir filename from)
                     #(p/resolved [filename (if (string? %) (js/File. #js[] %) file) (.join util/node-path dir filename)])))
           (p/then (fs/write-file! repo dir filename (.stream file) nil)
                   #(p/resolved [filename file])))))))))

(defonce *assets-url-cache (atom {}))

(defn make-asset-url
  [path] ;; path start with "/assets" or compatible for "../assets"
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))
        path (string/replace path "../" "/")]
    (if (util/electron?)
      (str "assets://" repo-dir path)
      (let [handle-path (str "handle" repo-dir path)
            cached-url (get @*assets-url-cache (keyword handle-path))]
        (if cached-url
          (p/resolved cached-url)
          (p/let [handle (frontend.idb/get-item handle-path)
                  file (and handle (.getFile handle))]
            (when file
              (p/let [url (js/URL.createObjectURL file)]
                (swap! *assets-url-cache assoc (keyword handle-path) url)
                url))))))))

(defn delete-asset-of-block!
  [{:keys [repo href title full-text block-id local? delete-local?] :as opts}]
  (let [block (db-model/query-block-by-uuid block-id)
        _ (or block (throw (str block-id " not exists")))
        format (:block/format block)
        text (:block/content block)
        content (string/replace text full-text "")]
    (save-block! repo block content)
    (when (and local? delete-local?)
      ;; FIXME: should be relative to current block page path
      (when-let [href (if (util/electron?) href (second (re-find #"\((.+)\)$" full-text)))]
        (fs/unlink! (config/get-repo-path
                      repo (-> href
                               (string/replace #"^../" "/")
                               (string/replace #"^assets://" ""))) nil)))))

;; assets/journals_2021_02_03_1612350230540_0.png
(defn resolve-relative-path
  [file-path]
  (if-let [current-file (or (some-> (state/get-edit-block)
                                    :block/file
                                    :db/id
                                    (db/entity)
                                    :file/path)

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
    (if (config/local-db? repo)
      (-> (save-assets! block repo (js->clj files))
          (p/then
           (fn [res]
             (when-let [[asset-file-name file full-file-path] (and (seq res) (first res))]
               (let [image? (util/ext-of-image? asset-file-name)]
                 (insert-command!
                  id
                  (get-asset-file-link format (resolve-relative-path (or full-file-path asset-file-name))
                                       (if file (.-name file) (if image? "image" "asset"))
                                       image?)
                  format
                  {:last-pattern (if drop-or-paste? "" commands/slash)
                   :restore?     true})))))
          (p/finally
            (fn []
              (reset! uploading? false)
              (reset! *asset-uploading? false)
              (reset! *asset-uploading-process 0))))
      (image/upload
       files
       (fn [file file-name file-type]
         (image-handler/request-presigned-url
          file file-name file-type
          uploading?
          (fn [signed-url]
            (insert-command! id
                             (get-asset-file-link format signed-url file-name true)
                             format
                             {:last-pattern (if drop-or-paste? "" commands/slash)
                              :restore?     true})

            (reset! *asset-uploading? false)
            (reset! *asset-uploading-process 0))
          (fn [e]
            (let [process (* (/ (gobj/get e "loaded")
                                (gobj/get e "total"))
                             100)]
              (reset! *asset-uploading? false)
              (reset! *asset-uploading-process process)))))))))

(defn set-asset-pending-file [file]
  (reset! *asset-pending-file file))

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
   ;; "_" "_"
   ;; ":" ":"                              ; TODO: only properties editing and org mode tag
   ;; "^" "^"
})

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(def delete-map
  (assoc autopair-map
         "$" "$"
         ":" ":"))

(def reversed-delete-map
  (zipmap (vals delete-map)
          (keys delete-map)))

(defn autopair
  [input-id prefix format {:keys [restore?]
                           :or {restore? true}
                           :as option}]
  (let [value (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected value)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
      (when-not (string/blank? selected) (reset! *selected-text selected))
      (let [[prefix pos] (commands/simple-replace! input-id value selected
                                                   {:backward-pos (count postfix)
                                                    :check-fn (fn [new-value prefix-pos]
                                                                (when (>= prefix-pos 0)
                                                                  [(subs new-value prefix-pos (+ prefix-pos 2))
                                                                   (+ prefix-pos 2)]))})]
        (case prefix
          "[["
          (do
            (commands/handle-step [:editor/search-page])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          "(("
          (do
            (commands/handle-step [:editor/search-block :reference])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          nil)))))

(defn surround-by?
  [input before after]
  (when input
    (let [value (gobj/get input "value")
          pos (util/get-input-pos input)
          start-pos (if (= :start before) 0 (- pos (count before)))
          end-pos (if (= :end after) (count value) (+ pos (count after)))]
      (when (>= (count value) end-pos)
        (= (cond
             (and (= :end after) (= :start before))
             ""

             (= :end after)
             before

             (= :start before)
             after

             :else
             (str before after))
           (subs value start-pos end-pos))))))

(defn get-matched-pages
  [q]
  (let [block (state/get-edit-block)
        editing-page (and block
                          (when-let [page-id (:db/id (:block/page block))]
                            (:block/name (db/entity page-id))))]
    (let [pages (search/page-search q 20)]
      (if editing-page
        ;; To prevent self references
        (remove (fn [p] (= (string/lower-case p) editing-page)) pages)
        pages))))

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

(defn get-matched-commands
  [input]
  (try
    (let [edit-content (or (gobj/get input "value") "")
          pos (util/get-input-pos input)
          last-slash-caret-pos (:pos @*slash-caret-pos)
          last-command (and last-slash-caret-pos (subs edit-content last-slash-caret-pos pos))]
      (when (> pos 0)
        (or
         (and (= \/ (util/nth-safe edit-content (dec pos)))
              @commands/*initial-commands)
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch js/Error e
      (js/console.error e)
      nil)))

(defn get-matched-block-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (util/get-input-pos input)
          last-command (subs edit-content
                             (:pos @*angle-bracket-caret-pos)
                             pos)]
      (when (> pos 0)
        (or
         (and (= \< (util/nth-safe edit-content (dec pos)))
              (commands/block-commands-map))
         (and last-command
              (commands/get-matched-commands
               last-command
               (commands/block-commands-map))))))
    (catch js/Error e
      nil)))

(defn auto-complete?
  []
  (or @*show-commands
      @*show-block-commands
      @*asset-uploading?
      (= (gdom/getElement "search-field")
         (.-activeElement js/document))
      (state/get-editor-show-input)
      (state/get-editor-show-page-search?)
      (state/get-editor-show-block-search?)
      (state/get-editor-show-template-search?)
      (state/get-editor-show-date-picker?)))

(defn get-previous-input-char
  [input]
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (util/nth-safe value (- pos 1))))))

(defn get-previous-input-chars
  [input length]
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (subs value (- pos length) pos)))))

(defn get-current-input-char
  [input]
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(defn- get-previous-block-level
  [current-id]
  (when-let [input (gdom/getElement current-id)]
    (when-let [prev-block (util/get-prev-block input)]
      (util/parse-int (dom/attr prev-block "level")))))

(defn append-paste-doc!
  [format event]
  (let [[html text] (util/get-clipboard-as-html event)]
    (when-not (util/starts-with? (string/trim text) "http")
      (let [doc-text (html-parser/parse format html)]
        (when-not (string/blank? doc-text)
          (util/stop event)
          (state/append-current-edit-content! doc-text))))))

(defn- block-and-children-content
  [block-children]
  (-> (map :block/content block-children)
      string/join))

(defn move-up-down
  [up?]
  (fn [e]
    (when-let [block-id (:block/uuid (state/get-edit-block))]
      (when-let [block (db/pull [:block/uuid block-id])]
        (outliner-core/move-node (outliner-core/block block) up?)
        (when-let [repo (state/get-current-repo)]
          (let [opts {:key :block/change
                      :data [block]}]
            (db/refresh! repo opts)))))))

;; selections
(defn on-tab
  "direction = :left|:right, only indent or outdent when blocks are siblings"
  [direction]
  (when-let [repo (state/get-current-repo)]
    (let [blocks-dom-nodes (state/get-selection-blocks)
          blocks (seq blocks-dom-nodes)]
      (cond
        (seq blocks)
        (do
          (let [lookup-refs (->> (map (fn [block] (when-let [id (dom/attr block "blockid")]
                                                    [:block/uuid (medley/uuid id)])) blocks)
                                 (remove nil?))
                blocks (db/pull-many repo '[*] lookup-refs)
                blocks (reorder-blocks blocks)
                end-node (get-top-level-end-node blocks)
                end-node-parent (tree/-get-parent end-node)
                top-level-nodes (->> (filter #(= (get-in end-node-parent [:data :db/id])
                                                 (get-in % [:block/parent :db/id])) blocks)
                                     (map outliner-core/block))]
            (outliner-core/indent-outdent-nodes top-level-nodes (= direction :right))
            (let [opts {:key :block/change
                        :data blocks}]
              (db/refresh! repo opts)
              (let [blocks (doall
                            (map
                             (fn [block]
                               (when-let [id (gobj/get block "id")]
                                 (when-let [block (gdom/getElement id)]
                                   (dom/add-class! block "selected noselect")
                                   block)))
                             blocks-dom-nodes))]
                (state/set-selection-blocks! blocks)))))))))

(defn- get-link
  [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "[%s](%s)" label link)
      :org (util/format "[[%s][%s]]" link label)
      nil)))

(defn handle-command-input
  [command id format m pos]
  (case command
    :link
    (let [{:keys [link label]} m]
      (if (and (string/blank? link)
               (string/blank? label))
        nil
        (insert-command! id
                         (get-link format link label)
                         format
                         {:last-pattern (str commands/slash "link")})))
    nil)

  (state/set-editor-show-input! nil)

  (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
    (when-let [input (gdom/getElement id)]
      (.focus input)
      (util/move-cursor-to input saved-cursor))))

(defn open-block!
  [first?]
  (fn [e]
    (let [edit-id (state/get-last-edit-input-id)
          block-id (when edit-id (subs edit-id (- (count edit-id) 36)))
          last-edit-block (first (array-seq (js/document.getElementsByClassName block-id)))
          nodes (array-seq (js/document.getElementsByClassName "ls-block"))
          first-node (first nodes)
          node (cond
                 last-edit-block
                 last-edit-block
                 first?
                 first-node
                 :else
                 (when-let [blocks-container (util/rec-get-blocks-container first-node)]
                   (let [nodes (dom/by-class blocks-container "ls-block")]
                     (last nodes))))]
      (when node
        (state/clear-selection!)
        (unhighlight-blocks!)
        (let [block-id (and node (dom/attr node "blockid"))
              edit-block-id (string/replace (gobj/get node "id") "ls-block" "edit-block")
              block-id (medley/uuid block-id)]
          (when-let [block (or (db/entity [:block/uuid block-id])
                               {:block/uuid block-id})]
            (edit-block! block
                         :max
                         (:block/format block)
                         edit-block-id)))))))

(defn get-search-q
  []
  (when-let [id (state/get-edit-input-id)]
    (when-let [input (gdom/getElement id)]
      (let [current-pos (:pos (util/get-caret-pos input))
            pos (:editor/last-saved-cursor @state/state)
            edit-content (or (state/sub [:editor/content id]) "")]
        (or
         @*selected-text
         (util/safe-subs edit-content pos current-pos))))))

(defn close-autocomplete-if-outside
  [input]
  (when (and input
             (or (state/get-editor-show-page-search?)
                 (state/get-editor-show-page-search-hashtag?)
                 (state/get-editor-show-block-search?)))
    (when-let [q (get-search-q)]
      (let [value (gobj/get input "value")
            pos (:editor/last-saved-cursor @state/state)
            current-pos (:pos (util/get-caret-pos input))]
        (when (or (< current-pos pos)
                  (string/includes? q "]")
                  (string/includes? q ")"))
          (state/set-editor-show-block-search! false)
          (state/set-editor-show-page-search! false)
          (state/set-editor-show-page-search-hashtag! false))))))

(defn save!
  []
  (when-let [repo (state/get-current-repo)]
    (save-current-block!)

    (when (string/starts-with? repo "https://") ; git repo
      (repo-handler/auto-push!))))

(defn resize-image!
  [block-id metadata full_text size]
  (let [new-meta (merge metadata size)
        image-part (first (string/split full_text #"\{"))
        new-full-text (str image-part (pr-str new-meta))
        block (db/pull [:block/uuid block-id])
        value (:block/content block)
        new-value (string/replace value full_text new-full-text)]
    (save-block-aux! block new-value (:block/format block) {})))

(defn- mark-last-input-time!
  [repo]
  (when repo
    (state/set-editor-last-input-time! repo (util/time-ms))
    (db/clear-repo-persistent-job! repo)))

(defonce *auto-save-timeout (atom nil))
(defn edit-box-on-change!
  [e block id]
  (let [value (util/evalue e)
        current-pos (util/get-input-pos (gdom/getElement id))
        repo (or (:block/repo block)
                 (state/get-current-repo))]
    (state/set-edit-content! id value false)
    (when @*auto-save-timeout
      (js/clearTimeout @*auto-save-timeout))
    (mark-last-input-time! repo)
    (reset! *auto-save-timeout
            (js/setTimeout
             (fn []
               (when (state/input-idle? repo)
                 (state/set-editor-op! :auto-save)
                 (save-current-block! {})
                 (state/set-editor-op! nil)))
             500))
    (let [input (gdom/getElement id)
          native-e (gobj/get e "nativeEvent")
          last-input-char (util/nth-safe value (dec current-pos))]
      (case last-input-char
        "/"
        ;; TODO: is it cross-browser compatible?
        (when (not= (gobj/get native-e "inputType") "insertFromPaste")
          (when-let [matched-commands (seq (get-matched-commands input))]
            (reset! commands/*slash-caret-pos (util/get-caret-pos input))
            (reset! commands/*show-commands true)))
        "<"
        (when-let [matched-commands (seq (get-matched-block-commands input))]
          (reset! commands/*angle-bracket-caret-pos (util/get-caret-pos input))
          (reset! commands/*show-block-commands true))
        nil))))

(defn block-on-chosen-handler
  [input id q format]
  (fn [chosen _click?]
    (state/set-editor-show-block-search! false)
    (let [uuid-string (str (:block/uuid chosen))]

      ;; block reference
      (insert-command! id
                       (util/format "((%s))" uuid-string)
                       format
                       {:last-pattern (str "((" (if @*selected-text "" q))
                        :postfix-fn   (fn [s] (util/replace-first "))" s ""))})

      ;; Save it so it'll be parsed correctly in the future
      (set-block-property! (:block/uuid chosen)
                           :id
                           uuid-string)

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/set-editor-show-block-search! false)
    (util/cursor-move-forward input 2)))

(defn- get-block-tree-insert-pos-at-point
  "return [target-block sibling? delete-editing-block? editing-block]"
  []
  (when-let [editing-block (db/pull (:db/id (state/get-edit-block)))]
    (let [input (gdom/getElement (state/get-edit-input-id))
          pos (util/get-input-pos input)
          value (:value (get-state))
          [fst-block-text snd-block-text] (compute-fst-snd-block-text value pos)
          parent (:db/id (:block/parent editing-block))
          parent-block (db/pull parent)
          left (:db/id (:block/left editing-block))
          left-block (db/pull left)
          [_ _ config] (state/get-editor-args)
          block-id (:block/uuid editing-block)
          block-self? (block-self-alone-when-insert? config block-id)
          has-children? (db/has-children? (state/get-current-repo)
                                          (:block/uuid editing-block))
          collapsed? (:collapsed (:block/properties editing-block))]
      (conj (match (mapv boolean [(seq fst-block-text) (seq snd-block-text)
                                  block-self? has-children? (= parent left) collapsed?])
                   ;; when zoom at editing-block
                   [_ _ true _ _ _]
                   [editing-block false false]

                   ;; insert after editing-block
                   [true _ false true _ false]
                   [editing-block false false]
                   [true _ false true _ true]
                   [editing-block true false]
                   [true _ false false _ _]
                   [editing-block true false]
                   [false false false true _ false]
                   [editing-block false false]
                   [false false false true _ true]
                   [editing-block true false]
                   [false false false false _ _]
                   [editing-block true true]

                   ;; insert before editing-block
                   [false true false _ true _]
                   [parent-block false false]
                   [false true false _ false _]
                   [left-block true false])
            editing-block))))

(defn- paste-block-tree-at-point-edit-aux
  [uuid file page exclude-properties format content-update-fn]
  (fn [block]
    (outliner-core/block
     (let [[new-content new-title]
           (if content-update-fn
             (let [new-content (content-update-fn (:block/content block))
                   new-title (or (->> (mldoc/->edn
                                       (str (case format
                                              :markdown "- "
                                              :org "* ")
                                            (if (seq (:block/title block)) "" "\n")
                                            new-content)
                                       (mldoc/default-config format))
                                      (ffirst)
                                      (second)
                                      (:title))
                                 (:block/title block))]
               [new-content new-title])
             [(:block/content block) (:block/title block)])
           new-content
           (->> new-content
                (property/remove-property format "id")
                (property/remove-property format "custom_id"))
           m (merge (dissoc block
                            :block/pre-block?
                            :block/uuid
                            :db/id
                            :block/left
                            :block/parent
                            :block/file)
                    {:block/uuid uuid
                     :block/page (select-keys page [:db/id])
                     :block/format format
                     :block/properties (apply dissoc (:block/properties block)
                                         (concat [:id :custom_id :custom-id]
                                                 exclude-properties))
                     :block/meta (dissoc (:block/meta block) :start-pos :end-pos)
                     :block/content new-content
                     :block/title new-title
                     :block/path-refs (->> (cons (:db/id page) (:block/path-refs block))
                                           (remove nil?))})]
       (if file
         (assoc m :block/file (select-keys file [:db/id]))
         m)))))

(defn- paste-block-tree-at-point
  ([tree exclude-properties] (paste-block-tree-at-point tree exclude-properties nil))
  ([tree exclude-properties content-update-fn]
   (let [repo (state/get-current-repo)
         page (:block/page (db/entity (:db/id (state/get-edit-block))))
         file (:block/file page)]
     (when-let [[target-block sibling? delete-editing-block? editing-block]
                (get-block-tree-insert-pos-at-point)]
       (let [target-block (outliner-core/block target-block)
             editing-block (outliner-core/block editing-block)
             format (or (:block/format target-block) (state/get-preferred-format))
             new-block-uuids (atom #{})
             metadata-replaced-blocks
             (zip/root
              (loop [loc (zip/vector-zip tree)]
                (if (zip/end? loc)
                  loc
                  (if (vector? (zip/node loc))
                    (recur (zip/next loc))
                    (let [uuid (random-uuid)]
                      (swap! new-block-uuids (fn [acc uuid] (conj acc uuid)) uuid)
                      (recur (zip/next (zip/edit
                                        loc
                                        (paste-block-tree-at-point-edit-aux
                                         uuid file page exclude-properties format content-update-fn)))))))))
             _ (outliner-core/save-node editing-block)
             _ (outliner-core/insert-nodes metadata-replaced-blocks target-block sibling?)
             _ (when delete-editing-block?
                 (when-let [id (:db/id (outliner-core/get-data editing-block))]
                   (outliner-core/delete-node (outliner-core/block (db/pull id)) true)))
             new-blocks (db/pull-many repo '[*] (map (fn [id] [:block/uuid id]) @new-block-uuids))]
         (db/refresh! repo {:key :block/insert :data new-blocks}))))))

(defn template-on-chosen-handler
  [_input id _q format _edit-block _edit-content]
  (fn [[_template db-id] _click?]
    (let [repo (state/get-current-repo)
          block (db/entity db-id)
          block-uuid (:block/uuid block)
          including-parent? (not (false? (:including-parent (:block/properties block))))
          blocks (if including-parent? (db/get-block-and-children repo block-uuid) (db/get-block-children repo block-uuid))
          level-blocks (vals (blocks-with-level blocks))
          grouped-blocks (group-by #(= db-id (:db/id %)) level-blocks)
          root-block (or (first (get grouped-blocks true)) (assoc (db/pull db-id) :level 1))
          blocks-exclude-root (get grouped-blocks false)
          sorted-blocks (tree/sort-blocks blocks-exclude-root root-block)
          result-blocks (if including-parent? sorted-blocks (drop 1 sorted-blocks))
          tree (blocks-vec->tree result-blocks)]
      (insert-command! id "" format {})
      (paste-block-tree-at-point tree [:template :including-parent]
                                 (fn [content]
                                   (->> content
                                        (property/remove-property format "template")
                                        (property/remove-property format "including-parent")
                                        template/resolve-dynamic-template!)))
      (clear-when-saved!)
      (db/refresh! repo {:key :block/insert :data [(db/pull db-id)]}))
    (when-let [input (gdom/getElement id)]
      (.focus input))))

(defn parent-is-page?
  [{{:block/keys [parent page]} :data :as node}]
  {:pre [(tree/satisfied-inode? node)]}
  (= parent page))

(defn outdent-on-enter
  [node]
  (when-not (parent-is-page? node)
    (let [parent-node (tree/-get-parent node)]
      (outliner-core/move-subtree node parent-node true)))
  (let [repo (state/get-current-repo)]
    (db/refresh! repo {:key :block/change :data [(:data node)]})))

(defn- last-top-level-child?
  [{:keys [id config]} current-node]
  (when id
    (when-let [entity (if (util/uuid-string? (str id))
                        (db/entity [:block/uuid (uuid id)])
                        (db/entity [:block/name (string/lower-case id)]))]
      (= (:block/uuid entity) (tree/-get-parent-id current-node)))))

(defn- keydown-new-block
  [state]
  (when-not (auto-complete?)
    (let [{:keys [block config]} (get-state)]
      (when (and block
                 (not (:custom-query? config)))
        (let [content (state/get-edit-content)
              current-node (outliner-core/block block)
              has-right? (-> (tree/-get-right current-node)
                             (tree/satisfied-inode?))]
          (if (and
               (string/blank? content)
               (not has-right?)
               (not (last-top-level-child? config current-node)))
            (outdent-on-enter current-node)
            (profile
             "Insert block"
             (insert-new-block! state))))))))

(defn- keydown-new-line
  []
  (when-not (auto-complete?)
    (let [^js input (state/get-input)
          selected-start (gobj/get input "selectionStart")
          selected-end (gobj/get input "selectionEnd")
          value (.-value input)
          s1 (subs value 0 selected-start)
          s2 (subs value selected-end)]
      (state/set-edit-content! (state/get-edit-input-id)
                               (str s1 "\n" s2))
      (util/move-cursor-to input (inc selected-start)))))

(defn keydown-new-block-handler [state e]
  (if (state/get-new-block-toggle?)
    (keydown-new-line)
    (do
      (.preventDefault e)
      (keydown-new-block state))))

(defn keydown-new-line-handler [state e]
  (if (state/get-new-block-toggle?)
    (keydown-new-block state)
    (do
      (.preventDefault e)
      (keydown-new-line))))

(defn- select-first-last
  "Select first or last block in viewpoint"
  [direction]
  (let [f (case direction :up last :down first)
        block (->> (util/get-blocks-noncollapse)
                   (f))]
    (when block
      (.scrollIntoView block #js {:behavior "smooth" :block "center"})
      (exit-editing-and-set-selected-blocks! [block]))))

(defn- select-up-down [direction]
  (let [selected (first (state/get-selection-blocks))
        f (case direction
                :up get-prev-block-non-collapsed
                :down get-next-block-non-collapsed)
        sibling-block (f selected)]
    (when (and sibling-block (dom/attr sibling-block "blockid"))
      (clear-selection! nil)
      (.scrollIntoView sibling-block #js {:behavior "smooth" :block "center"})
      (exit-editing-and-set-selected-blocks! [sibling-block]))))

(defn- move-cross-boundrary-up-down
  [direction]
  (let [input (state/get-input)
        line-pos (util/get-first-or-last-line-pos input)
        repo (state/get-current-repo)
        f (case direction
                :up get-prev-block-non-collapsed
                :down get-next-block-non-collapsed)
        sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))
        {:block/keys [uuid content format]} (state/get-edit-block)]
    (when sibling-block
      (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
        (let [value (state/get-edit-content)]
          (when (not= (clean-content! format content)
                      (string/trim value))
            (save-block! repo uuid value)))

        (let [new-id (cljs.core/uuid sibling-block-id)
              block (db/pull repo '[*] [:block/uuid new-id])]
          (edit-block! block
                       [direction line-pos]
                       format
                       new-id))))))

(defn keydown-up-down-handler
  [direction]
  (let [input (state/get-input)
        line-height (util/get-textarea-line-height input)
        selected-start (.-selectionStart input)
        selected-end (.-selectionEnd input)
        up? (= direction :up)
        down? (= direction :down)]
    (cond
      (not= selected-start selected-end)
      (if up?
        (util/set-caret-pos! input selected-start)
        (util/set-caret-pos! input selected-end))

      (or (and up? (util/textarea-cursor-first-row? input line-height))
          (and down? (util/textarea-cursor-end-row? input line-height)))
      (move-cross-boundrary-up-down direction)

      :else
      (if up?
        (util/move-cursor-up input)
        (util/move-cursor-down input)))))

(defn- move-to-block-when-cross-boundrary
  [direction]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:block/keys [format uuid] :as block} (state/get-edit-block)
        id (state/get-edit-input-id)
        repo (state/get-current-repo)]
    (let [f (if up? get-prev-block-non-collapsed get-next-block-non-collapsed)
          sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))]
      (when sibling-block
        (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
          (let [content (:block/content block)
                value (state/get-edit-content)]
            (when (not= (clean-content! format content)
                        (string/trim value))
              (save-block! repo uuid value)))
          (let [block (db/pull repo '[*] [:block/uuid (cljs.core/uuid sibling-block-id)])]
            (edit-block! block pos format id)))))))

(defn keydown-arrow-handler
  [direction]
  (let [input (state/get-input)
        element js/document.activeElement
        selected-start (.-selectionStart input)
        selected-end (.-selectionEnd input)
        left? (= direction :left)
        right? (= direction :right)]
    (when (= input element)
      (cond
        (not= selected-start selected-end)
        (if left?
          (util/set-caret-pos! input selected-start)
          (util/set-caret-pos! input selected-end))

        (or (and left? (util/input-start? input))
            (and right? (util/input-end? input)))
        (move-to-block-when-cross-boundrary direction)

        :else
        (if left?
          (util/cursor-move-back input 1)
          (util/cursor-move-forward input 1))))))

(defn- delete-and-update [^js input start end]
  (.setRangeText input "" start end)
  (state/set-edit-content! (state/get-edit-input-id) (.-value input)))

(defn- delete-concat [current-block]
  (let [input-id (state/get-edit-input-id)
        ^js input (state/get-input)
        current-pos (util/get-input-pos input)
        value (gobj/get input "value")
        repo (state/get-current-repo)
        right (outliner-core/get-right-node (outliner-core/block current-block))
        current-block-has-children? (db/has-children? repo (:block/uuid current-block))
        collapsed? (:collapsed (:block/properties current-block))
        first-child (:data (tree/-get-down (outliner-core/block current-block)))
        next-block (if (or collapsed? (not current-block-has-children?))
                     (:data right)
                     first-child)]
    (cond
      (and collapsed? right (db/has-children? repo (tree/-get-id right)))
      nil

      (and (not collapsed?) first-child (db/has-children? repo (:block/uuid first-child)))
      nil

      :else
      (do
        (delete-block-aux! next-block false)
        (state/set-edit-content! input-id (str value "" (:block/content next-block)))
        (util/move-cursor-to input current-pos)))))

(defn keydown-delete-handler
  [e]
  (let [^js input (state/get-input)
        current-pos (util/get-input-pos input)
        value (gobj/get input "value")
        end? (= current-pos (count value))
        current-block (state/get-edit-block)
        selected-start (gobj/get input "selectionStart")
        selected-end (gobj/get input "selectionEnd")]
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
        current-pos (:pos (util/get-caret-pos input))
        value (gobj/get input "value")
        deleted (and (> current-pos 0)
                     (util/nth-safe value (dec current-pos)))
        selected-start (gobj/get input "selectionStart")
        selected-end (gobj/get input "selectionEnd")
        block-id (:block/uuid (state/get-edit-block))
        page (state/get-current-page)
        repo (state/get-current-repo)]
    (mark-last-input-time! repo)
    (cond
      (not= selected-start selected-end)
      (do
        (util/stop e)
        (when cut?
          (js/document.execCommand "copy"))
        (delete-and-update input selected-start selected-end))

      (and (zero? current-pos)
           ;; not the top block in a block page
           (not (and page
                     (util/uuid-string? page)
                     (= (medley/uuid page) block-id))))
      (do
        (util/stop e)
        (delete-block! repo e false))

      (and (> current-pos 1)
           (= (util/nth-safe value (dec current-pos)) commands/slash))
      (do
        (util/stop e)
        (reset! *slash-caret-pos nil)
        (reset! *show-commands false)
        (delete-and-update input (dec current-pos) current-pos))

      (and (> current-pos 1)
           (= (util/nth-safe value (dec current-pos)) commands/angle-bracket))
      (do
        (util/stop e)
        (reset! *angle-bracket-caret-pos nil)
        (reset! *show-block-commands false)
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
          (state/set-editor-show-page-search! false)

          (and (= deleted "(") (state/get-editor-show-block-search?))
          (state/set-editor-show-block-search! false)

          :else
          nil))

      ;; deleting hashtag
      (and (= deleted "#") (state/get-editor-show-page-search-hashtag?))
      (do
        (state/set-editor-show-page-search-hashtag! false)
        (delete-and-update input (dec current-pos) current-pos))

      ;; just delete
      :else
      (do
        (util/stop e)
        (delete-and-update input (dec current-pos) current-pos)))))

(defn indent-outdent
  [indent?]
  (state/set-editor-op! :indent-outdent)
  (let [{:keys [block]} (get-state)]
    (when block
      (let [current-node (outliner-core/block block)]
        (outliner-core/indent-outdent-nodes [current-node] indent?)
        (let [repo (state/get-current-repo)]
          (db/refresh! repo
                       {:key :block/change :data [(:data current-node)]}))))
  (state/set-editor-op! :nil)))

(defn keydown-tab-handler
  [direction]
  (fn [e]
    (cond
      (state/editing?)
      (let [input (state/get-input)
            pos (:pos (util/get-caret-pos input))]
        (when (and (not (state/get-editor-show-input))
                   (not (state/get-editor-show-date-picker?))
                   (not (state/get-editor-show-template-search?)))
          (util/stop e)
          (indent-outdent (not (= :left direction)))
          (and input pos
               (when-let [input (state/get-input)]
                 (util/move-cursor-to input pos)))))

      (state/selection?)
      (do
        (util/stop e)
        (on-tab direction))

      :else nil)))

(defn keydown-not-matched-handler
  [format]
  (fn [e key-code]
    (let [input-id (state/get-edit-input-id)
          input (state/get-input)
          key (gobj/get e "key")
          value (gobj/get input "value")
          ctrlKey (gobj/get e "ctrlKey")
          metaKey (gobj/get e "metaKey")
          pos (util/get-input-pos input)]
      (cond
        (or ctrlKey metaKey)
        nil

        (and (= key "#")
             (and
              (> pos 0)
              (= "#" (util/nth-safe value (dec pos)))))
        (state/set-editor-show-page-search-hashtag! false)

        (and
         (contains? (set/difference (set (keys reversed-autopair-map))
                                    #{"`"})
                    key)
         (= (get-current-input-char input) key))
        (do
          (util/stop e)
          (util/cursor-move-forward input 1))

        (contains? (set (keys autopair-map)) key)
        (do
          (util/stop e)
          (autopair input-id key format nil)
          (cond
            (surround-by? input "[[" "]]")
            (do
              (commands/handle-step [:editor/search-page])
              (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
            (surround-by? input "((" "))")
            (do
              (commands/handle-step [:editor/search-block :reference])
              (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
            :else
            nil))

        (or
         (surround-by? input "#" " ")
         (surround-by? input "#" :end)
         (= key "#"))
        (do
          (commands/handle-step [:editor/search-page-hashtag])
          (state/set-last-pos! (:pos (util/get-caret-pos input)))
          (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

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

;; key up
(defn keyup-handler
  [state input input-id search-timeout]
  (fn [e key-code]
    (let [k (gobj/get e "key")
          format (:format (get-state))
          current-pos (util/get-input-pos input)
          value (gobj/get input "value")
          c (util/nth-safe value (dec current-pos))]
      (when-not (state/get-editor-show-input)
        (when (= c " ")
          (when (or (= (util/nth-safe value (dec (dec current-pos))) "#")
                    (not (state/get-editor-show-page-search?)))
            (state/set-editor-show-page-search-hashtag! false)))

        (when (and @*show-commands (not= key-code 191)) ; not /
          (let [matched-commands (get-matched-commands input)]
            (if (seq matched-commands)
              (do
                (reset! *show-commands true)
                (reset! commands/*matched-commands matched-commands))
              (reset! *show-commands false))))
        (when (and @*show-block-commands (not= key-code 188)) ; not <
          (let [matched-block-commands (get-matched-block-commands input)]
            (if (seq matched-block-commands)
              (cond
                (= key-code 9)       ;tab
                (when @*show-block-commands
                  (util/stop e)
                  (insert-command! input-id
                                   (last (first matched-block-commands))
                                   format
                                   {:last-pattern commands/angle-bracket}))

                :else
                (reset! commands/*matched-block-commands matched-block-commands))
              (reset! *show-block-commands false))))
        (when (nil? @search-timeout)
          (close-autocomplete-if-outside input))))))

(defn editor-on-click!
  [id]
  (fn [_e]
    (let [input (gdom/getElement id)]
      (close-autocomplete-if-outside input))))

(defn editor-on-change!
  [block id search-timeout]
  (fn [e]
    (if (state/sub :editor/show-block-search?)
      (let [blocks-count (or (db/blocks-count) 0)
            timeout (if (> blocks-count 2000) 300 100)]
        (when @search-timeout
          (js/clearTimeout @search-timeout))
        (reset! search-timeout
                (js/setTimeout
                 #(edit-box-on-change! e block id)
                 timeout)))
      (edit-box-on-change! e block id))))


(defn- get-current-page-format
  []
  (when-let [page (state/get-current-page)]
    (db/get-page-format page)))

(defn- paste-text-parseable
  [format text]
  (let [tree (->>
              (block/extract-blocks
               (mldoc/->edn text (mldoc/default-config format)) text true format))
        min-level (apply min (mapv :block/level tree))
        prefix-level (if (> min-level 1) (- min-level 1) 0)
        tree* (->> tree
                   (mapv #(assoc % :level (- (:block/level %) prefix-level)))
                   (blocks-vec->tree))]
    (paste-block-tree-at-point tree* [])))

(defn- paste-segmented-text
  [format text]
  (let [paragraphs (string/split text #"(?:\r?\n){2,}")
        updated-paragraphs
        (string/join "\n"
                     (mapv (fn [p] (->> (string/trim p)
                                        ((fn [p]
                                           (if (util/safe-re-find (if (= format :org)
                                                          #"\s*\*+\s+"
                                                          #"\s*-\s+") p)
                                             p
                                             (str (if (= format :org) "* " "- ") p))))))
                           paragraphs))]
    (paste-text-parseable format updated-paragraphs)))

(defn- paste-text
  [text e]
  (let [repo (state/get-current-repo)
        page (or (db/entity [:block/name (state/get-current-page)])
                 (db/entity [:block/original-name (state/get-current-page)])
                 (:block/page (db/entity (:db/id (state/get-edit-block)))))
        copied-blocks (state/get-copied-blocks)
        copied-block-tree (:copy/block-tree copied-blocks)]
    (if (and
         (:copy/content copied-blocks)
         (not (string/blank? text))
         (= (string/trim text) (string/trim (:copy/content copied-blocks))))
      (do
        ;; copy from logseq internally
        (paste-block-tree-at-point copied-block-tree [])
        (util/stop e))

      (do
        ;; from external
        (let [format (or (db/get-page-format (state/get-current-page)) :markdown)]
          (match [format
                  (nil? (util/safe-re-find #"(?m)^\s*(?:[-+*]|#+)\s+" text))
                  (nil? (util/safe-re-find #"(?m)^\s*\*+\s+" text))
                  (nil? (util/safe-re-find #"(?:\r?\n){2,}" text))]
            [:markdown false _ _]
            (do
              (paste-text-parseable format text)
              (util/stop e))

            [:org _ false _]
            (do
              (paste-text-parseable format text)
              (util/stop e))

            [:markdown true _ false]
            (do
              (paste-segmented-text format text)
              (util/stop e))

            [:markdown true _ true]
            (do)

            [:org _ true false]
            (do
              (paste-segmented-text format text)
              (util/stop e))
            [:org _ true true]
            (do)))))))

(defn editor-on-paste!
  [id]
  (fn [e]
    (if-let [handled
               (let [pick-one-allowed-item
                     (fn [items]
                       (if (util/electron?)
                         (let [existed-file-path (js/window.apis.getFilePathFromClipboard)
                               existed-file-path (if (and
                                                      (string? existed-file-path)
                                                      (not util/mac?)
                                                      (not util/win32?)) ; FIXME: linux
                                                   (when (util/safe-re-find #"^(/[^/ ]*)+/?$" existed-file-path)
                                                     existed-file-path)
                                                   existed-file-path)
                               has-file-path? (not (string/blank? existed-file-path))
                               has-image? (js/window.apis.isClipboardHasImage)]
                           (if (or has-image? has-file-path?)
                             [:asset (js/File. #js[] (if has-file-path? existed-file-path "image.png"))]))

                         (when (and items (.-length items))
                           (let [files (. (js/Array.from items) (filter #(= (.-kind %) "file")))
                                 it (gobj/get files 0) ;;; TODO: support multiple files
                                 mime (and it (.-type it))]
                             (cond
                               (contains? #{"image/jpeg" "image/png" "image/jpg" "image/gif"} mime) [:asset (. it getAsFile)])))))
                     clipboard-data (gobj/get e "clipboardData")
                     items (or (.-items clipboard-data)
                               (.-files clipboard-data))
                     picked (pick-one-allowed-item items)]
                 (if (get picked 1)
                   (match picked
                     [:asset file] (set-asset-pending-file file))))]
      (util/stop e)
      (paste-text (.getData (gobj/get e "clipboardData") "text") e))))

(defn- cut-blocks-and-clear-selections!
  [copy?]
  (cut-selection-blocks copy?)
  (clear-selection! nil))

(defn shortcut-copy-selection
  [e]
  (copy-selection-blocks))

(defn shortcut-cut-selection
  [e]
  (util/stop e)
  (cut-blocks-and-clear-selections! true))

(defn shortcut-delete-selection
  [e]
  (util/stop e)
  (cut-blocks-and-clear-selections! false))

;; credits to @pengx17
(defn- copy-current-block-ref
  []
  (when-let [current-block (state/get-edit-block)]
    (when-let [block-id (:block/uuid current-block)]
      (copy-block-ref! block-id #(str "((" % "))"))
      (notification/show!
       [:div
        [:span.mb-1.5 "Block ref copied!"]
        [:div [:code.whitespace-nowrap (str "((" block-id "))")]]]
       :success true
       ;; use uuid to make sure there is only one toast a time
       (str "copied-block-ref:" block-id)))))

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
            selected-start (.-selectionStart input)
            selected-end (.-selectionEnd input)]
        (if (= selected-start selected-end)
          (copy-current-block-ref)
          (js/document.execCommand "copy")))

      :else
      (js/document.execCommand "copy"))))


(defn shortcut-cut
  "shortcut cut action:
  * when in selection mode, cut selected blocks
  * when in edit mode with text selected, cut selected text
  * otherwise same as delete shortcut"
  [e]
  (cond
    (state/selection?)
    (shortcut-cut-selection e)

    (state/editing?)
    (keydown-backspace-handler true e)))

(defn delete-selection
  [e]
  (when (state/selection?)
    (shortcut-delete-selection e)))

(defn editor-delete
  [_state e]
  (when (state/editing?)
    (keydown-delete-handler e)))

(defn editor-backspace
  [_state e]
  (when (state/editing?)
    (keydown-backspace-handler false e)))

(defn shortcut-up-down [direction]
  (fn [e]
    (when-not (auto-complete?)
      (util/stop e)
      (cond
        (state/editing?)
        (keydown-up-down-handler direction)

        (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
        (select-up-down direction)

        :else
        (select-first-last direction)))))

(defn open-selected-block!
  [direction e]
  (when-let [block-id (some-> (state/get-selection-blocks)
                              first
                              (dom/attr "blockid")
                              medley/uuid)]
    (util/stop e)
    (let [block {:block/uuid block-id}
          left? (= direction :left)]
      (edit-block! block
                   (if left? 0 :max)
                   (:block/format block)
                   block-id))))

(defn shortcut-left-right [direction]
  (fn [e]
    (when-not (auto-complete?)
      (util/stop e)
      (cond
        (state/editing?)
        (keydown-arrow-handler direction)

        (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
        (open-selected-block! direction e)

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
  (util/move-cursor-to (state/get-input) 0))

(defn end-of-block []
  (util/move-cursor-to-end (state/get-input)))

(defn cursor-forward-word []
  (util/move-cursor-forward-by-word (state/get-input)))

(defn cursor-backward-word []
  (util/move-cursor-backward-by-word (state/get-input)))

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

(defn all-blocks-with-level
  "Return all blocks associated with correct level
   if :collapse? true, return without any collapsed children
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
  [{:keys [collapse?] :or {collapse? false}}]
  (let [page (state/get-current-page)]
    (->>
     (-> page
         (db/get-page-blocks-no-cache)
         (tree/blocks->vec-tree page))

     (#(if collapse?
         (w/postwalk
          (fn [x]
            (if (and (map? x) (-> x :block/properties :collapsed))
              (assoc x :block/children []) x)) %) %))

     (mapcat (fn [x] (tree-seq map? :block/children x)))

     (map (fn [x] (dissoc x :block/children))))))

(defn collapse-block! [block-id]
  (when (db-model/has-children? block-id)
    (set-block-property! block-id :collapsed true)))

(defn expand-block! [block-id]
  (remove-block-property! block-id :collapsed))

(defn expand!
  []
  (cond
    (state/editing?)
    (when-let [block-id (:block/uuid (state/get-edit-block))]
      (expand-block! block-id))

    (state/selection?)
    (do
      (->> (get-selected-blocks-with-children)
           (map (fn [dom]
                  (-> (dom/attr dom "blockid")
                      medley/uuid
                      expand-block!)))
           doall)
      (clear-selection! nil))

    :else
    ;; expand one level
    (let [blocks-with-level (all-blocks-with-level {})
          max-level (apply max (map :block/level blocks-with-level))]
      (loop [level 1]
        (if (> level max-level)
          nil
          (let [blocks-to-expand (->> blocks-with-level
                                 (filter (fn [b] (= (:block/level b) level)))
                                 (filter (fn [{:block/keys [properties]}]
                                           (contains? properties :collapsed))))]
            (if (empty? blocks-to-expand)
              (recur (inc level))
              (doseq [{:block/keys [uuid]} blocks-to-expand]
                (expand-block! uuid)))))))))


(defn collapse!
  []
  (cond
    (state/editing?)
    (when-let [block-id (:block/uuid (state/get-edit-block))]
      (collapse-block! block-id))

    (state/selection?)
    (do
      (->> (get-selected-blocks-with-children)
           (map (fn [dom]
                  (-> (dom/attr dom "blockid")
                      medley/uuid
                      collapse-block!)))
           doall)
      (clear-selection! nil))

    :else
    ;; collapse by one level from outside
    (let [blocks-with-level
          (all-blocks-with-level {:collapse? true})
          max-level (apply max (map :block/level blocks-with-level))]
      (loop [level (dec max-level)]
        (if (zero? level)
          nil
          (let [blocks-to-collapse
                (->> blocks-with-level
                     (filter (fn [b] (= (:block/level b) level)))
                     (remove (fn [b]
                               (or (not (db-model/has-children? (:block/uuid b)))
                                   (-> b :block/properties :collapsed)))))]
            (if (empty? blocks-to-collapse)
              (recur (dec level))
              (doseq [{:block/keys [uuid]} blocks-to-collapse]
                (collapse-block! uuid)))))))))
