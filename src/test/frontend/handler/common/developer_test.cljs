(ns frontend.handler.common.developer-test
  (:require ["/frontend/utils" :as utils]
            [cljs.test :refer [async deftest is testing]]
            [frontend.handler.common.developer :as developer]
            [frontend.handler.db-based.sync :as db-sync-handler]
            [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- run-recompute!
  ([diagnostics]
   (run-recompute! diagnostics {}))
  ([diagnostics {:keys [server-diagnostics]}]
   (let [warnings* (atom [])
         notifications* (atom [])
         saves* (atom [])
         fetch-calls* (atom [])
         original-warn (.-warn js/console)]
     (set! (.-warn js/console) (fn [& args]
                                 (swap! warnings* conj args)))
     (-> (p/with-redefs [state/get-current-repo (constantly "repo-1")
                         state/<invoke-db-worker (fn [& _]
                                                   (p/resolved diagnostics))
                         utils/saveToFile (fn [& args]
                                            (swap! saves* conj args))
                         notification/show! (fn [& args]
                                              (swap! notifications* conj args))
                         db/get-db (fn [& _] :fake-db)
                         ldb/get-graph-rtc-uuid (fn [_] "graph-1")
                         db-sync-handler/http-base (fn [] "https://sync.example.test")
                         db-sync-handler/fetch-json (fn [url opts schema]
                                                      (swap! fetch-calls* conj {:url url
                                                                                :opts opts
                                                                                :schema schema})
                                                      (p/resolved server-diagnostics))]
           (developer/recompute-checksum-diagnostics))
         (p/then (fn [_]
                   {:warnings @warnings*
                    :notifications @notifications*
                    :saves @saves*
                    :fetch-calls @fetch-calls*}))
         (p/finally (fn []
                      (set! (.-warn js/console) original-warn)))))))

(deftest recompute-checksum-diagnostics-logs-diff-data-on-client-server-mismatch-test
  (async done
         (-> (run-recompute! {:recomputed-checksum "cccccccccccccccc"
                              :local-checksum "aaaaaaaaaaaaaaaa"
                              :remote-checksum "bbbbbbbbbbbbbbbb"
                              :e2ee? false
                              :checksum-attrs [:block/title]
                              :blocks [{:block/uuid #uuid "00000000-0000-0000-0000-000000000001"
                                        :block/title "local-alpha"}
                                       {:block/uuid #uuid "00000000-0000-0000-0000-000000000002"
                                        :block/title "local-only"}]}
                             {:server-diagnostics {:checksum "bbbbbbbbbbbbbbbb"
                                                   :e2ee? false
                                                   :attrs [:block/title]
                                                   :blocks [{:block/uuid "00000000-0000-0000-0000-000000000001"
                                                             :block/title "server-alpha"}
                                                            {:block/uuid "00000000-0000-0000-0000-000000000003"
                                                             :block/title "server-only"}]}})
             (p/then (fn [{:keys [warnings fetch-calls]}]
                       (is (= 1 (count fetch-calls)))
                       (is (= 1 (count warnings)))
                       (let [[message diff-data] (first warnings)]
                         (is (= "Checksum mismatch between client and server. Diff data:" message))
                         (is (= "repo-1" (:repo diff-data)))
                         (is (= "aaaaaaaaaaaaaaaa" (:local-checksum diff-data)))
                         (is (= "bbbbbbbbbbbbbbbb" (:remote-checksum diff-data)))
                         (is (= "cccccccccccccccc" (:recomputed-checksum diff-data)))
                         (is (= "bbbbbbbbbbbbbbbb" (:server-checksum diff-data)))
                         (is (= 3 (count (:different-blocks diff-data))))
                         (is (= "server-alpha"
                                (some->> (:different-blocks diff-data)
                                         (filter #(= "00000000-0000-0000-0000-000000000001"
                                                     (:block/uuid %)))
                                         first
                                         :server-block
                                         :block/title))))))
             (p/catch (fn [error]
                        (is false (str error))))
             (p/finally done))))

(deftest recompute-checksum-diagnostics-skips-diff-log-when-client-and-server-match-test
  (async done
         (-> (run-recompute! {:recomputed-checksum "aaaaaaaaaaaaaaaa"
                              :local-checksum "aaaaaaaaaaaaaaaa"
                              :remote-checksum "aaaaaaaaaaaaaaaa"
                              :e2ee? false
                              :checksum-attrs [:block/title]
                              :blocks []})
             (p/then (fn [{:keys [warnings fetch-calls]}]
                       (is (empty? warnings))
                       (is (empty? fetch-calls))))
             (p/catch (fn [error]
                        (is false (str error))))
             (p/finally done))))

(deftest recompute-checksum-diagnostics-skips-diff-log-with-missing-server-checksum-test
  (async done
         (-> (run-recompute! {:recomputed-checksum "aaaaaaaaaaaaaaaa"
                              :local-checksum "aaaaaaaaaaaaaaaa"
                              :remote-checksum nil
                              :e2ee? false
                              :checksum-attrs [:block/title]
                              :blocks []})
             (p/then (fn [{:keys [warnings fetch-calls]}]
                       (is (empty? warnings))
                       (is (empty? fetch-calls))))
             (p/catch (fn [error]
                        (is false (str error))))
             (p/finally done))))
