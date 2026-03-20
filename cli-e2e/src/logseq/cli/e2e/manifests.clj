(ns logseq.cli.e2e.manifests
  (:require [clojure.edn :as edn]
            [logseq.cli.e2e.paths :as paths]))

(defn read-edn-file
  [path]
  (edn/read-string (slurp path)))

(defn load-inventory
  []
  (read-edn-file (paths/spec-path "non_sync_inventory.edn")))

(defn load-cases
  []
  (read-edn-file (paths/spec-path "non_sync_cases.edn")))
