(ns logseq.publish.routes-test
  (:require [cljs.test :refer [async deftest is testing]]
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
