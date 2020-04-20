(ns frontend.util
  (:require [goog.object :as gobj]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            ["/frontend/caret_pos" :as caret-pos]))

(defn evalue
  [event]
  (gobj/getValueByKeys event "target" "value"))

(defn p-handle
  ([p ok-handler]
   (p-handle p ok-handler (fn [error]
                            (js/console.error error))))
  ([p ok-handler error-handler]
   (-> p
       (p/then (fn [result]
                 (ok-handler result)))
       (p/catch (fn [error]
                  (error-handler error))))))

(defn get-width
  []
  (gobj/get js/window "innerWidth"))

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

;; (defn format
;;   [fmt & args]
;;   (apply gstring/format fmt args))

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
       (.then (fn [resp]
                (if (>= (.-status resp) 400)
                  (on-failed resp)
                  (if (.-ok resp)
                    (-> (.json resp)
                        (.then bean/->clj)
                        (.then #(on-ok %)))
                   (on-failed resp))))))))

(defn upload
  [url file on-ok on-failed]
  (-> (js/fetch url (clj->js {:method "put"
                              :body file}))
      (.then #(if (.-ok %)
                (on-ok %)
                (on-failed %)))))

(defn post
  [url body on-ok on-failed]
  (fetch url (clj->js {:method "post"
                       :headers {:Content-Type "application/json"}
                       :body (js/JSON.stringify (clj->js body))})
         on-ok
         on-failed))

(defn get-weekday
  [date]
  (.toLocaleString date "en-us" (clj->js {:weekday "long"})))

(defn get-date
  []
  (let [date (js/Date.)]
    {:year (.getFullYear date)
     :month (inc (.getMonth date))
     :day (.getDate date)
     :weekday (get-weekday date)}))

(defn journals-path
  [year month]
  (let [month (if (< month 10) (str "0" month) month)]
    (str "journals/" year "_" month ".org")))

(defn current-journal-path
  []
  (let [{:keys [year month]} (get-date)]
    (journals-path year month)))

(defn today
  []
  (.toLocaleDateString (js/Date.) "default"
                       (clj->js {:month "long"
                                 :year "numeric"
                                 :day "numeric"
                                 :weekday "long"})))

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

(defn year-month-day-padded
  []
  (let [{:keys [year month day]} (get-date)]
    {:year year
     :month (zero-pad month)
     :day (zero-pad day)}))

(defn get-month-last-day
  []
  (let [today (js/Date.)
        date (js/Date. (.getFullYear today) (inc (.getMonth today)) 0)]
    (.getDate date)))

(defn parse-int
  [x]
  (if (string? x)
    (js/parseInt x)
    x))

(defn debounce
  "Returns a function that will call f only after threshold has passed without new calls
  to the function. Calls prep-fn on the args in a sync way, which can be used for things like
  calling .persist on the event object to be able to access the event attributes in f"
  ([threshold f] (debounce threshold f (constantly nil)))
  ([threshold f prep-fn]
   (let [t (atom nil)]
     (fn [& args]
       (when @t (js/clearTimeout @t))
       (apply prep-fn args)
       (reset! t (js/setTimeout #(do
                                   (reset! t nil)
                                   (apply f args))
                                threshold))))))

(def caret-range caret-pos/getCaretRange)

(defn caret-pos
  [input]
  (-> (caret-pos/getCaretPos input)
      (bean/->clj)
      :end))

(defn set-caret-pos!
  [input pos]
  (.setSelectionRange input pos pos))

(defn minimize-html
  [s]
  (->> s
       (string/split-lines)
       (map string/trim)
       (string/join "")))

(defn stop [e]
  (doto e (.preventDefault) (.stopPropagation)))

(defn get-fragment
  []
  (when-let [hash js/window.location.hash]
    (when (> (count hash) 2)
      (-> (subs hash 1)
          (string/split #"\?")
          (first)))))

(defn scroll-into-view
  [element]
  (let [scroll-top (gobj/get element "offsetTop")
        scroll-top (if (zero? scroll-top)
                     (-> (gobj/get element "parentElement")
                         (gobj/get "offsetTop"))
                     scroll-top)]

    (when-let [main (first (array-seq (gdom/getElementsByTagName "main")))]
      (.scroll main #js {:top scroll-top
                         ;; :behavior "smooth"
                         }))))

(defn scroll-to-element
  [fragment]
  (when fragment
    (when-not (string/blank? fragment)
      (when-let [element (gdom/getElement fragment)]
        (scroll-into-view element)))))
