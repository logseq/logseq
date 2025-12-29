(ns ^:no-doc frontend.diff
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]))

(def inline-special-chars
  #{\* \_ \/ \` \+ \^ \~ \$})

(defn- markdown-link?
  [markup current-line pos]
  (and current-line
       (= (util/nth-safe markup pos) "]")
       (= (util/nth-safe markup (inc pos)) "(")
       (string/includes? (subs current-line 0 pos) "[")
       (string/includes? (subs current-line pos) ")")))

;; (find-position "** hello _w_" "hello w")
(defn find-position
  [markup text]
  (when (and (string? markup) (string? text))
    (try
      (let [pos (loop [t1 (-> markup string/lower-case seq)
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
            current-line (:line (text-util/get-current-line-by-pos markup pos))]
        (cond
          (= (util/nth-safe markup pos)
             (util/nth-safe markup (inc pos))
             "]")
          (+ pos 2)

          (contains? inline-special-chars (util/nth-safe markup pos))
          (let [matched (->> (take-while inline-special-chars (common-util/safe-subs markup pos))
                             (apply str))
                matched? (and current-line (string/includes? current-line (string/reverse matched)))]
            (if matched?
              (+ pos (count matched))
              pos))

          (markdown-link? markup current-line pos)
          (let [idx (string/index-of (subs current-line pos) ")")]
            (+ pos (inc idx)))

          :else
          pos))
      (catch :default e
        (log/error :diff/find-position {:error e})
        (count markup)))))
