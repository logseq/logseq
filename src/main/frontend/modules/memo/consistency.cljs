;; src/main/frontend/modules/memo/consistency.cljs
(ns frontend.modules.memo.consistency
  (:require [clojure.string :as string]))

(defn extract-field [content field-pattern]
  (when-let [[_ value] (re-find field-pattern content)]
    (string/trim value)))

(defn extract-field-all [content field-pattern]
  (map string/trim (re-seq field-pattern content)))

;; Character conflict checks

(defn check-character-conflicts [char-a char-b]
  (let [content-a (:body char-a)
        content-b (:body char-b)
        age-a (extract-field content-a #"年龄[:：]\s*(\d+)")
        age-b (extract-field content-b #"年龄[:：]\s*(\d+)")
        name-a (extract-field content-a #"(?:名字|名称)[:：]\s*([^\n]+)")
        name-b (extract-field content-b #"(?:名字|名称)[:：]\s*([^\n]+)")
        type-a (extract-field content-a #"类型[:：]\s*([^\n]+)")
        type-b (extract-field content-b #"类型[:：]\s*([^\n]+)")]
    (cond-> []
      (and age-a age-b (not= age-a age-b))
      (conj {:type :age-conflict :field :age :id-a (:id char-a) :id-b (:id char-b) :value-a age-a :value-b age-b})

      (and name-a name-b (not= name-a name-b))
      (conj {:type :name-conflict :field :name :id-a (:id char-a) :id-b (:id char-b) :value-a name-a :value-b name-b})

      (and type-a type-b (not= type-a type-b))
      (conj {:type :type-conflict :field :type :id-a (:id char-a) :id-b (:id char-b) :value-a type-a :value-b type-b}))))

(defn check-character-all-conflicts [characters]
  (for [i (range (count characters))
        j (range (inc i) (count characters))
        :let [conflicts (check-character-conflicts (nth characters i) (nth characters j))]
        conflicts (keep identity conflicts)]
    conflicts))

;; Location conflict checks

(defn check-location-conflicts [loc-a loc-b]
  (let [content-a (:body loc-a)
        content-b (:body loc-b)
        name-a (extract-field content-a #"(?:名字|名称)[:：]\s*([^\n]+)")
        name-b (extract-field content-b #"(?:名字|名称)[:：]\s*([^\n]+)")
        region-a (extract-field content-a #"区域[:：]\s*([^\n]+)")
        region-b (extract-field content-b #"区域[:：]\s*([^\n]+)")
        desc-a (extract-field content-a #"描述[:：]\s*([^\n]+)")
        desc-b (extract-field content-b #"描述[:：]\s*([^\n]+)")]
    (cond-> []
      (and name-a name-b (not= name-a name-b))
      (conj {:type :location-name-conflict :field :name :id-a (:id loc-a) :id-b (:id loc-b) :value-a name-a :value-b name-b})

      (and region-a region-b (not= region-a region-b))
      (conj {:type :location-region-conflict :field :region :id-a (:id loc-a) :id-b (:id loc-b) :value-a region-a :value-b region-b})

      (and desc-a desc-b (not= desc-a desc-b))
      (conj {:type :location-desc-conflict :field :description :id-a (:id loc-a) :id-b (:id loc-b) :value-a desc-a :value-b desc-b}))))

(defn check-location-all-conflicts [locations]
  (for [i (range (count locations))
        j (range (inc i) (count locations))
        :let [conflicts (check-location-conflicts (nth locations i) (nth locations j))]
        conflicts (keep identity conflicts)]
    conflicts))

;; Timeline conflict checks

(defn check-timeline-conflicts [tl-a tl-b]
  (let [content-a (:body tl-a)
        content-b (:body tl-b)
        start-a (extract-field content-a #"开始时间[:：]\s*([^\n]+)")
        start-b (extract-field content-b #"开始时间[:：]\s*([^\n]+)")
        end-a (extract-field content-a #"结束时间[:：]\s*([^\n]+)")
        end-b (extract-field content-b #"结束时间[:：]\s*([^\n]+)")
        era-a (extract-field content-a #"时代[:：]\s*([^\n]+)")
        era-b (extract-field content-b #"时代[:：]\s*([^\n]+)")]
    (cond-> []
      (and start-a start-b (not= start-a start-b))
      (conj {:type :timeline-start-conflict :field :start-time :id-a (:id tl-a) :id-b (:id tl-b) :value-a start-a :value-b start-b})

      (and end-a end-b (not= end-a end-b))
      (conj {:type :timeline-end-conflict :field :end-time :id-a (:id tl-a) :id-b (:id tl-b) :value-a end-a :value-b end-b})

      (and era-a era-b (not= era-a era-b))
      (conj {:type :timeline-era-conflict :field :era :id-a (:id tl-a) :id-b (:id tl-b) :value-a era-a :value-b era-b}))))

(defn check-timeline-all-conflicts [timelines]
  (for [i (range (count timelines))
        j (range (inc i) (count timelines))
        :let [conflicts (check-timeline-conflicts (nth timelines i) (nth timelines j))]
        conflicts (keep identity conflicts)]
    conflicts))

;; World conflict checks

(defn check-world-conflicts [world-a world-b]
  (let [content-a (:body world-a)
        content-b (:body world-b)
        name-a (extract-field content-a #"(?:名字|名称)[:：]\s*([^\n]+)")
        name-b (extract-field content-b #"(?:名字|名称)[:：]\s*([^\n]+)")
        period-a (extract-field content-a #"时代[:：]\s*([^\n]+)")
        period-b (extract-field content-b #"时代[:：]\s*([^\n]+)")
        magic-a (extract-field content-a #"魔法[:：]\s*([^\n]+)")
        magic-b (extract-field content-b #"魔法[:：]\s*([^\n]+)")
        tech-a (extract-field content-a #"科技[:：]\s*([^\n]+)")
        tech-b (extract-field content-b #"科技[:：]\s*([^\n]+)")]
    (cond-> []
      (and name-a name-b (not= name-a name-b))
      (conj {:type :world-name-conflict :field :name :id-a (:id world-a) :id-b (:id world-b) :value-a name-a :value-b name-b})

      (and period-a period-b (not= period-a period-b))
      (conj {:type :world-period-conflict :field :period :id-a (:id world-a) :id-b (:id world-b) :value-a period-a :value-b period-b})

      (and magic-a magic-b (not= magic-a magic-b))
      (conj {:type :world-magic-conflict :field :magic :id-a (:id world-a) :id-b (:id world-b) :value-a magic-a :value-b magic-b})

      (and tech-a tech-b (not= tech-a tech-b))
      (conj {:type :world-tech-conflict :field :technology :id-a (:id world-a) :id-b (:id world-b) :value-a tech-a :value-b tech-b}))))

(defn check-world-all-conflicts [worlds]
  (for [i (range (count worlds))
        j (range (inc i) (count worlds))
        :let [conflicts (check-world-conflicts (nth worlds i) (nth worlds j))]
        conflicts (keep identity conflicts)]
    conflicts))

;; General conflict checks

(defn check-duplicate-ids [settings]
  (let [ids (map :id settings)
        duplicate-ids (filter #(> (count (second %)) 1) (group-by identity ids))]
    (map (fn [[id items]]
           {:type :duplicate-id :id id :count (count items)})
         duplicate-ids)))

(defn check-relation-conflicts [settings]
  (let [relations (mapcat (fn [setting]
                            (when-let [rels (extract-field-all (:body setting) #"关系[:：]\s*([^\n]+)")]
                              (map #(hash-map :from (:id setting) :relation %) rels)))
                          settings)
        relation-groups (filter #(> (count (second %)) 1) (group-by :relation relations))]
    (mapcat (fn [[rel-type items]]
              (for [i (range (count items))
                    j (range (inc i) (count items))
                    :let [item-a (nth items i)
                          item-b (nth items j)]
                    :when (and (:from item-a) (:from item-b) (not= (:from item-a) (:from item-b)))]
                {:type :relation-conflict :relation rel-type :from-a (:from item-a) :from-b (:from item-b)}))
            relation-groups)))

;; Main check function

(defn check-all-settings [settings]
  (let [by-type (group-by :logseq.memo/type settings)
        all-conflicts (atom [])]

    ;; Check characters
    (when-let [characters (get by-type :character)]
      (doseq [conflicts (check-character-all-conflicts characters)]
        (swap! all-conflicts conj conflicts)))

    ;; Check locations
    (when-let [locations (get by-type :location)]
      (doseq [conflicts (check-location-all-conflicts locations)]
        (swap! all-conflicts conj conflicts)))

    ;; Check timelines
    (when-let [timelines (get by-type :timeline)]
      (doseq [conflicts (check-timeline-all-conflicts timelines)]
        (swap! all-conflicts conj conflicts)))

    ;; Check worlds
    (when-let [worlds (get by-type :world)]
      (doseq [conflicts (check-world-all-conflicts worlds)]
        (swap! all-conflicts conj conflicts)))

    ;; General duplicate ID check
    (swap! all-conflicts conj (check-duplicate-ids settings))

    ;; General relation conflict check
    (swap! all-conflicts conj (check-relation-conflicts settings))

    @all-conflicts))
