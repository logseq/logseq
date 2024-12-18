(ns logseq.outliner.validate
  "Reusable DB graph validations for outliner level and above. Most validations
  throw errors so the user action stops immediately to display a notification"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.common.date :as common-date]
            [logseq.common.util.namespace :as ns-util]
            [clojure.set :as set]
            [logseq.db.frontend.class :as db-class]))

(defn ^:api validate-page-title-characters
  "Validates characters that must not be in a page title"
  [page-title meta-m]
  (when (string/includes? page-title "#")
    (throw (ex-info "Page name can't include \"#\"."
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't include \"#\"."
                                      :type :warning}}))))
  (when (and (string/includes? page-title ns-util/parent-char)
             (not (common-date/normalize-date page-title nil)))
    (throw (ex-info "Page name can't include \"/\"."
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't include \"/\"."
                                      :type :warning}})))))

(defn ^:api validate-page-title
  [page-title meta-m]
  (when (string/blank? page-title)
    (throw (ex-info "Page name can't be blank"
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't be blank."
                                      :type :warning}})))))

(defn ^:api validate-built-in-pages
  "Validates built-in pages shouldn't be modified"
  [entity]
  (when (ldb/built-in? entity)
    (throw (ex-info "Rename built-in pages"
                    {:type :notification
                     :payload {:message "Built-in pages can't be edited"
                               :type :warning}}))))

(defn- validate-unique-by-parent-and-name [db entity new-title]
  (when-let [_res (seq (d/q '[:find [?b ...]
                              :in $ ?eid ?type ?title
                              :where
                              [?b :block/title ?title]
                              [?b :logseq.property/parent ?type]
                              [(not= ?b ?eid)]]
                            db
                            (:db/id entity)
                            (:db/id (:logseq.property/parent entity))
                            new-title))]
    (throw (ex-info "Duplicate page by parent"
                    {:type :notification
                     :payload {:message (str "Another page named " (pr-str new-title) " already exists for parents "
                                             (pr-str (->> (ldb/get-page-parents entity)
                                                          (map :block/title)
                                                          (string/join ns-util/parent-char))))
                               :type :warning}}))))

(defn- validate-unique-for-page
  [db new-title {:block/keys [tags] :as entity}]
  (cond
    (seq tags)
    (when-let [another-id (first
                           (d/q (if (ldb/property? entity)
                                  ;; Property names are unique in that they can
                                  ;; have the same names as built-in property names
                                  '[:find [?b ...]
                                    :in $ ?eid ?title [?tag-id ...]
                                    :where
                                    [?b :block/title ?title]
                                    [?b :block/tags ?tag-id]
                                    [(missing? $ ?b :logseq.property/built-in?)]
                                    [(not= ?b ?eid)]]
                                  '[:find [?b ...]
                                    :in $ ?eid ?title [?tag-id ...]
                                    :where
                                    [?b :block/title ?title]
                                    [?b :block/tags ?tag-id]
                                    [(not= ?b ?eid)]])
                                db
                                (:db/id entity)
                                new-title
                                (map :db/id tags)))]
      (let [another (d/entity db another-id)
            this-tags (set (map :db/ident tags))
            another-tags (set (map :db/ident (:block/tags another)))
            common-tag-ids (set/intersection this-tags another-tags)]
        (when-not (and (= common-tag-ids #{:logseq.class/Page})
                       (> (count this-tags) 1)
                       (> (count another-tags) 1))
          (throw (ex-info "Duplicate page"
                          {:type :notification
                           :payload {:message (str "Another page named " (pr-str new-title) " already exists for tags: "
                                                   (string/join ", "
                                                                (map (fn [id] (str "#" (:block/title (d/entity db id)))) common-tag-ids)))
                                     :type :warning}})))))

    (:logseq.property/parent entity)
    (validate-unique-by-parent-and-name db entity new-title)))

(defn ^:api validate-unique-by-name-tag-and-block-type
  "Validates uniqueness of nodes for the following cases:
   - Page names are unique for a tag e.g. their can be Apple #Company and Apple #Fruit
   - Page names are unique for a :logseq.property/parent"
  [db new-title entity]
  (when (ldb/page? entity)
    (validate-unique-for-page db new-title entity)))

