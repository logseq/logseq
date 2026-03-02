(ns frontend.worker.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(deftest ensure-built-in-data-exists!
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        initial-version (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version))
        graph-created-at (:kv/value (d/entity @conn :logseq.kv/graph-created-at))
        _ (assert (= {:major 64 :minor 8} initial-version))
        _ (assert (some? graph-created-at))
        _ (db-migrate/ensure-built-in-data-exists! conn)]
    (is (= initial-version
           (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version)))
        "Initial version not changed by fn")
    (is (= graph-created-at
           (:kv/value (d/entity @conn :logseq.kv/graph-created-at)))
        "Graph created at not changed by fn")))

(deftest migrate-adds-project-agent-builtins
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version
                              :kv/value {:major 65 :minor 22}}])
        remove-idents [:logseq.class/Project
                       :logseq.class/Agent
                       :logseq.property/project
                       :logseq.property/git-repo
                       :logseq.property/agent-api-token
                       :logseq.property/agent-auth-json]
        _ (doseq [ident remove-idents
                  :let [eid (d/entid @conn ident)]
                  :when eid]
            (d/transact! conn [[:db/retractEntity eid]]))
        _ (db-migrate/migrate conn :target-version "65.23")]
    (is (= {:major 65 :minor 23}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (doseq [ident remove-idents]
      (is (some? (d/entity @conn ident))))))

(deftest migrate-adds-pr-property-builtin
  (let [conn (db-test/create-conn)
        property-ident :logseq.property/pr
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version
                              :kv/value {:major 65 :minor 24}}])
        existing-eid (d/entid @conn property-ident)
        _ (when existing-eid
            (d/transact! conn [[:db/retractEntity existing-eid]]))
        _ (db-migrate/migrate conn :target-version "65.25")]
    (is (= {:major 65 :minor 25}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? (d/entity @conn property-ident)))))

(deftest migrate-adds-project-sandbox-init-setup-property-builtin
  (let [conn (db-test/create-conn)
        property-ident :logseq.property/project-sandbox-init-setup
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version
                              :kv/value {:major 65 :minor 25}}])
        existing-eid (d/entid @conn property-ident)
        _ (when existing-eid
            (d/transact! conn [[:db/retractEntity existing-eid]]))
        _ (db-migrate/migrate conn :target-version "65.26")]
    (is (= {:major 65 :minor 26}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? (d/entity @conn property-ident)))))

(deftest migrate-adds-agent-session-id-property-builtin
  (let [conn (db-test/create-conn)
        property-ident :logseq.property/agent-session-id
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version
                              :kv/value {:major 65 :minor 26}}])
        existing-eid (d/entid @conn property-ident)
        _ (when existing-eid
            (d/transact! conn [[:db/retractEntity existing-eid]]))
        _ (db-migrate/migrate conn :target-version "65.27")]
    (is (= {:major 65 :minor 27}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? (d/entity @conn property-ident)))))

(deftest migrate-adds-sandbox-checkpoint-property-builtin
  (let [conn (db-test/create-conn)
        property-ident :logseq.property/sandbox-checkpoint
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version
                              :kv/value {:major 65 :minor 27}}])
        existing-eid (d/entid @conn property-ident)
        _ (when existing-eid
            (d/transact! conn [[:db/retractEntity existing-eid]]))
        _ (db-migrate/migrate conn :target-version "65.28")
        property (d/entity @conn property-ident)]
    (is (= {:major 65 :minor 28}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? property))
    (is (= :map (:logseq.property/type property)))))
