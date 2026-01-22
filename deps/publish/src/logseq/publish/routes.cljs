(ns logseq.publish.routes
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.publish.assets :as publish-assets]
            [logseq.publish.common :as publish-common]
            [logseq.publish.index :as publish-index]
            [logseq.publish.model :as publish-model]
            [logseq.publish.render :as publish-render]
            [shadow.resource :as resource])
  (:require-macros [logseq.publish.async :refer [js-await]]))

(def publish-css (resource/inline "logseq/publish/publish.css"))
(def publish-js (resource/inline "logseq/publish/publish.js"))
(def tabler-ext-js (resource/inline "js/tabler.ext.js"))
;; Should this be used?
;; (def tabler-extension-css (resource/inline "css/tabler-extension.css"))

(defn- request-password
  [request]
  (let [url (js/URL. (.-url request))
        query (.get (.-searchParams url) "password")
        header (.get (.-headers request) "x-publish-password")]
    (or header query)))

(defn- fetch-page-password-hash
  [graph-uuid page-uuid env]
  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
             do-id (.idFromName do-ns "index")
             do-stub (.get do-ns do-id)
             resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/password")
                          #js {:method "GET"})]
            (when (.-ok resp)
              (js-await [data (.json resp)]
                        (aget data "password_hash")))))

(defn- check-page-password
  [request graph-uuid page-uuid env]
  (js-await [stored-hash (fetch-page-password-hash graph-uuid page-uuid env)]
            (if (string/blank? stored-hash)
              {:allowed? true :provided? false}
              (let [provided (request-password request)]
                (if (string? provided)
                  (js-await [valid? (publish-common/verify-password provided stored-hash)]
                            {:allowed? valid? :provided? true})
                  {:allowed? false :provided? false})))))

(defn- auth-claims
  [request env]
  (js-await [auth-header (.get (.-headers request) "authorization")
             token (when (and auth-header (string/starts-with? auth-header "Bearer "))
                     (subs auth-header 7))
             claims (cond
                      (nil? token) nil
                      :else (publish-common/verify-jwt token env))]
            {:claims claims}))

