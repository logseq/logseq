(ns frontend.worker.db.migrate-mutation2-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

;; Fails if, in `schema-version->updates`, the `:fix` key is dropped, the `:properties` key is dropped, `:block/journal-day` becomes `:block/name`, `:logseq.property.view/sort-groups-by-property` becomes `:logseq.property.view/sort-groups-desc?`, `:logseq.property.view/sort-groups-desc?` becomes `:logseq.property.view/gallery-asset-property`, `:logseq.property.asset/width` becomes `:logseq.property.asset/align`, `:logseq.property.asset/height` becomes `:logseq.property.asset/width`, `:logseq.property.asset/external-src` becomes `:logseq.property.asset/height`, `:logseq.property.asset/external-file-name` becomes `:logseq.property.asset/external-src`, `:logseq.property/choice-classes` becomes `:logseq.property/choice-exclusions`, `:logseq.property/choice-exclusions` becomes `:logseq.property/deleted-at`, `:logseq.property.class/bidirectional-property-title` becomes `:logseq.property.class/enable-bidirectional?`, `:logseq.property.class/enable-bidirectional?` becomes `:logseq.property.class/extends`, `:logseq.property.reaction/emoji-id` becomes `:logseq.property.reaction/target`, `:logseq.property.reaction/target` becomes `:logseq.property.reaction/emoji-id`, `:logseq.property.asset/align` becomes `:logseq.property.asset/external-file-name`, `:logseq.property/deleted-at` becomes `:logseq.property/deleted-by-ref`, `:logseq.property/deleted-by-ref` becomes `:logseq.property/type`, `:logseq.property.recycle/original-parent` becomes `:logseq.property.recycle/original-order`, `:logseq.property.recycle/original-page` becomes `:logseq.property.recycle/original-parent`, `:logseq.property.recycle/original-order` becomes `:logseq.property.recycle/original-page`, the `:delete-properties` key is dropped, `:block/pre-block?` becomes `:block/tags`, `:logseq.property.embedding/hnsw-label` becomes `:logseq.property.embedding/hnsw-label-updated-at`, `:logseq.property.embedding/hnsw-label-updated-at` becomes `:logseq.property.embedding/hnsw-label`, the `:classes` key is dropped, `:logseq.class/Comments` becomes `:logseq.class/Journal`, `:logseq.property/assignee` becomes `:logseq.property/built-in?`, `:logseq.property.view/gallery-asset-property` becomes `:logseq.property.view/gallery-card-height`, `:logseq.property.view/gallery-display-properties` becomes `:logseq.property.view/sort-groups-by-property`, `:logseq.property.view/gallery-card-size` becomes `:logseq.property.view/gallery-card-width`, `:logseq.property.view/gallery-card-width` becomes `:logseq.property.view/gallery-display-properties` or `:logseq.property.view/gallery-card-height` becomes `:logseq.property.view/gallery-card-size`.
(deftest schema-version->updates-table-test
  (let [expected [["65.7" {:fix @#'db-migrate/add-quick-add-page}]
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
        table (into {} db-migrate/schema-version->updates)]
    ;; only the entries these mutants change: a migration added later must not break the test
    (is (= (into {} expected) (select-keys table (map first expected))))))

;; Fails if, in `remove-block-path-refs`, the body becomes `nil` or `:block/path-refs` becomes `:block/pre-block?`.
(deftest remove-block-path-refs-retracts-path-refs-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/id 1 :block/title "a"}
                       {:db/id 2 :block/title "b" :block/path-refs [1]}])
    (is (some #{[:db/retract 2 :block/path-refs]}
              (db-migrate/remove-block-path-refs @conn)))))

;; Fails if, in `repair-comment-classes-and-targets`, `:db/id` becomes `:db/ident` or `:block/order` becomes `:block/parent`.
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

;; Fails if, in `ensure-built-in-data-exists!`, `:block/title` becomes `:block/uuid`.
(deftest ensure-built-in-data-skips-contents-page-test
  (let [conn (d/create-conn db-schema/schema)]
    (is (some #(= "Contents" (:block/title %)) (sqlite-create-graph/build-db-initial-data "")))
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (empty? (d/q '[:find [?e ...] :where [?e :block/title "Contents"]] @conn)))))

;; Fails if, in `ensure-built-in-data-exists!`, `:block/title` becomes `:block/uuid` or `:block/name` becomes `:block/order`.
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

;; Fails if, in `ensure-built-in-data-exists!`, `:logseq.property/built-in?` becomes `:logseq.property/choice-classes`.
(deftest ensure-built-in-data-restores-built-in-flag-of-a-class-test
  (let [conn (initial-conn)
        eid (:db/id (d/entity @conn :logseq.class/Task))]
    (d/transact! conn [[:db/add eid :logseq.property/built-in? false]])
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (true? (:logseq.property/built-in? (d/entity @conn :logseq.class/Task))))))

;; Fails if, in `ensure-built-in-data-exists!`, `:block/uuid` becomes `:block/journal-day` or `:logseq.property/built-in?` becomes `:logseq.property/choice-classes`.
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

;; Fails if, in `ensure-built-in-data-exists!`, the `:fix-db?` key is dropped, the `:db-migrate?` key is dropped or the `:fix` key is dropped.
(deftest ensure-built-in-data-transacts-as-fix-db-migration-test
  (let [conn (d/create-conn db-schema/schema)
        metas (atom [])]
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (let [result (db-migrate/ensure-built-in-data-exists! conn)]
      (is (= [true] (mapv :fix-db? @metas)))
      (is (= [true] (mapv :db-migrate? @metas)))
      (is (= :ensure-built-in-data-exists!
             ((get-in result [:migrate-updates :fix]) nil))))))

;; Fails if, in `upgrade-version!`, the `(map (fn [b] (assoc b :logseq.property/built-in? true)))` step is dropped, `remove` becomes `filter`, `:logseq.class/Page` becomes `:logseq.class/Property`, `:logseq.class/Whiteboard` becomes `:logseq.class/Comment` or the `:db-migrate?` key is dropped.
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

;; Fails if, in `upgrade-version!`, `:logseq.class/Journal` becomes `:logseq.class/Page` or the `;; class already exists, this should ...` step is dropped.
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

;; Fails if, in `migrate`, the `:from-version` key is dropped or the `:to-version` key is dropped.
(deftest migrate-reports-from-and-to-versions-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 12}}])
    (let [result (db-migrate/migrate conn :target-version {:major 65 :minor 13})]
      (is (= {:major 65 :minor 12} (:from-version result)))
      (is (= {:major 65 :minor 13} (:to-version result)))
      (is (= 2 (count (:upgrade-result-coll result)))))))
