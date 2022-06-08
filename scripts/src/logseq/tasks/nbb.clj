(ns logseq.tasks.nbb
  (:require [pod.borkdude.clj-kondo :as clj-kondo]
            [clojure.string :as str]
            [babashka.tasks :refer [shell]]))

(defn- validate-namespaces
  [namespaces classpath dir]
  (assert (seq namespaces) "There must be some namespaces to check")
  ;; distinct b/c sometimes namespaces are duplicated with .cljc analysis
  (doseq [n (distinct namespaces)]
    (println "Requiring" n "...")
    ;; Run from current dir so that yarn command runs correctly
    (shell {:dir dir} "yarn nbb-logseq -cp" classpath "-e" (format "(require '[%s])" n)))
  (println "Success!"))

(defn load-all-namespaces
  "Check all namespaces in a directory can be required by nbb-logseq"
  [dir]
  (let [{{:keys [namespace-definitions]} :analysis}
        (clj-kondo/run!
         {:lint (map #(str dir "/" %) ["src"])
          :config {:output {:analysis {:namespace-definitions {:lang :cljs}}}}})]
    (validate-namespaces (map :name namespace-definitions)
                         (str/trim (:out (shell {:dir dir :out :string} "clojure -Spath")))
                         dir)))
