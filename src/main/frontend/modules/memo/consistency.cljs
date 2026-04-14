;; src/main/frontend/modules/memo/consistency.cljs
(ns frontend.modules.memo.consistency
  (:require [clojure.string :as string]))

(defn extract-field [content field-pattern]
  (when-let [[_ value] (re-find field-pattern content)]
    (string/trim value)))

(defn check-conflicts [setting-a setting-b]
  (let [content-a (:body setting-a)
        content-b (:body setting-b)
        age-a (extract-field content-a #"年龄[:：]\s*(\d+)")
        age-b (extract-field content-b #"年龄[:：]\s*(\d+)")
        loc-a (extract-field content-a #"地点[:：]\s*([^\n]+)")
        loc-b (extract-field content-b #"地点[:：]\s*([^\n]+)")]
    (cond-> []
      (and age-a age-b (not= age-a age-b))
      (conj {:type :age-conflict :field :age :value-a age-a :value-b age-b})

      (and loc-a loc-b (not= loc-a loc-b))
      (conj {:type :location-conflict :field :location :value-a loc-a :value-b loc-b}))))

(defn check-all-settings [settings]
  (let [by-type (group-by :logseq.memo/type settings)]
    (mapcat (fn [[type settings-list]]
              (when (= type :character)
                (for [i (range (count settings-list))
                      j (range (inc i) (count settings-list))]
                  (check-conflicts (nth settings-list i)
                                  (nth settings-list j)))))
            by-type)))