(ns frontend.util
  #?(:clj (:refer-clojure :exclude [format]))
  #?(:cljs (:require-macros [frontend.util]))
  #?(:cljs (:require
            ["/frontend/selection" :as selection]
            ["/frontend/utils" :as utils]
            [camel-snake-kebab.core :as csk]
            [camel-snake-kebab.extras :as cske]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [dommy.core :as d]
            [frontend.react-impls :as react-impls]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [goog.userAgent]
            ["path" :as nodePath]
            [promesa.core :as p]))
  (:require
   [clojure.core.async :as async]
   [clojure.pprint]
   [clojure.string :as string]
   [clojure.walk :as walk]))

#?(:cljs (goog-define NODETEST false)
   :clj (def NODETEST false))
(defonce node-test? NODETEST)

#?(:cljs
   (extend-protocol IPrintWithWriter
     js/Symbol
     (-pr-writer [sym writer _]
       (-write writer (str "\"" (.toString sym) "\"")))))

#?(:cljs (defonce ^js node-path nodePath))
#?(:cljs (defn app-scroll-container-node []
           (gdom/getElement "main-container")))

#?(:cljs
   (defn ios?
     []
     (utils/ios)))

#?(:cljs
   (defn safari?
     []
     (let [ua (string/lower-case js/navigator.userAgent)]
       (and (string/includes? ua "webkit")
            (not (string/includes? ua "chrome"))))))

(defn safe-re-find
  [pattern s]
  #?(:cljs
     (when-not (string? s)
       ;; TODO: sentry
       (js/console.trace)))
  (when (string? s)
    (re-find pattern s)))

#?(:cljs
   (defn mobile?
     []
     (when-not node-test?
       (safe-re-find #"Mobi" js/navigator.userAgent))))

#?(:cljs
   (defn electron?
     []
     (when (and js/window (gobj/get js/window "navigator"))
       (let [ua (string/lower-case js/navigator.userAgent)]
         (string/includes? ua " electron")))))

#?(:cljs
   (defn file-protocol?
     []
     (string/starts-with? js/window.location.href "file://")))

(defn format
  [fmt & args]
  #?(:cljs (apply gstring/format fmt args)
     :clj (apply clojure.core/format fmt args)))

#?(:cljs
   (defn evalue
     [event]
     (gobj/getValueByKeys event "target" "value")))

#?(:cljs
   (defn ekey [event]
     (gobj/getValueByKeys event "key")))

#?(:cljs
   (defn echecked? [event]
     (gobj/getValueByKeys event "target" "checked")))

#?(:cljs
   (defn set-change-value
     "compatible change event for React"
     [node value]
     (utils/triggerInputChange node value)))

#?(:cljs
   (defn p-handle
     ([p ok-handler]
      (p-handle p ok-handler (fn [error]
                               (js/console.error error))))
     ([p ok-handler error-handler]
      (-> p
          (p/then (fn [result]
                    (ok-handler result)))
          (p/catch (fn [error]
                     (error-handler error)))))))

#?(:cljs
   (defn get-width
     []
     (gobj/get js/window "innerWidth")))

(defn indexed
  [coll]
  (map-indexed vector coll))

(defn find-first
  [pred coll]
  (first (filter pred coll)))

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

#?(:cljs
   (defn json->clj
     ([json-string]
      (json->clj json-string false))
     ([json-string kebab?]
      (let [m (-> json-string
                  (js/JSON.parse)
                  (js->clj :keywordize-keys true))]
        (if kebab?
          (cske/transform-keys csk/->kebab-case-keyword m)
          m)))))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn remove-nils-non-nested
  [nm]
  (into {} (remove (comp nil? second)) nm))

(defn remove-nils-or-empty
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (not-empty (into {} (remove (comp #(or
                                           (nil? %)
                                           (and (coll? %)
                                                (empty? %))) second)) el))
       el))
   nm))

(defn index-by
  [col k]
  (->> (map (fn [entry] [(get entry k) entry])
            col)
       (into {})))

(defn ext-of-image? [s]
  (some #(string/ends-with? s %)
        [".png" ".jpg" ".jpeg" ".bmp" ".gif" ".webp"]))

