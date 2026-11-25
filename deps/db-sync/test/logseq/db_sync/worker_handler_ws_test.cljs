(ns logseq.db-sync.worker-handler-ws-test
  (:require ["better-sqlite3" :as sqlite3]
            ["node:fs" :as fs]
            [cljs-bean.core :as bean]
            [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.discussion-push :as discussion-push]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.presence :as presence]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]))

(deftest presence-message-broadcast-excludes-source-client-test
  (let [source-ws #js {:readyState 1}
        peer-ws #js {:readyState 1}
        send-events (atom [])
        self #js {:state #js {:getWebSockets (fn [] #js [source-ws peer-ws])}}
        raw (protocol/encode-message {:type "presence"
                                      :editing-block-uuid "block-1"})]
    (with-redefs [presence/get-user (fn [_self _ws] {:user-id "user-1"})
                  presence/update-presence! (fn [_self _ws _patch] nil)
                  ws/send! (fn [target msg]
                             (swap! send-events conj {:ws target
                                                      :msg msg}))]
      (ws-handler/handle-ws-message! self source-ws raw))

    (is (= [peer-ws]
           (mapv :ws @send-events)))
    (is (= [{:type "presence"
             :editing-block-uuid "block-1"
             :user-id "user-1"}]
           (mapv :msg @send-events)))))

(deftest hello-message-includes-checksum-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        ws #js {:readyState 1}
        sent (atom nil)
        self #js {:conn conn
                  :schema-ready true
                  :sql sql}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"})]
    (d/transact! conn [{:block/uuid (random-uuid)
                        :block/title "hello"}])
    (with-redefs [ws/send! (fn [_target msg]
                             (reset! sent msg))]
      (ws-handler/handle-ws-message! self ws raw))
    (is (= "hello" (:type @sent)))
    (is (number? (:t @sent)))
    (is (string? (:checksum @sent)))))

(deftest hello-message-omits-nil-checksum-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        ws #js {:readyState 1}
        sent (atom nil)
        self #js {:conn conn
                  :schema-ready true
                  :sql sql}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"})]
    (with-redefs [ws/send! (fn [_target msg]
                             (reset! sent msg))]
      (ws-handler/handle-ws-message! self ws raw))
    (is (= "hello" (:type @sent)))
    (is (false? (contains? @sent :checksum)))))

(deftest tx-batch-message-adds-graph-and-user-context-to-transact-meta-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        ws #js {:readyState 1}
        sent (atom nil)
        tx-metas (atom [])
        self #js {:conn conn
                  :graph-id "graph-ws"
                  :schema-ready true
                  :sql sql}
        raw (protocol/encode-message
             {:type "tx/batch"
              :client-revision "revision-ws"
              :t-before 0
              :txs [{:tx (protocol/tx->transit [[:db/add -1 :block/title "ws context"]])
                     :outliner-op :save-block}]})]
    (with-redefs [presence/get-user (fn [_self _ws]
                                      {:user-id "user-1"
                                       :username "alice"})
                  ws/broadcast! (fn [& _] nil)
                  ws/send! (fn [_target msg]
                             (reset! sent msg))]
      (d/listen! conn ::capture-ws-context-tx-meta
                 (fn [tx-report]
                   (swap! tx-metas conj (:tx-meta tx-report))))
      (try
        (ws-handler/handle-ws-message! self ws raw)
        (finally
          (d/unlisten! conn ::capture-ws-context-tx-meta))))
    (is (= "tx/batch/ok" (:type @sent)))
    (is (some #(= {:op :apply-client-tx
                   :outliner-op :save-block
                   :graph-id "graph-ws"
                   :client-revision "revision-ws"
                   :username "alice"}
                  (select-keys % [:op :outliner-op :graph-id :client-revision :username]))
              @tx-metas))))

