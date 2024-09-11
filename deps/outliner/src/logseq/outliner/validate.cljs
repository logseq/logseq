(ns logseq.outliner.validate
  "Reusable validations from outliner level and above"
  (:require [datascript.core :as d]
            [logseq.db :as ldb]))

(defn ^:api validate-built-in-pages
  "Validates built-in pages shouldn't be modified"
  [entity]
  (when (ldb/built-in? entity)
    (throw (ex-info "Rename built-in pages"
                    {:type :notification
                     :payload {:message "Built-in pages can't be edited"
                               :type :warning}}))))

(defn- validate-unique-for-page
  [db new-title {:block/keys [tags] :as entity}]
  (cond
    (and (seq tags) (= "page" (:block/type entity)))
    (when-let [res (seq (d/q '[:find [?b ...]
                               :in $ ?eid ?title [?tag-id ...]
                               :where
                               [?b :block/title ?title]
                               [?b :block/tags ?tag-id]
                               [(not= ?b ?eid)]]
                             db
                             (:db/id entity)
                             new-title
                             (map :db/id tags)))]
      (throw (ex-info "Duplicate page by tag"
                      {:type :notification
                       :payload {:message (str "Another page named " (pr-str new-title) " already exists for tag "
                                               (pr-str (->> res first (d/entity db) :block/tags first :block/title)))
                                 :type :warning}})))

    (ldb/property? entity)
    (when-let [_res (seq (d/q '[:find [?b ...]
                                :in $ ?eid ?type ?title
                                :where
                                [?b :block/title ?title]
                                [?b :block/type ?type]
                                [(missing? $ ?b :logseq.property/built-in?)]
                                [(not= ?b ?eid)]]
                              db
                              (:db/id entity)
                              (:block/type entity)
                              new-title))]
      (throw (ex-info "Duplicate property"
                      {:type :notification
                       :payload {:message (str "Another property named " (pr-str new-title) " already exists")
                                 :type :warning}})))

    :else
    (when-let [_res (seq (d/q '[:find [?b ...]
                                :in $ ?eid ?type ?title
                                :where
                                [?b :block/title ?title]
                                [?b :block/type ?type]
                                [(not= ?b ?eid)]]
                              db
                              (:db/id entity)
                              (:block/type entity)
                              new-title))]
      (throw (ex-info "Duplicate page without tag"
                      {:type :notification
                       :payload {:message (str "Another page named " (pr-str new-title) " already exists")
                                 :type :warning}})))))

(defn ^:api validate-unique-by-name-tag-and-block-type
  "Validates uniqueness of blocks and pages for the following cases:
   - Page names of type 'page' are unique by tag e.g. their can be Apple #Company and Apple #Fruit
   - Page names of other types are unique for their type e.g. their can be #Journal ('class') and Journal ('page')
   - Property names are unique and don't consider built-in property names
   - Block names are unique by tag"
  [db new-title {:block/keys [tags] :as entity}]
  (cond
    (ldb/page? entity)
    (validate-unique-for-page db new-title entity)

    (and (not (:block/type entity)) (seq tags))
    (when-let [res (seq (d/q '[:find [?b ...]
                               :in $ ?eid ?title [?tag-id ...]
                               :where
                               [?b :block/title ?title]
                               [?b :block/tags ?tag-id]
                               [(not= ?b ?eid)]
                               [(missing? $ ?b :block/type)]]
                             db
                             (:db/id entity)
                             new-title
                             (map :db/id tags)))]
      (throw (ex-info "Duplicate block by tag"
                      {:type :notification
                       :payload {:message (str "Another block named " (pr-str new-title) " already exists for tag "
                                               (pr-str (->> res first (d/entity db) :block/tags first :block/title)))
                                 :type :warning}})))))

(defn validate-block-title
  "Validates a block title when it has changed"
  [db new-title existing-block-entity]
  (validate-built-in-pages existing-block-entity)
  (validate-unique-by-name-tag-and-block-type db new-title existing-block-entity))