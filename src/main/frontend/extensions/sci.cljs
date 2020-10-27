(ns frontend.extensions.sci
  (:require [rum.core :as rum]
            [frontend.config :as config]
            [frontend.ui :as ui]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [sci.core :as sci]))

(defn eval-string
  [s]
  (try
    (sci/eval-string s)
    (catch js/Error e
      (println "Query: sci eval failed:")
      (js/console.error e))))

(defn call-fn
  [f & args]
  (apply f args)
  ;; (-> (apply f (bean/->js args))
  ;;     (->js)
  ;;     (bean/->clj))
  )

(defn eval-result
  [code]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    [:pre.code
     (let [result (eval-string code)]
       (str result))]]])
