(ns logseq.tasks.dev.lint
  (:require [babashka.process :refer [shell]]
            [clojure.string :as string]))

(defn dev
  "Run all lint tasks
  - clj-kondo lint
  - carve lint for unused vars
  - lint for vars that are too large
  - lint invalid translation entries
  - lint to ensure file and db graph remain separate"
  []
  (doseq [cmd ["clojure -M:clj-kondo --parallel --lint src --cache false"
               "bb lint:carve"
               "bb lint:large-vars"
               "bb lang:validate-translations"
               "bb lint:ns-docstrings"]]
    (println cmd)
    (shell {:shutdown nil} cmd)))

(defn kondo-git-changes
  "Run clj-kondo across dirs and only for files that git diff detects as unstaged changes"
  []
  (let [kondo-dirs ["src" "deps/common" "deps/db" "deps/graph-parser" "deps/outliner" "deps/publishing" "deps/publish"]
        dir-regex (re-pattern (str "^(" (string/join "|" kondo-dirs) ")"))
        dir-to-files (->> (shell {:out :string :shutdown nil} "git diff --name-only")
                          :out
                          string/split-lines
                          (filter #(re-find #"\.(cljs|clj|cljc)$" %))
                          (group-by #(first (re-find dir-regex %)))
                          ;; remove files that aren't in a kondo dir
                          ((fn [x] (dissoc x nil))))]
    (if (seq dir-to-files)
      (doseq [[dir* files*] dir-to-files]
        (let [dir (if (= dir* "src") "." dir*)
              files (mapv #(string/replace-first % (str dir "/") "") files*)
              cmd (str "cd " dir " && clj-kondo --lint " (string/join " " files))
              _ (println cmd)
              res (apply shell {:dir dir :continue :true :shutdown nil} "clj-kondo --lint" files)]
          (when (pos? (:exit res)) (System/exit (:exit res)))))
      (println "No clj* files have changed to lint."))))