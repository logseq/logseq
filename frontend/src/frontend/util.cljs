(ns frontend.util
  (:require [goog.object :as gobj]
            [promesa.core :as p]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [cljs-bean.core :as bean]))

(defn evalue
  [event]
  (gobj/getValueByKeys event "target" "value"))

(defn p-handle
  ([p ok-handler]
   (p-handle p ok-handler (fn [error] (prn "p-handle error: " error))))
  ([p ok-handler error-handler]
   (-> p
       (p/then (fn [result]
                 (ok-handler result)))
       (p/catch (fn [error]
                  (error-handler error))))))

(defn get-width
  []
  (gobj/get js/window "innerWidth"))

(defn listen
  "Register an event `handler` for events of `type` on `target`."
  [event-handler target type handler & [opts]]
  (.listen event-handler target (name type) handler (clj->js opts)))

(defn indexed
  [coll]
  (map-indexed vector coll))

(defn find-first
  [pred coll]
  (first (filter pred coll)))

(defn get-local-date
  []
  (let [date (js/Date.)
        year (.getFullYear date)
        month (inc (.getMonth date))
        day (.getDate date)
        hour (.getHours date)
        minute (.getMinutes date)]
    {:year year
     :month month
     :day day
     :hour hour
     :minute minute}))

(defn dissoc-in
  "Dissociates an entry from a nested associative structure returning a new
  nested structure. keys is a sequence of keys. Any empty maps that result
  will not be present in the new structure."
  [m [k & ks :as keys]]
  (if ks
    (if-let [nextmap (get m k)]
      (let [newmap (dissoc-in nextmap ks)]
        (if (seq newmap)
          (assoc m k newmap)
          (dissoc m k)))
      m)
    (dissoc m k)))

(defn format
  [fmt & args]
  (apply goog.string/format fmt args))

(defn raw-html
  [content]
  [:div {:dangerouslySetInnerHTML
         {:__html content}}])

(defn json->clj
  [json-string]
  (-> json-string
      (js/JSON.parse)
      (js->clj :keywordize-keys true)))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map. also transform map to nil if all of its value are nil"
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (not-empty (into {} (remove (comp nil? second)) el))
       el))
   nm))

(defn index-by
  [col k]
  (->> (map (fn [entry] [(get entry k) entry])
        col)
       (into {})))

;; ".lg:absolute.lg:inset-y-0.lg:right-0.lg:w-1/2"
(defn hiccup->class
  [class]
  (some->> (string/split class #"\.")
           (string/join " ")
           (string/trim)))

(defn fetch
  ([url on-ok on-failed]
   (fetch url #js {} on-ok on-failed))
  ([url opts on-ok on-failed]
   (-> (js/fetch url opts)
       (.then #(if (.-ok %)
                 (.json %)
                 (on-failed %)))
       (.then bean/->clj)
       (.then #(on-ok %)))))
