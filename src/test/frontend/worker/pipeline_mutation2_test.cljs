(ns frontend.worker.pipeline-mutation2-test
  "Second-run mutation survivors of frontend.worker.pipeline."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- fake-id-token
  [claims]
  (str "header." (js/btoa (js/JSON.stringify (clj->js claims))) ".signature"))

(defn- revision
  [db entity]
  (:block/tx-id (d/entity db (:db/id entity))))

(defn- reference-fixture
  "A graph where `owner` points at `value` through the ref property
  :logseq.property/order-list-type."
  []
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "owner"}
                         {:block/title "value"}]}])
        owner (db-test/find-block-by-content @conn "owner")
        value (db-test/find-block-by-content @conn "value")]
    (d/transact! conn [[:db/add (:db/id owner) :logseq.property/order-list-type (:db/id value)]])
    {:conn conn :owner owner :value value
     :property-id (d/entid @conn :logseq.property/order-list-type)}))

;; Fails if, in `gen-created-by-block`, the `:block/name` key is dropped, the `:block/title` key is dropped, the `:block/tags` key is dropped, the `:block/created-at` key is dropped, the `:block/updated-at` key is dropped, the `:logseq.property.user/name` key is dropped, the `:logseq.property.user/email` key is dropped, `:block/name` becomes `:block/order`, `:block/title` becomes `:block/tx-id`, `:logseq.class/Page` becomes `:logseq.class/Property` or `:block/created-at` becomes `:block/journal-day`.
(deftest created-by-ref-hook-creates-the-user-page-from-the-id-token-test
  (let [user-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page-id (:db/id (ldb/get-page @conn "page1"))
        new-uuid (random-uuid)
        before-ms (common-util/time-ms)]
    (worker-state/set-new-state!
     {:auth/id-token (fake-id-token {:sub (str user-uuid)
                                     :cognito:username "alice"
                                     :email "alice@example.com"})})
    (try
      (let [db-after (:db-after
                      (worker-pipeline/transact-pipeline
                       (assoc (d/with @conn [{:block/uuid new-uuid
                                              :block/title "hello"
                                              :block/parent page-id
                                              :block/page page-id
                                              :block/order "a0"}])
                              :tx-meta {})))
            user (d/entity db-after [:block/uuid user-uuid])
            after-ms (common-util/time-ms)]
        (is (some? user) "The token's user is created as a page")
        (is (= "alice" (:block/name user)))
        (is (= "alice" (:block/title user)))
        (is (= #{:logseq.class/Page} (set (map :db/ident (:block/tags user)))))
        (is (<= before-ms (:block/created-at user) after-ms))
        (is (<= before-ms (:block/updated-at user) after-ms))
        (is (= "alice" (:logseq.property.user/name user)))
        (is (= "alice@example.com" (:logseq.property.user/email user)))
        (is (= (:db/id user)
               (:db/id (:logseq.property/created-by-ref (d/entity db-after [:block/uuid new-uuid]))))))
      (finally
        (worker-state/set-new-state! {:auth/id-token nil})))))

;; Fails if, in `reference-attrs`, `:block/refs` becomes `:block/tags`.
(deftest block-refs-owner-is-revised-when-the-referenced-page-changes-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "owner"}]}])
        page (ldb/get-page @conn "page1")
        owner (db-test/find-block-by-content @conn "owner")
        _ (d/transact! conn [[:db/add (:db/id owner) :block/refs (:db/id page)]
                             [:db/add (:db/id owner) :block/tx-id 10]])
        db-before @conn
        result (worker-pipeline/transact-pipeline
                (assoc (d/with db-before [[:db/add (:db/id page) :block/title "renamed"]])
                       :tx-meta {}))]
    (is (not= (revision db-before owner) (revision (:db-after result) owner))
        "A :block/refs owner shows the referenced title, so its revision changes.")))

;; Fails if, in `reference-attr-definition-attrs`, `:db/valueType` becomes `:db/add`.
(deftest value-type-change-recomputes-reference-attrs-test
  (let [{:keys [conn owner value property-id]} (reference-fixture)
        _ (d/transact! conn [[:db/add property-id :db/valueType :db.type/string]])
        db-before @conn
        result (worker-pipeline/transact-pipeline
                (assoc (d/with db-before [[:db/add property-id :db/valueType :db.type/ref]
                                          [:db/add (:db/id value) :block/title "changed"]])
                       :tx-meta {}))]
    (is (not= (revision db-before owner) (revision (:db-after result) owner))
        "Making the property a ref again recomputes the reference attributes, so the owner is revised.")))
