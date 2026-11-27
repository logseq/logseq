(ns frontend.extensions.pdf.utils
  (:require ["/frontend/extensions/pdf/utils" :as js-utils]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.common.uuid :as common-uuid]
            [promesa.core :as p]))

(defonce MAX-SCALE 5.0)
(defonce MIN-SCALE 0.25)
(defonce DELTA_SCALE 1.05)

(defn hls-file?
  [filename]
  (and filename (string? filename) (string/starts-with? filename "hls__")))

(defn get-bounding-rect
  [rects]
  (bean/->clj (js-utils/getBoundingRect (bean/->js rects))))

(defn viewport-to-scaled
  [bounding ^js viewport]
  (bean/->clj (js-utils/viewportToScaled (bean/->js bounding) viewport)))

(defn scaled-to-viewport
  [bounding ^js viewport]
  (bean/->clj (js-utils/scaledToViewport (bean/->js bounding) viewport)))

(defn optimize-client-reacts
  [rects]
  (when (seq rects)
    (bean/->clj (js-utils/optimizeClientRects (bean/->js rects)))))

(defn vw-to-scaled-pos
  [^js viewer {:keys [page bounding rects]}]
  (when-let [^js viewport (some-> viewer ^js (.getPageView (dec page)) (.-viewport))]
    {:bounding (viewport-to-scaled bounding viewport)
     :rects    (for [rect rects] (viewport-to-scaled rect viewport))
     :page     page}))

(defn scaled-to-vw-pos
  [^js viewer {:keys [page bounding rects]}]
  (when-let [^js viewport (some-> viewer ^js (.getPageView (dec page)) (.-viewport))]
    {:bounding (scaled-to-viewport bounding viewport)
     :rects    (for [rect rects] (scaled-to-viewport rect viewport))
     :page     page}))

(defn resolve-hls-layer!
  [^js viewer page]
  (when-let [^js text-layer (some-> viewer ^js (.getPageView (dec page)) (.-textLayer))]
    (let [^js cnt (.-div text-layer)
          cls "extensions__pdf-hls-layer"
          doc js/document
          layer (.querySelector cnt (str "." cls))]
      (if-not layer
        (let [layer (.createElement doc "div")]
          (set! (. layer -className) cls)
          (.appendChild cnt layer)
          layer)
        layer))))

(defn scroll-to-highlight
  [^js viewer hl]
  (when-let [js-hl (bean/->js hl)]
    (js-utils/scrollToHighlight viewer js-hl)))

(defn zoom-in-viewer
  [^js viewer]
  (let [cur-scale (.-currentScale viewer)]
    (when (< cur-scale MAX-SCALE)
      (let [new-scale (.toFixed (* cur-scale DELTA_SCALE) 2)
            new-scale (/ (js/Math.ceil (* new-scale 10)) 10)
            new-scale (min MAX-SCALE new-scale)]

        (set! (.-currentScale viewer) new-scale)))))

(defn zoom-out-viewer
  [^js viewer]
  (let [cur-scale (.-currentScale viewer)]
    (when (> cur-scale MIN-SCALE)
      (let [new-scale (.toFixed (/ cur-scale DELTA_SCALE) 2)
            new-scale (/ (js/Math.floor (* new-scale 10)) 10)
            new-scale (max MIN-SCALE new-scale)]

        (set! (.-currentScale viewer) new-scale)))))

(defn get-meta-data$
  [^js viewer]
  (when-let [^js doc (and viewer (.-pdfDocument viewer))]
    (p/create
     (fn [resolve]
       (p/catch
        (p/then (.getMetadata doc)
                (fn [^js r]
                  (js/console.debug "[metadata] " r)
                  (when-let [^js info (and r (.-info r))]
                    (resolve (bean/->clj info)))))
        (fn [e]
          (resolve nil)
          (js/console.error e)))))))

(defn clear-all-selection
  ([] (clear-all-selection js/window))
  ([^js win]
   (some-> win (.getSelection) (.removeAllRanges))))

(defn adjust-viewer-size!
  [^js viewer]
  (let [bus (.-eventBus viewer)]
    (.dispatch bus "resizing")))

