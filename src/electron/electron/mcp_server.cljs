(ns electron.mcp-server
  "MCP server routes for the desktop API server."
  (:require ["@modelcontextprotocol/sdk/server/mcp.js" :refer [McpServer]]
            ["@modelcontextprotocol/sdk/server/streamableHttp.js" :refer [StreamableHTTPServerTransport]]
            ["@modelcontextprotocol/sdk/types.js" :refer [isInitializeRequest]]
            ["zod/v3" :as z] ;; zod 4 doesn't work w/ mcp - https://github.com/modelcontextprotocol/typescript-sdk/issues/925
            [electron.mcp-compat :as mcp-compat]
            [promesa.core :as p]))

;; Server util fns
;; ===============
;; "Stores transports by session ID"
(defonce ^:private transports
  (atom {}))

(declare create-mcp-api-server)

;; See https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http
;; for how to respond to different MCP requests
(defn handle-post-request [api-fn {:keys [port host]} req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "POST /mcp request" session-id (pr-str (.-body req)))
    (cond
      (and session-id (@transports session-id))
      (let [^js transport (@transports session-id)]
        (.handleRequest transport (.-raw req) (.-raw res) (.-body req)))

      (and (not session-id)
           (isInitializeRequest (.-body req)))
      (let [transport (StreamableHTTPServerTransport.
                       #js {:sessionIdGenerator (comp str random-uuid)
                            :enableDnsRebindingProtection true
                            :allowedHosts #js [(str host ":" port)]})
            mcp-server (create-mcp-api-server api-fn)]
        (set! (.-onclose transport)
              (fn []
                (js/console.log "Transport closed" (.-sessionId transport))
                (swap! transports dissoc (.-sessionId transport))))
        (.connect mcp-server transport)
        (.handleRequest transport (.-raw req) (.-raw res) (.-body req))
        (js/console.log "Initialize sessionId" (.-sessionId transport))
        (if (.-sessionId transport)
          (swap! transports assoc (.-sessionId transport) transport)
          (js/console.error "No sessionId to initialize!"))
        res)

      :else
      (do
        (.code res 400)
        (.send res #js {:jsonrpc "2.0"
                        :error #js {:code -32000
                                    :message "Bad Request: No valid session ID provided"}
                        :id nil})))))

(defn handle-get-request
  [req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "GET /mcp" session-id)
    (if-let [transport (and session-id (@transports session-id))]
      (.handleRequest ^js transport (.-raw req) (.-raw res))
      (-> res (.code 400) (.send "Invalid or missing session ID")))))

(defn handle-delete-request
  [req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "DELETE /mcp" session-id)
    (if-let [transport (and session-id (@transports session-id))]
      (do
        (.close transport)
        (-> res (.code 200) (.send #js {:ok true})))
      (-> res (.code 400) (.send "Invalid or missing session ID")))))

(defn mcp-error-response [msg]
  #js {:content
       #js [#js {:type "text"
                 :text msg}]})

(defn mcp-success-response [data]
  (clj->js {:content
            [{:type "text"
              :text (js/JSON.stringify (clj->js data))}]}))

;; API tool fns
;; ============
(defn- unexpected-api-error [error]
  #js {:content
       #js [#js {:type "text"
                 :text (str "Unexpected API error: " (.-message error))}]})

(defn- api-tool
  "Calls API method w/ args and returns a MCP response"
  [api-fn api-method method-args]
  (-> (p/let [body (api-fn api-method method-args)]
        (if-let [error (and body (aget body "error"))]
          (mcp-error-response (str "API Error: " error))
          (mcp-success-response body)))
      (p/catch unexpected-api-error)))

(defn- api-data-tool
  [api-fn data-fn args]
  (-> (p/let [body (data-fn api-fn args)]
        (if-let [error (and body (aget body "error"))]
          (mcp-error-response (str "API Error: " error))
          (mcp-success-response body)))
      (p/catch unexpected-api-error)))

