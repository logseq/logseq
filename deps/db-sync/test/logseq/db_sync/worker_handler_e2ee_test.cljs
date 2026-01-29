(ns logseq.db-sync.worker-handler-e2ee-test
  (:require [cljs.test :refer [deftest is async]]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.handler.index :as handler]
            [logseq.db-sync.worker.routes.index :as routes]
            [promesa.core :as p]))

(deftest graph-aes-key-get-missing-key-returns-404-test
  (async done
         (let [route (routes/match-route "GET" "/e2ee/graphs/graph-1/aes-key")
               claims #js {"sub" "user-1"}]
           (-> (p/with-redefs [index/<user-has-access-to-graph? (fn [_db _graph-id _user-id]
                                                                  (p/resolved true))
                               index/<graph-encrypted-aes-key (fn [_db _graph-id _user-id]
                                                                (p/resolved nil))]
                 (p/let [resp (handler/handle {:db :fake
                                               :request nil
                                               :claims claims
                                               :route route})
                         status (.-status resp)
                         text (.text resp)
                         body (when (seq text)
                                (js->clj (js/JSON.parse text) :keywordize-keys true))]
                   (is (= 404 status))
                   (is (= "encrypted aes key missing" (:error body)))))
               (p/catch (fn [e]
                          (is false (str e))))
               (p/finally (fn [] (done)))))))
