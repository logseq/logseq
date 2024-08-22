(ns logseq.tasks.dev.lint
  (:require [clojure.string :as string]
            [babashka.process :refer [shell]]))

(defn dev
  "Run all lint tasks
  - clj-kondo lint
  - carve lint for unused vars
  - lint for vars that are too large
  - lint invalid translation entries
  - lint to ensure file and db graph remain separate
  - lint to ensure worker and frontend are separate"
  []
  (doseq [cmd ["clojure -M:clj-kondo --parallel --lint src --cache false"
               "bb lint:carve"
               "bb lint:large-vars"
               "bb lint:worker-and-frontend-separate"
               "bb lint:db-and-file-graphs-separate"
               "bb lang:validate-translations"
               "bb lint:ns-docstrings"]]
    (println cmd)
    (shell cmd)))

(defn kondo-git-changes
  "Run clj-kondo across dirs and only for files that git diff detects as unstaged changes"
  []
  (let [kondo-dirs ["src" "deps/common" "deps/db" "deps/graph-parser" "deps/outliner" "deps/publishing"]
        dir-regex (re-pattern (str "^(" (string/join "|" kondo-dirs) ")"))
        dir-to-files (->> (shell {:out :string} "git diff --name-only")
                          :out
                          string/split-lines
                          (group-by #(first (re-find dir-regex %)))
                          ;; remove files that aren't in a kondo dir
                          ((fn [x] (dissoc x nil))))]
    (if (seq dir-to-files)
        (doseq [[dir* files*] dir-to-files]
          (let [dir (if (= dir* "src") "." dir*)
                files (mapv #(string/replace-first % (str dir "/") "") files*)
                cmd (str "cd " dir " && clj-kondo --lint " (string/join " " files))
               _ (println cmd)
               res (apply shell {:dir dir :continue :true} "clj-kondo --lint" files)]
           (when (pos? (:exit res)) (System/exit (:exit res)))))
        (println "No files have changed to lint."))))

(defn- validate-frontend-not-in-worker
  []
  (let [res (shell {:out :string}
                   "git grep -h" "\\[frontend.*:as" "src/main/frontend/worker")
        req-lines (->> (:out res)
                       string/split-lines
                       (remove #(re-find #"frontend\.worker|frontend\.common" %)))]

    (if (seq req-lines)
      (do
        (println "The following frontend requires should not be in worker namespaces:")
        (println (string/join "\n" req-lines))
        (System/exit 1))
      (println "Valid worker namespaces!"))))

(defn- validate-worker-not-in-frontend
  []
  (let [res (shell {:out :string :continue true}
                   "grep -r --exclude-dir=worker" "\\[frontend.worker.*:" "src/main/frontend")
        req-lines (->> (:out res) string/split-lines)]
    (if-not (and (= 1 (:exit res)) (= "" (:out res)))
      (do
        (println "The following worker requires should not be in frontend namespaces:")
        (println (:out res))
        (System/exit 1))
      (println "Valid frontend namespaces!"))))

(defn worker-and-frontend-separate
  "Ensures worker is independent of frontend"
  []
  (validate-frontend-not-in-worker)
  (validate-worker-not-in-frontend))

