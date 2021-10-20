(ns frontend.util.cursor
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

(defn get-caret-pos
  "Get caret offset position as well as input element rect.

  This function is only used by autocomplete command or up/down command
  where offset position is needed.

  If you only need character position, use `pos` instead. Do NOT call this."
  [input]
  (let [pos (.-selectionStart input)
        rect (bean/->clj (.. input (getBoundingClientRect) (toJSON)))]
    (try
      (-> (gdom/getElement "mock-text")
          gdom/getChildren
          array-seq
          (util/nth-safe pos)
          mock-char-pos
          (assoc :rect rect))
      (catch :default _e
        (js/console.log "index error" _e)
        {:pos pos
         :rect rect
         :left js/Number.MAX_SAFE_INTEGER
         :top js/Number.MAX_SAFE_INTEGER}))))


(defn pos [input]
  (when input
    (.-selectionStart input)))

(defn start? [input]
  (and input (zero? (.-selectionStart input))))

(defn end? [input]
  (and input
       (= (count (.-value input))
          (.-selectionStart input))))

(defn set-selection-to [input n m]
  (.setSelectionRange input n m))

(defn move-cursor-to [input n]
  (.setSelectionRange input n n))

(defn move-cursor-forward
  ([input]
   (move-cursor-forward input 1))
  ([input n]
   (when input
     (let [{:keys [pos]} (get-caret-pos input)
           pos (+ pos n)]
       (move-cursor-to input pos)))))

(defn move-cursor-backward
  ([input]
   (move-cursor-backward input 1))
  ([input n]
   (when input
     (let [{:keys [pos]} (get-caret-pos input)
           pos (- pos n)]
       (move-cursor-to input pos)))))

(defn- get-input-content&pos
  [input]
  [(gobj/get input "value")
   (pos input)])

(defn line-beginning-pos
  [input]
  (let [[content pos] (get-input-content&pos input)]
    (if (zero? pos) 0
        (inc (string/last-index-of content \newline (dec pos))))))

(defn line-end-pos
  [input]
  (let [[content pos] (get-input-content&pos input)]
    (or (string/index-of content \newline pos)
        (count content))))

(defn beginning-of-line?
  [input]
  (let [[content pos] (get-input-content&pos input)]
    (or (zero? pos)
        (when-let [pre-char (subs content (dec pos) pos)]
          (= pre-char \newline)))))

(defn end-of-line?
  [input]
  (let [[content pos] (get-input-content&pos input)]
    (or (= pos (count content))
        (when-let [next-char (subs content pos (inc pos))]
          (= next-char \newline)))))

(defn move-cursor-to-line-end
  [input]
  (move-cursor-to input (line-end-pos input)))

(defn move-cursor-to-line-beginning
  [input]
  (move-cursor-to input (line-beginning-pos input)))

(defn move-cursor-to-beginning
  [input]
  (move-cursor-to input 0))

(defn move-cursor-to-end
  [input]
  (let [pos (count (gobj/get input "value"))]
    (move-cursor-to input pos)))

(defn move-cursor-to-thing
  [input thing from]
  (let [[content _pos] (get-input-content&pos input)
        pos (string/index-of content thing from)]
    (move-cursor-to input pos)))

(defn move-cursor-forward-by-word
  [input]
  (let [val   (.-value input)
        current (.-selectionStart input)
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
                     (if (#{\space \newline} (util/nth-safe val idx))
                       (recur (dec idx))
                       idx))
                   inc))]
    (move-cursor-to input idx)))

(defn textarea-cursor-first-row? [input]
  (let [elms   (-> (gdom/getElement "mock-text")
                   gdom/getChildren
                   array-seq)
        cursor (-> input
                   (get-caret-pos))
        tops   (->> elms
                    (map mock-char-pos)
                    (map :top)
                    (distinct))]
    (= (first tops) (:top cursor))))

(defn textarea-cursor-last-row? [input]
  (let [elms   (-> (gdom/getElement "mock-text")
                   gdom/getChildren
                   array-seq)
        cursor (-> input
                   (get-caret-pos))
        tops   (->> elms
                    (map mock-char-pos)
                    (map :top)
                    (distinct))]
    (= (last tops) (:top cursor))))

(defn- move-cursor-up-down
  [input direction]
  (let [elms  (-> (gdom/getElement "mock-text")
                  gdom/getChildren
                  array-seq)
        cusor (-> input
                  (get-caret-pos))
        chars (->> elms
                   (map mock-char-pos)
                   (group-by :top))
        tops  (sort (keys chars))
        tops-p (partition-by #(== (:top cusor) %) tops)
        line-next
        (if (= :up direction)
          (-> tops-p first last)
          (-> tops-p last first))
        lefts
        (->> (get chars line-next)
             (partition-by (fn [char-pos]
                             (<= (:left char-pos) (:left cusor)))))
        left-a (-> lefts first last)
        left-c (-> lefts last first)
        closer
        (if (> 2 (count lefts))
          left-a
          (closer left-a cusor left-c))]
    (move-cursor-to input (:pos closer))))

(defn move-cursor-up [input]
  (move-cursor-up-down input :up))

(defn move-cursor-down [input]
  (move-cursor-up-down input :down))

(comment
  ;; previous implementation of up/down
  (defn move-cursor-up
    "Move cursor up. If EOL, always move cursor to previous EOL."
    [input]
    (let [val (gobj/get input "value")
          pos (.-selectionStart input)
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
          pos (.-selectionStart input)
          prev-idx (or (string/last-index-of val \newline pos) -1)
          next-idx (or (string/index-of val \newline (inc pos))
                       (count val))
          nnext-idx (or (string/index-of val \newline (inc next-idx))
                        (count val))
          cal-idx (+ next-idx pos (- prev-idx))]
      (if (> (- pos prev-idx) (- nnext-idx next-idx))
        (move-cursor-to input nnext-idx)
        (move-cursor-to input cal-idx)))))
