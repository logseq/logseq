(ns frontend.handler.db-based.sync-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
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

(deftest rtc-download-graph-emits-feedback-before-snapshot-fetch-test
  (let [trace (atom [])
        log-events (atom [])]
    (with-redefs [db-sync/http-base (fn [] "http://base")
                  state/set-state! (fn [k v]
                                     (swap! trace conj [:set k v]))
                  state/pub-event! (fn [[event payload :as e]]
                                     (when (and (= :rtc/log event)
                                                (= "graph-1" (:graph-uuid payload)))
                                       (swap! trace conj :log)
                                       (swap! log-events conj e)))
                  ;; Keep auth pending so we only validate immediate click-time feedback.
                  user-handler/task--ensure-id&access-token (fn [_resolve _reject] nil)
                  db-sync/fetch-json (fn [url _opts _schema]
                                       (swap! trace conj [:fetch url])
                                       (p/resolved {:t 1}))]
      (db-sync/<rtc-download-graph! "demo-graph" "graph-1")
      (is (= [[:set :rtc/downloading-graph-uuid "graph-1"] :log]
             (take 2 @trace)))
      (let [[event {:keys [type sub-type graph-uuid message]}] (first @log-events)]
        (is (= :rtc/log event))
        (is (= :rtc.log/download type))
        (is (= :download-progress sub-type))
        (is (= "graph-1" graph-uuid))
        (is (and (string? message)
                 (string/includes? message "Preparing")))))))
