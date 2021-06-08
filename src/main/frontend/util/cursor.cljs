(ns frontend.util.cursor
  (:require ["/frontend/caret_pos" :as caret-pos]
            [cljs-bean.core :as bean]
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

(defn- get-caret-pos
  [input]
  (when input
    (try
      (let [pos ((gobj/get caret-pos "position") input)]
        (bean/->clj pos))
      (catch js/Error e
        (js/console.error e)))))

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

(defn move-cursor-to-end
  [input]
  (let [pos (count (gobj/get input "value"))]
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

(defn- move-cursor-up-down
  [input direction]
  (let [elms  (-> (gdom/getElement "mock-text")
                  gdom/getChildren
                  array-seq)
        cusor (-> input
                  (get-caret-pos)
                  (select-keys [:left :top :pos]))
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
