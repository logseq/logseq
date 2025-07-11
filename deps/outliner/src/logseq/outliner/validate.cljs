(ns logseq.outliner.validate
  "Reusable DB graph validations for outliner level and above. Most validations
  throw errors so the user action stops immediately to display a notification"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.date :as common-date]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]))

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

(def ^:api uneditable-page? ldb/built-in?)

(defn ^:api validate-built-in-pages
  "Validates built-in pages shouldn't be modified"
  [entity & {:keys [message]}]
  (when (uneditable-page? entity)
    (throw (ex-info "Rename built-in pages"
                    {:type :notification
                     :payload {:message (or message "Built-in pages can't be edited")
                               :type :warning}}))))

(defn- find-other-ids-with-title-and-tags
  "Query that finds other ids given the id to ignore, title to look up and tags to consider"
  [entity]
  (cond
    (ldb/property? entity)
    ;; Property names are unique in that they can
    ;; have the same names as built-in property names
    '[:find [?b ...]
      :in $ ?eid ?title [?tag-id ...]
      :where
      [?b :block/title ?title]
      [?b :block/tags ?tag-id]
      [(missing? $ ?b :logseq.property/built-in?)]
      [(not= ?b ?eid)]]
    (:block/parent entity)
    '[:find [?b ...]
      :in $ ?eid ?title [?tag-id ...]
      :where
      [?b :block/title ?title]
      [?b :block/tags ?tag-id]
      [(not= ?b ?eid)]
      ;; same parent
      [?b :block/parent ?bp]
      [?eid :block/parent ?ep]
      [(= ?bp ?ep)]]
    :else
    '[:find [?b ...]
      :in $ ?eid ?title [?tag-id ...]
      :where
      [?b :block/title ?title]
      [?b :block/tags ?tag-id]
      [(not= ?b ?eid)]]))

