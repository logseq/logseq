(ns logseq.db.sqlite.backup-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [goog.object :as gobj]
            [logseq.db.sqlite.backup :as sqlite-backup]
            [promesa.core :as p]
            ["fs-extra" :as fs]
            ["path" :as node-path]))

(deftest backup-connection-removes-partial-destination-on-failure
  (async done
    (let [dir (node-helper/create-tmp-dir "sqlite-backup-failure")
          dst-path (node-path/join dir "backup.sqlite")
          expected-error (js/Error. "backup failed")]
      (-> (p/with-redefs [sqlite-backup/sqlite-backup-fn
                          (fn [_db path]
                            (fs/writeFileSync path "")
                            (p/rejected expected-error))]
            (sqlite-backup/backup-connection! #js {} dst-path))
          (p/then (fn [_]
                    (is false "backup should reject")))
          (p/catch (fn [error]
                     (is (= expected-error error))
                     (is (not (fs/existsSync dst-path)))))
          (p/finally done)))))

(deftest backup-db-file-with-existing-connection-propagates-backup-failure
  (async done
    (let [dir (node-helper/create-tmp-dir "sqlite-backup-file-failure")
          dst-path (node-path/join dir "backup.sqlite")
          expected-error (js/Error. "backup failed")
          closed? (atom false)
          db #js {}]
      (gobj/set db "close" (fn [] (reset! closed? true)))
      (-> (p/with-redefs [sqlite-backup/sqlite-backup-fn
                          (fn [_db path]
                            (fs/writeFileSync path "")
                            (p/rejected expected-error))]
            (sqlite-backup/backup-db-file! db "source.sqlite" dst-path))
          (p/then (fn [_]
                    (is false "backup should reject")))
          (p/catch (fn [error]
                     (is (= expected-error error))
                     (is (not @closed?))
                     (is (not (fs/existsSync dst-path)))))
          (p/finally done)))))
