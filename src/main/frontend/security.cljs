(ns frontend.security
  "Provide security focused fns like preventing XSS attacks"
  (:require ["dompurify" :as DOMPurify]))

(def sanitization-options (clj->js {:ADD_TAGS ["iframe"]
                                    :ADD_ATTR ["is"]
                                    :ALLOW_UNKNOWN_PROTOCOLS true }))

(defn sanitize-html
  [html]
  (.sanitize DOMPurify html sanitization-options))
