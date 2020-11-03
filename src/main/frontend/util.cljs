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
            [cljs-time.format :as format]
            [frontend.regex :as regex]
            [clojure.pprint :refer [pprint]]
            [goog.userAgent]))

;; envs
(defn ios?
  []
  (not (nil? (re-find #"iPad|iPhone|iPod" js/navigator.userAgent))))

(defn safari?
  []
  (let [ua (string/lower-case js/navigator.userAgent)]
    (and (string/includes? ua "webkit")
         (not (string/includes? ua "chrome")))))

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
                    (on-failed resp))))))))

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
  (fetch url {:method "post"
              :headers {:Content-Type "application/json"}
              :body (js/JSON.stringify (clj->js body))}
         on-ok
         on-failed))

(defn patch
  [url body on-ok on-failed]
  (fetch url {:method "patch"
              :headers {:Content-Type "application/json"}
              :body (js/JSON.stringify (clj->js body))}
         on-ok
         on-failed))

(defn delete
  [url on-ok on-failed]
  (fetch url {:method "delete"
              :headers {:Content-Type "application/json"}}
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

(defn safe-parse-int
  [x]
  (let [result (parse-int x)]
    (if (js/isNaN result)
      nil
      result)))

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
      (when-let [elem (gdom/getElement elem-id)]
        (.scroll (gdom/getElement "main-content")
                 #js {:top (let [top (element-top elem 0)]
                             (if (> top 68)
                               (- top 68)
                               top))
                      :behavior "smooth"})))))

(defn scroll-to
  [pos]
  (.scroll (gdom/getElement "main-content")
           #js {:top pos
                :behavior "smooth"}))

(defn scroll-to-top
  []
  (scroll-to 0))

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

(defn details-or-summary?
  [node]
  (when node
    (contains?
     #{"DETAILS" "SUMMARY"}
     (gobj/get node "tagName"))))

;; Debug
(defn starts-with?
  [s substr]
  (string/starts-with? s substr))

(defn journal?
  [path]
  (starts-with? path "journals/"))

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
      (safe-subvec (vec nodes) start end))))

(defn rec-get-block-node
  [node]
  (if (and node (d/has-class? node "ls-block"))
    node
    (and node
         (rec-get-block-node (gobj/get node "parentNode")))))

(defn rec-get-blocks-container
  [node]
  (if (and node (d/has-class? node "blocks-container"))
    node
    (and node
         (rec-get-blocks-container (gobj/get node "parentNode")))))

;; Take the idea from https://stackoverflow.com/questions/4220478/get-all-dom-block-elements-for-selected-texts.
;; FIXME: Note that it might not works for IE.
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
      nil)))

(defn get-input-pos
  [input]
  (and input (.-selectionStart input)))

(defn get-selection
  []
  (when (gobj/get js/window "getSelection")
    (js/window.getSelection)))

(defn get-selected-text
  []
  (some-> (get-selection)
          (.toString)))

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
(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "^" uuid-pattern "$")))
(defn uuid-string?
  [s]
  (re-find exactly-uuid-pattern s))

(defn extract-uuid
  [s]
  (re-find (re-pattern uuid-pattern) s))

(defn drop-nth [n coll]
  (keep-indexed #(if (not= %1 n) %2) coll))

(defn capitalize-all [s]
  (some->> (string/split s #" ")
           (map string/capitalize)
           (string/join " ")))

(defn file-page?
  [page-name]
  (when page-name (re-find #"\." page-name)))

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

(defn get-repo-dir
  [repo-url]
  (str "/"
       (->> (take-last 2 (string/split repo-url #"/"))
            (string/join "_"))))

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

(defn set-title!
  [title]
  (set! (.-title js/document) title))

(defn get-prev-block
  [block]
  (when-let [blocks (d/by-class "ls-block")]
    (when-let [index (.indexOf blocks block)]
      (when (> index 0)
        (nth blocks (dec index))))))

(defn get-next-block
  [block]
  (when-let [blocks (d/by-class "ls-block")]
    (when-let [index (.indexOf blocks block)]
      (when (> (count blocks) (inc index))
        (nth blocks (inc index))))))

(defn get-prev-block-with-same-level
  [block]
  (let [id (gobj/get block "id")
        prefix (re-find #"ls-block-[\d]+" id)]
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
                nil))))))))

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
              nil)))))))

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

(defn rand-str
  [n]
  (-> (.toString (js/Math.random) 36)
      (.substr 2 n)))

