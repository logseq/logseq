(ns frontend.diff
  (:require [clojure.string :as string]
            ["diff" :as jsdiff]
            ["diff-match-patch" :as diff-match-patch]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [cljs-bean.core :as bean]))

;; TODO: replace with diff-match-patch
(defn diff
  [s1 s2]
  (-> ((gobj/get jsdiff "diffLines") s1 s2)
      bean/->clj))

(defonce dmp (diff-match-patch.))

(defn diffs
  [s1 s2]
  (.diff_main dmp s1 s2 true))

(defn get-patches
  [s1 s2 diffs]
  (.patch_make dmp s1 s2 diffs))

(defn apply-patches!
  [text patches]
  (if (seq patches)
    (let [result (.patch_apply dmp patches text)]
      (nth result 0))
    text))

;; (find-position "** hello _w_" "hello w")
(defn find-position
  [markup text]
  (try
    (loop [t1 (-> markup string/lower-case seq)
           t2 (-> text   string/lower-case seq)
           i1 0
           i2 0]
      (let [[h1 & r1] t1
            [h2 & r2] t2]
        (cond
          (or (empty? t1) (empty? t2))
          i1

          (= h1 h2)
          (recur r1 r2 (inc i1) (inc i2))

          (#{\[ \space \]} h2)
          (recur t1 r2 i1 (inc i2))

          :else
          (recur r1 t2 (inc i1) i2))))
    (catch js/Error e
      (log/error :diff/find-position {:error e})
      (count markup))))
