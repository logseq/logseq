(ns client-steps
  (:require [cljs.test :as t :refer [is]]
            [const]
            [datascript.core :as d]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc-core]
            [helper]
            [frontend.common.missionary :as c.m]
            [logseq.db :as ldb]
            [missionary.core :as m]))

(def ^:private step0
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           tx-data (const/tx-data-map :create-page)]
       (helper/transact! conn tx-data)
       (is (=
            #{[:update-page const/page1-uuid]
              [:update const/page1-uuid
               [[:block/title "[\"~#'\",\"basic-edits-test\"]" true]
                [:block/created-at "[\"~#'\",1724836490809]" true]
                [:block/updated-at "[\"~#'\",1724836490809]" true]
                [:block/type "[\"~#'\",\"page\"]" true]]]
              [:move const/block1-uuid]
              [:update const/block1-uuid
               [[:block/updated-at "[\"~#'\",1724836490810]" true]
                [:block/created-at "[\"~#'\",1724836490810]" true]
                [:block/title "[\"~#'\",\"block1\"]" true]]]}
            (set (map helper/simplify-client-op (client-op/get-all-block-ops const/downloaded-test-repo)))))))
   :client2 nil})

(def ^:private step1
  "client1: start rtc, wait page1, client1->remote
  client2: start rtc, wait page1, remote->client2"
  {:client1
   (m/sp
     (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
       (is (nil? r))
       (m/? (helper/new-task--wait-all-client-ops-sent))))
   :client2
   (m/sp
     (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
       (is (nil? r)))
     (m/?
      (c.m/backoff
       (take 4 c.m/delays)
       (m/sp
         (let [conn (helper/get-downloaded-test-conn)
               page1 (d/pull @conn '[*] [:block/uuid const/page1-uuid])
               block1 (d/pull @conn '[*] [:block/uuid const/block1-uuid])]
           (when-not (:block/uuid page1)
             (throw (ex-info "wait page1 synced" {:missionary/retry true})))
           (is
            (= {:block/title "basic-edits-test"
                :block/name "basic-edits-test"
                :block/type "page"}
               (select-keys page1 [:block/title :block/name :block/type])))
           (is
            (= {:block/title "block1"
                :block/order "a0"
                :block/parent {:db/id (:db/id page1)}}
               (select-keys block1 [:block/title :block/order :block/parent]))))))))})

(def ^:private step2
  "client1: insert 500 blocks, wait for changes to sync to remote
  client2: wait for blocks to sync from remote"
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)]
       (helper/transact! conn (const/tx-data-map :insert-500-blocks))
       (m/? (helper/new-task--wait-all-client-ops-sent))))
   :client2
   (c.m/backoff
    (take 4 c.m/delays)
    (m/sp
      (let [conn (helper/get-downloaded-test-conn)
            page (d/pull @conn '[*] [:block/uuid const/page2-uuid])]
        (when-not (:block/uuid page)
          (throw (ex-info "wait page to be synced" {:missionary/retry true})))
        (let [blocks (ldb/sort-by-order (ldb/get-page-blocks @conn (:db/id page)))]
          (is (= 500 (count blocks)))
          (is (= (map #(str "x" %) (range 500))
                 (map :block/title blocks)))))))})

(def ^:private step3
  "client1:
  1. add #task properties to block1 (`const/block1-uuid`)
  2. wait to be synced
  3. toggle block1 status to TODO
  4. wait to be synced
  5. toggle block1 status to DOING
  6. wait to be synced
  client2:
  1. wait the block&its properties to be synced"
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           tx-data1 (const/tx-data-map :step3-add-task-properties-to-block1)
           tx-data2 (const/tx-data-map :step3-toggle-status-TODO)
           tx-data3 (const/tx-data-map :step3-toggle-status-DOING)]
       (helper/transact! conn tx-data1)
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (helper/transact! conn tx-data2)
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (helper/transact! conn tx-data3)
       (m/? (helper/new-task--wait-all-client-ops-sent))))
   :client2
   (c.m/backoff
    (take 4 c.m/delays)
    (m/sp
      (let [conn (helper/get-downloaded-test-conn)
            block1 (d/pull @conn
                           [{:block/tags [:db/ident]}
                            {:logseq.task/status [:db/ident]}
                            {:logseq.task/deadline [:block/journal-day]}]
                           [:block/uuid const/block1-uuid])]
        (when-not (= :logseq.task/status.doing (:db/ident (:logseq.task/status block1)))
          (throw (ex-info "wait block1's task properties to be synced" {:missionary/retry true})))
        (is (= {:block/tags [{:db/ident :logseq.class/Task}],
                :logseq.task/status {:db/ident :logseq.task/status.doing}
                :logseq.task/deadline {:block/journal-day 20240907}}
               block1)))))})
(def ^:private step4
  "client1:

  client2:
"
  {:client1
   (m/sp nil)
   :client2
   (m/sp nil)})

