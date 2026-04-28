(ns logseq.publish.routes-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.common.authorization :as authorization]
            [logseq.publish.common :as publish-common]
            [logseq.publish.routes :as routes]
            [promesa.core :as p]))

(defn- json-response
  [data]
  (js/Response.
   (js/JSON.stringify data)
   #js {:status 200
        :headers #js {"content-type" "application/json"}}))

(defn- short-url-env
  []
  (let [do-stub #js {:fetch (fn [url _opts]
                              (cond
                                (= "https://publish/short/abc123" url)
                                (js/Promise.resolve
                                 (json-response
                                  #js {:page #js {"graph_uuid" "graph-1"
                                                  "page_uuid" "page-1"}}))

                                (re-matches #"https://publish/pages/[^/]+/[^/]+/password" url)
                                (js/Promise.resolve (json-response #js {}))

                                (re-matches #"https://publish/pages/[^/]+/[^/]+" url)
                                (js/Promise.resolve
                                 (json-response
                                  #js {"content_hash" "etag-1"
                                       "r2_key" "publish/graph-1/page-1.transit"}))

                                :else
                                (js/Promise.resolve
                                 (js/Response. "not found" #js {:status 404}))))}
        do-ns #js {:idFromName (fn [_name] "index")
                   :get (fn [_id] do-stub)}
        r2 #js {:get (fn [_key]
                       (js/Promise.resolve
                        #js {:arrayBuffer (fn []
                                            (let [payload (.encode (js/TextEncoder.) "{}")]
                                              (js/Promise.resolve (.-buffer payload))))}))}]
    #js {"PUBLISH_META_DO" do-ns
         "PUBLISH_R2" r2}))

