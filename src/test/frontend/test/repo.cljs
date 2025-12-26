(ns frontend.test.repo
  "Repo fns for creating, loading and parsing file graphs"
  (:require [frontend.state :as state]
            [frontend.test.file :as file-handler]
            [logseq.graph-parser :as graph-parser]))

(defn- parse-and-load-file-test-version!
  "Accept: .md, .org, .edn, .css"
  [repo-url file {:keys [new-graph? verbose]}]
  (try
    (let [result (file-handler/alter-file-test-version
                  repo-url
                  (:file/path file)
                  (:file/content file)
                  (merge (:stat file)
                         {:new-graph? new-graph?
                          :re-render-root? false
                          :from-disk? true}
                         ;; To avoid skipping the `:or` bounds for keyword destructuring
                         (when (some? verbose) {:verbose verbose})))]
      (state/set-parsing-state! (fn [m]
                                  (update m :finished inc)))
      result)
    (catch :default e
      (println "Parse and load file failed: " (str (:file/path file)))
      (js/console.error e)
      (state/set-parsing-state! (fn [m]
                                  (update m :failed-parsing-files conj [(:file/path file) e])))
      (state/set-parsing-state! (fn [m]
                                  (update m :finished inc))))))

(defn- parse-files-and-create-default-files-inner!
  [repo-url files]
  (let [supported-files (graph-parser/filter-files files)]
    (state/set-current-repo! repo-url)
    (state/set-parsing-state! {:total (count supported-files)})
    ;; Synchronous for tests for not breaking anything
    (doseq [file supported-files]
      (state/set-parsing-state! (fn [m]
                                  (assoc m
                                         :current-parsing-file (:file/path file))))
      (parse-and-load-file-test-version! repo-url file {}))))

(defn parse-files-and-load-to-db!
  [repo-url files]
  (parse-files-and-create-default-files-inner! repo-url files))
