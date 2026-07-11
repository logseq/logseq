(ns logseq.db-sync.worker.routes.semantic
  (:require [clojure.string :as string]
            [reitit.core :as r]))

(def operations
  [{:method "GET" :path "/api/v1/graphs/:graph-id/pages" :internal-path "/semantic/pages"
    :handler :semantic/pages-list :operation-id "listPages" :scope "logseq:read" :rate-class :read}
   {:method "POST" :path "/api/v1/graphs/:graph-id/pages" :internal-path "/semantic/pages"
    :handler :semantic/pages-create :operation-id "createPage" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/pages/:page-id/blocks" :internal-path "/semantic/pages/:page-id/blocks"
    :handler :semantic/pages-blocks :operation-id "listPageBlocks" :scope "logseq:read" :rate-class :read}
   {:method "DELETE" :path "/api/v1/graphs/:graph-id/pages/:page-id" :internal-path "/semantic/pages/:page-id"
    :handler :semantic/pages-delete :operation-id "deletePage" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/pages/:page-id" :internal-path "/semantic/pages/:page-id"
    :handler :semantic/pages-get :operation-id "getPage" :scope "logseq:read" :rate-class :read}
   {:method "PATCH" :path "/api/v1/graphs/:graph-id/pages/:page-id" :internal-path "/semantic/pages/:page-id"
    :handler :semantic/pages-update :operation-id "updatePage" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/blocks/:block-id" :internal-path "/semantic/blocks/:block-id"
    :handler :semantic/blocks-get :operation-id "getBlock" :scope "logseq:read" :rate-class :read}
   {:method "PATCH" :path "/api/v1/graphs/:graph-id/blocks/:block-id" :internal-path "/semantic/blocks/:block-id"
    :handler :semantic/blocks-update :operation-id "updateBlock" :scope "logseq:write" :rate-class :write}
   {:method "DELETE" :path "/api/v1/graphs/:graph-id/blocks/:block-id" :internal-path "/semantic/blocks/:block-id"
    :handler :semantic/blocks-delete :operation-id "deleteBlock" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/blocks/:block-id/move" :internal-path "/semantic/blocks/:block-id/move"
    :handler :semantic/blocks-move :operation-id "moveBlock" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/blocks/:block-id/children" :internal-path "/semantic/blocks/:block-id/children"
    :handler :semantic/blocks-insert-children :operation-id "insertBlockChildren" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/block-trees" :internal-path "/semantic/block-trees"
    :handler :semantic/blocks-insert-tree :operation-id "insertBlockTree" :scope "logseq:write" :rate-class :write}
   {:method "PUT" :path "/api/v1/graphs/:graph-id/blocks/:block-id/properties/:property-id" :internal-path "/semantic/blocks/:block-id/properties/:property-id"
    :handler :semantic/blocks-set-property :operation-id "setBlockProperty" :scope "logseq:write" :rate-class :write}
   {:method "DELETE" :path "/api/v1/graphs/:graph-id/blocks/:block-id/properties/:property-id" :internal-path "/semantic/blocks/:block-id/properties/:property-id"
    :handler :semantic/blocks-delete-property :operation-id "deleteBlockProperty" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/block-properties/batch-set" :internal-path "/semantic/block-properties/batch-set"
    :handler :semantic/blocks-batch-set-property :operation-id "batchSetBlockProperty" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/block-properties/batch-delete" :internal-path "/semantic/block-properties/batch-delete"
    :handler :semantic/blocks-batch-delete-property :operation-id "batchDeleteBlockProperty" :scope "logseq:write" :rate-class :write}
   {:method "POST" :path "/api/v1/graphs/:graph-id/capture" :internal-path "/semantic/capture"
    :handler :semantic/capture :operation-id "captureToToday" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/tags" :internal-path "/semantic/tags"
    :handler :semantic/tags-list :operation-id "listTags" :scope "logseq:read" :rate-class :read}
   {:method "POST" :path "/api/v1/graphs/:graph-id/tags" :internal-path "/semantic/tags"
    :handler :semantic/tags-create :operation-id "createTag" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/tags/:tag-id" :internal-path "/semantic/tags/:tag-id"
    :handler :semantic/tags-get :operation-id "getTag" :scope "logseq:read" :rate-class :read}
   {:method "PATCH" :path "/api/v1/graphs/:graph-id/tags/:tag-id" :internal-path "/semantic/tags/:tag-id"
    :handler :semantic/tags-update :operation-id "updateTag" :scope "logseq:write" :rate-class :write}
   {:method "DELETE" :path "/api/v1/graphs/:graph-id/tags/:tag-id" :internal-path "/semantic/tags/:tag-id"
    :handler :semantic/tags-delete :operation-id "deleteTag" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/properties" :internal-path "/semantic/properties"
    :handler :semantic/properties-list :operation-id "listProperties" :scope "logseq:read" :rate-class :read}
   {:method "POST" :path "/api/v1/graphs/:graph-id/properties" :internal-path "/semantic/properties"
    :handler :semantic/properties-create :operation-id "createProperty" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/properties/:property-id" :internal-path "/semantic/properties/:property-id"
    :handler :semantic/properties-get :operation-id "getProperty" :scope "logseq:read" :rate-class :read}
   {:method "PATCH" :path "/api/v1/graphs/:graph-id/properties/:property-id" :internal-path "/semantic/properties/:property-id"
    :handler :semantic/properties-update :operation-id "updateProperty" :scope "logseq:write" :rate-class :write}
   {:method "DELETE" :path "/api/v1/graphs/:graph-id/properties/:property-id" :internal-path "/semantic/properties/:property-id"
    :handler :semantic/properties-delete :operation-id "deleteProperty" :scope "logseq:write" :rate-class :write}
   {:method "GET" :path "/api/v1/graphs/:graph-id/assets/:asset-block-id" :internal-path "/semantic/assets/:asset-block-id"
    :handler :semantic/assets-get :operation-id "getAsset" :scope "logseq:read" :rate-class :read}
   {:method "GET" :path "/api/v1/graphs/:graph-id/search" :internal-path "/semantic/search"
    :handler :semantic/search :operation-id "searchGraph" :scope "logseq:read" :rate-class :read}])

