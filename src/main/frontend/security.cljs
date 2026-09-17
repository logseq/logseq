(ns frontend.security
  "Provide security focused fns like preventing XSS attacks"
  (:require ["dompurify" :as dompurify]
            [frontend.handler.assets :as assets-handler]
            [frontend.util :as util]))

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
  (let [purify (get-dompurify)]
    (if (util/electron?)
      (let [root (js-invoke purify "sanitize" html
                            (js/Object.assign #js {} sanitization-options #js {:RETURN_DOM true}))]
        (doseq [iframe (array-seq (.querySelectorAll root "iframe[src]"))]
          (when-let [src (assets-handler/local-file-iframe-src->assets-url
                         (.getAttribute iframe "src"))]
            (.setAttribute iframe "src" src)))
        (.-innerHTML root))
      (js-invoke purify "sanitize" html sanitization-options))))
