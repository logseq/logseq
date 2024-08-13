(ns frontend.util
  "Main ns for utility fns. This ns should be split up into more focused namespaces"
  #?(:clj (:refer-clojure :exclude [format]))
  #?(:cljs (:require-macros [frontend.util]))
  #?(:cljs (:require
            ["/frontend/selection" :as selection]
            ["/frontend/utils" :as utils]
            ["@capacitor/status-bar" :refer [^js StatusBar Style]]
            ["@capgo/capacitor-navigation-bar" :refer [^js NavigationBar]]
            ["grapheme-splitter" :as GraphemeSplitter]
            ["sanitize-filename" :as sanitizeFilename]
            ["check-password-strength" :refer [passwordStrength]]
            ["path-complete-extname" :as pathCompleteExtname]
            [frontend.loader :refer [load]]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.pprint]
            [dommy.core :as d]
            [frontend.mobile.util :as mobile-util]
            [logseq.common.util :as common-util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [goog.userAgent]
            [promesa.core :as p]
            [rum.core :as rum]
            [clojure.core.async :as async]
            [frontend.pubsub :as pubsub]
            [datascript.impl.entity :as de]))
  #?(:cljs (:import [goog.async Debouncer]))
  (:require
   [clojure.pprint]
   [clojure.string :as string]
   [clojure.walk :as walk]))

#?(:cljs (goog-define NODETEST false)
   :clj (def NODETEST false))
(defonce node-test? NODETEST)

#?(:cljs
   (extend-protocol IPrintWithWriter
     symbol
     (-pr-writer [sym writer _]
       (-write writer (str "\"" (.toString sym) "\"")))))
#?(:cljs
   (extend-protocol INamed
     UUID
     (-name [this] (str this))
     (-namespace [_] nil)))


#?(:cljs (defonce ^js node-path utils/nodePath))
#?(:cljs (defonce ^js full-path-extname pathCompleteExtname))
#?(:cljs (defn app-scroll-container-node
           ([]
            (gdom/getElement "main-content-container"))
           ([el]
            (if (.closest el "#main-content-container")
              (app-scroll-container-node)
              (or
               (gdom/getElementByClass "sidebar-item-list")
               (app-scroll-container-node))))))
#?(:cljs (defonce el-visible-in-viewport? utils/elementIsVisibleInViewport))
#?(:cljs (defonce convert-to-roman utils/convertToRoman))
#?(:cljs (defonce convert-to-letters utils/convertToLetters))
#?(:cljs (defonce hsl2hex utils/hsl2hex))

#?(:cljs (def string-join-path common-util/string-join-path))

#?(:cljs
   (do
     (def safe-re-find common-util/safe-re-find)
     (defn safe-keyword
       [s]
       (when (string? s)
         (keyword (string/replace s " " "_"))))))

#?(:cljs
   (do
     (def uuid-string? common-util/uuid-string?)
     (defn check-password-strength
       {:malli/schema [:=> [:cat :string] [:maybe
                                           [:map
                                            [:contains [:sequential :string]]
                                            [:length :int]
                                            [:id :int]
                                            [:value :string]]]]}
       [input]
       (when-let [^js ret (and (string? input)
                               (not (string/blank? input))
                               (passwordStrength input))]
         (bean/->clj ret)))
     (defn safe-sanitize-file-name
       {:malli/schema [:=> [:cat :string] :string]}
       [s]
       (sanitizeFilename (str s)))))


#?(:cljs
   (do
     (defn- ios*?
       []
       (utils/ios))
     (def ios? (memoize ios*?))))

#?(:cljs
   (do
     (defn- safari*?
       []
       (let [ua (string/lower-case js/navigator.userAgent)]
         (and (string/includes? ua "webkit")
              (not (string/includes? ua "chrome")))))
     (def safari? (memoize safari*?))))

#?(:cljs
   (do
     (defn- mobile*?
       "Triggering condition: Mobile phones
        *** Warning!!! ***
        For UX logic only! Don't use for FS logic
        iPad / Android Pad doesn't trigger!"
       []
       (when-not node-test?
         (safe-re-find #"Mobi" js/navigator.userAgent)))
     (def mobile? (memoize mobile*?))))

#?(:cljs
   (do
     (defn- electron*?
       []
       (when (and js/window (gobj/get js/window "navigator"))
         (gstring/caseInsensitiveContains js/navigator.userAgent " electron")))
     (def electron? (memoize electron*?))))

#?(:cljs
   (defn mocked-open-dir-path
     "Mocked open DIR path for by-passing open dir in electron during testing. Nil if not given"
     []
     (when (electron?) (. js/window -__MOCKED_OPEN_DIR_PATH__))))

;; #?(:cljs
;;    (defn ci?
;;      []
;;      (boolean (. js/window -__E2E_TESTING__))))