(defn- empty-env []
  #js {})

(defn- json-error-response
  [status message]
  (js/Response.
   (js/JSON.stringify #js {"error" message})
   #js {:status status
        :headers #js {"content-type" "application/json"}}))

(defn- ok-json-response
  [data]
  (js/Response.
   (js/JSON.stringify data)
   #js {:status 200
        :headers #js {"content-type" "application/json"}}))

(defn- method-from-opts
  [opts]
  (or (some-> opts (aget "method"))
      "GET"))

(defn- permission-env
  [route-dispatch]
  (let [do-ns #js {:idFromName (fn [name] name)
                   :get (fn [id]
                          #js {:fetch (fn [url opts]
                                        (js/Promise.resolve
                                         (route-dispatch id url (method-from-opts opts))))})}]
    #js {"PUBLISH_META_DO" do-ns}))

(deftest short-url-does-not-redirect-to-uuid-url
  (testing "short URL should not redirect to /page/:graph/:page"
    (async done
      (let [request (js/Request. "https://publish.example/p/abc123?password=s3cr3t")
            env (short-url-env)]
        (-> (p/let [response (routes/handle-fetch request env)
                    body (.text response)]
              (is (= 200 (.-status response)))
              (is (nil? (.get (.-headers response) "location")))
              (is (re-find #"<!doctype html>" body))
              (is (not (re-find #"Page not found" body)))
              (done))
            (p/catch (fn [error]
                       (is nil (str error))
                       (done))))))))

(deftest legacy-s-short-url-is-supported
  (testing "legacy /s/:short-id should render page html"
    (async done
      (let [request (js/Request. "https://publish.example/s/abc123")
            env (short-url-env)]
        (-> (p/let [response (routes/handle-fetch request env)
                    body (.text response)]
              (is (= 200 (.-status response)))
              (is (nil? (.get (.-headers response) "location")))
              (is (re-find #"<!doctype html>" body))
              (is (not (re-find #"Page not found" body)))
              (done))
            (p/catch (fn [error]
                       (is nil (str error))
                       (done))))))))

(deftest page-uuid-route-is-still-supported
  (testing "legacy /page/:graph-uuid/:page-uuid should still render page html"
    (async done
      (let [request (js/Request. "https://publish.example/page/3bc00ad3-f421-41e7-8c65-40861c298be5/6954ee2a-506b-4dd9-bd6d-0dc24db9c055")
            env (short-url-env)]
        (-> (p/let [response (routes/handle-fetch request env)
                    body (.text response)]
              (is (= 200 (.-status response)))
              (is (nil? (.get (.-headers response) "location")))
              (is (re-find #"<!doctype html>" body))
              (is (not (re-find #"Page not found" body)))
              (done))
            (p/catch (fn [error]
                       (is nil (str error))
                       (done))))))))

(deftest options-route-returns-cors-no-content
  (async done
    (let [request (js/Request. "https://publish.example/any"
                               #js {:method "OPTIONS"})]
      (-> (p/let [response (routes/handle-fetch request (empty-env))]
            (is (= 204 (.-status response)))
            (is (= "*" (.get (.-headers response) "access-control-allow-origin")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest home-route-renders-html
  (async done
    (let [request (js/Request. "https://publish.example/")]
      (-> (p/let [response (routes/handle-fetch request (empty-env))
                  body (.text response)]
            (is (= 200 (.-status response)))
            (is (re-find #"<!doctype html>" body))
            (is (re-find #"Logseq Publish" body))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest static-assets-return-content-types
  (async done
    (-> (p/let [css-resp (routes/handle-fetch (js/Request. "https://publish.example/static/publish.css") (empty-env))
                js-resp (routes/handle-fetch (js/Request. "https://publish.example/static/publish.js") (empty-env))
                ext-resp (routes/handle-fetch (js/Request. "https://publish.example/static/tabler.ext.js") (empty-env))]
          (is (= "text/css; charset=utf-8" (.get (.-headers css-resp) "content-type")))
          (is (= "text/javascript; charset=utf-8" (.get (.-headers js-resp) "content-type")))
          (is (= "text/javascript; charset=utf-8" (.get (.-headers ext-resp) "content-type")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest short-url-missing-id-returns-bad-request
  (async done
    (-> (p/let [response (routes/handle-fetch (js/Request. "https://publish.example/p/") (empty-env))
                body (.json response)]
          (is (= 400 (.-status response)))
          (is (= "missing short id" (aget body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest short-url-not-found-returns-not-found
  (async done
    (let [do-stub #js {:fetch (fn [_url _opts]
                                (js/Promise.resolve (js/Response. "nope" #js {:status 404})))}
          do-ns #js {:idFromName (fn [_name] "index")
                     :get (fn [_id] do-stub)}
          env #js {"PUBLISH_META_DO" do-ns}]
      (-> (p/let [response (routes/handle-fetch (js/Request. "https://publish.example/p/abc") env)
                  body (.json response)]
            (is (= 404 (.-status response)))
            (is (= "not found" (aget body "error")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest asset-route-validates-missing-or-invalid-id
  (async done
    (-> (p/let [missing-id-resp (routes/handle-fetch (js/Request. "https://publish.example/asset//") (empty-env))
                missing-id-body (.json missing-id-resp)
                invalid-id-resp (routes/handle-fetch (js/Request. "https://publish.example/asset/g/noext") (empty-env))
                invalid-id-body (.json invalid-id-resp)]
          (is (= 400 (.-status missing-id-resp)))
          (is (= "missing asset id" (aget missing-id-body "error")))
          (is (= 400 (.-status invalid-id-resp)))
          (is (= "invalid asset id" (aget invalid-id-body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest user-route-validates-missing-username
  (async done
    (-> (p/let [response (routes/handle-fetch (js/Request. "https://publish.example/u/") (empty-env))
                body (.json response)]
          (is (= 400 (.-status response)))
          (is (= "missing username" (aget body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest post-pages-without-auth-is-unauthorized
  (async done
    (-> (p/let [request (js/Request. "https://publish.example/pages"
                                     #js {:method "POST"
                                          :headers #js {"content-type" "application/transit+json"}
                                          :body "{}"})
                response (routes/handle-fetch request (empty-env))
                body (.json response)]
          (is (= 401 (.-status response)))
          (is (= "unauthorized" (aget body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest delete-page-without-auth-is-unauthorized
  (async done
    (-> (p/let [request (js/Request. "https://publish.example/pages/graph-1/page-1"
                                     #js {:method "DELETE"})
                response (routes/handle-fetch request (empty-env))
                body (.json response)]
          (is (= 401 (.-status response)))
          (is (= "unauthorized" (aget body "error")))
          (done))
        (p/catch (fn [error]
                   (is nil (str error))
                   (done))))))

(deftest delete-page-owner-mismatch-is-forbidden
  (async done
    (let [env (permission-env
               (fn [id url method]
                 (cond
                   (and (= id "index")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1/page-1"))
                   (ok-json-response #js {"owner_sub" "owner-a"})

                   :else
                   (json-error-response 404 "not found"))))
          request (js/Request. "https://publish.example/pages/graph-1/page-1"
                               #js {:method "DELETE"
                                    :headers #js {"authorization" "Bearer token"}})]
      (-> (p/let [response (p/with-redefs [authorization/verify-jwt (fn [_ _] #js {"sub" "owner-b"})]
                               (routes/handle-fetch request env))
                  body (.json response)]
            (is (= 403 (.-status response)))
            (is (= "forbidden" (aget body "error")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest delete-page-owner-match-succeeds
  (async done
    (let [env (permission-env
               (fn [id url method]
                 (cond
                   (and (= id "index")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1/page-1"))
                   (ok-json-response #js {"owner_sub" "owner-a"})

                   (and (= id "index")
                        (= method "DELETE")
                        (= url "https://publish/pages/graph-1/page-1"))
                   (ok-json-response #js {"ok" true})

                   (and (= id "graph-1:page-1")
                        (= method "DELETE")
                        (= url "https://publish/pages/graph-1/page-1"))
                   (ok-json-response #js {"ok" true})

                   :else
                   (json-error-response 404 "not found"))))
          request (js/Request. "https://publish.example/pages/graph-1/page-1"
                               #js {:method "DELETE"
                                    :headers #js {"authorization" "Bearer token"}})]
      (-> (p/let [response (p/with-redefs [authorization/verify-jwt (fn [_ _] #js {"sub" "owner-a"})]
                               (routes/handle-fetch request env))
                  body (.json response)]
            (is (= 200 (.-status response)))
            (is (true? (aget body "ok")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest delete-graph-owner-mismatch-is-forbidden
  (async done
    (let [env (permission-env
               (fn [id url method]
                 (cond
                   (and (= id "index")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1"))
                   (ok-json-response #js {"pages" #js [#js {"owner_sub" "owner-a" "page_uuid" "page-1"}]})

                   :else
                   (json-error-response 404 "not found"))))
          request (js/Request. "https://publish.example/pages/graph-1"
                               #js {:method "DELETE"
                                    :headers #js {"authorization" "Bearer token"}})]
      (-> (p/let [response (p/with-redefs [authorization/verify-jwt (fn [_ _] #js {"sub" "owner-b"})]
                               (routes/handle-fetch request env))
                  body (.json response)]
            (is (= 403 (.-status response)))
            (is (= "forbidden" (aget body "error")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest delete-graph-owner-match-succeeds
  (async done
    (let [env (permission-env
               (fn [id url method]
                 (cond
                   (and (= id "index")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1"))
                   (ok-json-response #js {"pages" #js [#js {"owner_sub" "owner-a" "page_uuid" "page-1"}
                                                          #js {"owner_sub" "owner-a" "page_uuid" "page-2"}]})

                   (and (= id "index")
                        (= method "DELETE")
                        (= url "https://publish/pages/graph-1"))
                   (ok-json-response #js {"ok" true})

                   (and (= method "DELETE")
                        (or (and (= id "graph-1:page-1") (= url "https://publish/pages/graph-1/page-1"))
                            (and (= id "graph-1:page-2") (= url "https://publish/pages/graph-1/page-2"))))
                   (ok-json-response #js {"ok" true})

                   :else
                   (json-error-response 404 "not found"))))
          request (js/Request. "https://publish.example/pages/graph-1"
                               #js {:method "DELETE"
                                    :headers #js {"authorization" "Bearer token"}})]
      (-> (p/let [response (p/with-redefs [authorization/verify-jwt (fn [_ _] #js {"sub" "owner-a"})]
                               (routes/handle-fetch request env))
                  body (.json response)]
            (is (= 200 (.-status response)))
            (is (true? (aget body "ok")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))

(deftest get-page-requires-correct-password-when-protected
  (async done
    (let [env (permission-env
               (fn [id url method]
                 (cond
                   (and (= id "graph-1:page-1")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1/page-1"))
                   (ok-json-response #js {"content_hash" "h-1"
                                          "r2_key" "publish/graph-1/page-1.transit"})

                   (and (= id "index")
                        (= method "GET")
                        (= url "https://publish/pages/graph-1/page-1/password"))
                   (ok-json-response #js {"password_hash" "pbkdf2$sha256$90000$x$y"})

                   :else
                   (json-error-response 404 "not found"))))
          request (js/Request. "https://publish.example/pages/graph-1/page-1")]
      (-> (p/let [response (p/with-redefs [publish-common/verify-password (fn [_ _] (p/resolved false))]
                               (routes/handle-fetch request env))
                  body (.json response)]
            (is (= 401 (.-status response)))
            (is (= "password required" (aget body "error")))
            (done))
          (p/catch (fn [error]
                     (is nil (str error))
                     (done)))))))
