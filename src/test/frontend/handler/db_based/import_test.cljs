(ns frontend.handler.db-based.import-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.db-based.import :as import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest import-from-sqlite-db-persists-import-marker-through-worker-test
  (async done
    (let [calls (atom [])
          graph (str config/db-version-prefix "imported")]
      (-> (p/with-redefs [persist-db/<import-db
                          (fn [repo buffer]
                            (swap! calls conj [:import-db repo buffer])
                            (p/resolved nil))
                          state/add-repo!
                          (fn [repo]
                            (swap! calls conj [:add-repo repo])
                            (p/resolved nil))
                          repo-handler/restore-and-setup-repo!
                          (fn [repo opts]
                            (swap! calls conj [:restore repo opts])
                            (p/resolved nil))
                          state/set-current-repo!
                          (fn [repo]
                            (swap! calls conj [:current-repo repo])
                            nil)
                          persist-db/<export-db
                          (fn [repo opts]
                            (swap! calls conj [:export-db repo opts])
                            (p/resolved nil))
                          state/<invoke-db-worker
                          (fn [& args]
                            (swap! calls conj (vec args))
                            (p/resolved nil))
                          db/transact!
                          (fn [& _]
                            (throw (js/Error. "renderer DB transact should not be used")))]
            (import-handler/import-from-sqlite-db! "buffer" "imported" #(swap! calls conj [:finished])))
          (p/then
           (fn []
             (let [[import-call add-repo-call restore-call current-repo-call export-call worker-call finished-call] @calls
                   [api worker-repo tx-data tx-meta context] worker-call]
               (is (= [:import-db graph "buffer"] import-call))
               (is (= [:add-repo {:url graph}] add-repo-call))
               (is (= [:restore graph {:import-type :sqlite-db}] restore-call))
               (is (= [:current-repo graph] current-repo-call))
               (is (= [:export-db graph {}] export-call))
               (is (= :thread-api/transact api))
               (is (= graph worker-repo))
               (is (= :sqlite-db (-> tx-data first :kv/value)))
               (is (= {:import-db? true} tx-meta))
               (is (nil? context))
               (is (= [:finished] finished-call)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest classify-existing-graph-path-test
  (is (= :sqlite-zip (import-handler/classify-existing-graph-path "/tmp/Notes.zip")))
  (is (= :sqlite-zip (import-handler/classify-existing-graph-path "C:\\backup\\Notes.ZIP")))
  (is (= :sqlite-file (import-handler/classify-existing-graph-path "/tmp/logseq_db_Notes/db.sqlite")))
  (is (= :sqlite-file (import-handler/classify-existing-graph-path "/tmp/backup/export.sqlite")))
  (is (= :graph-dir (import-handler/classify-existing-graph-path "/tmp/logseq_db_Notes")))
  (is (nil? (import-handler/classify-existing-graph-path "")))
  (is (nil? (import-handler/classify-existing-graph-path nil))))

(deftest suggested-graph-name-test
  (is (= "Notes" (import-handler/suggested-graph-name "/tmp/logseq_db_Notes")))
  (is (= "Notes" (import-handler/suggested-graph-name "/tmp/logseq_db_Notes/db.sqlite")))
  (is (= "Notes" (import-handler/suggested-graph-name "/tmp/backup/Notes.zip")))
  (is (= "Notes" (import-handler/suggested-graph-name "C:\\backup\\logseq_db_Notes\\db.sqlite"))))

(deftest import-existing-local-graph-imports-folder-sqlite-and-assets-test
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [                          fs/file-exists? (fn [path]
                                            (swap! calls conj [:exists path])
                                            (p/resolved (or (string/ends-with? path "db.sqlite")
                                                            (string/ends-with? path "/assets"))))
                          fs/read-file-raw (fn [_dir path]
                                             (swap! calls conj [:read path])
                                             (p/resolved (if (string/ends-with? path "db.sqlite")
                                                           "sqlite-bytes"
                                                           "asset-bytes")))
                          fs/readdir (fn [dir _opts]
                                       (swap! calls conj [:readdir dir])
                                       (p/resolved [(str dir "/uuid.png")]))
                          fs/write-asset-file! (fn [repo file-name data]
                                                 (swap! calls conj [:write-asset repo file-name data])
                                                 (p/resolved nil))
                          import-handler/import-from-sqlite-db!
                          (fn [buffer name finished]
                            (swap! calls conj [:import-db buffer name])
                            (finished))
                          state/get-current-repo (fn [] "logseq_db_Notes")
                          notification/show! (fn [content status & _]
                                               (swap! calls conj [:notify content status]))]
            (import-handler/import-existing-local-graph!
             "/tmp/logseq_db_Notes"
             "Notes"
             #(swap! calls conj [:finished])))
          (p/then
           (fn []
             (is (= [:import-db "sqlite-bytes" "Notes"]
                    (first (filter (comp #{:import-db} first) @calls))))
             (is (some #{[:write-asset "logseq_db_Notes" "uuid.png" "asset-bytes"]} @calls))
             (is (some #{[:finished]} @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest import-existing-local-graph-dispatches-zip-test
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [fs/read-file-raw (fn [_dir path]
                                             (swap! calls conj [:read path])
                                             (p/resolved "zip-bytes"))
                          import-handler/<import-from-sqlite-zip-buffer
                          (fn [buffer name finished]
                            (swap! calls conj [:zip buffer name])
                            (finished))]
            (import-handler/import-existing-local-graph!
             "/tmp/Notes.zip"
             "Notes"
             #(swap! calls conj [:finished])))
          (p/then
           (fn []
             (is (some #{[:read "/tmp/Notes.zip"]} @calls))
             (is (some #{[:zip "zip-bytes" "Notes"]} @calls))
             (is (some #{[:finished]} @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest import-existing-local-graph-rejects-missing-sqlite-test
  (async done
    (let [notifications (atom [])
          imports (atom [])]
      (-> (p/with-redefs [fs/file-exists? (fn [_path]
                                            (p/resolved false))
                          import-handler/import-from-sqlite-db!
                          (fn [& args]
                            (swap! imports conj args)
                            (p/resolved nil))
                          notification/show! (fn [content status & _]
                                               (swap! notifications conj [content status]))]
            (import-handler/import-existing-local-graph!
             "/tmp/not-a-graph"
             "Notes"
             #(swap! imports conj :finished)))
          (p/then
           (fn []
             (is (empty? @imports))
             (is (= [:error] (mapv second @notifications)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
