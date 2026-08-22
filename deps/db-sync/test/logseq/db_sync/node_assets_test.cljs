(ns logseq.db-sync.node-assets-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [logseq.db-sync.node.assets :as assets]
            [promesa.core :as p]))

(deftest filesystem-bucket-consumes-readable-stream-test
  (async done
         (let [directory (.mkdtempSync fs (node-path/join (.tmpdir os) "db-sync-assets-test-"))
               bucket (assets/make-bucket directory)
               payload (js/Uint8Array. #js [1 2 3 4])
               stream (js/ReadableStream.
                       #js {:start (fn [controller]
                                     (.enqueue controller payload)
                                     (.close controller))})]
           (-> (p/let [_ (.put bucket "graph-1/asset-1.bin" stream #js {})
                       stored (.get bucket "graph-1/asset-1.bin")
                       stored-bytes (js/Uint8Array. (.-body stored))]
                 (is (= 4 (.-byteLength stored-bytes)))
                 (is (= 1 (aget stored-bytes 0)))
                 (is (= 2 (aget stored-bytes 1)))
                 (is (= 3 (aget stored-bytes 2)))
                 (is (= 4 (aget stored-bytes 3))))
               (p/then (fn []
                         (.rmSync fs directory #js {:recursive true :force true})
                         (done)))
               (p/catch (fn [error]
                          (.rmSync fs directory #js {:recursive true :force true})
                          (is false (str error))
                          (done)))))))
