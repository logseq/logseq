(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.expand :as expand]
            [frontend.handler.block :as block-handler]
            [frontend.format.mldoc :as mldoc]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.image :as image]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
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
            [dommy.core :as d]
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
            [frontend.date :as date]
            [frontend.handler.repeated :as repeated]
            [frontend.template :as template]
            [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [cljs.core.match :refer-macros [match]]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.debug :as debug]))

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

(defn focus-on-block!
  [block-id]
  (when block-id
    (route-handler/redirect! {:to :page
                              :path-params {:name (str block-id)}})))

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
  ([id markup]
   (restore-cursor-pos! id markup false))
  ([id markup dummy?]
   (when-let [node (gdom/getElement (str id))]
     (when-let [cursor-range (state/get-cursor-range)]
       (when-let [range cursor-range]
         (let [pos (diff/find-position markup range)]
           (util/set-caret-pos! node pos)))))))

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
            (subs 0 pos))))

;; id: block dom id, "ls-block-counter-uuid"
(defn edit-block!
  ([block pos format id]
   (edit-block! block pos format id nil))
  ([block pos format id {:keys [custom-content tail-len]
                         :or {tail-len 0}}]
   (when-not config/publishing?
     (when-let [block-id (:block/uuid block)]
       (let [block (db/pull [:block/uuid block-id])
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
                          (subs content 0 pos))]
         (do
           (clear-selection! nil)
           (state/set-editing! edit-input-id content block text-range)))))))

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
           (= "Properties" (ffirst (:block/body block)))) ; page properties
    (let [page-properties (second (first (:block/body block)))
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

(defn- wrap-parse-block
  [{:block/keys [content format] :as block}]
  (let [ast (mldoc/->edn (string/trim content) (mldoc/default-config format))
        first-elem-type (first (ffirst ast))
        properties? (= "Properties" first-elem-type)
        heading? (= "Paragraph" first-elem-type)
        content (string/triml content)
        content' (if properties?
                   content
                   (str (config/get-block-pattern format) (if heading? " " "\n") content))
        block (block/parse-block (assoc block :block/content content'))
        block (attach-page-properties-if-exists! block)]
    (-> block
       (dissoc :block/top?
               :block/block-refs-count)
       (assoc :block/content content))))

(defn- save-block-inner!
  [repo block e value opts]
  (let [block (assoc block :block/content value)]
    (profile
     "Save block: "
     (do
       (->
        (wrap-parse-block block)
        (outliner-core/block)
        (outliner-core/save-node))
       (let [opts {:key :block/change
                   :data [block]}]
         (db/refresh! repo opts))))

    (repo-handler/push-if-auto-enabled! repo)))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys []
     :as opts}]
   (let [{:block/keys [uuid content file page format repo content properties]} block
         repo (or repo (state/get-current-repo))
         e (db/entity repo [:block/uuid uuid])
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         block-id (when (map? properties) (get properties "id"))]
     (cond
       (another-block-with-same-id-exists? uuid block-id)
       (notification/show!
        [:p.content
         (util/format "Block with the id % already exists!" block-id)]
        :error)

       :else
       (let [content-changed? (not= (string/trim content) (string/trim value))]
         (when (and content-changed? page)
           (save-block-inner! repo block e value opts)))))))

(defn- compute-fst-snd-block-text
  [value pos]
  (let [fst-block-text (subs value 0 pos)
        snd-block-text (string/triml (subs value pos))]
    [fst-block-text snd-block-text]))

