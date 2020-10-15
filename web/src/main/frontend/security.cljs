(ns frontend.security
  (:require [clojure.walk :as walk]
            [clojure.string :as string]))

;; To prevent from cross-site scripting vulnerability, we should add security checks for both hiccup and raw html.
;; Hiccup: [:a {:href "javascript:alert('hei')"} "click me"]

(defn javascript-link?
  [f]
  (and
   (vector? f)
   (= :a (first f))
   (:href (second f))
   (:href (second f))
   (re-find #"(?i)javascript" (:href (second f)))))

(defn remove-javascript-links-in-href
  [hiccup]
  (walk/postwalk
   (fn [f]
     (if (javascript-link? f)
       (update f 1 dissoc :href)
       f))
   hiccup))

;; HTML:
;; Example 1:
;; <script>
;; alert('gotcha');
;; </script>

;; Example 2:
;; <div style="padding: 20px; opacity: 0;height: 20px;" onmouseout="alert('Gotcha!')"></div>

;; Copy from hiccup
;; (defn escape-html
;;   "Change special characters into HTML character entities."
;;   [text]
;;   (-> text
;;       (string/replace "&"  "&amp;")
;;       (string/replace "<"  "&lt;")
;;       (string/replace ">"  "&gt;")
;;       (string/replace "\"" "&quot;")
;;       (string/replace "'" "&apos;")
;;       (string/replace #"(?i)javascript:" "")))
