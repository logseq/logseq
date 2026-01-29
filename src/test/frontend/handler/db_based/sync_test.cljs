(ns frontend.handler.db-based.sync-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest remove-member-request-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))]
                 (p/let [_ (db-sync/<rtc-remove-member! "graph-1" "user-2")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-2" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-uses-current-user-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               user-handler/user-uuid (fn [] "user-1")]
                 (p/let [_ (db-sync/<rtc-leave-graph! "graph-1")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-1" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-missing-user-test
  (async done
         (-> (p/with-redefs [user-handler/user-uuid (fn [] nil)]
               (db-sync/<rtc-leave-graph! "graph-1"))
             (p/then (fn [_]
                       (is false "expected rejection")
                       (done)))
             (p/catch (fn [e]
                        (is (= :db-sync/invalid-member (:type (ex-data e))))
                        (done))))))

(deftest rtc-start-skips-when-graph-missing-from-remote-list-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "repo-other"}])
                               state/<invoke-db-worker (fn [& args]
                                                         (reset! called args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "repo-current"))
               (p/then (fn [_]
                         (is (nil? @called))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-start-invokes-worker-when-graph-in-remote-list-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "repo-current"}])
                               state/<invoke-db-worker (fn [& args]
                                                         (reset! called args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "repo-current"))
               (p/then (fn [_]
                         (is (= [:thread-api/db-sync-start "repo-current"] @called))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))
