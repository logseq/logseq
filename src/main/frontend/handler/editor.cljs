(ns ^:no-doc frontend.handler.editor
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as w]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.utils :as db-utils]
            [frontend.diff :as diff]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.fs :as fs]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.handler.export.html :as export-html]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.file-based.editor :as file-editor-handler]
            [frontend.handler.file-based.status :as status]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.file :as property-file]
            [frontend.handler.property.util :as pu]
            [frontend.handler.repeated :as repeated]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.template :as template]
            [frontend.util :as util]
            [frontend.util.file-based.clock :as clock]
            [frontend.util.cursor :as cursor]
            [frontend.util.file-based.drawer :as drawer]
            [frontend.util.keycode :as keycode]
            [frontend.util.list :as list]
            [frontend.util.text :as text-util]
            [frontend.util.thingatpt :as thingatpt]
            [goog.crypt.base64 :as base64]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.outliner.core :as outliner-core]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.outliner.property :as outliner-property]))

;; FIXME: should support multiple images concurrently uploading

(defonce *asset-uploading? (atom false))
(defonce *asset-uploading-process (atom 0))

(def clear-selection! state/clear-selection!)
(def edit-block! block-handler/edit-block!)

(defn- outliner-save-block!
  [block]
  (outliner-op/save-block! block))

(defn get-block-own-order-list-type
  [block]
  (let [properties (:block/properties block)]
    (pu/lookup properties :logseq.property/order-list-type)))

(defn set-block-own-order-list-type!
  [block type]
  (when-let [uuid (:block/uuid block)]
    (property-handler/set-block-property! (state/get-current-repo) uuid (pu/get-pid :logseq.property/order-list-type) (name type))))

(defn remove-block-own-order-list-type!
  [block]
  (when-let [uuid (:block/uuid block)]
    (property-handler/remove-block-property! (state/get-current-repo) uuid (pu/get-pid :logseq.property/order-list-type))))

(defn own-order-number-list?
  [block]
  (when-let [block (db/entity (:db/id block))]
    (= (get-block-own-order-list-type block) "number")))

(defn make-block-as-own-order-list!
  [block]
  (some-> block (set-block-own-order-list-type! "number")))

(defn toggle-blocks-as-own-order-list!
  [blocks]
  (when (seq blocks)
    (let [has-ordered?    (some own-order-number-list? blocks)
          blocks-uuids    (some->> blocks (map :block/uuid) (remove nil?))
          order-list-prop (pu/get-pid :logseq.property/order-list-type)
          repo (state/get-current-repo)]
      (if has-ordered?
        (property-handler/batch-remove-block-property! repo blocks-uuids order-list-prop)
        (property-handler/batch-set-block-property! repo blocks-uuids order-list-prop "number")))))

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
  ([text]
   (when-let [m (get-selection-and-format)]
     (let [{:keys [selection-start selection-end format selection value edit-id input]} m
           empty-selection? (= selection-start selection-end)
           selection-link? (and selection (gp-mldoc/mldoc-link? format selection))
           [content forward-pos] (cond
                                   empty-selection?
                                   (config/get-empty-link-and-forward-pos format)

                                   (and text selection-link?)
                                   (config/with-label-link format text selection)

                                   text
                                   (config/with-label-link format selection text)

                                   selection-link?
                                   (config/with-default-link format selection)

                                   :else
                                   (config/with-default-label format selection))
           new-value (str
                      (subs value 0 selection-start)
                      content
                      (subs value selection-end))
           cur-pos (or selection-start (cursor/pos input))]
       (state/set-edit-content! edit-id new-value)
       (cursor/move-cursor-to input (+ cur-pos forward-pos))))))

(defn open-block-in-sidebar!
  [block-id]
  ; (assert (uuid? block-id) "frontend.handler.editor/open-block-in-sidebar! expects block-id to be of type uuid")
  (when block-id
    (when-let [block (db/entity (if (number? block-id) block-id [:block/uuid block-id]))]
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
      (cursor/move-cursor-to node pos))))

(defn highlight-block!
  [block-uuid]
  (let [blocks (array-seq (js/document.getElementsByClassName (str "id" block-uuid)))]
    (doseq [block blocks]
      (dom/add-class! block "block-highlight"))))

(defn unhighlight-blocks!
  []
  (let [blocks (some->> (array-seq (js/document.getElementsByClassName "block-highlight"))
                        (repeat 2)
                        (apply concat))]
    (doseq [block blocks]
      (gdom-classes/remove block "block-highlight"))))

(defn wrap-parse-block
  [block]
  (if (config/db-based-graph? (state/get-current-repo))
    (db-editor-handler/wrap-parse-block block)
    (file-editor-handler/wrap-parse-block block)))

(defn- save-block-inner!
  [block value opts]
  (let [block {:db/id (:db/id block)
               :block/uuid (:block/uuid block)
               :block/title value}
        block' (-> (wrap-parse-block block)
                   ;; :block/uuid might be changed when backspace/delete
                   ;; a block that has been refed
                   (assoc :block/uuid (:block/uuid block)))
        opts' (assoc opts :outliner-op :save-block)]
    (ui-outliner-tx/transact!
     opts'
     (outliner-save-block! block'))))

;; id: block dom id, "ls-block-counter-uuid"
(defn- another-block-with-same-id-exists?
  [current-id block-id]
  (when-let [id (and (string? block-id) (parse-uuid block-id))]
    (and (not= current-id id)
         (db/entity [:block/uuid id]))))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys [force?]
     :as opts}]
   (let [{:block/keys [uuid format repo title properties]} block
         repo (or repo (state/get-current-repo))
         format (or format (state/get-preferred-format))
         block-id (when (and (not (config/db-based-graph? repo)) (map? properties))
                    (get properties :id))
         content (if (config/db-based-graph? repo)
                   (:block/title-with-refs-parent (db/entity (:db/id block)))
                   (-> (property-file/remove-built-in-properties-when-file-based repo format title)
                       (drawer/remove-logbook)))]
     (cond
       (another-block-with-same-id-exists? uuid block-id)
       (notification/show!
        [:p.content
         (util/format "Block with the id %s already exists!" block-id)]
        :error)

       force?
       (save-block-inner! block value opts)

       :else
       (when content
         (let [content-changed? (not= (string/trim content) (string/trim value))]
           (when content-changed?
             (save-block-inner! block value opts))))))))

(defn- compute-fst-snd-block-text
  [value selection-start selection-end]
  (when (string? value)
    (let [fst-block-text (subs value 0 selection-start)
          snd-block-text (string/triml (subs value selection-end))]
      [fst-block-text snd-block-text])))

(declare save-current-block!)
(defn outliner-insert-block!
  [config current-block new-block {:keys [sibling? keep-uuid? ordered-list?
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
    (ui-outliner-tx/transact!
     {:outliner-op :insert-blocks}
     (save-current-block! {:current-block current-block})
     (outliner-op/insert-blocks! [new-block] current-block {:sibling? sibling?
                                                            :keep-uuid? keep-uuid?
                                                            :ordered-list? ordered-list?
                                                            :replace-empty-target? replace-empty-target?}))))


(defn- block-self-alone-when-insert?
  [config uuid]
  (let [current-page (state/get-current-page)
        block-id (or (some-> (:id config) parse-uuid)
                     (some-> current-page parse-uuid))]
    (= uuid block-id)))

(defn insert-new-block-before-block-aux!
  [config block value]
  (let [edit-input-id (state/get-edit-input-id)
        input (gdom/getElement edit-input-id)
        input-text-selected? (util/input-text-selected? input)
        new-m {:block/uuid (db/new-block-id)
               :block/title ""}
        prev-block (-> (merge (select-keys block [:block/parent :block/format :block/page])
                              new-m)
                       (wrap-parse-block))
        block' (db/entity (:db/id block))
        left-or-parent (or (ldb/get-left-sibling block') (:block/parent block'))]
    (when input-text-selected?
      (let [selection-start (util/get-selection-start input)
            selection-end (util/get-selection-end input)
            [_ new-content] (compute-fst-snd-block-text value selection-start selection-end)]
        (state/set-edit-content! edit-input-id new-content)))
    (let [sibling? (not= (:db/id left-or-parent) (:db/id (:block/parent block)))
          result (outliner-insert-block! config left-or-parent prev-block {:sibling? sibling?
                                                                           :keep-uuid? true})]
      [result sibling? prev-block])))

(defn insert-new-block-aux!
  [config
   {:block/keys [uuid]
    :as block}
   value]
  (let [block-self? (block-self-alone-when-insert? config uuid)
        input (gdom/getElement (state/get-edit-input-id))
        selection-start (util/get-selection-start input)
        selection-end (util/get-selection-end input)
        [fst-block-text snd-block-text] (compute-fst-snd-block-text value selection-start selection-end)
        current-block (assoc block :block/title fst-block-text)
        current-block (apply dissoc current-block db-schema/retract-attributes)
        new-m {:block/uuid (db/new-block-id)
               :block/title snd-block-text}
        next-block (-> (merge (select-keys block [:block/parent :block/format :block/page])
                              new-m)
                       (wrap-parse-block))
        sibling? (or (:block/collapsed? (:block/link block)) (when block-self? false))
        result (outliner-insert-block! config current-block next-block {:sibling? sibling?
                                                                          :keep-uuid? true})]
    [result sibling? next-block]))

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
         :block (or (db/entity [:block/uuid (:block/uuid block)]) block)
         :block-id block-id
         :block-parent-id block-parent-id
         :node node
         :value value
         :pos pos
         :block-container (util/rec-get-node node "ls-block")}))))

(defn- get-node-container-id
  [node]
  (some-> (dom/attr node "containerid")
          util/safe-parse-int))

(defn- get-node-parent
  [node]
  (some-> (gobj/get node "parentNode")
          (util/rec-get-node "ls-block")))

(defn- get-new-container-id
  [op data]
  (let [{:keys [block block-container]} (get-state)]
    (when block
      (let [node block-container
            linked? (some? (dom/attr node "originalblockid"))]
        (case op
          :insert
          (when (and linked? (not (false? (:sibling? data))))
            (some-> (util/rec-get-node node "blocks-container")
                    get-node-container-id))

          :indent
          ;; Get prev sibling's container id
          (when-let [prev (.-previousSibling node)]
            (when (dom/attr prev "originalblockid")
              (get-node-container-id prev)))

          :move-up
          (let [parent (get-node-parent node)
                prev (when parent (.-previousSibling parent))]
            (when (and prev (dom/attr prev "originalblockid"))
              (get-node-container-id prev)))

          :move-down
          (let [parent (get-node-parent node)
                next (when parent (.-nextSibling parent))]
            (when (and next (dom/attr next "originalblockid"))
              (get-node-container-id next)))

          :outdent
          ;; Get embed block's root container id
          (when-let [parent (some-> (gobj/get node "parentNode")
                                    (util/rec-get-node "ls-block"))]
            (when (dom/attr parent "originalblockid")
              (some-> (util/rec-get-node parent "blocks-container")
                      get-node-container-id))))))))