#?(:cljs
   (do
     (def nfs? (and (not (electron?))
                    (not (mobile-util/native-platform?))))
     (def web-platform? nfs?)))

#?(:cljs
   (defn file-protocol?
     []
     (string/starts-with? js/window.location.href "file://")))

#?(:cljs
   (def format common-util/format))

#?(:clj
   (defn format
     [fmt & args]
     (apply clojure.core/format fmt args)))

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

;; Keep the following colors in sync with common.css
#?(:cljs
   (defn- get-computed-bg-color
     []
     ;; window.getComputedStyle(document.body, null).getPropertyValue('background-color');
     (let [styles (js/window.getComputedStyle js/document.body)
           bg-color (gobj/get styles "background-color")
           ;; convert rgb(r,g,b) to #rrggbb
           rgb2hex (fn [rgb]
                     (->> rgb
                          (map (comp #(.toString % 16) parse-long string/trim))
                          (map #(if (< (count %) 2)
                                  (str "0" %)
                                  %))
                          (string/join)
                          (str "#")))]
       (when (string/starts-with? bg-color "rgb")
         (let [rgb (-> bg-color
                       (string/replace #"^rgb[^\d]+" "")
                       (string/replace #"\)$" "")
                       (string/split #","))
               rgb (take 3 rgb)]
           (rgb2hex rgb)))))
)

#?(:cljs
   (defn set-android-theme
     []
     (let [f #(when (mobile-util/native-android?)
                (when-let [bg-color (try (get-computed-bg-color)
                                         (catch :default _
                                           nil))]
                  (.setNavigationBarColor NavigationBar (clj->js {:color bg-color}))
                  (.setBackgroundColor StatusBar (clj->js {:color bg-color}))))]
       (js/setTimeout f 32))))

#?(:cljs
   (defn set-theme-light
     []
     (p/do!
       (.setStyle StatusBar (clj->js {:style (.-Light Style)}))
       (set-android-theme))))

#?(:cljs
   (defn set-theme-dark
     []
     (p/do!
       (.setStyle StatusBar (clj->js {:style (.-Dark Style)}))
       (set-android-theme))))

(defn find-first
  [pred coll]
  (first (filter pred coll)))

(defn find-index
  "Find first index of an element in list"
  [pred-or-val coll]
  (let [pred (if (fn? pred-or-val) pred-or-val #(= pred-or-val %))]
    (reduce-kv #(if (pred %3) (reduced %2) %1) -1
               (cond-> coll (list? coll) (vec)))))

;; ".lg:absolute.lg:inset-y-0.lg:right-0.lg:w-1/2"
(defn hiccup->class
  [class]
  (some->> (string/split class #"\.")
           (string/join " ")
           (string/trim)))

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

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

#?(:cljs
   (defn safe-parse-int
     "Use if arg could be an int or string. If arg is only a string, use `parse-long`."
     {:malli/schema [:=> [:cat [:or :int :string]] :int]}
     [x]
     (if (string? x)
       (parse-long x)
       x)))

#?(:cljs
   (defn safe-parse-float
     "Use if arg could be a float or string. If arg is only a string, use `parse-double`"
     {:malli/schema [:=> [:cat [:or :double :string]] :double]}
     [x]
     (if (string? x)
       (parse-double x)
       x)))


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
#?(:cljs
   (defn cancelable-debounce
     "Create a stateful debounce function with specified interval

      Returns [fire-fn, cancel-fn]

      Use `fire-fn` to call the function(debounced)

      Use `cancel-fn` to cancel pending callback if there is"
     [f interval]
     (let [debouncer (Debouncer. f interval)]
       [(fn [& args] (.apply (.-fire debouncer) debouncer (to-array args)))
        (fn [] (.stop debouncer))])))

(defn nth-safe [c i]
  (if (or (< i 0) (>= i (count c)))
    nil
    (nth c i)))

#?(:cljs
   (when-not node-test?
     (extend-type js/NodeList
       ISeqable
       (-seq [array] (array-seq array 0)))))

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
                 (let [contents (.cloneContents pre-caret-range)
                       html (some-> (first (.-childNodes contents))
                                    (gobj/get "innerHTML")
                                    str)
                       ;; FIXME: this depends on the dom structure,
                       ;; need a converter from html to text includes newlines
                       br-ended? (and html
                                      (or
                                       ;; first line with a new line
                                       (string/ends-with? html "<div class=\"is-paragraph\"></div></div></span></div></div></div>")
                                       ;; multiple lines with a new line
                                       (string/ends-with? html "<br></div></div></span></div></div></div>")))
                       value (.toString pre-caret-range)]
                   (if br-ended?
                     (str value "\n")
                     value)))))
           (when-let [selection (gobj/get doc "selection")]
             (when (not= "Control" (gobj/get selection "type"))
               (let [text-range (.createRange selection)
                     pre-caret-text-range (.createTextRange (gobj/get doc "body"))]
                 (.moveToElementText pre-caret-text-range node)
                 (.setEndPoint pre-caret-text-range "EndToEnd" text-range)
                 (gobj/get pre-caret-text-range "text")))))))))

