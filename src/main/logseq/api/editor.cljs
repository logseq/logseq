(ns logseq.api.editor
  "Editor related APIs"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [frontend.commands :as commands]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.code :as code-handler]
            [frontend.handler.dnd :as editor-dnd-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.date :as gdate]
            [goog.dom :as gdom]
            [logseq.api.block :as api-block]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.plugin :as api-plugin]
            [logseq.common.path :as path]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn- <get-block
  [id-or-name & {:as opts}]
  (when id-or-name
    (db-async/<get-block (state/get-current-repo) id-or-name opts)))

(defn- group-blocks-by-page
  [blocks]
  (if (:block/page (first blocks))
    (some->> blocks
             (group-by :block/page))
    blocks))

(defn- <get-today-journal-title
  []
  (db-async/<get-today-journal-title (state/get-current-repo)))

(defn- <get-current-page-or-today
  []
  (if-let [page (state/get-current-page)]
    (p/resolved page)
    (<get-today-journal-title)))

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
      (let [block-ids (keep (fn [^js el]
                              (some-> (.getAttribute el "blockid") uuid))
                            blocks)]
        (p/let [results (db-async/<get-blocks (state/get-current-repo) block-ids {:children? false})]
          (sdk-utils/result->js (keep :block results)))))))

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

(defn get_today_page
  []
  (p/let [today-title (<get-today-journal-title)
          page (<get-block today-title {:children? false})]
    (some-> page (sdk-utils/result->js))))

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
                           (assoc :uuid (uuid customUUID)))))
             page' (or page new-page)
             _ (when (seq properties)
                 (api-block/db-based-save-block-properties! new-page properties {:plugin this
                                                                                 :schema schema}))
             _ (when (true? redirect)
                 (route-handler/redirect-to-page! (:block/uuid page')))]
       (some-> page' sdk-utils/result->js)))))

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

(defn restore_page
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when page
      (page-handler/restore-recycled! (:block/uuid page)))))

(def rename_page
  page-handler/rename!)

(defn open_in_right_sidebar
  [block-id-or-uuid-or-key]
  (if (or (number? block-id-or-uuid-or-key)
        (util/uuid-string? block-id-or-uuid-or-key))
    (editor-handler/open-block-in-sidebar!
      (if (number? block-id-or-uuid-or-key)
        block-id-or-uuid-or-key
        (sdk-utils/uuid-or-throw-error block-id-or-uuid-or-key)))
    (when-let [pid (api-plugin/get-caller-plugin-id)]
      (state/sidebar-add-block!
        (state/get-current-repo)
        (keyword pid (str block-id-or-uuid-or-key))
        :plugin))))

(defn new_block_uuid []
  (str (ldb/new-block-id)))

(def select_block
  (fn [block-uuid]
    (p/let [block (<get-block (sdk-utils/uuid-or-throw-error block-uuid) {:children? false})]
      (when block
        (editor-handler/select-block! (:block/uuid block))
        nil))))

(def edit_block
  (fn [block-uuid ^js opts]
    (when-let [block-uuid (and block-uuid (sdk-utils/uuid-or-throw-error block-uuid))]
      (p/let [block (<get-block block-uuid {:children? false})]
        (let [{:keys [pos] :or {pos :max}} (bean/->clj opts)]
          (when block
            (editor-handler/edit-block! block pos {:container-id :unknown-container})))))))

(defn- <ensure-page-loaded
  [block-uuid-or-page-name]
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo (str block-uuid-or-page-name)
                                     {:include-collapsed-children? true})
          page-info (when block
                      (db-async/<get-block-page-info repo (:block/uuid block)))
          _ (when-let [page-uuid (:block/uuid page-info)]
              (db-async/<get-block repo page-uuid))]
    block))

