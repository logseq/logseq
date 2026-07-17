(ns package-resolution-common
  (:require ["@logseq/melange-js-api/common" :as common-api]))

(defn -main
  []
  (when (nil? common-api)
    (throw (js/Error. "Common package entry point returned nil"))))
