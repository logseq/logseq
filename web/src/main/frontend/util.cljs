(ns frontend.util
  (:require [goog.object :as gobj]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            ["/frontend/caret_pos" :as caret-pos]
            [goog.string :as gstring]
            [goog.string.format]
            [dommy.core :as d]))

(defn format
  [fmt & args]
  (apply gstring/format fmt args))

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

(defn span-raw-html
  [content]
  [:span {:dangerouslySetInnerHTML
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

(defn fetch-raw
  ([url on-ok on-failed]
   (fetch-raw url #js {} on-ok on-failed))
  ([url opts on-ok on-failed]
   (-> (js/fetch url opts)
       (.then (fn [resp]
                (if (>= (.-status resp) 400)
                  (on-failed resp)
                  (if (.-ok resp)
                    (-> (.text resp)
                        (.then bean/->clj)
                        (.then #(on-ok %)))
                    (on-failed resp))))))))

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
  [url file on-ok on-failed on-progress]
  (let [xhr (js/XMLHttpRequest.)]
    (.open xhr "put" url)
    (gobj/set xhr "onload" on-ok)
    (gobj/set xhr "onerror" on-failed)
    (when (and (gobj/get xhr "upload")
               on-progress)
      (gobj/set (gobj/get xhr "upload")
                "onprogress"
                on-progress))
    (.send xhr file)))

(defn post
  [url body on-ok on-failed]
  (fetch url (clj->js {:method "post"
                       :headers {:Content-Type "application/json"}
                       :body (js/JSON.stringify (clj->js body))})
         on-ok
         on-failed))

(defn delete
  [url on-ok on-failed]
  (fetch url (clj->js {:method "delete"
                       :headers {:Content-Type "application/json"}})
         on-ok
         on-failed))

(defn get-weekday
  [date]
  (.toLocaleString date "en-us" (clj->js {:weekday "long"})))

(defn get-date
  ([]
   (get-date (js/Date.)))
  ([date]
   {:year (.getFullYear date)
    :month (inc (.getMonth date))
    :day (.getDate date)
    :weekday (get-weekday date)}))

(defn journals-path
  [year month preferred-format]
  (let [month (if (< month 10) (str "0" month) month)]
    (str "journals/" year "_" month "." (string/lower-case (name preferred-format)))))

(defn current-journal-path
  [preferred-format]
  (let [{:keys [year month]} (get-date)]
    (journals-path year month preferred-format)))

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

(defn year-month-day-padded
  ([]
   (year-month-day-padded (get-date)))
  ([date]
   (let [{:keys [year month day]} date]
     {:year year
      :month (zero-pad month)
      :day (zero-pad day)})))

(defn mdy
  ([]
   (mdy (js/Date.)))
  ([date]
   (let [{:keys [year month day]} (year-month-day-padded (get-date date))]
     (str month "/" day "/" year))))

(defn ymd
  ([]
   (ymd (js/Date.)))
  ([date]
   (let [{:keys [year month day]} (year-month-day-padded (get-date date))]
     (str year "/" month "/" day))))

(defn journal-name
  ([]
   (journal-name (js/Date.)))
  ([date]
   (str (get-weekday date) ", " (mdy date))))

(defn today
  []
  (journal-name))

(defn tomorrow
  []
  (let [d (js/Date.)
        _ (.setDate d (inc (.getDate (js/Date.))))]
    (journal-name d)))

(defn yesterday
  []
  (let [d (js/Date.)
        _ (.setDate d (dec (.getDate (js/Date.))))]
    (journal-name d)))

(defn get-current-time
  []
  (let [d (js/Date.)]
    (.toLocaleTimeString
     d
     (gobj/get js/window.navigator "language")
     (bean/->js {:hour "2-digit"
                 :minute "2-digit"
                 :hour12 false}))))

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

;; Caret
(defn caret-range [node]
  (let [doc (or (gobj/get node "ownerDocument")
                (gobj/get node "document"))
        win (or (gobj/get doc "defaultView")
                (gobj/get doc "parentWindow"))
        selection (.getSelection win)]
    (if selection
      (let [range-count (gobj/get selection "rangeCount")]
        (when (> range-count 0)
         (let [range (-> (.getSelection win)
                         (.getRangeAt 0))
               pre-caret-range (.cloneRange range)]
           (.selectNodeContents pre-caret-range node)
           (.setEnd pre-caret-range
                    (gobj/get range "endContainer")
                    (gobj/get range "endOffset"))
           (.toString pre-caret-range))))
      (when-let [selection (gobj/get doc "selection")]
        (when (not= "Control" (gobj/get selection "type"))
          (let [text-range (.createRange selection)
                pre-caret-text-range (.createTextRange (gobj/get doc "body"))]
            (.moveToElementText pre-caret-text-range node)
            (.setEndPoint pre-caret-text-range "EndToEnd" text-range)
            (gobj/get pre-caret-text-range "text")))))))

(defn set-caret-pos!
  [input pos]
  (.setSelectionRange input pos pos))

(defn get-caret-pos
  [input]
  (bean/->clj ((gobj/get caret-pos "position") input)))

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

(defn url-encode
  [string]
  (some-> string str (js/encodeURIComponent) (.replace "+" "%20")))

(defn url-decode
  [string]
  (some-> string str (js/decodeURIComponent)))

(defn link?
  [node]
  (contains?
   #{"A" "BUTTON"}
   (gobj/get node "tagName")))

(defn input?
  [node]
  (contains?
   #{"INPUT"}
   (gobj/get node "tagName")))

(defn journal?
  [path]
  (string/starts-with? path "journals/"))

(defn drop-first-line
  [s]
  (let [lines (string/split-lines s)
        others (some->> (next lines)
                        (string/join "\n"))]
    [(first lines)]))

(defn distinct-by
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f % )) acc)
       acc
       (vec (conj acc x))))
   []
   col))

