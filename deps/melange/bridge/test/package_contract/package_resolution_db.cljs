(ns package-resolution-db
  (:require ["@logseq/melange-js-api/db" :as db-api]))

(defn -main
  []
  (when (nil? db-api)
    (throw (js/Error. "DB package entry point returned nil"))))
