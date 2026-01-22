(ns logseq.db-sync.malli-schema
  (:require [malli.core :as ma]
            [malli.transform :as mt]))

(def tx-log-entry-schema
  [:map
   [:t :int]
   [:tx :string]])

(def ws-client-message-schema
  [:multi {:dispatch :type}
   ["hello"
    [:map
     [:type [:= "hello"]]
     [:client :string]]]
   ["presence"
    [:map
     [:type [:= "presence"]]
     [:editing-block-uuid {:optional true} [:maybe :string]]]]
   ["pull"
    [:map
     [:type [:= "pull"]]
     [:since {:optional true} :int]]]
   ["tx/batch"
    [:map
     [:type [:= "tx/batch"]]
     [:t-before :int]
     [:txs :string]]]
   ["ping"
    [:map
     [:type [:= "ping"]]]]])

(def tx-reject-reason-schema
  [:enum "stale" "cycle" "empty tx data" "invalid tx" "invalid t-before"])

(def tx-reject-schema
  [:map
   [:type [:= "tx/reject"]]
   [:reason tx-reject-reason-schema]
   [:t {:optional true} :int]
   [:data {:optional true} :string]])

(def user-presence-schema
  [:map
   [:user-id :string]
   [:email {:optional true} [:maybe :string]]
   [:username {:optional true} [:maybe :string]]
   [:name {:optional true} [:maybe :string]]
   [:editing-block-uuid {:optional true} [:maybe :string]]])

(def online-users-schema
  [:map
   [:type [:= "online-users"]]
   [:online-users [:sequential user-presence-schema]]])

(def pull-ok-schema
  [:map
   [:type [:= "pull/ok"]]
   [:t :int]
   [:txs [:sequential tx-log-entry-schema]]])

(def tx-batch-ok-schema
  [:map
   [:type [:= "tx/batch/ok"]]
   [:t :int]])

(def ws-server-message-schema
  [:multi {:dispatch :type}
   ["hello"
    [:map
     [:type [:= "hello"]]
     [:t :int]]]
   ["online-users" online-users-schema]
   ["pull/ok" pull-ok-schema]
   ["tx/batch/ok" tx-batch-ok-schema]
   ["changed"
    [:map
     [:type [:= "changed"]]
     [:t :int]]]
   ["tx/reject" tx-reject-schema]
   ["pong"
    [:map
     [:type [:= "pong"]]]]
   ["error"
    [:map
     [:type [:= "error"]]
     [:message :string]]]])

(def http-error-response-schema
  [:map
   [:error :string]])

(def http-ok-response-schema
  [:map
   [:ok :boolean]])

(def graph-member-role-schema
  [:enum "manager" "member"])

(def graph-info-schema
  [:map
   [:graph-id :string]
   [:graph-name :string]
   [:schema-version {:optional true} [:maybe :string]]
   [:role {:optional true} [:maybe graph-member-role-schema]]
   [:invited-by {:optional true} [:maybe :string]]
   [:created-at :int]
   [:updated-at :int]])

(def graph-member-info-schema
  [:map
   [:user-id :string]
   [:graph-id :string]
   [:role graph-member-role-schema]
   [:invited-by {:optional true} [:maybe :string]]
   [:created-at :int]
   [:email {:optional true} [:maybe :string]]
   [:username {:optional true} [:maybe :string]]])

(def graph-members-list-response-schema
  [:map
   [:members [:sequential graph-member-info-schema]]])

(def graphs-list-response-schema
  [:map
   [:graphs [:sequential graph-info-schema]]])

(def graph-create-request-schema
  [:map
   [:graph-name :string]
   [:schema-version {:optional true} [:maybe :string]]])

(def graph-create-response-schema
  [:map
   [:graph-id :string]])

(def graph-access-response-schema http-ok-response-schema)

(def graph-delete-response-schema
  [:map
   [:graph-id :string]
   [:deleted :boolean]])

(def graph-member-create-request-schema
  [:or
   [:map
    [:user-id :string]
    [:role {:optional true} graph-member-role-schema]]
   [:map
    [:email :string]
    [:role {:optional true} graph-member-role-schema]]])

