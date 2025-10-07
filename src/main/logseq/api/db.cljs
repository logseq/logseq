(ns logseq.api.db
  "DB version related fns"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn result->js
  [result]
  (-> result
      sdk-utils/normalize-keyword-for-json
      bean/->js))

(defn get-favorites
  []
  (p/let [favorites (page-handler/get-favorites)]
    (result->js favorites)))

(defn insert-batch-blocks
  [this target blocks opts]
  (let [blocks' (walk/prewalk
                 (fn [f]
                   (if (and (map? f) (:content f) (nil? (:uuid f)))
                     (assoc f :uuid (d/squuid))
                     f))
                 blocks)
        {:keys [sibling before schema]} opts
        block (if before
                (db/pull (:db/id (ldb/get-left-sibling (db/entity (:db/id target))))) target)
        sibling? (if (ldb/page? block) false sibling)
        uuid->properties (let [blocks (outliner-core/tree-vec-flatten blocks' :children)]
                           (when (some (fn [b] (seq (:properties b))) blocks)
                             (zipmap (map :uuid blocks)
                                     (map :properties blocks))))]
    (p/let [result (editor-handler/insert-block-tree-after-target
                    (:db/id block) sibling? blocks' (get block :block/format :markdown) true)
            blocks (:blocks result)]
      (when (seq blocks)
        (p/doseq [block blocks]
          (let [id (:block/uuid block)
                b (db/entity [:block/uuid id])
                properties (when uuid->properties (uuid->properties id))]
            (when (seq properties)
              (api-block/db-based-save-block-properties! b properties {:plugin this
                                                                       :schema schema})))))
      (let [blocks' (map (fn [b] (db/entity [:block/uuid (:block/uuid b)])) blocks)]
        (result->js blocks')))))

(defn insert-block
  [this content properties schema opts]
  (p/let [new-block (editor-handler/api-insert-new-block! content opts)]
    (when (seq properties)
      (api-block/db-based-save-block-properties! new-block properties {:plugin this
                                                                       :schema schema}))
    (let [block (db/entity [:block/uuid (:block/uuid new-block)])]
      (result->js block))))

(defn update-block
  [this block content opts]
  (when block
    (let [repo (state/get-current-repo)
          block-uuid (:block/uuid block)]
      (p/do!
       (when (seq (:properties opts))
         (api-block/db-based-save-block-properties! block (:properties opts)
                                                    {:plugin this
                                                     :schema (:schema opts)}))
       (editor-handler/save-block! repo
                                   (sdk-utils/uuid-or-throw-error block-uuid) content
                                   (dissoc opts :properties))))))

(defn remove-property
  [property]
  (when-let [uuid (and (api-block/plugin-property-key? (:db/ident property))
                       (:block/uuid property))]
    (page-common-handler/<delete! uuid nil nil)))

(defn upsert-block-property
  [this block key' value schema]
  (let [opts {:plugin this
              :schema (when schema
                        {key schema})}]
    (api-block/db-based-save-block-properties! block {key' value} opts)))

(defn get-all-tags
  []
  (-> (db-model/get-all-classes (state/get-current-repo)
                                {:except-root-class? true})
      result->js))

(defn get-all-properties
  []
  (-> (ldb/get-all-properties (db/get-db))
      result->js))

(defn get-tag-objects
  [class-uuid]
  (let [id (sdk-utils/uuid-or-throw-error class-uuid)
        class (db/entity [:block/uuid id])]
    (if-not class
      (throw (ex-info (str "Tag not exists with id: " class-uuid) {}))
      (p/let [result (state/<invoke-db-worker :thread-api/get-class-objects
                                              (state/get-current-repo)
                                              (:db/id class))]
        (result->js result)))))
