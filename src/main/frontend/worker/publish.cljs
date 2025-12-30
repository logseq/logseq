(ns frontend.worker.publish
  "Publish"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]))

(defn- publish-entity-title
  [entity]
  (or (:block/title entity)
      "Untitled"))

(defn- page-tags
  [page-entity]
  (let [tags (:block/tags page-entity)]
    (->> tags
         (remove (fn [tag]
                   (contains? #{:logseq.class/Page} (:db/ident tag))))
         (map (fn [tag]
                {:tag_uuid (:block/uuid tag)
                 :tag_title (:block/title tag)})))))

(defn- publish-ref-eid [value]
  (cond
    (number? value) (when (pos? value) value)
    (map? value) (let [eid (:db/id value)]
                   (when (and (number? eid) (pos? eid))
                     eid))
    :else nil))

(defn- publish-refs-from-blocks
  [db blocks page-entity graph-uuid]
  (let [page-uuid (:block/uuid page-entity)
        page-title (publish-entity-title page-entity)
        page? (common-entity-util/page? page-entity)
        graph-uuid (str graph-uuid)]
    (mapcat (fn [block]
              (let [block-uuid (:block/uuid block)
                    block-uuid-str (some-> block-uuid str)]
                (when (and block-uuid-str
                           (or (not page?)
                               (not= block-uuid page-uuid)))
                  (let [block-content (or (:block/content block)
                                          (:block/title block)
                                          (:block/name block)
                                          "")
                        block-format (name (or (:block/format block) :markdown))
                        refs (:block/refs block)
                        refs (if (sequential? refs) refs (when refs [refs]))
                        targets (->> refs
                                     (map publish-ref-eid)
                                     (keep #(when % (d/entity db %)))
                                     (keep :block/uuid)
                                     (map str)
                                     distinct)]
                    (when (seq targets)
                      (map (fn [target]
                             {:graph_uuid graph-uuid
                              :target_page_uuid target
                              :source_page_uuid (str page-uuid)
                              :source_page_title page-title
                              :source_block_uuid block-uuid-str
                              :source_block_content block-content
                              :source_block_format block-format
                              :updated_at (common-util/time-ms)})
                           targets))))))
            blocks)))

(defn- collect-publish-blocks
  [db entity]
  (if (common-entity-util/page? entity)
    (:block/_page entity)
    (ldb/get-block-and-children db (:block/uuid entity))))

(def ^:private publish-search-max-length 4096)

(defn- block-page-eid
  [block]
  (let [page (:block/page block)]
    (cond
      (map? page) (:db/id page)
      (number? page) page
      :else nil)))

(defn- block-search-content
  [block]
  (let [raw-content (or (:block/content block)
                        (:block/title block)
                        (:block/name block)
                        "")
        raw-content (string/trim raw-content)]
    (when-not (string/blank? raw-content)
      (let [content (db-content/recur-replace-uuid-in-block-title
                     (assoc block :block/title raw-content))
            content (if (> (count content) publish-search-max-length)
                      (subs content 0 publish-search-max-length)
                      content)]
        (string/trim content)))))

(defn- collect-search-blocks
  [blocks page-eid page-uuid]
  (->> blocks
       (keep (fn [block]
               (when (and (= (block-page-eid block) page-eid)
                          (not= (:db/id block) page-eid)
                          (not (:logseq.property/created-from-property block)))
                 (when-let [block-uuid (some-> (:block/uuid block) str)]
                   (when-let [content (block-search-content block)]
                     {:page_uuid (str page-uuid)
                      :block_uuid block-uuid
                      :block_content content})))))))

(defn- collect-embedded-blocks
  [db blocks]
  (let [linked-eids (->> blocks
                         (map :block/link)
                         (map publish-ref-eid)
                         (remove nil?)
                         distinct)]
    (loop [queue (vec linked-eids)
           visited #{}
           acc []]
      (if (empty? queue)
        acc
        (let [eid (first queue)
              queue (subvec queue 1)]
          (if (contains? visited eid)
            (recur queue visited acc)
            (let [entity (d/entity db eid)
                  uuid (:block/uuid entity)
                  children (when uuid
                             (ldb/get-block-and-children db uuid))
                  child-links (->> children
                                   (map :block/link)
                                   (map publish-ref-eid)
                                   (remove nil?))]
              (recur (into queue child-links)
                     (conj visited eid)
                     (into acc children)))))))))

(defn- publish-collect-page-eids
  [db entity]
  (let [page-id (:db/id entity)
        blocks (collect-publish-blocks db entity)
        embedded-blocks (collect-embedded-blocks db blocks)
        blocks (concat blocks embedded-blocks)
        block-eids (map :db/id blocks)
        ref-eids (->> blocks
                      (mapcat :block/refs)
                      (map publish-ref-eid)
                      (remove nil?))
        tag-eids (->> blocks
                      (mapcat :block/tags)
                      (map publish-ref-eid)
                      (remove nil?))
        page-tag-eids (->> (if-let [tags (:block/tags entity)]
                             (if (sequential? tags) tags [tags])
                             [])
                           (map publish-ref-eid)
                           (remove nil?))
        page-eids (->> blocks (map :block/page) (keep :db/id))
        property-eids (->> (cons entity blocks)
                           (map db-property/properties)
                           (mapcat (fn [props]
                                     (mapcat (fn [[k v]]
                                               (let [property (d/entity db k)
                                                     pid (:db/id property)
                                                     ref-type? (= :db.type/ref (:db/valueType property))
                                                     many? (= :db.cardinality/many (:db/cardinality property))]
                                                 (cons pid
                                                       (when ref-type?
                                                         (if many?
                                                           (map :db/id v)
                                                           (list (:db/id v)))))))
                                             props)))
                           (remove nil?))]
    {:blocks blocks
     :eids (->> (concat [page-id] block-eids ref-eids tag-eids page-tag-eids page-eids property-eids)
                (remove nil?)
                distinct)}))

(defn- normalize-block-publish-datoms
  [datoms block-eids root-eid]
  (map (fn [[e a v tx added]]
         (if (and (contains? block-eids e) (= a :block/page))
           [e a root-eid tx added]
           [e a v tx added]))
       datoms))

(defn- build-publish-page-payload
  [db entity graph-uuid]
  (let [{:keys [blocks eids]} (publish-collect-page-eids db entity)
        graph-uuid (or graph-uuid (ldb/get-graph-rtc-uuid db))
        refs (when graph-uuid
               (publish-refs-from-blocks db blocks entity graph-uuid))
        tags (page-tags entity)
        search-blocks (collect-search-blocks blocks (:db/id entity) (:block/uuid entity))
        raw-datoms (->>
                    (mapcat (fn [eid]
                              (map (fn [d] [(:e d) (:a d) (:v d) (:tx d) (:added d)])
                                   (d/datoms db :eavt eid)))
                            eids)
                    (remove (fn [[_e a _v _tx _added]]
                              (contains? #{:block/tx-id :logseq.property.user/email :logseq.property.embedding/hnsw-label-updated-at} a))))
        datoms (if (common-entity-util/page? entity)
                 raw-datoms
                 (normalize-block-publish-datoms raw-datoms (set (map :db/id blocks)) (:db/id entity)))]
    {:page (common-entity-util/entity->map entity)
     :page-uuid (:block/uuid entity)
     :page-title (publish-entity-title entity)
     :graph-uuid (some-> graph-uuid str)
     :block-count (count blocks)
     :schema-version (db-schema/schema-version->string db-schema/version)
     :refs refs
     :page-tags tags
     :blocks search-blocks
     :datoms datoms}))

(def-thread-api :thread-api/build-publish-page-payload
  [repo eid graph-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          page-entity (d/entity db eid)]
      (when (and page-entity (:db/id page-entity))
        (build-publish-page-payload db page-entity graph-uuid)))))