(defn distinct-by-last-wins
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       (mapv
        (fn [v]
          (if (= (f x) (f v))
            x
            v))
        acc)
       (vec (conj acc x))))
   []
   col))

(defn get-git-owner-and-repo
  [repo-url]
  (take-last 2 (string/split repo-url #"/")))

(defn get-textarea-height
  [input]
  (some-> input
          (d/style)
          (gobj/get "height")
          (string/split #"\.")
          first
          (parse-int)))

(defn get-textarea-line-height
  [input]
  (try
    (some-> input
            (d/style)
            (gobj/get "lineHeight")
            ;; TODO: is this cross-platform?
            (string/replace "px" "")
            (parse-int))
    (catch js/Error _e
      24)))

(defn textarea-cursor-first-row?
  [input line-height]
  (< (:top (get-caret-pos input)) line-height))

(defn textarea-cursor-end-row?
  [input line-height]
  (> (+ (:top (get-caret-pos input)) line-height)
     (get-textarea-height input)))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

;; Add documentation
(defn replace-first [pattern s new-value]
  (when-let [first-index (string/index-of s pattern)]
    (str new-value (subs s (+ first-index (count pattern))))))

(defn replace-last [pattern s new-value]
  (when-let [last-index (string/last-index-of s pattern)]
    (str (string/trimr (subs s 0 last-index))
         " "
         (string/triml new-value))))

(defn cursor-move-back [input n]
  (let [{:keys [pos]} (get-caret-pos input)]
    (set! (.-selectionStart input) (- pos n))
    (set! (.-selectionEnd input) (- pos n))))

(defn cursor-move-forward [input n]
  (let [{:keys [pos]} (get-caret-pos input)]
    (set! (.-selectionStart input) (+ pos n))
    (set! (.-selectionEnd input) (+ pos n))))

(defn move-cursor-to [input n]
  (set! (.-selectionStart input) n)
  (set! (.-selectionEnd input) n))

(defn move-cursor-to-end
  [input]
  (let [pos (count (gobj/get input "value"))]
    (move-cursor-to input pos)))

;; copied from re_com
(defn deref-or-value
  "Takes a value or an atom
  If it's a value, returns it
  If it's a Reagent object that supports IDeref, returns the value inside it by derefing
  "
  [val-or-atom]
  (if (satisfies? IDeref val-or-atom)
    @val-or-atom
    val-or-atom))

;; copied from re_com
(defn now->utc
  "Return a goog.date.UtcDateTime based on local date/time."
  []
  (let [local-date-time (js/goog.date.DateTime.)]
    (js/goog.date.UtcDateTime.
     (.getYear local-date-time)
     (.getMonth local-date-time)
     (.getDate local-date-time)
     0 0 0 0)))

;; Take the idea from https://stackoverflow.com/questions/4220478/get-all-dom-block-elements-for-selected-texts.
;; FIXME: Note that it might not works for IE.
(defn get-selected-nodes
  [class-name]
  (try
    (when (gobj/get js/window "getSelection")
      (let [selection (js/window.getSelection)
            range (.getRangeAt selection 0)
            container (gobj/get range "commonAncestorContainer")]
        (let [container-nodes (array-seq (.getElementsByClassName container class-name))]
          (filter
           (fn [node]
             (.containsNode selection node true))
           container-nodes))))
    (catch js/Error _e
      nil)))

(defn get-heading-id
  [id]
  (try
    (uuid (string/replace id "ls-heading-parent-" ""))
    (catch js/Error e
      (prn "get-heading-id failed, error: " e))))

(defn copy-to-clipboard! [s]
  (let [el (js/document.createElement "textarea")]
    (set! (.-value el) s)
    (.setAttribute el "readonly" "")
    (set! (-> el .-style .-position) "absolute")
    (set! (-> el .-style .-left) "-9999px")
    (js/document.body.appendChild el)
    (.select el)
    (js/document.execCommand "copy")
    (js/document.body.removeChild el)))

(defn take-at-most
  [s n]
  (if (<= (count s) n)
    s
    (subs s 0 n)))