(defn get-selection-start
  [input]
  (when input
    (.-selectionStart input)))

(defn get-selection-end
  [input]
  (when input
    (.-selectionEnd input)))

(defn input-text-selected?
  [input]
  (not= (get-selection-start input)
        (get-selection-end input)))

(defn get-selection-direction
  [input]
  (when input
    (.-selectionDirection input)))

#?(:cljs
   (defn split-graphemes
     [s]
     (let [^js splitter (GraphemeSplitter.)]
       (.splitGraphemes splitter s))))

#?(:cljs
   (defn get-graphemes-pos
     "Return the length of the substrings in s between start and from-index.

      multi-char count as 1, like emoji characters"
     [s from-index]
     (let [^js splitter (GraphemeSplitter.)]
       (.countGraphemes splitter (subs s 0 from-index)))))

#?(:cljs
   (defn get-line-pos
     "Return the length of the substrings in s between the last index of newline
      in s searching backward from from-newline-index and from-newline-index.

      multi-char count as 1, like emoji characters"
     [s from-newline-index]
     (let [^js splitter (GraphemeSplitter.)
           last-newline-pos (string/last-index-of s \newline (dec from-newline-index))
           before-last-newline-length (or last-newline-pos -1)
           last-newline-content (subs s (inc before-last-newline-length) from-newline-index)]
       (.countGraphemes splitter last-newline-content))))

#?(:cljs
   (defn get-text-range
     "Return the substring of the first grapheme-num characters of s if first-line? is true,
      otherwise return the substring of s before the last \n and the first grapheme-num characters.

      grapheme-num treats multi-char as 1, like emoji characters"
     [s grapheme-num first-line?]
     (let [newline-pos (if first-line?
                         0
                         (inc (or (string/last-index-of s \newline) -1)))
           ^js splitter (GraphemeSplitter.)
           ^js newline-graphemes (.splitGraphemes splitter (subs s newline-pos))
           ^js newline-graphemes (.slice newline-graphemes 0 grapheme-num)
           content (.join newline-graphemes "")]
       (subs s 0 (+ newline-pos (count content))))))

#?(:cljs
   (defn stop [e]
     (when e (doto e (.preventDefault) (.stopPropagation)))))

#?(:cljs
   (defn stop-propagation [e]
     (when e (.stopPropagation e))))

#?(:cljs
   (defn nearest-scrollable-container [^js/HTMLElement element]
     (some #(when-let [overflow-y (.-overflowY (js/window.getComputedStyle %))]
              (when (contains? #{"auto" "scroll" "overlay"} overflow-y)
                %))
           (take-while (complement nil?) (iterate #(.-parentElement %) element)))))

#?(:cljs
   (defn element-visible?
     [element]
     (when element
       (when-let [r (.getBoundingClientRect element)]
         (and (>= (.-top r) 0)
              (<= (+ (.-bottom r) 64)
                  (or (.-innerHeight js/window)
                      (js/document.documentElement.clientHeight))))))))

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
     ([]
      (scroll-to (app-scroll-container-node) 0 false))
     ([animate?]
      (scroll-to (app-scroll-container-node) 0 animate?))))

#?(:cljs
   (defn scroll-to-block
     "Scroll into the view to vertically align a non-visible block to the centre
     of the visible area"
     ([block]
      (scroll-to-block block true))
     ([block animate?]
      (when block
        (when-not (element-visible? block)
          (.scrollIntoView block
                           #js {:behavior (if animate? "smooth" "auto")
                                :block    "center"}))))))

#?(:cljs
   (defn bottom-reached?
     [node threshold]
     (let [full-height (gobj/get node "scrollHeight")
           scroll-top (gobj/get node "scrollTop")
           client-height (gobj/get node "clientHeight")]
       (<= (- full-height scroll-top client-height) threshold))))

#?(:cljs
   (defn link?
     [node]
     (contains?
      #{"A" "BUTTON"}
      (gobj/get node "tagName"))))

#?(:cljs
   (defn time?
     [node]
     (contains?
      #{"TIME"}
      (gobj/get node "tagName"))))

#?(:cljs
   (defn audio?
     [node]
     (contains?
      #{"AUDIO"}
      (gobj/get node "tagName"))))

#?(:cljs
   (defn video?
     [node]
     (contains?
      #{"VIDEO"}
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


#?(:cljs
   (def distinct-by common-util/distinct-by))

#?(:cljs
   (def distinct-by-last-wins common-util/distinct-by-last-wins))

