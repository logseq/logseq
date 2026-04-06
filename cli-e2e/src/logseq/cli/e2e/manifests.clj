(ns logseq.cli.e2e.manifests
  (:require [clojure.edn :as edn]
            [logseq.cli.e2e.paths :as paths]))

(def suite->manifest-files
  {:non-sync {:inventory "non_sync_inventory.edn"
              :cases "non_sync_cases.edn"}
   :sync {:inventory "sync_inventory.edn"
          :cases "sync_cases.edn"}})

(def default-suite :non-sync)

(defn read-edn-file
  [path]
  (edn/read-string (slurp path)))

(defn- normalize-suite
  [suite]
  (let [suite' (cond
                 (nil? suite) default-suite
                 (keyword? suite) suite
                 (string? suite) (keyword suite)
                 :else suite)]
    (when-not (contains? suite->manifest-files suite')
      (throw (ex-info "Unknown cli-e2e suite"
                      {:suite suite
                       :known-suites (sort (keys suite->manifest-files))})))
    suite'))

(defn- manifest-file
  [suite kind]
  (get-in suite->manifest-files [(normalize-suite suite) kind]))

(defn load-inventory
  ([]
   (load-inventory nil))
  ([suite]
   (read-edn-file (paths/spec-path (manifest-file suite :inventory)))))

(defn load-cases
  ([]
   (load-cases nil))
  ([suite]
   (read-edn-file (paths/spec-path (manifest-file suite :cases)))))
