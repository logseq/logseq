(ns ^:no-doc frontend.util.thingatpt
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [goog.object :as gobj]))

(defn thing-at-point
  [bounds & [input ignore]]
  (let [input (or input (state/get-input))
        content (gobj/get input "value")
        pos (cursor/pos input)
        [left right] (if (coll? bounds) bounds [bounds bounds])]
    (when-not (string/blank? content)
      (let [start (string/last-index-of
                   content left (if (= left right) (- pos (count left)) (dec pos)))
            end (string/index-of
                 content right (if (= left right) pos (inc (- pos (count right)))))
            end* (+ (count right) end)]
        (when (and start end (not= start pos))
          (let [thing (subs content (+ start (count left)) end)]
            (when (every?
                   false?
                   (mapv #(string/includes? thing %)
                         [left right ignore]))
              {:full-content (subs content start end*)
               :raw-content (subs content (+ start (count left)) end)
               :bounds bounds
               :start start
               :end end*})))))))

(defn markdown-src-at-point [& [input]]
  (when-let [markdown-src (thing-at-point ["```" "```"] input)]
    (let [language (-> (:full-content markdown-src)
                       string/split-lines
                       first
                       (string/replace "```" "")
                       string/trim)
          raw-content (:raw-content markdown-src)
          blank-raw-content? (string/blank? raw-content)
          action (if (or blank-raw-content? (= (string/trim raw-content) language))
                   :into-code-editor
                   :none)]
      (assoc markdown-src
             :type "source-block"
             :language language
             :action action
             :headers nil))))