;; TODO: remove later
;; (defn insert-block-to-existing-file!
;;   [repo block file page file-path file-content value fst-block-text snd-block-text pos format input {:keys [create-new-block? ok-handler new-level current-page blocks-container-id]}]
;;   (let [{:block/keys [meta pre-block?]} block
;;         original-id (:block/uuid block)
;;         block-has-children? (seq (:block/children block))
;;         edit-self? (and block-has-children? (zero? pos))
;;         ;; Compute the new value, remove id property from the second block if exists
;;         value (if create-new-block?
;;                 (str fst-block-text "\n" snd-block-text)
;;                 value)
;;         snd-block-text (text/remove-id-property snd-block-text)
;;         text-properties (if (zero? pos)
;;                           {}
;;                           (text/extract-properties fst-block-text))
;;         old-hidden-properties (select-keys (:block/properties block) text/hidden-properties)
;;         properties (merge old-hidden-properties
;;                           text-properties)
;;         value (if create-new-block?
;;                 (str
;;                  (->
;;                   (re-build-block-value block format fst-block-text properties)
;;                   (string/trimr))
;;                  "\n"
;;                  (string/triml snd-block-text))
;;                 (re-build-block-value block format value properties))
;;         value (rebuild-block-content value format)
;;         [new-content value] (new-file-content block file-content value)
;;         parse-result (block/parse-block (assoc block :block/content value))
;;         id-conflict? (= original-id (:block/uuid (:block parse-result)))
;;         {:keys [block pages start-pos end-pos]}
;;         (if id-conflict?
;;           (let [new-value (string/replace
;;                            value
;;                            (re-pattern (str "(?i):(custom_)?id: " original-id))
;;                            "")]
;;             (block/parse-block (assoc block :block/content new-value)))
;;           parse-result)
;;         blocks [block]
;;         after-blocks (rebuild-after-blocks repo file (:end-pos meta) end-pos)
;;         files [[file-path new-content]]
;;         block-retracted-attrs (when-not pre-block?
;;                                 (when-let [id (:db/id block)]
;;                                   [[:db/retractEntity id]]))
;;         _ (prn "transact-nf"
;;             [block-retracted-attrs
;;              pages
;;              (mapv (fn [b] {:block/uuid (:block/uuid b)}) blocks)
;;              blocks
;;              after-blocks])
;;         _ (prn " (first blocks) (first after-blocks)"  (first blocks) (first after-blocks))
;;         transact-fn
;;         (fn []
;;           (let [tx (concat
;;                      block-retracted-attrs
;;                      pages
;;                      (mapv (fn [b] {:block/uuid (:block/uuid b)}) blocks)
;;                      blocks
;;                      after-blocks)
;;                 opts {:key :block/insert
;;                       :data (map (fn [block] (assoc block :block/page page)) blocks)}]
;;             (do (state/update-last-edit-block)
;;                 #_(build-outliner-relation (first blocks) (first after-blocks))
;;                 (db/refresh! repo opts)
;;                 (let [files (remove nil? files)]
;;                   (when (seq files)
;;                     (file-handler/alter-files repo files opts)))))
;;           (state/set-editor-op! nil))]
;;     ;; Replace with batch transactions
;;     (state/add-tx! transact-fn)

;;     (let [blocks (remove (fn [block]
;;                            (nil? (:block/content block))) blocks)
;;           page-blocks-atom (db/get-page-blocks-cache-atom repo (:db/id page))
;;           first-block-id (:block/uuid (first blocks))
;;           [before-part after-part] (and page-blocks-atom
;;                                         (split-with
;;                                          #(not= first-block-id (:block/uuid %))
;;                                          @page-blocks-atom))
;;           after-part (rest after-part)
;;           blocks-container-id (and blocks-container-id
;;                                    (util/uuid-string? blocks-container-id)
;;                                    (medley/uuid blocks-container-id))]

;;       ;; WORKAROUND: The block won't refresh itself even if the content is empty.
;;       (when edit-self?
;;         (gobj/set input "value" ""))

;;       (when ok-handler
;;         (ok-handler
;;          (if edit-self? (first blocks) (last blocks))))

;;       ;; update page blocks cache if exists
;;       (when page-blocks-atom
;;         (reset! page-blocks-atom (->> (concat before-part blocks after-part)
;;                                       (remove nil?))))

;;       ;; update block children cache if exists
;;       (when blocks-container-id
;;         (let [blocks-atom (db/get-block-blocks-cache-atom repo blocks-container-id)
;;               [before-part after-part] (and blocks-atom
;;                                             (split-with
;;                                              #(not= first-block-id (:block/uuid %))
;;                                              @blocks-atom))
;;               after-part (rest after-part)]
;;           (and blocks-atom
;;                (reset! blocks-atom (->> (concat before-part blocks after-part)
;;                                         (remove nil?)))))))))

(defn outliner-insert-block!
  [current-block new-block child?]
  (let [dummy? (:block/dummy? current-block)
        [current-node new-node]
        (mapv outliner-core/block [current-block new-block])
        has-children? (db/has-children? (state/get-current-repo)
                                        (tree/-get-id current-node))
        sibling? (cond
                   child?
                   false

                   (:block/collapsed? current-block)
                   true

                   :else
                   (not has-children?))]
    (let [*blocks (atom [current-node])
          _ (outliner-core/insert-node new-node current-node sibling? {:blocks-atom *blocks
                                                                       :skip-transact? true})
          tx-f (fn []
                 (outliner-core/save-node current-node)
                 (outliner-core/insert-node new-node current-node sibling?))]
      (if dummy? (tx-f) (state/add-tx! tx-f))
      @*blocks)))

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
        block-container-id (when-let [id (:id config)]
                             (and (util/uuid-string? id) (medley/uuid id)))
        new-last-block (let [first-block-id {:db/id (:db/id first-block)}]
                         (assoc last-block
                                :block/left first-block-id
                                :block/parent (if child?
                                                first-block-id
                                                ;; sibling
                                                (:block/parent first-block))))
        blocks [first-block new-last-block]
        page-blocks-atom (db/get-page-blocks-cache-atom repo (:db/id page))
        [before-part after-part] (and page-blocks-atom
                                      (split-with
                                       #(not= uuid (:block/uuid %))
                                       @page-blocks-atom))
        after-part (rest after-part)
        blocks (concat before-part blocks after-part)
        blocks (if right-block
                 (map (fn [block]
                        (if (= (:block/uuid right-block) (:block/uuid block))
                          (assoc block :block/left (:block/left right-block))
                          block)) blocks)
                 blocks)]
    (when page-blocks-atom
      (reset! page-blocks-atom blocks))

    ;; update block children cache if exists
    ;; (when blocks-container-id
    ;;   (let [blocks-atom (db/get-block-blocks-cache-atom repo blocks-container-id)
    ;;         [before-part after-part] (and blocks-atom
    ;;                                       (split-with
    ;;                                        #(not= uuid (:block/uuid %))
    ;;                                        @blocks-atom))
    ;;         after-part (rest after-part)]
    ;;     (when blocks-atom
    ;;          (reset! blocks-atom (concat before-part blocks after-part)))))
    ))

(defn insert-new-block-aux!
  [config
   {:block/keys [uuid content repo format]
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
        current-block (-> (assoc block :block/content fst-block-text)
                          (wrap-parse-block))
        dummy? (:block/dummy? current-block)
        new-m {:block/uuid (db/new-block-id)
               :block/content snd-block-text}
        next-block (-> (merge block new-m)
                       (dissoc :db/id :block/collapsed? :block/properties :block/pre-block? :block/meta)
                       (wrap-parse-block))
        blocks (profile
                "outliner insert block"
                (outliner-insert-block! current-block next-block block-self?))]
    (do
      (if dummy?
        (profile
         "db refresh"
         (let [opts {:key :block/insert
                     :data [current-block next-block]}]
           (db/refresh! repo opts)))
        (profile "update cache " (update-cache-for-block-insert! repo config block blocks)))
      (profile "ok handler" (ok-handler next-block))
      (state/set-editor-op! nil))))

