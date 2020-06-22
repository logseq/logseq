(ns frontend.util
  (:require [goog.object :as gobj]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            ["/frontend/caret_pos" :as caret-pos]
            ["/frontend/selection" :as selection]
            [goog.string :as gstring]
            [goog.string.format]
            [dommy.core :as d]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-time.format :as format]))

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

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

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
  (try
    (bean/->clj ((gobj/get caret-pos "position") input))
    (catch js/Error e
      nil)))

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

;; (defn scroll-into-view
;;   [element]
;;   (let [scroll-top (gobj/get element "offsetTop")
;;         scroll-top (if (zero? scroll-top)
;;                      (-> (gobj/get element "parentElement")
;;                          (gobj/get "offsetTop"))
;;                      scroll-top)]
;;     (prn {:scroll-top scroll-top})
;;     (when-let [main (gdom/getElement "main-content")]
;;       (prn {:main main})
;;       (.scroll main #js {:top scroll-top
;;                          ;; :behavior "smooth"
;;                          }))))

;; (defn scroll-to-element
;;   [fragment]
;;   (when fragment
;;     (prn {:fragment fragment})
;;     (when-not (string/blank? fragment)
;;       (when-let [element (gdom/getElement fragment)]
;;         (scroll-into-view element)))))

(def speed 500)
(def moving-frequency 15)

(defn cur-doc-top []
  (+ (.. js/document -body -scrollTop) (.. js/document -documentElement -scrollTop)))

(defn element-top [elem top]
  (when elem
    (if (.-offsetParent elem)
      (let [client-top (or (.-clientTop elem) 0)
            offset-top (.-offsetTop elem)]
        (+ top client-top offset-top (element-top (.-offsetParent elem) top)))
      top)))

(defn scroll-to-element
  [elem-id]
  (when-not (re-find #"^/\d+$" elem-id)
    (when elem-id
      (when-let [elem (.getElementById js/document elem-id)]
        (let [hop-count (/ speed moving-frequency)
              doc-top (cur-doc-top)
              gap (/ (- (element-top elem 0) doc-top) hop-count)
              main (gdom/getElement "main-content")]
          (doseq [i (range 1 (inc hop-count))]
            (let [hop-top-pos (* gap i)
                  move-to (- hop-top-pos doc-top 68)
                  timeout (* moving-frequency i)]
              (js/setTimeout (fn []
                               (.scrollTo main 0 move-to))
                             timeout))))))))

(defn scroll-to-top
  []
  (.scroll (gdom/getElement "main-content")
           #js {:top 0
                :behavior "smooth"}))

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

(defn sup?
  [node]
  (contains?
   #{"SUP"}
   (gobj/get node "tagName")))

(defn input?
  [node]
  (when node
    (contains?
     #{"INPUT" "TEXTAREA"}
     (gobj/get node "tagName"))))

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
  (let [col (remove nil? col)]
    (reduce (fn [acc s]
              (if (or (= acc "") (= "\n" (last acc)))
                (str acc s)
                (str acc "\n"
                     (.replace s #"^[\n]+" "")))) "" col)))

;; Add documentation
(defn replace-first [pattern s new-value]
  (when-let [first-index (string/index-of s pattern)]
    (str new-value (subs s (+ first-index (count pattern))))))

(defn replace-last [pattern s new-value]
  (when-let [last-index (string/last-index-of s pattern)]
    (concat-without-spaces
     (subs s 0 last-index)
     new-value)))

;; copy from https://stackoverflow.com/questions/18735665/how-can-i-get-the-positions-of-regex-matches-in-clojurescript
(defn re-pos [re s]
  (let [re (js/RegExp. (.-source re) "g")]
    (loop [res []]
      (if-let [m (.exec re s)]
        (recur (conj res [(.-index m) (first m)]))
        res))))

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

(defn- rec-get-heading-node
  [node]
  (if (and node (d/has-class? node "ls-heading"))
    node
    (and node
         (rec-get-heading-node (gobj/get node "parentNode")))))

(defn- rec-get-headings-container
  [node]
  (if (and node (d/has-class? node "headings-container"))
    node
    (and node
         (rec-get-headings-container (gobj/get node "parentNode")))))

;; Take the idea from https://stackoverflow.com/questions/4220478/get-all-dom-block-elements-for-selected-texts.
;; FIXME: Note that it might not works for IE.
(defn get-selected-nodes
  [class-name]
  (try
    (when (gobj/get js/window "getSelection")
      (let [selection (js/window.getSelection)
            range (.getRangeAt selection 0)
            container (-> (gobj/get range "commonAncestorContainer")
                          (rec-get-headings-container))
            start-node (gobj/get range "startContainer")
            container-nodes (array-seq (selection/getSelectedNodes container start-node))]
        (map
          (fn [node]
            (if (or (= 3 (gobj/get node "nodeType"))
                    (not (d/has-class? node class-name))) ;textnode
              (rec-get-heading-node node)
              node))
          container-nodes)))
    (catch js/Error _e
      nil)))

(def clear-selection! selection/clearSelection)

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

(defonce uuid-pattern #"^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$")
(defn uuid-string?
  [s]
  (re-find uuid-pattern s))

(defn drop-nth [n coll]
  (keep-indexed #(if (not= %1 n) %2) coll))

(defn capitalize-all [s]
  (some->> (string/split s #" ")
           (map string/capitalize)
           (string/join " ")))

(defn file-page?
  [page-name]
  (re-find #"\." page-name))

;; Remove rum *reactions* assert
(defn react
  "Works in conjunction with [[reactive]] mixin. Use this function instead of `deref` inside render, and your component will subscribe to changes happening to the derefed atom."
  [ref]
  (when rum.core/*reactions*
    (vswap! rum.core/*reactions* conj ref))
  (and ref @ref))

(defn time-ms
  []
  (tc/to-long (cljs-time.core/now)))

(defn code-highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(defn get-repo-dir
  [repo-url]
  (str "/"
       (->> (take-last 2 (string/split repo-url #"/"))
            (string/join "_"))))

(defn d
  [k f]
  (let [result (atom nil)]
    (prn k)
    (time (reset! result (f)))
    @result))

(defn concat-without-nil
  [& cols]
  (->> (apply concat cols)
       (remove nil?)))

(defn set-title!
  [title]
  (set! (.-title js/document) title))

(defn get-prev-heading
  [heading]
  (when-let [headings (d/by-class "ls-heading")]
    (when-let [index (.indexOf headings heading)]
      (when (> index 0)
        (nth headings (dec index))))))

(defn get-next-heading
  [heading]
  (when-let [headings (d/by-class "ls-heading")]
    (when-let [index (.indexOf headings heading)]
      (when (> (count headings) (inc index))
        (nth headings (inc index))))))

(defn nth-safe [c i]
  (if (or (< i 0) (>= i (count c)))
    nil
    (nth c i)))

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

(defn unique-id
  []
  (str
   (-> (.toString (js/Math.random) 36)
       (.substr 2 6))
   (-> (.toString (js/Math.random) 36)
       (.substr 2 3))))