;; ".lg:absolute.lg:inset-y-0.lg:right-0.lg:w-1/2"
(defn hiccup->class
  [class]
  (some->> (string/split class #"\.")
           (string/join " ")
           (string/trim)))

#?(:cljs
   (defn fetch-raw
     ([url on-ok on-failed]
      (fetch-raw url {} on-ok on-failed))
     ([url opts on-ok on-failed]
      (-> (js/fetch url (bean/->js opts))
          (.then (fn [resp]
                   (if (>= (.-status resp) 400)
                     (on-failed resp)
                     (if (.-ok resp)
                       (-> (.text resp)
                           (.then bean/->clj)
                           (.then #(on-ok %)))
                       (on-failed resp)))))))))

#?(:cljs
   (defn fetch
     ([url on-ok on-failed]
      (fetch url {} on-ok on-failed))
     ([url opts on-ok on-failed]
      (-> (js/fetch url (bean/->js opts))
          (.then (fn [resp]
                   (if (>= (.-status resp) 400)
                     (on-failed resp)
                     (if (.-ok resp)
                       (-> (.json resp)
                           (.then bean/->clj)
                           (.then #(on-ok %)))
                       (on-failed resp)))))))))

#?(:cljs
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
       (.send xhr file))))

(defn post
  [url body on-ok on-failed]
  #?(:cljs
     (fetch url {:method "post"
                 :headers {:Content-Type "application/json"}
                 :body (js/JSON.stringify (clj->js body))}
            on-ok
            on-failed)))

(defn patch
  [url body on-ok on-failed]
  #?(:cljs
     (fetch url {:method "patch"
                 :headers {:Content-Type "application/json"}
                 :body (js/JSON.stringify (clj->js body))}
            on-ok
            on-failed)))

(defn delete
  [url on-ok on-failed]
  #?(:cljs
     (fetch url {:method "delete"
                 :headers {:Content-Type "application/json"}}
            on-ok
            on-failed)))

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

(defn parse-int
  [x]
  #?(:cljs (if (string? x)
             (js/parseInt x)
             x)
     :clj (if (string? x)
            (Integer/parseInt x)
            x)))


(defn safe-parse-int
  [x]
  #?(:cljs (let [result (parse-int x)]
             (if (js/isNaN result)
               nil
               result))
     :clj ((try
             (parse-int x)
             (catch Exception _
               nil)))))
#?(:cljs
   (defn parse-float
     [x]
     (if (string? x)
       (js/parseFloat x)
       x)))

#?(:cljs
   (defn safe-parse-float
     [x]
     (let [result (parse-float x)]
       (if (js/isNaN result)
         nil
         result))))

#?(:cljs
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
                                   threshold)))))))

;; Caret
#?(:cljs
   (defn caret-range [node]
     (when-let [doc (or (gobj/get node "ownerDocument")
                        (gobj/get node "document"))]
       (let [win (or (gobj/get doc "defaultView")
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
                 (gobj/get pre-caret-text-range "text")))))))))

(defn get-first-or-last-line-pos
  [input]
  (let [pos (.-selectionStart input)
        value (.-value input)
        last-newline-pos (or (string/last-index-of value \newline (dec pos)) -1)]
    (- pos last-newline-pos 1)))

(defn minimize-html
  [s]
  (->> s
       (string/split-lines)
       (map string/trim)
       (string/join "")))

#?(:cljs
   (defn stop [e]
     (when e (doto e (.preventDefault) (.stopPropagation)))))

#?(:cljs
   (defn stop-propagation [e]
     (when e (.stopPropagation e))))


(def speed 500)
(def moving-frequency 15)

#?(:cljs
   (defn cur-doc-top []
     (.. js/document -documentElement -scrollTop)))

#?(:cljs
   (defn lock-global-scroll
     ([] (lock-global-scroll true))
     ([v] (js-invoke (.-classList (app-scroll-container-node))
                     (if v "add" "remove")
                     "locked-scroll"))))

#?(:cljs
   (defn element-top [elem top]
     (when elem
       (if (.-offsetParent elem)
         (let [client-top (or (.-clientTop elem) 0)
               offset-top (.-offsetTop elem)]
           (+ top client-top offset-top (element-top (.-offsetParent elem) top)))
         top))))

#?(:cljs
   (defn scroll-to-element
     [elem-id]
     (when-not (safe-re-find #"^/\d+$" elem-id)
       (when elem-id
         (when-let [elem (gdom/getElement elem-id)]
           (.scroll (app-scroll-container-node)
                    #js {:top (let [top (element-top elem 0)]
                                (if (< top 256)
                                  0
                                  (- top 80)))
                         :behavior "smooth"}))))))

#?(:cljs
   (defn scroll-to-element-v2
     [elem-id]
     (when elem-id
       (when-let [elem (gdom/getElement elem-id)]
         (.scroll (app-scroll-container-node)
                  #js {:top (element-top elem 0)
                       :behavior "auto"})))))

