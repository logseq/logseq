(ns logseq.api.editor
  "Editor related APIs"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.code :as code-handler]
            [frontend.handler.dnd :as editor-dnd-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.shell :as shell]
            [frontend.modules.layout.core]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.date :as gdate]
            [goog.dom :as gdom]
            [logseq.api.block :as api-block]
            [logseq.api.db-based :as db-based-api]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn- <get-block
  [id-or-name & {:as opts}]
  (when id-or-name
    (db-async/<get-block (state/get-current-repo) id-or-name opts)))

(def save_focused_code_editor_content
  (fn []
    (code-handler/save-code-editor!)))

(def check_editing
  (fn []
    (if (state/get-edit-input-id)
      (str (:block/uuid (state/get-edit-block))) false)))

(def exit_editing_mode
  (fn [select?]
    (editor-handler/escape-editing {:select? select?})
    nil))

(def insert_at_editing_cursor
  (fn [content]
    (when-let [input-id (state/get-edit-input-id)]
      (commands/simple-insert! input-id content {})
      (when-let [input (gdom/getElement input-id)]
        (.focus input)))))

(def restore_editing_cursor
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (when-let [input (gdom/getElement input-id)]
        (when (util/el-visible-in-viewport? input)
          (.focus input))))))

(def get_editing_cursor_position
  (fn []
    (when-let [input-id (state/get-edit-input-id)]
      (bean/->js (sdk-utils/normalize-keyword-for-json (cursor/get-caret-pos (gdom/getElement input-id)))))))

(def get_editing_block_content
  (fn []
    (state/get-edit-content)))

(def get_selected_blocks
  (fn []
    (when-let [blocks (state/selection?)]
      (let [blocks (->> blocks
                        (map (fn [^js el] (some->
                                           (.getAttribute el "blockid")
                                           (db-model/get-block-by-uuid)))))]
        (sdk-utils/result->js blocks)))))

(def clear_selected_blocks
  (fn []
    (state/clear-selection!)))

(def get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (p/let [page (<get-block page {:children? false})]
        (when page
          (sdk-utils/result->js page))))))

(defn get_page
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when page
      (sdk-utils/result->js page))))

(defn get_all_pages
  []
  (p/let [result (db-async/<q
                  (state/get-current-repo)
                  {:transact-db? false}
                  '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at]) ...]
                    :where
                    [?page :block/name]
                    [(get-else $ ?page :logseq.property/hide? false) ?hide]
                    [(false? ?hide)]])]
    (->> result
         (sort-by :block/title)
         sdk-utils/result->js)))

(defn create_page
  [name ^js properties ^js opts]
  (this-as
   this
   (let [properties (bean/->clj properties)
         db-based? (config/db-based-graph?)
         {:keys [redirect format journal schema class customUUID]} (bean/->clj opts)]
     (p/let [page (<get-block name {:children? false})
             new-page (when-not page
                        (page-handler/<create!
                         name
                         (cond->
                          {:redirect? (if (boolean? redirect) redirect true)
                           :journal? journal
                           :class? class
                           :format format}
                           (string? customUUID)
                           (assoc :uuid (uuid customUUID))
                           (not db-based?)
                           (assoc :properties properties))))
             _ (when (and db-based? (seq properties))
                 (api-block/db-based-save-block-properties! new-page properties {:plugin this
                                                                                 :schema schema}))]
       (some-> (or page new-page)
               sdk-utils/result->js)))))

