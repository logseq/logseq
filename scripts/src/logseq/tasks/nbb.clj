(ns logseq.tasks.nbb
  (:require [pod.borkdude.clj-kondo :as clj-kondo]
            [clojure.string :as str]
            [babashka.tasks :refer [shell]]))

(defn- fetch-meta-namespaces
  "Return namespaces with metadata"
  [paths]
  (let [{{:keys [namespace-definitions]} :analysis}
        (clj-kondo/run!
         {:lint paths
          :config {:output {:analysis {:namespace-definitions {:meta true
                                                               :lang :cljs}}}}})
        matches (keep (fn [m]
                        (when (:meta m)
                          {:ns   (:name m)
                           :meta (:meta m)}))
                      namespace-definitions)]
    matches))

(defn- validate-namespaces
  [namespaces classpath dir]
  (assert (seq namespaces) "There must be some namespaces to check")
  ;; distinct b/c sometimes namespaces are duplicated with .cljc analysis
  (doseq [n (distinct namespaces)]
    (println "Requiring" n "...")
    (shell {:dir dir} "yarn nbb-logseq -cp" classpath "-e" (format "(require '[%s])" n)))
  (println "Success!"))

(defn load-compatible-namespaces
  "Check nbb-compatible namespaces can be required by nbb-logseq"
  []
  (let [namespaces (map :ns
                        (filter #(get-in % [:meta :nbb-compatible])
                                (fetch-meta-namespaces ["src/main"])))]
    (validate-namespaces namespaces "src/main" ".")))

(defn load-all-namespaces
  "Check all namespaces in source path(s) can be required by nbb-logseq"
  [dir & paths]
  (let [{{:keys [namespace-definitions]} :analysis}
        (clj-kondo/run!
         {:lint (map #(str dir "/" %) paths)
          :config {:output {:analysis {:namespace-definitions {:lang :cljs}}}}})]
    (validate-namespaces (map :name namespace-definitions)
                         (str/join ":" paths)
                         dir)))