(def ^:private operation-docs
  {"listPages" ["List pages" "Returns a cursor-paginated list of page blocks in the graph."]
   "createPage" ["Create a page" "Creates a page block with the supplied title."]
   "listPageBlocks" ["List a page's blocks" "Returns a cursor-paginated list of the page's top-level blocks, including each selected block's descendant tree."]
   "getPage" ["Get a page" "Returns one page block by UUID without loading its block tree."]
   "updatePage" ["Update a page" "Renames one page identified by its block UUID."]
   "deletePage" ["Delete a page" "Deletes one page through Logseq's page deletion rules, including its block tree."]
   "getBlock" ["Get a block" "Returns one block or page by UUID without loading an unbounded tree."]
   "updateBlock" ["Update a block" "Replaces the title of one block identified by UUID."]
   "deleteBlock" ["Delete a block" "Deletes one block and its descendants. Asset blocks are deleted through this same operation."]
   "moveBlock" ["Move a block" "Moves a block before, after, into the first-child position, or into the last-child position of a target block."]
   "insertBlockChildren" ["Insert child block trees" "Appends or prepends one or more recursive block trees as children of the addressed block."]
   "insertBlockTree" ["Insert block trees" "Inserts one or more recursive block trees relative to an explicit target block."]
   "setBlockProperty" ["Set a block property" "Idempotently adds or replaces one property value on one block. The property path value may be its UUID or ident."]
   "deleteBlockProperty" ["Delete a block property" "Idempotently removes one property from one block. The property definition itself is not deleted."]
   "batchSetBlockProperty" ["Set block properties in a batch" "Atomically adds or replaces multiple block-property values after validating every entry."]
   "batchDeleteBlockProperty" ["Delete block properties in a batch" "Atomically removes multiple block-property values after validating every entry."]
   "captureToToday" ["Capture to today's journal" "Creates today's journal page when necessary and appends the supplied recursive block trees to its end."]
   "listTags" ["List tags" "Returns a cursor-paginated list of tag entities in the graph."]
   "createTag" ["Create a tag" "Creates a Logseq tag with the supplied title."]
   "getTag" ["Get a tag" "Returns one tag by UUID."]
   "updateTag" ["Update a tag" "Renames one tag identified by UUID."]
   "deleteTag" ["Delete a tag" "Deletes one tag through Logseq's page deletion rules."]
   "listProperties" ["List property definitions" "Returns a cursor-paginated list of property definitions in the graph."]
   "createProperty" ["Create a property definition" "Creates a property definition with its name, value type, and cardinality."]
   "getProperty" ["Get a property definition" "Returns one property definition by UUID."]
   "updateProperty" ["Update a property definition" "Updates the name, value type, or cardinality of one property definition."]
   "deleteProperty" ["Delete a property definition" "Deletes one property definition through Logseq's property deletion rules."]
   "getAsset" ["Get an asset download link" "Returns asset metadata and a five-minute signed download URL for the asset block's R2 object."]
   "searchGraph" ["Search graph resources" "Searches blocks, tags, properties, and assets by title and returns cursor-paginated results."]})

(defn- operation-routes [path-key]
  (->> operations
       (group-by path-key)
       (mapv (fn [[path path-operations]]
               [path {:methods (into {} (map (juxt :method identity)) path-operations)}]))))

(def ^:private public-router
  (r/router (operation-routes :path)))

(def ^:private internal-router
  (r/router (operation-routes :internal-path)))

(defn- match [router method path]
  (when-let [route (r/match-by-path router path)]
    (when-let [operation (get-in route [:data :methods method])]
      (merge operation (select-keys route [:path-params])))))

(defn match-public [method path]
  (match public-router method path))

