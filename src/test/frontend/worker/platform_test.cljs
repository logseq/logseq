(ns frontend.worker.platform-test
  (:require ["ws" :as ws]
            [cljs.test :refer [async deftest is]]
            [frontend.common.file.opfs :as opfs]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform.browser :as platform-browser]
            [frontend.worker.platform.node :as platform-node]
            [promesa.core :as p]))

(defn- wait-for-event
  [emitter event]
  (p/create
   (fn [resolve reject]
     (.once emitter event (fn [& args] (resolve args)))
     (.once emitter "error" reject))))

(defn- fake-websocket
  [url]
  (this-as this
    (set! (.-url this) url)
    this))

(deftest browser-platform-adapter
  (async done
    (let [saved-location (.-location js/globalThis)
          saved-websocket (.-WebSocket js/globalThis)
          kv-state (atom {})
          posted (atom nil)]
      (set! (.-location js/globalThis) #js {:href "http://example.test/?publishing=true"})
      (set! (.-WebSocket js/globalThis) fake-websocket)
      (with-redefs [opfs/<read-text! (fn [path]
                                       (p/resolved (str "read:" path)))
                    opfs/<write-text! (fn [path text]
                                        (swap! kv-state assoc [:write path] text)
                                        (p/resolved nil))
                    worker-util/post-message (fn [type payload]
                                               (reset! posted [type payload]))]
        (-> (p/let [platform (platform-browser/browser-platform)
                    kv (:kv platform)
                    storage (:storage platform)
                    _ (is (fn? (:get kv)))
                    _ (is (fn? (:set! kv)))
                    _ (p/let [_ ((:write-text! storage) "foo.txt" "bar")
                              v ((:read-text! storage) "foo.txt")]
                        (is (= "read:foo.txt" v)))
                    _ ((:post-message! (:broadcast platform)) :event {:ok true})
                    ws ((:connect (:websocket platform)) "ws://example.test/socket")]
              (is (= [:event {:ok true}] @posted))
              (is (= "ws://example.test/socket" (.-url ws))))
            (p/finally (fn []
                         (set! (.-location js/globalThis) saved-location)
                         (set! (.-WebSocket js/globalThis) saved-websocket)))
            (p/then (fn [] (done))))))))

(deftest node-platform-adapter
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-platform")
          events (atom [])
          server (ws/Server. #js {:port 0})]
      (.on server "connection" (fn [socket] (.close socket)))
      (-> (p/let [_ (wait-for-event server "listening")
                  port (.-port (.address server))
                  platform (platform-node/node-platform
                            {:data-dir data-dir
                             :event-fn (fn [type payload]
                                         (swap! events conj [type payload]))})
                  storage (:storage platform)
                  kv (:kv platform)
                  ws-connect (:connect (:websocket platform))
                  _ (p/let [_ ((:write-text! storage) "foo/bar.txt" "hello")
                            v ((:read-text! storage) "foo/bar.txt")]
                      (is (= "hello" v)))
                  _ (p/let [_ ((:set! kv) "alpha" "beta")
                            v ((:get kv) "alpha")]
                      (is (= "beta" v)))
                  _ ((:post-message! (:broadcast platform)) :event {:value 1})
                  _ (is (= [[:event {:value 1}]] @events))
                  client (ws-connect (str "ws://127.0.0.1:" port))
                  _ (p/let [_ (wait-for-event client "open")]
                      (.close client))]
            true)
          (p/finally (fn []
                       (.close server)))
          (p/then (fn [] (done)))))))