(def ^:private step5
  "client1:
  - insert some blocks in page2
  - wait to be synced
  - wait a signal from client2
  - send a signal to client2
  - stop rtc
  - move some blocks
  - start rtc
  - wait to be synced
  - wait client2's message, which contains the result of client2's block tree,
    and compare them with blocks in client1
  client2:
  - wait inserted blocks synced
  - send a signal to client1
  - wait a signal from client1
  - stop rtc
  - move some blocks
  - start rtc
  - wait to be synced
  - send a message to client1 contains client2's block tree to client1"
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           tx-data1 (const/tx-data-map :move-blocks-concurrently-1)
           tx-data2 (const/tx-data-map :move-blocks-concurrently-client1)]
       (helper/transact! conn tx-data1)
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (m/? (helper/new-task--client1-sync-barrier-2->1 "move-blocks-concurrently-signal"))
       (m/? helper/new-task--stop-rtc)
       (helper/transact! conn tx-data2)
       (is (nil? (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))))
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (m/? (helper/new-task--client1-sync-barrier-2->1 "step5"))
       (let [message (m/? (helper/new-task--wait-message-from-other-client
                           (fn [message] (= "move-blocks-concurrently-page-blocks" (:id message)))
                           :retry-message "move-blocks-concurrently-page-blocks"))
             client2-page-blocks (:page-blocks message)
             client1-page-blocks (ldb/get-page-blocks @conn (:db/id (d/entity @conn [:block/uuid const/page3-uuid]))
                                                      :pull-keys '[:block/uuid :block/title :block/order
                                                                   {:block/parent [:block/uuid]}])]
         (is (= (set client1-page-blocks) (set client2-page-blocks))))))
   :client2
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)]
       (m/?
        (c.m/backoff
         (take 4 c.m/delays)
         (m/sp
           (let [page3 (d/pull @conn '[*] [:block/uuid const/page3-uuid])
                 page3-blocks (some->> (:db/id page3)
                                       (ldb/get-page-blocks @conn))]
             (when-not (:block/uuid page3)
               (throw (ex-info "wait page3 synced" {:missionary/retry true})))
             (is (= 6 (count page3-blocks)))))))
       (m/? (helper/new-task--client2-sync-barrier-2->1 "move-blocks-concurrently-signal"))
       (m/? helper/new-task--stop-rtc)
       (helper/transact! conn (const/tx-data-map :move-blocks-concurrently-client2))
       (is (nil? (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))))
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (m/? (helper/new-task--client2-sync-barrier-2->1 "step5"))
       (m/? (helper/new-task--send-message-to-other-client
             {:id "move-blocks-concurrently-page-blocks"
              :page-blocks (ldb/get-page-blocks @conn (:db/id (d/entity @conn [:block/uuid const/page3-uuid]))
                                                :pull-keys '[:block/uuid :block/title :block/order
                                                             {:block/parent [:block/uuid]}])}))))})

(def ^:private step6
  "Delete blocks test-1
client1:
- insert some blocks
- wait to be synced
- stop rtc
- delete blocks
- start rtc
- wait to be synced

client2:
- wait blocks from client1
- wait delete-blocks changes synced from client1
- check block-tree"
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           tx-data1 (const/tx-data-map :step6-delete-blocks-client1-1)
           tx-data2 (const/tx-data-map :step6-delete-blocks-client1-2)]
       (helper/transact! conn tx-data1)
       (m/? (helper/new-task--wait-all-client-ops-sent))
       (m/? (helper/new-task--client1-sync-barrier-1->2 "step6"))
       (m/? helper/new-task--stop-rtc)
       (helper/transact! conn tx-data2)
       (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
         (is (nil? r))
         (m/? (helper/new-task--wait-all-client-ops-sent)))))
   :client2
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)]
       (m/? (helper/new-task--client2-sync-barrier-1->2 "step6"))
       (m/?
        (c.m/backoff
         (take 4 c.m/delays)
         (m/sp
           (let [page (d/pull @conn '[*] [:block/uuid const/step6-page-uuid])
                 page-blocks (when-let [page-id (:db/id page)]
                               (ldb/get-page-blocks @conn page-id
                                                    :pull-keys '[:block/uuid {:block/parent [:block/uuid]}]))]
             (when-not (= 1 (count page-blocks))
               (throw (ex-info "wait delete-blocks changes synced"
                               {:missionary/retry true
                                :page-blocks page-blocks})))
             (is (= {:block/uuid const/step6-block3-uuid
                     :block/parent {:block/uuid const/step6-page-uuid}}
                    (select-keys (first page-blocks) [:block/uuid :block/parent])))))))))})

(defn- wrap-print-step-info
  [steps client]
  (map-indexed
   (fn [idx step]
     (m/sp
       (helper/log "start step" idx)
       (some-> (get step client) m/?)
       (helper/log "end step" idx)))
   steps))

(def ^:private all-steps [step0 step1 step2 step3 step4 step5 step6])

(def client1-steps
  (wrap-print-step-info all-steps :client1))

(def client2-steps
  (wrap-print-step-info all-steps :client2))
