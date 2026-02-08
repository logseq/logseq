(ns logseq.db-sync.worker-dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [promesa.core :as p]))

(deftest sync-root-returns-bad-request-test
  (async done
         (let [request (js/Request. "http://localhost/sync?graph-id=graph-1"
                                   #js {:method "GET"})
               resp (dispatch/handle-worker-fetch request #js {})]
           (-> (p/let [resp resp
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                 (is (= 400 (.-status resp)))
                 (is (= "missing graph id" (:error body))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