(defn handle-post-pages [request env]
  (js-await [auth-header (.get (.-headers request) "authorization")
             token (when (and auth-header (string/starts-with? auth-header "Bearer "))
                     (subs auth-header 7))
             claims (cond
                      (nil? token) nil
                      :else (publish-common/verify-jwt token env))]
            (if (nil? claims)
              (publish-common/unauthorized)
              (js-await [body (.arrayBuffer request)]
                        (let [{:keys [content_hash content_length graph page_uuid schema_version block_count created_at] :as meta}
                              (or (publish-common/parse-meta-header request)
                                  (publish-common/meta-from-body body))
                              payload (publish-common/read-transit-safe (.decode publish-common/text-decoder body))
                              payload-entities (publish-model/datoms->entities (:datoms payload))
                              page-eid (some (fn [[e entity]]
                                               (when (= (:block/uuid entity) (uuid page_uuid))
                                                 e))
                                             payload-entities)
                              page-title (or (:page-title payload)
                                             (get payload "page-title")
                                             (when page-eid
                                               (publish-model/entity->title (get payload-entities page-eid))))
                              blocks (or (:blocks payload)
                                         (get payload "blocks"))
                              page-password (or (:page-password payload)
                                                (get payload "page-password"))
                              refs (when (and page-eid page-title)
                                     (publish-index/page-refs-from-payload payload page-eid page_uuid page-title graph))
                              tagged-nodes (when (and page-eid page-title)
                                             (publish-index/page-tagged-nodes-from-payload payload page-eid page_uuid page-title graph))]
                          (cond
                            (not (publish-common/valid-meta? meta))
                            (publish-common/bad-request "missing publish metadata")

                            :else
                            (js-await [graph-uuid graph
                                       r2-key (str "publish/" graph-uuid "/"
                                                   content_hash ".transit")
                                       r2 (aget env "PUBLISH_R2")
                                       existing (.head r2 r2-key)
                                       _ (when-not existing
                                           (.put r2 r2-key body
                                                 #js {:httpMetadata #js {:contentType "application/transit+json"}}))
                                       ^js do-ns (aget env "PUBLISH_META_DO")
                                       do-id (.idFromName do-ns
                                                          (str graph-uuid
                                                               ":"
                                                               page_uuid))
                                       do-stub (.get do-ns do-id)
                                       page-tags (or (:page-tags payload)
                                                     (get payload "page-tags"))
                                       short-id (publish-common/short-id-for-page graph-uuid page_uuid)
                                       owner-sub (:owner_sub meta)
                                       owner-username (:owner_username meta)
                                       updated-at (.now js/Date)
                                       _ (when-not (and owner-sub owner-username)
                                           (throw (ex-info "owner sub or username is missing"
                                                           {:owner-sub owner-sub
                                                            :owner-username owner-username})))
                                       password-hash (when (and (string? page-password)
                                                                (not (string/blank? page-password)))
                                                       (publish-common/hash-password page-password))
                                       payload (bean/->js
                                                {:page_uuid page_uuid
                                                 :page_title page-title
                                                 :page_tags (when page-tags
                                                              (js/JSON.stringify (clj->js page-tags)))
                                                 :password_hash password-hash
                                                 :graph graph-uuid
                                                 :schema_version schema_version
                                                 :block_count block_count
                                                 :content_hash content_hash
                                                 :content_length content_length
                                                 :r2_key r2-key
                                                 :owner_sub owner-sub
                                                 :owner_username owner-username
                                                 :created_at created_at
                                                 :updated_at updated-at
                                                 :short_id short-id
                                                 :refs refs
                                                 :tagged_nodes tagged-nodes
                                                 :blocks (when (seq blocks)
                                                           (map (fn [block]
                                                                  (assoc block :updated_at updated-at))
                                                                blocks))})
                                       meta-resp (.fetch do-stub "https://publish/pages"
                                                         #js {:method "POST"
                                                              :headers #js {"content-type" "application/json"}
                                                              :body (js/JSON.stringify payload)})]
                                      (if-not (.-ok meta-resp)
                                        (publish-common/json-response {:error "metadata store failed"} 500)
                                        (js-await [index-id (.idFromName do-ns "index")
                                                   index-stub (.get do-ns index-id)
                                                   _ (.fetch index-stub "https://publish/pages"
                                                             #js {:method "POST"
                                                                  :headers #js {"content-type" "application/json"}
                                                                  :body (js/JSON.stringify payload)})]
                                                  (publish-common/json-response {:page_uuid page_uuid
                                                                                 :graph_uuid graph-uuid
                                                                                 :r2_key r2-key
                                                                                 :short_id short-id
                                                                                 :short_url (str "/p/" short-id)
                                                                                 :updated_at (.now js/Date)}))))))))))

