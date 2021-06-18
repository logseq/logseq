(ns frontend.util.thingatpt
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.state :as state]
            [goog.object :as gobj]
            [frontend.util.cursor :as cursor]
            ))

(defn- get-content&pos-at-point []
  (when-let [input (state/get-input)]
    [(gobj/get input "value") (cursor/pos input)]))


(defn block-ref-at-point []
  (when-let [[content pos] (get-content&pos-at-point)]
    (let [start (string/last-index-of content "((" pos)
          end (string/index-of content "))" (- pos 2))
          end* (+ 2 end)]
      (when (and start end)
        (let [block-ref-id (subs content (+ start 2) end)]
          (when (every? false? (mapv #(string/includes? block-ref-id %) ["((" "))" " "]))
            {:content (subs content start end*)
             :start start
             :end end*}))))))

(defn embed-macro-at-point []
  (when-let [[content pos] (get-content&pos-at-point)]
    (let [start (string/last-index-of content "{{embed" pos)
          end (string/index-of content "}}" (- pos 2))
          end* (+ 2 end)]
      (when (and start end)
        (let [macro-content (subs content (+ start 2) end)]
          (when (every? false? (mapv #(string/includes? macro-content %) ["{{embed" "}}"]))
            {:content (subs content start end*)
             :start start
             :end end*}))))))