(defn create_journal_page
  [^js date]
  (let [date (js/Date. date)]
    (when-let [datestr (and (not (js/isNaN (.getTime date)))
                            (-> (gdate/Date. date)
                                (date-time-util/format "yyyy-MM-dd")))]
      (create_page datestr nil #js {:journal true :redirect false}))))

(defn delete_page
  [name]
  (page-handler/<delete! name nil))

(def rename_page
  page-handler/rename!)

(defn open_in_right_sidebar
  [block-id-or-uuid]
  (editor-handler/open-block-in-sidebar!
   (if (number? block-id-or-uuid)
     block-id-or-uuid
     (sdk-utils/uuid-or-throw-error block-id-or-uuid))))

(defn new_block_uuid []
  (str (db/new-block-id)))

(def select_block
  (fn [block-uuid]
    (when-let [block (db-model/get-block-by-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (editor-handler/select-block! (:block/uuid block)) nil)))

(def edit_block
  (fn [block-uuid ^js opts]
    (when-let [block-uuid (and block-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (when-let [block (db-model/query-block-by-uuid block-uuid)]
        (let [{:keys [pos] :or {pos :max}} (bean/->clj opts)]
          (editor-handler/edit-block! block pos {:container-id :unknown-container}))))))

(defn- <ensure-page-loaded
  [block-uuid-or-page-name]
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo (str block-uuid-or-page-name)
                                     {:children? true
                                      :include-collapsed-children? true})
          _ (when-let [page-id (:db/id (:block/page block))]
              (when-let [page-uuid (:block/uuid (db/entity page-id))]
                (db-async/<get-block repo page-uuid)))]
    block))

(defn insert_block
  [block-uuid-or-page-name content ^js opts]
  (this-as this
           (when (string/blank? block-uuid-or-page-name)
             (throw (js/Error. "Page title or block UUID shouldn't be empty.")))

           (p/let [block? (util/uuid-string? (str block-uuid-or-page-name))
                   block (<get-block (str block-uuid-or-page-name))]
             (if (and block? (not block))
               (throw (js/Error. "Block not exists"))
               (p/let [{:keys [before start end sibling focus customUUID properties autoOrderedList schema]} (bean/->clj opts)
                       [page-name block-uuid] (if (util/uuid-string? block-uuid-or-page-name)
                                                [nil (uuid block-uuid-or-page-name)]
                                                [block-uuid-or-page-name nil])
                       page-name (when page-name (util/page-name-sanity-lc page-name))
                       _ (when (and page-name
                                    (nil? (ldb/get-page (db/get-db) page-name)))
                           (page-handler/<create! block-uuid-or-page-name {}))
                       custom-uuid (or customUUID (:id properties))
                       custom-uuid (when custom-uuid (sdk-utils/uuid-or-throw-error custom-uuid))
                       edit-block? (if (nil? focus) true focus)
                       _ (when (and custom-uuid (db-model/query-block-by-uuid custom-uuid))
                           (throw (js/Error.
                                   (util/format "Custom block UUID already exists (%s)." custom-uuid))))
                       block-uuid' (if (and (not sibling) before block-uuid)
                                     (let [block (db/entity [:block/uuid block-uuid])
                                           first-child (ldb/get-first-child (db/get-db) (:db/id block))]
                                       (if first-child
                                         (:block/uuid first-child)
                                         block-uuid))
                                     block-uuid)
                       insert-at-first-child? (not= block-uuid' block-uuid)
                       [sibling? before?] (if insert-at-first-child?
                                            [true true]
                                            [sibling before])
                       db-based? (config/db-based-graph?)
                       before? (if (and (false? sibling?) before? (not insert-at-first-child?))
                                 false
                                 before?)
                       opts' {:block-uuid block-uuid'
                              :sibling? sibling?
                              :before? before?
                              :start? start
                              :end? end
                              :edit-block? edit-block?
                              :page page-name
                              :custom-uuid custom-uuid
                              :ordered-list? (if (boolean? autoOrderedList) autoOrderedList false)
                              :properties (when (not db-based?)
                                            (merge properties
                                                   (when custom-uuid {:id custom-uuid})))}]
                 (if db-based?
                   (db-based-api/insert-block this content properties schema opts')
                   (p/let [new-block (editor-handler/api-insert-new-block! content opts')]
                     (bean/->js (sdk-utils/normalize-keyword-for-json new-block)))))))))

(def insert_batch_block
  (fn [block-uuid ^js batch-blocks-js ^js opts-js]
    (this-as
     this
     (p/let [block (<ensure-page-loaded block-uuid)]
       (when block
         (when-let [blocks (bean/->clj batch-blocks-js)]
           (let [db-based? (config/db-based-graph?)
                 blocks' (if-not (vector? blocks) (vector blocks) blocks)
                 opts (bean/->clj opts-js)
                 {:keys [sibling before _schema keepUUID]} opts]
             (if db-based?
               (db-based-api/insert-batch-blocks this block blocks' opts)
               (let [keep-uuid? (or keepUUID false)
                     _ (when keep-uuid? (doseq
                                         [block (outliner-core/tree-vec-flatten blocks' :children)]
                                          (let [uuid (:id (:properties block))]
                                            (when (and uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error uuid)))
                                              (throw (js/Error.
                                                      (util/format "Custom block UUID already exists (%s)." uuid)))))))
                     block (if before
                             (db/pull (:db/id (ldb/get-left-sibling (db/entity (:db/id block))))) block)
                     sibling? (if (ldb/page? block) false sibling)]
                 (p/let [result (editor-handler/insert-block-tree-after-target
                                 (:db/id block) sibling? blocks' (get block :block/format :markdown) keep-uuid?)
                         blocks (:blocks result)]
                   (let [blocks' (map (fn [b] (db/entity [:block/uuid (:block/uuid b)])) blocks)]
                     (-> blocks'
                         sdk-utils/normalize-keyword-for-json
                         bean/->js))))))))))))

(def remove_block
  (fn [block-uuid ^js _opts]
    (p/let [repo            (state/get-current-repo)
            _ (<get-block block-uuid {:children? false})]
      (editor-handler/delete-block-aux!
       {:block/uuid (sdk-utils/uuid-or-throw-error block-uuid) :repo repo}))))

(def update_block
  (fn [block-uuid content ^js opts]
    (this-as
     this
     (p/let [repo (state/get-current-repo)
             db-based? (config/db-based-graph?)
             block (<get-block block-uuid {:children? false})
             opts' (bean/->clj opts)]
       (when block
         (if db-based?
           (db-based-api/update-block this block content opts')
           (editor-handler/save-block! repo
                                       (sdk-utils/uuid-or-throw-error block-uuid) content
                                       (if db-based? (dissoc opts' :properties) opts'))))))))

(def move_block
  (fn [src-block-uuid target-block-uuid ^js opts]
    (p/let [_ (<get-block src-block-uuid {:children? false})
            _ (<get-block target-block-uuid {:children? false})]
      (let [{:keys [before children]} (bean/->clj opts)
            move-to      (cond
                           (boolean before)
                           :top

                           (boolean children)
                           :nested

                           :else
                           nil)
            src-block    (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error src-block-uuid))
            target-block (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error target-block-uuid))]
        (editor-dnd-handler/move-blocks nil [src-block] target-block nil move-to)))))

(def get_block
  (fn [id ^js opts]
    (p/let [block (db-async/<get-block (state/get-current-repo) id {:children? true
                                                                    :include-collapsed-children? true})]
      (api-block/get_block (:db/id block) (or opts #js {:includePage true})))))

(def get_current_block
  (fn [^js opts]
    (let [block (state/get-edit-block)
          block (or block
                    (some-> (or (first (state/get-selection-blocks))
                                (state/get-editor-block-container))
                            (.getAttribute "blockid")
                            (db-model/get-block-by-uuid)))]
      (get_block (:block/uuid block) opts))))

(def get_previous_sibling_block
  (fn [block-uuid ^js opts]
    (p/let [id (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (when-let [sibling (ldb/get-left-sibling (db/entity (:db/id block)))]
          (get_block (:block/uuid sibling) opts))))))

(def get_next_sibling_block
  (fn [block-uuid ^js opts]
    (p/let [id (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (p/let [sibling (ldb/get-right-sibling (db/entity (:db/id block)))]
          (get_block (:block/uuid sibling) opts))))))

(def set_block_collapsed
  (fn [block-uuid ^js opts]
    (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block block-uuid {:children? false})]
      (when block
        (let [opts (bean/->clj opts)
              opts (if (or (string? opts) (boolean? opts)) {:flag opts} opts)
              {:keys [flag]} opts
              flag (if (= "toggle" flag)
                     (not (util/collapsed? block))
                     (boolean flag))]
          (if flag
            (editor-handler/collapse-block! block-uuid)
            (editor-handler/expand-block! block-uuid))
          nil)))))

(def get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [page-id (:db/id (ldb/get-page (db/get-db) page))
            blocks (db-model/get-page-blocks-no-cache page-id)
            blocks (outliner-tree/blocks->vec-tree blocks page-id)
            ;; clean key
            blocks (sdk-utils/normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(def get_page_blocks_tree
  (fn [id-or-page-name]
    (p/let [_ (<ensure-page-loaded id-or-page-name)]
      (when-let [page-id (:db/id (db-model/get-page id-or-page-name))]
        (let [blocks (db-model/get-page-blocks-no-cache page-id)
              blocks (outliner-tree/blocks->vec-tree blocks page-id)
              blocks (sdk-utils/normalize-keyword-for-json blocks)]
          (bean/->js blocks))))))

(defn get_page_linked_references
  [page-name-or-uuid]
  (p/let [repo (state/get-current-repo)
          block (<get-block page-name-or-uuid {:children? false})]
    (when-let [id (:db/id block)]
      (p/let [result (db-async/<get-block-refs repo id)
              ref-blocks (db-utils/group-by-page result)]
        (bean/->js (sdk-utils/normalize-keyword-for-json ref-blocks))))))

(defn prepend_block_in_page
  [uuid-or-page-name content ^js opts]
  (p/let [uuid-or-page-name (or
                             uuid-or-page-name
                             (state/get-current-page)
                             (date/today))
          block           (<get-block uuid-or-page-name)
          new-page        (when (and (not block) (not (util/uuid-string? uuid-or-page-name))) ; page not exists
                            (page-handler/<create! uuid-or-page-name
                                                   {:redirect?           false
                                                    :format              (state/get-preferred-format)}))]
    (let [block (or block new-page)
          opts (bean/->clj opts)
          opts' (assoc opts :before false :sibling false :start true)]
      (insert_block (str (:block/uuid block)) content (bean/->js opts')))))

(defn- get-current-page-or-today
  []
  (or
   (state/get-current-page)
   (date/today)))

(defn append_block_in_page
  ([content]
   (append_block_in_page (get-current-page-or-today) content nil))
  ([uuid-or-page-name-or-content content-or-opts]
   (if (string? content-or-opts)
     (append_block_in_page uuid-or-page-name-or-content content-or-opts nil)
     (append_block_in_page (get-current-page-or-today) uuid-or-page-name-or-content content-or-opts)))
  ([uuid-or-page-name content ^js opts]
   (let [uuid-or-page-name (or
                            uuid-or-page-name
                            (state/get-current-page)
                            (date/today))]
     (p/let [_ (<ensure-page-loaded uuid-or-page-name)
             page? (not (util/uuid-string? uuid-or-page-name))
             page (db-model/get-page uuid-or-page-name)
             page-not-exist? (and page? (nil? page))
             new-page (when page-not-exist?
                        (page-handler/<create! uuid-or-page-name
                                               {:redirect? false
                                                :format (state/get-preferred-format)}))
             block (or page new-page)]
       (let [children (:block/_parent block)
             [target sibling?] (if (seq children)
                                 [(last (ldb/sort-by-order children)) true]
                                 [block false])
             target-id (str (:block/uuid target))
             opts (-> (bean/->clj opts)
                      (assoc :sibling sibling?))]
         (insert_block target-id content (bean/->js opts)))))))

(defn download_graph_db
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-sqlite-db! repo)))

(defn download_graph_pages
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-zip! repo)))

(defn exec_git_command
  [^js args]
  (when-let [args (and args (seq (bean/->clj args)))]
    (shell/run-git-command! args)))

;; block properties
(defn upsert_block_property
  [block-uuid key ^js value ^js options]
  (this-as
   this
   (p/let [key' (api-block/sanitize-user-property-name key)
           opts (bean/->clj options)
           block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
           repo (state/get-current-repo)
           block (<get-block block-uuid {:children? false})
           db-based? (config/db-based-graph?)
           value (bean/->clj value)]
     (when block
       (if db-based?
         (db-based-api/upsert-block-property this block key' value opts)
         (property-handler/set-block-property! repo block-uuid key' value))))))

(defn remove_block_property
  [block-uuid key]
  (this-as this
           (p/let [key (api-block/sanitize-user-property-name key)
                   block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
                   _block (<get-block block-uuid {:children? false})
                   db-based? (config/db-based-graph?)
                   key-ns? (namespace (keyword key))
                   key (if (and db-based? (not key-ns?))
                         (api-block/get-db-ident-from-property-name key this)
                         key)]
             (property-handler/remove-block-property!
              (state/get-current-repo)
              block-uuid key))))

(defn get_block_property
  [block-uuid key]
  (this-as this
           (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
                   _block (<get-block block-uuid {:children? false})]
             (when-let [properties (some-> block-uuid (db-model/get-block-by-uuid) (:block/properties))]
               (when (seq properties)
                 (let [property-name (api-block/sanitize-user-property-name key)
                       ident (api-block/get-db-ident-from-property-name property-name this)
                       property-value (or (get properties property-name)
                                          (get properties (keyword property-name))
                                          (get properties ident))
                       property-value (if-let [property-id (:db/id property-value)]
                                        (db/pull property-id) property-value)
                       property-value (cond-> property-value
                                        (map? property-value)
                                        (assoc
                                         :value (or (:logseq.property/value property-value)
                                                    (:block/title property-value))
                                         :ident ident))
                       parsed-value (api-block/parse-property-json-value-if-need ident property-value)]
                   (or parsed-value
                       (bean/->js (sdk-utils/normalize-keyword-for-json property-value)))))))))

(def get_block_properties
  (fn [block-uuid]
    (p/let [block-uuid (sdk-utils/uuid-or-throw-error block-uuid)
            block (<get-block block-uuid {:children? false})]
      (when block
        (let [properties (if (config/db-based-graph?)
                           (api-block/into-readable-db-properties (:block/properties block))
                           (:block/properties block))]
          (sdk-utils/result->js properties))))))

(defn get_page_properties
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when-let [id (:block/uuid page)]
      (get_block_properties id))))
