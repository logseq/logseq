(ns ^:no-doc frontend.handler.editor
  (:require ["path" :as node-path]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as w]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.components.block.selection :as block-selection]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.db.subs :as db-subs]
            [frontend.diff :as diff]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.editor :as editor-common-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.export.html :as export-html]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.entity :as entity]
            [frontend.util.keycode :as keycode]
            [frontend.util.ref :as ref]
            [frontend.util.text :as text-util]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.outliner.core :as outliner-core]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]))

;; FIXME: should support multiple images concurrently uploading

(defonce *asset-uploading? (atom false))
(defonce *asset-uploading-process (atom 0))

(def clear-selection! state/clear-selection!)
(def edit-block! block-handler/edit-block!)

(defn- event-code
  [e]
  (or (gobj/getValueByKeys e "event_" "code")
      (gobj/get e "code")))

(defn- outliner-save-block!
  [block & {:as opts}]
  (outliner-op/save-block! block opts))

(defn get-block-own-order-list-type
  [block]
  (pu/lookup block :logseq.property/order-list-type))

(defn set-block-own-order-list-type!
  [block type]
  (when-let [uuid (:block/uuid block)]
    (property-handler/set-block-property! uuid :logseq.property/order-list-type (name type))))

(defn remove-block-own-order-list-type!
  [block]
  (when-let [uuid (:block/uuid block)]
    (property-handler/remove-block-property! uuid :logseq.property/order-list-type)))

(defn own-order-number-list?
  [block]
  (= (get-block-own-order-list-type block) "number"))

(defn make-block-as-own-order-list!
  [block]
  (some-> block (set-block-own-order-list-type! "number")))

(defn toggle-blocks-as-own-order-list!
  [blocks]
  (when (seq blocks)
    (let [has-ordered?    (some own-order-number-list? blocks)
          blocks-uuids    (some->> blocks (map :block/uuid) (remove nil?))
          order-list-prop :logseq.property/order-list-type]
      (if has-ordered?
        (property-handler/batch-remove-block-property! blocks-uuids order-list-prop)
        (property-handler/batch-set-block-property! blocks-uuids order-list-prop "number")))))

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
             :format (get block :block/format :markdown)
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
    (let [format (get block :block/format :markdown)]
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
    (let [repo (state/get-current-repo)
          lookup-ref (if (number? block-id) block-id [:block/uuid block-id])]
      (p/let [block (state/<invoke-db-worker :thread-api/pull
                                             repo
                                             [:db/id {:block/page [:db/id]}]
                                             lookup-ref)]
        (when-let [db-id (:db/id block)]
          (state/sidebar-add-block! repo db-id (if (:block/page block) :block :page)))))))

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
  (let [blocks (util/get-blocks-by-id block-uuid)]
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
  (db-editor-handler/wrap-parse-block block))

