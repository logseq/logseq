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

(defn- validate-unique-by-extends-and-name [db entity new-title]
  (when-let [_res (seq (d/q '[:find [?b ...]
                              :in $ ?eid ?type ?title
                              :where
                              [?b :block/title ?title]
                              [?b :logseq.property.class/extends ?type]
                              [(not= ?b ?eid)]]
                            db
                            (:db/id entity)
                            (:db/id (:logseq.property.class/extends entity))
                            new-title))]
    (throw (ex-info "Duplicate page by parent"
                    {:type :notification
                     :payload {:message (str "Another page named " (pr-str new-title) " already exists for parents "
                                             (pr-str (->> (ldb/get-class-extends entity)
                                                          (map :block/title)
                                                          (string/join ns-util/parent-char))))
                               :type :warning}}))))

(defn- another-id-q
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
    (:logseq.property.class/extends entity)
    '[:find [?b ...]
      :in $ ?eid ?title [?tag-id ...]
      :where
      [?b :block/title ?title]
      [?b :block/tags ?tag-id]
      [(not= ?b ?eid)]
      ;; same extends
      [?b :logseq.property.class/extends ?bp]
      [?eid :logseq.property.class/extends ?ep]
      [(= ?bp ?ep)]]
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
  (cond
    (seq tags)
    (let [matching-pages (d/q (cond
                                (ldb/property? entity)
                                db
                                (:db/id entity)
                                new-title
                                (map :db/id tags))
                                this-tags (set (map :db/ident tags))]
      (when-let [duplicate-page (first (filter (fn [page-id]
                                                (let [page (d/entity db page-id)
                                                      page-tags (set (map :db/ident (:block/tags page)))]
                                                  (= this-tags page-tags)))
                                              matching-pages))]
        (throw (ex-info "Duplicate page"
                       {:type :notification
                        :payload {:message (str "Another page named " (pr-str new-title) " already exists with the same tags: "
                                               (string/join ", "
                                                           (map (fn [id] (str "#" (:block/title (d/entity db id)))) tags)))
                                 :type :warning}}))))

    (:logseq.property.class/extends entity)
    (validate-unique-by-extends-and-name db entity new-title)))

(defn ^:api validate-unique-by-name-tag-and-block-type
  "Validates uniqueness of nodes for the following cases:
   - Page names are unique for a tag e.g. their can be Apple #Company and Apple #Fruit
   - Page names are unique for a :logseq.property.class/extends"
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
  (validate-unique-by-name-tag-and-block-type db new-title existing-block-entity)
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

(defn validate-extends-property
  [parent-ent child-ents]
  (disallow-built-in-class-extends-change parent-ent child-ents)
  (validate-extends-property-have-correct-type parent-ent child-ents))

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
