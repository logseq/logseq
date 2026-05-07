(ns frontend.worker.markdown-mirror-db-sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.platform :as worker-platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(def ^:private test-repo "logseq_db_sync-two-way")

(defn- fake-platform
  []
  (let [files (atom {})
        writes (atom [])
        deletes (atom [])]
    {:platform {:env {:runtime :node}
                :storage {:read-text! (fn [path]
                                        (p/resolved (get @files path)))
                          :resolve-text-path (fn [path]
                                               (str "/tmp/logseq/" path))
                          :write-text-atomic! (fn [path content]
                                                (swap! writes conj [path content])
                                                (swap! files assoc path content)
                                                (p/resolved nil))
                          :delete-file! (fn [path]
                                          (swap! deletes conj path)
                                          (swap! files dissoc path)
                                          (p/resolved nil))}
                :broadcast {:post-message! (fn [& _] nil)}}
     :files files
     :writes writes
     :deletes deletes}))

(defn- page-path
  [path]
  (str (markdown-mirror/repo-mirror-dir test-repo) "/" path))

(defn- sidecar-page-path
  [page-uuid]
  (page-path (str ".logseq/pages/" page-uuid ".json")))

(defn- page-marker
  [uuid]
  (str "id:: " uuid))

(defn- page-markdown
  [page-uuid lines]
  (str (page-marker page-uuid) "\n\n" (string/join "\n" lines)))

(defn- new-client-ops-db
  []
  (let [Database (js/require "better-sqlite3")
        db (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! db)
    db))

(defn- with-two-way-sync-env
  ([conn f]
   (with-two-way-sync-env conn (:platform (fake-platform)) f))
  ([conn platform* f]
   (let [client-ops-db (new-client-ops-db)
         datascript-prev @worker-state/*datascript-conns
         client-ops-prev @worker-state/*client-ops-conns
         db-sync-config-prev @worker-state/*db-sync-config
         current-platform-prev worker-platform/current]
     (swap! client-op/*repo->pending-local-tx-count dissoc test-repo)
     (reset! worker-state/*datascript-conns {test-repo conn})
     (reset! worker-state/*client-ops-conns {test-repo client-ops-db})
     (reset! worker-state/*db-sync-config {:enabled? true
                                            :ws-url "ws://sync.example.test/sync/%s"
                                            :http-base "https://sync.example.test"})
     (set! worker-platform/current (fn [] platform*))
     (markdown-mirror/set-enabled! test-repo true)
     (db-listener/listen-db-changes! test-repo conn :handler-keys #{:db-sync :markdown-mirror})
     (letfn [(cleanup []
               (d/unlisten! conn :frontend.worker.db-listener/listen-db-changes!)
               (markdown-mirror/stop-file-watcher! test-repo)
               (markdown-mirror/set-enabled! test-repo false)
               (swap! client-op/*repo->pending-local-tx-count dissoc test-repo)
               (.close client-ops-db)
               (reset! worker-state/*datascript-conns datascript-prev)
               (reset! worker-state/*client-ops-conns client-ops-prev)
               (reset! worker-state/*db-sync-config db-sync-config-prev)
               (set! worker-platform/current current-platform-prev))]
       (try
         (let [result (f client-ops-db)]
           (if (p/promise? result)
             (p/finally result cleanup)
             (do
               (cleanup)
               result)))
         (catch :default e
           (cleanup)
           (throw e)))))))

(defn- pending-txs
  []
  (client-op/get-pending-local-txs test-repo))

(defn- only-pending-tx
  []
  (first (pending-txs)))

(defn- block-title
  [db block-uuid]
  (:block/title (d/entity db [:block/uuid block-uuid])))

(defn- page-exists?
  [db title]
  (some? (db-test/find-page-by-title db title)))

(defn- journal-exists?
  [db journal-day]
  (some? (db-test/find-journal-by-journal-day db journal-day)))

(defn- with-tx
  [db tx-data]
  (:db-after (d/with db tx-data)))

(defn- assert-single-uploadable-import!
  [tx]
  (is (= :import-page (:outliner-op tx)))
  (is (= :none (:db-sync/undo-redo tx)))
  (is (seq (:tx tx)))
  (is (seq (:reversed-tx tx)))
  (is (false? (:inferred-outliner-ops? tx))))

(defn- import-file!
  ([conn relative-path content]
   (import-file! conn relative-path content {}))
  ([conn relative-path content opts]
   (markdown-mirror/<import-file-content! test-repo conn relative-path content opts)))

(deftest two-way-file-edit-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Editing a mirrored file must enqueue one db-sync tx that can restore and replay the title change."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990001"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Edit"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- after"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Edit.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (is (= 1 (count (pending-txs))))
                       (assert-single-uploadable-import! tx)
                       (is (= "after" (block-title @conn block-uuid)))
                       (is (= "before" (block-title restored-db block-uuid)))
                       (is (= "after" (block-title replayed-db block-uuid))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-file-insert-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Inserting a block from disk must be queued for Logseq Sync and reversible to avoid losing the old outline."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990002"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Insert"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "first"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- first" "- inserted"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Insert.md" content)
                             tx (only-pending-tx)
                             inserted (:block/uuid (db-test/find-block-by-content @conn "inserted"))
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (some? inserted))
                       (is (nil? (d/entity restored-db [:block/uuid inserted])))
                       (is (some? (d/entity replayed-db [:block/uuid inserted]))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-file-delete-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Deleting a block in Markdown must enqueue enough inverse data for Logseq Sync conflict recovery."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990003"
                 keep-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003"
                 delete-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Delete"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "keep"
                                                      :block/uuid keep-uuid}
                                                     {:block/title "remove"
                                                      :block/uuid delete-uuid}]}]})
                 content (page-markdown page-uuid ["- keep"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Delete.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (nil? (d/entity @conn [:block/uuid delete-uuid])))
                       (is (some? (d/entity restored-db [:block/uuid delete-uuid])))
                       (is (nil? (d/entity replayed-db [:block/uuid delete-uuid]))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-parent-delete-queues-child-preserving-logseq-sync-tx-test
  (async done
         (testing "Deleting a parent from Markdown must keep child recovery data in the queued db-sync tx."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990004"
                 parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005"
                 child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Parent Delete"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "parent"
                                                      :block/uuid parent-uuid
                                                      :build/children [{:block/title "child"
                                                                        :block/uuid child-uuid}]}]}]})
                 content (str (page-marker page-uuid) "\n")]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Parent Delete.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
                       (is (nil? (d/entity @conn [:block/uuid child-uuid])))
                       (is (= "parent" (block-title restored-db parent-uuid)))
                       (is (= "child" (block-title restored-db child-uuid))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-task-status-change-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Changing a task marker in Markdown must upload the status change and keep inverse data."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990005"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0007"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Task Done"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "task"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- DONE task"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Task Done.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (= :logseq.property/status.done
                              (:db/ident (:logseq.property/status (d/entity @conn [:block/uuid block-uuid])))))
                  (is (not= :logseq.property/status.done
                            (:db/ident (:logseq.property/status (d/entity restored-db [:block/uuid block-uuid])))))
                       (is (= :logseq.property/status.done
                              (:db/ident (:logseq.property/status (d/entity replayed-db [:block/uuid block-uuid]))))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-existing-page-ref-edit-queues-created-page-for-logseq-sync-test
  (async done
         (testing "Adding a page reference from Markdown must queue both the title edit and the referenced page creation."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990007"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0009"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Page Ref"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- before [[Linked Target]]"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Page Ref.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (page-exists? @conn "Linked Target"))
                       (is (not (page-exists? restored-db "Linked Target"))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-existing-hashtag-edit-queues-tag-for-logseq-sync-test
  (async done
         (testing "Adding a hashtag from Markdown must queue the tag page/reference so remote clients converge."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990008"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0010"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Hashtag"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- before #tagged"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Hashtag.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (page-exists? @conn "tagged"))
                       (is (not (page-exists? restored-db "tagged"))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-inserted-page-ref-block-queues-created-page-for-logseq-sync-test
  (async done
         (testing "Inserting a new referenced block from Markdown must enqueue the new block and page ref."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990009"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0011"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Insert Ref"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "existing"
                                                      :block/uuid block-uuid}]}]})
                 content (page-markdown page-uuid ["- existing" "- [[Inserted Target]] from file"])]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Insert Ref.md" content)
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (page-exists? @conn "Inserted Target"))
                       (is (not (page-exists? restored-db "Inserted Target"))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-new-page-file-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Creating a page from a new Markdown file must enqueue an uploadable tx that can remove and replay the page."
           (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync New Page.md" "- hello")
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (page-exists? @conn "Sync New Page"))
                       (is (not (page-exists? restored-db "Sync New Page")))
                       (is (page-exists? replayed-db "Sync New Page")))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-new-journal-file-queues-reversible-logseq-sync-tx-test
  (async done
         (testing "Creating a journal from a new Markdown file must enqueue enough data for Logseq Sync replay."
           (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "journals/2026_05_07.md" "- journal line")
                             tx (only-pending-tx)
                             restored-db (with-tx @conn (:reversed-tx tx))
                             replayed-db (with-tx restored-db (:tx tx))]
                       (is (= :imported (:status result)))
                       (assert-single-uploadable-import! tx)
                       (is (journal-exists? @conn 20260507))
                       (is (not (journal-exists? restored-db 20260507)))
                       (is (journal-exists? replayed-db 20260507)))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-file-delete-event-does-not-queue-logseq-sync-delete-test
  (async done
         (testing "Deleting a mirrored Markdown file is ignored, so Logseq Sync must not receive a destructive tx."
           (let [conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Ignore Delete"}
                                            :blocks [{:block/title "safe"}]}]})]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (markdown-mirror/<handle-file-event! test-repo conn
                                                                         {:type :deleted
                                                                          :relative-path "pages/Sync Ignore Delete.md"}
                                                                         {})]
                       (is (= :skipped (:status result)))
                       (is (= :ignored-delete-event (:reason result)))
                       (is (page-exists? @conn "Sync Ignore Delete"))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-unsupported-top-level-markdown-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "Unsupported top-level Markdown must fail before any db-sync tx is queued."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990010"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0012"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Top Level"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "existing"
                                                      :block/uuid block-uuid}]}]})
                 content (str (page-marker page-uuid) "\n> quote")]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Top Level.md" content)]
                       (is (= :error (:status result)))
                       (is (= :unsupported-top-level-markdown (:reason result)))
                       (is (= "existing" (block-title @conn block-uuid)))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-new-file-with-existing-page-marker-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "A copied file carrying another page marker must fail without uploading a duplicate page."
           (let [existing-page-uuid #uuid "99999999-9999-4999-8999-999999990011"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Existing Marker"
                                                   :block/uuid existing-page-uuid}
                                            :blocks [{:block/title "existing"}]}]})
                 content (str (page-marker existing-page-uuid) "\n- copied")]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Copied Marker.md" content)]
                       (is (= :error (:status result)))
                       (is (= :new-file-has-page-marker (:reason result)))
                       (is (not (page-exists? @conn "Sync Copied Marker")))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-indented-id-line-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "Unsupported indented id lines must be rejected before Logseq Sync sees a partial import."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990012"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0013"
                 stale-id #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0014"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Bad Id"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})
                 content (str (page-marker page-uuid) "\n- after\n  id:: " stale-id)]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Bad Id.md" content)]
                       (is (= :error (:status result)))
                       (is (= :block-id-marker-not-supported (:reason result)))
                       (is (= "before" (block-title @conn block-uuid)))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-orphaned-child-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "An orphaned child edit must not enqueue a db-sync tx that would delete the parent locally only."
           (let [page-uuid #uuid "99999999-9999-4999-8999-999999990013"
                 parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0015"
                 child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0016"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Orphan"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "parent"
                                                      :block/uuid parent-uuid
                                                      :build/children [{:block/title "child"
                                                                        :block/uuid child-uuid}]}]}]})
                 content (str (page-marker page-uuid) "\n  - child")]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [result (import-file! conn "pages/Sync Orphan.md" content)]
                       (is (= :error (:status result)))
                       (is (= :orphaned-block (:reason result)))
                       (is (= "parent" (block-title @conn parent-uuid)))
                       (is (= "child" (block-title @conn child-uuid)))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-large-file-event-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "A too-large file event must be skipped before read/import and before any db-sync enqueue."
           (let [{:keys [platform files]} (fake-platform)
                 conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
                 read-count (atom 0)
                 platform' (assoc-in platform [:storage :read-text!]
                                     (fn [path]
                                       (swap! read-count inc)
                                       (p/resolved (get @files path))))
                 handlers (atom {})
                 watcher #js {}
                 _ (set! (.-on watcher) (fn [event handler]
                                          (swap! handlers assoc event handler)
                                          watcher))
                 _ (set! (.-close watcher) (fn [] nil))
                 relative-path "journals/2026_05_08.md"
                 storage-path (page-path relative-path)]
             (swap! files assoc storage-path "- too large")
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [_ (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform'
                                                                                     :chokidar-watch! (fn [_ _] watcher)
                                                                                     :max-import-bytes 10})
                             result ((get @handlers "change") (str "/tmp/logseq/" storage-path) #js {:size 11})]
                       (is (= :skipped (:status result)))
                       (is (= :file-too-large (:reason result)))
                       (is (= 0 @read-count))
                       (is (not (journal-exists? @conn 20260508)))
                       (is (empty? (pending-txs))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest two-way-self-write-event-does-not-queue-logseq-sync-tx-test
  (async done
         (testing "A watcher event for content just written by Markdown Mirror must be ignored to avoid sync loops."
           (let [{:keys [platform files]} (fake-platform)
                 page-uuid #uuid "99999999-9999-4999-8999-999999990014"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0017"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Sync Self Write"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "same"
                                                      :block/uuid block-uuid}]}]})
                 page (db-test/find-page-by-title @conn "Sync Self Write")
                 relative-path "pages/Sync Self Write.md"
                 storage-path (page-path relative-path)
                 handlers (atom {})
                 watcher #js {}
                 _ (set! (.-on watcher) (fn [event handler]
                                          (swap! handlers assoc event handler)
                                          watcher))
                 _ (set! (.-close watcher) (fn [] nil))]
             (-> (with-two-way-sync-env
                   conn
                   (fn [_]
                     (p/let [_ (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform
                                                                                     :chokidar-watch! (fn [_ _] watcher)
                                                                                     :ignored-recent-write-ms 60000})
                             _ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                             result ((get @handlers "change") (str "/tmp/logseq/" storage-path) #js {:size 1})]
                       (is (= :skipped (:status result)))
                       (is (= :ignored-self-write (:reason result)))
                       (is (= "same" (block-title @conn block-uuid)))
                       (is (empty? (pending-txs)))
                       (is (string? (get @files storage-path))))))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest logseq-sync-remote-tx-mirrors-to-markdown-file-test
  (async done
         (testing "A remote Logseq Sync tx must update the mirrored Markdown file so file sync is not stale."
           (let [{:keys [platform files]} (fake-platform)
                 page-uuid #uuid "99999999-9999-4999-8999-999999990015"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0018"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Remote Mirror"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})
                 page (db-test/find-page-by-title @conn "Remote Mirror")
                 storage-path (page-path "pages/Remote Mirror.md")]
             (markdown-mirror/set-enabled! test-repo true)
             (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                         tx-report (d/transact! conn [[:db/add [:block/uuid block-uuid] :block/title "after"]]
                                                {:rtc-tx? true
                                                 :db-sync/tx-id (random-uuid)})
                         results (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
                         result (first results)]
                   (is (= :written (:status result)))
                   (is (string/includes? (get @files storage-path) "- after")))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (markdown-mirror/set-enabled! test-repo false)
                              (done))))))))

(deftest logseq-sync-from-disk-tx-does-not-rewrite-markdown-file-test
  (async done
         (testing "A from-disk db-sync tx must not rewrite Markdown and create a file feedback loop."
           (let [{:keys [platform writes]} (fake-platform)
                 page-uuid #uuid "99999999-9999-4999-8999-999999990016"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0019"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "Remote From Disk"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})]
             (markdown-mirror/set-enabled! test-repo true)
             (-> (p/let [tx-report (d/transact! conn [[:db/add [:block/uuid block-uuid] :block/title "after"]]
                                                {:from-disk? true
                                                 :db-sync/tx-id (random-uuid)})
                         result (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
                   (is (= :skipped (:status result)))
                   (is (= :disabled-or-unsupported (:reason result)))
                   (is (empty? @writes)))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (markdown-mirror/set-enabled! test-repo false)
                              (done))))))))

(deftest markdown-mirror-file-origin-tx-does-not-rewrite-markdown-file-test
  (async done
         (testing "A file-origin tx must not mirror back to disk after db-sync sees it, preventing duplicate writes."
           (let [{:keys [platform writes]} (fake-platform)
                 page-uuid #uuid "99999999-9999-4999-8999-999999990017"
                 block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0020"
                 conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks [{:page {:block/title "File Origin Loop"
                                                   :block/uuid page-uuid}
                                            :blocks [{:block/title "before"
                                                      :block/uuid block-uuid}]}]})]
             (markdown-mirror/set-enabled! test-repo true)
             (-> (p/let [tx-report (d/transact! conn [[:db/add [:block/uuid block-uuid] :block/title "after"]]
                                                {:outliner-op :markdown-mirror/import-page
                                                 :markdown-mirror/source :file
                                                 :markdown-mirror/path "pages/File Origin Loop.md"
                                                 :db-sync/tx-id (random-uuid)})
                         result (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
                   (is (= :skipped (:status result)))
                   (is (= :disabled-or-unsupported (:reason result)))
                   (is (empty? @writes)))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (markdown-mirror/set-enabled! test-repo false)
                              (done))))))))
