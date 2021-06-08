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

(defn get-caret-pos
  [input]
  (when input
    (try
      (let [pos ((gobj/get caret-pos "position") input)]
        (bean/->clj pos))
      (catch js/Error e
        (js/console.error e)))))

(defn move-cursor-to [input n]
  (.setSelectionRange input n n))

(defn move-cursor-up [input]
  (let [elms  (-> (gdom/getElement "mock-text")
                  gdom/getChildren
                  array-seq)
        cusor (-> input
                  (util/get-caret-pos)
                  (select-keys [:left :top :pos]))
        chars (->> elms
                   (map mock-char-pos)
                   (group-by :top))
        tops  (sort (keys chars))
        tops-p (partition-by #(== (:top cusor) %) tops)
        prev-t (-> tops-p first last)
        lefts
        (->> (get chars prev-t)
             (partition-by (fn [char-pos]
                             (<= (:left char-pos) (:left cusor)))))
        left-a (-> lefts first last)
        left-c (-> lefts last first)
        closer
        (if (> 2 (count lefts))
          left-a
          (closer left-a cusor left-c))]
    (move-cursor-to input (:pos closer))))

(defn move-cursor-down [input]
  (let [elms  (-> (gdom/getElement "mock-text")
                  gdom/getChildren
                  array-seq)
        cusor (-> input
                  (util/get-caret-pos)
                  (select-keys [:left :top :pos]))
        chars (->> elms
                   (map mock-char-pos)
                   (group-by :top))
        tops  (sort (keys chars))
        tops-p (partition-by #(== (:top cusor) %) tops)
        next-t (-> tops-p last first)
        lefts
        (->> (get chars next-t)
             (partition-by (fn [char-pos]
                             (<= (:left char-pos) (:left cusor)))))
        left-a (-> lefts first last)
        left-c (-> lefts last first)
        closer
        (if (< (count lefts) 2)
          left-a
          (closer left-a cusor left-c))]
    (move-cursor-to input (:pos closer))))

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
