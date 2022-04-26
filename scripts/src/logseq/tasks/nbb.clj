(ns logseq.tasks.nbb
  (:require [pod.borkdude.clj-kondo :as clj-kondo]))

(defn- fetch-meta-namespaces
  "Return namespaces with metadata"
  [paths]
  (let [paths (or (seq paths) ["src"])
        {{:keys [namespace-definitions]} :analysis}
        (clj-kondo/run!
         {:lint paths
          :config {:output {:analysis {:namespace-definitions {:meta true}}}}})
        matches (keep (fn [m]
                        (when (:meta m)
                          {:ns   (:name m)
                           :meta (:meta m)}))
                      namespace-definitions)]
    matches))

(defn load-compatible-namespaces
  []
  (let [namespaces (filter #(get-in % [:meta :nbb-compatible])
                           (fetch-meta-namespaces ["src/main"]))]
    (assert (seq namespaces)
            "There must be some nbb-compatible namespaces")))