(def graph-member-update-request-schema
  [:map
   [:role graph-member-role-schema]])

(def tx-batch-request-schema
  [:map
   [:t-before :int]
   [:txs :string]])

(def e2ee-user-key-request-schema
  [:map
   [:public-key :string]
   [:encrypted-private-key :string]
   [:reset-private-key {:optional true} :boolean]])

(def e2ee-user-key-response-schema
  [:map
   [:public-key {:optional true} [:maybe :string]]
   [:encrypted-private-key {:optional true} [:maybe :string]]])

(def e2ee-user-public-key-response-schema
  [:map
   [:public-key {:optional true} [:maybe :string]]])

(def e2ee-graph-aes-key-request-schema
  [:map
   [:encrypted-aes-key :string]])

(def e2ee-graph-aes-key-response-schema
  [:map
   [:encrypted-aes-key {:optional true} [:maybe :string]]])

(def e2ee-grant-access-entry-schema
  [:map
   [:user/email :string]
   [:encrypted-aes-key :string]])

(def e2ee-grant-access-request-schema
  [:map
   [:target-user-email+encrypted-aes-key-coll [:sequential e2ee-grant-access-entry-schema]]])

(def e2ee-grant-access-response-schema
  [:map
   [:ok :boolean]
   [:missing-users {:optional true} [:sequential :string]]])

(def snapshot-download-response-schema
  [:map
   [:ok :boolean]
   [:key :string]
   [:url :string]
   [:content-encoding {:optional true} [:maybe :string]]])

(def snapshot-upload-response-schema
  [:map
   [:ok :boolean]
   [:count :int]])

(def asset-get-response-schema
  [:or
   :any
   http-error-response-schema])

(def http-request-schemas
  {:graphs/create graph-create-request-schema
   :graph-members/create graph-member-create-request-schema
   :graph-members/update graph-member-update-request-schema
   :sync/tx-batch tx-batch-request-schema
   :e2ee/user-keys e2ee-user-key-request-schema
   :e2ee/graph-aes-key e2ee-graph-aes-key-request-schema
   :e2ee/grant-access e2ee-grant-access-request-schema})

(def http-response-schemas
  {:graphs/list graphs-list-response-schema
   :graphs/create graph-create-response-schema
   :graphs/access graph-access-response-schema
   :graphs/delete graph-delete-response-schema
   :graph-members/list graph-members-list-response-schema
   :graph-members/create http-ok-response-schema
   :graph-members/update http-ok-response-schema
   :graph-members/delete http-ok-response-schema
   :worker/health http-ok-response-schema
   :sync/health http-ok-response-schema
   :sync/pull pull-ok-schema
   :sync/tx-batch [:or tx-batch-ok-schema tx-reject-schema http-error-response-schema]
   :sync/snapshot-download snapshot-download-response-schema
   :sync/snapshot-upload snapshot-upload-response-schema
   :sync/admin-reset http-ok-response-schema
   :e2ee/user-keys e2ee-user-key-response-schema
   :e2ee/user-public-key e2ee-user-public-key-response-schema
   :e2ee/graph-aes-key e2ee-graph-aes-key-response-schema
   :e2ee/grant-access e2ee-grant-access-response-schema
   :assets/get asset-get-response-schema
   :assets/put http-ok-response-schema
   :assets/delete http-ok-response-schema
   :error http-error-response-schema})

(def ^:private json-transformer
  (mt/transformer
   {:name :db-sync/json}
   mt/json-transformer))

(defn- ->coercer [schema]
  (ma/coercer schema json-transformer nil
              #(ma/-fail! ::db-sync-malli-coerce
                          (select-keys % [:value]))))

(def ws-client-message-coercer (->coercer ws-client-message-schema))
(def ws-server-message-coercer (->coercer ws-server-message-schema))

(def http-request-coercers
  (into {}
        (map (fn [[k schema]] [k (->coercer schema)]))
        http-request-schemas))

(def http-response-coercers
  (into {}
        (map (fn [[k schema]] [k (->coercer schema)]))
        http-response-schemas))
