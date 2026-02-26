(ns logseq.db-sync.worker-handler-assets-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.worker.handler.assets :as assets]
            [promesa.core :as p]))

(deftest assets-get-includes-content-length-header-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/snapshot-1.snapshot"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (js/Promise.resolve
                                     #js {:body payload
                                          :size 4
                                          :httpMetadata #js {:contentType "application/octet-stream"}}))}}]
           (-> (p/let [resp (assets/handle request env)]
                 (is (= 200 (.-status resp)))
                 (is (= "4" (.get (.-headers resp) "content-length"))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
