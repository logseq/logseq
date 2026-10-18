(ns ^:no-doc frontend.util.cursor
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

(defn- closer [a b c]
  (let [a-left (or (:left a) 0)
        b-left (:left b)
        c-left (or (:left c) js/Number.MAX_SAFE_INTEGER)]
    (if (< (- b-left a-left) (- c-left b-left))
      a
      c)))

(defn mock-char-pos [e]
  {:left (.-offsetLeft e)
   :top  (.-offsetTop e)
   :pos  (-> (.-id e)
             (string/split "_")
             second
             int)})

(defn- mock-text-el
  "The .mock-text mirror that belongs to `input`: the one inside the same
   .editor-inner, so two mounted editors each keep their own. Nil without an
   input: the comments UI mounts several editors at once, and another
   editor's mirror holds another block's text in a box of another width, so a
   caret measured against it lands on the wrong row and column."
  [input]
  (some-> input (.closest ".editor-inner") (.querySelector ".mock-text")))

(defn build-mock-text!
  "Fills the input's .mock-text mirror (the hidden copy of the editing
   textarea) with one span per grapheme of the input's value plus a trailing
   \"0\", ids mock-text_<char index>, a newline rendered as \"0\" followed by
   <br>. The caret helpers below read this DOM. Built on demand, and only when
   the value changed since the last build, so a keystroke runs none of this."
  [input]
  (when-let [el (mock-text-el input)]
    (let [value (str (.-value input) "0")]
      (when-not (= value (gobj/get el "__mockValue"))
        (let [frag (js/document.createDocumentFragment)]
          (loop [idx 0
                 graphemes (seq (util/split-graphemes value))]
            (when-let [c (first graphemes)]
              (let [span (js/document.createElement "span")]
                (set! (.-id span) (str "mock-text_" idx))
                (set! (.-textContent span) (if (= c "\n") "0" c))
                (when (= c "\n")
                  (.appendChild span (js/document.createElement "br")))
                (.appendChild frag span))
              (recur (+ idx (count c)) (rest graphemes))))
          (set! (.-textContent el) "")
          (.appendChild el frag)
          (gobj/set el "__mockValue" value))))))

(defn get-caret-pos
  "Get caret offset position as well as input element rect.

  This function is only used by autocomplete command or up/down command
  where offset position is needed.

  If you only need character position, use `pos` instead. Do NOT call this."
  ([input] (get-caret-pos input (util/get-selection-start input)))
  ([input pos]
   (when input
     (let [rect (bean/->clj (.. input (getBoundingClientRect) (toJSON)))
           grapheme-pos (util/get-graphemes-pos (.-value input) pos)]
       (build-mock-text! input)
       (try
         (some-> (mock-text-el input)
                 (.-children)
                 (.item grapheme-pos)
                 mock-char-pos
                 (assoc :rect rect))
         (catch :default e
           (js/console.log "index error" e)
           {:pos pos
            :rect rect
            :left js/Number.MAX_SAFE_INTEGER
            :top js/Number.MAX_SAFE_INTEGER}))))))

(defn pos [input]
  (when input
    (util/get-selection-start input)))

(defn start? [input]
  (and input (zero? (util/get-selection-start input))))

(defn end? [input]
  (and input
       (= (count (.-value input))
          (util/get-selection-start input))))

(defn set-selection-to [input n m]
  (.setSelectionRange input n m))