(defn get-git-owner-and-repo
  [repo-url]
  (take-last 2 (string/split repo-url #"/")))

(defn safe-lower-case
  [s]
  (if (string? s)
    (string/lower-case s) s))

(defn trim-safe
  [s]
  (if (string? s)
    (string/trim s) s))

(defn trimr-without-newlines
  [s]
  (.replace s #"[ \t\r]+$" ""))

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

(defn cjk-string?
  [s]
  (re-find #"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]" s))

;; Add documentation
(defn replace-first [pattern s new-value]
  (if-let [first-index (string/index-of s pattern)]
    (str new-value (subs s (+ first-index (count pattern))))
    s))

(defn replace-last
  ([pattern s new-value]
   (replace-last pattern s new-value true))
  ([pattern s new-value space?]
   (if-let [last-index (string/last-index-of s pattern)]
     (let [prefix (subs s 0 last-index)]
       (if space?
         (concat-without-spaces prefix new-value)
         (str prefix new-value)))
     s)))

#?(:cljs
   (def escape-regex-chars common-util/escape-regex-chars))

#?(:cljs
   (def replace-ignore-case common-util/replace-ignore-case))

;; copy from https://stackoverflow.com/questions/18735665/how-can-i-get-the-positions-of-regex-matches-in-clojurescript
#?(:cljs
   (defn re-pos [re s]
     (let [re (js/RegExp. (.-source re) "g")]
       (loop [res []]
         (if-let [m (.exec re s)]
           (recur (conj res [(.-index m) (first m)]))
           res)))))

#?(:cljs
   (defn safe-set-range-text!
     ([input text start end]
      (try
        (.setRangeText input text start end)
        (catch :default _e
          nil)))
     ([input text start end select-mode]
      (try
        (.setRangeText input text start end select-mode)
        (catch :default _e
          nil)))))

#?(:cljs
   ;; for widen char
   (defn safe-dec-current-pos-from-end
     [input current-pos]
     (if-let [len (and (string? input) (.-length input))]
       (if-let [input (and (>= len 2) (<= current-pos len)
                             (.substring input (max (- current-pos 20) 0) current-pos))]
         (try
           (let [^js splitter (GraphemeSplitter.)
                 ^js input (.splitGraphemes splitter input)]
             (- current-pos (.-length (.pop input))))
           (catch :default e
             (js/console.error e)
             (dec current-pos)))
         (dec current-pos))
       current-pos)))

#?(:cljs
   ;; for widen char
   (defn safe-inc-current-pos-from-start
     [input current-pos]
     (if-let [len (and (string? input) (.-length input))]
       (if-let [input (and (>= len 2) (<= current-pos len)
                             (.substr input current-pos 20))]
         (try
           (let [^js splitter (GraphemeSplitter.)
                 ^js input (.splitGraphemes splitter input)]
             (+ current-pos (.-length (.shift input))))
           (catch :default e
             (js/console.error e)
             (inc current-pos)))
         (inc current-pos))
       current-pos)))

#?(:cljs
   (defn kill-line-before!
     [input]
     (let [val (.-value input)
           end (get-selection-start input)
           n-pos (string/last-index-of val \newline (dec end))
           start (if n-pos (inc n-pos) 0)]
       (safe-set-range-text! input "" start end))))

#?(:cljs
   (defn kill-line-after!
     [input]
     (let [val   (.-value input)
           start (get-selection-start input)
           end   (or (string/index-of val \newline start)
                     (count val))]
       (safe-set-range-text! input "" start end))))

#?(:cljs
   (defn insert-at-current-position!
     [input text]
     (let [start (get-selection-start input)
           end   (get-selection-end input)]
       (safe-set-range-text! input text start end "end"))))

(defn safe-subvec [xs start end]
  (if (or (neg? start)
          (> start end)
          (> end (count xs)))
    []
    (subvec xs start end)))

#?(:cljs
   (defn get-nodes-between-two-nodes
     [id1 id2 class]
     (when-let [nodes (array-seq (js/document.getElementsByClassName class))]
       (let [node-1 (gdom/getElement id1)
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
   (defn rec-get-node
     [node class]
     (if (and node (d/has-class? node class))
       node
       (and node
            (rec-get-node (gobj/get node "parentNode") class)))))

#?(:cljs
   (defn rec-get-blocks-container
     [node]
     (rec-get-node node "blocks-container")))

#?(:cljs
   (defn rec-get-blocks-content-section
     [node]
     (rec-get-node node "content")))

#?(:cljs
   (defn get-blocks-noncollapse
     ([]
      (->> (d/sel "div:not(.reveal) .ls-block")
           (filter (fn [b] (some? (gobj/get b "offsetParent"))))))
     ([blocks-container]
      (->> (d/sel blocks-container "div:not(.reveal) .ls-block")
           (filter (fn [b] (some? (gobj/get b "offsetParent"))))))))

