(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.db.conn :as conn]
            ["path" :as path]
            ["fs" :as fs-node]))

(defonce test-db "test-db")

(defn start-test-db!
  []
  (conn/start! test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn load-test-files
  [files]
  (repo-handler/parse-files-and-load-to-db!
   test-db
   files
   ;; Set :refresh? to avoid creating default files in after-parse
   {:re-render? false :verbose false :refresh? true}))

(defn create-tmp-dir
  []
  (when-not (fs-node/existsSync "tmp") (fs-node/mkdirSync "tmp"))
  (fs-node/mkdtempSync (path/join "tmp" "unit-test-")))
