(ns frontend.diff
  (:require [clojure.string :as string]))

"** hello _w_ hello _w_" "hello w"

;; (find-position "** hello _w_" "hello w")
;; {:text "Startup\nWho're your target users?\nWhen you have an idea for a startup, ask yourself: who wants this    right now? Who wants this so much that they'll use it even when it's a    crappy version one made by a two-person startup they've never heard    of? If you can't answer that, the idea is probably bad",
;;  :markup "* Startup\n\n** Who're your target users?\n   When you have an idea for a startup, ask yourself: who wants this\n   right now? Who wants this so much that they'll use it even when it's a\n   crappy version one made by a two-person startup they've never heard\n   of? If you can't answer that, the idea is probably bad.\n"}
(defn find-position
  [markup text]
  (let [text (->> (string/split-lines text)
                  (map string/trim)
                  (string/join "\n"))
        v1 (vec markup)
        v2 (vec text)]
    (prn {:text text
          :markup markup})
    (loop [v1-chars v1
           v2-chars v2
           v1-idx 0
           v2-idx 0]
      (cond
        (empty? v2-chars)
        (dec v1-idx)

        (= " " (nth v2 v2-idx))
        (recur v1-chars
               (rest v2-chars)
               v1-idx
               (inc v2-idx))

        :else
        (do
          ;; (prn {:v1-idx v1-idx
          ;;       :v2-idx v2-idx
          ;;       :v1-char (nth v1 v1-idx)
          ;;       :v2-char (nth v2 v2-idx)})
          (if (= (string/lower-case (nth v1 v1-idx))
                 (string/lower-case (nth v2 v2-idx)))
            (recur (rest v1-chars)
                   (rest v2-chars)
                   (inc v1-idx)
                   (inc v2-idx))
            (recur (rest v1-chars)
                   v2-chars
                   (inc v1-idx)
                   v2-idx)))))))