(def ^:large-vars/data-var api-tools
  "MCP Tools when calling API server"
  {:listPages
            :entityType :block
            :data {:page-id \"temp-Inbox\"
                   :title \"t1\"
                   :tags [\"00000002-1282-1814-5700-000000000000\"]}}]}

         Additional advice for building operations:
         * Before creating any page, tag or property, check that it exists with getPage"
         :inputSchema
         #js {:operations
              (z/array
               (z/object
                #js {:operation   (z/enum #js ["add" "edit"])
                     :entityType  (z/enum #js ["block" "page" "tag" "property"])
                     :id          (.optional (z/union #js [(z/string) (z/number) (z/null)]))
                     :data        (-> (z/object #js {}) (.passthrough))}))
              :dry-run (-> (z/boolean) .optional (.describe "Pretend to do batch update. Does everything except actually commit change to db e.g. validation."))}}}
   :searchBlocks
  {:fn mcp-compat/search-blocks
    :config #js {:title "Search Blocks"
                 :description "Search graph for blocks containing search term"
                 :inputSchema #js {:searchTerm (z/string)}}}
   :listTags
  {:fn mcp-compat/list-tags
    :config #js {:title "List Tags"
                 :description "List all tags in a graph"
                 :inputSchema
                 #js {:expand (-> (z/boolean) .optional (.describe "Provide additional detail on each tag e.g. their parents (extends) and tag properties"))}}}
   :listProperties
   {:fn mcp-compat/list-properties
    :config #js {:title "List Properties"
                 :description "List all properties in a graph"
                 :inputSchema
                 #js {:expand (-> (z/boolean) .optional (.describe "Provide additional detail on each property e.g. property type, cardinality"))}}}})

(def ^:large-vars/data-var data-tools
  {:getPageUUID
   {:fn mcp-compat/get-page-uuid
    :config #js {:title "Get Page UUID"
                 :description "Resolve a unique live page title to its UUID."
                 :inputSchema #js {:title (z/string)}}}
        :capabilities
        {:fn mcp-compat/capabilities
         :config #js {:title "Capabilities"
                  :description "Report which registered MCP tools are available on the current DB graph, with optional probe diagnostics."
                  :inputSchema #js {:include_diagnostics (-> (z/boolean) .optional)}}}
  :pageStats
  {:fn mcp-compat/page-stats
   :config #js {:title "Page Stats"
            :description "Return fixed-size counts for page blocks, nested pages, orphans, inbound references, property values, and alias relations."
            :inputSchema #js {:page_uuid (z/string)}}}
  :inspectPage
  {:fn mcp-compat/inspect-page
   :config #js {:title "Inspect Page"
            :description "Read a page and select its blocks, tags, property values, or declared properties."
            :inputSchema #js {:page_uuid (z/string)
                        :detail (-> (z/enum #js ["page" "blocks" "tags" "properties" "declared" "all"]) .optional)}}}
   :getTagUUID
   {:fn mcp-compat/get-tag-uuid
    :config #js {:title "Get Tag UUID"
                 :description "Resolve a tag title to exactly one UUID."
                 :inputSchema #js {:title (z/string)}}}
   :getTag
   {:fn mcp-compat/get-tag
    :config #js {:title "Get Tag"
                 :description "Read one exact tag entity by UUID."
                 :inputSchema #js {:tag_uuid (z/string)}}}
   :getPropertyIndent
   {:fn mcp-compat/get-property-ident
    :config #js {:title "Get Property Ident"
                 :description "Resolve a property title to exactly one DB ident."
                 :inputSchema #js {:title (z/string)}}}
  :getProperyUsers
  {:fn mcp-compat/get-property-users
   :config #js {:title "Get Property Users"
            :description "List every page and block holding a value for this exact property ident, with literals and resolved reference values."
            :inputSchema #js {:property_ident (z/string)}}}
  :createProperty
  {:fn mcp-compat/create-property
   :config #js {:title "Create Property"
            :description "Create a property definition, verify its assigned ident and stored type, and return that ident for later operations."
            :inputSchema #js {:title (z/string)
                        :schema (-> (z/object #js {}) .passthrough)
                        :options (-> (z/object #js {}) .passthrough .optional)
                        :verbose (-> (z/boolean) .optional)}}}
  :deleteProperty
  {:fn mcp-compat/delete-property
   :config #js {:title "Delete Property"
            :description "Delete a property definition and its values. Requires explicit acknowledgement when values exist; this cannot be undone."
            :inputSchema #js {:property_ident (z/string)
                        :acknowledge_value_loss (-> (z/boolean) .optional)
                        :verbose (-> (z/boolean) .optional)}}}
   :getBlock
   {:fn mcp-compat/get-block
    :config #js {:title "Get Block"
                 :description "Read one exact non-page block by UUID."
                 :inputSchema #js {:block_uuid (z/string)}}}
   :getTagUsers
   {:fn mcp-compat/get-tag-users
    :config #js {:title "Get Tag Users"
                 :description "List pages and blocks carrying a tag UUID."
                 :inputSchema #js {:tag_uuid (z/string)}}}
   :getBlockUUID
   {:fn mcp-compat/get-block-uuids
    :config #js {:title "Get Block UUIDs"
                 :description "List all descendant block UUIDs on a page."
                 :inputSchema #js {:page_uuid (z/string)}}}
   :getBlockTree
   {:fn mcp-compat/get-block-tree
    :config #js {:title "Get Block Tree"
                 :description "Read one block subtree with depth and node bounds."
                 :inputSchema #js {:block_uuid (z/string)
                                   :max_depth (-> (z/number) .optional)
                                   :max_nodes (-> (z/number) .optional)}}}
   :findBacklinks
   {:fn mcp-compat/find-backlinks
    :config #js {:title "Find Backlinks"
                 :description "List references, tag holders, and property values pointing to a UUID."
                 :inputSchema #js {:target_uuid (z/string)}}}
   :findOrphans
   {:fn mcp-compat/find-orphans
    :config #js {:title "Find Orphans"
                 :description "Report block page/parent mismatches without repairing them."
                 :inputSchema #js {:page_uuid (z/string)}}}
   :isTitleAvailable
   {:fn mcp-compat/is-title-available
    :config #js {:title "Is Title Available"
                 :description "Check whether a title is held by any graph entity."
                 :inputSchema #js {:title (z/string)}}}
  :findDuplicateTitles
  {:fn mcp-compat/find-duplicate-titles
   :config #js {:title "Find Duplicate Titles"
                :description "Report and rank similar page/tag titles with content, block-reference, recycled, and alias evidence. This tool never changes data."
                :inputSchema #js {:normalize (-> (z/enum #js ["exact" "loose" "fuzzy"]) .optional)
                                  :include_recycled (-> (z/boolean) .optional)}}}
   :listRecycled
   {:fn mcp-compat/list-recycled
    :config #js {:title "List Recycled"
                 :description "List recycled pages and their retained deleted-at data."
                 :inputSchema #js {}}}
   :listStatus
   {:fn mcp-compat/list-status
    :config #js {:title "List Status"
                 :description "List entities with their Status values."
                 :inputSchema #js {}}}
   :listClosedValues
   {:fn mcp-compat/list-closed-values
    :config #js {:title "List Closed Values"
                 :description "List permitted values for closed properties."
                 :inputSchema #js {}}}
   :listOrphanTags
   {:fn mcp-compat/list-orphan-tags
    :config #js {:title "List Orphan Tags"
                 :description "List tags that no page or block uses."
                 :inputSchema #js {}}}
   :listOrphanProperties
   {:fn mcp-compat/list-orphan-properties
    :config #js {:title "List Orphan Properties"
                 :description "List properties with no values anywhere."
                 :inputSchema #js {}}}
   :listAssets
   {:fn mcp-compat/list-assets
    :config #js {:title "List Assets"
                 :description "Discover attributes whose names contain 'asset'. This is an unverified probe, not a complete asset inventory."
                 :inputSchema #js {}}}})

(defn call-api-tool [tool-fn api-fn args]
  (tool-fn (partial api-tool api-fn) args))

;; Server fns
;; ==========
(defn create-mcp-server []
  (McpServer. #js {:name "Logseq MCP Server"
                   :version "0.1.0"}))

(defn create-mcp-api-server [api-fn]
  (let [mcp-server (create-mcp-server)]
    (doseq [[k v] api-tools]
      (.registerTool mcp-server
                     (name k)
                     (:config v)
                     (partial call-api-tool (:fn v) api-fn)))
    (doseq [[k v] data-tools]
      (.registerTool mcp-server
                     (name k)
                     (:config v)
                     (partial api-data-tool api-fn (:fn v))))
    mcp-server))