(deftest ws-send-serializes-tx-reject-uuids-as-strings-test
  (let [raw* (atom nil)
        ws #js {:readyState 1
                :send (fn [raw] (reset! raw* raw))}
        success-tx-id (random-uuid)
        failed-tx-id (random-uuid)]
    (ws/send! ws {:type "tx/reject"
                  :reason "db transact failed"
                  :t 3
                  :success-tx-ids [success-tx-id]
                  :failed-tx-id failed-tx-id})
    (let [message (-> @raw* js/JSON.parse (js->clj :keywordize-keys true))]
      (is (= "tx/reject" (:type message)))
      (is (= [(str success-tx-id)] (:success-tx-ids message)))
      (is (= (str failed-tx-id) (:failed-tx-id message))))))

(deftest ws-send-serializes-pull-ok-tx-id-as-string-test
  (let [raw* (atom nil)
        ws #js {:readyState 1
                :send (fn [raw] (reset! raw* raw))}
        tx-id (random-uuid)]
    (ws/send! ws {:type "pull/ok"
                  :t 1
                  :txs [{:t 1 :tx "canonical Transit" :outliner-op :save-block :tx-id tx-id}]})
    (let [parsed (js/JSON.parse @raw*)
          raw-tx-id (aget parsed "txs" 0 "tx-id")
          coerced (ws/coerce-ws-server-message (js->clj parsed :keywordize-keys true))]
      (is (string? raw-tx-id))
      (is (= (str tx-id) raw-tx-id))
      (is (= tx-id (get-in coerced [:txs 0 :tx-id]))))))

(deftest online-users-broadcast-restored-attachment-user-test
  (let [attachment* (atom nil)
        ws #js {:readyState 1
                :serializeAttachment (fn [attachment]
                                       (reset! attachment* attachment))
                :deserializeAttachment (fn []
                                         @attachment*)}
        self #js {}
        restored-self #js {}
        user {:user-id "user-1"
              :email "user@example.com"
              :username "alice"}
        sent (atom nil)]
    (presence/add-presence! self ws user)
    (is (= {:presence/user user}
           (bean/->clj (.deserializeAttachment ws))))
    (swap! (presence/presence* restored-self)
           assoc
           ws
           (presence/attachment->user (.deserializeAttachment ws)))
    (with-redefs [ws/broadcast! (fn [_self _sender message]
                                  (reset! sent message))]
      (presence/broadcast-online-users! restored-self))
    (is (= {:type "online-users"
            :online-users [user]}
           @sent))))

