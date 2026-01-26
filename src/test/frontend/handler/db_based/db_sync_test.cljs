(ns frontend.handler.db-based.db-sync-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.handler.db-based.db-sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [promesa.core :as p]))

(deftest download-graph-e2ee-detection-test
  (async done
         (with-redefs [db-sync/fetch-json (fn [_ _ _]
                                            (p/resolved {:encrypted-aes-key "k"}))]
           (-> (p/let [enabled? (#'db-sync/fetch-graph-e2ee? "http://base" "graph-1")]
                 (is (true? enabled?))
                 (done))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest download-graph-e2ee-missing-key-test
  (async done
         (with-redefs [db-sync/fetch-json (fn [_ _ _]
                                            (p/resolved {}))]
           (-> (p/let [enabled? (#'db-sync/fetch-graph-e2ee? "http://base" "graph-1")]
                 (is (false? enabled?))
                 (done))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest remove-member-request-test
  (async done
         (let [called (atom nil)]
           (with-redefs [db-sync/http-base (fn [] "http://base")
                         db-sync/fetch-json (fn [url opts _]
                                              (reset! called {:url url :opts opts})
                                              (p/resolved {:ok true}))
                         user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                     (resolve true))]
             (-> (p/let [_ (db-sync/<rtc-remove-member! "graph-1" "user-2")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-2" url))
                   (is (= "DELETE" (:method opts)))
                   (done))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))

(deftest leave-graph-uses-current-user-test
  (async done
         (let [called (atom nil)]
           (with-redefs [db-sync/http-base (fn [] "http://base")
                         db-sync/fetch-json (fn [url opts _]
                                              (reset! called {:url url :opts opts})
                                              (p/resolved {:ok true}))
                         user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                     (resolve true))
                         user-handler/user-uuid (fn [] "user-1")]
             (-> (p/let [_ (db-sync/<rtc-leave-graph! "graph-1")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-1" url))
                   (is (= "DELETE" (:method opts)))
                   (done))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))

(deftest leave-graph-missing-user-test
  (async done
         (with-redefs [user-handler/user-uuid (fn [] nil)]
           (-> (db-sync/<rtc-leave-graph! "graph-1")
               (p/then (fn [_]
                         (is false "expected rejection")
                         (done)))
               (p/catch (fn [e]
                          (is (= :db-sync/invalid-member (:type (ex-data e))))
                          (done)))))))