(defn insert-new-block!
  "Won't save previous block content - remember to save!"
  ([state]
   (insert-new-block! state nil))
  ([_state block-value]
   (->
    (when (not config/publishing?)
      (when-let [state (get-state)]
        (state/set-state! :editor/async-unsaved-chars "")
        (let [{:keys [block value config]} state
              value (if (string? block-value) block-value value)
              block-id (:block/uuid block)
              block-self? (block-self-alone-when-insert? config block-id)
              input-id (state/get-edit-input-id)
              input (gdom/getElement input-id)
              selection-start (util/get-selection-start input)
              selection-end (util/get-selection-end input)
              [fst-block-text snd-block-text] (compute-fst-snd-block-text value selection-start selection-end)
              insert-above? (and (string/blank? fst-block-text) (not (string/blank? snd-block-text)))
              block' (or (db/entity [:block/uuid block-id]) block)
              original-block (:original-block config)
              block'' (or
                       (when original-block
                         (let [e (db/entity (:db/id block'))]
                           (if (and (some? (first (:block/_parent e)))
                                    (not (:block/collapsed? e)))
                          ;; object has children and not collapsed
                             block'
                             original-block)))
                       block')
              insert-fn (cond
                          block-self?
                          insert-new-block-aux!

                          insert-above?
                          insert-new-block-before-block-aux!

                          :else
                          insert-new-block-aux!)
              [result-promise sibling? next-block] (insert-fn config block'' value)]
          (p/do!
           result-promise
           (clear-when-saved!)
           (let [next-block' (db/entity [:block/uuid (:block/uuid next-block)])
                 pos 0
                 unsaved-chars @(:editor/async-unsaved-chars @state/state)
                 container-id (get-new-container-id :insert {:sibling? sibling?})]
             (edit-block! next-block' (+ pos (count unsaved-chars))
                          {:container-id container-id
                           :custom-content (str unsaved-chars (:block/title next-block'))}))))))
    (p/finally (fn []
                 (state/set-state! :editor/async-unsaved-chars nil))))))

(defn api-insert-new-block!
  [content {:keys [page block-uuid sibling? before? properties
                   custom-uuid replace-empty-target? edit-block? ordered-list? other-attrs]
            :or {sibling? false
                 before? false
                 edit-block? true}}]
  (when (or page block-uuid)
    (let [repo (state/get-current-repo)
          db-base? (config/db-based-graph? repo)
          before? (if page false before?)
          sibling? (boolean sibling?)
          sibling? (if before? true (if page false sibling?))
          block (if page
                  (db/get-page page)
                  (db/entity [:block/uuid block-uuid]))]
      (when block
        (let [last-block (when (not sibling?)
                           (let [children (:block/_parent block)
                                 blocks (db/sort-by-order children)
                                 last-block-id (:db/id (last blocks))]
                             (when last-block-id
                               (db/entity last-block-id))))
              format (or
                      (:block/format block)
                      (db/get-page-format (:block/name block))
                      (state/get-preferred-format))
              content (if (and (not db-base?) (seq properties))
                        (property-file/insert-properties-when-file-based repo format content properties)
                        content)
              new-block (-> (select-keys block [:block/page])
                            (assoc :block/title content
                                   :block/format format))
              new-block (assoc new-block :block/page
                               (if page
                                 (:db/id block)
                                 (:db/id (:block/page new-block))))
              new-block (-> new-block
                            (wrap-parse-block)
                            (assoc :block/uuid (or custom-uuid (db/new-block-id))))
              new-block (merge new-block other-attrs)
              [block-m sibling?] (cond
                                   before?
                                   (let [left-or-parent (or (ldb/get-left-sibling block)
                                                            (:block/parent block))
                                         sibling? (if (= (:db/id (:block/parent block)) (:db/id left-or-parent))
                                                    false sibling?)]
                                     [left-or-parent sibling?])

                                   sibling?
                                   [(db/entity (:db/id block)) sibling?]

                                   last-block
                                   [last-block true]

                                   block
                                   [(db/entity (:db/id block)) sibling?]

                                   ;; FIXME: assert
                                   :else
                                   nil)]
          (when block-m
            (p/do!
              (ui-outliner-tx/transact!
                {:outliner-op :insert-blocks}
                (outliner-insert-block! {} block-m new-block {:sibling? sibling?
                                                              :keep-uuid? true
                                                              :ordered-list? ordered-list?
                                                              :replace-empty-target? replace-empty-target?})
                (when (and db-base? (seq properties))
                  (property-handler/set-block-properties! repo (:block/uuid new-block) properties)))
              (when edit-block?
                (if (and replace-empty-target?
                      (string/blank? (:block/title last-block)))
                  (edit-block! last-block :max)
                  (edit-block! new-block :max)))
              new-block)))))))

(defn insert-first-page-block-if-not-exists!
  [page-uuid-or-title]
  (let [page-title (str page-uuid-or-title)]
    (when-not (string/blank? page-title)
      (when-let [page (db/get-page page-title)]
        (let [class-or-property? (or (ldb/class? page) (ldb/property? page))]
          (when (or class-or-property? (db/page-empty? (state/get-current-repo) (:db/id page)))
           (let [format (or (:block/format page) (state/get-preferred-format))
                 new-block {:block/title ""
                            :block/format format}]
             (ui-outliner-tx/transact!
              {:outliner-op :insert-blocks}
              (outliner-op/insert-blocks! [new-block] page {:sibling? false})))))))))

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
  [{:block/keys [marker title repeated? uuid] :as block}]
  (let [new-content (string/replace-first title marker "DONE")
        new-content (if repeated?
                      (update-timestamps-content! block title)
                      new-content)
        input-id (state/get-edit-input-id)]
    (if (and input-id
             (string/ends-with? input-id (str uuid)))
      (state/set-edit-content! input-id new-content)
      (save-block-if-changed! block new-content))))

(defn uncheck
  [{:block/keys [title uuid] :as block}]
  (let [marker (if (= :now (state/get-preferred-workflow))
                 "LATER"
                 "TODO")
        new-content (string/replace-first title "DONE" marker)
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
  ([{:block/keys [marker title format] :as block} new-marker]
   (let [[new-content _] (status/cycle-marker title marker new-marker format (state/get-preferred-workflow))]
     (save-block-if-changed! block new-content))))

(defn file-based-cycle-todo!
  [block]
  (when (not-empty (:block/title block))
    (set-marker block)))

(defn db-based-cycle-todo!
  [block]
  (let [status-value (:logseq.task/status block)
        next-status (case (:db/ident status-value)
                      :logseq.task/status.todo
                      :logseq.task/status.doing
                      :logseq.task/status.doing
                      :logseq.task/status.done
                      :logseq.task/status.done
                      nil
                      :logseq.task/status.todo)
        repo (state/get-current-repo)]
    (property-handler/set-block-property! repo (:block/uuid block)
                                          :logseq.task/status
                                          (:db/id (db/entity next-status)))))

(defn cycle-todos!
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [db-based? (config/db-based-graph? (state/get-current-repo))
          ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))]
      (ui-outliner-tx/transact!
       {:outliner-op :cycle-todos}
       (doseq [id ids]
         (when-let [block (db/entity [:block/uuid id])]
           (if db-based?
             (db-based-cycle-todo! block)
             (file-based-cycle-todo! block))))))))

(defn cycle-todo!
  []
  #_:clj-kondo/ignore
  (when-not (state/get-editor-action)
    (if-let [blocks (seq (get-selected-blocks))]
      (cycle-todos!)
      (when-let [edit-block (state/get-edit-block)]
        (let [edit-input-id (state/get-edit-input-id)
              current-input (gdom/getElement edit-input-id)]
          (if (config/db-based-graph? (state/get-current-repo))
            (when-let [block (db/entity (:db/id edit-block))]
              (let [pos (state/get-edit-pos)]
                (p/do!
                 (ui-outliner-tx/transact!
                  {:outliner-op :cycle-todos}
                  (db-based-cycle-todo! block))

                 ;; FIXME: don't change current editor's position
                 )))
            (let [content (state/get-edit-content)
                  format (or (db/get-page-format (state/get-current-page))
                             (state/get-preferred-format))
                  [new-content marker] (status/cycle-marker content nil nil format (state/get-preferred-workflow))
                  new-pos (commands/compute-pos-delta-when-change-marker
                           content marker (cursor/pos current-input))]
              (state/set-edit-content! edit-input-id new-content)
              (cursor/move-cursor-to current-input new-pos))))))))

(defn set-priority
  [{:block/keys [priority title] :as block} new-priority]
  (when-not (config/db-based-graph? (state/get-current-repo))
    (let [new-content (string/replace-first title
                                           (util/format "[#%s]" priority)
                                           (util/format "[#%s]" new-priority))]
     (save-block-if-changed! block new-content))))

(defn delete-block-aux!
  [{:block/keys [uuid] :as _block}]
  (let [block (db/entity [:block/uuid uuid])]
    (when block
      (let [blocks (block-handler/get-top-level-blocks [block])]
        (ui-outliner-tx/transact!
         {:outliner-op :delete-blocks}
         (outliner-op/delete-blocks! blocks {}))))))

(defn- move-to-prev-block
  [repo sibling-block format value]
  (when (and repo sibling-block)
    (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
      (when-let [sibling-entity (db/entity [:block/uuid (uuid sibling-block-id)])]
        (if (:block/name sibling-entity)
          {:prev-block sibling-entity
           :new-value (:block/title sibling-entity)
           :edit-block-f #(edit-block! sibling-entity :max)}
          (let [db? (config/db-based-graph? repo)
                original-content (if (= (:db/id sibling-entity) (:db/id (state/get-edit-block)))
                                   (state/get-edit-content)
                                   (:block/title sibling-entity))
                value' (if db?
                         original-content
                         (-> (property-file/remove-built-in-properties-when-file-based repo format original-content)
                             (drawer/remove-logbook)))
                value (if db?
                        value
                        (->> value
                             (property-file/remove-properties-when-file-based repo format)
                             (drawer/remove-logbook)))
                new-value (str value' value)
                tail-len (count value)
                pos (max
                     (if original-content
                       (gobj/get (utf8/encode original-content) "length")
                       0)
                     0)
                [edit-target container-id] [(db/entity (:db/id sibling-entity)) (some-> (dom/attr sibling-block "containerid")
                                                                                        util/safe-parse-int)]]
            {:prev-block sibling-entity
             :new-content new-value
             :pos pos
             :edit-block-f #(edit-block! edit-target
                                         pos
                                         {:custom-content new-value
                                          :tail-len tail-len
                                          :container-id container-id})}))))))

(declare save-block!)

(declare expand-block!)

(defn delete-block-inner!
  [repo {:keys [block-id value format config]}]
  (when block-id
    (when-let [block-e (db/entity [:block/uuid block-id])]
      (let [prev-block (db-model/get-prev (db/get-db) (:db/id block-e))
            block-parent-id (str "ls-block-" block-id)]
        (cond
          (and (nil? prev-block)
               (nil? (:block/parent block-e)))
          nil

          :else
          (let [has-children? (seq (:block/_parent block-e))
                block (db/entity (:db/id block-e))
                left (or (ldb/get-left-sibling block) (:block/parent block))
                left-has-children? (and left
                                        (when-let [block-id (:block/uuid left)]
                                          (let [block (db/entity [:block/uuid block-id])]
                                            (seq (:block/_parent block)))))]
            (when-not (and has-children? left-has-children?)
              (when block-parent-id
                (let [block-parent (gdom/getElement block-parent-id)
                      sibling-block (if (:embed? config)
                                      (util/get-prev-block-non-collapsed
                                       block-parent
                                       {:container (util/rec-get-blocks-container block-parent)})
                                      (util/get-prev-block-non-collapsed-non-embed block-parent))
                      {:keys [prev-block new-content edit-block-f]} (move-to-prev-block repo sibling-block format value)
                      concat-prev-block? (boolean (and prev-block new-content))
                      transact-opts {:outliner-op :delete-blocks}]
                  (cond
                    (and prev-block (:block/name prev-block)
                         (not= (:db/id prev-block) (:db/id (:block/parent block)))
                         (db-model/hidden-page? (:block/page block))) ; embed page
                    nil

                    concat-prev-block?
                    (let [children (:block/_parent (db/entity (:db/id block)))
                          db-based? (config/db-based-graph? repo)
                          delete-prev-block? (and db-based?
                                                  (empty? (:block/tags block))
                                                  (seq (:block/properties block))
                                                  (empty? (:block/properties prev-block))
                                                  (not (:logseq.property/created-from-property block)))]
                      (if delete-prev-block?
                        (p/do!
                         (ui-outliner-tx/transact!
                          transact-opts
                          (delete-block-aux! prev-block)
                          (save-block! repo block new-content {}))
                         (edit-block! (assoc block :block/title new-content) (count (:block/title prev-block))))
                        (p/do!
                          (ui-outliner-tx/transact!
                           transact-opts
                           (when (seq children)
                             (outliner-op/move-blocks! children prev-block false))
                           (delete-block-aux! block)
                           (save-block! repo prev-block new-content {}))
                          (when edit-block-f (edit-block-f)))))

                    :else
                    (p/do!
                      (delete-block-aux! block)
                      (when edit-block-f (edit-block-f)))))))))))))

(defn delete-block!
  [repo]
  (delete-block-inner! repo (get-state)))

(defn delete-blocks!
  [repo block-uuids blocks dom-blocks]
  (when (seq block-uuids)
    (let [uuid->dom-block (zipmap block-uuids dom-blocks)
          block (first blocks)
          block-parent (get uuid->dom-block (:block/uuid block))
          sibling-block (when block-parent (util/get-prev-block-non-collapsed-non-embed block-parent))
          blocks' (block-handler/get-top-level-blocks blocks)]
      (p/do!
       (ui-outliner-tx/transact!
        {:outliner-op :delete-blocks}
        (outliner-op/delete-blocks! blocks' nil))
       (when sibling-block
         (let [{:keys [edit-block-f]} (move-to-prev-block repo sibling-block
                                                          (:block/format block)
                                                          "")]
           (when edit-block-f (edit-block-f))))))))

(defn set-block-timestamp!
  [block-id key value]
  (let [key (string/lower-case (str key))
        block-id (if (string? block-id) (uuid block-id) block-id)
        value (str value)]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [{:block/keys [title]} block
            content (or title (state/get-edit-content))
            new-content (-> (text-util/remove-timestamp content key)
                            (text-util/add-timestamp key value))]
        (when (not= content new-content)
          (let [input-id (state/get-edit-input-id)]
            (if (and input-id
                     (string/ends-with? input-id (str block-id)))
              (state/set-edit-content! input-id new-content)
              (save-block-if-changed! block new-content))))))))

(defn set-editing-block-timestamp!
  "Almost the same as set-block-timestamp! except for:
   - it doesn't save the block
   - it extracts current content from current input"
  [key value]
  (let [key (string/lower-case (str key))
        value (str value)
        content (state/get-edit-content)
        new-content (-> (text-util/remove-timestamp content key)
                        (text-util/add-timestamp key value))]
    (when (not= content new-content)
      (let [input-id (state/get-edit-input-id)]
        (state/set-edit-content! input-id new-content)))))

(defn set-blocks-id!
  "Persist block uuid to file if the uuid is valid, and it's not persisted in file.
   Accepts a list of uuids."
  [block-ids]
  (let [repo (state/get-current-repo)]
    (when-not (config/db-based-graph? repo)
      (file-editor-handler/set-blocks-id! block-ids))))

(defn copy-block-ref!
  ([block-id]
   (copy-block-ref! block-id #(str %)))
  ([block-id tap-clipboard]
   (p/do!
    (save-current-block!)
    (set-blocks-id! [block-id])
    (util/copy-to-clipboard! (tap-clipboard block-id)))))

(defn select-block!
  [block-uuid]
  (block-handler/select-block! block-uuid))

(defn- compose-copied-blocks-contents
  [repo block-ids]
  (let [blocks (db-utils/pull-many repo '[*] (mapv (fn [id] [:block/uuid id]) block-ids))
        top-level-block-uuids (->> (block-handler/get-top-level-blocks blocks)
                                   (map :block/uuid))
        content (export-text/export-blocks-as-markdown
                 repo top-level-block-uuids
                 {:indent-style (state/get-export-block-text-indent-style)
                  :remove-options (set (state/get-export-block-text-remove-options))})]
    [top-level-block-uuids content]))

(defn- get-all-blocks-by-ids
  [repo ids]
  (loop [ids ids
         result []]
    (if (seq ids)
      (let [db-id (:db/id (db/entity [:block/uuid (first ids)]))
            blocks (tree/get-sorted-block-and-children repo db-id
                                                       {:include-property-block? true})
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
          block (db/entity [:block/uuid (first ids)])
          db-based? (config/db-based-graph? repo)]
      (when block
        (let [html (export-html/export-blocks-as-html repo top-level-block-uuids nil)
              copied-blocks (cond->> (get-all-blocks-by-ids repo top-level-block-uuids)
                              db-based?
                              (map (fn [block]
                                     (let [b (db/pull (:db/id block))]
                                       (->> (map (fn [[k v]]
                                                   (let [v' (cond
                                                              (and (map? v) (:db/id v))
                                                              [:block/uuid (:block/uuid (db/entity (:db/id v)))]
                                                              (and (coll? v) (every? #(and (map? %) (:db/id %)) v))
                                                              (set (map (fn [i] [:block/uuid (:block/uuid (db/entity (:db/id i)))]) v))
                                                              :else
                                                              v)]
                                                     [k v'])) b)
                                            (into {}))))))]
          (common-handler/copy-to-clipboard-without-id-property! repo (:block/format block) content (when html? html) copied-blocks))
        (state/set-block-op-type! :copy)
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
          block (db/entity [:block/uuid (:id first-block)])
          copy-str (some->> adjusted-blocks
                            (map (fn [{:keys [id level]}]
                                   (if (config/db-based-graph? (state/get-current-repo))
                                     (str (string/join (repeat (dec level) "\t")) "- " (page-ref/->page-ref id))
                                     (condp = (:block/format block)
                                      :org
                                      (str (string/join (repeat level "*")) " " (block-ref/->block-ref id))
                                      :markdown
                                      (str (string/join (repeat (dec level) "\t")) "- " (block-ref/->block-ref id))))))
                            (string/join "\n\n"))]
      (set-blocks-id! (map :id blocks))
      (util/copy-to-clipboard! copy-str))))

(defn copy-block-embeds
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))
          ids-str (if (config/db-based-graph? (state/get-current-repo))
                    (some->> ids
                             (map (fn [id] (block-ref/->block-ref id)))
                             (string/join "\n\n"))
                    (some->> ids
                             (map (fn [id] (util/format "{{embed ((%s))}}" id)))
                             (string/join "\n\n")))]
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
      (->> (block-handler/get-top-level-blocks blocks*)
           (map :block/uuid)))))

(defn cut-selection-blocks
  [copy?]
  (when copy? (copy-selection-blocks true))
  (state/set-block-op-type! :cut)
  (when-let [blocks (seq (get-selected-blocks))]
    ;; remove queries
    (let [dom-blocks (remove (fn [block]
                               (= "true" (dom/attr block "data-query"))) blocks)]
      (when (seq dom-blocks)
        (let [repo (state/get-current-repo)
              block-uuids (distinct (map #(uuid (dom/attr % "blockid")) dom-blocks))
              lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
              blocks (->> (map db/entity lookup-refs)
                          (remove ldb/page?))
              top-level-blocks (when (seq blocks) (block-handler/get-top-level-blocks blocks))
              sorted-blocks (mapcat (fn [block]
                                      (tree/get-sorted-block-and-children repo (:db/id block)))
                                    top-level-blocks)]
          (when (seq sorted-blocks)
            (delete-blocks! repo (map :block/uuid sorted-blocks) sorted-blocks dom-blocks)))))))

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

(defn get-nearest-page
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
      (p/do!
       (state/clear-editor-action!)
       (save-current-block!)
       (if (re-find url-regex page)
         (js/window.open page)
         (let [page-name (db-model/get-redirect-page-name page)]
           (state/clear-edit!)
           (insert-first-page-block-if-not-exists! page-name)))))))

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

(declare save-current-block!)

;; FIXME: shortcut `mod+.` doesn't work on Web (Chrome)
(defn zoom-in! []
  (if (state/editing?)
    (when-let [id (some-> (state/get-edit-block)
                          :block/uuid
                          ((fn [id] [:block/uuid id]))
                          db/entity
                          :block/uuid)]
      (state/clear-editor-action!)
      (state/set-editing-block-id! [:unknown-container id])
      (p/do!
       (save-current-block!)
       (route-handler/redirect-to-page! id)))
    (js/window.history.forward)))

(defn zoom-out!
  []
  (if (state/editing?)
    (let [page (state/get-current-page)
          block-id (and (string? page) (parse-uuid page))]
      (p/do!
       (state/clear-editor-action!)
       (save-current-block!)
       (when block-id
         (state/set-editing-block-id! [:unknown-container (:block/uuid (state/get-edit-block))])
         (let [block-parent (db/get-block-parent block-id)]
           (if-let [id (and
                        (nil? (:block/name block-parent))
                        (:block/uuid block-parent))]
             (route-handler/redirect-to-page! id)
             (let [page-id (some-> (db/entity [:block/uuid block-id])
                                   :block/page
                                   :db/id)]
               (when-let [page (db/entity page-id)]
                 (route-handler/redirect-to-page! (:block/uuid page)))))))))
    (js/window.history.back)))

(defn cut-block!
  [block-id]
  (when-let [block (db/entity [:block/uuid block-id])]
    (let [repo (state/get-current-repo)
          ;; TODO: support org mode
          [_top-level-block-uuids md-content] (compose-copied-blocks-contents repo [block-id])
          html (export-html/export-blocks-as-html repo [block-id] nil)
          sorted-blocks (tree/get-sorted-block-and-children repo (:db/id block))]
      (common-handler/copy-to-clipboard-without-id-property! repo (:block/format block) md-content html sorted-blocks)
      (state/set-block-op-type! :cut)
      (delete-block-aux! block))))

(defn highlight-selection-area!
  [end-block-id & {:keys [append?]}]
  (when-let [start-block (state/get-selection-start-block-or-first)]
    (let [end-block-node (gdom/getElement end-block-id)
          start-node (gdom/getElement start-block)
          select-direction (state/get-selection-direction)
          selected-blocks (state/get-unsorted-selection-blocks)
          last-node (when-let [node (last selected-blocks)]
                      (gdom/getElement (.-id ^js node)))
          latest-visible-block (or last-node start-node)
          latest-block-id (when latest-visible-block (.-id latest-visible-block))]
      (if (and start-node end-block-node)
        (let [blocks (util/get-nodes-between-two-nodes start-block end-block-id "ls-block")
              direction (util/get-direction-between-two-nodes start-block end-block-id "ls-block")
              blocks (if (= direction :up) (reverse blocks) blocks)]
          (state/exit-editing-and-set-selected-blocks! blocks direction))
        (when latest-visible-block
          (let [blocks (util/get-nodes-between-two-nodes latest-block-id end-block-id "ls-block")
                direction (if (= latest-block-id end-block-id)
                            select-direction
                            (util/get-direction-between-two-nodes latest-block-id end-block-id "ls-block"))
                blocks (if (= direction :up) (reverse (util/sort-by-height blocks)) (util/sort-by-height blocks))]
            (if append?
              (do (state/clear-edit!)
                  (if (and select-direction (not= direction select-direction))
                    (state/drop-selection-blocks-starts-with! end-block-node)
                    (state/conj-selection-block! blocks direction)))
              (state/exit-editing-and-set-selected-blocks! blocks direction))))))))

(defn- select-block-up-down
  [direction]
  (cond
    ;; when editing, quit editing and select current block
    (state/editing?)
    (let [element (gdom/getElement (state/get-editing-block-dom-id))]
      (when element
        (p/do!
         (save-current-block!)
         (util/scroll-to-block element)
         (state/exit-editing-and-set-selected-blocks! [element]))))

    ;; when selection and one block selected, select next block
    (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed-skip)
          element (f (first (state/get-selection-blocks)))]
      (when element
        (util/scroll-to-block element)
        (state/conj-selection-block! element direction)))

    ;; if same direction, keep conj on same direction
    (and (state/selection?) (= direction (state/get-selection-direction)))
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed-skip)
          first-last (if (= :up direction) first last)
          element (f (first-last (state/get-selection-blocks)) {:up-down? true})]
      (when element
        (util/scroll-to-block element)
        (state/conj-selection-block! element direction)))

    ;; if different direction, keep clear until one left
    (state/selection?)
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed)
          last-first (if (= :up direction) last first)
          element (f (last-first (state/get-selection-blocks)) {:up-down? true})]
      (when element
        (util/scroll-to-block element)
        (state/drop-last-selection-block!))))
  nil)

(defn on-select-block
  [direction]
  (fn [_event]
    (select-block-up-down direction)))

(defn save-block-aux!
  [block value opts]
  (let [entity (db/entity [:block/uuid (:block/uuid block)])]
    (when (and (:db/id entity) (not (ldb/built-in? entity)))
      (let [value (string/trim value)]
        ;; FIXME: somehow frontend.components.editor's will-unmount event will loop forever
        ;; maybe we shouldn't save the block/file in "will-unmount" event?
        (save-block-if-changed! block value opts)))))

(defn save-block!
  ([repo block-or-uuid content]
   (save-block! repo block-or-uuid content {}))
  ([repo block-or-uuid content {:keys [properties] :as opts}]
   (let [block (if (or (uuid? block-or-uuid)
                       (string? block-or-uuid))
                 (db-model/query-block-by-uuid block-or-uuid) block-or-uuid)]
     (save-block!
      {:block block :repo repo :opts (dissoc opts :properties)}
      (if (seq properties)
        (property-file/insert-properties-when-file-based repo (:block/format block) content properties)
        content))))
  ([{:keys [block repo opts] :as _state} value]
   (let [repo (or repo (state/get-current-repo))]
     (when (db/entity repo [:block/uuid (:block/uuid block)])
       (save-block-aux! block value opts)))))

(defn save-blocks!
  [blocks]
  (ui-outliner-tx/transact!
   {:outliner-op :save-block}
   (doseq [[block value] blocks]
     (save-block-if-changed! block value))))

(defn save-current-block!
  "skip-properties? if set true, when editing block is likely be properties, skip saving"
  ([]
   (save-current-block! {}))
  ([{:keys [force? skip-properties? current-block] :as opts}]
   ;; non English input method
   (when-not (or (state/editor-in-composition?)
                 (state/get-editor-action))
     (when (state/get-current-repo)
       (try
         (let [input-id (state/get-edit-input-id)
               block (state/get-edit-block)
               db-block (when-let [block-id (:block/uuid block)]
                          (db/entity [:block/uuid block-id]))
               elem (and input-id (gdom/getElement input-id))
               db-content (:block/title db-block)
               db-content-without-heading (and db-content
                                               (common-util/safe-subs db-content (:block/level db-block)))
               value (if (= (:block/uuid current-block) (:block/uuid block))
                       (:block/title current-block)
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
           (log/error :save-block-failed error)))))))

(defn- clean-content!
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (some->> (text/remove-level-spaces content format (config/get-block-pattern format))
             (drawer/remove-logbook)
             (property-file/remove-properties-when-file-based repo format)
             string/trim)))

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

(defn- ensure-assets-dir!
  [repo]
  (p/let [repo-dir (config/get-repo-dir repo)
          assets-dir "assets"
          _ (fs/mkdir-if-not-exists (path/path-join repo-dir assets-dir))]
    [repo-dir assets-dir]))

(defn get-asset-path
  "Get asset path from filename, ensure assets dir exists"
  [filename]
  (p/let [[repo-dir assets-dir] (ensure-assets-dir! (state/get-current-repo))]
    (path/path-join repo-dir assets-dir filename)))

(defn save-assets!
  "Save incoming(pasted) assets to assets directory.

   Returns: [file-rpath file-obj file-fpath matched-alias]"
  ([repo files]
   (p/let [[repo-dir assets-dir] (ensure-assets-dir! repo)]
     (save-assets! repo repo-dir assets-dir files
                   (fn [index file-stem]
                     ;; TODO: maybe there're other chars we need to handle?
                     (let [file-base (-> file-stem
                                         (string/replace " " "_")
                                         (string/replace "%" "_")
                                         (string/replace "/" "_"))
                           file-name (str file-base "_" (.now js/Date) "_" index)]
                       (string/replace file-name #"_+" "_"))))))
  ([repo repo-dir asset-dir-rpath files gen-filename]
   (p/all
    (for [[index ^js file] (map-indexed vector files)]
      ;; WARN file name maybe fully qualified path when paste file
      (let [file-name (util/node-path.basename (.-name file))
            [file-stem ext-full ext-base] (if file-name
                                            (let [ext-base (util/node-path.extname file-name)
                                                  ext-full (if-not (config/extname-of-supported? ext-base)
                                                             (util/full-path-extname file-name) ext-base)]
                                              [(subs file-name 0 (- (count file-name)
                                                                    (count ext-full))) ext-full ext-base])
                                            ["" "" ""])
            filename  (str (gen-filename index file-stem) ext-full)
            file-rpath  (str asset-dir-rpath "/" filename)
            matched-alias (assets-handler/get-matched-alias-by-ext ext-base)
            file-rpath (cond-> file-rpath
                         (not (nil? matched-alias))
                         (string/replace #"^[.\/\\]*assets[\/\\]+" ""))
            dir (or (:dir matched-alias) repo-dir)]
        (if (util/electron?)
          (let [from (not-empty (.-path file))]
            (js/console.debug "Debug: Copy Asset #" dir file-rpath from)
            (-> (js/window.apis.copyFileToAssets dir file-rpath from)
                (p/then
                 (fn [dest]
                   [file-rpath
                    (if (string? dest) (js/File. #js[] dest) file)
                    (path/path-join dir file-rpath)
                    matched-alias]))
                (p/catch #(js/console.error "Debug: Copy Asset Error#" %))))

          (->
           (p/do! (js/console.debug "Debug: Writing Asset #" dir file-rpath)
                  (cond
                    (mobile-util/native-platform?)
                   ;; capacitor fs accepts Blob, File implements Blob
                    (p/let [buffer (.arrayBuffer file)
                            content (base64/encodeByteArray (js/Uint8Array. buffer))
                            fpath (path/path-join dir file-rpath)]
                      (capacitor-fs/<write-file-with-base64 fpath content))

                    (config/db-based-graph? repo) ;; memory-fs
                    (p/let [buffer (.arrayBuffer file)
                            content (js/Uint8Array. buffer)]
                      (fs/write-file! repo dir file-rpath content nil))

                    :else                ; nfs
                    (fs/write-file! repo dir file-rpath (.stream file) nil))
                  [file-rpath file (path/path-join dir file-rpath) matched-alias])
           (p/catch (fn [error]
                      (prn :paste-file-error)
                      (js/console.error error))))))))))

(defn delete-asset-of-block!
  [{:keys [repo href full-text block-id local? delete-local?] :as _opts}]
  (let [block (db-model/query-block-by-uuid block-id)
        _ (or block (throw (str block-id " not exists")))
        text (:block/title block)
        content (string/replace text full-text "")]
    (save-block! repo block content)
    (when (and local? delete-local?)
      (when-let [href (if (util/electron?) href
                          (second (re-find #"\((.+)\)$" full-text)))]
        (let [block-file-rpath (db-model/get-block-file-path block)
              asset-fpath (if (string/starts-with? href "assets://")
                            (path/url-to-path href)
                            (config/get-repo-fpath
                             repo
                             (path/resolve-relative-path block-file-rpath href)))]
          (prn ::deleting-asset href asset-fpath)
          (fs/unlink! repo asset-fpath nil))))))

;; assets/journals_2021_02_03_1612350230540_0.png
(defn resolve-relative-path
  "Relative path to current file path.

   Requires editing state"
  [file-path]
  (if-let [current-file-rpath (or (db-model/get-block-file-path (state/get-edit-block))
                                  ;; fix dummy file path of page
                                  (when (config/get-pages-directory)
                                    (path/path-join (config/get-pages-directory) "_.md"))
                                  "pages/contents.md")]
    (let [repo-dir (config/get-repo-dir (state/get-current-repo))
          current-file-fpath (path/path-join repo-dir current-file-rpath)]
      (path/get-relative-path current-file-fpath file-path))
    file-path))

(defn upload-asset!
  "Paste asset and insert link to current editing block"
  [id ^js files format uploading? drop-or-paste?]
  (let [repo (state/get-current-repo)]
    (when (or (config/local-file-based-graph? repo)
              (config/db-based-graph? repo))
      (-> (save-assets! repo (js->clj files))
          ;; FIXME: only the first asset is handled
          (p/then
           (fn [res]
             (when-let [[asset-file-name file-obj asset-file-fpath matched-alias] (and (seq res) (first res))]
               (let [image? (config/ext-of-image? asset-file-name)]
                 (insert-command!
                  id
                  (assets-handler/get-asset-file-link format
                                                      (if matched-alias
                                                        (str
                                                         (if image? "../assets/" "")
                                                         "@" (:name matched-alias) "/" asset-file-name)
                                                        (resolve-relative-path (or asset-file-fpath asset-file-name)))
                                                      (if file-obj (.-name file-obj) (if image? "image" "asset"))
                                                      image?)
                  format
                  {:last-pattern (if drop-or-paste? "" commands/command-trigger)
                   :restore?     true
                   :command      :insert-asset})))))
          (p/catch (fn [e]
                     (js/console.error e)))
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

(defn- autopair
  [input-id prefix _format _option]
  (let [value (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected value)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
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
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)
                                            :selected selected}))

          (and (= prefix block-ref/left-parens)
               (config/db-based-graph? (state/get-current-repo)))
          (notification/show!
           "To reference a node, please use `[[]]`."
           :warning)

          (= prefix block-ref/left-parens)
          (do
            (commands/handle-step [:editor/search-block :reference])
            (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)
                                            :selected selected})))))))

(defn surround-by?
  [input before end]
  (when input
    (let [value (gobj/get input "value")
          pos (cursor/pos input)]
      (text-util/surround-by? value pos before end))))

(defn- autopair-left-paren?
  [input key]
  (and (= key "(")
       (or (surround-by? input :start "")
           (surround-by? input "\n" "")
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

(defn get-matched-classes
  "Return matched classes except the root tag"
  [q]
  (let [classes (->> (db-model/get-all-classes (state/get-current-repo) {:except-root-class? true})
                     (mapcat (fn [class]
                               (conj (:block/alias class) class)))
                     (common-util/distinct-by :db/id)
                     (map (fn [e] (select-keys e [:block/uuid :block/title]))))]
    (search/fuzzy-search classes q {:extract-fn :block/title})))

(defn <get-matched-blocks
  "Return matched blocks that are not built-in"
  [q & [{:keys [nlp-pages?]}]]
  (p/let [block (state/get-edit-block)
          nodes (search/block-search (state/get-current-repo) q {:built-in? false
                                                                 :enable-snippet? false})
          matched (keep (fn [b]
                          (when-let [id (:block/uuid b)]
                            (when-not (= id (:block/uuid block)) ; avoid block self-reference
                              (db/entity [:block/uuid id]))))
                        nodes)]
    (-> (concat matched
                (when nlp-pages?
                  (map (fn [title] {:block/title title :nlp-date? true})
                       date/nlp-pages)))
        (search/fuzzy-search q {:extract-fn :block/title :limit 50}))))

(defn <get-matched-templates
  [q]
  (search/template-search q))

(defn <get-matched-properties
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
         (and (= commands/command-trigger (util/nth-safe edit-content (dec pos)))
              @commands/*initial-commands)
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch :default e
      (js/console.error e)
      nil)))

(defn auto-complete?
  []
  (or @*asset-uploading?
      (state/get-editor-action)))

(defn in-shui-popup?
  []
  (or (some-> js/document.activeElement
        (.closest "[data-radix-menu-content]")
        (nil?)
        (not))
    (.querySelector js/document.body
      "div[data-radix-popper-content-wrapper]")))

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
                       (let [blocks' (block-handler/get-top-level-blocks blocks)
                             result (ui-outliner-tx/transact!
                                     {:outliner-op :move-blocks}
                                     (outliner-op/move-blocks-up-down! blocks' up?))]
                         (when-let [block-node (util/get-first-block-by-id (:block/uuid (first blocks)))]
                           (.scrollIntoView block-node #js {:behavior "smooth" :block "nearest"}))
                         result))]
      (if edit-block-id
        (when-let [block (db/entity [:block/uuid edit-block-id])]
          (let [blocks [(assoc block :block/title (state/get-edit-content))]
                container-id (get-new-container-id (if up? :move-up :move-down) {})]
            (p/do!
             (save-current-block!)
             (move-nodes blocks)
             (if container-id
               (state/set-editing-block-id! [container-id edit-block-id])
               (when-let [input (some-> (state/get-edit-input-id) gdom/getElement)]
                 (.focus input)
                 (util/scroll-editor-cursor input))))))
        (let [ids (state/get-selection-block-ids)]
          (when (seq ids)
            (let [lookup-refs (map (fn [id] [:block/uuid id]) ids)
                  blocks (map db/entity lookup-refs)]
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
    (block-handler/indent-outdent-blocks! blocks (= direction :right) nil)))

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
      (cursor/move-cursor-to input saved-cursor true))))

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
               {:last-pattern (str commands/command-trigger "link")
                :command :link})))

    :image-link (let [{:keys [link label]} m]
                  (when (not (string/blank? link))
                    (insert-command!
                     id
                     (get-image-link format link label)
                     format
                     {:last-pattern (str commands/command-trigger "link")
                      :command :image-link})))

    nil)

  (handle-command-input-close id))

(defn- close-autocomplete-if-outside
  [input]
  (when (and input
             (contains? #{:page-search :page-search-hashtag :block-search} (state/get-editor-action))
             (not (wrapped-by? input page-ref/left-brackets page-ref/right-brackets))
             (not (wrapped-by? input block-ref/left-parens block-ref/right-parens))
             ;; wrapped-by? doesn't detect multiple beginnings when ending with "" so
             ;; use subs to correctly detect current hashtag
             (not (text-util/wrapped-by? (subs (.-value input) 0 (cursor/pos input)) (cursor/pos input) commands/hashtag ""))
             (not (and (config/db-based-graph? (state/get-current-repo))
                       (= :block-search (state/get-editor-action)))))
    (state/clear-editor-action!)))

(defn resize-image!
  [block-id metadata full_text size]
  (let [new-meta (merge metadata size)
        image-part (first (string/split full_text #"\{"))
        new-full-text (str image-part (pr-str new-meta))
        block (db/entity [:block/uuid block-id])
        value (:block/title block)
        new-value (string/replace value full_text new-full-text)]
    (save-block-aux! block new-value {})))

(defonce *auto-save-timeout (atom nil))
(defn edit-box-on-change!
  [e block id]
  (when (= (:db/id block) (:db/id (state/get-edit-block)))
    (let [value (util/evalue e)
          repo (state/get-current-repo)]
      (state/set-edit-content! id value false)
      (when @*auto-save-timeout
        (js/clearTimeout @*auto-save-timeout))
      (block-handler/mark-last-input-time! repo)
      (reset! *auto-save-timeout
              (js/setTimeout
               (fn []
                 (when (and (state/input-idle? repo :diff 450)
                          ;; don't auto-save block if it has tags
                            (not (and
                                  (config/db-based-graph? repo)
                                  (re-find #"#\S+" value))))
                 ; don't auto-save for page's properties block
                   (save-current-block! {:skip-properties? true})))
               450)))))

(defn- start-of-new-word?
  [input pos]
  (contains? #{" " "\t"} (get (.-value input) (- pos 2))))

(defn handle-last-input []
  (let [input           (state/get-input)
        input-id        (state/get-edit-input-id)
        edit-block      (state/get-edit-block)
        pos             (cursor/pos input)
        content         (.-value input)
        last-input-char (util/nth-safe content (dec pos))
        last-prev-input-char (util/nth-safe content (dec (dec pos)))
        prev-prev-input-char (util/nth-safe content (- pos 3))
        repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)]

    ;; TODO: is it cross-browser compatible?
    ;; (not= (gobj/get native-e "inputType") "insertFromPaste")
    (cond
      (and (= content "1. ") (= last-input-char " ") input-id edit-block
           (not (own-order-number-list? edit-block)))
      (p/let [_ (state/pub-event! [:editor/toggle-own-number-list edit-block])]
        (state/set-edit-content! input-id ""))

      (and (= last-input-char commands/command-trigger)
           (or (re-find #"(?m)^/" (str (.-value input))) (start-of-new-word? input pos)))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (commands/reinit-matched-commands!)
        (state/set-editor-show-commands!))

      (and (= last-input-char last-prev-input-char commands/colon)
           (or (nil? prev-prev-input-char)
               (= prev-prev-input-char "\n"))
           (not db-based?))
      (do
        (cursor/move-cursor-backward input 2)
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-action! :property-search))

      (and
       (not= :property-search (state/get-editor-action))
       (let [{:keys [line start-pos]} (text-util/get-current-line-by-pos (.-value input) (dec pos))]
         (text-util/wrapped-by? line (- pos start-pos) "" gp-property/colons))
       (not db-based?))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-action! :property-search))

      (and (= last-input-char commands/colon)
           (= :property-search (state/get-editor-action))
           (not db-based?))
      (state/clear-editor-action!)

      (or (= last-input-char last-prev-input-char commands/hashtag)
          (and (= last-prev-input-char commands/hashtag)
               (= last-input-char " ")))
      (state/clear-editor-action!)

      ;; Open "Search page or New page" auto-complete
      (and (= last-input-char commands/hashtag)
             ;; Only trigger at beginning of a line, before whitespace or after a reference
             (or (re-find #"(?m)^#" (str (.-value input)))
                 (start-of-new-word? input pos)
                 (and db-based? (= page-ref/right-brackets (common-util/safe-subs (str (.-value input)) (- pos 3) (dec pos))))))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (state/set-editor-last-pos! pos)
        (state/set-editor-action! :page-search-hashtag))

      :else
      nil)))

(defn get-selected-text
  []
  (let [text (:selected (state/get-editor-action-data))]
    (when-not (string/blank? text)
      text)))

(defn block-on-chosen-handler
  [id q format selected-text]
  (fn [chosen _click?]
    (state/clear-editor-action!)
    (let [uuid-string (str (:block/uuid chosen))]

      ;; block reference
      (insert-command! id
                       (block-ref/->block-ref uuid-string)
                       format
                       {:last-pattern (str block-ref/left-parens (if selected-text "" q))
                        :end-pattern block-ref/right-parens
                        :postfix-fn   (fn [s] (util/replace-first block-ref/right-parens s ""))
                        :forward-pos 3
                        :command :block-ref})

      ;; Save it so it'll be parsed correctly in the future
      (property-handler/file-persist-block-id! (state/get-current-repo) (:block/uuid chosen))

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/clear-editor-action!)
    (cursor/move-cursor-forward input 2)))

(defn- paste-block-cleanup
  [repo block page exclude-properties format content-update-fn keep-uuid?]
  (let [db-based? (config/db-based-graph? (state/get-current-repo))
        new-content
        (if content-update-fn
          (content-update-fn (:block/title block))
          (:block/title block))
        new-content
        (cond->> new-content
          (not keep-uuid?) (property-file/remove-property-when-file-based repo format "id")
          true             (property-file/remove-property-when-file-based repo format "custom_id"))]
    (merge (apply dissoc block (conj (when-not keep-uuid? [:block/_refs]) :block/pre-block? :block/meta))
           (cond->
            {:block/page {:db/id (:db/id page)}
             :block/format format
             :block/title new-content}
             (not db-based?)
             (assoc :block/properties (apply dissoc (:block/properties block)
                                        (concat
                                         (when-not keep-uuid? [:id])
                                         [:custom_id :custom-id]
                                         exclude-properties)))
             (not db-based?)
             (assoc :block/properties-text-values (apply dissoc (:block/properties-text-values block)
                                                         (concat
                                                          (when-not keep-uuid? [:id])
                                                          exclude-properties)))))))

(defn- edit-last-block-after-inserted!
  [result]
  (util/schedule
   (fn []
     (when-let [last-block (last (:blocks result))]
       (clear-when-saved!)
       (let [last-block' (db/entity [:block/uuid (:block/uuid last-block)])]
         (edit-block! last-block' :max))))))

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
                  keep-uuid?
                  revert-cut-txs
                  skip-empty-target?
                  ops-only?]
           :or {exclude-properties []}}]
  (let [editing-block (when-let [editing-block (state/get-edit-block)]
                        (some-> (db/entity [:block/uuid (:block/uuid editing-block)])
                          (assoc :block/title (state/get-edit-content))))
        has-unsaved-edits (and editing-block
                            (not= (:block/title (db/entity (:db/id editing-block)))
                              (state/get-edit-content)))
        target-block (or target-block editing-block)
        block (db/entity (:db/id target-block))
        page (if (:block/name block) block
               (when target-block (:block/page (db/entity (:db/id target-block)))))
        empty-target? (if (true? skip-empty-target?) false
                        (string/blank? (:block/title target-block)))
        paste-nested-blocks? (nested-blocks blocks)
        target-block-has-children? (db/has-children? (:block/uuid target-block))
        replace-empty-target? (and empty-target?
                                (or (not target-block-has-children?)
                                  (and target-block-has-children? (= (count blocks) 1))))
        target-block' (if (and empty-target? target-block-has-children? paste-nested-blocks?)
                        (or (ldb/get-left-sibling target-block)
                          (:block/parent (db/entity (:db/id target-block))))
                        target-block)
        sibling? (cond
                   (and paste-nested-blocks? empty-target?)
                   (= (:block/parent target-block') (:block/parent target-block))

                   (some? sibling?)
                   sibling?

                   target-block-has-children?
                   false

                   :else
                   true)
        transact-blocks! #(ui-outliner-tx/transact!
                            {:outliner-op :insert-blocks
                             :additional-tx revert-cut-txs}
                            (when target-block'
                              (let [format (or (:block/format target-block') (state/get-preferred-format))
                                    repo (state/get-current-repo)
                                    blocks' (map (fn [block]
                                                   (paste-block-cleanup repo block page exclude-properties format content-update-fn keep-uuid?))
                                              blocks)]
                                (outliner-op/insert-blocks! blocks' target-block' {:sibling? sibling?
                                                                                   :outliner-op :paste
                                                                                   :replace-empty-target? replace-empty-target?
                                                                                   :keep-uuid? keep-uuid?}))))]
    (if ops-only?
      (transact-blocks!)
      (p/let [_ (when has-unsaved-edits
                  (ui-outliner-tx/transact!
                    {:outliner-op :save-block}
                    (outliner-save-block! editing-block)))
              result (transact-blocks!)]
        (state/set-block-op-type! nil)
        (when-let [result (some-> result (ldb/read-transit-str))]
          (edit-last-block-after-inserted! result) result)))))

(defn- block-tree->blocks
  "keep-uuid? - maintain the existing :uuid in tree vec"
  [repo tree-vec format keep-uuid? page-name]
  (->> (outliner-core/tree-vec-flatten tree-vec)
       (map (fn [block]
              (let [content (:content block)
                    props (into [] (:properties block))
                    content* (str (if (= :markdown format) "- " "* ")
                                  (property-file/insert-properties-when-file-based repo format content props))
                    ast (mldoc/->edn content* format)
                    blocks (->> (block/extract-blocks ast content* format {:page-name page-name})
                                (map wrap-parse-block))
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
  (let [repo (state/get-current-repo)
        page-id (:db/id (:block/page target-block))
        page-name (some-> page-id (db/entity) :block/name)
        blocks (block-tree->blocks repo tree-vec format keep-uuid? page-name)
        blocks (gp-block/with-parent-and-order page-id blocks)
        block-refs (->> (mapcat :block/refs blocks)
                        (set)
                        (filter (fn [ref] (and (vector? ref) (= :block/uuid (first ref))))))]
    (ui-outliner-tx/transact!
     {:outliner-op :paste-blocks}
     (when (seq block-refs)
       (db/transact! (map (fn [[_ id]] {:block/uuid id}) block-refs)))
     (paste-blocks blocks (merge opts {:ops-only? true})))))

(defn insert-block-tree-after-target
  "`tree-vec`: a vector of blocks.
   A block element: {:content :properties :children [block-1, block-2, ...]}"
  [target-block-id sibling? tree-vec format keep-uuid?]
  (insert-block-tree tree-vec format
                     {:target-block       (db/entity target-block-id)
                      :keep-uuid?         keep-uuid?
                      :skip-empty-target? true
                      :sibling?           sibling?}))

(defn insert-template!
  ([element-id db-id]
   (insert-template! element-id db-id {}))
  ([element-id db-id {:keys [target] :as opts}]
   (let [repo (state/get-current-repo)
         db? (config/db-based-graph? repo)]
     (when-not db?
       (p/let [block (if (integer? db-id)
                       (db-async/<pull repo db-id)
                       (db-async/<get-template-by-name (name db-id)))
               block (when (:block/uuid block)
                       (db-async/<get-block repo (:block/uuid block)
                                            {:children? true
                                             :nested-children? true}))]
         (when (:db/id block)
           (let [journal? (ldb/journal? target)
                 target (or target (state/get-edit-block))
                 format (:block/format block)
                 block-uuid (:block/uuid block)
                 template-including-parent? (not (false? (:template-including-parent (:block/properties block))))
                 blocks (db/get-block-and-children repo block-uuid)
                 sorted-blocks (cons
                                (-> (first blocks)
                                    (update :block/properties-text-values dissoc :template)
                                    (update :block/properties-order (fn [keys]
                                                                      (vec (remove #{:template} keys)))))
                                (rest blocks))
                 blocks (if template-including-parent?
                          sorted-blocks
                          (drop 1 sorted-blocks))]
             (when element-id
               (insert-command! element-id "" format {:end-pattern commands/command-trigger}))
             (let [exclude-properties [:id :template :template-including-parent]
                   content-update-fn (fn [content]
                                       (->> content
                                            (property-file/remove-property-when-file-based repo format "template")
                                            (property-file/remove-property-when-file-based repo format "template-including-parent")
                                            template/resolve-dynamic-template!))
                   page (if (:block/name block) block
                            (when target (:block/page (db/entity (:db/id target)))))
                   blocks' (map (fn [block]
                                  (paste-block-cleanup repo block page exclude-properties format content-update-fn false))
                                blocks)
                   sibling? (:sibling? opts)
                   sibling?' (cond
                               (some? sibling?)
                               sibling?

                               (db/has-children? (:block/uuid target))
                               false

                               :else
                               true)]
               (when (seq blocks')
                 (try
                   (p/let [result (ui-outliner-tx/transact!
                                   {:outliner-op :insert-blocks
                                    :created-from-journal-template? journal?}
                                   (when-not (string/blank? (state/get-edit-content))
                                     (save-current-block!))
                                   (outliner-op/insert-blocks! blocks' target
                                                               (assoc opts :sibling? sibling?')))]
                     (when result (edit-last-block-after-inserted! (ldb/read-transit-str result))))

                   (catch :default ^js/Error e
                     (notification/show!
                      [:p.content
                       (util/format "Template insert error: %s" (.-message e))]
                      :error))))))))))))

(defn template-on-chosen-handler
  [element-id]
  (fn [[_template template-block] _click?]
    (when-let [db-id (:db/id template-block)]
      (insert-template! element-id db-id
                        {:replace-empty-target? true}))))

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

(declare indent-outdent)

(defn- last-top-level-child?
  [{:keys [id]} block]
  (when id
    (when-let [entity (if-let [id' (parse-uuid (str id))]
                        (db/entity [:block/uuid id'])
                        (db/get-page id))]
      (= (:block/uuid entity) (:block/uuid (:block/parent block))))))

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
                                (str s1 insertion))
       ;; HACK: save scroll-pos of current pos, then add trailing content
       ;; This logic is also in commands/simple-insert!
       (let [scroll-container (util/nearest-scrollable-container input)
             scroll-pos (.-scrollTop scroll-container)]
         (state/set-edit-content! (state/get-edit-input-id)
                                  (str s1 insertion s2))
         (cursor/move-cursor-to input (+ selected-start (count insertion)))
         (set! (.-scrollTop scroll-container) scroll-pos))))))

(defn- keydown-new-line
  "Insert newline to current cursor position"
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
                (if (property-file/property-key-exist?-when-file-based format content property-key)
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
                  (property-file/goto-properties-end-when-file-based format input)
                  (cursor/move-cursor-to-line-end input))
              :else
              ;;When cursor in other place of PROPERTIES drawer, add :|: in a new line and move cursor to |
              (do
                (insert "\n:: ")
                (cursor/move-cursor-backward input move-to-pos)))
            (insert "\n")))))))

(defn toggle-list-checkbox
  [{:block/keys [title] :as block} item-content]
  (let [toggle-fn (fn [m x-mark]
                    (case (string/lower-case x-mark)
                      "[ ]" (str "[x] " item-content)
                      "[x]" (str "[ ] " item-content)
                      m))
        pattern (re-pattern (str "(\\[[xX ]\\])\\s+?" (gstring/regExpEscape item-content)))
        new-content (string/replace-first title pattern toggle-fn)]
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
        (let [block (db/entity (:db/id block))
              input (state/get-input)
              config (assoc config :keydown-new-block true)
              content (gobj/get input "value")
              pos (cursor/pos input)
              has-right? (ldb/get-right-sibling block)
              db-based? (config/db-based-graph? (state/get-current-repo))
              thing-at-point ;intern is not supported in cljs, need a more elegant solution
              (or (when (thingatpt/get-setting :admonition&src?)
                    (thingatpt/admonition&src-at-point input))
                  (when (thingatpt/get-setting :markup?)
                    (thingatpt/markup-at-point input))
                  (when (thingatpt/get-setting :block-ref?)
                    (thingatpt/block-ref-at-point input))
                  (when (thingatpt/get-setting :page-ref?)
                    (thingatpt/page-ref-at-point input))
                  (when (and (not db-based?) (thingatpt/get-setting :properties?))
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

            (and (string/blank? content)
                 (own-order-number-list? block)
                 (not (some-> (db-model/get-block-parent (:block/uuid block))
                              (own-order-number-list?))))
            (remove-block-own-order-list-type! block)

            (and
             (string/blank? content)
             (not has-right?)
             (not (last-top-level-child? config block)))
            (indent-outdent false)

            :else
            (insert-new-block! state)))))))

(defn- inside-of-single-block
  "When we are in a single block wrapper, we should always insert a new line instead of new block"
  [el]
  (some? (dom/closest el ".single-block")))

(defn- inside-of-editor-block
  [el]
  (some? (dom/closest el ".block-editor")))

(defn keydown-new-block-handler [^js e]
  (let [state (get-state)]
    (when (or (nil? (.-target e)) (inside-of-editor-block (.-target e)))
      (if (or (state/doc-mode-enter-for-new-line?) (inside-of-single-block (rum/dom-node state)))
        (keydown-new-line)
        (do
          (.preventDefault e)
          (keydown-new-block state))))))

(defn keydown-new-line-handler [e]
  (let [state (get-state)]
    (when (or (nil? (.-target e)) (inside-of-editor-block (.-target e)))
      (if (and (state/doc-mode-enter-for-new-line?) (not (inside-of-single-block (rum/dom-node state))))
        (keydown-new-block state)
        (do
          (.preventDefault e)
          (keydown-new-line))))))

(defn- select-first-last
  "Select first or last block in viewpoint"
  [direction]
  (let [f (case direction :up last :down first)
        container (if (some-> js/document.activeElement
                        (.querySelector ".blocks-container"))
                    js/document.activeElement js/document.body)
        block (->> (util/get-blocks-noncollapse container)
                   (f))]
    (when block
      (util/scroll-to-block block)
      (state/exit-editing-and-set-selected-blocks! [block]))))

(defn- select-up-down [direction]
  (let [selected-blocks (state/get-selection-blocks)
        selected (case direction
                   :up (first selected-blocks)
                   :down (last selected-blocks))
        f (case direction
            :up util/get-prev-block-non-collapsed
            :down util/get-next-block-non-collapsed)
        sibling-block (f selected {:up-down? true})]
    (when (and sibling-block (dom/attr sibling-block "blockid"))
      (util/scroll-to-block sibling-block)
      (state/exit-editing-and-set-selected-blocks! [sibling-block]))))

(defn- move-cross-boundary-up-down
  [direction move-opts]
  (when-let [input (state/get-input)]
    (let [line-pos (util/get-line-pos (.-value input) (util/get-selection-start input))
          repo (state/get-current-repo)
          f (case direction
              :up util/get-prev-block-non-collapsed
              :down util/get-next-block-non-collapsed)
          current-block (util/rec-get-node input "ls-block")
          sibling-block (f current-block {:up-down? true})
          {:block/keys [uuid title format]} (state/get-edit-block)]
      (if sibling-block
        (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
          (let [container-id (some-> (dom/attr sibling-block "containerid") js/parseInt)
                value (state/get-edit-content)]
            (p/do!
             (when (not= (clean-content! repo format title)
                         (string/trim value))
               (save-block! repo uuid value))

             (let [new-uuid (cljs.core/uuid sibling-block-id)
                   block (db/entity [:block/uuid new-uuid])]
               (edit-block! block
                            (or (:pos move-opts)
                                [direction line-pos])
                            {:container-id container-id
                             :direction direction})))))
        (case direction
          :up (cursor/move-cursor-to input 0)
          :down (cursor/move-cursor-to-end input))))))

(defn keydown-up-down-handler
  [direction {:keys [_pos] :as move-opts}]
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
      (move-cross-boundary-up-down direction move-opts)

      :else
      (if up?
        (cursor/move-cursor-up input)
        (cursor/move-cursor-down input)))))

(defn- move-to-block-when-cross-boundary
  [direction]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:block/keys [format uuid] :as block} (state/get-edit-block)
        repo (state/get-current-repo)
        editing-block (gdom/getElement (state/get-editing-block-dom-id))
        f (if up? util/get-prev-block-non-collapsed util/get-next-block-non-collapsed)
        sibling-block (f editing-block)]
    (when sibling-block
      (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
        (let [content (:block/title block)
              value (state/get-edit-content)]
          (when (and value (not= (clean-content! repo format content) (string/trim value)))
            (save-block! repo uuid value)))
        (let [container-id (some-> (dom/attr sibling-block "containerid") js/parseInt)
              block (db/entity repo [:block/uuid (cljs.core/uuid sibling-block-id)])]
          (edit-block! block pos {:container-id container-id}))))))

(defn keydown-arrow-handler
  [direction]
  (let [input (state/get-input)
        element js/document.activeElement
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)
        left? (= direction :left)
        right? (= direction :right)
        block (some-> (state/get-edit-block) :db/id db/entity)
        property? (ldb/property? block)]
    (cond
      (and input (not= input element))
      (.focus input)

      (= input element)
      (cond
        (and property? right? (cursor/end? input) (not= (get-in block [:block/schema :type]) :default))
        (let [pair (util/rec-get-node input "property-pair")
              jtrigger (when pair (dom/sel1 pair ".property-value-container .jtrigger"))]
          (when jtrigger
            (.focus jtrigger)))

        (not= selected-start selected-end)
        (cond
          left?
          (cursor/move-cursor-to input selected-start)
          :else
          (cursor/move-cursor-to input selected-end))

        (or (and left? (cursor/start? input))
            (and right? (cursor/end? input)))
        (move-to-block-when-cross-boundary direction)

        :else
        (if left?
          (cursor/move-cursor-backward input)
          (cursor/move-cursor-forward input)))

      :else
      nil)))

(defn- delete-and-update [^js input start end]
  (util/safe-set-range-text! input "" start end)
  (state/set-edit-content! (state/get-edit-input-id) (.-value input)))

(defn- delete-concat [current-block]
  (p/let [repo (state/get-current-repo)
          collapsed? (util/collapsed? current-block)
          next-block (when-not collapsed?
                       (let [db (db/get-db repo)]
                         (when-let [e (or
                                       ;; first child or next sibling
                                       (ldb/get-first-child db (:db/id current-block))
                                       (db-model/get-next db (:db/id current-block)))]
                           (db/entity (:db/id e)))))]
    (cond
      collapsed?
      nil

      (nil? next-block)
      nil

      :else
      (let [repo (state/get-current-repo)
            editor-state (assoc (get-state)
                                :block-id (:block/uuid next-block)
                                :value (:block/title next-block))]
        (delete-block-inner! repo editor-state)))))

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
        (let [editor-state (get-state)
              custom-query? (get-in editor-state [:config :custom-query?])]
          (when-not custom-query?
            (delete-concat current-block)))

        :else
        (delete-and-update
         input current-pos (util/safe-inc-current-pos-from-start (.-value input) current-pos))))))

(defn keydown-backspace-handler
  [cut? e]
  (let [^js input (state/get-input)
        element js/document.activeElement]
    (if (= input element)
      (let [id (state/get-edit-input-id)
            current-pos (cursor/pos input)
            value (gobj/get input "value")
            deleted (and (> current-pos 0)
                      (util/nth-safe value (dec current-pos)))
            selected-start (util/get-selection-start input)
            selected-end (util/get-selection-end input)
            block (state/get-edit-block)
            block (db/entity (:db/id block))
            repo (state/get-current-repo)
            top-block? (= (:db/id (or (ldb/get-left-sibling block) (:block/parent block)))
                         (:db/id (:block/page block)))
            single-block? (inside-of-single-block (.-target e))
            root-block? (= (:block.temp/container block) (str (:block/uuid block)))]
        (block-handler/mark-last-input-time! repo)
        (cond
          (not= selected-start selected-end)
          (do
            (util/stop e)
            (when cut?
              (js/document.execCommand "copy"))
            (delete-and-update input selected-start selected-end))

          (zero? current-pos)
          (let [editor-state (get-state)
                custom-query? (get-in editor-state [:config :custom-query?])]
            (util/stop e)
            (when (and (not (and top-block? (not (string/blank? value))))
                    (not root-block?)
                    (not single-block?)
                    (not custom-query?))
              (if (own-order-number-list? block)
                (p/do!
                  (save-current-block!)
                  (remove-block-own-order-list-type! block))
                (delete-block! repo))))

          (and (> current-pos 0)
            (contains? #{commands/command-trigger commands/command-ask}
              (util/nth-safe value (dec current-pos))))
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
          (when (and input (not (mobile-util/native-ios?)))
            (util/stop e)
            (delete-and-update
              input (util/safe-dec-current-pos-from-end (.-value input) current-pos) current-pos))))
      false)))

(defn indent-outdent
  [indent?]
  (let [{:keys [block block-container]} (get-state)]
    (when block
      (let [node block-container
            prev-container-id (get-node-container-id node)
            container-id (get-new-container-id (if indent? :indent :outdent) {})]
        (p/do!
         (block-handler/indent-outdent-blocks! [block] indent? save-current-block!)
         (when (and (not= prev-container-id container-id) container-id)
           (state/set-editing-block-id! [container-id (:block/uuid block)])))))))

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

(defn- double-chars-typed?
  [value pos key sym]
  (and (= key sym)
       (>= (count value) 1)
       (> pos 0)
       (= (nth value (dec pos)) sym)
       (if (> (count value) pos)
         (not= (nth value pos) sym)
         true)))

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
      (when (or (not @(:editor/start-pos @state/state))
                (and key (string/starts-with? key "Arrow")))
        (state/set-state! :editor/start-pos pos))

      (cond
        (and (= :page-search (state/get-editor-action))
             (= key commands/hashtag))
        (do
          (util/stop e)
          (notification/show! "Page name can't include \"#\"." :warning))
        ;; stop accepting edits if the new block is not created yet
        (some? @(:editor/async-unsaved-chars @state/state))
        (do
          (when (not= key "Enter")
            (state/update-state! :editor/async-unsaved-chars
                                 (fn [s] (str s key))))
          (util/stop e))

        (and (contains? #{"ArrowLeft" "ArrowRight"} key)
             (contains? #{:property-search :property-value-search} (state/get-editor-action)))
        (state/clear-editor-action!)

        (and (util/goog-event-is-composing? e true) ;; #3218
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
             (zero? pos)
             (string/blank? (.toString (js/window.getSelection))))
        (keydown-backspace-handler false e)

        (and (= key "#")
             (and (> pos 0)
                  (= "#" (util/nth-safe value (dec pos)))))
        (state/clear-editor-action!)

        (and (contains? (set/difference (set (keys reversed-autopair-map))
                                        #{"`"})
                        key)
             (= (get-current-input-char input) key))
        (do
          (util/stop e)
          (cursor/move-cursor-forward input))

        (and (autopair-when-selected key) (string/blank? (util/get-selected-text)))
        nil

        (some? @(:editor/action @state/state))
        nil

        (and (not (string/blank? (util/get-selected-text)))
             (contains? keycode/left-square-brackets-keys key))
        (do
          (autopair input-id "[" format nil)
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

        ; `;;` to add or change property for db graphs
        (let [sym ";"]
          (and (config/db-based-graph? (state/get-current-repo)) (double-chars-typed? value pos key sym)))
        (state/pub-event! [:editor/new-property])

        (let [sym "$"]
          (double-chars-typed? value pos key sym))
        (commands/simple-insert! input-id "$$" {:backward-pos 2})

        (let [sym "^"]
          (double-chars-typed? value pos key sym))
        (commands/simple-insert! input-id "^^" {:backward-pos 2})

        :else
        nil))))

(defn- input-page-ref?
  [k current-pos blank-selected? last-key-code]
  (and blank-selected?
       (contains? keycode/left-square-brackets-keys k)
       (= (:key last-key-code) k)
       (> current-pos 0)))

(defn- default-case-for-keyup-handler
  [input current-pos k code is-processed?]
  (let [last-key-code (state/get-last-key-code)
        blank-selected? (string/blank? (util/get-selected-text))
        non-enter-processed? (and is-processed? ;; #3251
                                  (not= code keycode/enter-code))  ;; #3459
        editor-action (state/get-editor-action)]
    (if (and (= editor-action :page-search-hashtag)
             (input-page-ref? k current-pos blank-selected? last-key-code))
      (do
        (commands/handle-step [:editor/input page-ref/right-brackets {:last-pattern :skip-check
                                                                      :backward-pos 2}])
        (commands/handle-step [:editor/search-page])
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)}))
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
          (and (input-page-ref? k current-pos blank-selected? last-key-code)
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

          :else
          nil)))))

(defn keyup-handler
  [_state input]
  (fn [e key-code]
    (when-not (util/goog-event-is-composing? e)
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
                ;; #3440
               (util/goog-event-is-composing? e true)])]
        (cond
          ;; When you type something after /
          (and (= :commands (state/get-editor-action)) (not= k commands/command-trigger))
          (if (= commands/command-trigger (second (re-find #"(\S+)\s+$" value)))
            (state/clear-editor-action!)
            (let [matched-commands (get-matched-commands input)]
              (if (seq matched-commands)
                (reset! commands/*matched-commands matched-commands)
                (state/clear-editor-action!))))

          :else
          (default-case-for-keyup-handler input current-pos k code is-processed?))

        (close-autocomplete-if-outside input)

        (when-not (or (= k "Shift") is-processed?)
          (state/set-last-key-code! {:key-code key-code
                                     :code code
                                     :key k
                                     :shift? (.-shiftKey e)}))
        (when-not (state/get-editor-action)
          (state/set-editor-last-pos! current-pos))))))

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
      (let [timeout 50]
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
  (when-not (util/input? (.-target e))
    (util/stop e)
    (cut-blocks-and-clear-selections! true)))

(defn shortcut-delete-selection
  [e]
  (when-not (util/input? (.-target e))
    (util/stop e)
    (cut-blocks-and-clear-selections! false)))

(defn- copy-current-block-ref
  [format]
  (when-let [current-block (state/get-edit-block)]
    (when-let [block-id (:block/uuid current-block)]
      (let [db? (config/db-based-graph? (state/get-current-repo))]
        (if (= format "embed")
          (copy-block-ref! block-id
                           (if db?
                             block-ref/->block-ref
                             #(str "{{embed ((" % "))}}")))
          (copy-block-ref! block-id
                           (if db?
                             page-ref/->page-ref
                             block-ref/->block-ref)))))))

(defn copy-current-block-embed []
  (copy-current-block-ref "embed"))

(defn shortcut-copy
  "shortcut copy action:
  * when in selection mode, copy selected blocks
  * when in edit mode but no text selected, copy current block ref
  * when in edit mode with text selected, copy selected text as normal
  * when text is selected on a PDF, copy the highlighted text"
  [e]
  (when-not (auto-complete?)
    (cond
      (state/selection?)
      (shortcut-copy-selection e)

      (state/editing?)
      (let [input (state/get-input)
            selected-start (util/get-selection-start input)
            selected-end (util/get-selection-end input)]
        (save-current-block!)
        (when (= selected-start selected-end)
          (copy-current-block-ref "ref")))

      (and (state/get-current-pdf)
           (.closest (.. js/window getSelection -baseNode -parentElement)  ".pdfViewer"))
      (util/copy-to-clipboard!
       (pdf-utils/fix-selection-text-breakline (.. js/window getSelection toString))
       nil))))

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

(defn whiteboard?
  []
  (and (db-model/whiteboard-page? (state/get-current-page))
       (.closest (.-activeElement js/document) ".logseq-tldraw")))

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

    (whiteboard?)
    (.cut (state/active-tldraw-app))

    :else
    nil))

(defn delete-selection
  [e]
  (cond
    (state/selection?)
    (shortcut-delete-selection e)

    (and (whiteboard?) (not (state/editing?)))
    (.deleteShapes (.-api ^js (state/active-tldraw-app)))

    :else
    nil))

(defn editor-delete
  [e]
  (when (state/editing?)
    (util/stop e)
    (keydown-delete-handler e)))

(defn editor-backspace
  [e]
  (when (state/editing?)
    (keydown-backspace-handler false e)))

(defn- slide-focused?
  []
  (some-> (first (dom/by-class "reveal"))
          (dom/has-class? "focused")))

(defn- in-page-preview?
  []
  (some-> js/document.activeElement
    (.closest ".ls-preview-popup")
    (nil?) (not)))

(defn shortcut-up-down [direction]
  (fn [e]
    (when (and (not (auto-complete?))
               (or (in-page-preview?)
                 (not (in-shui-popup?)))
               (not (slide-focused?))
               (not (state/get-timestamp-block)))
      (util/stop e)
      (cond
        (state/editing?)
        (keydown-up-down-handler direction {})

        (state/selection?)
        (select-up-down direction)

        ;; if there is an edit-input-id set, we are probably still on editing mode,
        ;; that is not fully initialized
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
        f (case direction :left first :right last)
        node (some-> selected-blocks f)]
    (when-let [block-id (some-> node (dom/attr "blockid") uuid)]
      (util/stop e)
      (let [block {:block/uuid block-id}
            left? (= direction :left)
            opts {:container-id (some-> node (dom/attr "containerid") (parse-long))}]
        (edit-block! block (if left? 0 :max) opts)))))

(defn shortcut-left-right [direction]
  (fn [e]
    (when (and (not (auto-complete?))
               (not (state/get-timestamp-block)))
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
         (let [ast (mldoc/->edn content format)
               first-elem-type (first (ffirst ast))]
           (mldoc/block-with-title? first-elem-type))
         true)))

(defn- valid-dsl-query-block?
  "Whether block has a valid dsl query."
  [block repo]
  (if (config/db-based-graph? repo)
    (when-let [title (:block/title block)]
      (string/includes? title "{{query"))
    (->> (:block/macros (db/entity (:db/id block)))
         (some (fn [macro]
                 (let [properties (:block/properties macro)
                       macro-name (:logseq.macro-name properties)
                       macro-arguments (:logseq.macro-arguments properties)]
                   (when-let [query-body (and (= "query" macro-name) (not-empty (string/join " " macro-arguments)))]
                     (seq (:query
                           (try
                             (query-dsl/parse-query query-body)
                             (catch :default _e
                               nil)))))))))))

(defn- valid-custom-query-block?
  "Whether block has a valid custom query."
  [block]
  (let [entity (db/entity (:db/id block))
        content (:block/title entity)]
    (when content
      (when (and (string/includes? content "#+BEGIN_QUERY")
                 (string/includes? content "#+END_QUERY"))
        (let [ast (mldoc/->edn (string/trim content) (or (:block/format entity) :markdown))
              q (mldoc/extract-first-query-from-ast ast)]
          (some? (:query (common-util/safe-read-string q))))))))

(defn collapsable?
  ([block-id]
   (collapsable? block-id {}))
  ([block-id {:keys [semantic? ignore-children?]
              :or {semantic? false
                   ignore-children? false}}]
   (when block-id
     (let [repo (state/get-current-repo)]
       (if-let [block (db/entity [:block/uuid block-id])]
         (let [db-based? (config/db-based-graph? repo)
               tags (:block/tags (db/entity (:db/id block)))
               property-keys (->> (keys (:block/properties block))
                                  (remove db-property/db-attribute-properties)
                                  (remove #(outliner-property/property-with-other-position? (db/entity %))))]
           (or (if ignore-children? false (db-model/has-children? block-id))
               (valid-dsl-query-block? block repo)
               (valid-custom-query-block? block)
               (and db-based?
                    (seq property-keys)
                    (not (db-pu/all-hidden-properties? property-keys)))
               (and db-based? (seq tags)
                    (some (fn [t]
                            (let [properties (map :db/ident (:logseq.property.class/properties (:block/schema t)))]
                              (and (seq properties)
                                   (not (db-pu/all-hidden-properties? properties))))) tags))
               (and
                (:outliner/block-title-collapse-enabled? (state/get-config))
                (block-with-title? (:block/format block)
                                   (:block/title block)
                                   semantic?))))
         false)))))

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
  [{:keys [collapse? expanded? incremental? root-block page]
    :or {collapse? false expanded? false incremental? true root-block nil}}]
  (when-let [page (or page
                      (state/get-current-page)
                      (date/today))]
    (let [block-id (or root-block (parse-uuid page))
          page-id (when-not block-id
                    (:db/id (db/get-page page)))
          blocks (if block-id
                   (db/get-block-and-children (state/get-current-repo) block-id)
                   (db/get-page-blocks-no-cache page-id))
          root-block (or block-id root-block)]
      (if incremental?
        (let [blocks (tree/blocks->vec-tree blocks (or block-id page-id))]
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

(defn set-blocks-collapsed!
  [block-ids value]
  (let [block-ids (map (fn [block-id] (if (string? block-id) (uuid block-id) block-id)) block-ids)
        repo (state/get-current-repo)
        value (boolean value)]
    (when repo
      (save-current-block!) ;; Save the input contents before collapsing
      (ui-outliner-tx/transact! ;; Save the new collapsed state as an undo transaction (if it changed)
       {:outliner-op :collapse-expand-blocks}
       (doseq [block-id block-ids]
         (when-let [block (db/entity [:block/uuid block-id])]
           (let [current-value (boolean (:block/collapsed? block))]
             (when-not (= current-value value)
               (let [block {:block/uuid block-id
                            :block/collapsed? value}]
                 (outliner-save-block! block)))))))
      (doseq [block-id block-ids]
        (state/set-collapsed-block! block-id value)))))

(defn collapse-block! [block-id]
  (when (collapsable? block-id)
    (when-not (skip-collapsing-in-db?)
      (set-blocks-collapsed! [block-id] true))
    (state/set-collapsed-block! block-id true)))

(defn expand-block! [block-id]
  (when-not (skip-collapsing-in-db?)
    (set-blocks-collapsed! [block-id] false))
  (state/set-collapsed-block! block-id false))

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

     (whiteboard?)
     (.setCollapsed (.-api ^js (state/active-tldraw-app)) false)

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

     (whiteboard?)
     (.setCollapsed (.-api ^js (state/active-tldraw-app)) true)

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

(defn toggle-collapse!
  ([e] (toggle-collapse! e false))
  ([e clear-selection?]
    (when e (util/stop e))
    (cond
      (state/editing?)
      (when-let [block (state/get-edit-block)]
        ;; get-edit-block doesn't track the latest collapsed state, so we need to reload from db.
        (let [block-id (:block/uuid block)
              block (db/entity [:block/uuid block-id])]
          (if (:block/collapsed? block)
            (expand! e clear-selection?)
            (collapse! e clear-selection?))))

      (state/selection?)
      (do
        (let [block-ids (map #(-> % (dom/attr "blockid") uuid) (get-selected-blocks))
              first-block-id (first block-ids)]
          (when first-block-id
            ;; If multiple blocks are selected, they may not have all the same collapsed state.
            ;; For simplicity, use the first block's state to decide whether to collapse/expand all.
            (let [first-block (db/entity [:block/uuid first-block-id])]
              (if (:block/collapsed? first-block)
                (doseq [block-id block-ids] (expand-block! block-id))
                (doseq [block-id block-ids] (collapse-block! block-id))))))
        (and clear-selection? (clear-selection!)))

      (whiteboard?)
      ;; TODO: Looks like detecting the whiteboard selection's collapse state will take more work.
      ;; Leaving unimplemented for now.
      nil

      :else
      ;; If no block is being edited or selected, the "toggle" action doesn't make sense,
      ;; so we no-op here, unlike in the expand! & collapse! functions.
      nil)))

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

(defn collapse-all-selection!
  []
  (let [block-ids (->> (get-selected-toplevel-block-uuids)
                       (map #(all-blocks-with-level {:incremental? false
                                                     :expanded? true
                                                     :root-block %}))
                       flatten
                       (map :block/uuid)
                       distinct)]
    (set-blocks-collapsed! block-ids true)))

(defn expand-all-selection!
  []
  (let [block-ids (->> (get-selected-toplevel-block-uuids)
                       (map #(all-blocks-with-level {:incremental? false
                                                     :collapse? true
                                                     :root-block %}))
                       flatten
                       (map :block/uuid)
                       distinct)]
    (set-blocks-collapsed! block-ids false)))

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
  [{:keys [page]}]
  (if-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          blocks-container (util/rec-get-blocks-container input)
          blocks (dom/by-class blocks-container "ls-block")]
      (state/exit-editing-and-set-selected-blocks! blocks))
    (->> (all-blocks-with-level {:page page
                                 :collapse? true})
         (map (fn [b] (or (some-> (:db/id (:block/link b)) db/entity) b)))
         (map (comp gdom/getElementByClass (fn [b] (str "id" (:block/uuid b)))))
         state/exit-editing-and-set-selected-blocks!))
  (state/set-state! :selection/selected-all? true))

(defn select-parent [e]
  (let [edit-input (some-> (state/get-edit-input-id) gdom/getElement)
        edit-block (state/get-edit-block)
        target-element (.-nodeName (.-target e))]
    (cond
      ;; editing block fully selected
      (and edit-block edit-input
           (= (util/get-selected-text) (.-value edit-input)))
      (do
        (util/stop e)
        (state/exit-editing-and-set-selected-blocks!
         [(gdom/getElementByClass (str "id" (:block/uuid edit-block)))]))

      edit-block
      nil

      ;; Focusing other input element, e.g. when editing page title.
      (contains? #{"INPUT" "TEXTAREA"} target-element)
      nil

      (whiteboard?)
      (do
        (util/stop e)
        (.selectAll (.-api ^js (state/active-tldraw-app))))

      :else
      (do
        (util/stop e)
        (when-not @(:selection/selected-all? @state/state)
          (if-let [block-id (some-> (first (state/get-selection-blocks))
                                    (dom/attr "blockid")
                                    uuid)]
            (when-let [block (db/entity [:block/uuid block-id])]
              (let [parent (:block/parent block)]
                (cond
                  (= (state/get-current-page) (str (:block/uuid block)))
                  nil

                  (and parent (:block/parent parent))
                  (state/exit-editing-and-set-selected-blocks! [(gdom/getElementByClass (str "id" (:block/uuid parent)))])

                  (:block/name parent)
                  ;; page block
                  (select-all-blocks! {:page (:block/name parent)}))))
            (select-all-blocks! {})))))))

(defn escape-editing
  [& {:keys [select? save-block?]
      :or {save-block? true}}]
  (let [edit-block (state/get-edit-block)]
    (p/do!
     (when save-block? (save-current-block!))
     (if select?
       (when-let [node (some-> (state/get-input) (util/rec-get-node "ls-block"))]
         (state/exit-editing-and-set-selected-blocks! [node]))
       (when (= (:db/id edit-block) (:db/id (state/get-edit-block)))
         (state/clear-edit!))))))

(defn replace-block-reference-with-content-at-point
  []
  (let [repo (state/get-current-repo)]
    (when-let [{:keys [start end link]} (thingatpt/block-ref-at-point)]
      (when-let [block (db/entity [:block/uuid link])]
        (let [block-content (:block/title block)
              format (or (:block/format block) :markdown)
              block-content-without-prop (-> (property-file/remove-properties-when-file-based repo format block-content)
                                             (drawer/remove-logbook))]
          (when-let [input (state/get-input)]
            (when-let [current-block-content (gobj/get input "value")]
              (let [block-content* (str (subs current-block-content 0 start)
                                        block-content-without-prop
                                        (subs current-block-content end))]
                (state/set-block-content-and-last-pos! input block-content* 1)))))))))

(defn copy-current-ref
  [block-id]
  (when block-id
    (util/copy-to-clipboard! (block-ref/->block-ref block-id))))

(defn delete-current-ref!
  [block ref-id]
  (when (and block ref-id)
    (let [match (re-pattern (str "\\s?"
                                 (string/replace (block-ref/->block-ref ref-id) #"([\(\)])" "\\$1")))
          content (string/replace-first (:block/title block) match "")]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn replace-ref-with-text!
  [block ref-id]
  (when (and block ref-id)
    (let [repo (state/get-current-repo)
          match (block-ref/->block-ref ref-id)
          ref-block (db/entity [:block/uuid ref-id])
          block-ref-content (->> (or (:block/title ref-block) "")
                                 (property-file/remove-built-in-properties-when-file-based repo (:block/format ref-block))
                                 (drawer/remove-logbook))
          content (string/replace-first (:block/title block) match
                                        block-ref-content)]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn replace-ref-with-embed!
  [block ref-id]
  (when (and block ref-id)
    (let [match (block-ref/->block-ref ref-id)
          content (string/replace-first (:block/title block) match
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

(defn batch-set-heading!
  [block-ids heading]
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (db-editor-handler/batch-set-heading! repo block-ids heading)
      (file-editor-handler/batch-set-heading! block-ids heading))))

(defn set-heading!
  [block-id heading]
  (batch-set-heading! [block-id] heading))

(defn remove-heading!
  [block-id]
  (set-heading! block-id nil))

(defn batch-remove-heading!
  [block-ids]
  (batch-set-heading! block-ids nil))

(defn block->data-transfer!
  "Set block or page name to the given event's dataTransfer. Used in dnd."
  [block-or-page-name event page?]
  (.setData (gobj/get event "dataTransfer")
            (if page? "page-name" "block-uuid")
            (str block-or-page-name)))
