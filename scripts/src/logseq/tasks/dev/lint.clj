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

(defn worker-and-frontend-separate
  "Ensures worker is independent of frontend"
  []
  (let [res (shell {:out :string}
                   "git grep -h" "\\[frontend.*:as" "src/main/frontend/worker")
        req-lines (->> (:out res)
                       string/split-lines
                       (remove #(re-find #"frontend\.worker|frontend\.common" %)))]

    (if (seq req-lines)
      (do
        (println "The following requires should not be in worker namespaces:")
        (println (string/join "\n" req-lines))
        (System/exit 1))
      (println "Success!"))))