(defn- save-block-inner!
  [block value opts]
  (let [block {:block/uuid (:block/uuid block)
               :block/title value}
        block' (-> (wrap-parse-block block)
                   ;; :block/uuid might be changed when backspace/delete
                   ;; a block that has been refed
                   (assoc :block/uuid (:block/uuid block)))
        opts' (assoc opts :outliner-op :save-block)]
    (ui-outliner-tx/transact!
     opts'
     (outliner-save-block! block'))))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys [force?]
     :as opts}]
   (let [content (:block/title block)]
     (cond
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

(defn- block-map-has-children?
  [block]
  (boolean (or (:block.temp/has-children? block)
               (seq (:block/children block)))))

(defn- ref-db-id
  [x]
  (if (map? x) (:db/id x) x))

(defn- block-parent-id
  [block]
  (ref-db-id (:block/parent block)))

(defn- block-page-id
  [block]
  (ref-db-id (:block/page block)))

(defn- worker-children
  [block]
  (or (:children block) (:block/children block)))

(defn- worker-block-with-children
  [result]
  (if (:block result)
    (assoc (:block result) :children (:children result))
    result))

(defn- worker-has-children?
  [block]
  (boolean (or (seq (worker-children block))
               (:block.temp/has-children? block))))

(declare save-block-aux! save-current-block! <left-sibling-or-parent)

(defn outliner-insert-block!
  [config current-block new-block {:keys [sibling? keep-uuid? ordered-list?
                                          replace-empty-target? outliner-op]}]
  (let [ref-query-top-block? (and (or (:ref? config)
                                      (:custom-query? config))
                                  (not (:ref-query-child? config)))
        has-children? (block-map-has-children? current-block)
        library? (:library? config)
        sibling? (cond
                   ref-query-top-block?
                   false

                   (and library? (entity/page? current-block))
                   true

                   (boolean? sibling?)
                   sibling?

                   (util/collapsed? current-block)
                   true

                   :else
                   (not has-children?))
        new-block' (if library?
                     (-> new-block
                         (-> (assoc :block/tags #{:logseq.class/Page}
                                    :block/name (util/page-name-sanity-lc (:block/title new-block)))
                             (dissoc :block/page)))
                     new-block)
        insert-opts {:sibling? sibling?
                     :keep-uuid? keep-uuid?
                     :ordered-list? ordered-list?
                     :replace-empty-target? replace-empty-target?
                     :outliner-op outliner-op}]
    (ui-outliner-tx/transact!
     (cond-> (merge {:outliner-op :insert-blocks}
                    (block-handler/outliner-tx-meta current-block config))
       (and outliner-op (not= outliner-op :insert-blocks))
       (assoc :source-outliner-op outliner-op)

       (:editor/edit-block-fn config)
       (assoc :editor/edit-block-fn (:editor/edit-block-fn config)))
     (save-current-block! {:current-block current-block})
     (outliner-op/insert-blocks! [new-block'] current-block insert-opts))))

(defn- block-self-alone-when-insert?
  [config uuid]
  (let [current-page (state/get-current-page)
        block-id (or (some-> (:id config) parse-uuid)
                     (some-> current-page parse-uuid))]
    (= uuid block-id)))

(defn- start-pending-new-block!
  []
  (state/set-state! :editor/pending-new-block {:typed-text ""}))

(defn- pending-new-block
  []
  (state/get-state :editor/pending-new-block))

(defn- pending-new-block?
  []
  (some? (pending-new-block)))

(defn- append-pending-new-block-text!
  [text]
  (when (pending-new-block?)
    (state/update-state! :editor/pending-new-block
                         #(update % :typed-text str text))))

(defn- queue-pending-new-block-tab!
  [indent?]
  (when (pending-new-block?)
    (state/update-state! :editor/pending-new-block
                         #(assoc % :tab-indent? indent?))))

(defn- backspace-pending-new-block!
  []
  (when (pending-new-block?)
    (state/update-state!
     :editor/pending-new-block
     (fn [{:keys [typed-text] :as pending}]
       (if (seq typed-text)
         (assoc pending :typed-text (subs typed-text 0 (dec (count typed-text))))
         (assoc pending :delete? true))))))

(defn- clear-pending-new-block!
  []
  (state/set-state! :editor/pending-new-block nil))

(declare get-new-container-id)
(declare delete-block-aux!)

(defn- inserted-block-edit-fn
  [source-block block container-id]
  (fn [rows]
    (let [block' (or (some #(when (= (:block/uuid block) (:block/uuid %)) %) rows)
                     block)
          source-block' (or (some #(when (= (:block/uuid source-block) (:block/uuid %)) %) rows)
                            source-block)
          {:keys [typed-text tab-indent? delete?]} (pending-new-block)]
      (if delete?
        (let [source-title (:block/title source-block')
              block-title (:block/title block')]
          (p/do!
           (edit-block! source-block' (+ (count source-title) (count typed-text))
                        {:container-id container-id
                         :custom-content (str source-title typed-text block-title)
                         :tail-len (count block-title)
                         :save-code-editor? false
                         :skip-load? true})
           (delete-block-aux! block')
           (let [latest-text (:typed-text (pending-new-block))]
             (edit-block! source-block' (+ (count source-title) (count latest-text))
                          {:container-id container-id
                           :custom-content (str source-title latest-text block-title)
                           :tail-len (count block-title)
                           :save-code-editor? false
                           :skip-load? true}))
           (clear-pending-new-block!)))
        (p/do!
         (when (some? tab-indent?)
           (block-handler/indent-outdent-blocks! [block'] tab-indent? nil))
         (edit-block! block' (count typed-text)
                      (cond-> {:container-id container-id
                               :save-code-editor? false
                               :skip-load? true}
                        (seq typed-text)
                        (assoc :custom-content (str typed-text (:block/title block')))))
         (clear-pending-new-block!))))))

(defn insert-new-block-before-block-aux!
  [config block value]
  (let [edit-input-id (state/get-edit-input-id)
        input (gdom/getElement edit-input-id)
        input-text-selected? (util/input-text-selected? input)
        new-m {:block/uuid (ldb/new-block-id)
               :block/title ""}
        prev-block (-> (merge (select-keys block [:block/parent :block/format :block/page])
                              new-m)
                       (wrap-parse-block))
        repo (state/get-current-repo)]
    (when input-text-selected?
      (let [selection-start (util/get-selection-start input)
            selection-end (util/get-selection-end input)
            [_ new-content] (compute-fst-snd-block-text value selection-start selection-end)]
        (state/set-edit-content! edit-input-id new-content)))
    (p/let [left-or-parent (<left-sibling-or-parent repo block)]
      (let [sibling? (not= (:db/id left-or-parent) (block-parent-id block))
            container-id (or (get-new-container-id :insert {:sibling? sibling?})
                             (:container-id config))
            config (assoc config :editor/edit-block-fn
                          (inserted-block-edit-fn block prev-block container-id))
            result (outliner-insert-block! config left-or-parent prev-block {:sibling? sibling?
                                                                             :keep-uuid? true})]
        [result sibling? prev-block]))))

;; This used to be a list of file attributes. Unclear if remaining ones should be removed
(def retract-attributes
  #{:block/tags :block/alias :block/properties :block/warning})

(defn- current-block-with-title
  [block title]
  (assoc block :block/title title :block/raw-title title))

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
        current-block (current-block-with-title block fst-block-text)
        current-block (apply dissoc current-block retract-attributes)
        new-m {:block/uuid (ldb/new-block-id)
               :block/title snd-block-text}
        next-block (-> (merge (select-keys block [:block/parent :block/format :block/page])
                              new-m)
                       (wrap-parse-block))
        sibling? (or (get-in block [:block/link :block/collapsed?]) (when block-self? false))
        container-id (or (get-new-container-id :insert {:sibling? sibling?})
                         (:container-id config))
        config (assoc config :editor/edit-block-fn
                      (inserted-block-edit-fn current-block next-block container-id))
        result (outliner-insert-block! config current-block next-block {:sibling? sibling?
                                                                        :keep-uuid? true})]
    [result sibling? next-block]))

(defn clear-when-saved!
  []
  (commands/restore-state))

(defn get-state
  []
  (let [[{:keys [on-hide block block-id format sidebar?] block-parent-dom-id :block-parent-id} id config] (state/get-editor-args)
        node (gdom/getElement id)]
    (when node
      (let [value (gobj/get node "value")
            pos (util/get-selection-start node)]
        {:config config
         :on-hide on-hide
         :sidebar? sidebar?
         :format format
         :id id
         :block block
         :block-id block-id
         :block-parent-id block-parent-dom-id
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

(defn- get-node-prev-sibling
  [node]
  (let [parent (gobj/get node "parentNode")]
    (if-not (dom/has-class? parent "blocks-list-wrap")
      (some-> (.-previousSibling parent)
              (dom/sel1 ".ls-block"))
      (.-previousSibling node))))

(defn- get-node-next-sibling
  [node]
  (let [parent (gobj/get node "parentNode")]
    (if-not (dom/has-class? parent "blocks-list-wrap")
      (some-> (.-nextSibling parent)
              (dom/sel1 ".ls-block"))
      (.-nextSibling node))))

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
          (when-let [prev (get-node-prev-sibling node)]
            (when (dom/attr prev "originalblockid")
              (get-node-container-id prev)))

          :move-up
          (let [parent (get-node-parent node)
                prev (when parent (get-node-prev-sibling parent))]
            (when (and prev (dom/attr prev "originalblockid"))
              (get-node-container-id prev)))

          :move-down
          (let [parent (get-node-parent node)
                next (when parent (get-node-next-sibling parent))]
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
  ([state _right-sibling]
   (insert-new-block! state nil nil))
  ([_state block-value _right-sibling]
   (when (not config/publishing?)
      (when-let [state (get-state)]
        (start-pending-new-block!)
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
              block' block
              original-block (:original-block config)
              block'' (or
                       (when original-block
                         (let [e block']
                           (if (and (worker-has-children? e)
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
                          insert-new-block-aux!)]
          (-> (p/let [insert-result (insert-fn config block'' value)
                      _ (first insert-result)]
                (clear-when-saved!))
              (p/catch (fn [error]
                         (clear-pending-new-block!)
                         (throw error)))))))))

(defn api-insert-new-block!
  [content {:keys [page block-uuid
                   sibling? before? start? end?
                   properties
                   custom-uuid replace-empty-target? edit-block? ordered-list? other-attrs
                   outliner-op]
            :or {sibling? false
                 before? false
                 edit-block? true}
            :as config}]
  (when (or page block-uuid)
    (let [before? (if page false before?)
          sibling? (boolean sibling?)
          sibling? (if before? true (if page false sibling?))]
      (p/let [repo (state/get-current-repo)
              block (db-async/<get-block repo (or page block-uuid) {:children? false})]
        (when block
          (if (ldb/recycled? block)
            (notification/show! (t :storage.recycle/readonly) :warning)
            (p/let [left-or-parent (when before?
                                     (<left-sibling-or-parent repo block))
                    last-block (when (and (not sibling?) (not start?))
                                 (db-async/<get-block-sibling repo (:db/id block) :last-child))]
              (let [new-block (-> (select-keys block [:block/page])
                                  (assoc :block/title content))
                    new-block (assoc new-block :block/page
                                     (if page
                                       (:db/id block)
                                       (block-page-id new-block)))
                    new-block (-> new-block
                                  (wrap-parse-block)
                                  (assoc :block/uuid (or custom-uuid (ldb/new-block-id))))
                    new-block (merge new-block other-attrs)
                    block' block
                    [target-block sibling?] (cond
                                              before?
                                              (let [sibling? (if (= (block-parent-id block) (:db/id left-or-parent))
                                                               false sibling?)]
                                                [left-or-parent sibling?])

                                              sibling?
                                              [block' sibling?]

                                              start?
                                              [block' false]

                                              end?
                                              (if last-block
                                                [last-block true]
                                                [block' false])

                                              last-block
                                              [last-block true]

                                              block
                                              [block' sibling?]

                                              :else
                                              nil)
                    edit-existing-block? (and edit-block?
                                              replace-empty-target?
                                              (string/blank? (:block/title last-block)))
                    config (cond-> config
                             (and edit-block? (not edit-existing-block?))
                             (assoc :editor/edit-block-fn
                                    (fn [_rows]
                                      (edit-block! new-block :max
                                                   {:save-code-editor? false}))))]
                (when target-block
                  (p/do!
                   (let [new-block' (if (seq properties)
                                      (into new-block properties)
                                      new-block)]
                     (outliner-insert-block! config target-block new-block'
                                             {:sibling? sibling?
                                              :keep-uuid? true
                                              :ordered-list? ordered-list?
                                              :replace-empty-target? replace-empty-target?
                                              :outliner-op outliner-op}))
                   (when edit-existing-block?
                     (edit-block! last-block :max))
                   (when-let [id (:block/uuid new-block)]
                     (db-async/<get-block repo id {:children? false}))))))))))))

(defn get-selected-blocks
  []
  (distinct (seq (state/get-selection-blocks))))

(defn- unwrap-block-results
  [results]
  (vec (keep :block results)))

(defn db-based-cycle-todo!
  [block]
  (let [status-value (:logseq.property/status block)
        next-status (case (:db/ident status-value)
                      :logseq.property/status.todo
                      :logseq.property/status.doing
                      :logseq.property/status.doing
                      :logseq.property/status.done
                      :logseq.property/status.done
                      nil
                      :logseq.property/status.todo)]
    (property-handler/set-block-property! (:block/uuid block)
                                          :logseq.property/status
                                          next-status)))

(defn cycle-todos!
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))]
      (p/let [results (db-async/<get-blocks (state/get-current-repo) ids {:children? false})]
        (ui-outliner-tx/transact!
         {:outliner-op :cycle-todos}
         (doseq [block (unwrap-block-results results)]
           (when block
             (db-based-cycle-todo! block))))))))

(defn cycle-todo!
  []
  #_:clj-kondo/ignore
  (when-not (state/get-editor-action)
    (if-let [blocks (seq (get-selected-blocks))]
      (cycle-todos!)
      (when-let [edit-block (state/get-edit-block)]
        (ui-outliner-tx/transact!
         {:outliner-op :cycle-todos}
         (db-based-cycle-todo! edit-block))))))

(defn delete-block-aux!
  ([block]
   (delete-block-aux! block nil))
  ([block edit-block-f]
   (when block
     (let [blocks (block-handler/get-top-level-blocks [block])]
       (ui-outliner-tx/transact!
        (cond-> (merge {:outliner-op :delete-blocks}
                       (block-handler/outliner-tx-meta block))
          edit-block-f
          (assoc :editor/edit-block-fn (fn [_rows] (edit-block-f))))
        (outliner-op/delete-blocks! blocks {}))))))

(defn- previous-block-edit
  [block value container-id]
  (if (:block/name block)
    {:prev-block block
     :new-value (:block/title block)
     :edit-block-f #(edit-block! block :max {:save-code-editor? false
                                              :skip-load? true})}
    (let [original-content (if (= (:db/id block) (:db/id (state/get-edit-block)))
                             (state/get-edit-content)
                             (:block/title block))
          new-value (str original-content value)
          tail-len (count value)
          pos (max (if original-content
                     (gobj/get (utf8/encode original-content) "length")
                     0)
                   0)]
      {:prev-block block
       :new-content new-value
       :pos pos
       :edit-block-f #(edit-block! block pos {:custom-content new-value
                                               :tail-len tail-len
                                               :container-id container-id
                                               :save-code-editor? false
                                               :skip-load? true})})))

(defn- previous-block-node
  [block-container config]
  (if (:embed? config)
    (util/get-prev-block-non-collapsed
     block-container
     {:container (util/rec-get-blocks-container block-container)})
    (util/get-prev-block-non-collapsed-non-embed block-container)))

(defn- mounted-block
  [node]
  (when node
    (gobj/get node "__logseqBlock")))

(defn- move-to-prev-block
  [repo sibling-block value]
  (when (and repo sibling-block)
    (when-let [sibling-block-id (dom/attr sibling-block "blockid")]
      (p/let [block (or (mounted-block sibling-block)
                        (db-async/<get-block repo (uuid sibling-block-id) {:children? false}))]
        (when block
          (previous-block-edit block value
                               (some-> (dom/attr sibling-block "containerid")
                                       util/safe-parse-int)))))))

(defn- edit-previous-window-block-fn
  [sibling-block]
  (when-let [block-id (some-> (dom/attr sibling-block "blockid") uuid)]
    (let [container-id (some-> (dom/attr sibling-block "containerid")
                               util/safe-parse-int)
          mounted (mounted-block sibling-block)]
      (fn [rows]
        (when-let [block (or (some #(when (= block-id (:block/uuid %)) %) rows)
                             mounted)]
          (when-let [edit-block-f (:edit-block-f (previous-block-edit block "" container-id))]
            (edit-block-f)))))))

(defn- loaded-block-edit
  [block value container-id]
  (when block
    (previous-block-edit block value container-id)))

(declare save-block!)

(defn- one-page-another-block
  [block1 block2]
  (and
   (not (every? entity/page? [block1 block2]))
   (or (entity/page? block1)
       (entity/page? block2))))

(defn- editor-block-preserved-on-empty-title-merge?
  [block]
  (or (ldb/asset? block)
      (comments-model/comments-area? block)))

(defn- block-ref-key
  [block-ref]
  (if (map? block-ref)
    (or (:db/id block-ref) (:block/uuid block-ref))
    block-ref))

(defn- mounted-left-sibling-or-parent
  [block previous-block]
  (let [parent-key (block-ref-key (:block/parent block))]
    (when (and parent-key previous-block
               (not= (block-ref-key block) (block-ref-key previous-block))
               (or (= parent-key (block-ref-key previous-block))
                   (= parent-key (block-ref-key (:block/parent previous-block)))))
      previous-block)))

(defn- <left-sibling-or-parent
  ([repo block]
   (<left-sibling-or-parent repo block nil))
  ([repo block previous-block]
   (or (mounted-left-sibling-or-parent block previous-block)
       (p/let [left (when-let [block-id (:db/id block)]
                      (db-async/<get-block-sibling repo block-id :left))]
         (or left (:block/parent block))))))

(defn- delete-block-with-previous!
  [{:keys [block current-block next-block prev-block new-content edit-block-f
           input-empty? delete-concat?]}]
  (let [concat-prev-block? (boolean (and prev-block new-content))]
    (cond
      (and prev-block (:block/name prev-block)
           (not= (:db/id prev-block) (block-parent-id block))
           (ldb/hidden? (:block/page block)))
      nil

      (and concat-prev-block?
           input-empty?
           (not (editor-block-preserved-on-empty-title-merge? prev-block))
           delete-concat?)
      (let [children (worker-children current-block)]
        (ui-outliner-tx/transact!
          (assoc (merge {:outliner-op :delete-blocks}
                        (block-handler/outliner-tx-meta current-block))
                 :editor/edit-block-fn
                 (fn [_rows]
                   (edit-block! next-block 0 {:save-code-editor? false
                                              :skip-load? true})))
          (when (seq children)
            (outliner-op/move-blocks!
             (remove #(= (:db/id %) (:db/id next-block)) children)
             next-block
             {:sibling? false}))
          (when (= (:db/id current-block) (block-parent-id next-block))
            (outliner-op/move-blocks! [next-block] current-block {:sibling? true}))
          (delete-block-aux! current-block)))

      (and concat-prev-block?
           (string/blank? (:block/title prev-block))
           (not= (:db/id prev-block) (block-parent-id block))
           (not (editor-block-preserved-on-empty-title-merge? prev-block))
           (not delete-concat?))
      (ui-outliner-tx/transact!
        (assoc (merge {:outliner-op :delete-blocks}
                      (block-handler/outliner-tx-meta prev-block))
               :editor/edit-block-fn
               (fn [_rows]
                 (edit-block! current-block 0 {:save-code-editor? false
                                               :skip-load? true})))
        (when-not (= (block-parent-id block) (block-parent-id prev-block))
          (outliner-op/move-blocks! [block] prev-block {:sibling? true}))
        (delete-block-aux! prev-block))

      concat-prev-block?
      (let [preserve-prev-block? (editor-block-preserved-on-empty-title-merge? prev-block)
            delete-target (cond
                            delete-concat? next-block
                            (and preserve-prev-block? next-block
                                 (= (:db/id prev-block) (:db/id block))) next-block
                            :else block)
            children (worker-children delete-target)
            delete-target-uuid (:block/uuid delete-target)
            document (some-> js/globalThis .-document)
            delete-target-node (when document
                                 (.querySelector document
                                                 (str "[blockid=\"" delete-target-uuid "\"]")))]
        (when delete-target-node
          (.add (.-classList delete-target-node) "invisible"))
        (-> (p/do!
             (mobile-util/mobile-focus-hidden-input)
             (when edit-block-f
               (edit-block-f))
             (ui-outliner-tx/transact!
              (merge {:outliner-op :delete-blocks}
                     (block-handler/outliner-tx-meta delete-target))
              (when (seq children)
                (outliner-op/move-blocks! children prev-block {:sibling? false}))
              (delete-block-aux! delete-target)
              (save-block-aux! prev-block
                               new-content
                               (cond-> {}
                                 preserve-prev-block?
                                 (assoc :retract-attributes? false)))))
            (p/catch (fn [error]
                       (when (and delete-target-node (.-isConnected delete-target-node))
                         (.remove (.-classList delete-target-node) "invisible"))
                       (throw error)))))

      :else
      (do
        (when edit-block-f
          (edit-block-f))
        (delete-block-aux! block)))))

(defn delete-block-inner!
  [repo {:keys [block block-id value config block-container current-block next-block delete-concat?]}]
  (when (and block-id (not (one-page-another-block current-block next-block)))
    (let [input-empty? (string/blank? (state/get-edit-content))
          loaded-block (if delete-concat?
                         current-block
                         nil)]
      (p/let [loaded-previous-edit (loaded-block-edit loaded-block value (:container-id config))
              block-e (or current-block
                          block
                          (p/let [result (db-async/<get-block-with-children repo block-id {:children? true})]
                            (worker-block-with-children result)))]
        (when (:block/parent block-e)
          (let [has-children? (seq (worker-children block-e))
                block block-e
                current-block (or current-block block)
                sibling-or-parent-node (previous-block-node block-container config)
                previous-block (mounted-block sibling-or-parent-node)]
            (p/let [left (<left-sibling-or-parent repo block previous-block)]
              (let [left-has-children? (and left
                                            (or (= (:db/id left) (block-parent-id block))
                                                (worker-has-children? left)))
                    delete-empty-parent? (and delete-concat?
                                              (= (:db/id current-block) (block-parent-id next-block))
                                              (not (worker-has-children? next-block)))]
                (when-not (and has-children? left-has-children? (not delete-empty-parent?))
                  (p/let [{:keys [prev-block new-content edit-block-f]}
                          (or loaded-previous-edit
                              (move-to-prev-block repo sibling-or-parent-node value))]
                    (delete-block-with-previous!
                     {:block block
                      :current-block current-block
                      :next-block next-block
                      :prev-block prev-block
                      :new-content new-content
                      :edit-block-f edit-block-f
                      :input-empty? input-empty?
                      :delete-concat? delete-concat?})))))))))))

(defn move-blocks!
  [blocks target opts]
  (when (comments-model/move-allowed? blocks target opts)
    (if (or (some ldb/recycled? blocks)
            (ldb/recycled? target))
      (notification/show! (t :storage.recycle/readonly) :warning)
      (ui-outliner-tx/transact!
       (merge {:outliner-op :move-blocks}
              (block-handler/outliner-tx-meta (first blocks)))
       (outliner-op/move-blocks! blocks target opts)))))

(defn move-selected-blocks
  [e]
  (util/stop e)
  (let [block-ids (or (seq (state/get-selection-block-ids))
                      (when-let [id (:block/uuid (state/get-edit-block))]
                        [id]))]
    (if (seq block-ids)
      (p/let [results (db-async/<get-blocks (state/get-current-repo) block-ids {:children? false})
              loaded-blocks (unwrap-block-results results)
              blocks (vec (block-handler/get-top-level-blocks loaded-blocks))]
        (route-handler/go-to-search! :nodes
                                     {:action :move-blocks
                                      :blocks blocks
                                      :trigger (fn [chosen]
                                                 (state/pub-event! [:editor/hide-action-bar])
                                                 (state/clear-selection!)
                                                 (move-blocks! blocks (:source-block chosen) {:bottom? true}))}))
      (notification/show! (t :editor/no-block-selected-warning) :warning))))

(defn delete-block!
  [repo]
  (delete-block-inner! repo (get-state)))

(defn delete-blocks!
  [_repo block-uuids blocks dom-blocks mobile-action-bar?]
  (when (seq block-uuids)
    (let [uuid->dom-block (zipmap block-uuids dom-blocks)
          block (first blocks)
          block-parent (get uuid->dom-block (:block/uuid block))
          sibling-block (when block-parent
                          (util/get-prev-block-non-collapsed-non-embed block-parent))
          blocks' (block-handler/get-top-level-blocks blocks)
          mobile? (util/capacitor?)
          edit-block-fn (when (and sibling-block (not mobile?))
                          (edit-previous-window-block-fn sibling-block))
          journals (and mobile? (filter entity/journal? blocks'))
          blocks (remove (fn [b] (contains? (set (map :db/id journals)) (:db/id b))) blocks)]
      (when (or (seq journals) (seq blocks))
        (ui-outliner-tx/transact!
         (cond-> (merge {:outliner-op :delete-blocks
                         :mobile-action-bar? mobile-action-bar?}
                        (block-handler/outliner-tx-meta (first blocks)))
           edit-block-fn
           (assoc :editor/edit-block-fn edit-block-fn))
         (when (seq blocks)
           (outliner-op/delete-blocks! blocks nil))
         (when (seq journals)
           (doseq [journal journals]
             (outliner-op/delete-page! (:block/uuid journal)))))))))

(defn copy-block-ref!
  ([block-id]
   (copy-block-ref! block-id #(str %)))
  ([block-id tap-clipboard]
   (p/do!
    (save-current-block!)
    (util/copy-to-clipboard! (tap-clipboard block-id)))))

(defn select-block!
  [block-uuid]
  (block-handler/select-block! block-uuid))

(defn- compose-copied-blocks-contents
  [repo block-ids & {:as opts}]
  (p/let [blocks (db-async/<get-block-summaries repo block-ids)]
    (let [top-level-blocks (block-handler/get-top-level-blocks blocks)
          top-level-block-uuids (map :block/uuid top-level-blocks)]
      (p/let [content (export-text/export-blocks-as-markdown
                       repo
                       top-level-block-uuids
                       (merge (dissoc opts :quick-copy?)
                              {:indent-style (state/get-export-block-text-indent-style)
                               :remove-options (set (state/get-export-block-text-remove-options))}))]
        [top-level-block-uuids content blocks]))))

(defn- copy-cached-selection-text!
  [block-uuids]
  (let [blocks (mapv #(let [snapshot (db-subs/block-snapshot %)]
                        (when (= :ready (:status snapshot))
                          (:value snapshot)))
                     block-uuids)]
    (when (every? some? blocks)
      (let [content (->> (block-handler/get-top-level-blocks blocks)
                         (keep :block/title)
                         (remove string/blank?)
                         (string/join "\n"))]
        (when-not (string/blank? content)
          (util/copy-to-clipboard! content))))))

(defn- <sorted-block-and-children
  [repo block & {:as opts}]
  (when-let [block-uuid (:block/uuid block)]
    (p/let [result (db-async/<get-block-with-children repo block-uuid opts)]
      (let [root (:block result)
            children (:children result)]
        (if (entity/page? root)
          children
          (cons root children))))))

(defn- get-all-blocks-by-ids
  [repo ids]
  (p/let [loaded-blocks (db-async/<get-blocks repo ids {:children? false})]
    (let [loaded-blocks (unwrap-block-results loaded-blocks)
          blocks-by-uuid (zipmap (map :block/uuid loaded-blocks) loaded-blocks)]
      (p/loop [ids ids
               result []]
        (if (seq ids)
          (p/let [blocks (<sorted-block-and-children
                          repo
                          (get blocks-by-uuid (first ids))
                          {:include-property-block? true})
                  result (vec (concat result blocks))]
            (p/recur (remove (set (map :block/uuid result)) (rest ids)) result))
          result)))))

(defn copy-selection-blocks
  [html? & {:keys [selected-blocks] :as opts}]
  (let [repo (state/get-current-repo)
        selected-ids (state/get-selection-block-ids)
        ids (or (seq selected-ids) (map :block/uuid selected-blocks))]
    (when (seq selected-ids)
      (copy-cached-selection-text! selected-ids))
    (p/let [[top-level-block-uuids content blocks] (compose-copied-blocks-contents repo ids (assoc opts :quick-copy? true))]
      (when (seq blocks)
        (util/copy-to-clipboard! content)
        (p/let [copied-source-blocks (get-all-blocks-by-ids repo top-level-block-uuids)
                html (export-html/export-blocks-as-html repo top-level-block-uuids nil)]
          (let [copied-blocks (cond->> copied-source-blocks
                                true
                                (map (fn [block]
                                       (let [b block]
                                         (->
                                          (->> (map (fn [[k v]]
                                                      (let [v' (cond
                                                                 (and (map? v) (:db/id v))
                                                                 [:block/uuid (:block/uuid v)]
                                                                 (and (coll? v) (every? #(and (map? %) (:db/id %)) v))
                                                                 (set (map (fn [i] [:block/uuid (:block/uuid i)]) v))
                                                                 :else
                                                                 v)]
                                                        [k v'])) b)
                                               (into {}))
                                          (assoc :db/id (:db/id b)))))))]
            (common-handler/copy-to-clipboard-without-id-property! repo content (when html? html) copied-blocks)))
        (state/set-block-op-type! :copy)
        ;; (notification/show! "Copied!" :success)
        ))))

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
          copy-str (some->> adjusted-blocks
                            (map (fn [{:keys [id level]}]
                                   (str (string/join (repeat (dec level) "\t")) "- " (ref/->page-ref id))))
                            (string/join "\n\n"))]
      (util/copy-to-clipboard! copy-str))))

(defn get-selected-toplevel-block-uuids
  []
  (when-let [blocks (seq (get-selected-blocks))]
    (let [repo (state/get-current-repo)
          block-ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                           (uuid id)) blocks))
                         (remove nil?))]
      (p/let [results (db-async/<get-blocks repo block-ids {:children? false})
              blocks (unwrap-block-results results)
              page-id (block-page-id (first blocks))
              ;; filter out blocks not belong to page with 'page-id'
              blocks* (remove (fn [block] (some-> (block-page-id block) (not= page-id))) blocks)]
        (->> (block-handler/get-top-level-blocks blocks*)
             (map :block/uuid))))))

(defn cut-selection-blocks
  [copy? & {:keys [mobile-action-bar?]}]
  (when copy? (copy-selection-blocks true))
  (state/set-block-op-type! :cut)
  (when-let [blocks (->> (get-selected-blocks)
                         (remove #(dom/has-class? % "property-value-container"))
                         (remove (fn [block] (or (= "true" (dom/attr block "data-query"))
                                                 (= "true" (dom/attr block "data-transclude")))))
                         seq)]
    ;; remove queries
    (let [dom-blocks (remove (fn [block] (= "true" (dom/attr block "data-query"))) blocks)]
      (when (seq dom-blocks)
        (let [repo (state/get-current-repo)
              block-uuids (distinct (keep #(when-let [id (dom/attr % "blockid")] (uuid id)) dom-blocks))]
          (p/let [results (db-async/<get-blocks repo block-uuids {:children? false})]
            (let [blocks (unwrap-block-results results)
                  top-level-blocks (block-handler/get-top-level-blocks blocks)]
              (when-not (every? ldb/recycled? top-level-blocks)
                (when (seq top-level-blocks)
                  (p/let [sorted-blocks* (p/all (map #(<sorted-block-and-children repo %) top-level-blocks))
                          sorted-blocks (mapcat identity sorted-blocks*)]
                    (when (seq sorted-blocks)
                      (delete-blocks! repo (map :block/uuid sorted-blocks) sorted-blocks dom-blocks mobile-action-bar?))))))))))))

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

(defn- <follow-page-link!
  [page]
  (state/clear-edit!)
  (if (util/uuid-string? page)
    (route-handler/redirect-to-page! page)
    (p/let [page-entity (db-async/<get-block (state/get-current-repo) page {:children? false})]
      (if page-entity
        (route-handler/redirect-to-page! page)
        (state/pub-event! [:page/create page])))))

(defn follow-link-under-cursor!
  []
  (when-let [page (get-nearest-page-or-url)]
    (when-not (string/blank? page)
      (p/do!
       (state/clear-editor-action!)
       (save-current-block!)
       (if (re-find url-regex page)
         (js/window.open page)
         (<follow-page-link! page))))))

(defn- sidebar-link-lookup-ref
  [page-name]
  (if (util/uuid-string? page-name)
    [:block/uuid (uuid page-name)]
    [:block/name page-name]))

(defn open-link-in-sidebar!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)
          block? (util/uuid-string? page-name)
          repo (state/get-current-repo)]
      (p/let [page (state/<invoke-db-worker :thread-api/pull
                                            repo
                                            [:db/id]
                                            (sidebar-link-lookup-ref page-name))]
        (when-let [db-id (:db/id page)]
          (state/sidebar-add-block! repo db-id (if block? :block :page)))))))

;; FIXME: shortcut `mod+.` doesn't work on Web (Chrome)
(defn zoom-in! []
  (if (state/editing?)
    (when-let [id (:block/uuid (state/get-edit-block))]
      (state/clear-editor-action!)
      (state/set-editing-block-id! [:unknown-container id])
      (p/do!
       (save-current-block!)
       (route-handler/redirect-to-page! id)))
    (js/window.history.forward)))

(defn zoom-out!
  []
  (if (state/editing?)
    (let [repo (state/get-current-repo)
          page (state/get-current-page)
          block-id (and (string? page) (parse-uuid page))]
      (state/clear-editor-action!)
      (let [saved (save-current-block!)]
        (p/let [_ saved]
          (when block-id
            (state/set-editing-block-id! [:unknown-container (:block/uuid (state/get-edit-block))])
            (p/let [block (db-async/<get-block repo block-id {:children? false})
                    block-parents (db-async/<get-block-parents repo (:db/id block) 1)
                    block-parent (first block-parents)]
              (if-let [id (and
                           (nil? (:block/name block-parent))
                           (:block/uuid block-parent))]
                (route-handler/redirect-to-page! id)
                (when-let [page-id (get-in block [:block/page :db/id])]
                  (p/let [page (db-async/<get-block repo page-id {:children? false})]
                    (when-let [page-uuid (:block/uuid page)]
                      (route-handler/redirect-to-page! page-uuid))))))))))
    (js/window.history.back)))

(defn cut-block!
  [block-id]
  (let [repo (state/get-current-repo)]
    (p/let [block (db-async/<get-block repo block-id {:children? false})]
      (when block
        ;; TODO: support org mode
        (p/let [[_top-level-block-uuids md-content] (compose-copied-blocks-contents repo [block-id])]
          (p/let [html (export-html/export-blocks-as-html repo [block-id] nil)
                  sorted-blocks (<sorted-block-and-children repo block)]
            (common-handler/copy-to-clipboard-without-id-property! repo md-content html sorted-blocks)
            (state/set-block-op-type! :cut)
            (delete-block-aux! block)))))))

(defn- selection-node-block-id
  [node]
  (let [id (cond
             (string? node)
             (some-> node
                     (string/replace #"^ls-block-" ""))

             (some-> node .-getAttribute)
             (or (dom/attr node "blockid")
                 (some-> node (dom/attr "id") (string/replace #"^ls-block-" ""))))]
    (when (and (string? id)
               (util/uuid-string? id))
      (uuid id))))

(defn- selection-node-for-block-id
  [block-id]
  (or (first (dom/sel (util/format "[blockid='%s']" block-id)))
      (let [node (.createElement js/document "div")]
        (.setAttribute node "blockid" (str block-id))
        (.setAttribute node "id" (str "ls-block-" block-id))
        node)))

(defn- selection-blocks-by-block-ids
  [block-ids start-node end-node]
  (when-let [range (and (seq block-ids)
                        (block-selection/block-id-range block-ids
                                                        (selection-node-block-id start-node)
                                                        (selection-node-block-id end-node)))]
    {:direction (:direction range)
     :block-ids (:block-ids range)
     :blocks (mapv selection-node-for-block-id (:block-ids range))}))

(defn highlight-selection-area!
  [end-block-id block-dom-element & {:keys [append? block-ids]}]
  (when-let [start-node (state/get-selection-start-block-or-first)]
    (let [end-block-node block-dom-element
          select-direction (state/get-selection-direction)
          selected-blocks (state/get-unsorted-selection-blocks)
          block-id-set (set block-ids)
          boundary-id (some block-id-set
                            (reverse (keep selection-node-block-id selected-blocks)))
          appended-selection (when (and append? boundary-id)
                               (selection-blocks-by-block-ids
                                block-ids
                                (selection-node-for-block-id boundary-id)
                                end-block-node))
          selection (selection-blocks-by-block-ids block-ids start-node end-block-node)
          last-node (last selected-blocks)
          latest-visible-block (or last-node start-node)
          latest-block-id (when latest-visible-block (.-id latest-visible-block))]
      (cond
        selection
        (state/exit-editing-and-set-selected-blocks! (:blocks selection) (:direction selection))

        appended-selection
        (let [{:keys [block-ids direction]} appended-selection
              selected-block-ids (keep selection-node-block-id selected-blocks)
              block-ids (block-selection/unselected-block-ids selected-block-ids
                                                                (rest block-ids))]
          (state/clear-edit!)
          (when (seq block-ids)
            (state/conj-selection-block! (mapv selection-node-for-block-id block-ids)
                                         (or select-direction direction))))

        (and start-node end-block-node)
        (let [blocks (util/get-nodes-between-two-nodes start-node end-block-node "ls-block")
              direction (util/get-direction-between-two-nodes start-node end-block-node "ls-block")
              blocks (if (= direction :up) (reverse blocks) blocks)]
          (state/exit-editing-and-set-selected-blocks! blocks direction))

        latest-visible-block
        (let [blocks (util/get-nodes-between-two-nodes latest-visible-block end-block-node "ls-block")
              direction (if (= latest-block-id end-block-id)
                          select-direction
                          (util/get-direction-between-two-nodes latest-visible-block end-block-node "ls-block"))
              blocks (if (= direction :up) (reverse (util/sort-by-height blocks)) (util/sort-by-height blocks))]
          (if append?
            (do (state/clear-edit!)
                (if (and select-direction (not= direction select-direction))
                  (state/drop-selection-blocks-starts-with! end-block-node)
                  (state/conj-selection-block! blocks direction)))
            (state/exit-editing-and-set-selected-blocks! blocks direction)))))))

(defonce *action-bar-timeout (atom nil))

(declare navigable-sibling-block)

(defn popup-exists?
  [id]
  (some->> (shui-popup/get-popups)
           (some #(some-> % (:id) (str) (string/includes? (str id))))))

(defn dialog-exists?
  [id]
  (shui-dialog/get-dialog id))

(defn show-action-bar!
  [& {:keys [delay]
      :or {delay 200}}]
  (when-not (popup-exists? :selection-action-bar)
    (when-let [timeout @*action-bar-timeout]
      (js/clearTimeout timeout))
    (state/pub-event! [:editor/hide-action-bar])
    (when (seq (remove (fn [b] (dom/has-class? b "ls-table-cell"))
                       (state/get-selection-blocks)))
      (let [timeout (js/setTimeout #(state/pub-event! [:editor/show-action-bar]) delay)]
        (reset! *action-bar-timeout timeout)))))

(defn- select-block-up-down
  [direction]
  (cond
    ;; when editing, quit editing and select current block
    (state/editing?)
    (when-let [element (state/get-editor-block-container)]
      (when element
        (p/do!
         (save-current-block!)
         (util/scroll-to-block element)
         (state/exit-editing-and-set-selected-blocks! [element]))))

    ;; when selection and one block selected, select next block
    (and (state/selection?) (== 1 (count (state/get-selection-blocks))))
    (let [f (if (= :up direction)
              util/get-prev-block-non-collapsed
              (fn [block _opts] (util/get-next-block-non-collapsed-skip block)))
          element (navigable-sibling-block (first (state/get-selection-blocks))
                                           f
                                           {:up-down? true
                                            :direction direction
                                            :exclude-property? true})]
      (when element
        (util/scroll-to-block element)
        (state/conj-selection-block! element direction)))

    ;; if same direction, keep conj on same direction
    (and (state/selection?) (= direction (state/get-selection-direction)))
    (let [f (if (= :up direction)
              util/get-prev-block-non-collapsed
              (fn [block _opts] (util/get-next-block-non-collapsed-skip block)))
          first-last (if (= :up direction) first last)
          element (navigable-sibling-block (first-last (state/get-selection-blocks))
                                           f
                                           {:up-down? true
                                            :direction direction
                                            :exclude-property? true})]
      (when element
        (util/scroll-to-block element)
        (state/conj-selection-block! element direction)))

    ;; if different direction, keep clear until one left
    (state/selection?)
    (let [f (if (= :up direction) util/get-prev-block-non-collapsed util/get-next-block-non-collapsed)
          last-first (if (= :up direction) last first)
          element (navigable-sibling-block (last-first (state/get-selection-blocks))
                                           f
                                           {:up-down? true
                                            :direction direction
                                            :exclude-property? true})]
      (when element
        (util/scroll-to-block element)
        (state/drop-last-selection-block!))))
  (show-action-bar! {:delay 200})
  nil)

(defn on-select-block
  [direction]
  (fn [_event]
    (select-block-up-down direction)))

(defn save-block-aux!
  [block value opts]
  (let [entity block]
    (when (and (:db/id entity) (not (ldb/built-in? entity)))
      (let [value (string/trim value)]
        ;; FIXME: somehow frontend.components.editor's will-unmount event will loop forever
        ;; maybe we shouldn't save in "will-unmount" event?
        (save-block-if-changed! block value opts)))))

(defn save-block!
  ([repo block-or-uuid content]
   (save-block! repo block-or-uuid content {}))
  ([repo block-or-uuid content opts]
   (p/let [block (if (or (uuid? block-or-uuid)
                         (string? block-or-uuid))
                   (db-async/<get-block repo block-or-uuid {:children? false})
                   block-or-uuid)]
     (save-block!
      {:block block :repo repo :opts opts}
      content)))
  ([{:keys [block repo opts] :as _state} value]
   (let [repo (or repo (state/get-current-repo))]
     (when (and repo (:db/id block))
       (save-block-aux! block value opts)))))

(defonce *auto-save-timeout (atom nil))
(defn- clear-block-auto-save-timeout!
  []
  (when @*auto-save-timeout
    (js/clearTimeout @*auto-save-timeout)))

(defn- block-title-for-editor-compare
  [block]
  (when-let [title (:block/title block)]
    (if (number? (:block/level block))
      (common-util/safe-subs title (:block/level block))
      title)))

(defn- current-editor-value
  [input-id current-block edit-block]
  (if (= (:block/uuid current-block) (:block/uuid edit-block))
    (:block/title current-block)
    (when-let [elem (and input-id (gdom/getElement input-id))]
      (gobj/get elem "value"))))

(defn- editor-title-changed?
  [block value]
  (when-let [title (block-title-for-editor-compare block)]
    (not= (string/trim title)
          (string/trim value))))

(defn save-current-block!
  ([]
   (save-current-block! {}))
  ([{:keys [force? current-block] :as opts}]
   (clear-block-auto-save-timeout!)
   ;; non English input method
   (when-not (or (state/editor-in-composition?)
                 (state/get-editor-action))
     (when (state/get-current-repo)
       (try
         (let [input-id (state/get-edit-input-id)
               block (state/get-edit-block)
               value (current-editor-value input-id current-block block)]
           (when value
             (cond
               force?
               (save-block-aux! block value opts)

               (editor-title-changed? block value)
               (save-block-aux! block value opts))))
         (catch :default error
           (js/console.error error)
           (log/error :save-block-failed error)))))))

(defn delete-asset-of-block!
  [{:keys [repo asset-block full-text block-id local? delete-local?] :as _opts}]
  (p/let [block (db-async/<get-block repo block-id {:children? false})
          _ (or block (throw (ex-info (str block-id " not exists")
                                      {:block-id block-id})))
          text (:block/title block)
          content (if asset-block
                    (string/replace text (ref/->page-ref (:block/uuid asset-block)) "")
                    (string/replace text full-text ""))]
    (save-block! repo block content)
    (when (and local? delete-local?)
      (when asset-block
        (delete-block-aux! asset-block)))))

(defn db-based-write-asset!
  [repo file-path file]
  (p/let [buffer (.arrayBuffer file)]
    (fs/write-asset-file! repo file-path buffer)))

(defn- new-asset-block
  [repo ^js file {:keys [external-url] :as opts}]
  ;; WARN file name maybe fully qualified path when paste file
  (p/let [[file title] (if (map? file) [(:src file) (:title file)] [file nil])
          [file external-url] (if (string? file) [nil file] [file external-url])
          file-name (node-path/basename (or (some-> file (.-name)) (str external-url)))
          file-name-without-ext* (db-asset/asset-name->title file-name)
          file-name-without-ext (if (= file-name-without-ext* "image")
                                  (date/get-date-time-string-2)
                                  file-name-without-ext*)
          checksum (some-> (or file external-url) (assets-handler/get-file-checksum))
          size (or (some-> file (.-size)) 0)
          existing-asset (some->> checksum (db-async/<get-asset-with-checksum repo))]
    (if existing-asset
      (do
        (notification/show! (t :asset/already-exists (:block/title existing-asset) (:block/uuid existing-asset))
                            :warning
                            false)
        nil)
      ;; new asset block
      (let [block-id (or (:block/uuid opts) (ldb/new-block-id))
            ext (when file-name (db-asset/asset-path->type file-name))
            _ (when (string/blank? ext)
                (throw (ex-info "File doesn't have a valid ext."
                                {:file-name file-name})))
            _ (when (some-> file (assets-handler/exceed-limit-size?))
                (notification/show! [:div (t :asset/size-too-large)]
                                    :warning
                                    false)
                (throw (ex-info "Asset size shouldn't be larger than 100M" {:file-name file-name})))]
        (p/do!
         (when file
           (let [file-path (str block-id "." ext)]
             (db-based-write-asset! repo file-path file)))
         {:block/title (or title file-name-without-ext)
          :block/uuid block-id
          :logseq.property.asset/type ext
          :logseq.property.asset/external-url external-url
          :logseq.property.asset/size size
          :logseq.property.asset/checksum checksum
          ;; Use stable class ident in tx payload to avoid leaking numeric eids
          ;; into outliner history ops shared with the worker sync pipeline.
          :block/tags #{:logseq.class/Asset}})))))

(defn db-based-save-assets!
  "Save incoming(pasted) assets to assets directory.

   Returns: asset entities"
  [repo files & {:keys [pdf-area? last-edit-block save-to-page target-block]}]
  (let [state-edit-block (when-not target-block
                           (state/get-edit-block))
        edit-content (when state-edit-block
                       (state/get-edit-content))
        edit-block (when-not target-block
                     (or state-edit-block last-edit-block))
        empty-target? (cond
                        target-block false
                        state-edit-block (string/blank? edit-content)
                        last-edit-block (string/blank? (:block/title last-edit-block))
                        :else false)]
    (p/let [[repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
            today-page-name (db-async/<get-today-journal-title repo)
            today-page-e (db-async/<get-journal-page-by-day repo (date/today-journal-day))
            today-page (if (nil? today-page-e)
                         (state/pub-event! [:page/create today-page-name])
                         today-page-e)
            blocks* (p/all
                     (for [^js [idx file] (medley/indexed files)]
                       (new-asset-block repo file
                                        {:repo-dir repo-dir
                                         :asset-dir-rpath asset-dir-rpath
                                         :block/uuid (when (and (zero? idx) empty-target?)
                                                       (:block/uuid edit-block))})))
            blocks (remove nil? blocks*)
            insert-to-current-block-page? (boolean (and (not target-block) (:block/uuid edit-block) (not pdf-area?)))
            target (cond
                     target-block
                     target-block

                     insert-to-current-block-page?
                     edit-block

                     save-to-page
                     save-to-page

                     :else
                     today-page)]
      (when-not target
        (throw (ex-info "invalid target" {:files files
                                          :today-page today-page
                                          :edit-block edit-block})))
      (when (seq blocks)
        (p/do!
         (ui-outliner-tx/transact!
          {:outliner-op :insert-blocks}
          (outliner-op/insert-blocks! blocks target {:keep-uuid? true
                                                     :bottom? true
                                                     :sibling? (boolean (and edit-block (= edit-block target)))
                                                     :replace-empty-target? insert-to-current-block-page?}))
         (p/let [results (db-async/<get-blocks repo (map :block/uuid blocks) {:children? false})
                 blocks (unwrap-block-results results)]
           (when-let [block (some (fn [block] (when (= (:block/uuid block) (:block/uuid edit-block)) block)) blocks)]
             (edit-block! block :max))
           blocks))))))

(def insert-command! editor-common-handler/insert-command!)

(defn db-upload-assets!
  "Paste asset for db graph and insert link to current editing block"
  [repo id ^js files format uploading? drop-or-paste?]
  (insert-command!
   id
   ""
   format
   {:last-pattern (if drop-or-paste? "" commands/command-trigger)
    :restore?     true
    :command      :insert-asset})
  (-> (db-based-save-assets! repo (js->clj files))
      (p/catch (fn [e]
                 (js/console.error e)))
      (p/finally
        (fn []
          (reset! uploading? false)
          (reset! *asset-uploading? false)
          (reset! *asset-uploading-process 0)))))

(defn upload-asset!
  "Paste asset and insert link to current editing block"
  [id ^js files format uploading? drop-or-paste?]
  (let [repo (state/get-current-repo)]
    (db-upload-assets! repo id ^js files format uploading? drop-or-paste?)))

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
   "$" "$"
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
         ":" ":"))

(defn- autopair
  [input-id prefix _format _option]
  (let [suffix (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected suffix)
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

          (= prefix block-ref/left-parens)
          (notification/show!
           (t :editor/reference-node-use-page-ref)
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
  (let [editing-block (state/get-edit-block)
        non-page-block? (and editing-block (not (entity/page? editing-block)))]
    (p/let [all-classes (db-async/<get-all-classes (state/get-current-repo) {:except-root-class? true})
            private-classes (when non-page-block?
                              (db-async/<get-all-classes (state/get-current-repo)
                                                         {:except-root-class? true
                                                          :except-private-tags? false}))]
      (let [page-class (some #(when (= :logseq.class/Page (:db/ident %)) %) private-classes)
            all-classes (cond-> all-classes
                          (and non-page-block? page-class)
                          (conj page-class))
            classes (->> all-classes
                         (mapcat (fn [class]
                                   (conj (:block/alias class) class)))
                         (common-util/distinct-by :db/id)
                         (map (fn [e] (select-keys e [:db/id :db/ident :block/uuid :block/title]))))]
        (search/fuzzy-search classes q {:extract-fn :block/title})))))

(defn <get-matched-blocks
  "Return matched blocks that are not built-in"
  [q & [{:keys [nlp-pages? page-only?]}]]
  (p/let [block (state/get-edit-block)
          result (search/block-search (state/get-current-repo) q {:built-in? false
                                                                  :limit 20
                                                                  :search-limit 100
                                                                  :enable-snippet? false
                                                                  :page-only? page-only?})
          matched (remove (fn [b] (= (:block/uuid b) (:block/uuid block))) result)
          extract-fn #(str (:block/title %) " " (:nlp-original-title %))
          result' (-> (concat matched
                              (when nlp-pages?
                                (date/nlp-pages-i18n :nlp-date? true :page? true)))
                      (search/fuzzy-search q {:extract-fn extract-fn :limit 50}))
          result'' (let [ids (set (map :block/uuid result'))]
                     (concat result' (remove (fn [item] (ids (:block/uuid item))) matched)))]
    (sort-by (complement :page?) result'')))

(defn <get-matched-templates
  [q]
  (search/template-search q))

(defn get-last-command
  [input]
  (try
    (let [edit-content (or (gobj/get input "value") "")
          pos (cursor/pos input)
          last-slash-caret-pos (:pos (:pos (state/get-editor-action-data)))
          last-command (and last-slash-caret-pos (subs edit-content last-slash-caret-pos pos))]
      (when (> pos 0) last-command))
    (catch :default e
      (js/console.error e)
      nil)))

(defn get-matched-commands
  [command]
  (condp = command
    nil nil
    "" @commands/*initial-commands
    (commands/get-matched-commands command)))

(defn auto-complete?
  []
  (or @*asset-uploading?
      (state/get-editor-action)))

(defn in-shui-popup?
  []
  (or (some-> js/document.activeElement
              (.closest ".ui__dropdown-menu-content, .ui__popover-content, .ui__context-menu-content")
              (nil?)
              (not))
      (.querySelector js/document.body
                      ".ui__dropdown-menu-content, .ui__popover-content, .ui__context-menu-content")))

(defn get-current-input-char
  [input]
  (when-let [pos (cursor/pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(defn- get-focused-root-block
  []
  (let [page (state/get-current-page)]
    (when (and page (util/uuid-string? page))
      (db-async/<get-block (state/get-current-repo) (parse-uuid page) {:children? false}))))

(defn- focused-root-block?
  [block root-block]
  (and block root-block
       (= (:db/id block) (:db/id root-block))))

(defn- outdent-past-focused-root?
  [block root-block]
  (= (block-parent-id block) (:db/id root-block)))

(defn- block-eligible-for-indent-outdent?
  [block indent? root-block]
  (and block
       (not (comments-model/protected-comment-block? block))
       (not (focused-root-block? block root-block))
       (or indent?
           (not (outdent-past-focused-root? block root-block)))))

(defn- block-eligible-for-move-up-down?
  [block root-block]
  (and block
       (not (comments-model/protected-comment-block? block))
       (not (focused-root-block? block root-block))))

(defn move-up-down
  [up?]
  (fn [event]
    (util/stop event)
    (state/pub-event! [:editor/hide-action-bar])
    (let [edit-block-id (:block/uuid (state/get-edit-block))
          move-nodes (fn [blocks]
                       (let [blocks' (block-handler/get-top-level-blocks blocks)
                             result (ui-outliner-tx/transact!
                                     (merge {:outliner-op :move-blocks}
                                            (block-handler/outliner-tx-meta (first blocks')))
                                     (outliner-op/move-blocks-up-down! blocks' up?))]
                         (when-let [block-node (util/get-first-block-by-id (:block/uuid (first blocks)))]
                           (.scrollIntoView block-node #js {:behavior "smooth" :block "nearest"}))
                         result))]
      (p/let [root-block (get-focused-root-block)]
        (if edit-block-id
          (p/let [block (db-async/<get-block (state/get-current-repo) edit-block-id {:children? false})]
            (let [blocks [(assoc block :block/title (state/get-edit-content))]
                  blocks (filter #(block-eligible-for-move-up-down? % root-block) blocks)
                  container-id (get-new-container-id (if up? :move-up :move-down) {})]
              (when (seq blocks)
                (p/do!
                 (save-current-block!)
                 (move-nodes blocks)
                 (if container-id
                   (state/set-editing-block-id! [container-id edit-block-id])
                   (when-let [input (some-> (state/get-edit-input-id) gdom/getElement)]
                     (.focus input)
                     (util/scroll-editor-cursor input)))))))
          (let [ids (state/get-selection-block-ids)]
            (when (seq ids)
              (p/let [results (db-async/<get-blocks (state/get-current-repo) ids {:children? false})
                      loaded-blocks (unwrap-block-results results)
                      blocks (filter #(block-eligible-for-move-up-down? % root-block) loaded-blocks)]
                (when (seq blocks)
                  (move-nodes blocks))))))))))

(defn get-selected-ordered-blocks
  []
  (let [repo (state/get-current-repo)
        ids (state/get-selection-block-ids)]
    (p/let [results (db-async/<get-blocks repo ids {:children? false})]
      (unwrap-block-results results))))

(defn on-tab
  "`direction` = :left | :right."
  [direction]
  (p/let [blocks (get-selected-ordered-blocks)
          root-block (get-focused-root-block)]
    (let [indent? (= direction :right)
          blocks (filter #(block-eligible-for-indent-outdent? % indent? root-block) blocks)]
      (when (seq blocks)
        (block-handler/indent-outdent-blocks! blocks indent? nil)))))

(defn- get-link [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "[%s](%s)" label link)
      nil)))

(defn- get-image-link
  [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "![%s](%s)" label link))))

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

(defn restore-last-saved-cursor!
  ([] (restore-last-saved-cursor! (state/get-input)))
  ([input]
   (when-let [saved-cursor (and input (state/get-editor-last-pos))]
     (cursor/move-cursor-to input saved-cursor true))))

(defn- close-autocomplete-if-outside
  [input]
  (when (and input
             (contains? #{:page-search :page-search-hashtag :block-search} (state/get-editor-action))
             (not (wrapped-by? input page-ref/left-brackets page-ref/right-brackets))
             (not (wrapped-by? input block-ref/left-parens block-ref/right-parens))
             ;; wrapped-by? doesn't detect multiple beginnings when ending with "" so
             ;; use subs to correctly detect current hashtag
             (not (text-util/wrapped-by? (subs (.-value input) 0 (cursor/pos input)) (cursor/pos input) commands/hashtag ""))
             (not (= :block-search (state/get-editor-action))))
    (state/clear-editor-action!)))

(defn resize-image!
  [config block-id _metadata _full_text size]
  (let [asset (:asset-block config)]
    (property-handler/set-block-property! (if asset (:db/id asset) block-id)
                                          :logseq.property.asset/resize-metadata
                                          size)))

(defn- current-edit-block?
  [block]
  (= (:block/uuid block) (:block/uuid (state/get-edit-block))))

(defn edit-box-on-change!
  [e block id]
  (when (current-edit-block? block)
    (let [value (util/evalue e)
          repo (state/get-current-repo)]
      (state/set-edit-content! id value false)
      (clear-block-auto-save-timeout!)
      (block-handler/mark-last-input-time! repo)
      (reset! *auto-save-timeout
              (js/setTimeout
               (fn []
                 (when (and (state/input-idle? repo :diff 450)
                          ;; don't auto-save block if it has tags
                            (not (re-find #"#\S+" value)))
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
        [_ _ config]    (state/get-editor-args)
        pos             (cursor/pos input)
        content         (.-value input)
        last-input-char (util/nth-safe content (dec pos))
        last-prev-input-char (util/nth-safe content (dec (dec pos)))]

    ;; TODO: is it cross-browser compatible?
    ;; (not= (gobj/get native-e "inputType") "insertFromPaste")
    (cond
      (and (= content "1. ") (= last-input-char " ") input-id edit-block
           (not (own-order-number-list? edit-block)))
      (p/let [_ (state/pub-event! [:editor/toggle-own-number-list edit-block])]
        (state/set-edit-content! input-id ""))

      (and (not (:comment-editor? config))
           (= last-input-char commands/command-trigger)
           (or (re-find #"(?m)^/" (str (.-value input))) (start-of-new-word? input pos)))
      (do
        (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
        (commands/reinit-matched-commands!)
        (state/set-editor-show-commands!))

      (or (= last-input-char last-prev-input-char commands/hashtag)
          (and (= last-prev-input-char commands/hashtag)
               (= last-input-char " ")))
      (state/clear-editor-action!)

      ;; Open "Search page or New page" auto-complete
      (and (not (:comment-editor? config))
           (= last-input-char commands/hashtag)
             ;; Only trigger at beginning of a line, before whitespace or after a reference
           (or (re-find #"(?m)^#" (str (.-value input)))
               (start-of-new-word? input pos)
               (= page-ref/right-brackets (common-util/safe-subs (str (.-value input)) (- pos 3) (dec pos)))))
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
                       (ref/->block-ref uuid-string)
                       format
                       {:last-pattern (str block-ref/left-parens (if selected-text "" q))
                        :end-pattern block-ref/right-parens
                        :postfix-fn   (fn [s] (util/replace-first block-ref/right-parens s ""))
                        :forward-pos 3
                        :command :block-ref})

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/clear-editor-action!)
    (cursor/move-cursor-forward input 2)))

(defn- paste-block-cleanup
  [_repo block page _exclude-properties _format content-update-fn keep-uuid?]
  (let [new-content
        (if content-update-fn
          (content-update-fn (:block/title block))
          (:block/title block))]
    (merge (cond-> block
             (not keep-uuid?) (dissoc :block/uuid))
           {:block/page {:db/id [:block/uuid (:block/uuid page)]}
            :block/title new-content})))

(defn- edit-last-block-after-inserted!
  [result]
  (util/schedule
   (fn []
     (when-let [last-block (last (:blocks result))]
       (clear-when-saved!)
       (edit-block! last-block :max)))))

(defn- nested-blocks
  [blocks]
  (let [ids (set (map :db/id blocks))]
    (some? (some #(ids (block-parent-id %)) blocks))))

(defn- unrecycle-tx-data
  [root]
  (let [root-id [:block/uuid (:block/uuid root)]]
    [[:db/retract root-id :logseq.property/deleted-at]
     [:db/retract root-id :logseq.property/deleted-by-ref]
     [:db/retract root-id :logseq.property.recycle/original-parent]
     [:db/retract root-id :logseq.property.recycle/original-page]
     [:db/retract root-id :logseq.property.recycle/original-order]]))

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
                  ops-only?
                  outliner-real-op]
           :or {exclude-properties []}
           :as opts}]
  (let [editing-block (when-let [editing-block (state/get-edit-block)]
                        (assoc editing-block :block/title (state/get-edit-content)))
        has-unsaved-edits (and editing-block
                               (not= (:block/title (state/get-edit-block))
                                     (state/get-edit-content)))
        target-block (or target-block editing-block)
        block target-block
        page (if (:block/name block) block
                 (when target-block (:block/page target-block)))
        empty-target? (if (true? skip-empty-target?) false
                          (string/blank? (:block/title target-block)))
        paste-nested-blocks? (nested-blocks blocks)
        target-block-has-children? (block-map-has-children? target-block)
        replace-empty-target? (and empty-target?
                                   (or (not target-block-has-children?)
                                       (and target-block-has-children? (= (count blocks) 1))))]
    (p/let [target-block' (if (and empty-target? target-block-has-children? paste-nested-blocks?)
                            (<left-sibling-or-parent (state/get-current-repo) target-block)
                            target-block)]
      (let [existing-blocks (filter :block/uuid blocks)
            move-from-recycle? (and keep-uuid?
                                    (seq existing-blocks)
                                    (every? ldb/recycled? existing-blocks))
            sibling? (cond
                       (and paste-nested-blocks? empty-target?)
                       (= (block-parent-id target-block') (block-parent-id target-block))

                       (some? sibling?)
                       sibling?

                       target-block-has-children?
                       false

                       :else
                       true)
            transact-blocks! #(if move-from-recycle?
                                (ui-outliner-tx/transact!
                                 {:outliner-op :move-blocks
                                  :additional-tx revert-cut-txs
                                  :ui/page-id (:ui/page-id opts)}
                                 (when target-block'
                                   (let [top-level-blocks (block-handler/get-top-level-blocks existing-blocks)
                                         unrecycle-tx (mapcat unrecycle-tx-data top-level-blocks)]
                                     (when (seq unrecycle-tx)
                                       (outliner-op/transact! unrecycle-tx nil))
                                     (outliner-op/move-blocks! top-level-blocks target-block'
                                                               {:sibling? sibling?
                                                                :outliner-op :paste}))))
                                (ui-outliner-tx/transact!
                                 {:outliner-op :insert-blocks
                                  :additional-tx revert-cut-txs
                                  :ui/page-id (:ui/page-id opts)}
                                 (when target-block'
                                   (let [format (get target-block' :block/format :markdown)
                                         repo (state/get-current-repo)
                                         blocks' (map (fn [block]
                                                        (paste-block-cleanup repo block page exclude-properties format content-update-fn keep-uuid?))
                                                      blocks)]
                                     (outliner-op/insert-blocks! blocks' target-block' {:sibling? sibling?
                                                                                        :outliner-op :paste
                                                                                        :outliner-real-op outliner-real-op
                                                                                        :replace-empty-target? replace-empty-target?
                                                                                        :keep-uuid? keep-uuid?})))))]
        (if ops-only?
          (transact-blocks!)
          (p/let [_ (when has-unsaved-edits
                      (ui-outliner-tx/transact!
                       {:outliner-op :save-block}
                       (outliner-save-block! editing-block)))
                  result (transact-blocks!)]
            (state/set-block-op-type! nil)
            (when result
              (edit-last-block-after-inserted! result)
              result)))))))

(defn- block-tree->blocks
  "keep-uuid? - maintain the existing :uuid in tree vec"
  [tree-vec format keep-uuid? page-name]
  (->> (outliner-core/tree-vec-flatten tree-vec)
       (map (fn [block]
              (let [content (:content block)
                    content* (str (if (= :markdown format) "- " "* ") content)
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
  (let [page-id (or (block-page-id target-block)
                    (when (or (entity/page? target-block)
                              (:block/name target-block))
                      (or (:block/uuid target-block)
                          (:block/name target-block))))
        page-name (some-> (or (:block/page target-block)
                              (when (entity/page? target-block) target-block))
                          :block/name)
        blocks (block-tree->blocks tree-vec format keep-uuid? page-name)
        blocks (gp-block/with-parent-and-order page-id blocks)]

    (paste-blocks blocks (merge opts {:ops-only? true
                                      :ui/page-id page-id}))))

(defn insert-block-tree-after-target
  "`tree-vec`: a vector of blocks.
   A block element: {:content :properties :children [block-1, block-2, ...]}"
  [target-block-id sibling? tree-vec format keep-uuid?]
  (p/let [target-block (db-async/<get-block (state/get-current-repo) target-block-id {:children? false})]
    (insert-block-tree tree-vec format
                       {:target-block       target-block
                        :keep-uuid?         keep-uuid?
                        :skip-empty-target? true
                        :sibling?           sibling?})))

(defn insert-template!
  ([element-id db-id]
   (insert-template! element-id db-id {}))
  ([element-id db-id {:keys [target] :as opts}]
   (let [repo (state/get-current-repo)]
     (p/let [block (db-async/<get-block repo db-id {:children? false})]
       (when (:db/id block)
         (let [journal? (entity/journal? target)
               target (or target (state/get-edit-block))
               format (get block :block/format :markdown)]
           (when element-id
             (insert-command! element-id "" format {:end-pattern commands/command-trigger}))
           (try
             (p/let [result (ui-outliner-tx/transact!
                             {:outliner-op :apply-template
                              :created-from-journal-template? journal?}
                             (when-not (string/blank? (state/get-edit-content))
                               (save-current-block!))
                             (outliner-op/apply-template! (:block/uuid block) target opts))]
               (when result (edit-last-block-after-inserted! result)))

             (catch :default ^js/Error e
               (notification/show!
                (t :editor/template-insert-error (.-message e))
                :error)))))))))

(defn template-on-chosen-handler
  [element-id]
  (fn [template-block]
    (when-let [db-id (:db/id template-block)]
      (insert-template! element-id db-id
                        {:replace-empty-target? true}))))

(declare indent-outdent)

(defn- last-top-level-child?
  [{:keys [id page]} block]
  (let [parent (:block/parent block)
        page-id (:db/id page)
        id (str id)]
    (and parent
         (or (= page-id (:db/id parent))
             (= id (str (:block/uuid parent)))
             (= (common-util/page-name-sanity-lc id) (:block/name parent))))))

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

(defn- keydown-new-block
  [state]
  (when-not (auto-complete?)
    (let [{:keys [block config]} (get-state)]
      (when block
        (let [input (state/get-input)
              config (assoc config :keydown-new-block true)
              content (gobj/get input "value")]
          (cond
            (and (string/blank? content)
                 (own-order-number-list? block)
                 (not (some-> (:block/parent block)
                              (own-order-number-list?))))
            (remove-block-own-order-list-type! block)

            (not (string/blank? content))
            (insert-new-block! state content nil)

            :else
            (if (last-top-level-child? config block)
              (insert-new-block! state content nil)
              (p/let [right-sibling (when-let [block-id (:db/id block)]
                                      (db-async/<get-block-sibling (state/get-current-repo) block-id :right))]
                (if right-sibling
                  (insert-new-block! state content right-sibling)
                  (indent-outdent false))))))))))

(defn- inside-of-single-block
  "When we are in a single block wrapper, we should always insert a new line instead of new block"
  [el]
  (some? (dom/closest el ".single-block")))

(defn- inside-of-editor-block
  [el]
  (some? (dom/closest el ".block-editor")))

(defn keydown-new-block-handler [^js e]
  (let [state (get-state)
        target (when e (.-target e))]
    (when (or (nil? target)
              (inside-of-editor-block target))
      (if (pending-new-block?)
        (when e (.preventDefault e))
        (if (or (state/doc-mode-enter-for-new-line?) (inside-of-single-block (:node state)))
          (keydown-new-line)
          (do
            (when e (.preventDefault e))
            (keydown-new-block state)))))))

(defn keydown-new-line-handler [e]
  (let [state (get-state)]
    (when (or (nil? (.-target e)) (inside-of-editor-block (.-target e)))
      (if (and (state/doc-mode-enter-for-new-line?) (not (inside-of-single-block (:node state))))
        (keydown-new-block state)
        (do
          (.preventDefault e)
          (keydown-new-line))))))

(defn- select-first-last
  "Select first or last block in viewport"
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

(declare property-value-node? property-value-inner-block focus-trigger)

(defn- select-up-down [direction]
  (let [selected-blocks (state/get-selection-blocks)
        selected (case direction
                   :up (first selected-blocks)
                   :down (last selected-blocks))
        f (case direction
            :up util/get-prev-block-non-collapsed
            :down util/get-next-block-non-collapsed)
        sibling-block (navigable-sibling-block selected
                                               f
                                               {:up-down? true
                                                :direction direction})
        property-value-container (when (property-value-node? sibling-block)
                                   sibling-block)
        sibling-block (or (property-value-inner-block property-value-container)
                          sibling-block)]
    (cond
      property-value-container
      (do
        (state/clear-selection!)
        (util/scroll-to-block property-value-container)
        (focus-trigger selected property-value-container {:edit-navigation? false}))

      (and sibling-block
           (or (dom/attr sibling-block "blockid") (dom/attr sibling-block "parentblockid")))
      (do
        (util/scroll-to-block sibling-block)
        (state/exit-editing-and-set-selected-blocks! [sibling-block])))))

(defn- property-value-node?
  [node]
  (some-> node (dom/has-class? "property-value-container")))

(defn- property-value-inner-block
  [node]
  (when (property-value-node? node)
    (some-> node (.querySelector ".ls-block[blockid]"))))

(defn- property-value-container-node
  [node]
  (or (when (property-value-node? node)
        node)
      (some-> node (.closest ".property-value-container"))))

(defn- bottom-properties-row-node
  [node]
  (some-> node (.closest ".bottom-properties-row")))

(defn- bottom-properties-row-in-block
  [block-node]
  (some-> block-node (.querySelector ".bottom-properties-row")))

(defn- focus-bottom-properties-row!
  [row]
  (when row
    (if-let [first-pill (.querySelector row "[data-bottom-pill-focusable='true']")]
      (.focus first-pill)
      (.focus row))))

(defn- node-attr
  [node attr]
  (or (some-> node (gobj/get attr))
      (when (and node (gobj/get node "getAttribute"))
        (dom/attr node attr))))

(defn- comment-item-node?
  [node]
  (= "true" (node-attr node "data-comment-item")))

(defn- comments-area-node?
  [node]
  (= "true" (node-attr node "data-comments-area")))

(defn- comments-area-ancestor-node
  [node]
  (or (when (comments-area-node? node) node)
      (some-> node (util/rec-get-node "is-comments-area"))))

(defn- comments-area-collapsed-node?
  [node]
  (= "true" (node-attr node "data-collapsed")))

(defn- node-contains?
  [parent child]
  (boolean
   (or (and (gobj/get parent "nodeType")
            (gdom/contains parent child))
       (when-let [contains-fn (gobj/get parent "contains")]
         (contains-fn child)))))

(defn- block-node-outside-comments-area
  [comments-node direction]
  (when direction
    (let [blocks (vec (util/get-blocks-noncollapse))
          index (first (keep-indexed (fn [idx node]
                                       (when (= comments-node node) idx))
                                     blocks))
          step (case direction
                 (:up :left) -1
                 (:down :right) 1
                 1)]
      (loop [idx (some-> index (+ step))]
        (when (and idx (<= 0 idx) (< idx (count blocks)))
          (let [node (nth blocks idx)]
            (if (node-contains? comments-node node)
              (recur (+ idx step))
              node)))))))

(defn- horizontal-direction?
  [direction]
  (contains? #{:left :right} direction))

(defn- comment-navigation-node?
  [node]
  (boolean
   (or (comments-area-ancestor-node node)
       (comment-item-node? node))))

(defn- block-node-outside-comments
  [node direction]
  (when (and node (horizontal-direction? direction))
    (let [blocks (vec (util/get-blocks-noncollapse))
          index (first (keep-indexed (fn [idx block-node]
                                       (when (= node block-node) idx))
                                     blocks))
          step (case direction
                 :left -1
                 :right 1)]
      (loop [idx index]
        (when (and idx (<= 0 idx) (< idx (count blocks)))
          (let [block-node (nth blocks idx)]
            (if (comment-navigation-node? block-node)
              (recur (+ idx step))
              block-node)))))))

(defn- navigable-sibling-block
  [block sibling-f {:keys [up-down? direction] :as opts}]
  (loop [sibling-block (sibling-f block opts)]
    (cond
      (nil? sibling-block)
      nil

      (comments-area-ancestor-node sibling-block)
      (let [comments-node (comments-area-ancestor-node sibling-block)]
        (if up-down?
          comments-node
          (or (block-node-outside-comments-area comments-node direction)
              (block-node-outside-comments sibling-block direction)
              (recur (sibling-f sibling-block opts)))))

      (comment-item-node? sibling-block)
      (if up-down?
        (recur (sibling-f sibling-block opts))
        (or (block-node-outside-comments sibling-block direction)
            (recur (sibling-f sibling-block opts))))

      :else
      sibling-block)))

(defn- comments-reply-input
  [comments-node]
  (some-> comments-node
          (.querySelector ".ls-comment-add textarea, .ls-comment-box textarea, .ls-comment-box input, .ls-comment-box [contenteditable='true']")))

(defn- comments-reply-placeholder
  [comments-node]
  (some-> comments-node
          (.querySelector ".ls-comment-reply-placeholder")))

(defn- enter-comments-area-node!
  [comments-node]
  (state/clear-edit!)
  (if (comments-area-collapsed-node? comments-node)
    (state/exit-editing-and-set-selected-blocks! [comments-node])
    (if-let [input (comments-reply-input comments-node)]
      (.focus input)
      (if-let [placeholder (comments-reply-placeholder comments-node)]
        (.click placeholder)
        (state/exit-editing-and-set-selected-blocks! [comments-node])))))

(defn- focus-trigger
  ([current-block sibling-block]
   (focus-trigger current-block sibling-block {:edit-navigation? true}))
  ([_current-block sibling-block {:keys [edit-navigation?]}]
   (if-let [trigger (first (dom/by-class sibling-block "jtrigger"))]
     (do
       (.setAttribute trigger "data-property-nav-mode" (if edit-navigation? "edit" "focus"))
       (state/clear-edit!)
       (if (or (dom/has-class? trigger "ls-number")
               (dom/has-class? trigger "ls-empty-text-property"))
         (.click trigger)
         (.focus trigger)))
     (when-let [row (bottom-properties-row-node sibling-block)]
       (focus-bottom-properties-row! row)))))

(defn move-property-focus-up-down
  [direction]
  (let [active-element js/document.activeElement
        f (case direction
            :up util/get-prev-block-non-collapsed
            :down util/get-next-block-non-collapsed)
        current-block (util/rec-get-node active-element "ls-block")
        sibling-block (navigable-sibling-block current-block
                                               f
                                               {:up-down? true
                                                :direction direction})
        property-value-container (property-value-container-node sibling-block)
        sibling-block (or (property-value-inner-block property-value-container)
                          sibling-block)
        bottom-properties-row (bottom-properties-row-node sibling-block)]
    (cond
      property-value-container
      (do
        (state/clear-selection!)
        (util/scroll-to-block property-value-container)
        (focus-trigger current-block property-value-container {:edit-navigation? false}))

      bottom-properties-row
      (do
        (state/clear-edit!)
        (focus-bottom-properties-row! bottom-properties-row))

      (comments-area-node? sibling-block)
      (enter-comments-area-node! sibling-block)

      :else
      (when-let [sibling-block-id (node-attr sibling-block "blockid")]
        (let [container-id (some-> (node-attr sibling-block "containerid") js/parseInt)
              block {:block/uuid (cljs.core/uuid sibling-block-id)}]
          (edit-block! block 0 {:container-id container-id
                                :direction direction}))))))

(defn move-cross-boundary-up-down
  [direction move-opts]
  (let [input (if (contains? move-opts :input)
                (:input move-opts)
                (state/get-input))
        active-element js/document.activeElement
        input-or-active-element (or input active-element)]
    (when input-or-active-element
      (let [repo (state/get-current-repo)
            f (case direction
                :up util/get-prev-block-non-collapsed
                :down util/get-next-block-non-collapsed)
            current-block (util/rec-get-node input-or-active-element "ls-block")
            sibling-block (navigable-sibling-block current-block
                                                   f
                                                   (cond-> {:up-down? true
                                                            :direction direction}
                                                     (:exclude-property? move-opts)
                                                     (assoc :exclude-property? true)))
            {:block/keys [uuid title]} (state/get-edit-block)
            property-value-container (when (property-value-node? sibling-block)
                                       sibling-block)
            sibling-block (or (property-value-inner-block property-value-container)
                              sibling-block)
            current-bottom-properties-row (bottom-properties-row-in-block current-block)
            bottom-properties-row (bottom-properties-row-node sibling-block)
            sibling-bottom-properties-row (bottom-properties-row-in-block sibling-block)
            property-value-container? (and property-value-container
                                           (nil? (property-value-inner-block property-value-container)))]
        (if sibling-block
          (let [value (state/get-edit-content)]
            (p/do!
             (when (and
                    uuid
                    (not (state/block-component-editing?))
                    (not= title (string/trim value)))
               (save-block! repo uuid value))

             (cond
               (and (= :down direction)
                    input
                    (= active-element input)
                    current-bottom-properties-row)
               (do
                 (state/clear-edit!)
                 (focus-bottom-properties-row! current-bottom-properties-row))

               (and (= :up direction)
                    sibling-bottom-properties-row)
               (do
                 (state/clear-edit!)
                 (focus-bottom-properties-row! sibling-bottom-properties-row))

               (and (dom/has-class? sibling-block "block-add-button")
                    (util/rec-get-node current-block "ls-page-title"))
               (.click sibling-block)

               bottom-properties-row
               (do
                 (state/clear-edit!)
                 (focus-bottom-properties-row! bottom-properties-row))

               property-value-container?
               (focus-trigger current-block sibling-block {:edit-navigation? true})

               (comments-area-node? sibling-block)
               (enter-comments-area-node! sibling-block)

               :else
               (when-let [sibling-block-id (node-attr sibling-block "blockid")]
                 (let [container-id (some-> (node-attr sibling-block "containerid") js/parseInt)
                       new-uuid (cljs.core/uuid sibling-block-id)
                       block {:block/uuid new-uuid}]
                   (edit-block! block
                                (or (:pos move-opts)
                                    (when input [direction (util/get-line-pos (.-value input) (util/get-selection-start input))])
                                    0)
                                {:container-id container-id
                                 :direction direction}))))))
          (case direction
            :up (if input
                  (cursor/move-cursor-to input 0)
                  (when current-block
                    (util/scroll-to-block current-block)
                    (state/exit-editing-and-set-selected-blocks! [current-block])))
            :down (when input
                    (cursor/move-cursor-to-end input))))))))

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

      (and input
           (or (and up? (cursor/textarea-cursor-first-row? input))
               (and down? (cursor/textarea-cursor-last-row? input))))
      (move-cross-boundary-up-down direction move-opts)

      :else
      (when input
        (if up?
          (cursor/move-cursor-up input)
          (cursor/move-cursor-down input))))))

(defn move-to-block-when-cross-boundary
  [direction {:keys [block]}]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:block/keys [uuid] :as block} (or block (state/get-edit-block))
        repo (state/get-current-repo)
        editing-block (state/get-editor-block-container)
        f (if up? util/get-prev-block-non-collapsed util/get-next-block-non-collapsed)
        sibling-block (navigable-sibling-block editing-block f {:direction direction})
        property-value-container (when (and sibling-block (property-value-node? sibling-block))
                                   sibling-block)
        sibling-block (or (when (and up? editing-block property-value-container
                                     (gdom/contains property-value-container editing-block))
                            (navigable-sibling-block property-value-container f {:direction direction}))
                          (property-value-inner-block property-value-container)
                          sibling-block)]
    (when sibling-block
      (let [content (:block/title block)
            value (state/get-edit-content)]
        (when (and value (not= content (string/trim value)))
          (save-block! repo uuid value)))
      (let [sibling-block-id (node-attr sibling-block "blockid")]
        (cond
          sibling-block-id
          (let [container-id (some-> (node-attr sibling-block "containerid") js/parseInt)
                block {:block/uuid (cljs.core/uuid sibling-block-id)}]
            (edit-block! block pos {:container-id container-id}))

          (property-value-node? sibling-block)
          (focus-trigger editing-block sibling-block)

          (and (dom/has-class? sibling-block "block-add-button")
               (util/rec-get-node editing-block "ls-page-title"))
          (.click sibling-block)

          :else
          nil)))))

(defn keydown-arrow-handler
  [direction]
  (let [input (state/get-input)
        element js/document.activeElement
        selected-start (util/get-selection-start input)
        selected-end (util/get-selection-end input)
        left? (= direction :left)
        right? (= direction :right)
        block (state/get-edit-block)
        property? (entity/property? block)]
    (cond
      (and input (not= input element))
      (.focus input)

      (= input element)
      (cond
        (and property? right? (not (cursor/end? input)))
        (cursor/move-cursor-to-end input)

        (and property? left? (not (cursor/start? input)))
        (cursor/move-cursor-to-start input)

        (not= selected-start selected-end)
        (cond
          left?
          (cursor/move-cursor-to input selected-start)
          :else
          (cursor/move-cursor-to input selected-end))

        (or (and left? (cursor/start? input))
            (and right? (cursor/end? input)))
        (move-to-block-when-cross-boundary direction {})

        :else
        (if left?
          (cursor/move-cursor-backward input)
          (cursor/move-cursor-forward input)))

      :else
      nil)))

(defn delete-and-update [^js input start end]
  (util/safe-set-range-text! input "" start end)
  (state/set-edit-content! (state/get-edit-input-id) (.-value input)))

(defn- delete-concat [current-block]
  (p/let [repo (state/get-current-repo)
          current-block-id (or (some-> (state/get-input)
                                       (util/rec-get-node "ls-block")
                                       (dom/attr "blockid")
                                       uuid)
                               (:block/uuid current-block))
          current-block-result (db-async/<get-block-with-children
                                repo
                                current-block-id
                                {:children? true})
          hydrated-current-block (worker-block-with-children current-block-result)
          collapsed? (util/collapsed? hydrated-current-block)
          next-block (when-not collapsed?
                       (when-let [next-node (util/get-next-block-non-collapsed
                                             (util/rec-get-node (state/get-input) "ls-block")
                                             {:exclude-property? true})]
                         (when-let [next-block-id (some-> (dom/attr next-node "blockid") uuid)]
                           (db-async/<get-block repo next-block-id {:children? false}))))]
    (cond
      collapsed?
      nil

      (nil? next-block)
      nil

      :else
      (let [repo (state/get-current-repo)
            editor-state (assoc (get-state)
                                :block-id (:block/uuid next-block)
                                :value (:block/title next-block)
                                :block-container (util/get-next-block-non-collapsed
                                                  (util/rec-get-node (state/get-input) "ls-block")
                                                  {:exclude-property? true})
                                :current-block hydrated-current-block
                                :next-block next-block
                                :delete-concat? true)]
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

(defn delete-block-when-zero-pos!
  [^js e]
  (let [^js input (state/get-input)
        current-pos (cursor/pos input)]
    (when (zero? current-pos)
      (util/stop e)
      (let [repo (state/get-current-repo)
            block (state/get-edit-block)
            value (gobj/get input "value")
            editor-state (get-state)
            editor-config (:config editor-state)
            previous-block (some-> (previous-block-node (:block-container editor-state)
                                                        editor-config)
                                   mounted-block)
            custom-query? (:custom-query? editor-config)]
        (p/let [left-or-parent (<left-sibling-or-parent repo block previous-block)]
          (let [top-block? (= (:db/id left-or-parent) (block-page-id block))
                single-block? (if e (inside-of-single-block (.-target e)) false)
                root-block? (= (:block.temp/container block) (str (:block/uuid block)))]
            (when (and (not (and top-block? (not (string/blank? value))))
                       (not (editor-block-preserved-on-empty-title-merge? block))
                       (not root-block?)
                       (not single-block?)
                       (not custom-query?))
              (if (own-order-number-list? block)
                (p/do!
                 (save-current-block!)
                 (remove-block-own-order-list-type! block))
                (delete-block-inner! repo editor-state)))))))))

(defn keydown-backspace-handler
  [cut? e]
  (let [^js input (state/get-input)
        element js/document.activeElement]
    (cond
      (pending-new-block?)
      (do
        (util/stop e)
        (backspace-pending-new-block!))

      (= input element)
      (let [id (state/get-edit-input-id)
            current-pos (cursor/pos input)
            value (gobj/get input "value")
              deleted (and (> current-pos 0)
                           (util/nth-safe value (dec current-pos)))
              selected-start (util/get-selection-start input)
              selected-end (util/get-selection-end input)
              repo (state/get-current-repo)]
          (block-handler/mark-last-input-time! repo)
          (cond
            (not= selected-start selected-end)
            (do
              (util/stop e)
              (when cut?
                (js/document.execCommand "copy"))
              (delete-and-update input selected-start selected-end))

            (zero? current-pos)
            (when-not (mobile-util/native-ios?)
            ;; native iOS handled by `mobile.bottom-tabs/add-keyboard-hack-listener!`
              (delete-block-when-zero-pos! e))

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

      :else
      false)))

(defn- moved-block-edit-fn
  [block pos content container-id]
  (fn [rows]
    (let [block' (or (some #(when (= (:block/uuid block) (:block/uuid %)) %) rows)
                     block)]
      (edit-block! block' pos {:container-id container-id
                               :custom-content content
                               :save-code-editor? false
                               :skip-load? true}))))

(defn indent-outdent
  [indent?]
  (let [{:keys [block pos value config]} (get-state)
        container-id (get-new-container-id (if indent? :indent :outdent) {})]
    (when block
      (p/let [root-block (get-focused-root-block)]
        (when (block-eligible-for-indent-outdent? block indent? root-block)
          (let [block (current-block-with-title block value)
                edit-block-fn (moved-block-edit-fn block pos value
                                                   (or container-id (:container-id config)))]
            (block-handler/indent-outdent-blocks! [block] indent? save-current-block!
                                                  edit-block-fn)))))))

(defn keydown-tab-handler
  [direction]
  (fn [e]
    (cond
      (pending-new-block?)
      (do
        (util/stop e)
        (queue-pending-new-block-tab! (not= :left direction)))

      (state/editing?)
      (when-not (state/get-editor-action)
        (util/stop e)
        (indent-outdent (not (= :left direction))))

      (state/selection?)
      (do
        (util/stop e)
        (state/pub-event! [:editor/hide-action-bar])
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
      (when (or (not (state/get-state :editor/start-pos))
                (and key (string/starts-with? key "Arrow")))
        (state/set-state! :editor/start-pos pos))

      (cond
        (and (= :page-search (state/get-editor-action))
             (= key commands/hashtag))
        (do
          (util/stop e)
          (notification/show! (t :page.validation/name-no-hash) :warning))
        (pending-new-block?)
        (do
          (when (= 1 (count (str key)))
            (append-pending-new-block-text! key))
          (util/stop e))

        (contains? #{"ArrowLeft" "ArrowRight"} key)
        (state/clear-editor-action!)

        (and (util/goog-event-is-composing? e true) ;; #3218
             (not hashtag?) ;; #3283 @Rime
             (not (state/get-editor-show-page-search-hashtag?))) ;; #3283 @MacOS pinyin
        nil

        (or ctrlKey metaKey)
        nil

        (and (= key "#")
             (> pos 0)
             (= "#" (util/nth-safe value (dec pos))))
        (state/clear-editor-action!)

        (and (= "$" key) (string/blank? (util/get-selected-text)))
        (do
          (util/stop e)
          (commands/simple-insert! input-id "$$" {:backward-pos 1}))

        (and (contains? (set/difference (set (keys reversed-autopair-map))
                                        #{"`"})
                        key)
             (= (get-current-input-char input) key))
        (do
          (util/stop e)
          (cursor/move-cursor-forward input))

        (and (autopair-when-selected key) (string/blank? (util/get-selected-text)))
        nil

        (some? (state/get-state :editor/action))
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
          (double-chars-typed? value pos key sym))
        (state/pub-event! [:editor/new-property])

        (let [sym "^"]
          (double-chars-typed? value pos key sym))
        (commands/simple-insert! input-id "^^" {:backward-pos 2})

        :else
        nil))))

(def ^:private block-ref-trigger-keys
  (conj keycode/left-square-brackets-keys "Process"))

(defn- block-ref-trigger-key?
  [k]
  (contains? block-ref-trigger-keys k))

(defn- replacement-edit
  [value replacement {:keys [start end]}]
  {:value (str (subs value 0 start) replacement (subs value end))
   :pos (+ start 2)})

(defn- double-left-trigger-edit
  [value current-pos left replacement]
  (let [start (- current-pos (* 2 (count left)))]
    (when (and (>= start 0)
               (= (subs value start current-pos) (str left left)))
      (replacement-edit value replacement {:start start :end current-pos}))))

(def ^:private fullwidth-block-ref-patterns
  #{"【【"
    "【【】"
    "【【】】"
    "【】【"
    "【】【】"})

(defn- fullwidth-block-ref-trigger-range
  [value current-pos]
  (let [min-start (max 0 (- current-pos 4))
        ;; Patterns can extend up to 3 chars past cursor (e.g. cursor at pos 1 in "【【】】").
        ;; Use +4 so the full 4-char pattern is always reachable.
        max-end (min (count value) (+ current-pos 4))
        candidates (for [start (range min-start current-pos)
                         end (range current-pos (inc max-end))
                         :let [text (subs value start end)]
                         :when (contains? fullwidth-block-ref-patterns text)]
                     {:start start
                      :end end})]
    (when (seq candidates)
      (apply max-key #(- (:end %) (:start %)) candidates))))

(defn- fullwidth-block-ref-trigger-edit
  [value current-pos]
  (when-let [range (fullwidth-block-ref-trigger-range value current-pos)]
    (replacement-edit value page-ref/left-and-right-brackets range)))

(defn- block-ref-trigger-edit
  [value current-pos k]
  (or (fullwidth-block-ref-trigger-edit value current-pos)
      (when (contains? keycode/left-square-brackets-keys k)
        (double-left-trigger-edit value current-pos "[" page-ref/left-and-right-brackets))))

(defn- apply-bracket-trigger!
  [input {:keys [value pos]} command-step]
  (state/set-block-content-and-last-pos! (.-id input) value pos)
  (commands/handle-step command-step)
  (cursor/move-cursor-to input pos)
  (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)}))

(defn- default-case-for-keyup-handler
  [input current-pos k code is-processed?]
  (let [blank-selected? (string/blank? (util/get-selected-text))
        non-enter-processed? (and is-processed? ;; #3251
                                  (not= code keycode/enter-code))  ;; #3459
        editor-action (state/get-editor-action)
        value (gobj/get input "value")
        block-ref-trigger? (and blank-selected? (block-ref-trigger-key? k))
        block-ref-edit (when block-ref-trigger?
                         (block-ref-trigger-edit value current-pos k))]
    (if (and (= editor-action :page-search-hashtag) block-ref-edit)
      (apply-bracket-trigger! input block-ref-edit [:editor/search-page-hashtag])
      (when-not editor-action
        (cond
          (and block-ref-edit
               (not (wrapped-by? input page-ref/left-brackets page-ref/right-brackets)))
          (apply-bracket-trigger! input block-ref-edit [:editor/search-page])

          ;; When you type text inside square brackets
          (and (not non-enter-processed?)
               (not (contains? #{"ArrowDown" "ArrowLeft" "ArrowRight" "ArrowUp" "Escape"} k))
               (wrapped-by? input page-ref/left-brackets page-ref/right-brackets))
          (let [orig-pos (cursor/get-caret-pos input)
                square-pos (string/last-index-of (subs value 0 (:pos orig-pos)) page-ref/left-brackets)
                pos (+ square-pos 2)
                _ (state/set-editor-last-pos! pos)
                pos (assoc orig-pos :pos pos)
                command-step (if (= \# (util/nth-safe value (dec square-pos)))
                               :editor/search-page-hashtag
                               :editor/search-page)]
            (commands/handle-step [command-step])
            (state/set-editor-action-data! {:pos pos}))

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
                 (event-code e))
               ;; #3440
               (util/goog-event-is-composing? e true)])
            comment-editor? (:comment-editor? (last (state/get-editor-args)))]
        (cond
          (= value "``````") ; turn this block into a code block
          (do
            (state/set-edit-content! (.-id input) "")
            (state/pub-event! [:editor/upsert-type-block {:block (assoc (state/get-edit-block) :block/title "")
                                                          :type :code
                                                          :update-current-block? true}]))

          (and (not comment-editor?) (= value ">")) ; turn this block into a quote block
          (do
            (state/set-edit-content! (.-id input) "")
            (state/pub-event! [:editor/upsert-type-block {:block (assoc (state/get-edit-block) :block/title "")
                                                          :type :quote
                                                          :update-current-block? true}]))

          ;; When you type something after /
          (and (= :commands (state/get-editor-action)) (not= k commands/command-trigger))
          (if (= commands/command-trigger (second (re-find #"(\S+)\s+$" value)))
            (state/clear-editor-action!)
            (let [command (get-last-command input)
                  matched-commands (get-matched-commands command)]
              (if (seq matched-commands)
                (commands/set-matched-commands! command matched-commands)
                (if (> (- (count command) (count @commands/*latest-matched-command)) 2)
                  (state/clear-editor-action!)
                  (reset! commands/*matched-commands nil)))))

          :else
          (default-case-for-keyup-handler input current-pos k code is-processed?))

        (close-autocomplete-if-outside input)

        (when-not (or (= k "Shift") is-processed?)
          (state/set-last-key-code! {:key-code key-code
                                     :code code
                                     :key k
                                     :shift? (.-shiftKey e)}))
        (when-not (state/get-editor-action)
          (state/set-editor-last-pos! (cursor/pos input)))))))

(defn editor-on-click!
  [id]
  (fn [_e]
    (let [input (gdom/getElement id)]
      (util/scroll-editor-cursor input)
      (close-autocomplete-if-outside input))))

(defn editor-on-change!
  [block id search-timeout]
  (fn [e]
    (let [editor-action (state/get-editor-action)]
      (if (= :block-search editor-action)
        (let [timeout 50]
          (when @search-timeout
            (js/clearTimeout @search-timeout))
          (reset! search-timeout
                  (js/setTimeout
                   #(edit-box-on-change! e block id)
                   timeout)))
        (let [input (gdom/getElement id)]
          (edit-box-on-change! e block id)
          (when-not editor-action
            (util/scroll-editor-cursor input)))))))

(defn- cut-blocks-and-clear-selections!
  [copy?]
  (when-not (:active? (state/get-state :ui/find-in-page))
    (cut-selection-blocks copy?)
    (clear-selection!)))

(defn shortcut-copy-selection
  [e]
  (when e
    (util/stop e))
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
      (if (= format "embed")
        (p/do!
         (save-current-block!)
         (util/copy-to-clipboard! (ref/->page-ref block-id)
                                  {:graph (state/get-current-repo)
                                   :blocks [{:block/uuid (:block/uuid current-block)}]
                                   :embed-block? true}))
        (copy-block-ref! block-id ref/->page-ref)))))

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

      (and (state/editing?) (nil? (state/get-state :editor/code-block-context)))
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
  (cond
    (state/selection?)
    (shortcut-delete-selection e)

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

(defn- in-page-preview?
  []
  (some-> js/document.activeElement
          (.closest ".ls-preview-popup")
          (nil?) (not)))

(defn shortcut-up-down [direction]
  (fn [e]
    (state/pub-event! [:editor/hide-action-bar])
    (when (and (not (auto-complete?))
               (or (in-page-preview?)
                   (not (in-shui-popup?)))
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
        (if (or (and (= direction :up) (cursor/textarea-cursor-rect-first-row? cursor-rect))
                (and (= direction :down) (cursor/textarea-cursor-rect-last-row? cursor-rect)))
          ;; if the move is to cross block boundary, select the whole block
          (select-block-up-down direction)
          ;; simulate text selection
          (cursor/select-up-down input direction anchor cursor-rect)))
      (select-block-up-down direction))))

(defn editor-commands-popup-exists?
  []
  (popup-exists? "editor.commands"))

(defn open-selected-blocks-in-sidebar!
  []
  (doseq [id (state/get-selection-block-ids)]
    (state/sidebar-add-block! (state/get-current-repo) id :block)))

(defn open-selected-block!
  [direction e]
  (when-not (auto-complete?)
    (let [selected-blocks (state/get-selection-blocks)
          f (case direction :left first :right last)
          node (some-> selected-blocks f)]
      (if (some-> node (dom/has-class? "block-add-button"))
        (.click node)
        (when-let [block-id (some-> node (dom/attr "blockid") uuid)]
          (util/stop e)
          (let [block {:block/uuid block-id}
                left? (= direction :left)
                opts {:container-id (some-> node (dom/attr "containerid") (parse-long))
                      :event e}]
            (edit-block! block (if left? 0 :max) opts)))))))

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

(defn db-collapsable?
  [block & _opts]
  (let [properties (->> (:block.temp/property-keys block)
                        (remove #{:block/alias})
                        (remove nil?))]
    (or (seq properties)
        (:logseq.property/query block))))

(defn- block-has-children?
  [block node]
  (or (worker-has-children? block)
      (= "true" (node-attr node "haschild"))
      (some? (some-> node (.querySelector "[data-has-children='true']")))))

(defn- block-node-for-id
  [block-id]
  (first (dom/sel (util/format "[blockid='%s']" block-id))))

(defn collapsable?
  ([block-id]
   (collapsable? block-id {}))
  ([block-id {:keys [block semantic? ignore-children? page-title?]
              :or {semantic? false
                   ignore-children? false}}]
   (when block-id
     (let [node (block-node-for-id block-id)
           title (or (:block/title block)
                     (node-attr node "data-block-title"))
           format (or (:block/format block)
                      (some-> (node-attr node "data-block-format") keyword)
                      :markdown)]
       (or (and (not ignore-children?)
                (block-has-children? block node))
           (db-collapsable? block {:page-title? page-title?})
           (= "true" (node-attr node "data-db-collapsable"))
           (and
            (:outliner/block-title-collapse-enabled? (state/get-config))
            (block-with-title? format title semantic?)))))))

(defn <all-blocks-with-level
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
  (p/let [repo (state/get-current-repo)
          today-page-title (when-not (or page (state/get-current-page))
                             (db-async/<get-today-journal-title repo))]
    (when-let [page (or page
                        (state/get-current-page)
                        today-page-title)]
      (p/let [target-id (or root-block
                            (when (util/uuid-string? page) (parse-uuid page))
                            page)
              result (db-async/<get-block-with-children repo target-id {:include-collapsed-children? true})
              entity (:block result)
              child-blocks (:children result)
              page? (entity/page? entity)
              blocks (if page? child-blocks (cons entity child-blocks))
              root-id (:block/uuid entity)
              root-block (when-not page? root-id)]
        (if incremental?
          (let [blocks (tree/blocks->vec-tree blocks root-id)]
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
               (filter (fn [b] (collapsable? (:block/uuid b) {:block b})))

               true
               (map (fn [x] (dissoc x :block/children))))
             (remove nil?)))

          (cond->> blocks
            collapse?
            (filter util/collapsed?)

            expanded?
            (filter (fn [b] (collapsable? (:block/uuid b) {:block b})))

            true
            (remove nil?)))))))

(defn- skip-collapsing-in-db?
  []
  (let [config (last (state/get-editor-args))]
    (:ref? config)))

(defn- collapse-block-opts
  []
  (let [config (last (state/get-editor-args))
        collapsable-page-title? (or (:page-title? config)
                                    (:collapsable-page-title? config))]
    {:page-title? collapsable-page-title?}))

(defn- current-editor-container-id
  []
  (some-> (state/get-editor-args) last :container-id))

(defn- comment-editor?
  []
  (:comment-editor? (last (state/get-editor-args))))

(defn set-blocks-collapsed!
  [block-ids value]
  (let [block-ids (map (fn [block-id] (if (string? block-id) (uuid block-id) block-id)) block-ids)
        repo (state/get-current-repo)
        value (boolean value)]
    (when repo
      (save-current-block!) ;; Save the input contents before collapsing
      (ui-outliner-tx/transact! ;; Save the new collapsed state as an undo transaction (if it changed)
       (merge {:outliner-op :collapse-expand-blocks}
              (block-handler/outliner-tx-meta (state/get-edit-block)))
       (outliner-op/collapse-expand-blocks! block-ids value))
      (doseq [block-id block-ids]
        (state/set-collapsed-block! block-id value)))))

(defn collapse-block!
  ([block-id]
   (collapse-block! block-id nil))
  ([block-id container-id]
   (when (collapsable? block-id (collapse-block-opts))
     (when-not (skip-collapsing-in-db?)
       (set-blocks-collapsed! [block-id] true))
     (state/set-collapsed-block! block-id true (or container-id (current-editor-container-id))))))

(defn expand-block! [block-id & {:keys [skip-db-collpsing? container-id]}]
  (let [repo (state/get-current-repo)]
    (p/do!
     (db-async/<get-block repo block-id {:include-collapsed-children? true})
     (when-not (or skip-db-collpsing? (skip-collapsing-in-db?))
       (set-blocks-collapsed! [block-id] false))
     (state/set-collapsed-block! block-id false (or container-id (current-editor-container-id))))))

(defn expand!
  ([e] (expand! e false))
  ([e clear-selection?]
   (util/stop e)
   (cond
     (state/editing?)
     (when-not (comment-editor?)
       (when-let [block-id (:block/uuid (state/get-edit-block))]
         (expand-block! block-id)))

     (state/selection?)
     (do
       (->> (get-selected-blocks)
            (map (fn [dom]
                   (let [block-id (some-> (dom/attr dom "blockid") uuid)
                         container-id (dom/attr dom "containerid")]
                     (when block-id
                       (expand-block! block-id :container-id container-id)))))
            doall)
       (and clear-selection? (clear-selection!)))

     :else
     ;; expand one level
     (p/let [blocks-with-level (<all-blocks-with-level {})
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
     (when-not (comment-editor?)
       (when-let [block-id (:block/uuid (state/get-edit-block))]
         (collapse-block! block-id)))

     (state/selection?)
     (do
       (->> (get-selected-blocks)
            (map (fn [dom]
                   (let [block-id (some-> (dom/attr dom "blockid") uuid)
                         container-id (dom/attr dom "containerid")]
                     (when block-id
                       (collapse-block! block-id container-id)))))
            doall)
       (and clear-selection? (clear-selection!)))

     :else
     ;; collapse by one level from outside
     (p/let [blocks-with-level
             (<all-blocks-with-level {:collapse? true})
             max-level (or (apply max (map :block/level blocks-with-level)) 99)]
       (loop [level max-level]
         (if (zero? level)
           nil
           (let [blocks-to-collapse
                 (->> blocks-with-level
                      (filter (fn [b] (= (:block/level b) level)))
                      (filter (fn [b] (collapsable? (:block/uuid b) {:block b}))))]
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
     (when-let [block (when-not (comment-editor?)
                        (state/get-edit-block))]
       ;; get-edit-block doesn't track the latest collapsed state, so we need to reload from db.
       (let [block-id (:block/uuid block)
             repo (state/get-current-repo)]
         (p/let [block (db-async/<get-block repo block-id {:children? false})]
           (if (:block/collapsed? block)
             (expand! e clear-selection?)
             (collapse! e clear-selection?)))))

     (state/selection?)
     (do
       (let [block-ids (map #(-> % (dom/attr "blockid") uuid) (get-selected-blocks))
             first-block-id (first block-ids)]
         (when first-block-id
           ;; If multiple blocks are selected, they may not have all the same collapsed state.
           ;; For simplicity, use the first block's state to decide whether to collapse/expand all.
           (p/let [first-block (db-async/<get-block (state/get-current-repo) first-block-id {:children? false})]
             (if (:block/collapsed? first-block)
               (doseq [block-id block-ids] (expand-block! block-id))
               (doseq [block-id block-ids] (collapse-block! block-id))))))
       (and clear-selection? (clear-selection!)))

     :else
      ;; If no block is being edited or selected, the "toggle" action doesn't make sense,
      ;; so we no-op here, unlike in the expand! & collapse! functions.
     nil)))

(defn collapse-all!
  ([]
   (collapse-all! nil {}))
  ([block-id {:keys [collapse-self?]
              :or {collapse-self? true}}]
   (p/let [blocks (<all-blocks-with-level {:incremental? false
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
   (p/let [blocks (<all-blocks-with-level {:incremental? false
                                           :collapse? true
                                           :root-block block-id})
           block-ids (map :block/uuid blocks)]
     (set-blocks-collapsed! block-ids false))))

(defn collapse-all-selection!
  []
  (p/let [select-ids (get-selected-toplevel-block-uuids)
          result (p/all
                  (map #(<all-blocks-with-level {:incremental? false
                                                 :expanded? true
                                                 :root-block %})
                       select-ids))
          block-ids (->> result
                         (apply concat)
                         (map :block/uuid)
                         distinct)]
    (set-blocks-collapsed! block-ids true)))

(defn expand-all-selection!
  []
  (->
   (p/let [select-ids (get-selected-toplevel-block-uuids)
           result (p/all
                   (map #(<all-blocks-with-level {:incremental? false
                                                  :collapse? true
                                                  :root-block %})
                        select-ids))
           block-ids (->> result
                          (apply concat)
                          (map :block/uuid)
                          distinct)]
     (set-blocks-collapsed! block-ids false))
   (p/catch (fn [e]
              (js/console.error e)))))

(defn toggle-open! []
  (p/let [blocks (<all-blocks-with-level {:incremental? false
                                          :collapse? true})
          all-expanded? (empty? blocks)]
    (if all-expanded?
      (collapse-all!)
      (expand-all!))))

(defn toggle-open-block-children! [block-id]
  (p/let [blocks (<all-blocks-with-level {:incremental? false
                                          :expanded? true
                                          :root-block block-id})
          children-blocks (remove #(= block-id (:block/uuid %)) blocks)
          any-expanded? (seq (filter (complement util/collapsed?) children-blocks))]
    (if any-expanded?
      (collapse-all! block-id {:collapse-self? false})
      (expand-all! block-id))))

(defn select-all-blocks!
  [{:keys [page]}]
  (p/do!
   (if-let [current-input-id (state/get-edit-input-id)]
     (let [input (gdom/getElement current-input-id)
           blocks-container (util/rec-get-blocks-container input)
           blocks (dom/by-class blocks-container "ls-block")]
       (state/exit-editing-and-set-selected-blocks! blocks))
     (p/let [blocks (<all-blocks-with-level {:page page
                                             :collapse? true})]
       (->> blocks
            (map (fn [b] (or (:block/link b) b)))
            (mapcat (fn [b] (util/get-blocks-by-id (:block/uuid b))))
            state/exit-editing-and-set-selected-blocks!)))
   (state/set-state! :selection/selected-all? true)))

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
         [(util/get-first-block-by-id (:block/uuid edit-block))]))

      edit-block
      nil

      ;; Focusing other input element, e.g. when editing page title.
      (contains? #{"INPUT" "TEXTAREA"} target-element)
      nil

      :else
      (do
        (util/stop e)
        (when-not (state/get-state :selection/selected-all?)
          (if-let [block-id (some-> (first (state/get-selection-blocks))
                                    (dom/attr "blockid")
                                    uuid)]
            (p/let [block (db-async/<get-block (state/get-current-repo) block-id)]
              (when block
                (let [parent (:block/parent block)]
                  (cond
                    (= (state/get-current-page) (str (:block/uuid block)))
                    nil

                    (and parent (:block/parent parent))
                    (state/exit-editing-and-set-selected-blocks!
                     [(util/get-first-block-by-id (:block/uuid parent))])

                    (:block/name parent)
                    ;; page block
                    (select-all-blocks! {:page (:block/name parent)})))))
            (select-all-blocks! {})))))))

(defn escape-editing
  [& {:keys [select? save-block? editing-another-block?]
      :or {save-block? true}}]
  (p/do!
   (when save-block? (save-current-block!))
   (if select?
     (when-let [node (some-> (state/get-input) (util/rec-get-node "ls-block"))]
       (state/exit-editing-and-set-selected-blocks! [node]))
     (when-not editing-another-block?
       (state/clear-edit!)))))

(defn copy-current-ref
  [block-id]
  (when block-id
    (util/copy-to-clipboard! (ref/->block-ref block-id))))

(defn delete-current-ref!
  [block ref-id]
  (when (and block ref-id)
    (let [content (string/replace (:block/title block) (ref/->page-ref ref-id) "")]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn replace-ref-with-text!
  [block ref-id]
  (when (and block ref-id)
    (p/let [ref-block (db-async/<get-block (state/get-current-repo) ref-id {:children? false})]
      (let [match (ref/->block-ref ref-id)
            block-ref-content (or (:block/title ref-block) "")
            content (string/replace-first (:block/title block) match
                                          block-ref-content)]
        (save-block! (state/get-current-repo)
                     (:block/uuid block)
                     content)))))

(defn replace-ref-with-embed!
  [block ref-id]
  (when (and block ref-id)
    (let [match (ref/->block-ref ref-id)
          content (string/replace-first (:block/title block) match
                                        (util/format "{{embed ((%s))}}"
                                                     (str ref-id)))]
      (save-block! (state/get-current-repo)
                   (:block/uuid block)
                   content))))

(defn block-default-collapsed?
  "Whether a block should be collapsed by default.
  Currently, this handles all the kinds of views."
  [block config]
  (let [block block]
    (if (:bidirectional? config)
      (if (:ref-query-child? config)
        (and (not (:ignore-block-collapsed? config))
             (util/collapsed? block))
        true)
      (or
       (and (not (:ignore-block-collapsed? config))
            (util/collapsed? block))
       (and (util/mobile?) (:logseq.property/query block))
       (and (or (:list-view? config) (:ref? config))
            (worker-has-children? block)
            (integer? (:block-level config))
            (>= (:block-level config) (state/get-ref-open-blocks-level)))
       (:default-collapsed? config)
       (and (or (:view? config) (:popup? config))
            (or (entity/page? block)
                (:table-block-title? config)))))))

(defn load-children?
  [block temporary-collapsed-state ignore-block-collapsed?]
  (or ignore-block-collapsed?
      (not (if-some [result temporary-collapsed-state]
             result
             (:block/collapsed? block)))))

(defn batch-set-heading!
  [block-ids heading]
  (db-editor-handler/batch-set-heading! block-ids heading))

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

(defn run-query-command!
  []
  (when-let [block (state/get-edit-block)]
    (p/do!
     (save-current-block!)
     (state/clear-edit!)
     (p/let [query-block (or (:logseq.property/query block)
                             (p/do!
                              (property-handler/set-block-property! (:db/id block) :logseq.property/query "")
                              (p/let [block' (db-async/<get-block (state/get-current-repo) (:db/id block) {:children? false})]
                                (:logseq.property/query block'))))
             current-query (:block/title block)]
       (p/do!
        (ui-outliner-tx/transact!
         {:outliner-op :save-block}
         (property-handler/set-block-property! (:db/id block) :block/tags :logseq.class/Query)
         (when query-block
           (save-block-inner! query-block current-query {}))
         (save-block-inner! block "" {})))))))

(defn quick-add-ensure-new-block-exists!
  []
  (let [graph (state/get-current-repo)]
    (p/do!
     (db-async/<get-block graph (date/today))
     (p/let [add-page-result (db-async/<get-block-with-children graph common-config/quick-add-page-name)
             add-page (worker-block-with-children add-page-result)
             user-id (when-let [id-str (user-handler/user-uuid)] (uuid id-str))
             user (when user-id (db-async/<get-block graph user-id {:children? false}))
             user-db-id (:db/id user)
             children (worker-children add-page)
             children' (if user-db-id
                         (filter (fn [block]
                                   (let [create-by-id (ref-db-id (:logseq.property/created-by-ref block))]
                                     (= user-db-id create-by-id))) children)
                         children)]
       (when (empty? children')
         (api-insert-new-block! "" {:page (:block/uuid add-page)
                                    :container-id :unknown-container
                                    :replace-empty-target? false}))))))

(defn show-quick-add
  []
  (p/do!
   (quick-add-ensure-new-block-exists!)
   (state/pub-event! [:dialog/quick-add])))

(defn quick-add-blocks!
  []
  (let [graph (state/get-current-repo)]
    (p/do!
     (save-current-block!)
     (p/let [today-result (db-async/<get-block-with-children graph (date/today))
             today (worker-block-with-children today-result)
             add-page-result (db-async/<get-block-with-children graph common-config/quick-add-page-name)
             add-page (worker-block-with-children add-page-result)]
       (when (and today add-page)
         (let [children (worker-children add-page)]
           (p/do!
            (when (seq children)
              (if-let [today-last-child (last (ldb/sort-by-order (worker-children today)))]
                (move-blocks! children today-last-child {:sibling? true})
                (move-blocks! children today {:sibling? false})))
            (state/close-dialog!)
            (shui/popup-hide!)
            (when (seq children)
              (notification/show! (t :journal/add-blocks-to-today-success) :success)))))))))

(defn quick-add
  []
  (if (shui-dialog/get-dialog :ls-dialog-quick-add)
    (quick-add-blocks!)
    (show-quick-add)))

(defn <get-user-quick-add-blocks
  "Get quick add blocks for the current user if logged in"
  []
  (let [repo (state/get-current-repo)
        user-id-str (user-handler/user-uuid)]
    (p/let [page-result (db-async/<get-block-with-children repo common-config/quick-add-page-name)
            page (worker-block-with-children page-result)
            graph-rtc-uuid (state/<invoke-db-worker :thread-api/get-rtc-graph-uuid repo)]
      (if page
        (let [children (worker-children page)]
          (if (and user-id-str graph-rtc-uuid)
            (p/let [user (db-async/<get-block repo (uuid user-id-str) {:children? false})]
              (if-let [user-db-id (:db/id user)]
                (filter (fn [block]
                          (let [create-by-id (ref-db-id (:logseq.property/created-by-ref block))]
                            (or (= user-db-id create-by-id)
                                (nil? create-by-id)))) children)
                children))
            children))
        (throw (ex-info "Quick add page doesn't exists" {}))))))

(defn quick-add-open-last-block!
  []
  (p/let [blocks (<get-user-quick-add-blocks)]
    (when (seq blocks)
      (let [block (last (ldb/sort-by-order blocks))]
        (edit-block! block :max {:container-id :unknown-container})))))