(defn clear-when-saved!
  []
  (state/set-editor-show-input! nil)
  (state/set-editor-show-date-picker! false)
  (state/set-editor-show-page-search! false)
  (state/set-editor-show-block-search! false)
  (state/set-editor-show-template-search! false)
  (commands/restore-state true))

(defn get-state
  [state]
  (let [[{:keys [on-hide block block-id block-parent-id dummy? format sidebar?]} id config] (:rum/args state)
        node (gdom/getElement id)]
    (when node
      (let [value (gobj/get node "value")
            pos (gobj/get node "selectionStart")]
        {:config config
         :on-hide on-hide
         :dummy? dummy?
         :sidebar? sidebar?
         :format format
         :id id
         :block block
         :block-id block-id
         :block-parent-id block-parent-id
         :node node
         :value value
         :pos pos}))))

(defn- with-timetracking-properties
  [block value]
  (let [new-marker (first (re-find format/bare-marker-pattern (or value "")))
        new-marker (if new-marker (string/lower-case (string/trim new-marker)))
        time-properties (if (and
                             new-marker
                             (not= new-marker (string/lower-case (or (:block/marker block) "")))
                             (state/enable-timetracking?))
                          {new-marker (util/time-ms)}
                          {})]
    (merge (:block/properties block)
           time-properties)))

(defn insert-new-block!
  ([state]
   (insert-new-block! state nil))
  ([state block-value]
   (when (and (not config/publishing?)
           ;; skip this operation if it's inserting
            (not= :insert (state/get-editor-op)))
     (state/set-editor-op! :insert)
     (when-let [state (get-state state)]
       (let [{:keys [block value format id config]} state
             value (if (string? block-value) block-value value)
             block-id (:block/uuid block)
             block (or (db/pull [:block/uuid block-id])
                       block)
             repo (or (:block/repo block) (state/get-current-repo))
             properties (with-timetracking-properties block value)]
         ;; save the current block and insert a new block
         (insert-new-block-aux!
          config
          (assoc block :block/properties properties)
          value
          {:ok-handler
           (fn [last-block]
             (edit-block! last-block 0 format id)
             (clear-when-saved!))}))))))

(defn update-timestamps-content!
  [{:block/keys [repeated? marker] :as block} content]
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
             (util/format "- %s -> DONE [%s]"
                          marker
                          (date/get-local-date-time-string)))))
    content))

(defn- with-marker-time
  [block marker]
  (if (state/enable-timetracking?)
    (let [marker (string/lower-case marker)]
      {marker (util/time-ms)})
    {}))

(defn check
  [{:block/keys [uuid marker content dummy? repeated?] :as block}]
  (let [new-content (string/replace-first content marker "DONE")
        new-content (if repeated?
                      (update-timestamps-content! block content)
                      new-content)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block "DONE")})))

(defn uncheck
  [{:block/keys [uuid marker content dummy?] :as block}]
  (let [marker (if (= :now (state/get-preferred-workflow))
                 "LATER"
                 "TODO")
        new-content (string/replace-first content "DONE" marker)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block marker)})))

(defn cycle-todo!
  []
  (when-let [block (state/get-edit-block)]
    (let [edit-input-id (state/get-edit-input-id)
          current-input (gdom/getElement edit-input-id)
          content (state/get-edit-content)
          [new-content marker] (cond
                                 (util/starts-with? content "TODO")
                                 [(string/replace-first content "TODO" "DOING") "DOING"]
                                 (util/starts-with? content "DOING")
                                 [(string/replace-first content "DOING" "DONE") "DONE"]
                                 (util/starts-with? content "LATER")
                                 [(string/replace-first content "LATER" "NOW") "NOW"]
                                 (util/starts-with? content "NOW")
                                 [(string/replace-first content "NOW" "DONE") "DONE"]
                                 (util/starts-with? content "DONE")
                                 [(string/replace-first content "DONE" "") nil]
                                 :else
                                 (let [marker (if (= :now (state/get-preferred-workflow))
                                                "LATER"
                                                "TODO")]
                                   [(str marker " " (string/triml content)) marker]))
          new-content (string/triml new-content)]
      (let [new-pos (commands/compute-pos-delta-when-change-marker
                     current-input content new-content marker (util/get-input-pos current-input))]
        (state/set-edit-content! edit-input-id new-content)
        (util/set-caret-pos! current-input new-pos)))))

(defn set-marker
  [{:block/keys [uuid marker content dummy? properties] :as block} new-marker]
  (let [new-content (string/replace-first content marker new-marker)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block new-marker)})))

(defn set-priority
  [{:block/keys [uuid marker priority content dummy?] :as block} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-block-if-changed! block new-content)))