(defn insert_block
  [id content ^js opts]
  (this-as this
           (p/let [block (<get-block id)]
             (when-let [block-uuid (:block/uuid block)]
               (p/let [{:keys [before start end sibling customUUID properties autoOrderedList schema]} (bean/->clj opts)
                       custom-uuid (or customUUID (:id properties))
                       custom-uuid (when custom-uuid (sdk-utils/uuid-or-throw-error custom-uuid))
                       existing-custom-block (when custom-uuid (<get-block custom-uuid {:children? false}))
                       _ (when existing-custom-block
                           (throw (js/Error.
                                   (util/format "Custom block UUID already exists (%s)." custom-uuid))))
                       children (when (and (not sibling) before block-uuid)
                                  (db-async/<get-block-immediate-children (state/get-current-repo) block-uuid))
                       block-uuid' (if (and (not sibling) before block-uuid)
                                     (let [first-child (first (ldb/sort-by-order children))]
                                       (if first-child
                                         (:block/uuid first-child)
                                         block-uuid))
                                     block-uuid)
                       insert-at-first-child? (not= block-uuid' block-uuid)
                       [sibling? before?] (if insert-at-first-child?
                                            [true true]
                                            [sibling before])
                       before? (if (and (false? sibling?) before? (not insert-at-first-child?))
                                 false
                                 before?)
                       opts' {:block-uuid block-uuid'
                              :sibling? sibling?
                              :before? before?
                              :start? start
                              :end? end
                              :edit-block? false
                              :custom-uuid custom-uuid
                              :ordered-list? (if (boolean? autoOrderedList) autoOrderedList false)}]
                 (db-based-api/insert-block this content properties schema opts'))))))

(def insert_batch_block
  (fn [block-uuid ^js batch-blocks-js ^js opts-js]
    (this-as
     this
     (p/let [block (<ensure-page-loaded block-uuid)]
       (when block
         (when-let [blocks (bean/->clj batch-blocks-js)]
           (let [blocks' (if-not (vector? blocks) (vector blocks) blocks)
                 opts (bean/->clj opts-js)]
             (db-based-api/insert-batch-blocks this block blocks' opts))))))))

(def remove_block
  (fn [id ^js _opts]
    (p/let [repo (state/get-current-repo)
            block (<get-block id {:children? false})]
      (when-let [block-uuid (:block/uuid block)]
        (editor-handler/delete-block-aux!
         {:block/uuid block-uuid :repo repo})))))

(def update_block
  (fn [id content ^js opts]
    (this-as
     this
     (p/let [block (<get-block id {:children? false})
             opts' (bean/->clj opts)]
       (when block
         (db-based-api/update-block this block content opts'))))))

(def move_block
  (fn [src-block-uuid target-block-uuid ^js opts]
    (p/let [src-block (<get-block src-block-uuid {:children? false})
            target-block (<get-block target-block-uuid {:children? false})]
      (let [{:keys [before children]} (bean/->clj opts)
            move-to      (cond
                           (boolean before)
                           :top

                           (boolean children)
                           :nested

                           :else
                           nil)]
        (editor-dnd-handler/move-blocks nil [src-block] target-block nil move-to)))))

(def get_block
  (fn [id ^js opts]
    (p/let [block (db-async/<get-block (state/get-current-repo) id {:include-collapsed-children? true})]
      (api-block/get_block (:db/id block) (or opts #js {:includePage true})))))

(def get_current_block
  (fn [^js opts]
    (let [block (state/get-edit-block)]
      (if block
        (get_block (:block/uuid block) opts)
        (when-let [block-id (some-> (or (first (state/get-selection-blocks))
                                      (state/get-editor-block-container))
                                    (.getAttribute "blockid"))]
          (p/let [block (<get-block (uuid block-id) {:children? false})]
            (get_block (:block/uuid block) opts)))))))

(def get_previous_sibling_block
  (fn [id ^js opts]
    (p/let [block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (p/let [sibling (db-async/<get-block-sibling (state/get-current-repo) (:db/id block) :left)]
          (when sibling
            (get_block (:block/uuid sibling) opts)))))))

(def get_next_sibling_block
  (fn [id ^js opts]
    (p/let [block (<get-block id)
            ;; Load all children blocks
            _ (api-block/<sync-children-blocks! block)]
      (when block
        (p/let [sibling (db-async/<get-block-sibling (state/get-current-repo) (:db/id block) :right)]
          (when sibling
            (get_block (:block/uuid sibling) opts)))))))

(def set_block_collapsed
  (fn [id ^js opts]
    (p/let [block (<get-block id {:children? false})]
      (when block
        (let [block-uuid (:block/uuid block)
              opts (bean/->clj opts)
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
    (when-let [page-uuid (state/get-current-page)]
      (p/let [_ (<ensure-page-loaded page-uuid)
              blocks (db-async/<get-page-blocks-tree (state/get-current-repo) page-uuid)]
        (some->
         (seq blocks)
         (sdk-utils/normalize-keyword-for-json)
         (bean/->js))))))

(def get_page_blocks_tree
  (fn [id-or-page-name]
    (p/let [_ (<ensure-page-loaded id-or-page-name)
            blocks (db-async/<get-page-blocks-tree (state/get-current-repo) id-or-page-name)]
      (some-> blocks
              sdk-utils/normalize-keyword-for-json
              bean/->js))))

(defn get_page_linked_references
  [page-name-or-uuid]
  (p/let [repo (state/get-current-repo)
          block (<get-block page-name-or-uuid {:children? false})]
    (when-let [id (:db/id block)]
      (p/let [result (db-async/<get-block-refs repo id)
              ref-blocks (group-blocks-by-page result)]
        (bean/->js (sdk-utils/normalize-keyword-for-json ref-blocks))))))

(defn prepend_block_in_page
  [uuid-or-page-name content ^js opts]
  (p/let [current-page-or-today (<get-current-page-or-today)
          uuid-or-page-name (or uuid-or-page-name current-page-or-today)
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
  (<get-current-page-or-today))

(defn append_block_in_page
  ([content]
   (p/let [current-page-or-today (get-current-page-or-today)]
     (append_block_in_page current-page-or-today content nil)))
  ([uuid-or-page-name-or-content content-or-opts]
   (if (string? content-or-opts)
     (append_block_in_page uuid-or-page-name-or-content content-or-opts nil)
     (p/let [current-page-or-today (get-current-page-or-today)]
       (append_block_in_page current-page-or-today uuid-or-page-name-or-content content-or-opts))))
  ([uuid-or-page-name content ^js opts]
   (p/let [current-page-or-today (<get-current-page-or-today)
           uuid-or-page-name (or uuid-or-page-name current-page-or-today)
           _ (<ensure-page-loaded uuid-or-page-name)
             page? (not (util/uuid-string? uuid-or-page-name))
             page-result (db-async/<get-block-with-children (state/get-current-repo)
                                                            uuid-or-page-name
                                                            {:children? true})
             page (:block page-result)
             page-not-exist? (and page? (nil? page))
             new-page (when page-not-exist?
                        (page-handler/<create! uuid-or-page-name
                                               {:redirect? false
                                                :format (state/get-preferred-format)}))
             block (or page new-page)]
       (let [children (:children page-result)
             [target sibling?] (if (seq children)
                                 [(last (ldb/sort-by-order children)) true]
                                 [block false])
             target-id (str (:block/uuid target))
             opts (-> (bean/->clj opts)
                      (assoc :sibling sibling?))]
         (insert_block target-id content (bean/->js opts))))))

(defn download_graph_db
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-sqlite-db! repo)))

(defn download_graph_pages
  []
  (when-let [repo (state/get-current-repo)]
    (export-handler/export-repo-as-zip! repo)))

;; block properties
(defn upsert_block_property
  [id key ^js value ^js options]
  (this-as this
           (p/let [key' (api-block/sanitize-user-property-name key)
                   opts (bean/->clj options)
                   block (<get-block id {:children? false})
                   value (bean/->clj value)
                   opts (cond-> opts
                          (boolean? (:reset opts))
                          (assoc :reset-property-values (:reset opts)))]
             (when block
               (db-based-api/upsert-block-property this block key' value opts)))))

(defn remove_block_property
  [id key]
  (this-as this
           (p/let [block (<get-block id {:children? false})]
             (when-let [block-uuid (:block/uuid block)]
               (let [key (api-block/sanitize-user-property-name key)
                     key (api-block/get-db-ident-from-property-name key this)]
                 (property-handler/remove-block-property! block-uuid key))))))

(defn- get-block-classes-properties-has-default-value
  [block-id]
  (db-async/<get-block-class-default-properties (state/get-current-repo) block-id))

(defn- get-all-block-properties
  [id]
  (p/let [block (<get-block id {:children? false})]
    (when-let [own-properties (:block/properties block)]
      (p/let [classes-properties (get-block-classes-properties-has-default-value (:db/id block))]
        (let [classes-properties (or classes-properties {})
              properties (if (seq classes-properties)
                           (merge classes-properties own-properties)
                           own-properties)]
          properties)))))

(defn get_block_property
  [id key]
  (this-as this
    (p/let [properties (get-all-block-properties id)]
      (when (seq properties)
        (let [property-name (api-block/sanitize-user-property-name key)
              ident (api-block/get-db-ident-from-property-name property-name this)
              property-value (or (get properties property-name)
                                 (get properties (keyword property-name))
                                 (get properties ident))
              property-value (cond-> property-value
                                     (map? property-value)
                                     (assoc
                                       :block/value (or (:logseq.property/value property-value)
                                                        (:block/title property-value))
                                       :db/ident ident))]
          (if (map? property-value)
            (sdk-utils/result->js property-value)
            (p/let [parsed-value (api-block/parse-property-json-value-if-need ident property-value)]
              (or parsed-value
                  (sdk-utils/result->js property-value)))))))))

(def get_block_properties
  (fn [id]
    (p/let [properties (get-all-block-properties id)]
      (when-let [properties (some-> properties (api-block/into-readable-db-properties))]
        (sdk-utils/result->js properties)))))

(defn get_page_properties
  [id-or-page-name]
  (p/let [page (<get-block id-or-page-name {:children? false})]
    (when-let [id (:block/uuid page)]
      (get_block_properties id))))

(defn open_pdf_viewer
  [block-identity-or-file-url]
  (p/let [[block href] (if (and (string? block-identity-or-file-url)
                                (or (path/protocol-url? block-identity-or-file-url)
                                    (path/absolute? block-identity-or-file-url)))
                         [nil block-identity-or-file-url]
                         (p/let [block (<get-block block-identity-or-file-url {:children? false})]
                           [block (if block
                                    (util/format "../assets/%s.pdf" (:block/uuid block))
                                    block-identity-or-file-url)]))
          href' (assets-handler/<make-asset-url href)]
    (when-let [current (pdf-assets/inflate-asset href {:block block :href href'})]
      (state/set-current-pdf! current))))