(defn reset-viewer-auto! [^js viewer]
  (set! (. viewer -currentScaleValue) "auto"))

(defn fix-nested-js
  [its]
  (when (sequential? its)
    (mapv #(if (map? %) % (bean/->clj %)) its)))

(defn gen-uuid
  []
  (common-uuid/gen-uuid))

(defn get-page-from-el
  [^js/HTMLElement el]
  (when-let [^js page-el (and el (.closest el ".page"))]
    {:page-number (.. page-el -dataset -pageNumber)
     :page-el     page-el}))

(defn get-page-from-range
  [^js/Range r]
  (when-let [parent-el (and r (.. r -startContainer -parentElement))]
    (get-page-from-el parent-el)))

(defn get-range-rects<-page-cnt
  [^js/Range r ^js page-cnt]
  (let [rge-rects (bean/->clj (.getClientRects r))
        ^js cnt-offset (.getBoundingClientRect page-cnt)]

    (when (seq rge-rects)
      (let [rects (for [rect rge-rects
                        :when (and rect (not (zero? (.-width rect))) (not (zero? (.-height rect))))]
                    {:top    (- (+ (.-top rect) (.-scrollTop page-cnt)) (.-top cnt-offset))
                     :left   (- (+ (.-left rect) (.-scrollLeft page-cnt)) (.-left cnt-offset))
                     :width  (.-width rect)
                     :height (.-height rect)})]
        (optimize-client-reacts rects)))))

(defn fix-selection-text-breakline
  [text]

  (when-not (string/blank? text)
    (let [sp "|#|"]
      (-> text
          (string/replace #"[\r\n]+" sp)
          (string/replace (str "-" sp) "")
          (string/replace #"\|#\|([a-zA-Z_])" " $1")
          (string/replace sp "")))))

;; Spacing modifier letters used as overlay accents in TeX/OT1 and similar PDF
;; text. NFC/NFKC leave these untouched because they are not combining marks.
(def ^:private spacing-diacritic->combining
  {"\u02C7" "\u030C" ; caron ˇ
   "\u00B4" "\u0301" ; acute ´
   "\u02CB" "\u0300" ; modifier grave ˋ (not ASCII `)
   "\u00A8" "\u0308" ; diaeresis ¨
   "\u02D8" "\u0306" ; breve ˘
   "\u02D9" "\u0307" ; dot above ˙
   "\u02DA" "\u030A" ; ring above ˚
   "\u02DB" "\u0328" ; ogonek ˛
   "\u02DC" "\u0303" ; small tilde ˜
   "\u02DD" "\u030B" ; double acute ˝
   "\u00B8" "\u0327" ; cedilla ¸
   "\u02C6" "\u0302" ; modifier circumflex ˆ (not ASCII ^)
   "\u00AF" "\u0304"}) ; macron ¯

(def ^:private unicode-letter-re (js/RegExp. "^\\p{L}$" "u"))
(def ^:private whitespace-char-re (js/RegExp. "^\\s$" "u"))

(defn- unicode-letter?
  [ch]
  (boolean (and ch (.test unicode-letter-re ch))))

(defn- whitespace-char?
  [ch]
  (boolean (and ch (.test whitespace-char-re ch))))

(defn- spacing-diacritic?
  [ch]
  (contains? spacing-diacritic->combining ch))

(defn- composable-base-letter?
  [ch]
  (and (unicode-letter? ch)
       (not (spacing-diacritic? ch))))

(defn- compose-letter-and-spacing-diacritic
  [letter spacing-diacritic]
  (when (composable-base-letter? letter)
    (when-let [combining (get spacing-diacritic->combining spacing-diacritic)]
      (let [composed (.normalize (str letter combining) "NFC")]
        (when (and (= 1 (.-length composed))
                   (not= composed letter))
          composed)))))

(defn- try-compose-pair
  [left right]
  ;; Accent-before-letter first: U+02C7/U+02C6 are Unicode Lm.
  (or (compose-letter-and-spacing-diacritic right left)
      (compose-letter-and-spacing-diacritic left right)))

(defn- codepoint-at
  [^js codepoints idx]
  (when (and (<= 0 idx) (< idx (alength codepoints)))
    (aget codepoints idx)))

(defn- whitespace-blocked-pair?
  "Do not compose across a space when the accent already sits next to another letter."
  [^js codepoints left-idx right-idx]
  (boolean
   (or (and (spacing-diacritic? (aget codepoints right-idx))
            (composable-base-letter? (codepoint-at codepoints (inc right-idx))))
       (and (spacing-diacritic? (aget codepoints left-idx))
            (composable-base-letter? (codepoint-at codepoints (dec left-idx)))))))

(defn compose-pdf-spacing-diacritics
  "Compose overlay spacing accents from PDF text into precomposed letters.

  PDFs (especially TeX) often draw š as s plus a spacing caron (U+02C7). pdf.js
  exposes those as adjacent characters; NFC does not compose them. Convert a
  spacing accent that directly follows or precedes a letter (optionally with one
  text-layer space) into its combining mark and keep the NFC form only when that
  yields a single precomposed character. Direct adjacency wins over a pair
  across whitespace. Standalone accents, ASCII ^/`, and non-composing pairs
  are left unchanged."
  [text]
  (if-not (string? text)
    text
    (let [^js codepoints (js/Array.from text)
          n (alength codepoints)
          ^js out (js/Array.)]
      (loop [i 0]
        (if (>= i n)
          (.join out "")
          (let [ch (aget codepoints i)
                j (inc i)
                next-ch (codepoint-at codepoints j)
                adjacent (when (and next-ch (not (whitespace-char? next-ch)))
                           (when-let [composed (try-compose-pair ch next-ch)]
                             [composed (inc j)]))
                across-space (when (and (nil? adjacent)
                                        (whitespace-char? next-ch)
                                        (< (inc j) n))
                               (let [right-idx (inc j)
                                     partner (aget codepoints right-idx)]
                                 (when-not (whitespace-blocked-pair? codepoints i right-idx)
                                   (when-let [composed (try-compose-pair ch partner)]
                                     [composed (inc right-idx)]))))
                composed-pair (or adjacent across-space)]
            (if composed-pair
              (let [[composed next-i] composed-pair]
                (.push out composed)
                (recur next-i))
              (do (.push out ch)
                  (recur (inc i))))))))))

(defn normalize-pdf-selection-text
  "Normalize PDF highlight/copy text: join wrapped lines, then compose overlay accents."
  [text]
  (some-> text
          fix-selection-text-breakline
          compose-pdf-spacing-diacritics))

(defn fix-local-asset-pagename
  [filename]
  (if (and (string? filename) (not (string/blank? filename)))
    (let [local-asset? (re-find #"[0-9]{13}_\d$" filename)
          hls?         (hls-file? filename)
          len          (count filename)]
      (if (or local-asset? hls?)
        (-> filename
            (subs 0 (if local-asset? (- len 15) len))
            (string/replace #"^hls__" "")
            (string/replace #"__[-\d]+$" "")
            (string/replace "_" " ")
            (string/trimr))
        filename))
    filename))

;; TODO: which viewer instance?
(defn next-page
  []
  (try
    (js-invoke js/window.lsActivePdfViewer "nextPage")
    (catch :default _e nil)))

(defn prev-page
  []
  (try
    (js-invoke js/window.lsActivePdfViewer "previousPage")
    (catch :default _e nil)))

(defn open-finder
  []
  (try
    (when-let [^js el (js/document.querySelector ".extensions__pdf-toolbar a[title=Search]")]
      (.click el))
    (catch js/Error _e nil)))

(comment
  (fix-selection-text-breakline "this is a\ntest paragraph")
  (fix-selection-text-breakline "he is 1\n8 years old")
  (fix-selection-text-breakline "这是一个\n\n段落")
  (fix-selection-text-breakline "これ\n\nは、段落")
  (fix-selection-text-breakline "this is a te-\nst paragraph")
  (normalize-pdf-selection-text "Pli s\u02C7 ka \u010D")
  (normalize-pdf-selection-text "s\n\u02C7"))
