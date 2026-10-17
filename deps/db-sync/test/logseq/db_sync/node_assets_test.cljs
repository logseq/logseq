(ns logseq.db-sync.node-assets-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [logseq.db-sync.node.assets :as assets]
            [logseq.db-sync.node.server :as server]
            [logseq.db-sync.worker.asset-link :as asset-link]
            [promesa.core :as p]))

(defn- temp-dir []
  (.mkdtempSync fs (node-path/join (os/tmpdir) "db-sync-assets-")))

(deftest streamed-asset-roundtrip
  (async done
         (let [dir (temp-dir)
               bucket (assets/make-bucket dir)
               body (js/ReadableStream.
                     #js {:start (fn [controller]
                                   (.enqueue controller (js/Uint8Array. #js [0 255]))
                                   (.enqueue controller (js/Uint8Array. #js [128 7]))
                                   (.close controller))})]
           (-> (p/let [_ (.put bucket "graph/image.png" body
                               #js {:httpMetadata #js {:contentType "image/png"}
                                    :customMetadata #js {:checksum "test-checksum"}})
                       ^js stored (.get bucket "graph/image.png")]
                 (is (= [0 255 128 7] (vec (array-seq (.-body stored)))))
                 (is (= "image/png" (aget (.-httpMetadata stored) "contentType")))
                 (is (= "test-checksum" (aget (.-customMetadata stored) "checksum"))))
               (p/catch #(is false (str %)))
               (p/finally (fn [] (.rmSync fs dir #js {:recursive true :force true}) (done)))))))

(deftest signed-asset-download-without-bearer-token
  (async done
         (let [dir (temp-dir)
               stop-server! (atom nil)
               secret "local-asset-link-test-secret"
               graph-id (str (random-uuid))
               asset-id (random-uuid)]
           (-> (p/let [{:keys [base-url stop!]} (server/start! (assoc {:port 0 :data-dir dir}
                                                                  :asset-link-secret secret))
                       _ (reset! stop-server! stop!)
                       bucket (assets/make-bucket (node-path/join dir "assets"))
                       _ (.put bucket (str graph-id "/" asset-id ".png")
                               (js/Uint8Array. #js [0 255 7]) #js {})
                       link (asset-link/<temporary-url (js/Request. base-url)
                                                       #js {:ASSET_LINK_SECRET secret}
                                                       graph-id asset-id "png")
                       response (js/fetch (:url link))
                       payload (.arrayBuffer response)
                       invalid (js/fetch (str (:url link) "0"))]
                 (is (= 200 (.-status response)))
                 (is (= [0 255 7] (vec (array-seq (js/Uint8Array. payload)))))
                 (is (= 401 (.-status invalid))))
               (p/catch #(is false (str %)))
               (p/finally (fn []
                            (p/let [_ (when-let [stop! @stop-server!] (stop!))]
                              (.rmSync fs dir #js {:recursive true :force true})
                              (done))))))))

(deftest failed-stream-does-not-publish-an-asset
  (async done
         (let [dir (temp-dir)
               bucket (assets/make-bucket dir)
               body (js/ReadableStream.
                     #js {:start (fn [controller]
                                   (.enqueue controller (js/Uint8Array. #js [1 2]))
                                   (.error controller (js/Error. "upload failed")))})]
           (-> (p/let [result (-> (.put bucket "graph/broken.png" body #js {})
                                  (p/then (fn [_] :accepted))
                                  (p/catch (fn [error] (.-message error))))
                       stored (.get bucket "graph/broken.png")]
                 (is (= "upload failed" result))
                 (is (nil? stored))
                 (is (empty? (.readdirSync fs (node-path/join dir "graph")))))
               (p/catch #(is false (str %)))
               (p/finally (fn [] (.rmSync fs dir #js {:recursive true :force true}) (done)))))))
