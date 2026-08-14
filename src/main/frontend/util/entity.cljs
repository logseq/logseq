(ns frontend.util.entity
  "Plain-map entity predicates for renderer code.")

(defn- tag-ident
  [tag]
  (cond
    (keyword? tag) tag
    (map? tag) (:db/ident tag)
    :else nil))

(defn tagged-with?
  [entity expected-ident]
  (when (map? entity)
    (some (fn [tag]
            (= expected-ident (tag-ident tag)))
          (:block/tags entity))))

(defn internal-page?
  [entity]
  (tagged-with? entity :logseq.class/Page))

(defn class?
  [entity]
  (tagged-with? entity :logseq.class/Tag))

(defn property?
  [entity]
  (tagged-with? entity :logseq.class/Property))

(defn journal?
  [entity]
  (tagged-with? entity :logseq.class/Journal))

(defn page?
  [entity]
  (or (internal-page? entity)
      (journal? entity)
      (class? entity)
      (property? entity)))

(defn get-entity-types
  [entity]
  (cond-> #{}
    (internal-page? entity) (conj :page)
    (journal? entity) (conj :journal)
    (class? entity) (conj :class)
    (property? entity) (conj :property)))