(defn ^:api validate-disallow-page-with-journal-name
  "Validates a non-journal page renamed to journal format"
  [new-title entity]
  (when (and (ldb/page? entity) (not (ldb/journal? entity))
             (common-date/normalize-date new-title nil))
    (throw (ex-info "Page can't be renamed to a journal"
                    {:type :notification
                     :payload {:message "This page can't be changed to a journal page"
                               :type :warning}}))))

(defn validate-block-title
  "Validates a block title when it has changed"
  [db new-title existing-block-entity]
  (validate-built-in-pages existing-block-entity)
  (validate-unique-by-name-tag-and-block-type db new-title existing-block-entity)
  (validate-disallow-page-with-journal-name new-title existing-block-entity))

(defn- validate-parent-property-have-same-type
  "Validates whether given parent and children are valid. Allows 'class' and
  'page' types to have a relationship with their own type. May consider allowing more
  page types if they don't cause systemic bugs"
  [parent-ent child-ents]
  (when (or (and (ldb/class? parent-ent) (not (every? ldb/class? child-ents)))
            (and (ldb/internal-page? parent-ent) (not (every? ldb/internal-page? child-ents)))
            (not ((some-fn ldb/class? ldb/internal-page?) parent-ent)))
    (throw (ex-info "Can't set this page as a parent because the child page is a different type"
                    {:type :notification
                     :payload {:message "Can't set this page as a parent because the child page is a different type"
                               :type :warning}
                     :blocks (map #(select-keys % [:db/id :block/title]) (remove ldb/class? child-ents))}))))

(defn- disallow-built-in-class-parent-change
  [_parent-ent child-ents]
  (when (some #(get db-class/built-in-classes (:db/ident %)) child-ents)
    (throw (ex-info "Can't change the parent of a built-in tag"
                    {:type :notification
                     :payload {:message "Can't change the parent of a built-in tag"
                               :type :warning}}))))

(defn validate-parent-property
  [parent-ent child-ents]
  (disallow-built-in-class-parent-change parent-ent child-ents)
  (validate-parent-property-have-same-type parent-ent child-ents))

(defn- disallow-node-cant-tag-with-built-in-non-tags
  [db _block-eids v]
  (let [tag-ent (d/entity db v)]
    (when (and (:logseq.property/built-in? tag-ent)
               (not (ldb/class? tag-ent)))
      (throw (ex-info (str "Can't set tag with built-in page that isn't a tag " (pr-str (:block/title tag-ent)))
                    {:type :notification
                     :payload {:message (str "Can't set tag with built-in page that isn't a tag " (pr-str (:block/title tag-ent)))
                               :type :error}
                     :property-value v})))))

(defn- disallow-node-cant-tag-with-private-tags
  [db block-eids v]
  (when (and (ldb/private-tags (:db/ident (d/entity db v)))
             ;; Allow assets to be tagged
             (not (and
                   (every? (fn [id] (ldb/asset? (d/entity db id))) block-eids)
                   (= :logseq.class/Asset (:db/ident (d/entity db v))))))
    (throw (ex-info (str "Can't set tag with built-in #" (:block/title (d/entity db v)))
                    {:type :notification
                     :payload {:message (str "Can't set tag with built-in #" (:block/title (d/entity db v)))
                               :type :error}
                     :property-id :block/tags
                     :property-value v}))))

(defn- disallow-tagging-a-built-in-entity
  [db block-eids]
  (when-let [built-in-ent (some #(when (:logseq.property/built-in? %) %)
                                (map #(d/entity db %) block-eids))]
    (throw (ex-info (str "Can't add tag on built-in " (pr-str (:block/title built-in-ent)))
                    {:type :notification
                     :payload {:message (str "Can't add tag on built-in " (pr-str (:block/title built-in-ent)))
                               :type :error}}))))

(defn validate-tags-property
  [db block-eids v]
  (disallow-tagging-a-built-in-entity db block-eids)
  (disallow-node-cant-tag-with-private-tags db block-eids v)
  (disallow-node-cant-tag-with-built-in-non-tags db block-eids v))