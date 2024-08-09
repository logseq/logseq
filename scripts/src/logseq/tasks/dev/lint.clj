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