(defn handle-tag-page-html [graph-uuid tag-uuid env]
  (if (or (nil? graph-uuid) (nil? tag-uuid))
    (publish-common/bad-request "missing graph uuid or tag uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               tags-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" tag-uuid "/tagged_nodes")
                                 #js {:method "GET"})]
              (if-not (.-ok tags-resp)
                (publish-common/not-found)
                (js-await [raw (.json tags-resp)
                           tag-items (js->clj (or (aget raw "tagged_nodes") #js [])
                                              :keywordize-keys true)
                           tag-title (or (some (fn [item]
                                                 (let [title (publish-render/tag-item-val item :tag_title)]
                                                   (when (and title (not (string/blank? title)))
                                                     title)))
                                               tag-items)
                                         tag-uuid)]
                          (js/Response.
                           (publish-render/render-tag-html graph-uuid tag-uuid tag-title tag-items)
                           #js {:headers (publish-common/merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (publish-common/cors-headers))}))))))

(defn handle-get-page [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (handle-tag-page-html graph-uuid page-uuid env)
                  (js-await [{:keys [allowed?]} (check-page-password request graph-uuid page-uuid env)]
                            (if-not allowed?
                              (publish-common/json-response {:error "password required"} 401)
                              (js-await [meta (.json meta-resp)
                                         etag (aget meta "content_hash")
                                         if-none-match (publish-common/normalize-etag (.get (.-headers request) "if-none-match"))]
                                        (if (and etag if-none-match (= etag if-none-match))
                                          (js/Response. nil #js {:status 304
                                                                 :headers (publish-common/merge-headers
                                                                           #js {:etag etag}
                                                                           (publish-common/cors-headers))})
                                          (publish-common/json-response (js->clj meta :keywordize-keys true) 200))))))))))

(defn handle-get-page-transit [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (js/Response.
                   (publish-render/render-404-html)
                   #js {:headers (publish-common/merge-headers
                                  #js {"content-type" "text/html; charset=utf-8"}
                                  (publish-common/cors-headers))})
                  (js-await [{:keys [allowed?]} (check-page-password request graph-uuid page-uuid env)]
                            (if-not allowed?
                              (publish-common/json-response {:error "password required"} 401)
                              (js-await [meta (.json meta-resp)
                                         r2-key (aget meta "r2_key")]
                                        (if-not r2-key
                                          (publish-common/json-response {:error "missing transit"} 404)
                                          (js-await [etag (aget meta "content_hash")
                                                     if-none-match (publish-common/normalize-etag (.get (.-headers request) "if-none-match"))
                                                     signed-url (when-not (and etag if-none-match (= etag if-none-match))
                                                                  (publish-common/presign-r2-url r2-key env))]
                                                    (if (and etag if-none-match (= etag if-none-match))
                                                      (js/Response. nil #js {:status 304
                                                                             :headers (publish-common/merge-headers
                                                                                       #js {:etag etag}
                                                                                       (publish-common/cors-headers))})
                                                      (publish-common/json-response {:url signed-url
                                                                                     :expires_in 300
                                                                                     :etag etag}
                                                                                    200))))))))))))

(defn handle-get-page-refs [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [{:keys [allowed?]} (check-page-password request graph-uuid page-uuid env)]
                (if-not allowed?
                  (publish-common/json-response {:error "password required"} 401)
                  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                             do-id (.idFromName do-ns "index")
                             do-stub (.get do-ns do-id)
                             refs-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/refs"))]
                            (if-not (.-ok refs-resp)
                              (js/Response.
                               (publish-render/render-404-html)
                               #js {:headers (publish-common/merge-headers
                                              #js {"content-type" "text/html; charset=utf-8"}
                                              (publish-common/cors-headers))})
                              (js-await [refs (.json refs-resp)]
                                        (publish-common/json-response (js->clj refs :keywordize-keys true) 200)))))))))

(defn handle-get-page-tagged-nodes [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [{:keys [allowed?]} (check-page-password request graph-uuid page-uuid env)]
                (if-not allowed?
                  (publish-common/json-response {:error "password required"} 401)
                  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                             do-id (.idFromName do-ns "index")
                             do-stub (.get do-ns do-id)
                             tags-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/tagged_nodes"))]
                            (if-not (.-ok tags-resp)
                              (publish-common/not-found)
                              (js-await [tags (.json tags-resp)]
                                        (publish-common/json-response (js->clj tags :keywordize-keys true) 200)))))))))

(defn handle-list-pages [env]
  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
             do-id (.idFromName do-ns "index")
             do-stub (.get do-ns do-id)
             meta-resp (.fetch do-stub "https://publish/pages" #js {:method "GET"})]
            (if-not (.-ok meta-resp)
              (js/Response.
               (publish-render/render-404-html)
               #js {:headers (publish-common/merge-headers
                              #js {"content-type" "text/html; charset=utf-8"}
                              (publish-common/cors-headers))})
              (js-await [meta (.json meta-resp)]
                        (publish-common/json-response (js->clj meta :keywordize-keys true) 200)))))

(defn handle-list-graph-pages-by-uuid [graph-uuid env]
  (if-not graph-uuid
    (publish-common/bad-request "missing graph uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid)
                                 #js {:method "GET"})]
              (if-not (.-ok meta-resp)
                (js/Response.
                 (publish-render/render-404-html)
                 #js {:headers (publish-common/merge-headers
                                #js {"content-type" "text/html; charset=utf-8"}
                                (publish-common/cors-headers))})
                (js-await [meta (.json meta-resp)]
                          (publish-common/json-response (js->clj meta :keywordize-keys true) 200))))))

