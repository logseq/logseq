(ns frontend.security
  "Provide security focused fns like preventing XSS attacks"
  (:require ["dompurify" :as DOMPurify]))

(def sanitization-options (clj->js {:ADD_TAGS ["iframe"]
                                    :ALLOW_UNKNOWN_PROTOCOLS true
                                    :ADD_ATTR ["allow"
                                               "src"
                                               "allowfullscreen"
                                               "frameborder"
                                               "scrolling"
                                               "target"]}))

(defn sanitize-html
  [html]
  (.sanitize DOMPurify html sanitization-options))