#?(:cljs
   (defn remove-embedded-blocks [blocks]
     (->> blocks
          (remove (fn [b] (= "true" (d/attr b "data-embed")))))))

#?(:cljs
   (defn get-selected-text
     []
     (utils/getSelectionText)))

#?(:cljs (def clear-selection! selection/clearSelection))

#?(:cljs
   (defn copy-to-clipboard!
     [text & {:keys [graph html blocks owner-window]}]
     (let [blocks (map (fn [block] (if (de/entity? block)
                                     (-> (into {} block)
                                         ;; FIXME: why :db/id is not included?
                                         (assoc :db/id (:db/id block)))
                                     block)) blocks)
           data (clj->js
                 (common-util/remove-nils-non-nested
                  {:text text
                   :html html
                   :blocks (when (and graph (seq blocks))
                             (pr-str
                              {:graph graph
                               :blocks (mapv #(dissoc % :block.temp/fully-loaded? %) blocks)}))}))]
       (if owner-window
         (utils/writeClipboard data owner-window)
         (utils/writeClipboard data)))))

(defn drop-nth [n coll]
  (keep-indexed #(when (not= %1 n) %2) coll))

#?(:cljs
   (defn react
     [ref]
     (if rum/*reactions*
       (rum/react ref)
       @ref)))

#?(:cljs
   (def time-ms common-util/time-ms))

(defn d
  [k f]
  (let [result (atom nil)]
    (println (str "Debug " k))
    (time (reset! result (doall (f))))
    @result))

#?(:cljs
   (def concat-without-nil common-util/concat-without-nil))

#?(:cljs
   (defn set-title!
     [title]
     (set! (.-title js/document) title)))

#?(:cljs
   (defn get-block-container
     [block-element]
     (when block-element
       (when-let [section (some-> (rec-get-blocks-content-section block-element)
                                  (d/parent))]
         (when section
           (gdom/getElement section "id"))))))

(defn get-elem-idx
  [nodes node]
  (first (filter number? (map-indexed (fn [idx b] (when (= node b) idx)) nodes))))

#?(:cljs
   (defn get-prev-block-non-collapsed
     "Gets previous non-collapsed block. If given a container
      looks up blocks in that container e.g. for embed"
     ([block] (get-prev-block-non-collapsed block {}))
     ([block {:keys [container]}]
      (when-let [blocks (if container
                          (get-blocks-noncollapse container)
                          (get-blocks-noncollapse))]
        (when-let [index (get-elem-idx blocks block)]
          (let [idx (dec index)]
            (when (>= idx 0)
              (nth-safe blocks idx))))))))

#?(:cljs
   (defn get-prev-block-non-collapsed-non-embed
     [block]
     (when-let [blocks (->> (get-blocks-noncollapse)
                            remove-embedded-blocks)]
       (when-let [index (get-elem-idx blocks block)]
           (let [idx (dec index)]
             (when (>= idx 0)
               (nth-safe blocks idx)))))))

#?(:cljs
   (defn get-next-block-non-collapsed
     [block]
     (when-let [blocks (and block (get-blocks-noncollapse))]
       (when-let [index (get-elem-idx blocks block)]
         (let [idx (inc index)]
           (when (>= (count blocks) idx)
             (nth-safe blocks idx)))))))

#?(:cljs
   (defn get-next-block-non-collapsed-skip
     [block]
     (when-let [blocks (get-blocks-noncollapse)]
       (when-let [index (get-elem-idx blocks block)]
         (loop [idx (inc index)]
           (when (>= (count blocks) idx)
             (let [block (nth-safe blocks idx)
                   nested? (->> (array-seq (gdom/getElementsByClass "selected"))
                                (some (fn [dom] (.contains dom block))))]
               (if nested?
                 (recur (inc idx))
                 block))))))))

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

(defn pp-str [x]
  #_:clj-kondo/ignore
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
       (boolean (and (safe-re-find #"Chrome" user-agent)
                     (safe-re-find #"Google Inc" vendor))))))

#?(:cljs
   (defn indexeddb-check?
     "Check if indexedDB support is available, reject if not"
     []
     (let [db-name "logseq-indexeddb-check"]
       (if js/window.indexedDB
         (js/Promise. (fn [resolve reject]
                        (let [req (js/window.indexedDB.open db-name)]
                          (set! (.-onerror req) reject)
                          (set! (.-onsuccess req)
                                (fn [_event]
                                  (.close (.-result req))
                                  (let [req (js/window.indexedDB.deleteDatabase db-name)]
                                    (set! (.-onerror req) reject)
                                    (set! (.-onsuccess req) (fn [_event]
                                                              (resolve true)))))))))
         (p/rejected "no indexeddb defined")))))

(defonce mac? #?(:cljs goog.userAgent/MAC
                 :clj nil))

(defonce win32? #?(:cljs goog.userAgent/WINDOWS
                   :clj nil))

(defonce linux? #?(:cljs goog.userAgent/LINUX
                   :clj nil))

#?(:cljs
   (defn get-first-block-by-id
     [block-id]
     (when block-id
       (let [block-id (str block-id)]
         (when (uuid-string? block-id)
           (first (array-seq (js/document.getElementsByClassName (str "id" block-id)))))))))

#?(:cljs
   (defn url-encode
     [string]
     (some-> string str (js/encodeURIComponent) (.replace "+" "%20"))))

#?(:cljs
   (def page-name-sanity-lc
     "Delegate to common-util to loosely couple app usages to graph-parser"
     common-util/page-name-sanity-lc))

#?(:cljs
   (def safe-page-name-sanity-lc common-util/safe-page-name-sanity-lc))

#?(:cljs
   (def get-page-title common-util/get-page-title))

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
           (d/append! parent-node link))
         (set-android-theme)))))

(defn remove-common-preceding
  [col1 col2]
  (if (and (= (first col1) (first col2))
           (seq col1))
    (recur (rest col1) (rest col2))
    [col1 col2]))

;; fs
#?(:cljs
   (defn get-file-ext
     [file]
     (and
      (string? file)
      (string/includes? file ".")
      (some-> (common-util/path->file-ext file) string/lower-case))))

#?(:cljs
   (defn get-dir-and-basename
     [path]
     (let [parts (string/split path "/")
           basename (last parts)
           dir (->> (butlast parts)
                    string-join-path)]
       [dir basename])))

#?(:cljs
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
            string-join-path))))

#?(:clj
   (defmacro profile
     [k & body]
     `(if goog.DEBUG
        (let [k# ~k]
          (.time js/console k#)
          (let [res# (do ~@body)]
            (.timeEnd js/console k#)
            res#))
        (do ~@body))))

#?(:clj
   (defmacro with-time
     "Evaluates expr and prints the time it took.
      Returns the value of expr and the spent time of float number in msecs."
     [expr]
     `(let [start# (cljs.core/system-time)
            ret# ~expr]
        {:result ret#
         :time (- (cljs.core/system-time) start#)})))

;; TODO: profile and profileEnd

(comment
  (= (get-relative-path "journals/2020_11_18.org" "pages/grant_ideas.org")
     "../pages/grant_ideas.org")

  (= (get-relative-path "journals/2020_11_18.org" "journals/2020_11_19.org")
     "./2020_11_19.org")

  (= (get-relative-path "a/b/c/d/g.org" "a/b/c/e/f.org")
     "../e/f.org"))

(defn keyname [key] (str (namespace key) "/" (name key)))

;; FIXME: drain-chan was copied from frontend.worker.util due to shadow-cljs compile bug
#?(:cljs
   (defn drain-chan
     "drop all stuffs in CH, and return all of them"
     [ch]
     (->> (repeatedly #(async/poll! ch))
          (take-while identity))))

#?(:cljs
   (defn trace!
     []
     (js/console.trace)))

#?(:cljs
   (def remove-first common-util/remove-first))

#?(:cljs
   (defn backward-kill-word
     [input]
     (let [val     (.-value input)
           current (get-selection-start input)
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
       (safe-set-range-text! input "" idx current))))

#?(:cljs
   (defn forward-kill-word
     [input]
     (let [val   (.-value input)
           current (get-selection-start input)
           current (loop [idx current]
                     (if (#{\space \newline} (nth-safe val idx))
                       (recur (inc idx))
                       idx))
           idx (or (->> [(string/index-of val \space current)
                         (string/index-of val \newline current)]
                        (remove nil?)
                        (apply min))
                   (count val))]
       (safe-set-range-text! input "" current (inc idx)))))

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
                (when-not (nil? %) [(name %)]))
             args)))

#?(:cljs
   (defn- get-dom-top
     [node]
     (when node
       (gobj/get (.getBoundingClientRect node) "top"))))

#?(:cljs
   (defn sort-by-height
     [elements]
     (sort (fn [x y]
             (< (get-dom-top x) (get-dom-top y)))
           (remove nil? elements))))

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

(comment
  (re-matches (re-pattern (regex-escape "$u^8(d)+w.*[dw]d?")) "$u^8(d)+w.*[dw]d?"))

#?(:cljs
   (defn meta-key? [e]
     (if mac?
       (gobj/get e "metaKey")
       (gobj/get e "ctrlKey"))))

#?(:cljs
   (defn shift-key? [e]
     (gobj/get e "shiftKey")))


#?(:cljs
   (defn right-click?
     [e]
     (let [which (gobj/get e "which")
           button (gobj/get e "button")]
       (or (= which 3)
           (= button 2)))))

(def keyboard-height (atom nil))
#?(:cljs
   (defn scroll-editor-cursor
     [^js/HTMLElement el & {:keys [to-vw-one-quarter?]}]
     (when (and el (or (mobile-util/native-platform?) (mobile?)))
       (let [box-rect    (.getBoundingClientRect el)
             box-top     (.-top box-rect)
             box-bottom  (.-bottom box-rect)

             header-height (-> (gdom/getElementByClass "cp__header")
                               .-clientHeight)

             main-node   (app-scroll-container-node el)
             scroll-top  (.-scrollTop main-node)

             current-pos (get-selection-start el)
             grapheme-pos (get-graphemes-pos (.-value (.textContent el)) current-pos)
             mock-text   (some-> (gdom/getElement "mock-text")
                                 gdom/getChildren
                                 array-seq
                                 (nth-safe grapheme-pos))
             offset-top   (and mock-text (.-offsetTop mock-text))
             offset-height (and mock-text (.-offsetHeight mock-text))

             cursor-y    (if offset-top (+ offset-top box-top offset-height 2) box-bottom)
             vw-height   (or (.-height js/window.visualViewport)
                             (.-clientHeight js/document.documentElement))
             ;; mobile toolbar height: 40px
             scroll      (- cursor-y (- vw-height (+ @keyboard-height (+ 40 4))))]
         (cond
           (and to-vw-one-quarter? (> cursor-y (* vw-height 0.4)))
           (set! (.-scrollTop main-node) (+ scroll-top (- cursor-y (/ vw-height 4))))

           (and (< cursor-y (+ header-height offset-height 4)) ;; 4 is top+bottom padding for per line
                (>= cursor-y header-height))
           (.scrollBy main-node (bean/->js {:top (- (+ offset-height 4))}))

           (< cursor-y header-height)
           (let [_ (.scrollIntoView el true)
                 main-node (app-scroll-container-node el)
                 scroll-top (.-scrollTop main-node)]
             (set! (.-scrollTop main-node) (- scroll-top (/ vw-height 4))))

           (> scroll 0)
           (set! (.-scrollTop main-node) (+ scroll-top scroll))

           :else
           nil)))))

#?(:cljs
   (do
     (defn breakpoint?
       [size]
       (< (.-offsetWidth js/document.documentElement) size))

     (defn sm-breakpoint?
       [] (breakpoint? 640))))

#?(:cljs
   (do
     (defn goog-event?
       [^js e]
       (and e (fn? (gobj/get e "getBrowserEvent"))))

     (defn goog-event-is-composing?
       "Check if keydown event is a composing (IME) event.
        Ignore the IME process by default."
       ([^js e]
        (goog-event-is-composing? e false))
       ([^js e include-process?]
        (when (goog-event? e)
          (let [event-composing? (some-> (.getBrowserEvent e) (.-isComposing))]
            (if include-process?
              (or event-composing?
                (= (gobj/get e "keyCode") 229)
                (= (gobj/get e "key") "Process"))
              event-composing?)))))))

#?(:cljs
   (defn native-event-is-composing?
     "Check if onchange event of Input is a composing (IME) event.
       Always ignore the IME process."
     [^js e]
     (when-let [^js native-event
                (and e (cond
                         (goog-event? e)
                         (.getBrowserEvent e)

                         (js-in "_reactName" e)
                         (.-nativeEvent e)

                         :else e))]
       (.-isComposing native-event))))

#?(:cljs
   (defn open-url
     [url]
     (let [route? (or (string/starts-with? url
                                           (string/replace js/location.href js/location.hash ""))
                      (string/starts-with? url "#"))]
       (if (and (not route?) (electron?))
         (js/window.apis.openExternal url)
         (set! (.-href js/window.location) url)))))

(defn collapsed?
  [block]
  (:block/collapsed? block))

#?(:cljs
   (defn atom? [v]
     (instance? Atom v)))

;; https://stackoverflow.com/questions/32511405/how-would-time-ago-function-implementation-look-like-in-clojure
#?(:cljs
   (defn time-ago
     "time: inst-ms or js/Date"
     [time]
     (let [units [{:name "second" :limit 60 :in-second 1}
                  {:name "minute" :limit 3600 :in-second 60}
                  {:name "hour" :limit 86400 :in-second 3600}
                  {:name "day" :limit 604800 :in-second 86400}
                  {:name "week" :limit 2629743 :in-second 604800}
                  {:name "month" :limit 31556926 :in-second 2629743}
                  {:name "year" :limit js/Number.MAX_SAFE_INTEGER :in-second 31556926}]
           diff (t/in-seconds (t/interval (if (instance? js/Date time) time (js/Date. time)) (t/now)))]
       (if (< diff 5)
         "just now"
         (let [unit (first (drop-while #(or (>= diff (:limit %))
                                            (not (:limit %)))
                                       units))]
           (-> (/ diff (:in-second unit))
               Math/floor
               int
               (#(str % " " (:name unit) (when (> % 1) "s") " ago"))))))))
#?(:cljs
   (def JS_ROOT
     (when-not node-test?
       (if (= js/location.protocol "file:")
         "./js"
         "./static/js"))))

#?(:cljs
   (defn js-load$
     [url]
     (p/create
      (fn [resolve]
        (load url resolve)))))

#?(:cljs
   (defn css-load$
     ([url] (css-load$ url nil))
     ([url id]
      (p/create
       (fn [resolve reject]
         (let [id (str "css-load-" (or id url))]
           (if-not (gdom/getElement id)
             (let [^js link (js/document.createElement "link")]
               (set! (.-id link) id)
               (set! (.-rel link) "stylesheet")
               (set! (.-href link) url)
               (set! (.-onload link) resolve)
               (set! (.-onerror link) reject)
               (.append (.-head js/document) link))
             (resolve))))))))

#?(:cljs
   (defn image-blob->png
     [blob cb]
     (let [image (js/Image.)
           off-canvas (js/document.createElement "canvas")
           data-url (js/URL.createObjectURL blob)
           ctx (.getContext off-canvas "2d")]
       (set! (.-onload image)
             #(let [width (.-width image)
                    height (.-height image)]
                (set! (.-width off-canvas) width)
                (set! (.-height off-canvas) height)
                (.drawImage ctx image 0 0 width height)
                (.toBlob off-canvas cb)))
       (set! (.-src image) data-url))))

#?(:cljs
   (defn write-blob-to-clipboard
     [blob]
     (->> blob
          (js-obj (.-type blob))
          (js/ClipboardItem.)
          (array)
          (js/navigator.clipboard.write))))

#?(:cljs
   (defn copy-image-to-clipboard
     [src]
     (-> (js/fetch src)
         (.then (fn [data]
                  (-> (.blob data)
                      (.then (fn [blob]
                               (if (= (.-type blob) "image/png")
                                 (write-blob-to-clipboard blob)
                                 (image-blob->png blob write-blob-to-clipboard))))
                      (.catch js/console.error)))))))

(defn memoize-last
  "Different from core.memoize, it only cache the last result.
   Returns a memoized version of a referentially transparent function. The
  memoized version of the function cache the the last result, and replay when calls
   with the same arguments, or update cache when with different arguments."
  [f]
  (let [last-mem (atom nil)
        last-args (atom nil)]
    (fn [& args]
      (if (or (nil? @last-mem)
              (not= @last-args args))
        (let [ret (apply f args)]
          (reset! last-args args)
          (reset! last-mem ret)
          ret)
        @last-mem))))

#?(:cljs
   (do
     (defn <app-wake-up-from-sleep-loop
       "start a async/go-loop to check the app awake from sleep.
Use (async/tap `pubsub/app-wake-up-from-sleep-mult`) to receive messages.
Arg *stop: atom, reset to true to stop the loop"
       [*stop]
       (let [*last-activated-at (volatile! (tc/to-epoch (t/now)))]
         (async/go-loop []
           (if @*stop
             (println :<app-wake-up-from-sleep-loop :stop)
             (let [now-epoch (tc/to-epoch (t/now))]
               (when (< @*last-activated-at (- now-epoch 10))
                 (async/>! pubsub/app-wake-up-from-sleep-ch {:last-activated-at @*last-activated-at :now now-epoch}))
               (vreset! *last-activated-at now-epoch)
               (async/<! (async/timeout 5000))
               (recur))))))))


(defmacro concatv
  "Vector version of concat. non-lazy"
  [& args]
  `(vec (concat ~@args)))

(defmacro mapcatv
  "Vector version of mapcat. non-lazy"
  [f coll & colls]
  `(vec (mapcat ~f ~coll ~@colls)))

(defmacro removev
  "Vector version of remove. non-lazy"
  [pred coll]
  `(vec (remove ~pred ~coll)))

#?(:cljs
   (defn safe-with-meta
     [o meta]
     (if (satisfies? IMeta o)
       (with-meta o meta)
       o)))

;; from rum
#?(:cljs
   (def schedule
     (or (and (exists? js/window)
              (or js/window.requestAnimationFrame
                  js/window.webkitRequestAnimationFrame
                  js/window.mozRequestAnimationFrame
                  js/window.msRequestAnimationFrame))
         #(js/setTimeout % 16))))

#?(:cljs
   (defn parse-params
     "Parse URL parameters in hash(fragment) into a hashmap"
     []
     (if node-test?
       {}
       (when-let [fragment (-> js/window
                               (.-location)
                               (.-hash)
                               not-empty)]
         (when (string/starts-with? fragment "#/?")
           (->> (subs fragment 2)
                (new js/URLSearchParams)
                (seq)
                (js->clj)
                (into {})
                (walk/keywordize-keys)))))))