#?(:cljs
   (defn scroll-to
     ([pos]
      (scroll-to (app-scroll-container-node) pos))
     ([node pos]
      (scroll-to node pos true))
     ([node pos animate?]
      (when node
        (.scroll node
                 #js {:top      pos
                      :behavior (if animate? "smooth" "auto")})))))

#?(:cljs
   (defn scroll-top
     "Returns the scroll top position of the `node`. If `node` is not specified,
     returns the scroll top position of the `app-scroll-container-node`."
     ([]
      (scroll-top (app-scroll-container-node)))
     ([node]
      (when node (.-scrollTop node)))))

#?(:cljs
   (defn scroll-to-top
     []
     (scroll-to (app-scroll-container-node) 0 false)))

#?(:cljs
   (defn scroll-to-bottom
     [node]
     (when-let [node ^js (or node (app-scroll-container-node))]
       (let [bottom (.-scrollHeight node)]
         (scroll-to node bottom false)))))

(defn url-encode
  [string]
  #?(:cljs (some-> string str (js/encodeURIComponent) (.replace "+" "%20"))))

(defn url-decode
  [string]
  #?(:cljs (some-> string str (js/decodeURIComponent))))

#?(:cljs
   (defn link?
     [node]
     (contains?
      #{"A" "BUTTON"}
      (gobj/get node "tagName"))))

#?(:cljs
   (defn sup?
     [node]
     (contains?
      #{"SUP"}
      (gobj/get node "tagName"))))

#?(:cljs
   (defn input?
     [node]
     (when node
       (contains?
        #{"INPUT" "TEXTAREA"}
        (gobj/get node "tagName")))))

#?(:cljs
   (defn select?
     [node]
     (when node
       (= "SELECT" (gobj/get node "tagName")))))

#?(:cljs
   (defn details-or-summary?
     [node]
     (when node
       (contains?
        #{"DETAILS" "SUMMARY"}
        (gobj/get node "tagName")))))

