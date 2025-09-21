(ns frontend.test.node-helper
  "Common helper fns for node tests"
  (:require ["path" :as node-path]
            ["fs" :as fs-node]))

(defn create-tmp-dir
  "Creates a temporary directory under tmp/. If a subdir is given, creates an
  additional subdirectory under the newly created temp directory."
  ([] (create-tmp-dir nil))
  ([subdir]
   (when-not (fs-node/existsSync "tmp") (fs-node/mkdirSync "tmp"))
   (let [dir (fs-node/mkdtempSync (node-path/join "tmp" "unit-test-"))]
     (if subdir
       (do
         (fs-node/mkdirSync (node-path/join dir subdir))
         (node-path/join dir subdir))
       dir))))