(defn move-cursor-to
  ([input n] (move-cursor-to input n false))
  ([input n delay?']
   (when (number? n)
     (.setSelectionRange input n n)
     (when-not (= js/document.activeElement input)
       (let [focus #(.focus input)]
         (if delay?' (js/setTimeout focus 16) (focus)))))))

(defn move-cursor-forward
  ([input]
   (move-cursor-forward input 1))
  ([input n]
   (when input
     (let [{pos' :pos} (get-caret-pos input)
           pos'' (if (= n 1)
                   (or (util/safe-inc-current-pos-from-start (.-value input) pos')
                       (inc pos'))
                   (+ pos' n))]
       (move-cursor-to input pos'')))))

(defn move-cursor-backward
  ([input]
   (move-cursor-backward input 1))
  ([input n]
   (when input
     (let [{pos' :pos} (get-caret-pos input)
           pos'' (if (= n 1)
                   (util/safe-dec-current-pos-from-end (.-value input) pos')
                   (- pos' n))]
       (move-cursor-to input pos'')))))

(defn- get-input-content&pos
  [input]
  [(gobj/get input "value")
   (pos input)])

(defn beginning-of-line?
  [input]
  (let [[content pos'] (get-input-content&pos input)]
    (when content
      (or (zero? pos')
          (when-let [pre-char (subs content (dec pos') pos')]
            (= pre-char \newline))))))

(comment
  (defn line-end-pos
    [input]
    (let [[content pos'] (get-input-content&pos input)]
      (or (string/index-of content \newline pos')
          (count content))))

  (defn move-cursor-to-line-beginning
    [input]
    (move-cursor-to input (line-beginning-pos input)))

  (defn move-cursor-to-line-end
    [input]
    (move-cursor-to input (line-end-pos input))))

(defn move-cursor-to-start
  [input]
  (move-cursor-to input 0))

(defn move-cursor-to-end
  [input]
  (let [pos' (count (gobj/get input "value"))]
    (move-cursor-to input pos')))

(defn move-cursor-forward-by-word
  [input]
  (let [val   (.-value input)
        current (util/get-selection-start input)
        current (loop [idx current]
                  (if (#{\space \newline} (util/nth-safe val idx))
                    (recur (inc idx))
                    idx))
        idx (or (->> [(string/index-of val \space current)
                      (string/index-of val \newline current)]
                     (remove nil?)
                     (apply min))
                (count val))]
    (move-cursor-to input idx)))

(defn move-cursor-backward-by-word
  [input]
  (let [val     (.-value input)
        current (util/get-selection-start input)
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
                     (if (#{\space \newline} (util/nth-safe val idx))
                       (recur (dec idx))
                       idx))
                   inc))]
    (move-cursor-to input idx)))

(defn textarea-cursor-rect-first-row?
  ;; The mirror's spans are in document order, so the first span is on the
  ;; first row: one offsetTop read instead of one per character. The caret
  ;; rect and the span must come from the same mirror, hence the input.
  [cursor input]
  (let [first-elm (some-> (mock-text-el input) .-firstElementChild)]
    (and first-elm
         (= (.-offsetTop first-elm) (:top cursor)))))

(defn textarea-cursor-first-row? [input]
  (textarea-cursor-rect-first-row? (get-caret-pos input) input))

(defn textarea-cursor-rect-last-row?
  [cursor input]
  (let [last-elm (some-> (mock-text-el input) .-lastElementChild)]
    (and last-elm
         (= (.-offsetTop last-elm) (:top cursor)))))

(defn textarea-cursor-last-row? [input]
  (textarea-cursor-rect-last-row? (get-caret-pos input) input))

(defn- next-cursor-pos-up-down
  "The caret offset one visual row above or below `cursor`, read from the
   input's own mirror, which both callers have already built through
   get-caret-pos. Nil when the mirror is gone or when `cursor` sits on no row
   of it: the row arithmetic below reads a caret on an unknown row as one
   partition and would then move the caret to the far end of the block."
  [input direction cursor]
  (when-let [mock-text (mock-text-el input)]
    (let [elms  (-> mock-text
                    gdom/getChildren
                    array-seq)
          chars' (->> elms
                      (map mock-char-pos)
                      (group-by :top))
          tops  (sort (keys chars'))]
      (when (contains? chars' (:top cursor))
        (let [tops-p (partition-by #(== (:top cursor) %) tops)
              line-next
              (if (= :up direction)
                (-> tops-p first last)
                (-> tops-p last first))
              lefts
              (->> (get chars' line-next)
                   (partition-by (fn [char-pos]
                                   (<= (:left char-pos) (:left cursor)))))
              left-a (-> lefts first last)
              left-c (-> lefts last first)
              closer'
              (if (> 2 (count lefts))
                left-a
                (closer left-a cursor left-c))]
          (:pos closer'))))))

(defn- move-cursor-up-down
  [input direction]
  (move-cursor-to input (next-cursor-pos-up-down input direction (get-caret-pos input))))

(defn move-cursor-up [input]
  (move-cursor-up-down input :up))

(defn move-cursor-down [input]
  (move-cursor-up-down input :down))

(defn select-up-down [input direction anchor cursor-rect]
  (when-let [next-cursor (next-cursor-pos-up-down input direction cursor-rect)]
    (if (<= anchor next-cursor)
      (.setSelectionRange input anchor next-cursor "forward")
      (.setSelectionRange input next-cursor anchor "backward"))))

(comment
  ;; previous implementation of up/down
  (defn move-cursor-up
    "Move cursor up. If EOL, always move cursor to previous EOL."
    [input]
    (let [val (gobj/get input "value")
          pos (util/get-selection-start input)
          prev-idx (string/last-index-of val \newline pos)
          pprev-idx (or (string/last-index-of val \newline (dec prev-idx)) -1)
          cal-idx (+ pprev-idx pos (- prev-idx))]
      (if (or (== pos (count val))
              (> (- pos prev-idx) (- prev-idx pprev-idx)))
        (move-cursor-to input prev-idx)
        (move-cursor-to input cal-idx))))

  (defn move-cursor-down
    "Move cursor down by calculating current cursor line pos.
  If EOL, always move cursor to next EOL."
    [input]
    (let [val (gobj/get input "value")
          pos (util/get-selection-start input)
          prev-idx (or (string/last-index-of val \newline pos) -1)
          next-idx (or (string/index-of val \newline (inc pos))
                       (count val))
          nnext-idx (or (string/index-of val \newline (inc next-idx))
                        (count val))
          cal-idx (+ next-idx pos (- prev-idx))]
      (if (> (- pos prev-idx) (- nnext-idx next-idx))
        (move-cursor-to input nnext-idx)
        (move-cursor-to input cal-idx)))))