;; Debug
(defn starts-with?
  [s substr]
  (string/starts-with? s substr))

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
     (if (some #(= (f x) (f %)) acc)
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

(defn safe-split-first [pattern s]
  (if-let [first-index (string/index-of s pattern)]
    [(subs s 0 first-index)
     (subs s (+ first-index (count pattern)) (count s))]
    [s ""]))

(defn split-first [pattern s]
  (when-let [first-index (string/index-of s pattern)]
    [(subs s 0 first-index)
     (subs s (+ first-index (count pattern)) (count s))]))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

(defn trim-safe
  [s]
  (when s
    (string/trim s)))

(defn trimr-without-newlines
  [s]
  (.replace s #"[ \t\r]+$" ""))

(defn trim-only-newlines
  [s]
  (-> s
      (.replace #"[\n]+$" "")
      (.replace #"^[\n]+" "")))

(defn triml-without-newlines
  [s]
  (.replace s #"^[ \t\r]+" ""))

(defn concat-without-spaces
  [left right]
  (when (and (string? left)
             (string? right))
    (let [left (trimr-without-newlines left)
          not-space? (or
                      (string/blank? left)
                      (= "\n" (last left)))]
      (str left
           (when-not not-space? " ")
           (triml-without-newlines right)))))

(defn join-newline
  [& col]
  #?(:cljs
     (let [col (remove nil? col)]
       (reduce (fn [acc s]
                 (if (or (= acc "") (= "\n" (last acc)))
                   (str acc s)
                   (str acc "\n"
                        (.replace s #"^[\n]+" "")))) "" col))))

;; Add documentation
(defn replace-first [pattern s new-value]
  (when-let [first-index (string/index-of s pattern)]
    (str new-value (subs s (+ first-index (count pattern))))))

(defn replace-last
  ([pattern s new-value]
   (replace-last pattern s new-value true))
  ([pattern s new-value space?]
   (when-let [last-index (string/last-index-of s pattern)]
     (let [prefix (subs s 0 last-index)]
       (if space?
         (concat-without-spaces prefix new-value)
         (str prefix new-value))))))

;; copy from https://stackoverflow.com/questions/18735665/how-can-i-get-the-positions-of-regex-matches-in-clojurescript
#?(:cljs
   (defn re-pos [re s]
     (let [re (js/RegExp. (.-source re) "g")]
       (loop [res []]
         (if-let [m (.exec re s)]
           (recur (conj res [(.-index m) (first m)]))
           res)))))

#?(:cljs
   (defn kill-line-before!
     [input]
     (let [val (.-value input)
           end (.-selectionStart input)
           n-pos (string/last-index-of val \newline (dec end))
           start (if n-pos (inc n-pos) 0)]
       (.setRangeText input "" start end))))

#?(:cljs
   (defn kill-line-after!
     [input]
     (let [val   (.-value input)
           start (.-selectionStart input)
           end   (or (string/index-of val \newline start)
                     (count val))]
       (.setRangeText input "" start end))))

;; copied from re_com
#?(:cljs
   (defn deref-or-value
     "Takes a value or an atom
      If it's a value, returns it
      If it's a Reagent object that supports IDeref, returns the value inside it by derefing
      "
     [val-or-atom]
     (if (satisfies? IDeref val-or-atom)
       @val-or-atom
       val-or-atom)))

;; copied from re_com
#?(:cljs
   (defn now->utc
     "Return a goog.date.UtcDateTime based on local date/time."
     []
     (let [local-date-time (js/goog.date.DateTime.)]
       (js/goog.date.UtcDateTime.
        (.getYear local-date-time)
        (.getMonth local-date-time)
        (.getDate local-date-time)
        0 0 0 0))))

(defn safe-subvec [xs start end]
  (if (or (neg? start)
          (> end (count xs)))
    []
    (subvec xs start end)))

(defn safe-subs
  ([s start]
   (let [c (count s)]
     (safe-subs s start c)))
  ([s start end]
   (let [c (count s)]
     (subs s (min c start) (min c end)))))

#?(:cljs
   (defn get-nodes-between-two-nodes
     [id1 id2 class]
     (when-let [nodes (array-seq (js/document.getElementsByClassName class))]
       (let [id #(gobj/get % "id")
             node-1 (gdom/getElement id1)
             node-2 (gdom/getElement id2)
             idx-1 (.indexOf nodes node-1)
             idx-2 (.indexOf nodes node-2)
             start (min idx-1 idx-2)
             end (inc (max idx-1 idx-2))]
         (safe-subvec (vec nodes) start end)))))

#?(:cljs
   (defn get-direction-between-two-nodes
     [id1 id2 class]
     (when-let [nodes (array-seq (js/document.getElementsByClassName class))]
       (let [node-1 (gdom/getElement id1)
             node-2 (gdom/getElement id2)
             idx-1 (.indexOf nodes node-1)
             idx-2 (.indexOf nodes node-2)]
         (if (>= idx-1 idx-2)
           :up
           :down)))))

#?(:cljs
   (defn rec-get-block-node
     [node]
     (if (and node (d/has-class? node "ls-block"))
       node
       (and node
            (rec-get-block-node (gobj/get node "parentNode"))))))

#?(:cljs
   (defn rec-get-blocks-container
     [node]
     (if (and node (d/has-class? node "blocks-container"))
       node
       (and node
            (rec-get-blocks-container (gobj/get node "parentNode"))))))

#?(:cljs
   (defn rec-get-blocks-content-section
     [node]
     (if (and node (d/has-class? node "content"))
       node
       (and node
            (rec-get-blocks-content-section (gobj/get node "parentNode"))))))

#?(:cljs
   (defn node-in-viewpoint?
     [node]
     (let [rect (.getBoundingClientRect node)
           height (or (.-innerHeight js/window)
                      (.. js/document -documentElement -clientHeight))]
       (and
        (> (.-top rect) (.-clientHeight (d/by-id "head")))
        (<= (.-bottom rect) height)))))

#?(:cljs
   (defn get-blocks-noncollapse []
     (->> (d/by-class "ls-block")
          (filter (fn [b] (some? (gobj/get b "offsetParent")))))))

;; Take the idea from https://stackoverflow.com/questions/4220478/get-all-dom-block-elements-for-selected-texts.
;; FIXME: Note that it might not works for IE.
#?(:cljs
   (defn get-selected-nodes
     [class-name]
     (try
       (when (gobj/get js/window "getSelection")
         (let [selection (js/window.getSelection)
               range (.getRangeAt selection 0)
               container (-> (gobj/get range "commonAncestorContainer")
                             (rec-get-blocks-container))
               start-node (gobj/get range "startContainer")
               container-nodes (array-seq (selection/getSelectedNodes container start-node))]
           (map
            (fn [node]
              (if (or (= 3 (gobj/get node "nodeType"))
                      (not (d/has-class? node class-name))) ;textnode
                (rec-get-block-node node)
                node))
            container-nodes)))
       (catch js/Error _e
         nil))))

#?(:cljs
   (defn input-selected?
     [input]
     (not= (.-selectionStart input)
           (.-selectionEnd input))))

#?(:cljs
   (defn get-selected-text
     []
     (utils/getSelectionText)))

#?(:cljs (def clear-selection! selection/clearSelection))

#?(:cljs
   (defn copy-to-clipboard!
     ([s]
      (utils/writeClipboard s false))
     ([s html?]
      (utils/writeClipboard s html?))))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))
