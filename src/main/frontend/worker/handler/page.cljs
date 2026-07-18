(ns frontend.worker.handler.page
  "Page operations"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.tree :as otree]))

(defn create!
  "Creates a page through the outliner page service.

   Supported options:

   * :uuid                    - when set, use this uuid instead of generating a new one; ignored
                                when :journal? or :today-journal? uses a deterministic journal
                                uuid from :block/journal-day.
   * :class?                  - create the page as a Tag class page.
   * :journal?                - create the page as a Journal page.
   * :today-journal?          - mark the create-page tx as today's journal creation.
   * :tags                    - tag uuids or tag entities added to :block/tags.
   * :properties              - properties to add to the page.
   * :split-namespace?        - create namespace parent pages for non-journal slash pages.
   * :class-ident-namespace   - namespace used when creating a class ident.
   * :persist-op?             - when true, persist the create-page outliner op."
  [conn title & {:as options}]
  (outliner-page/create! conn title options))

(defn delete!
  "Deletes a page through the outliner page service.

   Returns true when the page can be deleted. If deletion is rejected, calls
   :error-handler and returns false.

   Supported options:

   * :persist-op?      - when true, persist the delete-page outliner op.
   * :rename?          - mark the tx as part of a rename flow.
   * :error-handler    - callback invoked with {:msg string} on rejection.
   * :deleted-by-uuid  - user uuid recorded in the delete op metadata.
   * :now-ms           - timestamp recorded in the delete op metadata."
  [conn page-uuid & {:as options}]
  (outliner-page/delete! conn page-uuid options))

(defn- page-route-info
  [db page-id-name-or-uuid]
  (when-let [page (ldb/get-page db page-id-name-or-uuid)]
    (let [alias-source (ldb/get-alias-source-page db (:db/id page))]
      (cond-> {:page-id (:db/id page)
               :page-uuid (:block/uuid page)
               :page-title (:block/title page)
               :hidden? (boolean (ldb/hidden? page))
               :property? (boolean (ldb/property? page))
               :built-in? (boolean (ldb/built-in? page))
               :private-built-in? (boolean (and (ldb/built-in? page)
                                                (ldb/private-built-in-page? page)))}
        (:logseq.property/heading page)
        (assoc :block-page-name (get-in page [:block/page :block/name])
               :block-route-name (some->> (:block/title page)
                                           (re-find #"^#{0,}\s*(.*)(?:\n|$)")
                                           second
                                           string/lower-case))

        (:block/uuid alias-source)
        (assoc :alias-source-id (:db/id alias-source)
               :alias-source-uuid (:block/uuid alias-source))))))

(def-thread-api :thread-api/get-page-route-info
  [repo page-id-name-or-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (page-route-info @conn page-id-name-or-uuid)))

(defn- heading-content->route-name
  [block-content]
  (some->> block-content
           (re-find #"^#{0,}\s*(.*)(?:\n|$)")
           second
           string/lower-case))

(defn- block-by-page-name-and-block-route-name
  [db page-id-name-or-uuid route-name]
  (when-let [page (ldb/get-page db page-id-name-or-uuid)]
    (->> (d/q '[:find (pull ?b [:block/uuid])
                :in $ ?page-id ?route-name ?content-matches
                :where
                [?b :block/page ?page-id]
                [?b :logseq.property/heading]
                [?b :block/title ?content]
                [(?content-matches ?content ?route-name ?b)]]
              db
              (:db/id page)
              route-name
              (fn content-matches? [block-content external-content block-id]
                (let [block (d/entity db block-id)
                      ref-tags (distinct (concat (:block/tags block) (:block/refs block)))]
                  (= (-> (db-content/id-ref->title-ref block-content ref-tags)
                         (db-content/content-id-ref->page ref-tags)
                         heading-content->route-name)
                     (string/lower-case external-content)))))
         ffirst)))

(def-thread-api :thread-api/get-block-by-page-name-and-block-route-name
  [repo page-id-name-or-uuid route-name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (block-by-page-name-and-block-route-name @conn page-id-name-or-uuid route-name)))

(defn- page-entity->summary
  [page]
  (when page
    {:db/id (:db/id page)
     :block/uuid (:block/uuid page)
     :block/title (:block/title page)
     :block/raw-title (:block/raw-title page)
     :block/name (:block/name page)
     :block/journal-day (:block/journal-day page)}))

(def-thread-api :thread-api/get-journal-page-by-day
  [repo journal-day]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-journal-page-by-day @conn journal-day)
            page-entity->summary)))

(def-thread-api :thread-api/get-latest-journals
  [repo n]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (mapv page-entity->summary
          (take n (ldb/get-latest-journals @conn)))))

(def-thread-api :thread-api/page-exists?
  [repo page-name tags]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (boolean (seq (ldb/page-exists? @conn page-name tags)))))

(def-thread-api :thread-api/get-case-page
  [repo page-name-or-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-case-page @conn page-name-or-uuid)
            entity-util/entity->map)))