(defn unique-id
  []
  (str (rand-str 6) (rand-str 3)))

(defn tag-valid?
  [tag-name]
  (when tag-name
    (and
     (not (re-find #"#" tag-name))
     (re-find regex/valid-tag-pattern tag-name))))

(defn encode-str
  [s]
  (if (tag-valid? s)
    s
    (url-encode s)))

(defn- get-clipboard-as-html
  [event]
  (if-let [c (gobj/get event "clipboardData")]
    [(.getData c "text/html") (.getData c "text")]
    (if-let [c (gobj/getValueByKeys event "originalEvent" "clipboardData")]
      [(.getData c "text/html") (.getData c "text")]
      (if-let [c (gobj/get js/window "clipboardData")]
        [(.getData c "Text") (.getData c "Text")]))))

(defn marker?
  [s]
  (contains?
   #{"NOW" "LATER" "TODO" "DOING"
     "DONE" "WAIT" "WAITING" "CANCELED" "CANCELLED" "STARTED" "IN-PROGRESS"}
   (string/upper-case s)))

(defn pp-str [x]
  (with-out-str (pprint x)))

(defn ->tags
  [tags]
  (->> (map (fn [tag]
              (let [tag (-> (string/trim tag)
                            (string/lower-case)
                            (string/replace #"\s+" "-")
                            (string/replace #"#" "")
                            (string/replace "[" "")
                            (string/replace "]" ""))]
                (if (tag-valid? tag)
                  {:db/id tag
                   :tag/name tag})))
            (remove nil? tags))
       (remove nil?)
       vec))

(defn ->page-tags
  [s]
  (let [tags (string/split s #",")]
    (->tags tags)))

(defn hiccup-keywordize
  [hiccup]
  (walk/postwalk
   (fn [f]
     (if (and (vector? f) (string? (first f)))
       (update f 0 keyword)
       f))
   hiccup))

(defn chrome?
  []
  (let [user-agent js/navigator.userAgent
        vendor js/navigator.vendor]
    (and (re-find #"Chrome" user-agent)
         (re-find #"Google Inc" user-agent))))

(defn indexeddb-check?
  [error-handler]
  (let [test-db "logseq-test-db-foo-bar-baz"
        db (and js/window.indexedDB
                (js/window.indexedDB.open test-db))]
    (when (and db (not (chrome?)))
      (gobj/set db "onerror" error-handler)
      (gobj/set db "onsuccess"
                (fn []
                  (js/window.indexedDB.deleteDatabase test-db))))))

(defn get-file-ext
  [file]
  (last (string/split file #"\.")))

(defonce mac? goog.userAgent/MAC)

(defn ->system-modifier
  [keyboard-shortcut]
  (if mac?
    (string/replace keyboard-shortcut "ctrl" "meta")
    keyboard-shortcut))

(defn default-content-with-title
  ([text-format title]
   (default-content-with-title text-format title true))
  ([text-format title new-block?]
   (let [contents? (= (string/lower-case title) "contents")
         properties (case (name text-format)
                      "org"
                      (format "#+TITLE: %s" title)
                      "markdown"
                      (format "---\ntitle: %s\n---" title)
                      "")
         new-block (case (name text-format)
                     "org"
                     "** "
                     "markdown"
                     "## "
                     "")]
     (if contents?
       new-block
       (str properties "\n\n" (if new-block? new-block))))))

(defn get-first-block-by-id
  [block-id]
  (when block-id
    (let [block-id (str block-id)]
      (when (uuid-string? block-id)
        (first (array-seq (js/document.getElementsByClassName block-id)))))))

(defn page-name-sanity
  [page-name]
  (-> page-name
      (string/replace #"\s+" "_")
      ;; Windows reserved path characters
      (string/replace #"[\\/:\\*\\?\"<>|]+" "_")))

(defn lowercase-first
  [s]
  (when s
    (str (string/lower-case (.charAt s 0))
         (subs s 1))))

(defn add-style!
  [style]
  (when (some? style)
    (let [parent-node (d/sel1 :head)
          id "logseq-custom-theme-id"
          old-link-element (d/sel1 id)
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
        (d/append! parent-node link)))))

(defn ->platform-shortcut
  [keyboard-shortcut]
  (if mac?
    (-> keyboard-shortcut
        (string/replace "Ctrl" "Cmd")
        (string/replace "Alt" "Opt"))
    keyboard-shortcut))
