(ns logseq.db-sync.node-dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.node.dispatch :as dispatch]
            [logseq.db-sync.node.graph :as graph]
            [logseq.db-sync.node.storage :as node-storage]
            [logseq.db-sync.worker.asset-link :as asset-link]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [promesa.core :as p]))

(deftest node-graph-context-seeds-built-ins-test
  (let [graph-id (str (random-uuid))
        data-dir (str "tmp/db-sync-node-graph-test/" graph-id)
        context (graph/graph-context
                 {:config {:data-dir data-dir}
                  :index-db #js {}
                  :assets-bucket #js {}}
                 graph-id)]
    (try
      (let [conn (.-conn context)]
        (is (some? (d/entity @conn :logseq.class/Root)))
        (is (string? (:logseq.property.journal/title-format
                      (d/entity @conn :logseq.class/Journal)))))
      (finally
        (.close (.-sql context))
        (node-storage/delete-graph-db! data-dir graph-id)))))

(deftest node-adapter-forwards-public-semantic-asset-route-test
  (async done
         (let [handled-request (atom nil)
               context #js {}
               request (js/Request.
                        (str "http://localhost/api/v1/graphs/graph-1/assets"
                             "?file-name=photo.png&size=4&checksum="
                             (apply str (repeat 64 "a")))
                        #js {:method "POST" :body "data"})]
           (-> (p/with-redefs [index-handler/graph-access-response
                               (fn [_request _env _graph-id]
                                 (p/resolved (js/Response. "{}" #js {:status 200})))
                               index/<graph-e2ee? (fn [_db _graph-id] (p/resolved false))
                               graph/get-or-create-graph (fn [_registry _deps _graph-id] context)
                               sync-handler/handle-http
                               (fn [actual-context actual-request]
                                 (reset! handled-request [actual-context actual-request])
                                 (p/resolved (js/Response. "{}" #js {:status 201})))]
                 (p/let [response (dispatch/handle-node-fetch
                                   {:request request
                                    :env #js {"DB" #js {}}
                                    :registry (atom {})
                                    :deps {}})]
                   (is (= 201 (.-status response)))
                   (if-let [[actual-context forwarded-request] @handled-request]
                     (let [url (js/URL. (.-url forwarded-request))]
                       (is (identical? context actual-context))
                       (is (= "/semantic/assets" (.-pathname url)))
                       (is (= "graph-1" (.get (.-searchParams url) "graph-id"))))
                     (is false "public semantic asset route was not forwarded"))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest node-adapter-accepts-signed-asset-download-test
  (async done
         (let [request (js/Request.
                        "http://localhost/assets/graph-1/asset-1.png?expires=1&signature=signed")]
           (-> (p/with-redefs [asset-link/<valid-request? (fn [_request _env] (p/resolved true))
                               index-handler/graph-access-response
                               (fn [& _]
                                 (p/rejected (js/Error. "signed download must not require bearer auth")))
                               assets-handler/handle
                               (fn [_request _env]
                                 (p/resolved (js/Response. "asset" #js {:status 200})))]
                 (p/let [response (dispatch/handle-node-fetch
                                   {:request request
                                    :env #js {}
                                    :registry (atom {})
                                    :deps {}})
                         body (.text response)]
                   (is (= 200 (.-status response)))
                   (is (= "asset" body))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