(def-thread-api :thread-api/get-tags-by-name
  [repo name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (->> (entity-util/get-pages-by-name @conn name)
         (keep (fn [datom]
                 (some-> (d/entity @conn (:e datom))
                         entity-util/entity->map)))
         (filter ldb/class?)
         vec)))

(def-thread-api :thread-api/get-block-parent
  [repo block-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (d/entity @conn [:block/uuid block-uuid])
            :block/parent
            entity-util/entity->map)))

(defn- block-ref-entity
  [db block-ref]
  (cond
    (uuid? block-ref)
    (d/entity db [:block/uuid block-ref])

    (and (string? block-ref) (common-util/uuid-string? block-ref))
    (d/entity db [:block/uuid (uuid block-ref)])

    :else
    (d/entity db block-ref)))

(defn- block-page-info
  [db block-ref]
  (when-let [block (block-ref-entity db block-ref)]
    (when-let [page (:block/page block)]
      {:db/id (:db/id page)
       :block/uuid (:block/uuid page)
       :block/title (:block/title page)
       :block/name (:block/name page)})))

(def-thread-api :thread-api/get-block-page-info
  [repo block-ref]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (block-page-info @conn block-ref)))

(def-thread-api :thread-api/get-block-immediate-children
  [repo block-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (mapv entity-util/entity->map (ldb/get-children @conn block-uuid))))

(def-thread-api :thread-api/get-block-sibling
  [repo block-id direction]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [block (d/entity db block-id)]
        (let [sibling (case direction
                        :left (ldb/get-left-sibling block)
                        :right (ldb/get-right-sibling block)
                        :last-child (some->> (:db/id block)
                                             (ldb/get-block-last-direct-child-id db)
                                             (d/entity db))
                        nil)]
          (some->> sibling
                   (#(worker-plain/entity-forward-map db % {}))
                   worker-plain/with-explicit-ref-fields-recursive))))))

(defn- block-index-entry
  [block parent-ids level]
  {:db/id (:db/id block)
   :block/uuid (:block/uuid block)
   :block/parent {:db/id (:db/id (:block/parent block))}
   :block/order (:block/order block)
   :block/collapsed? (boolean (:block/collapsed? block))
   :block/level level
   :block.temp/has-children? (contains? parent-ids (:db/id block))
   :block.temp/load-status :index})

(defn- visible-index-entries
  [index]
  (loop [entries index
         collapsed-level nil
         result []]
    (if-let [entry (first entries)]
      (let [level (:block/level entry)
            hidden? (and collapsed-level (> level collapsed-level))
            collapsed-level (cond
                              hidden? collapsed-level
                              (:block/collapsed? entry) level
                              :else nil)]
        (recur (next entries)
               collapsed-level
               (cond-> result (not hidden?) (conj entry))))
      result)))

(defn- get-page-block-index
  [db page-id-name-or-uuid initial-limit]
  (assert (pos-int? initial-limit))
  (when-let [root (or (block-ref-entity db page-id-name-or-uuid)
                      (ldb/get-page db page-id-name-or-uuid))]
    (let [tree-entities (vec (ldb/get-block-and-children db (:block/uuid root)))
          children (subvec tree-entities 1)
          parent-ids (into #{} (keep #(some-> % :block/parent :db/id)) children)
          levels (volatile! {(:db/id root) 0})
          index (mapv (fn [block]
                        (let [parent-id (:db/id (:block/parent block))
                              level (inc (get @levels parent-id 0))]
                          (vswap! levels assoc (:db/id block) level)
                          (block-index-entry block parent-ids level)))
                      children)
          initial-ids (->> index
                           visible-index-entries
                           (take initial-limit)
                           (map :db/id))
          blocks (mapv (fn [block-id]
                         (:block (block-handler/get-block-and-children
                                  db block-id {:children? false
                                               :render-data? true})))
                       initial-ids)
          block (:block (block-handler/get-block-and-children
                         db (:db/id root) {:children? false
                                           :render-data? true}))]
      {:block block
       :index index
       :blocks blocks})))

(def-thread-api :thread-api/get-page-blocks-tree
  [repo page-id-name-or-uuid & [option]]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (if-let [initial-limit (:initial-limit option)]
        (get-page-block-index db page-id-name-or-uuid initial-limit)
        (when-let [page (ldb/get-page db page-id-name-or-uuid)]
          (otree/blocks->vec-tree db (ldb/get-page-blocks db (:db/id page)) (:db/id page)))))))

(defn- route-title-info
  [db route-name]
  (let [page (ldb/get-page db route-name)]
    (if (and page (ldb/page? page))
      {:page-title (:block/title page)}
      (when (common-util/uuid-string? route-name)
        (when-let [block (d/entity db [:block/uuid (uuid route-name)])]
          {:block-title (:block/title block)})))))

(def-thread-api :thread-api/get-route-title
  [repo route-name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (route-title-info @conn route-name)))

(def-thread-api :thread-api/get-file-content
  [repo path]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (:file/content (d/entity @conn [:file/path path]))))
