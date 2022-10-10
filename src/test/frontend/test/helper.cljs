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
  "Given a collection of file maps, loads them into the current test-db.
This can be called in synchronous contexts as no async fns should be invoked"
  [files]
  (repo-handler/parse-files-and-load-to-db!
   test-db
   files
   ;; Set :refresh? to avoid creating default files in after-parse
   {:re-render? false :verbose false :refresh? true}))

(defn create-tmp-dir
  "Creates a temporary directory under tmp/. If a subdir is given, creates an
  additional subdirectory under the newly created temp directory."
  ([] (create-tmp-dir nil))
  ([subdir]
   (when-not (fs-node/existsSync "tmp") (fs-node/mkdirSync "tmp"))
   (let [dir (fs-node/mkdtempSync (path/join "tmp" "unit-test-"))]
     (if subdir
       (do
         (fs-node/mkdirSync (path/join dir subdir))
         (path/join dir subdir))
       dir))))