(defn uuid-string?
  [s]
  (safe-re-find exactly-uuid-pattern s))

(defn extract-uuid
  [s]
  (safe-re-find (re-pattern uuid-pattern) s))

(defn drop-nth [n coll]
  (keep-indexed #(when (not= %1 n) %2) coll))

(defn capitalize-all [s]
  (some->> (string/split s #" ")
           (map string/capitalize)
           (string/join " ")))

(defn file-page?
  [page-name]
  (when page-name (safe-re-find #"\." page-name)))

#?(:cljs
   (defn react
     [ref]
     (let [r @react-impls/react]
       (r ref))))

(defn time-ms
  []
  #?(:cljs (tc/to-long (cljs-time.core/now))))

;; Returns the milliseconds representation of the provided time, in the local timezone.
;; For example, if you run this function at 10pm EDT in the EDT timezone on May 31st,
;; it will return 1622433600000, which is equivalent to Mon May 31 2021 00 :00:00.
#?(:cljs
   (defn today-at-local-ms [hours mins secs millisecs]
     (.setHours (js/Date. (.now js/Date)) hours mins secs millisecs)))

(defn d
  [k f]
  (let [result (atom nil)]
    (println (str "Debug " k))
    (time (reset! result (doall (f))))
    @result))

(defn concat-without-nil
  [& cols]
  (->> (apply concat cols)
       (remove nil?)))

#?(:cljs
   (defn set-title!
     [title]
     (set! (.-title js/document) title)))

#?(:cljs
   (defn get-prev-block-with-same-level
     [block]
     (let [id (gobj/get block "id")
           prefix (safe-re-find #"ls-block-[\d]+" id)]
       (when-let [blocks (d/by-class "ls-block")]
         (when-let [index (.indexOf blocks block)]
           (let [level (d/attr block "level")]
             (when (> index 0)
               (loop [idx (dec index)]
                 (if (>= idx 0)
                   (let [block (nth blocks idx)
                         prefix-match? (starts-with? (gobj/get block "id") prefix)]
                     (if (and prefix-match?
                              (= level (d/attr block "level")))
                       block
                       (recur (dec idx))))
                   nil)))))))))

#?(:cljs
   (defn get-next-block-with-same-level
     [block]
     (when-let [blocks (d/by-class "ls-block")]
       (when-let [index (.indexOf blocks block)]
         (let [level (d/attr block "level")]
           (when (> (count blocks) (inc index))
             (loop [idx (inc index)]
               (if (< idx (count blocks))
                 (let [block (nth blocks idx)]
                   (if (= level (d/attr block "level"))
                     block
                     (recur (inc idx))))
                 nil))))))))

#?(:cljs
   (defn get-block-container
     [block-element]
     (when block-element
       (when-let [section (some-> (rec-get-blocks-content-section block-element)
                                  (d/parent))]
         (when section
           (gdom/getElement section "id"))))))

(defn nth-safe [c i]
  (if (or (< i 0) (>= i (count c)))
    nil
    (nth c i)))

#?(:cljs
   (defn get-prev-block-non-collapsed
     [block]
     (when-let [blocks (get-blocks-noncollapse)]
       (when-let [index (.indexOf blocks block)]
         (let [idx (dec index)]
           (when (>= idx 0)
             (nth blocks idx)))))))

#?(:cljs
   (defn get-next-block-non-collapsed
     [block]
     (when-let [blocks (get-blocks-noncollapse)]
       (when-let [index (.indexOf blocks block)]
         (let [idx (inc index)]
           (when (>= (count blocks) idx)
             (nth-safe blocks idx)))))))

#?(:cljs
   (defn get-next-block-non-collapsed-skip
     [block]
     (when-let [blocks (get-blocks-noncollapse)]
       (when-let [index (.indexOf blocks block)]
         (loop [idx (inc index)]
           (when (>= (count blocks) idx)
             (let [block (nth-safe blocks idx)
                   nested? (->> (array-seq (gdom/getElementsByClass "selected"))
                                (some (fn [dom] (.contains dom block))))]
               (if nested?
                 (recur (inc idx))
                 block))))))))

