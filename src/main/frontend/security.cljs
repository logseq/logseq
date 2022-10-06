(ns frontend.security
  "Provide security focused fns like preventing XSS attacks"
  (:require [clojure.walk :as walk]
            [frontend.util :as util]
            ["dompurify" :as DOMPurify]))

;; To prevent from cross-site scripting vulnerability, we should add security checks for both hiccup and raw html.
;; Hiccup: [:a {:href "javascript:alert('hei')"} "click me"]

(defn javascript-link?
  [f]
  (and
   (vector? f)
   (= :a (first f))
   (:href (second f))
   (:href (second f))
   (util/safe-re-find #"(?i)javascript" (:href (second f)))))

(defn remove-javascript-links-in-href
  [hiccup]
  (walk/postwalk
   (fn [f]
     (if (javascript-link? f)
       (update f 1 dissoc :href)
       f))
   hiccup))

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

;; HTML:
;; Example 1:
;; <script>
;; alert('gotcha');
;; </script>

;; Example 2:
;; <div style="padding: 20px; opacity: 0;height: 20px;" onmouseout="alert('Gotcha!')"></div>
