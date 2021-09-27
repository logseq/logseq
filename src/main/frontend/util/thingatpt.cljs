(ns frontend.util.thingatpt
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util.property :as property-util]
            [frontend.util.cursor :as cursor]
            [frontend.handler.route :as handler-route]
            [goog.object :as gobj]))

(defn- get-content&pos-at-point []
  (when-let [input (state/get-input)]
    [(gobj/get input "value") (cursor/pos input)]))

(defn thing-at-point
  [{:keys [left right] :as bounds} & [content pos ignore]]
  (when-let [[content pos] (if (and content pos)
                             [content pos]
                             (get-content&pos-at-point))]
    (let [start (string/last-index-of
                 content left (if (= left right) (- pos (count left)) (dec pos)))
          end (string/index-of
               content right (if (= left right) pos (inc (- pos (count right)))))
          end* (+ (count right) end)]
      (when (and start end)
        (let [thing (subs content (+ start (count left)) end)]
          (when (every?
                 false?
                 (mapv #(string/includes? thing %)
                       [left right ignore]))
            {:full-content (subs content start end*)
             :raw-content (subs content (+ start (count left)) end)
             :start start
             :end end*}))))))

(defn block-ref-at-point [& [content pos]]
  (thing-at-point {:left "((" :right "))"} content pos " "))

(defn page-ref-at-point [& [content pos]]
  (thing-at-point {:left "[[" :right "]]"} content pos " "))

(defn embed-macro-at-point [& [content pos]]
  (thing-at-point {:left "{{embed" :right "}}"} content pos " "))

(defn properties-at-point [& [content pos]]
  (case (state/get-preferred-format)
    :org (thing-at-point
          {:left property-util/properties-start
           :right property-util/properties-end}
          content
          pos)
    nil))