(defn- validate-unique-for-page
  [db new-title {:block/keys [tags] :as entity}]
  (when (seq tags)
    (when-let [another-id (first
                           (d/q (find-other-ids-with-title-and-tags entity)
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
          (cond
            (ldb/property? entity)
            (throw (ex-info "Duplicate property"
                            {:type :notification
                             :payload {:message (str "Another property named " (pr-str new-title) " already exists.")
                                       :type :warning}}))
            (ldb/class? entity)
            (throw (ex-info "Duplicate class"
                            {:type :notification
                             :payload {:message (str "Another tag named " (pr-str new-title) " already exists.")
                                       :type :warning}}))
            :else
            (throw (ex-info "Duplicate page"
                            {:type :notification
                             :payload {:message (str "Another page named " (pr-str new-title) " already exists for tags: "
                                                     (string/join ", "
                                                                  (map (fn [id] (str "#" (:block/title (d/entity db id)))) common-tag-ids)))
                                       :type :warning}}))))))))

(defn ^:api validate-unique-by-name-and-tags
  "Validates uniqueness of nodes for the following cases:
   - Page names are unique for a tag e.g. their can be Apple #Company and Apple #Fruit
   - Property names are unique with user properties being allowed to have the same name as built-in ones
   - Class names are unique regardless of their extends or if they're built-in"
  [db new-title entity]
  (when (entity-util/page? entity)
    (validate-unique-for-page db new-title entity)))

(defn ^:api validate-disallow-page-with-journal-name
  "Validates a non-journal page renamed to journal format"
  [new-title entity]
  (when (and (entity-util/page? entity) (not (entity-util/journal? entity))
             (common-date/normalize-date new-title nil))
    (throw (ex-info "Page can't be renamed to a journal"
                    {:type :notification
                     :payload {:message "This page can't be changed to a journal page"
                               :type :warning}}))))

(defn validate-block-title
  "Validates a block title when it has changed for a entity-util/page? or tagged node"
  [db new-title existing-block-entity]
  (validate-built-in-pages existing-block-entity)
  (validate-unique-by-name-and-tags db new-title existing-block-entity)
  (validate-disallow-page-with-journal-name new-title existing-block-entity))

(defn validate-property-title
  "Validates a property's title when it has changed"
  [new-title]
  (when-not (db-property/valid-property-name? new-title)
    (throw (ex-info "Property name is invalid"
                    {:type :notification
                     :payload {:message "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['."
                               :type :error}}))))

(defn- validate-extends-property-have-correct-type
  "Validates whether given parent and children are classes"
  [parent-ent child-ents]
  (when (or (not (ldb/class? parent-ent))
            (not (every? ldb/class? child-ents)))
    (throw (ex-info "Can't extend this page since either it is not a tag or is extending from a page that is not a tag"
                    {:type :notification
                     :payload {:message "Can't extend this page since either it is not a tag or is extending from a page that is not a tag"
                               :type :error}
                     :blocks (map #(select-keys % [:db/id :block/title]) (remove ldb/class? child-ents))}))))

(defn- disallow-built-in-class-extends-change
  [_parent-ent child-ents]
  (when (some #(get db-class/built-in-classes (:db/ident %)) child-ents)
    (throw (ex-info "Can't change the parent of a built-in tag"
                    {:type :notification
                     :payload {:message "Can't change the parent of a built-in tag"
                               :type :error}}))))

(defn- disallow-extends-cycle
  [db parent-ent child-ents]
  (doseq [child child-ents]
    (let [children-ids (set (cons (:db/id child)
                                  (db-class/get-structured-children db (:db/id child))))]
      (when (contains? children-ids (:db/id parent-ent))
        (throw (ex-info "Extends cycle"
                        {:type :notification
                         :payload {:message "Tag extends cycle"
                                   :type :error
                                   :blocks (map #(select-keys % [:db/id :block/title]) [child])}}))))))

(defn validate-extends-property
  [db parent-ent* child-ents & {:keys [built-in?] :or {built-in? true}}]
  (let [parent-ent (if (integer? parent-ent*)
                     (d/entity db parent-ent*)
                     parent-ent*)]
    (disallow-extends-cycle db parent-ent child-ents)
    (when built-in? (disallow-built-in-class-extends-change parent-ent child-ents))
    (validate-extends-property-have-correct-type parent-ent child-ents)))

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
  [db block-eids v & {:keys [delete?]}]
  (when (and (ldb/private-tags (:db/ident (d/entity db v)))
             ;; Allow assets to be tagged
             (not (and
                   (every? (fn [id] (ldb/asset? (d/entity db id))) block-eids)
                   (= :logseq.class/Asset (:db/ident (d/entity db v))))))
    (throw (ex-info (str (if delete? "Can't remove tag" "Can't set tag")
                         " with built-in #" (:block/title (d/entity db v)))
                    {:type :notification
                     :payload {:message (str (if delete? "Can't remove tag" "Can't set tag")
                                             " with built-in #" (:block/title (d/entity db v)))
                               :type :error}
                     :property-id :block/tags
                     :property-value v}))))

(defn- disallow-tagging-a-built-in-entity
  [db block-eids & {:keys [delete?]}]
  (when-let [built-in-ent (some #(when (:logseq.property/built-in? %) %)
                                (map #(d/entity db %) block-eids))]
    (throw (ex-info (str (if delete? "Can't remove tag" "Can't add tag")
                         " on built-in " (pr-str (:block/title built-in-ent)))
                    {:type :notification
                     :payload {:message (str (if delete? "Can't remove tag" "Can't add tag")
                                             " on built-in " (pr-str (:block/title built-in-ent)))
                               :type :error}}))))

(defn validate-tags-property
  "Validates adding a property value to :block/tags for given blocks"
  [db block-eids v]
  (disallow-tagging-a-built-in-entity db block-eids)
  (disallow-node-cant-tag-with-private-tags db block-eids v)
  (disallow-node-cant-tag-with-built-in-non-tags db block-eids v))

(defn validate-tags-property-deletion
  "Validates deleting a property value from :block/tags for given blocks"
  [db block-eids v]
  (disallow-tagging-a-built-in-entity db block-eids {:delete? true})
  (disallow-node-cant-tag-with-private-tags db block-eids v {:delete? true}))
