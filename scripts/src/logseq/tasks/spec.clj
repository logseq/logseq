(ns logseq.tasks.spec
  "Clojure spec related tasks"
  (:require [clojure.spec.alpha :as s]
            [cheshire.core :as json]
            [frontend.spec.storage :as storage-spec]
            [clojure.edn :as edn]))

;; To create file for validation, `JSON.stringify(localStorage)` in the js
;; console and copy string to file
(defn validate-local-storage
  "Validate a localStorage json file"
  [file]
  (let [local-storage
        (update-vals (json/parse-string (slurp file) keyword)
                     ;; Not all localStorage values are edn so gracefully return.
                     ;; For example, logseq-plugin-tabs stores data as json
                     #(try (edn/read-string %) (catch Throwable _ %)))]
    (s/assert ::storage-spec/local-storage local-storage)
    (println "Success!")))
