(ns frontend.components.file-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.file-content :as file-content]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest read-file-content-uses-worker-for-relative-db-files-test
  (async done
    (let [repo "logseq_db_file_component"
          repo-dir "/graphs/file-component"
          worker-calls (atom [])
          fs-calls (atom [])]
      (p/with-redefs [state/<invoke-db-worker
                      (fn [qkw repo' path]
                        (swap! worker-calls conj [qkw repo' path])
                        (p/resolved "worker content"))
                      fs/read-file
                      (fn [dir path]
                        (swap! fs-calls conj [dir path])
                        (p/resolved "fs content"))]
        (-> (p/let [relative-content (file-content/<read-file-content repo repo-dir "logseq/config.edn")
                    absolute-content (file-content/<read-file-content repo repo-dir "/tmp/outside.md")]
              (is (= "worker content" relative-content))
              (is (= "fs content" absolute-content))
              (is (= [[:thread-api/get-file-content repo "logseq/config.edn"]]
                     @worker-calls))
              (is (= [[nil "/tmp/outside.md"]]
                     @fs-calls)))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))