(defn sort-by-value
  [order m]
  (into (sorted-map-by
         (fn [k1 k2]
           (let [v1 (get m k1)
                 v2 (get m k2)]
             (if (= order :desc)
               (compare [v2 k2] [v1 k1])
               (compare [v1 k1] [v2 k2])))))
        m))

(defn rand-str
  [n]
  #?(:cljs (-> (.toString (js/Math.random) 36)
               (.substr 2 n))
     :clj (->> (repeatedly #(Integer/toString (rand 36) 36))
               (take n)
               (apply str))))

(defn unique-id
  []
  (str (rand-str 6) (rand-str 3)))

(defn tag-valid?
  [tag-name]
  (when (string? tag-name)
    (not (safe-re-find #"[# \t\r\n]+" tag-name))))

(defn encode-str
  [s]
  (if (tag-valid? s)
    s
    (url-encode s)))

#?(:cljs
   (defn- get-clipboard-as-html
     [event]
     (if-let [c (gobj/get event "clipboardData")]
       [(.getData c "text/html") (.getData c "text")]
       (if-let [c (gobj/getValueByKeys event "originalEvent" "clipboardData")]
         [(.getData c "text/html") (.getData c "text")]
         (when-let [c (gobj/get js/window "clipboardData")]
           [(.getData c "Text") (.getData c "Text")])))))

(defn pp-str [x]
  (with-out-str (clojure.pprint/pprint x)))

(defn hiccup-keywordize
  [hiccup]
  (walk/postwalk
   (fn [f]
     (if (and (vector? f) (string? (first f)))
       (update f 0 keyword)
       f))
   hiccup))

#?(:cljs
   (defn chrome?
     []
     (let [user-agent js/navigator.userAgent
           vendor js/navigator.vendor]
       (and (safe-re-find #"Chrome" user-agent)
            (safe-re-find #"Google Inc" vendor)))))

#?(:cljs
   (defn indexeddb-check?
     [error-handler]
     (let [test-db "logseq-test-db-foo-bar-baz"
           db (and js/window.indexedDB
                   (js/window.indexedDB.open test-db))]
       (when (and db (not (chrome?)))
         (gobj/set db "onerror" error-handler)
         (gobj/set db "onsuccess"
                   (fn []
                     (js/window.indexedDB.deleteDatabase test-db)))))))

(defonce mac? #?(:cljs goog.userAgent/MAC
                 :clj nil))

(defonce win32? #?(:cljs goog.userAgent/WINDOWS
                   :clj nil))

#?(:cljs
   (defn absolute-path?
     [path]
     (try
       (js/window.apis.isAbsolutePath path)
       (catch js/Error _
         (utils/win32 path)))))

(defn ->system-modifier
  [keyboard-shortcut]
  (if mac?
    (-> keyboard-shortcut
        (string/replace "ctrl" "meta")
        (string/replace "alt" "meta"))
    keyboard-shortcut))

(defn default-content-with-title
  [text-format]
  (case (name text-format)
    "org"
    "* "

    "- "))

#?(:cljs
   (defn get-first-block-by-id
     [block-id]
     (when block-id
       (let [block-id (str block-id)]
         (when (uuid-string? block-id)
           (first (array-seq (js/document.getElementsByClassName block-id))))))))

(def windows-reserved-chars #"[\\/:\\*\\?\"<>|]+")

(defn include-windows-reserved-chars?
  [s]
  (safe-re-find windows-reserved-chars s))

(defn create-title-property?
  [s]
  (and (string? s)
       (or (include-windows-reserved-chars? s)
           (string/includes? s "."))))

(defn remove-boundary-slashes
  [s]
  (when (string? s)
    (let [s (if (= \/ (first s))
              (subs s 1)
              s)]
      (if (= \/ (last s))
        (subs s 0 (dec (count s)))
        s))))

(defn page-name-sanity
  [page-name]
  (-> page-name
      (remove-boundary-slashes)
      (string/replace #"/" ".")
      ;; Windows reserved path characters
      (string/replace windows-reserved-chars "_")))

(defn lowercase-first
  [s]
  (when s
    (str (string/lower-case (.charAt s 0))
         (subs s 1))))

#?(:cljs
   (defn add-style!
     [style]
     (when (some? style)
       (let [parent-node (d/sel1 :head)
             id "logseq-custom-theme-id"
             old-link-element (d/sel1 (str "#" id))
             style (if (string/starts-with? style "http")
                     style
                     (str "data:text/css;charset=utf-8," (js/encodeURIComponent style)))]
         (when old-link-element
           (d/remove! old-link-element))
         (let [link (->
                     (d/create-element :link)
                     (d/set-attr! :id id)
                     (d/set-attr! :rel "stylesheet")
                     (d/set-attr! :type "text/css")
                     (d/set-attr! :href style)
                     (d/set-attr! :media "all"))]
           (d/append! parent-node link))))))

(defn ->platform-shortcut
  [keyboard-shortcut]
  (if mac?
    (-> keyboard-shortcut
        (string/replace "Ctrl" "Cmd")
        (string/replace "Alt" "Opt"))
    keyboard-shortcut))

(defn remove-common-preceding
  [col1 col2]
  (if (and (= (first col1) (first col2))
           (seq col1))
    (recur (rest col1) (rest col2))
    [col1 col2]))

;; fs
(defn get-file-ext
  [file]
  (and
   (string? file)
   (string/includes? file ".")
   (some-> (last (string/split file #"\.")) string/lower-case)))

(defn get-dir-and-basename
  [path]
  (let [parts (string/split path "/")
        basename (last parts)
        dir (->> (butlast parts)
                 (string/join "/"))]
    [dir basename]))

(defn get-relative-path
  [current-file-path another-file-path]
  (let [directories-f #(butlast (string/split % "/"))
        parts-1 (directories-f current-file-path)
        parts-2 (directories-f another-file-path)
        [parts-1 parts-2] (remove-common-preceding parts-1 parts-2)
        another-file-name (last (string/split another-file-path "/"))]
    (->> (concat
          (if (seq parts-1)
            (repeat (count parts-1) "..")
            ["."])
          parts-2
          [another-file-name])
         (string/join "/"))))

;; Copied from https://github.com/tonsky/datascript-todo
(defmacro profile [k & body]
  #?(:clj
     `(if goog.DEBUG
        (let [k# ~k]
          (.time js/console k#)
          (let [res# (do ~@body)]
            (.timeEnd js/console k#)
            res#))
        (do ~@body))))

;; TODO: profile and profileEnd

;; Copy from hiccup
(defn escape-html
  "Change special characters into HTML character entities."
  [text]
  (-> text
      (string/replace "&"  "&amp;")
      (string/replace "<"  "&lt;")
      (string/replace ">"  "&gt;")
      (string/replace "\"" "&quot;")
      (string/replace "'" "&apos;")))

(defn unescape-html
  [text]
  (-> text
      (string/replace "&amp;" "&")
      (string/replace "&lt;" "<")
      (string/replace "&gt;" ">")
      (string/replace "&quot;" "\"")
      (string/replace "&apos;" "'")))

#?(:cljs
   (defn system-locales
     []
     (when-not node-test?
       (when-let [navigator (and js/window (.-navigator js/window))]
         ;; https://zzz.buzz/2016/01/13/detect-browser-language-in-javascript/
         (when navigator
           (let [v (js->clj
                    (or
                     (.-languages navigator)
                     (.-language navigator)
                     (.-userLanguage navigator)
                     (.-browserLanguage navigator)
                     (.-systemLanguage navigator)))]
             (if (string? v) [v] v)))))))

#?(:cljs
   (defn zh-CN-supported?
     []
     (contains? (set (system-locales)) "zh-CN")))

#?(:cljs
   (defn get-element-width
     [id]
     (when-let [element (gdom/getElement id)]
       (gobj/get element "offsetWidth"))))
(comment
  (= (get-relative-path "journals/2020_11_18.org" "pages/grant_ideas.org")
     "../pages/grant_ideas.org")

  (= (get-relative-path "journals/2020_11_18.org" "journals/2020_11_19.org")
     "./2020_11_19.org")

  (= (get-relative-path "a/b/c/d/g.org" "a/b/c/e/f.org")
     "../e/f.org"))

#?(:cljs
   (defn select-highlight!
     [blocks]
     (doseq [block blocks]
       (d/add-class! block "selected noselect"))))

#?(:cljs
   (defn select-unhighlight!
     [blocks]
     (doseq [block blocks]
       (d/remove-class! block "selected" "noselect"))))

(defn keyname [key] (str (namespace key) "/" (name key)))

(defn batch [in max-time handler]
  (async/go-loop [buf [] t (async/timeout max-time)]
    (let [[v p] (async/alts! [in t])]
      (cond
        (or (= p t) (nil? v))
        (let [timeout (async/timeout max-time)]
          (handler buf)
          (recur [] timeout))

        :else
        (recur (conj buf v) t)))))

#?(:cljs
   (defn trace!
     []
     (js/console.trace)))

(defn remove-first [pred coll]
  ((fn inner [coll]
     (lazy-seq
      (when-let [[x & xs] (seq coll)]
        (if (pred x)
          xs
          (cons x (inner xs))))))
   coll))

(def pprint clojure.pprint/pprint)

#?(:cljs
   (defn backward-kill-word
     [input]
     (let [val     (.-value input)
           current (.-selectionStart input)
           prev    (or
                    (->> [(string/last-index-of val \space (dec current))
                          (string/last-index-of val \newline (dec current))]
                         (remove nil?)
                         (apply max))
                    0)
           idx     (if (zero? prev)
                     0
                     (->
                      (loop [idx prev]
                        (if (#{\space \newline} (nth-safe val idx))
                          (recur (dec idx))
                          idx))
                      inc))]
       (.setRangeText input "" idx current))))

#?(:cljs
   (defn forward-kill-word
     [input]
     (let [val   (.-value input)
           current (.-selectionStart input)
           current (loop [idx current]
                     (if (#{\space \newline} (nth-safe val idx))
                       (recur (inc idx))
                       idx))
           idx (or (->> [(string/index-of val \space current)
                         (string/index-of val \newline current)]
                        (remove nil?)
                        (apply min))
                   (count val))]
       (.setRangeText input "" current (inc idx)))))

#?(:cljs
   (defn fix-open-external-with-shift!
     [^js/MouseEvent e]
     (when (and (.-shiftKey e) win32? (electron?)
                (= (string/lower-case (.. e -target -nodeName)) "a")
                (string/starts-with? (.. e -target -href) "file:"))
       (.preventDefault e))))

(defn classnames
  "Like react classnames utility:

     ```
      [:div {:class (classnames [:a :b {:c true}])}
     ```
  "
  [args]
  (into #{} (mapcat
              #(if (map? %)
                 (for [[k v] %]
                   (when v (name k)))
                 (name %))
              args)))

#?(:cljs
   (defn- get-dom-top
     [node]
     (gobj/get (.getBoundingClientRect node) "top")))

#?(:cljs
   (defn sort-by-height
     [elements]
     (sort (fn [x y]
             (< (get-dom-top x) (get-dom-top y)))
           elements)))

#?(:cljs
   (defn calc-delta-rect-offset
     [^js/HTMLElement target ^js/HTMLElement container]
     (let [target-rect (bean/->clj (.toJSON (.getBoundingClientRect target)))
           viewport-rect {:width  (.-clientWidth container)
                          :height (.-clientHeight container)}]

       {:y (- (:height viewport-rect) (:bottom target-rect))
        :x (- (:width viewport-rect) (:right target-rect))})))

(def regex-char-esc-smap
  (let [esc-chars "{}[]()&^%$#!?*.+|\\"]
    (zipmap esc-chars
            (map #(str "\\" %) esc-chars))))

(defn regex-escape
  "Escape all regex meta chars in text."
  [text]
  (string/join (replace regex-char-esc-smap text)))

(defn split-namespace-pages
  [title]
  (let [parts (string/split title "/")]
    (loop [others (rest parts)
           result [(first parts)]]
      (if (seq others)
        (let [prev (last result)]
          (recur (rest others)
                 (conj result (str prev "/" (first others)))))
        result))))

(comment
  (re-matches (re-pattern (regex-escape "$u^8(d)+w.*[dw]d?")) "$u^8(d)+w.*[dw]d?"))

#?(:cljs
   (defn meta-key-name []
     (let [user-agent (.. js/navigator -userAgent)]
       (if mac? "Cmd" "Ctrl"))))

;; TODO: share with electron
(defn ignored-path?
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "assets" "node_modules"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "assets" "node_modules"])
     ;; hidden directory or file
     (re-find #"/\.[^.]+" path)
     (re-find #"^\.[^.]+" path)
     (let [path (string/lower-case path)]
       (not
        (some #(string/ends-with? path %)
              [".md" ".markdown" ".org" ".edn" ".css" ".png" ".jpg" ".jpeg"]))))))

(defn wrapped-by-quotes?
  [v]
  (and (string? v) (>= (count v) 2) (= "\"" (first v) (last v))))

(defn unquote-string
  [v]
  (string/trim (subs v 1 (dec (count v)))))

(defn unquote-string-if-wrapped
  [v]
  (if (wrapped-by-quotes? v)
    (unquote-string v)
    v))

#?(:cljs
   (defn right-click?
     [e]
     (let [which (gobj/get e "which")
           button (gobj/get e "button")]
       (or (= which 3)
           (= button 2)))))