(deftest websocket-connection-is-rejected-while-snapshot-upload-is-in-progress-test
  (async done
         (let [accepted (atom [])
               presence-events (atom [])
               self #js {:state #js {:acceptWebSocket (fn [socket]
                                                        (swap! accepted conj socket))}}
               request (js/Request. "http://localhost/sync/graph-1/ws?graph-id=graph-1"
                                    #js {:method "GET"})]
           (-> (p/with-redefs [sync-handler/<ready-for-sync? (fn [_ _] (p/resolved false))
                               presence/add-presence! (fn [& _]
                                                        (swap! presence-events conj :add))
                               presence/broadcast-online-users! (fn [& _]
                                                                  (swap! presence-events conj :broadcast))]
                 (ws-handler/handle-ws self request))
               (p/then (fn [response]
                         (is (= 409 (.-status response)))
                         (is (empty? @accepted))
                         (is (empty? @presence-events))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest websocket-connection-uses-graph-id-from-sync-path-test
  (async done
         (let [seen-graph-id (atom ::unset)
               self #js {}
               request (js/Request. "http://localhost/sync/graph-from-path"
                                    #js {:method "GET"})]
           (-> (p/with-redefs [sync-handler/<ready-for-sync? (fn [_self graph-id]
                                                               (reset! seen-graph-id graph-id)
                                                               (p/resolved false))]
                 (ws-handler/handle-ws self request))
               (p/then (fn [response]
                         (is (= "graph-from-path" @seen-graph-id))
                         (is (= 409 (.-status response)))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest tx-batch-from-hibernated-socket-keeps-its-graph
  (let [attachment (atom nil)
        ws #js {:serializeAttachment #(reset! attachment %)
                :deserializeAttachment #(deref attachment)}
        account (str (random-uuid))
        graph (str (random-uuid))
        original #js {:graph-id graph}
        restored #js {}
        context (atom nil)
        raw (protocol/encode-message
             {:type "tx/batch"
              :t-before 0
              :txs [{:tx (protocol/tx->transit [[:db/add -1 :block/title "reply"]])
                     :outliner-op :save-block}]})]
    (presence/add-presence! original ws {:user-id account})
    (swap! (presence/presence* restored) assoc ws (presence/attachment->user @attachment))
    (with-redefs [sync-handler/handle-tx-batch! (fn
                                                 ([_ _ _ _] {:type "tx/batch/ok"})
                                                 ([_ _ _ _ request-context]
                                                  (reset! context request-context)
                                                  {:type "tx/batch/ok"}))
                  ws/send! (fn [_ _] nil)]
      (ws-handler/handle-ws-message! restored ws raw))
    (is (= {:graph-id graph :account account} @context))))

(deftest discussion-push-finds-new-comments-and-reactions-in-a-transaction-report
  (let [owner (random-uuid)
        participant (random-uuid)
        author (random-uuid)
        page-owner (random-uuid)
        later-participant (random-uuid)
        target (random-uuid)
        comment-id (random-uuid)
        reaction (random-uuid)
        conn (d/create-conn
              {:block/uuid {:db/unique :db.unique/identity}
               :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
               :block/parent {:db/valueType :db.type/ref}
               :logseq.property/created-by-ref {:db/valueType :db.type/ref}
               :logseq.property.comments/blocks {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
               :logseq.property.reaction/target {:db/valueType :db.type/ref}})]
    (d/transact! conn [{:db/id -1 :block/uuid owner}
                       {:db/id -2 :block/uuid participant}
                       {:db/id -3 :block/uuid author :logseq.property.user/name "Ada"}
                       {:db/id -4 :block/uuid target :logseq.property/created-by-ref -1 :block/parent -9}
                       {:db/id -5 :db/ident :logseq.class/Comments}
                       {:db/id -6 :block/uuid (random-uuid) :block/tags [-5] :logseq.property.comments/blocks [-4]}
                       {:db/id -7 :block/uuid (random-uuid) :block/parent -6 :logseq.property/created-by-ref -2
                        :block/order "a0" :block/created-at 400}
                       {:db/id -8 :block/uuid page-owner}
                       {:db/id -9 :block/uuid (random-uuid) :logseq.property/created-by-ref -8}
                       {:db/id -10 :block/uuid later-participant}
                       {:db/id -11 :block/uuid (random-uuid) :block/parent -6 :logseq.property/created-by-ref -10
                        :block/order "a2" :block/created-at 100}])
    (let [thread (-> (d/entity @conn [:block/uuid target]) :logseq.property.comments/_blocks first :db/id)
          {:keys [db-before db-after tx-data]}
          (d/transact! conn [{:block/uuid comment-id :block/parent thread
                              :block/order "a1" :block/created-at 200 :block/title "Thanks!\nLooks good."
                              :logseq.property/created-by-ref [:block/uuid author]}
                             {:block/uuid reaction :logseq.property.reaction/emoji-id "heart"
                              :logseq.property.reaction/target [:block/uuid target]
                              :logseq.property/created-by-ref [:block/uuid author]}])
          routes (discussion-push/event-routes db-before db-after tx-data (str author))]
      (is (= {(str comment-id) #{(str owner) (str participant)}
              (str reaction) #{(str owner)}}
             (into {} (map (juxt :event (comp set :recipients))) routes)))
      (is (= {(str comment-id) "comment" (str reaction) "reaction"}
             (into {} (map (juxt :event :kind)) routes)))
      (is (= {"comment" ["Ada" "Thanks! Looks good." nil] "reaction" ["Ada" nil "❤️"]}
             (into {} (map (juxt :kind (juxt :sender-name :comment-preview :reaction))) routes)))
      (is (empty? (discussion-push/event-routes db-before db-after tx-data (str owner)))))))

(deftest discussion-push-refresh-and-enqueue-respect-installation-preferences
  (async done
    (let [sqlite (new sqlite3 ":memory:")
          db #js {:prepare (fn [query]
                             #js {:bind (fn [& args]
                                          #js {:run (fn []
                                                      (let [stmt (.prepare sqlite query)]
                                                        (.apply (.-run stmt) stmt (to-array args))))})})
                  :batch (fn [statements]
                           ((.transaction sqlite
                                          (fn [] (doseq [stmt (array-seq statements)] (.run stmt))))))}
          env #js {:DB db :DISCUSSION_PUSH_ENABLED "true"}
          sender (str (random-uuid))
          recipient (str (random-uuid))
          graph (str (random-uuid))
          installation (str (random-uuid))
          disabled-installation (str (random-uuid))
          token (apply str (repeat 32 "a"))
          new-token (apply str (repeat 32 "b"))
          request! (fn [method body]
                     (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved #js {:sub recipient}))]
                       (discussion-push/<register
                        (js/Request. "https://example.com/mobile/push-device"
                                     #js {:method method :body (js/JSON.stringify (clj->js body))})
                        env)))
          queue! (fn [id kind]
                   (discussion-push/<queue-events! env graph sender
                                                  [{:event id :kind kind :recipients [recipient]}]))]
      (doseq [migration ["0001_init.sql" "0002_add_graph_e2ee.sql" "0008_add_discussion_push.sql"
                         "0009_discussion_push_preferences.sql" "0010_discussion_push_previews.sql"]]
        (.exec sqlite (fs/readFileSync (str "worker/migrations/" migration) "utf8")))
      (.run (.prepare sqlite "INSERT INTO graphs (graph_id, user_id) VALUES (?, ?)") graph sender)
      (.run (.prepare sqlite "INSERT INTO graph_members (graph_id, user_id, role) VALUES (?, ?, 'member')") graph recipient)
      (-> (p/let [first-response (request! "PUT" {:installationId installation :platform "apns" :token token
                                                  :comments false :reactions true})
                  disabled (request! "PUT" {:installationId disabled-installation :platform "apns" :token (apply str (repeat 32 "c"))
                                            :comments false :reactions false})]
            (is (= 204 (.-status first-response) (.-status disabled)))
            (p/let [refresh (request! "PUT" {:installationId installation :platform "apns" :token new-token})
                    _ (queue! "comment-event" "comment")
                    _ (queue! "reaction-event" "reaction")]
              (is (= 204 (.-status refresh)))
              (is (= new-token (.-token (.get (.prepare sqlite "SELECT token FROM discussion_push_devices WHERE installation_id = ?")
                                              installation))))
              (is (= 0 (.-comments (.get (.prepare sqlite "SELECT comments FROM discussion_push_devices WHERE installation_id = ?")
                                                 installation))))
              (is (= ["reaction-event"]
                     (mapv #(.-event_id %) (array-seq (.all (.prepare sqlite "SELECT event_id FROM discussion_push_outbox"))))))
              (p/let [unregistered (request! "DELETE" {:installationId installation})
                      _ (queue! "only-opted-out" "reaction")]
                (is (= 204 (.-status unregistered)))
                (is (= ["reaction-event"]
                       (mapv #(.-event_id %) (array-seq (.all (.prepare sqlite "SELECT event_id FROM discussion_push_outbox")))))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally (fn [] (.close sqlite) (done)))))))
