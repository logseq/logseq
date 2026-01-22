(ns logseq.db-sync.worker-routing-test
  (:require [cljs.test :refer [deftest is async]]
            [logseq.db-sync.worker :as worker]))

(deftest e2ee-route-uses-index-handler-test
  (async done
         (let [called (atom nil)
               req (js/Request. "http://localhost/e2ee/user-keys" #js {:method "GET"})
               env #js {:DB :db}]
           (with-redefs [worker/handle-index-fetch (fn [_ request]
                                                     (reset! called request)
                                                     (js/Response. "ok"))]
             (let [resp (#'worker/handle-worker-fetch req env)]
               (-> (.text resp)
                   (.then (fn [text]
                            (is (= "ok" text))
                            (is (some? @called))
                            (done)))
                   (.catch (fn [e]
                             (is false (str e))
                             (done)))))))))
