(ns frontend.worker.db.migrate-mutation2-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(deftest schema-version->updates-table-test
  (is (= [["65.7" {:fix @#'db-migrate/add-quick-add-page}]
          ["65.8" {:fix @#'db-migrate/add-missing-page-name}]
          ["65.10" {:properties [:block/journal-day
                                 :logseq.property.view/sort-groups-by-property
                                 :logseq.property.view/sort-groups-desc?]}]
          ["65.11" {:fix db-migrate/remove-block-path-refs}]
          ["65.12" {:fix @#'db-migrate/remove-position-property-from-url-properties}]
          ["65.13" {:properties [:logseq.property.asset/width
                                 :logseq.property.asset/height]}]
          ["65.14" {:properties [:logseq.property.asset/external-src]}]
          ["65.16" {:properties [:logseq.property.asset/external-file-name]}]
          ["65.17" {:properties [:logseq.property.publish/published-url]}]
          ["65.18" {:fix @#'db-migrate/deprecated-ensure-graph-uuid}]
          ["65.19" {:properties [:logseq.property/choice-classes
                                 :logseq.property/choice-exclusions]}]
          ["65.20" {:properties [:logseq.property.class/bidirectional-property-title
                                 :logseq.property.class/enable-bidirectional?]}]
          ["65.21" {:properties [:logseq.property.sync/large-title-object]}]
          ["65.22" {:properties [:logseq.property.reaction/emoji-id
                                 :logseq.property.reaction/target]}]
          ["65.23" {:properties [:logseq.property.asset/align]}]
          ["65.24" {:properties [:logseq.property/deleted-at
                                 :logseq.property/deleted-by-ref
                                 :logseq.property.recycle/original-parent
                                 :logseq.property.recycle/original-page
                                 :logseq.property.recycle/original-order]}]
          ["65.25" {:delete-properties [:block/pre-block?
                                        :logseq.property.embedding/hnsw-label
                                        :logseq.property.embedding/hnsw-label-updated-at]}]
          ["65.26" {:properties [:logseq.property.repeat/repeat-type]}]
          ["65.27" {:classes [:logseq.class/Comments]
                    :properties [:logseq.property.comments/blocks]}]
          ["65.28" {:classes [:logseq.class/Comment]
                    :fix @#'db-migrate/tag-comment-blocks}]
          ["65.29" {:fix @#'db-migrate/add-single-block-comment-targets}]
          ["65.30" {:properties [:logseq.property/assignee]}]
          ["65.31" {:properties [:logseq.property.agent/session-id]}]
          ["65.32" {:fix @#'db-migrate/repair-comment-classes-and-targets}]
          ["65.33" {:properties [:logseq.property.view/gallery-asset-property
                                 :logseq.property.view/gallery-display-properties
                                 :logseq.property.view/gallery-card-size
                                 :logseq.property.view/gallery-card-width
                                 :logseq.property.view/gallery-card-height]}]
          ["65.34" {:fix db-order/missing-internal-page-parent-order-tx}]]
         db-migrate/schema-version->updates)))

(deftest remove-block-path-refs-retracts-path-refs-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/id 1 :block/title "a"}
                       {:db/id 2 :block/title "b" :block/path-refs [1]}])
    (is (some #{[:db/retract 2 :block/path-refs]}
              (db-migrate/remove-block-path-refs @conn)))))

(deftest repair-comment-classes-retracts-block-order-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/id 1 :db/ident :logseq.class/Root}
                       {:db/id 2
                        :db/ident :logseq.class/Comments
                        :block/order "a0"
                        :logseq.property.class/extends 1}])
    (is (= [[:db/retract 2 :block/order "a0"]]
           (vec (#'db-migrate/repair-comment-classes-and-targets @conn))))))

(defn- initial-conn
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data ""))
    conn))

(deftest ensure-built-in-data-skips-contents-page-test
  (let [conn (d/create-conn db-schema/schema)]
    (is (some #(= "Contents" (:block/title %)) (sqlite-create-graph/build-db-initial-data "")))
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (empty? (d/q '[:find [?e ...] :where [?e :block/title "Contents"]] @conn)))))

(deftest ensure-built-in-data-restores-title-name-and-built-in-flag-test
  (let [conn (initial-conn)
        icon (d/entity @conn :logseq.property/icon)
        eid (:db/id icon)
        title (:block/title icon)
        block-name (:block/name icon)]
    (is (some? title))
    (is (some? block-name))
    (d/transact! conn [[:db/add eid :block/title "changed title"]
                       [:db/add eid :block/name "changed-name"]
                       [:db/add eid :logseq.property/built-in? false]])
    (db-migrate/ensure-built-in-data-exists! conn)
    (let [icon' (d/entity @conn :logseq.property/icon)]
      (is (= title (:block/title icon')))
      (is (= block-name (:block/name icon')))
      (is (true? (:logseq.property/built-in? icon'))))))

(deftest ensure-built-in-data-restores-built-in-flag-of-a-class-test
  (let [conn (initial-conn)
        eid (:db/id (d/entity @conn :logseq.class/Task))]
    (d/transact! conn [[:db/add eid :logseq.property/built-in? false]])
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (true? (:logseq.property/built-in? (d/entity @conn :logseq.class/Task))))))

(deftest ensure-built-in-data-restores-description-of-a-built-in-property-test
  (let [conn (initial-conn)
        ident :logseq.property.class/enable-bidirectional?
        description (:block/title (:logseq.property/description (d/entity @conn ident)))
        user-uuid (random-uuid)]
    (is (string? description))
    (d/transact! conn [{:block/uuid user-uuid :block/title "user description"}
                       {:db/ident ident :logseq.property/description [:block/uuid user-uuid]}])
    (is (= "user description" (:block/title (:logseq.property/description (d/entity @conn ident)))))
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (= description (:block/title (:logseq.property/description (d/entity @conn ident)))))))

(deftest ensure-built-in-data-transacts-as-fix-db-migration-test
  (let [conn (d/create-conn db-schema/schema)
        metas (atom [])]
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (let [result (db-migrate/ensure-built-in-data-exists! conn)]
      (is (= [true] (mapv :fix-db? @metas)))
      (is (= [true] (mapv :db-migrate? @metas)))
      (is (= :ensure-built-in-data-exists!
             ((get-in result [:migrate-updates :fix]) nil))))))

(deftest upgrade-version-adds-built-in-properties-and-classes-test
  (let [conn (d/create-conn db-schema/schema)
        metas (atom [])]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 12}}])
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (#'db-migrate/upgrade-version! conn "65.13"
                                   {:properties [:logseq.property.asset/width
                                                 :logseq.property.asset/height]})
    (is (= [true] (mapv :db-migrate? @metas)))
    (doseq [ident [:logseq.property.asset/width :logseq.property.asset/height]]
      (is (true? (:logseq.property/built-in? (d/entity @conn ident))) (str ident)))
    (doseq [ident [:logseq.class/Property :logseq.class/Tag :logseq.class/Page
                   :logseq.class/Journal :logseq.class/Whiteboard]]
      (is (true? (:logseq.property/built-in? (d/entity @conn ident))) (str ident)))))

(deftest upgrade-version-keeps-existing-classes-test
  (let [conn (d/create-conn db-schema/schema)
        page-uuid (:block/uuid (d/entity (let [c (initial-conn)] @c) :logseq.class/Page))]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 12}}
                       {:db/ident :logseq.class/Page
                        :block/uuid page-uuid
                        :block/title "Existing page class"}])
    (#'db-migrate/upgrade-version! conn "65.13" {})
    (let [page (d/entity @conn :logseq.class/Page)]
      (is (= page-uuid (:block/uuid page)))
      (is (= "Existing page class" (:block/title page))))
    (is (some? (d/entity @conn :logseq.class/Journal)))))

(deftest migrate-reports-from-and-to-versions-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 12}}])
    (let [result (db-migrate/migrate conn :target-version {:major 65 :minor 13})]
      (is (= {:major 65 :minor 12} (:from-version result)))
      (is (= {:major 65 :minor 13} (:to-version result)))
      (is (= 2 (count (:upgrade-result-coll result)))))))