(defn match-internal [method path]
  (match internal-router method path))

(defn- openapi-path [path]
  (string/replace path #":([^/]+)" "{$1}"))

(defn- path-parameters [path]
  (mapv (fn [[_ parameter]]
          {:name parameter :in "path" :required true :schema {:type "string"}})
        (re-seq #":([^/]+)" path)))

(def ^:private pagination-parameters
  [{:name "limit" :in "query" :schema {:type "integer" :minimum 1 :maximum 200 :default 50}}
   {:name "cursor" :in "query" :schema {:type "string"}}])

(defn- request-schema [operation-id]
  (case operation-id
    "createPage" {:required ["title"] :properties {:title {:type "string"}}}
    "updatePage" {:required ["title"] :properties {:title {:type "string"}}}
    "updateBlock" {:required ["title"] :properties {:title {:type "string"}}}
    "moveBlock" {:required ["target-id" "position"]
                 :properties {:target-id {:type "string"}
                              :position {:enum ["before" "after" "first-child" "last-child"]}}}
    "insertBlockChildren" {:required ["position" "blocks"]
                           :properties {:position {:enum ["append" "prepend"]}
                                        :blocks {:type "array" :items {:$ref "#/components/schemas/BlockTree"}}}}
    "insertBlockTree" {:required ["target-id" "blocks"]
                       :properties {:target-id {:type "string"}
                                    :position {:enum ["append" "prepend"] :default "append"}
                                    :blocks {:type "array" :items {:$ref "#/components/schemas/BlockTree"}}}}
    "setBlockProperty" {:required ["value"] :properties {:value {}}}
    "batchSetBlockProperty" {:required ["entries"]
                             :properties {:entries {:type "array"
                                                    :items {:type "object" :required ["block-id" "property-id" "value"]
                                                            :properties {:block-id {:type "string"}
                                                                         :property-id {:type "string"}
                                                                         :value {}}}}}}
    "batchDeleteBlockProperty" {:required ["entries"]
                                :properties {:entries {:type "array"
                                                       :items {:type "object" :required ["block-id" "property-id"]
                                                               :properties {:block-id {:type "string"}
                                                                            :property-id {:type "string"}}}}}}
    "captureToToday" {:required ["blocks"]
                      :properties {:blocks {:type "array" :items {:$ref "#/components/schemas/BlockTree"}}}}
    "createTag" {:required ["title"] :properties {:title {:type "string"}}}
    "updateTag" {:required ["title"] :properties {:title {:type "string"}}}
    "createProperty" {:required ["title"]
                      :properties {:title {:type "string"} :type {:type "string"}
                                   :cardinality {:enum ["db.cardinality/one" "db.cardinality/many"]}}}
    "updateProperty" {:properties {:title {:type "string"} :type {:type "string"}
                                    :cardinality {:enum ["db.cardinality/one" "db.cardinality/many"]}}}
    nil))

(defn- operation-parameters [{:keys [operation-id path]}]
  (cond-> (path-parameters path)
    (contains? #{"listPages" "listPageBlocks" "listTags" "listProperties" "searchGraph"} operation-id)
    (into pagination-parameters)
    (= "searchGraph" operation-id)
    (into [{:name "q" :in "query" :required true :schema {:type "string"}}
           {:name "types" :in "query" :schema {:type "string"}}])))

(defn openapi-document [issuer]
  {:openapi "3.1.0"
   :info {:title "Logseq Semantic API" :version "1.0.0"}
   :servers [{:url "/"}]
   :components
   {:schemas {:BlockTree {:type "object" :required ["title"]
                          :properties {:title {:type "string"}
                                       :children {:type "array" :items {:$ref "#/components/schemas/BlockTree"}}}}}
    :securitySchemes
    {:oauth {:type "oauth2"
             :flows {:authorizationCode
                     {:authorizationUrl (str issuer "/oauth2/authorize")
                      :tokenUrl (str issuer "/oauth2/token")
                      :scopes {:logseq:read "Read pages and blocks"
                               :logseq:write "Create and edit pages and blocks"}}}}}}
   :paths
   (reduce (fn [paths {:keys [method path operation-id scope] :as operation}]
             (let [[summary description] (get operation-docs operation-id)]
               (assoc-in paths [(openapi-path path) (keyword (.toLowerCase method))]
                       (cond-> {:operationId operation-id
                                :summary summary
                                :description description
                                :parameters (operation-parameters operation)
                                :security [{:oauth [scope]}]
                                :responses {"200" {:description "Success"}
                                            "400" {:description "Invalid request"}
                                            "403" {:description "Forbidden"}
                                            "409" {:description "Unavailable for E2EE graphs"}
                                            "429" {:description "Rate limit exceeded"}}}
                         (request-schema operation-id)
                         (assoc :requestBody {:required true
                                              :content {"application/json"
                                                        {:schema (assoc (request-schema operation-id) :type "object")}}})))))
           {}
           operations)})
