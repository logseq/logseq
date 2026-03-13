(ns frontend.security
  "Provide security focused fns like preventing XSS attacks"
  (:require ["dompurify" :as dompurify]))

(defn- sanitizer-instance?
  [value]
  (fn? (some-> value (aget "sanitize"))))

(defn- resolve-dompurify
  [module]
  (let [purify (or (.-default module) module)]
    (cond
      (sanitizer-instance? purify)
      purify

      (fn? purify)
      (let [instance (purify js/window)]
        (if (sanitizer-instance? instance)
          instance
          (throw (js/Error. "DOMPurify factory did not return a sanitizer instance"))))

      :else
      (throw (js/Error. "Unsupported DOMPurify module shape")))))

(defonce ^:private dompurify-instance (volatile! nil))

(defn- get-dompurify
  ([] (get-dompurify dompurify dompurify-instance))
  ([module cache]
   (or @cache
       (let [instance (resolve-dompurify module)]
         (vreset! cache instance)
         instance))))

(def sanitization-options (clj->js {:ADD_TAGS ["iframe"]
                                    :ADD_ATTR ["is"]
                                    :ALLOW_UNKNOWN_PROTOCOLS true }))

(defn sanitize-html
  [html]
  (js-invoke (get-dompurify) "sanitize" html sanitization-options))