(defn- get-prev-block-non-collapsed
  [block]
  (let [id (gobj/get block "id")
        prefix (re-find #"ls-block-[\d]+" id)]
    (when-let [blocks (d/by-class "ls-block")]
      (when-let [index (.indexOf blocks block)]
        (loop [idx (dec index)]
          (when (>= idx 0)
            (let [block (nth blocks idx)
                  collapsed? (= "none" (d/style block "display"))
                  prefix-match? (util/starts-with? (gobj/get block "id") prefix)]
              (if (or collapsed?
                      ;; might be embed blocks
                      (not prefix-match?))
                (recur (dec idx))
                block))))))))

(defn- get-next-block-non-collapsed
  [block]
  (let [id (gobj/get block "id")
        prefix (re-find #"ls-block-[\d]+" id)]
    (when-let [blocks (d/by-class "ls-block")]
      (when-let [index (.indexOf blocks block)]
        (loop [idx (inc index)]
          (when (>= (count blocks) idx)
            (when-let [block (util/nth-safe blocks idx)]
              (let [collapsed? (= "none" (d/style block "display"))
                    prefix-match? (util/starts-with? (gobj/get block "id") prefix)]
                (if (or collapsed?
                        ;; might be embed blocks
                        (not prefix-match?))
                  (recur (inc idx))
                  block)))))))))

(defn delete-block-aux!
  [{:block/keys [uuid content repo ref-pages ref-blocks] :as block} dummy?]
  (when-not dummy?
    (let [repo (or repo (state/get-current-repo))
          block (db/pull repo '[*] [:block/uuid uuid])]
      (when block
        (->
         (outliner-core/block block)
         (outliner-core/delete-node))
        (db/refresh! repo {:key :block/change :data [block]})
        (when (or (seq ref-pages) (seq ref-blocks))
          (ui-handler/re-render-root!))))))

(defn delete-block!
  [state repo e]
  (let [{:keys [id block-id block-parent-id dummy? value pos format]} (get-state state)]
    (when (and block-id
               (not= :block/delete (state/get-editor-op)))
      (state/set-editor-op! :block/delete)
      (let [page-id (:db/id (:block/page (db/entity [:block/uuid block-id])))
            page-blocks-count (and page-id (db/get-page-blocks-count repo page-id))]
        (when (> page-blocks-count 1)
          (do
            (util/stop e)
            (let [block (db/pull [:block/uuid block-id])
                  block-parent (gdom/getElement block-parent-id)
                  sibling-block (get-prev-block-non-collapsed block-parent)]
              (delete-block-aux! block dummy?)
              (when (and repo sibling-block)
                (when-let [sibling-block-id (d/attr sibling-block "blockid")]
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
                                    :tail-len tail-len})))))))))
      (state/set-editor-op! nil))))

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

(defn delete-blocks!
  [repo block-uuids]
  (when (seq block-uuids)
    (let [lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
          blocks (db/pull-many repo '[*] lookup-refs)]
      (let [start-node (outliner-core/block (first blocks))
            end-node (get-top-level-end-node blocks)]
        (outliner-core/delete-nodes start-node end-node lookup-refs)
        (let [opts {:key :block/change
                    :data blocks}]
          (db/refresh! repo opts))))))

(defn- block-property-aux!
  [block-id key value]
  (let [block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (name key))
        repo (state/get-current-repo)]
    (when repo
      (when-let [block (db/entity [:block/uuid block-id])]
        (let [format (:block/format block)
              content (:block/content block)
              markdown? (= format :markdown)
              properties (:block/properties block)
              properties (if value        ; add
                           (assoc properties key value)
                           (dissoc properties key))
              content (if value
                        (text/insert-property content key value)
                        (text/remove-property content key))
              block (outliner-core/block {:block/uuid block-id
                                          :block/properties properties
                                          :block/content content})]
          (outliner-core/save-node block)
          (let [opts {:key :block/change
                      :data [block]}]
            (db/refresh! repo opts)))))))

(defn remove-block-property!
  [block-id key]
  (block-property-aux! block-id key nil)
  (db/refresh! (state/get-current-repo)
               {:key :block/change
                :data [(db/pull [:block/uuid block-id])]}))

(defn set-block-property!
  [block-id key value]
  (block-property-aux! block-id key value)
  (db/refresh! (state/get-current-repo)
               {:key :block/change
                :data [(db/pull [:block/uuid block-id])]}))

(defn set-block-timestamp!
  [block-id key value]
  (let [key (string/lower-case key)
        scheduled? (= key "scheduled")
        deadline? (= key "deadline")
        block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))
        value (str value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [content scheduled deadline format]} block
            content (or (when-let [edit-content (state/get-edit-content)]
                          (block/with-levels edit-content format block))
                        content)
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

(defn- compose-copied-blocks-contents-&-block-tree
  [repo block-ids]
  (let [blocks (db-utils/pull-many repo '[*] (mapv (fn [id] [:block/uuid id]) block-ids))
        unordered? (:block/unordered (first blocks))
        format (:block/format (first blocks))
        level-blocks (mapv #(assoc % :level 0) blocks)
        level-blocks-map (into {} (mapv (fn [b] [(:db/id b) b]) level-blocks))
        [level-blocks-map _]
        (reduce (fn [[r state] [id block]]
                  (if-let [parent-level (get-in state [(:db/id (:block/parent block)) :level])]
                    [(conj r [id (assoc block :level (inc parent-level))])
                     (assoc-in state [(:db/id block) :level] (inc parent-level))]
                    [(conj r [id block])
                     state])) [{} level-blocks-map] level-blocks-map)
        loc (reduce (fn [loc [_ {:keys [level] :as block}]]
                      (let [loc*
                            (loop [loc (zip/vector-zip (zip/root loc))
                                   level level]
                              (if (> level 0)
                                (if-let [down (zip/rightmost (zip/down loc))]
                                  (recur down (dec level))
                                  loc)
                                loc))
                            loc**
                            (if (vector? (zip/node loc*))
                              (zip/append-child loc* block)
                              (-> loc*
                                  zip/up
                                  (zip/append-child [block])))]
                        loc**)) (zip/vector-zip []) level-blocks-map)
        tree (zip/root loc)
        contents
        (mapv (fn [[id block]]
                (let [header
                      (if (and unordered? (= format :markdown))
                        (str (string/join (repeat (:level block) "  ")) "-")
                        (let [header-char (if (= format :markdown) "#" "*")
                              init-char (if (= format :markdown) "##" "*")]
                          (str (string/join (repeat (:level block) header-char)) init-char)))]
                  (str header " " (:block/content block) "\n")))
              level-blocks-map)
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
          [content tree] (compose-copied-blocks-contents-&-block-tree repo ids)]
      (common-handler/copy-to-clipboard-without-id-property! content)
      (state/set-copied-blocks content tree))))

(defn cut-selection-blocks
  [copy?]
  (when copy? (copy-selection-blocks))
  (when-let [blocks (seq (get-selected-blocks-with-children))]
    (let [repo (dom/attr (first blocks) "repo")
          ids (distinct (map #(uuid (dom/attr % "blockid")) blocks))]
      (delete-blocks! repo ids))))

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
  (if-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (route-handler/redirect! {:to :page
                                :path-params {:name (str id)}}))
    (js/window.history.forward)))

(defn zoom-out! []
  (let [page (state/get-current-page)
        block-id (and
                  (string? page)
                  (util/uuid-string? page)
                  (medley/uuid page))]
    (if block-id
      (let [repo (state/get-current-repo)
            block-parent (db/get-block-parent repo block-id)]
        (if-let [id (:block/uuid block-parent)]
          (route-handler/redirect! {:to :page
                                    :path-params {:name (str id)}})
          (let [page-id (-> (db/entity [:block/uuid block-id])
                            :block/page
                            :db/id)]
            (when-let [page-name (:block/name (db/entity repo page-id))]
              (route-handler/redirect! {:to :page
                                        :path-params {:name page-name}})))))
      (js/window.history.back))))

(defn cut-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (common-handler/copy-to-clipboard-without-id-property! content)
      (delete-block-aux! block false))))

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
  (when-let [start-block (:selection/start-block @state/state)]
    (clear-selection! nil)
    (let [blocks (util/get-nodes-between-two-nodes start-block end-block "ls-block")

          direction (util/get-direction-between-two-nodes start-block end-block "ls-block")]
      (exit-editing-and-set-selected-blocks! blocks))))

(defn on-select-block
  [direction]
  (fn [e]
    (cond
      ;; when editing, quit editing and select current block
      (state/editing?)
      (exit-editing-and-set-selected-blocks! [(gdom/getElement (state/get-editing-block-dom-id))])

      ;; when selection and one block selected, select next block
      (and (state/in-selection-mode?) (== 1 (count (state/get-selection-blocks))))
      (let [f (if (= :up direction) util/get-prev-block util/get-next-block)
            element (f (first (state/get-selection-blocks)))]
        (when element
          (state/conj-selection-block! element direction)))

      ;; if same direction, keep conj on same direction
      (and (state/in-selection-mode?) (= direction (state/get-selection-direction)))
      (let [f (if (= :up direction) util/get-prev-block util/get-next-block)
            element (f (last (state/get-selection-blocks)))]
        (when element
          (state/conj-selection-block! element direction)))

      ;; if different direction, keep clear until one left
      (state/in-selection-mode?)
      (clear-last-selected-block!))))

(defn save-block-aux!
  [block value format opts]
  (let [value (string/trim value)
        properties (with-timetracking-properties block value)]
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
  ([{:keys [format block repo dummy?] :as state} value]
   (when (or (:db/id (db/entity repo [:block/uuid (:block/uuid block)]))
             dummy?)
     (save-block-aux! block value format {}))))

(defn save-current-block!
  []
  (when (and (nil? (state/get-editor-op))
             ;; non English input method
             (not (state/editor-in-composition?)))
    (when-let [repo (state/get-current-repo)]
      (when (and (not (state/get-editor-show-page-search?))
                 (not (state/get-editor-show-page-search-hashtag?))
                 (not (state/get-editor-show-block-search?))
                 (not (state/get-editor-show-date-picker?))
                 (not (state/get-editor-show-template-search?))
                 (not (state/get-editor-show-input)))
        (state/set-editor-op! :auto-save)
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
            (when (and block value db-content-without-heading
                       (or
                        (not= (string/trim db-content-without-heading)
                              (string/trim value))))
              (save-block-aux! db-block value (:block/format db-block) {})))
          (catch js/Error error
            (log/error :save-block-failed error)))
        (state/set-editor-op! nil)))))

(defn on-up-down
  [direction]
  (when (state/editing?)
    (let [edit-block (state/get-edit-block)
          {:block/keys [uuid content format]} edit-block
          element (state/get-input)
          line-height (util/get-textarea-line-height element)
          repo (state/get-current-repo)
          up? (= :up direction)]
      (if (or (and up? (util/textarea-cursor-first-row? element line-height))
              (and (not up?) (util/textarea-cursor-end-row? element line-height)))
        (do
          (let [f (if up? get-prev-block-non-collapsed get-next-block-non-collapsed)
                sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))]
            (when sibling-block
              (when-let [sibling-block-id (d/attr sibling-block "blockid")]
                (let [value (state/get-edit-content)]
                  (when (not= (-> content
                                  (text/remove-level-spaces format)
                                  text/remove-properties!
                                  string/trim)
                              (string/trim value))
                    (save-block! repo uuid value)))
                (let [block (db/pull repo '[*] [:block/uuid (cljs.core/uuid sibling-block-id)])]
                  (edit-block! block [direction (util/get-first-or-last-line-pos element)] format (state/get-edit-input-id)))))))
        ;;just up and down
        (if up?
          (util/move-cursor-up element)
          (util/move-cursor-down element))))))

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
   (when-let [block-file (db-model/get-block-file block-id)]
     (p/let [[repo-dir assets-dir] (ensure-assets-dir! repo)]
       (let [prefix (:file/path block-file)
             prefix (and prefix (string/replace
                                 (if (util/electron?)
                                   (string/replace prefix (str repo-dir "/") "")
                                   prefix) "/" "_"))
             prefix (and prefix (subs prefix 0 (string/last-index-of prefix ".")))]
         (save-assets! repo repo-dir assets-dir files
                       (fn [index file-base]
                         (str (string/replace file-base " " "_") "_" (.now js/Date) "_" index)))))))
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
  [{:keys [repo href title full-text block-id local?] :as opts}]
  (let [block (db-model/query-block-by-uuid block-id)
        _ (or block (throw (str block-id " not exists")))
        format (:block/format block)
        text (:block/content block)
        content (string/replace text full-text "")]
    (save-block! repo block content)
    (when local?
      ;; FIXME: should be relative to current block page path
      (fs/unlink! (config/get-repo-path
                   repo (-> href
                            (string/replace #"^../" "/")
                            (string/replace #"^assets://" ""))) nil))))

;; assets/journals_2021_02_03_1612350230540_0.png
(defn resolve-relative-path
  [file-path]
  (if-let [current-file (some-> (state/get-edit-block)
                                :block/file
                                :db/id
                                (db/entity)
                                :file/path)]
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
    (let [result (search/block-search q 10)]
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
    (let [edit-content (gobj/get input "value")
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

(defn in-auto-complete?
  [input]
  (or @*show-commands
      @*show-block-commands
      @*asset-uploading?
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
      (util/parse-int (d/attr prev-block "level")))))

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

(defn expand!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/expand! current-block)))

(defn collapse!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/collapse! current-block)))

(defn cycle-collapse!
  [e]
  (when (and
         ;; not input, t
         (nil? (state/get-edit-input-id))
         (not (state/get-editor-show-input))
         (string/blank? (:search/q @state/state)))
    (util/stop e)
    (expand/cycle!)))

(defn on-tab
  "direction = :left|:right, only indent or outdent when blocks are siblings"
  [direction]
  (fn [e]
    (when-let [repo (state/get-current-repo)]
      (let [blocks-dom-nodes (state/get-selection-blocks)
            blocks (seq blocks-dom-nodes)]
        (cond
          (seq blocks)
          (do
            (util/stop e)
            (let [lookup-refs (->> (map (fn [block] (when-let [id (dom/attr block "blockid")]
                                                     [:block/uuid (medley/uuid id)])) blocks)
                                  (remove nil?))
                 blocks (db/pull-many repo '[*] lookup-refs)
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
                 (state/set-selection-blocks! blocks)))))

          (gdom/getElement "date-time-picker")
          nil

          :else
          (cycle-collapse! e))))))

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
        (let [block-id (and node (d/attr node "blockid"))
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
            edit-content (state/sub [:editor/content id])]
        (or
         @*selected-text
         (util/safe-subs edit-content pos current-pos))))))

(defn close-autocomplete-if-outside
  [input]
  (when (or (state/get-editor-show-page-search?)
            (state/get-editor-show-page-search-hashtag?)
            (state/get-editor-show-block-search?))
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

(defonce *auto-save-timeout (atom nil))
(defn edit-box-on-change!
  [e block id]
  (let [value (util/evalue e)
        current-pos (util/get-input-pos (gdom/getElement id))]
    (state/set-edit-content! id value false)
    (when @*auto-save-timeout
      (js/clearTimeout @*auto-save-timeout))
    (reset! *auto-save-timeout
            (js/setTimeout save-current-block! 300))
    (when-let [repo (or (:block/repo block)
                        (state/get-current-repo))]
      (state/set-editor-last-input-time! repo (util/time-ms))
      (db/clear-repo-persistent-job! repo))
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
                           "ID"
                           uuid-string)

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/set-editor-show-block-search! false)
    (util/cursor-move-forward input 2)))

;; TODO: re-implement
(defn template-on-chosen-handler
  [input id q format edit-block edit-content]
  (fn [[template db-id] _click?]

    (when-let [input (gdom/getElement id)]
      (.focus input))))

(defn parent-is-page?
  [{{:block/keys [parent page]} :data :as node}]
  {:pre [(tree/satisfied-inode? node)]}
  (= parent page))

(defn outdent-on-enter
  ([node]
   (outdent-on-enter node 100))
  ([node retry-limit]
   (if (= :insert (state/get-editor-op))
     (if (> retry-limit 0)
       (js/setTimeout #(outdent-on-enter node (dec retry-limit)) 20)
       (log/error :editor/indent-outdent-retry-max-limit "Unknown Error."))
     (do
       (state/set-editor-op! :indent-outdent)
       (when-not (parent-is-page? node)
         (let [parent-node (tree/-get-parent node)]
           (outliner-core/move-subtree node parent-node true)))
       (let [repo (state/get-current-repo)]
        (db/refresh! repo {:key :block/change :data [(:data node)]}))
       (state/set-editor-op! nil)))))

(defn- last-top-level-child?
  [{:keys [id config]} current-node]
  (when id
    (when-let [entity (if (util/uuid-string? (str id))
                        (db/entity [:block/uuid (uuid id)])
                        (db/entity [:block/name (string/lower-case id)]))]
      (= (:block/uuid entity) (tree/-get-parent-id current-node)))))

(defn- keydown-new-block
  [state]
  (when-not (in-auto-complete? nil)
    (let [{:keys [block config]} (get-state state)]
      (when (and block
                 (not (:ref? config))
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
  (when (not (in-auto-complete? nil))
    (let [^js input (state/get-input)
          selected-start (gobj/get input "selectionStart")
          selected-end (gobj/get input "selectionEnd")
          value (.-value input)
          s1 (subs value 0 selected-start)
          s2 (subs value selected-end)
          ]
      (state/set-edit-content! (state/get-edit-input-id)
                               (str s1 "\n" s2))
      (util/move-cursor-to input (inc selected-start)))))

(defn keydown-new-block-handler [get-state-fn]
  (fn [e]
    (when-let [state (get-state-fn)]
      (if (state/get-new-block-toggle?)
        (keydown-new-line)
        (keydown-new-block state)))))

(defn keydown-new-line-handler [get-state-fn]
  (fn [e]
    (when-let [state (get-state-fn)]
      (if (state/get-new-block-toggle?)
        (keydown-new-block state)
        (keydown-new-line)))))


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
      (when-let [sibling-block-id (d/attr sibling-block "blockid")]
        (let [value (state/get-edit-content)]
          (when (not= (-> content
                          (text/remove-level-spaces format)
                          text/remove-properties!
                          string/trim)
                      (string/trim value))
            (save-block! repo uuid value)))

        (let [block (db/pull repo '[*] [:block/uuid (cljs.core/uuid sibling-block-id)])]
          (edit-block! block
                       [direction line-pos]
                       format
                       (state/get-edit-input-id)))))))

(defn keydown-up-down-handler
  [direction]
  (fn [_]
    (when-not (in-auto-complete? nil)
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
            (util/move-cursor-down input)))))))

(defn- move-to-block-when-cross-boundrary
  [_ direction]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:block/keys [format uuid] :as block} (state/get-edit-block)
        id (state/get-edit-input-id)
        repo (state/get-current-repo)]
    (let [f (if up? get-prev-block-non-collapsed get-next-block-non-collapsed)
          sibling-block (f (gdom/getElement (state/get-editing-block-dom-id)))]
      (when sibling-block
        (when-let [sibling-block-id (d/attr sibling-block "blockid")]
          (let [content (:block/content block)
                value (state/get-edit-content)]
            (when (not= (-> content
                            (text/remove-level-spaces format)
                            text/remove-properties!
                            string/trim)
                        (string/trim value))
              (save-block! repo uuid value)))
          (let [block (db/pull repo '[*] [:block/uuid (cljs.core/uuid sibling-block-id)])]
            (edit-block! block pos format id)))))))

(defn keydown-arrow-handler
  [direction]
  (fn [e]
    (when-not (in-auto-complete? nil)
      (let [input (state/get-input)
            selected-start (.-selectionStart input)
            selected-end (.-selectionEnd input)
            left? (= direction :left)
            right? (= direction :right)]
        (cond
          (not= selected-start selected-end)
          (if left?
            (util/set-caret-pos! input selected-start)
            (util/set-caret-pos! input selected-end))

          (or (and left? (util/input-start? input))
              (and right? (util/input-end? input)))
          (move-to-block-when-cross-boundrary e direction)

          :else
          (if left?
            (util/cursor-move-back input 1)
            (util/cursor-move-forward input 1)))))))

(defn keydown-backspace-handler
  [get-state-fn cut? e]
  (when-let [state (get-state-fn)]
    (let [^js input (state/get-input)
          id (state/get-edit-input-id)
          current-pos (:pos (util/get-caret-pos input))
          value (gobj/get input "value")
          deleted (and (> current-pos 0)
                       (util/nth-safe value (dec current-pos)))
          selected-start (gobj/get input "selectionStart")
          selected-end (gobj/get input "selectionEnd")
          block-id (:block-id (first (:rum/args state)))
          page (state/get-current-page)
          repo (state/get-current-repo)]
      (util/stop e)
      (cond
        (not= selected-start selected-end)
        (do
          (when cut?
            (js/document.execCommand "copy"))
          (.setRangeText input "" selected-start selected-end))

        (and (zero? current-pos)
             ;; not the top block in a block page
             (not (and page
                       (util/uuid-string? page)
                       (= (medley/uuid page) block-id))))
        (delete-block! state repo e)

        (and (> current-pos 1)
             (= (util/nth-safe value (dec current-pos)) commands/slash))
        (do
          (reset! *slash-caret-pos nil)
          (reset! *show-commands false)
          (.setRangeText input "" (dec current-pos) current-pos))

        (and (> current-pos 1)
             (= (util/nth-safe value (dec current-pos)) commands/angle-bracket))
        (do
          (reset! *angle-bracket-caret-pos nil)
          (reset! *show-block-commands false)
          (.setRangeText input "" (dec current-pos) current-pos))

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
        (state/set-editor-show-page-search-hashtag! false)

        ;; just delete
        :else
        (.setRangeText input "" (dec current-pos) current-pos)))))

;; TODO: merge indent-on-tab, outdent-on-shift-tab, on-tab
(defn indent-on-tab
  ([state]
   (indent-on-tab state 100))
  ([state retry-limit]
   (if (= :insert (state/get-editor-op))
     (if (> retry-limit 0)
       (js/setTimeout #(indent-on-tab state (dec retry-limit)) 20)
       (log/error :editor/indent-outdent-retry-max-limit "indent on hit tab."))
     (let [{:keys [block block-parent-id value config]} (get-state state)]
       (when block
         (state/set-editor-op! :indent-outdent)
         (let [current-node (outliner-core/block block)
               first-child? (outliner-core/first-child? current-node)]
           (when-not first-child?
             (let [left (tree/-get-left current-node)
                   children-of-left (tree/-get-children left)]
               (if (seq children-of-left)
                 (let [target-node (last children-of-left)]
                   (outliner-core/move-subtree current-node target-node true))
                 (outliner-core/move-subtree current-node left false))
               (let [repo (state/get-current-repo)]
                 (db/refresh! repo
                              {:key :block/change :data [(:data current-node)]}))))))
       (state/set-editor-op! nil)))))

(defn outdent-on-shift-tab
  ([state]
   (outdent-on-shift-tab state 100))
  ([state retry-limit]
   (if (= :insert (state/get-editor-op))
     (if (> retry-limit 0)
       (js/setTimeout #(outdent-on-shift-tab state (dec retry-limit)) 20)
       (log/error :editor/indent-outdent-retry-max-limit "outdent on hit shift tab."))
     (do
       (state/set-editor-op! :indent-outdent)
       (let [{:keys [block block-parent-id value config]} (get-state state)
             {:block/keys [parent page]} block
             current-node (outliner-core/block block)
             parent-is-page? (= parent page)]
         (when-not parent-is-page?
           (let [parent (tree/-get-parent current-node)]
             (outliner-core/move-subtree current-node parent true))
           (let [repo (state/get-current-repo)]
             (db/refresh! repo
                          {:key :block/change :data [(:data current-node)]}))))
       (state/set-editor-op! nil)))))

(defn keydown-tab-handler
  [get-state-fn direction]
  (fn [e]
    (when-let [state (get-state-fn)]
      (let [input (state/get-input)
            pos (:pos (util/get-caret-pos input))]
        (when (and (not (state/get-editor-show-input))
                   (not (state/get-editor-show-date-picker?))
                   (not (state/get-editor-show-template-search?)))
          (do (if (= :left direction)
                (outdent-on-shift-tab state)
                (indent-on-tab state))
              (and input pos
                   (when-let [input (state/get-input)]
                     (util/move-cursor-to input pos)))))))))

(defn keydown-not-matched-handler
  [input input-id format]
  (fn [e key-code]
    (let [key (gobj/get e "key")
          value (gobj/get input "value")
          ctrlKey (gobj/get e "ctrlKey")
          metaKey (gobj/get e "metaKey")
          pos (util/get-input-pos input)]
      (cond
        (or ctrlKey metaKey)
        nil

        (or
         (and (= key "#")
              (and
               (> pos 0)
               (= "#" (util/nth-safe value (dec pos)))))
         (and (= key " ")
              (state/get-editor-show-page-search-hashtag?)))
        (state/set-editor-show-page-search-hashtag! false)

        (or
         (surround-by? input "#" " ")
         (surround-by? input "#" :end)
         (= key "#"))
        (do
          (commands/handle-step [:editor/search-page-hashtag])
          (state/set-last-pos! (:pos (util/get-caret-pos input)))
          (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

        (and
         (= key " ")
         (state/get-editor-show-page-search-hashtag?))
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
          format (:format (get-state state))]
      (when-not (state/get-editor-show-input)
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

(defn- paste-text
  [text e]
  (let [repo (state/get-current-repo)
        page (or (db/entity [:block/name (state/get-current-page)])
                 (db/entity [:block/original-name (state/get-current-page)])
                 (:block/page (db/entity (:db/id(state/get-edit-block)))))
        file (:block/file page)
        copied-blocks (state/get-copied-blocks)
        copied-block-tree (:copy/block-tree copied-blocks)]
    (when (and
           (:copy/content copied-blocks)
           (not (string/blank? text))
           (= (string/trim text) (string/trim (:copy/content copied-blocks))))
      ;; copy from logseq internally
      (let [editing-block (state/get-edit-block)
            parent (:block/parent editing-block)
            left (:block/left editing-block)
            sibling? (not= parent left)
            target-block (outliner-core/block (db/pull (if sibling? (:db/id left) (:db/id parent))))
            format (or (:block/format target-block) (state/get-preferred-format))
            new-block-uuids (atom #{})
            metadata-replaced-copied-blocks
            (zip/root
             (loop [loc (zip/vector-zip copied-block-tree)]
               (if (zip/end? loc)
                 loc
                 (if (vector? (zip/node loc))
                   (recur (zip/next loc))
                   (let [uuid (random-uuid)]
                     (swap! new-block-uuids (fn [acc uuid] (conj acc uuid)) uuid)
                     (recur (zip/next (zip/edit
                                       loc
                                       #(outliner-core/block
                                         (conj {:block/uuid uuid
                                                :block/page (select-keys page [:db/id])
                                                :block/file (select-keys file [:db/id])
                                                :block/format format}
                                               (dissoc %
                                                       :block/uuid
                                                       :block/page
                                                       :block/file
                                                       :db/id
                                                       :block/left
                                                       :block/parent
                                                       :block/format)))))))))))
            _ (outliner-core/insert-nodes metadata-replaced-copied-blocks target-block sibling?)
            new-blocks (db/pull-many repo '[*] (map (fn [id] [:block/uuid id]) @new-block-uuids))]
        (db/refresh! repo {:key :block/insert :data new-blocks})
        (util/stop e)))))

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
                                                   (when (re-find #"^(/[^/ ]*)+/?$" existed-file-path)
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
  (copy-selection-blocks)
  (clear-selection! nil))

(defn shortcut-cut-selection
  [e]
  (cut-blocks-and-clear-selections! true))

(defn shortcut-delete-selection
  [e]
  (cut-blocks-and-clear-selections! false))

;; credits to @pengx17
(defn- copy-current-block-ref
  []
  (when-let [current-block (state/get-edit-block)]
    (let [block-id (:block/uuid current-block)]
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
  (cond
    (and (state/in-selection-mode?) (seq (state/get-selection-blocks)))
    (shortcut-copy-selection e)

    (state/editing?)
    (let [input (state/get-input)
          selected-start (.-selectionStart input)
          selected-end (.-selectionEnd input)]
      (if (= selected-start selected-end)
        (copy-current-block-ref)
        (js/document.execCommand "copy")))))


(defn shortcut-cut
  "shortcut cut action:
  * when in selection mode, cut selected blocks
  * when in edit mode with text selected, cut selected text
  * otherwise same as delete shortcut"
  [state-fn]
  (fn [e]
    (cond
      (and (state/in-selection-mode?) (seq (state/get-selection-blocks)))
      (shortcut-cut-selection e)

      (state/editing?)
      (keydown-backspace-handler state-fn true e))))

(defn shortcut-delete
  [state-fn]
  (fn [e]
    (cond
      (and (state/in-selection-mode?) (seq (state/get-selection-blocks)))
      (shortcut-delete-selection e)

      (state/editing?)
      (keydown-backspace-handler state-fn false e))))
