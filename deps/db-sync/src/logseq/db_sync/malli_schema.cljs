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
   ["pull"
    [:map
     [:type [:= "pull"]]
     [:since {:optional true} :int]]]
   ["tx/batch"
    [:map
     [:type [:= "tx/batch"]]
     [:t_before :int]
     [:txs :string]]]
   ["ping"
    [:map
     [:type [:= "ping"]]]]])

(def tx-reject-reason-schema
  [:enum "stale" "cycle" "empty tx data" "invalid tx" "invalid t_before"])

(def tx-reject-schema
  [:map
   [:type [:= "tx/reject"]]
   [:reason tx-reject-reason-schema]
   [:t {:optional true} :int]
   [:data {:optional true} :string]])

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

(def graph-info-schema
  [:map
   [:graph_id :string]
   [:graph_name :string]
   [:schema_version {:optional true} [:maybe :string]]
   [:created_at :int]
   [:updated_at :int]])

(def graph-member-role-schema
  [:enum "manager" "member"])

(def graph-member-info-schema
  [:map
   [:user_id :string]
   [:graph_id :string]
   [:role graph-member-role-schema]
   [:invited_by {:optional true} [:maybe :string]]
   [:created_at :int]])

(def graph-members-list-response-schema
  [:map
   [:members [:sequential graph-member-info-schema]]])

(def graphs-list-response-schema
  [:map
   [:graphs [:sequential graph-info-schema]]])

(def graph-create-request-schema
  [:map
   [:graph_name :string]
   [:schema_version {:optional true} [:maybe :string]]])

(def graph-create-response-schema
  [:map
   [:graph_id :string]])

(def graph-access-response-schema http-ok-response-schema)

(def graph-delete-response-schema
  [:map
   [:graph_id :string]
   [:deleted :boolean]])

(def graph-member-create-request-schema
  [:map
   [:user_id :string]
   [:role {:optional true} graph-member-role-schema]])

(def graph-member-update-request-schema
  [:map
   [:role graph-member-role-schema]])

(def tx-batch-request-schema
  [:map
   [:t_before :int]
   [:txs :string]])

(def snapshot-row-schema
  [:or
   [:tuple :int :string [:maybe :any]]
   [:map
    [:addr :int]
    [:content :string]
    [:addresses {:optional true} :any]]])

(def snapshot-rows-response-schema
  [:map
   [:rows [:sequential snapshot-row-schema]]
   [:last_addr :int]
   [:done :boolean]])

(def snapshot-import-request-schema
  [:map
   [:reset {:optional true} :boolean]
   [:rows [:sequential [:tuple :int :string [:maybe :any]]]]])

(def snapshot-import-response-schema
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
   :sync/snapshot-import snapshot-import-request-schema})

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
   :sync/snapshot-rows snapshot-rows-response-schema
   :sync/snapshot-import snapshot-import-response-schema
   :sync/admin-reset http-ok-response-schema
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