(defn handle-graph-search [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        query (.get (.-searchParams url) "q")]
    (if (or (string/blank? graph-uuid) (string/blank? query))
      (publish-common/bad-request "missing graph uuid or query")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns "index")
                 do-stub (.get do-ns do-id)
                 resp (.fetch do-stub
                              (str "https://publish/search/" graph-uuid
                                   "?q=" (js/encodeURIComponent query))
                              #js {:method "GET"})]
                (if-not (.-ok resp)
                  (publish-common/not-found)
                  (js-await [data (.json resp)]
                            (publish-common/json-response (js->clj data :keywordize-keys true) 200)))))))

(defn handle-graph-html [graph-uuid env]
  (if-not graph-uuid
    (publish-common/bad-request "missing graph uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid)
                                 #js {:method "GET"})]
              (if-not (.-ok meta-resp)
                (js/Response.
                 (publish-render/render-404-html)
                 #js {:headers (publish-common/merge-headers
                                #js {"content-type" "text/html; charset=utf-8"}
                                (publish-common/cors-headers))})
                (js-await [meta (.json meta-resp)
                           pages (or (aget meta "pages") #js [])]
                          (js/Response.
                           (publish-render/render-graph-html graph-uuid pages)
                           #js {:headers (publish-common/merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (publish-common/cors-headers))}))))))

(defn handle-tag-name-json [tag-name env]
  (if-not tag-name
    (publish-common/bad-request "missing tag name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/tag/" (js/encodeURIComponent tag-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (js/Response.
                 (publish-render/render-404-html)
                 #js {:headers (publish-common/merge-headers
                                #js {"content-type" "text/html; charset=utf-8"}
                                (publish-common/cors-headers))})
                (js-await [data (.json resp)]
                          (publish-common/json-response (js->clj data :keywordize-keys true) 200))))))

(defn handle-tag-name-html [tag-name env]
  (if-not tag-name
    (publish-common/bad-request "missing tag name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/tag/" (js/encodeURIComponent tag-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (js/Response.
                 (publish-render/render-404-html)
                 #js {:headers (publish-common/merge-headers
                                #js {"content-type" "text/html; charset=utf-8"}
                                (publish-common/cors-headers))})
                (js-await [data (.json resp)
                           rows (or (aget data "tagged_nodes") #js [])
                           title (or tag-name "Tag")]
                          (js/Response.
                           (publish-render/render-tag-name-html tag-name title rows)
                           #js {:headers (publish-common/merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (publish-common/cors-headers))}))))))

(defn handle-ref-name-json [ref-name env]
  (if-not ref-name
    (publish-common/bad-request "missing ref name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/ref/" (js/encodeURIComponent ref-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (publish-common/not-found)
                (js-await [data (.json resp)]
                          (publish-common/json-response (js->clj data :keywordize-keys true) 200))))))

(defn handle-ref-name-html [ref-name env]
  (if-not ref-name
    (publish-common/bad-request "missing ref name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/ref/" (js/encodeURIComponent ref-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (publish-common/not-found)
                (js-await [data (.json resp)
                           rows (or (aget data "pages") #js [])
                           title (or ref-name "Reference")]
                          (js/Response.
                           (publish-render/render-ref-html "all" ref-name title rows)
                           #js {:headers (publish-common/merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (publish-common/cors-headers))}))))))

(defn handle-list-graph-pages [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)]
    (handle-list-graph-pages-by-uuid graph-uuid env)))

(defn handle-delete-page [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [{:keys [claims]} (auth-claims request env)]
                (if (nil? claims)
                  (publish-common/unauthorized)
                  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                             page-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                             page-stub (.get do-ns page-id)
                             index-id (.idFromName do-ns "index")
                             index-stub (.get do-ns index-id)
                             meta-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page-uuid)
                                               #js {:method "GET"})]
                            (if-not (.-ok meta-resp)
                              (publish-common/not-found)
                              (js-await [meta (.json meta-resp)
                                         owner-sub (aget meta "owner_sub")
                                         subject (aget claims "sub")]
                                        (if (or (string/blank? owner-sub)
                                                (not= owner-sub subject))
                                          (publish-common/forbidden)
                                          (js-await [page-resp (.fetch page-stub (str "https://publish/pages/" graph-uuid "/" page-uuid)
                                                                       #js {:method "DELETE"})
                                                     index-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page-uuid)
                                                                        #js {:method "DELETE"})]
                                                    (if (or (not (.-ok page-resp)) (not (.-ok index-resp)))
                                                      (publish-common/not-found)
                                                      (publish-common/json-response {:ok true} 200))))))))))))

(defn handle-delete-graph [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)]
    (if-not graph-uuid
      (publish-common/bad-request "missing graph uuid")
      (js-await [{:keys [claims]} (auth-claims request env)]
                (if (nil? claims)
                  (publish-common/unauthorized)
                  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                             index-id (.idFromName do-ns "index")
                             index-stub (.get do-ns index-id)
                             list-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid)
                                               #js {:method "GET"})]
                            (if-not (.-ok list-resp)
                              (publish-common/not-found)
                              (js-await [data (.json list-resp)
                                         pages (or (aget data "pages") #js [])
                                         subject (aget claims "sub")
                                         owner-mismatch? (some (fn [page]
                                                                 (let [owner-sub (aget page "owner_sub")]
                                                                   (or (string/blank? owner-sub)
                                                                       (not= owner-sub subject))))
                                                               (array-seq pages))]
                                        (if owner-mismatch?
                                          (publish-common/forbidden)
                                          (js-await [_ (js/Promise.all
                                                        (map (fn [page]
                                                               (let [page-uuid (aget page "page_uuid")
                                                                     page-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                                                                     page-stub (.get do-ns page-id)]
                                                                 (.fetch page-stub (str "https://publish/pages/" graph-uuid "/" page-uuid)
                                                                         #js {:method "DELETE"})))
                                                             pages))
                                                     del-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid)
                                                                      #js {:method "DELETE"})]
                                                    (if-not (.-ok del-resp)
                                                      (publish-common/not-found)
                                                      (publish-common/json-response {:ok true} 200))))))))))))

(defn handle-page-html [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (publish-common/bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (js-await [index-id (.idFromName do-ns "index")
                             index-stub (.get do-ns index-id)
                             tags-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/tagged_nodes")
                                               #js {:method "GET"})]
                            (if (and tags-resp (.-ok tags-resp))
                              (js-await [raw (.json tags-resp)
                                         tag-items (js->clj (or (aget raw "tagged_nodes") #js [])
                                                            :keywordize-keys true)
                                         tag-title (or (some (fn [item]
                                                               (let [title (publish-render/tag-item-val item :tag_title)]
                                                                 (when (and title (not (string/blank? title)))
                                                                   title)))
                                                             tag-items)
                                                       page-uuid)]
                                        (if (seq tag-items)
                                          (js/Response.
                                           (publish-render/render-tag-html graph-uuid page-uuid tag-title tag-items)
                                           #js {:headers (publish-common/merge-headers
                                                          #js {"content-type" "text/html; charset=utf-8"}
                                                          (publish-common/cors-headers))})
                                          (js/Response.
                                           (publish-render/render-not-published-html graph-uuid)
                                           #js {:headers (publish-common/merge-headers
                                                          #js {"content-type" "text/html; charset=utf-8"}
                                                          (publish-common/cors-headers))})))
                              (js/Response.
                               (publish-render/render-not-published-html graph-uuid)
                               #js {:headers (publish-common/merge-headers
                                              #js {"content-type" "text/html; charset=utf-8"}
                                              (publish-common/cors-headers))})))
                  (js-await [{:keys [allowed? provided?]} (check-page-password request graph-uuid page-uuid env)]
                            (if-not allowed?
                              (js/Response.
                               (publish-render/render-password-html graph-uuid page-uuid provided?)
                               #js {:status 401
                                    :headers (publish-common/merge-headers
                                              #js {"content-type" "text/html; charset=utf-8"}
                                              (publish-common/cors-headers))})
                              (js-await [meta (.json meta-resp)
                                         etag (aget meta "content_hash")
                                         if-none-match (publish-common/normalize-etag (.get (.-headers request) "if-none-match"))
                                         index-id (.idFromName do-ns "index")
                                         index-stub (.get do-ns index-id)
                                         refs-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/refs"))
                                         refs-json (when (and refs-resp (.-ok refs-resp))
                                                     (js-await [raw (.json refs-resp)]
                                                               (js->clj raw :keywordize-keys false)))
                                         tags-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page-uuid "/tagged_nodes")
                                                           #js {:method "GET"})
                                         tagged-nodes (when (and tags-resp (.-ok tags-resp))
                                                        (js-await [raw (.json tags-resp)]
                                                                  (js->clj (or (aget raw "tagged_nodes") #js [])
                                                                           :keywordize-keys true)))
                                         r2 (aget env "PUBLISH_R2")
                                         object (.get r2 (aget meta "r2_key"))]
                                        (if (and etag if-none-match (= etag if-none-match))
                                          (js/Response. nil #js {:status 304
                                                                 :headers (publish-common/merge-headers
                                                                           #js {:etag etag
                                                                                "cache-control" "public, max-age=300, must-revalidate"}
                                                                           (publish-common/cors-headers))})
                                          (if-not object
                                            (publish-common/json-response {:error "missing transit blob"} 404)
                                            (js-await [buffer (.arrayBuffer object)
                                                       transit (.decode publish-common/text-decoder buffer)]
                                                      (let [headers (publish-common/merge-headers
                                                                     #js {"content-type" "text/html; charset=utf-8"
                                                                          "cache-control" "public, max-age=300, must-revalidate"}
                                                                     (publish-common/cors-headers))]
                                                        (when etag
                                                          (.set headers "etag" etag))
                                                        (js/Response.
                                                         (publish-render/render-page-html transit page-uuid refs-json tagged-nodes)
                                                         #js {:headers headers})))))))))))))

(defn ^:large-vars/cleanup-todo handle-fetch [request env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (js/Response. nil #js {:status 204 :headers (publish-common/cors-headers)})

      (and (= path "/static/publish.css") (= method "GET"))
      (js/Response.
       publish-css
       #js {:headers (publish-common/merge-headers
                      #js {"content-type" "text/css; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (publish-common/cors-headers))})

      (and (= path "/static/publish.js") (= method "GET"))
      (js/Response.
       publish-js
       #js {:headers (publish-common/merge-headers
                      #js {"content-type" "text/javascript; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (publish-common/cors-headers))})

      (and (= path "/static/tabler.ext.js") (= method "GET"))
      (js/Response.
       tabler-ext-js
       #js {:headers (publish-common/merge-headers
                      #js {"content-type" "text/javascript; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (publish-common/cors-headers))})

      (and (= path "/") (= method "GET"))
      (js/Response.
       (publish-render/render-home-html)
       #js {:headers (publish-common/merge-headers
                      #js {"content-type" "text/html; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (publish-common/cors-headers))})

      (and (string/starts-with? path "/page/") (= method "GET"))
      (handle-page-html request env)

      (and (= path "/assets") (= method "POST"))
      (publish-assets/handle-post-asset request env)

      (and (= path "/pages") (= method "POST"))
      (handle-post-pages request env)

      (and (= path "/pages") (= method "GET"))
      (handle-list-pages env)

      (and (string/starts-with? path "/search/") (= method "GET"))
      (handle-graph-search request env)

      (and (string/starts-with? path "/graph/") (= method "GET"))
      (let [parts (string/split path #"/")
            graph-uuid (nth parts 2 nil)]
        (if (= (nth parts 3 nil) "json")
          (handle-list-graph-pages-by-uuid graph-uuid env)
          (handle-graph-html graph-uuid env)))

      (and (string/starts-with? path "/tag/") (= method "GET"))
      (let [parts (string/split path #"/")
            raw-name (nth parts 2 nil)
            tag-name (when raw-name
                       (js/decodeURIComponent raw-name))]
        (if (= (nth parts 3 nil) "json")
          (handle-tag-name-json tag-name env)
          (handle-tag-name-html tag-name env)))

      (and (string/starts-with? path "/ref/") (= method "GET"))
      (let [parts (string/split path #"/")
            raw-name (nth parts 2 nil)
            ref-name (when raw-name
                       (js/decodeURIComponent raw-name))]
        (if (= (nth parts 3 nil) "json")
          (handle-ref-name-json ref-name env)
          (handle-ref-name-html ref-name env)))

      (and (string/starts-with? path "/asset/") (= method "GET"))
      (let [parts (string/split path #"/")
            graph-uuid (nth parts 2 nil)
            file-name (nth parts 3 nil)]
        (if (or (string/blank? graph-uuid) (string/blank? file-name))
          (publish-common/bad-request "missing asset id")
          (let [ext-idx (string/last-index-of file-name ".")
                asset-uuid (when (and ext-idx (pos? ext-idx))
                             (subs file-name 0 ext-idx))
                asset-type (when (and ext-idx (pos? ext-idx))
                             (subs file-name (inc ext-idx)))]
            (if (or (string/blank? asset-uuid) (string/blank? asset-type))
              (publish-common/bad-request "invalid asset id")
              (js-await [r2 (aget env "PUBLISH_R2")
                         r2-key (str "publish/assets/" graph-uuid "/" asset-uuid "." asset-type)
                         ^js object (.get r2 r2-key)]
                        (if-not object
                          (publish-common/not-found)
                          (let [headers (publish-common/merge-headers
                                         #js {"content-type" (or (some-> object .-httpMetadata .-contentType)
                                                                 (publish-assets/asset-content-type asset-type))
                                              "cache-control" "public, max-age=31536000, immutable"}
                                         (publish-common/cors-headers))]
                            (js/Response. (.-body object)
                                          #js {:headers headers}))))))))

      (and (string/starts-with? path "/p/") (= method "GET"))
      (let [parts (string/split path #"/")
            short-id (nth parts 2 nil)]
        (if (string/blank? short-id)
          (publish-common/bad-request "missing short id")
          (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                     do-id (.idFromName do-ns "index")
                     do-stub (.get do-ns do-id)
                     resp (.fetch do-stub (str "https://publish/short/" short-id)
                                  #js {:method "GET"})]
                    (if-not (.-ok resp)
                      (publish-common/not-found)
                      (js-await [data (.json resp)
                                 row (aget data "page")]
                                (if-not row
                                  (publish-common/not-found)
                                  (let [graph-uuid (aget row "graph_uuid")
                                        page-uuid (aget row "page_uuid")
                                        location (str "/page/" graph-uuid "/" page-uuid)]
                                    (js/Response. nil #js {:status 302
                                                           :headers (publish-common/merge-headers
                                                                     #js {"location" location}
                                                                     (publish-common/cors-headers))}))))))))

      (and (string/starts-with? path "/u/") (= method "GET"))
      (let [parts (string/split path #"/")
            username (nth parts 2 nil)]
        (if (string/blank? username)
          (publish-common/bad-request "missing username")
          (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                     index-id (.idFromName do-ns "index")
                     index-stub (.get do-ns index-id)
                     resp (.fetch index-stub (str "https://publish/user/" username)
                                  #js {:method "GET"})]
                    (if-not (.-ok resp)
                      (publish-common/not-found)
                      (js-await [data (.json resp)
                                 user (aget data "user")
                                 rows (or (aget data "pages") #js [])]
                                (js/Response.
                                 (publish-render/render-user-html username user rows)
                                 #js {:headers (publish-common/merge-headers
                                                #js {"content-type" "text/html; charset=utf-8"}
                                                (publish-common/cors-headers))}))))))

      (and (string/starts-with? path "/pages/") (= method "GET"))
      (let [parts (string/split path #"/")]
        (cond
          (= (count parts) 3) (handle-list-graph-pages request env)
          (= (nth parts 4 nil) "transit") (handle-get-page-transit request env)
          (= (nth parts 4 nil) "refs") (handle-get-page-refs request env)
          (= (nth parts 4 nil) "tagged_nodes") (handle-get-page-tagged-nodes request env)
          :else (handle-get-page request env)))

      (and (string/starts-with? path "/pages/") (= method "DELETE"))
      (let [parts (string/split path #"/")]
        (if (= (count parts) 3)
          (handle-delete-graph request env)
          (handle-delete-page request env)))

      :else
      (js/Response.
       (publish-render/render-404-html)
       #js {:headers (publish-common/merge-headers
                      #js {"content-type" "text/html; charset=utf-8"}
                      (publish-common/cors-headers))}))))
