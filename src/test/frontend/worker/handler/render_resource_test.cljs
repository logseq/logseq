(ns frontend.worker.handler.render-resource-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.render-resource :as render-resource]
            [frontend.worker.handler.query :as query-handler]
            [frontend.worker.handler.search :as search-handler]
            [frontend.worker.query-dsl :as query-dsl]
            [frontend.worker.render-affected-keys :as render-affected-keys]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(def ^:private test-repo "render-resource-test")

(defn- datalog-query-watch-keys
  [resource-key]
  (let [{:keys [attrs task-attrs tasks? opaque?]}
        (query-handler/custom-query-watch-dependencies (second resource-key))
        keys (cond-> (into #{} (map (fn [attr] [:attr attr])) attrs)
               (seq task-attrs) (into (map (fn [attr] [:task-attr attr])) task-attrs)
               tasks? (conj [:tasks]))]
    (if (or opaque? (empty? keys)) #{[:graph]} keys)))

(deftest task-query-uses-semantic-watch-key-test
  (let [query-spec {:kind :datalog
                    :query '[:find (pull ?b [*])
                             :in $ ?start ?today
                             :where
                             (task ?b #{"Doing"})
                             [?b :block/page ?page]
                             [?page :block/journal-day ?day]
                             [(>= ?day ?start)]
                             [(<= ?day ?today)]]
                    :inputs [20260718 :today]}
        watch-keys (datalog-query-watch-keys [:query query-spec])]
    (is (contains? watch-keys [:tasks]))
    (is (contains? watch-keys [:task-attr :block/page]))
    (is (not (contains? watch-keys [:attr :block/page])))
    (is (contains? watch-keys [:attr :block/journal-day]))
    (is (not (contains? watch-keys [:graph])))
    (is (not (contains? watch-keys [:attr :block/title])))))

(defn- fixture-uuids
  []
  (zipmap [:page
           :journal-a :journal-b
           :journal-child-a :journal-child-b :journal-grandchild
           :reaction-target :creator-a :creator-b :reaction-a :reaction-b
           :view-owner :view-a :view-b :other-view :view-row
           :resource-block :display-property :positioned-property :hidden-property
           :property-value :closed-value
           :bidirectional-class :bidirectional-property :bidirectional-entity
           :reference-block :comment-thread :comment-block :comment-block-b
           :comment-author-a :comment-author-b :empty-comment-thread
           :task-block :task-history-doing :task-history-done
           :route-heading
           :class-page :class-visible-child :class-filtered-child
           :property-page :property-visible-child :property-filtered-child
           :quick-add-page :current-user :other-user
           :quick-add-unowned :quick-add-current-user :quick-add-other-user]
          (repeatedly random-uuid)))

(defn- page-and-journal-tx
  [uuids]
  [{:db/id -1
    :block/uuid (:page uuids)
    :block/tx-id 20
    :block/title "Page Identity"
    :block/name "page identity"
    :block/tags :logseq.class/Page}
   {:db/id -2
    :block/uuid (:journal-a uuids)
    :block/tx-id 20
    :block/title "Jan 1st, 2020"
    :block/name "jan 1st, 2020"
    :block/journal-day 20200101
    :block/tags :logseq.class/Journal}
   {:db/id -3
    :block/uuid (:journal-b uuids)
    :block/tx-id 20
    :block/title "Jan 2nd, 2020"
    :block/name "jan 2nd, 2020"
    :block/journal-day 20200102
    :block/tags :logseq.class/Journal}
   {:db/id -4
    :block/uuid (:journal-child-a uuids)
    :block/tx-id 20
    :block/title "First child"
    :block/page -2
    :block/parent -2
    :block/order "a0"}
   {:db/id -5
    :block/uuid (:journal-child-b uuids)
    :block/tx-id 20
    :block/title "Second child"
    :block/page -2
    :block/parent -2
    :block/order "b0"}
   {:db/id -6
    :block/uuid (:journal-grandchild uuids)
    :block/tx-id 20
    :block/title "Nested child"
    :block/page -2
    :block/parent -4
    :block/order "a1"}])

(defn- reaction-tx
  [uuids]
  [{:db/id -7
    :block/uuid (:reaction-target uuids)
    :block/tx-id 20
    :block/title "Reaction target"
    :block/page -1
    :block/parent -1
    :block/order "a0"}
   {:db/id -8
    :block/uuid (:creator-a uuids)
    :block/tx-id 20
    :block/title "Alpha"}
   {:db/id -9
    :block/uuid (:creator-b uuids)
    :block/tx-id 20
    :block/title "Zed"}
   {:db/id -10
    :block/uuid (:reaction-a uuids)
    :block/tx-id 20
    :logseq.property.reaction/emoji-id "thumbsup"
    :logseq.property.reaction/target -7
    :logseq.property/created-by-ref -8}
   {:db/id -11
    :block/uuid (:reaction-b uuids)
    :block/tx-id 20
    :logseq.property.reaction/emoji-id "thumbsup"
    :logseq.property.reaction/target -7
    :logseq.property/created-by-ref -9}])

(defn- view-tx
  [uuids]
  [{:db/id -12
    :block/uuid (:view-owner uuids)
    :block/tx-id 20
    :block/title "Projects"
    :block/name "projects"
    :block/tags :logseq.class/Tag}
   {:db/id -13
    :block/uuid (:view-a uuids)
    :block/tx-id 20
    :block/title "First view"
    :block/order "a0"
    :logseq.property/view-for -12
    :logseq.property.view/feature-type :class-objects}
   {:db/id -14
    :block/uuid (:view-b uuids)
    :block/tx-id 20
    :block/title "Second view"
    :block/order "b0"
    :logseq.property/view-for -12
    :logseq.property.view/feature-type :class-objects}
   {:db/id -15
    :block/uuid (:other-view uuids)
    :block/tx-id 20
   :block/title "Other view"
   :block/order "c0"
   :logseq.property/view-for -12
    :logseq.property.view/feature-type :linked-references
    :logseq.property.view/type :logseq.property.view/type.table}
   {:db/id -16
    :block/uuid (:view-row uuids)
    :block/tx-id 20
    :block/title "Object row"
    :block/tags -12}])

(defn- block-resource-tx
  [uuids]
  [{:db/id -18
    :db/ident :user.property/display
    :block/uuid (:display-property uuids)
    :block/tx-id 20
    :block/title "Display"
    :block/tags :logseq.class/Property
    :db/valueType :db.type/ref
    :db/cardinality :db.cardinality/one
    :logseq.property/type :node
    :logseq.property/ui-position :properties
    :logseq.property/public? true}
   {:db/id -19
    :db/ident :user.property/positioned
    :block/uuid (:positioned-property uuids)
    :block/tx-id 20
    :block/title "Positioned"
    :block/tags :logseq.class/Property
    :db/valueType :db.type/string
    :db/cardinality :db.cardinality/one
    :logseq.property/type :default
    :logseq.property/ui-position :block-right
    :logseq.property/public? true}
   {:db/id -20
    :db/ident :user.property/hidden
    :block/uuid (:hidden-property uuids)
    :block/tx-id 20
    :block/title "Hidden"
    :block/tags :logseq.class/Property
    :db/valueType :db.type/string
    :db/cardinality :db.cardinality/one
    :logseq.property/type :default
    :logseq.property/ui-position :properties
    :logseq.property/public? true
    :logseq.property/hide? true}
   {:db/id -21
    :block/uuid (:property-value uuids)
    :block/tx-id 20
    :block/title "Property value"}
   {:db/id -22
    :block/uuid (:closed-value uuids)
    :block/tx-id 20
    :block/title "Closed value"
    :block/order "a0"
    :block/closed-value-property -18}
   {:db/id -17
    :block/uuid (:resource-block uuids)
    :block/tx-id 20
    :block/title "Resource block"
    :block/page -1
    :block/parent -1
    :block/order "r0"
    :user.property/display -21
    :user.property/positioned "right"
    :user.property/hidden "secret"}])

(defn- related-resource-tx
  [uuids]
  [{:db/id -23
    :block/uuid (:bidirectional-class uuids)
    :block/tx-id 20
    :block/title "Project"
    :block/created-at 1000
    :block/tags :logseq.class/Tag
    :logseq.property.class/enable-bidirectional? true}
   {:db/id -24
    :db/ident :user.property/target
    :block/uuid (:bidirectional-property uuids)
    :block/tx-id 20
    :block/title "Target"
    :block/tags :logseq.class/Property
    :db/valueType :db.type/ref
    :db/cardinality :db.cardinality/one
    :logseq.property/type :node
    :logseq.property/classes -23}
   {:db/id -25
    :block/uuid (:bidirectional-entity uuids)
    :block/tx-id 20
    :block/title "Related project"
    :block/created-at 2000
    :block/tags -23
    :user.property/target -17}
   {:db/id -26
    :block/uuid (:reference-block uuids)
    :block/tx-id 20
    :block/title "Reference"
    :block/page -1
    :block/parent -1
    :block/order "s0"
    :block/refs -17}
   {:db/id -27
    :block/uuid (:comment-thread uuids)
    :block/tx-id 20
    :block/title "Comments"
    :block/page -1
    :block/parent -1
    :block/order "t0"
    :block/tags :logseq.class/Comments
    :logseq.property.comments/blocks -17}
   {:db/id -28
    :block/uuid (:comment-block uuids)
    :block/tx-id 20
    :block/title "A comment"
    :block/created-at 1000
    :block/page -1
    :block/parent -27
    :block/order "a0"
    :block/tags :logseq.class/Comment
    :logseq.property/created-by-ref -45}
   {:db/id -45
    :block/uuid (:comment-author-a uuids)
    :block/tx-id 20
    :block/title "Alpha"}
   {:db/id -46
    :block/uuid (:comment-author-b uuids)
    :block/tx-id 20
    :block/title "  Beta  "}
   {:db/id -47
    :block/uuid (:comment-block-b uuids)
    :block/tx-id 20
    :block/title "A later comment"
    :block/created-at 3000
    :block/page -1
    :block/parent -27
    :block/order "b0"
    :block/tags :logseq.class/Comment
    :logseq.property/created-by-ref -46}
   {:db/id -48
    :block/uuid (:empty-comment-thread uuids)
    :block/tx-id 20
    :block/title "Empty comments"
    :block/tags :logseq.class/Comments}])

(defn- task-and-route-resource-tx
  [uuids]
  [{:db/id -29
    :block/uuid (:task-block uuids)
    :block/tx-id 20
    :block/title "Task"
    :block/page -1
    :block/parent -1
    :block/order "u0"
    :logseq.property/status :logseq.property/status.done}
   {:db/id -30
    :block/uuid (:task-history-doing uuids)
    :block/tx-id 20
    :block/created-at 1000
    :logseq.property.history/block -29
    :logseq.property.history/property :logseq.property/status
    :logseq.property.history/ref-value :logseq.property/status.doing}
   {:db/id -31
    :block/uuid (:task-history-done uuids)
    :block/tx-id 20
    :block/created-at 4000
    :logseq.property.history/block -29
    :logseq.property.history/property :logseq.property/status
    :logseq.property.history/ref-value :logseq.property/status.done}
   {:db/id -32
    :block/uuid (:route-heading uuids)
    :block/tx-id 20
    :block/title "## Route Heading"
    :block/page -1
    :block/parent -1
    :block/order "v0"
    :logseq.property/heading true}])

(defn- special-page-membership-tx
  [uuids]
  [{:db/id -33
    :block/uuid (:class-page uuids)
    :block/tx-id 20
    :block/title "Class page"
    :block/name "class page"
    :block/tags :logseq.class/Tag}
   {:db/id -34
    :block/uuid (:class-visible-child uuids)
    :block/tx-id 20
    :block/title "Visible class child"
    :block/page -33
    :block/parent -33
    :block/order "a0"}
   {:db/id -35
    :block/uuid (:class-filtered-child uuids)
    :block/tx-id 20
    :block/title "Filtered class child"
    :block/page -33
    :block/parent -33
    :block/order "b0"
    :block/tags -33}
   {:db/id -36
    :db/ident :user.property/page-mode
    :block/uuid (:property-page uuids)
    :block/tx-id 20
    :block/title "Property page"
    :block/name "property page"
    :block/tags :logseq.class/Property
    :db/valueType :db.type/string
    :db/cardinality :db.cardinality/one
    :logseq.property/type :default}
   {:db/id -37
    :block/uuid (:property-visible-child uuids)
    :block/tx-id 20
    :block/title "Visible property child"
    :block/page -36
    :block/parent -36
    :block/order "a0"}
   {:db/id -38
    :block/uuid (:property-filtered-child uuids)
    :block/tx-id 20
    :block/title "Filtered property child"
    :block/page -36
    :block/parent -36
    :block/order "b0"
    :user.property/page-mode "set"}
   {:db/id -39
    :block/uuid (:quick-add-page uuids)
    :block/tx-id 20
    :block/title common-config/quick-add-page-name
    :block/name "quick add"
    :block/tags :logseq.class/Page}
   {:db/id -40
    :block/uuid (:current-user uuids)
    :block/tx-id 20
    :block/title "Current user"}
   {:db/id -41
    :block/uuid (:other-user uuids)
    :block/tx-id 20
    :block/title "Other user"}
   {:db/id -42
    :block/uuid (:quick-add-unowned uuids)
    :block/tx-id 20
    :block/title "Unowned"
    :block/page -39
    :block/parent -39
    :block/order "a0"}
   {:db/id -43
    :block/uuid (:quick-add-current-user uuids)
    :block/tx-id 20
    :block/title "Mine"
    :block/page -39
    :block/parent -39
    :block/order "b0"
    :logseq.property/created-by-ref -40}
   {:db/id -44
    :block/uuid (:quick-add-other-user uuids)
    :block/tx-id 20
    :block/title "Theirs"
    :block/page -39
    :block/parent -39
    :block/order "c0"
    :logseq.property/created-by-ref -41}])

(defn- render-resource-fixture
  []
  (let [conn (db-test/create-conn)
        uuids (fixture-uuids)]
    (d/transact! conn
                 (concat (page-and-journal-tx uuids)
                         (reaction-tx uuids)
                         (view-tx uuids)
                         (block-resource-tx uuids)
                         (related-resource-tx uuids)
                         (task-and-route-resource-tx uuids)
                         (special-page-membership-tx uuids)))
    (assoc uuids :conn conn)))

(defn- render-resource-api
  []
  render-resource/render-resource)

(defn- render-resources-api
  []
  render-resource/render-resources)

(defn- call-resource-raw
  ([api conn resource-key]
   (api @conn resource-key))
  ([api conn resource-key runtime]
   (api @conn resource-key runtime)))

(defn- call-resource
  [api conn resource-key]
  (try
    (call-resource-raw api conn resource-key)
    (catch :default error
      (is false
          (str "Expected a supported renderer resource for "
               (pr-str resource-key)
               ", got: "
               (ex-message error)))
      {})))

(defn- call-resource-with-runtime
  [api conn resource-key runtime]
  (try
    (call-resource-raw api conn resource-key runtime)
    (catch :default error
      (is false
          (str "Expected a supported renderer resource for "
               (pr-str resource-key)
               ", got: "
               (ex-message error)))
      {})))

(defn- assert-resource-envelope
  [db resource-key watch-keys value response]
  (is (= #{:basis-rev :key :watch-keys :value}
         (set (keys response))))
  (is (= (:max-tx db) (:basis-rev response)))
  (is (= resource-key (:key response)))
  (is (= watch-keys (:watch-keys response)))
  (is (= value (:value response)))
  (is (= response
         (-> response ldb/write-transit-str ldb/read-transit-str))
      "Every renderer resource response must be transit-safe."))

(defn- assert-resources-envelope
  [db resource-keys response]
  (is (= #{:basis-rev :resources} (set (keys response))))
  (is (= (:max-tx db) (:basis-rev response)))
  (is (= (set resource-keys) (set (keys (:resources response)))))
  (doseq [resource (vals (:resources response))]
    (is (= #{:watch-keys :value} (set (keys resource))))
    (is (set? (:watch-keys resource))))
  (is (= response
         (-> response ldb/write-transit-str ldb/read-transit-str))
      "The complete renderer resource batch must be transit-safe."))

(defn- assert-canonical-block
  [block]
  (is (uuid? (:block/uuid block)))
  (is (integer? (:block/tx-id block)))
  (is (not (contains? block :block/children)))
  (is (not (contains? block :block/properties)))
  (is (not (contains? block :block/properties-text-values)))
  (is (every? #{:block.temp/positioned-properties
                :block.temp/refs-count
                :block.temp/order-list-index}
              (filter #(= "block.temp" (namespace %)) (keys block))))
  (doseq [reference (concat (keep block [:block/page :block/parent])
                            (:block/refs block)
                            (:block/tags block))]
    (when (map? reference)
      (is (every? #{:db/id :db/ident :block/uuid :block/title :block/name
                    :block/tags :logseq.property/value :logseq.property/icon}
                  (keys reference)))
      (doseq [tag (:block/tags reference)]
        (is (every? #{:db/id :db/ident :block/uuid}
                    (keys tag)))))))

(def ^:private default-display-context
  {:gallery-view? false
   :page-title? false
   :sidebar-properties? false
   :tag-dialog? false
   :publishing? false
   :state-hide-empty-properties? false
   :show-empty-and-hidden-properties? false})

(defn- add-view!
  ([conn feature-type]
   (add-view! conn feature-type nil {}))
  ([conn feature-type owner-uuid]
   (add-view! conn feature-type owner-uuid {}))
  ([conn feature-type owner-uuid attributes]
   (let [view-uuid (random-uuid)]
     (d/transact! conn
                  [(cond-> (merge {:block/uuid view-uuid
                                   :block/tx-id 20
                                   :block/title (str (name feature-type) " view")
                                   :logseq.property.view/feature-type feature-type
                                   :logseq.property.view/type :logseq.property.view/type.table}
                                  attributes)
                     owner-uuid
                     (assoc :logseq.property/view-for
                            [:block/uuid owner-uuid]))])
     view-uuid)))

(defn- entity-id
  [db block-uuid]
  (:db/id (d/entity db [:block/uuid block-uuid])))

(defn- query-block-row
  [db block-uuid]
  (let [entity (d/entity db [:block/uuid block-uuid])]
    {:db/id (:db/id entity)
     :block/uuid block-uuid
     :block/title (:block/title entity)
     :block/parent (when-let [parent (:block/parent entity)]
                     {:db/id (:db/id parent)})}))

(deftest render-resources-returns-one-compact-snapshot-envelope-test
  (when-let [api (render-resources-api)]
    (let [{:keys [conn page journal-a journal-b resource-block]}
          (render-resource-fixture)
          page-key [:page-identity "page identity"]
          journals-key [:journals]
          ref-count-key [:block-ref-count resource-block]
          resource-keys [page-key journals-key ref-count-key]
          response (api @conn resource-keys)]
      (assert-resources-envelope @conn resource-keys response)
      (is (= {page-key {:watch-keys #{[:page-lookup "page identity"]}
                         :value page}
              journals-key {:watch-keys #{[:journals]}
                            :value [journal-b journal-a]}
              ref-count-key {:watch-keys #{[:refs resource-block]}
                             :value 1}}
             (:resources response)))
      (is (not-any? #(contains? % :basis-rev)
                    (vals (:resources response)))
          "The shared revision appears exactly once at the batch boundary."))))

(deftest render-resources-accepts-exactly-25-unique-resource-keys-test
  (when-let [api (render-resources-api)]
    (let [{:keys [conn]} (render-resource-fixture)
          resource-keys
          (mapv (fn [index]
                  [:page-identity (str "missing page " index)])
                (range 25))
          response (api @conn resource-keys)]
      (assert-resources-envelope @conn resource-keys response)
      (is (= 25 (count (:resources response))))
      (is (every? nil? (map :value (vals (:resources response))))))))

(deftest render-resources-rejects-non-vector-empty-duplicate-and-oversize-batches-test
  (when-let [api (render-resources-api)]
    (let [{:keys [conn]} (render-resource-fixture)
          resource-key [:page-identity "page identity"]
          oversized
          (mapv (fn [index]
                  [:page-identity (str "missing page " index)])
                (range 26))]
      (doseq [resource-keys [nil
                             '()
                             #{resource-key}
                             []
                             [resource-key resource-key]
                             oversized]]
        (is (thrown? js/Error (api @conn resource-keys))
            (str "Expected invalid renderer resource batch: "
                 (pr-str resource-keys)))))))

(deftest worker-exposes-only-the-batched-render-resources-thread-api-test
  (let [api (get @thread-api/*thread-apis
                 :thread-api/get-render-resources)
        removed-api (get @thread-api/*thread-apis
                         :thread-api/get-render-resource)]
    (is (fn? api) "Missing thread API: get-render-resources")
    (is (nil? removed-api) "The single-resource transport API is deleted.")
    (when api
      (let [{:keys [conn resource-block]} (render-resource-fixture)
            db @conn
            deref-count (atom 0)
            counting-conn
            (reify
              IDeref
              (-deref [_]
                (swap! deref-count inc)
                db))
            resource-keys [[:page-identity "page identity"]
                           [:block-ref-count resource-block]]]
        (with-redefs [worker-state/get-datascript-conn
                      (fn [repo]
                        (is (= test-repo repo))
                        counting-conn)]
          (let [response (api test-repo resource-keys)]
            (assert-resources-envelope db resource-keys response)
            (is (= 1 @deref-count)
                "Every key is evaluated from one immutable DB snapshot.")))))))

(deftest batched-render-resources-thread-api-fails-fast-without-a-database-test
  (when-let [api (get @thread-api/*thread-apis
                      :thread-api/get-render-resources)]
    (with-redefs [worker-state/get-datascript-conn (constantly nil)]
      (is (thrown-with-msg? js/Error
                            #"Missing renderer resource database"
                            (api test-repo [[:journals]]))))))

(deftest page-identity-resource-resolves-only-the-page-uuid-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          resource-key [:page-identity "page identity"]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:page-lookup "page identity"]}
                                page
                                response))))

(deftest missing-page-identity-keeps-a-creation-watch-key-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn]} (render-resource-fixture)
          resource-key [:page-identity "missing page"]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:page-lookup "missing page"]}
                                nil
                                response))))

(deftest page-preview-source-resource-resolves-aliases-to-one-uuid-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          source-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -100
                     :block/uuid source-uuid
                     :block/tx-id 21
                     :block/title "Alias source"
                     :block/name "alias source"
                     :block/tags :logseq.class/Page
                     :block/alias [:block/uuid page]}])
      (let [resource-key [:page-preview-source page]
            response (call-resource api conn resource-key)]
        (assert-resource-envelope @conn
                                  resource-key
                                  #{[:entity page]
                                    [:attr :block/alias]}
                                  source-uuid
                                  response)))))

(deftest page-preview-source-resource-keeps-the-page-without-an-alias-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-a]} (render-resource-fixture)
          resource-key [:page-preview-source journal-a]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:entity journal-a]
                                  [:attr :block/alias]}
                                journal-a
                                response))))

(deftest block-breadcrumb-resource-returns-only-ordered-uuids-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page positioned-property]} (render-resource-fixture)
          parent-a (random-uuid)
          parent-b (random-uuid)
          target (random-uuid)]
      (d/transact! conn
                   [{:db/id -101
                     :block/uuid parent-a
                     :block/tx-id 21
                     :block/title "Parent A"
                     :block/page [:block/uuid page]
                     :block/parent [:block/uuid page]
                     :block/order "x0"}
                    {:db/id -102
                     :block/uuid parent-b
                     :block/tx-id 21
                     :block/title "Parent B"
                     :block/page [:block/uuid page]
                     :block/parent -101
                     :block/order "x1"}
                    {:db/id -103
                     :block/uuid target
                     :block/tx-id 21
                     :block/title "Target"
                     :block/page [:block/uuid page]
                     :block/parent -102
                     :block/order "x2"
                     :logseq.property/created-from-property
                     [:block/uuid positioned-property]}])
      (let [resource-key [:block-breadcrumb target 16]
            response (call-resource api conn resource-key)
            expected {:target-uuid target
                      :ancestor-uuids [page parent-a parent-b positioned-property]
                      :ref-titles {}}]
        (assert-resource-envelope @conn
                                  resource-key
                                  #{[:entity target]
                                    [:entity page]
                                    [:entity parent-a]
                                    [:entity parent-b]
                                    [:entity positioned-property]}
                                  expected
                                  response)
        (is (every? uuid? (:ancestor-uuids (:value response))))))))

(deftest block-breadcrumb-resource-honors-the-requested-depth-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          parent-a (random-uuid)
          parent-b (random-uuid)
          target (random-uuid)]
      (d/transact! conn
                   [{:db/id -104
                     :block/uuid parent-a
                     :block/tx-id 21
                     :block/title "Parent A"
                     :block/page [:block/uuid page]
                     :block/parent [:block/uuid page]
                     :block/order "y0"}
                    {:db/id -105
                     :block/uuid parent-b
                     :block/tx-id 21
                     :block/title "Parent B"
                     :block/page [:block/uuid page]
                     :block/parent -104
                     :block/order "y1"}
                    {:db/id -106
                     :block/uuid target
                     :block/tx-id 21
                     :block/title "Target"
                     :block/page [:block/uuid page]
                     :block/parent -105
                     :block/order "y2"}])
      (let [resource-key [:block-breadcrumb target 1]
            response (call-resource api conn resource-key)]
        (assert-resource-envelope @conn
                                  resource-key
                                  #{[:entity target]
                                    [:entity page]
                                    [:entity parent-b]}
                                  {:target-uuid target
                                   :ancestor-uuids [page parent-b]
                                   :ref-titles {}}
                                  response)))))

(deftest block-breadcrumb-resource-includes-ref-titles-and-exact-watch-keys-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          ref-uuid (random-uuid)
          parent-uuid (random-uuid)
          target-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -107
                     :block/uuid ref-uuid
                     :block/tx-id 21
                     :block/title "Referenced title"}
                    {:db/id -108
                     :block/uuid parent-uuid
                     :block/tx-id 21
                     :block/title (str "See [[" ref-uuid "]]")
                     :block/page [:block/uuid page]
                     :block/parent [:block/uuid page]
                     :block/order "z0"
                     :block/refs -107}
                    {:db/id -109
                     :block/uuid target-uuid
                     :block/tx-id 21
                     :block/title "Target"
                     :block/page [:block/uuid page]
                     :block/parent -108
                     :block/order "z1"}])
      (let [resource-key [:block-breadcrumb target-uuid 1]
            response (call-resource api conn resource-key)]
        (assert-resource-envelope @conn
                                  resource-key
                                  #{[:entity target-uuid]
                                    [:entity page]
                                    [:entity parent-uuid]
                                    [:entity ref-uuid]}
                                  {:target-uuid target-uuid
                                   :ancestor-uuids [page parent-uuid]
                                   :ref-titles {ref-uuid "Referenced title"}}
                                  response)
        (d/transact! conn
                     [{:db/id [:block/uuid ref-uuid]
                       :block/tx-id 22
                       :block/title "Updated title"}])
        (is (= {ref-uuid "Updated title"}
               (get-in (call-resource api conn resource-key)
                       [:value :ref-titles])))))))

(deftest journals-resource-returns-ordered-uuids-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-a journal-b]}
          (render-resource-fixture)
          resource-key [:journals]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:journals]}
                                [journal-b journal-a]
                                response))))

(deftest journal-bundle-resource-is-flat-and-transit-safe-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-a journal-child-a journal-child-b
                  journal-grandchild]}
          (render-resource-fixture)
          resource-key [:journal-bundle journal-a]
          response (call-resource api conn resource-key)
          bundle (:value response)
          block-uuids #{journal-a journal-child-a journal-child-b
                        journal-grandchild}]
      (assert-resource-envelope @conn resource-key #{} bundle response)
      (is (= #{} (:watch-keys response))
          "A mounted bundle is updated by canonical block and child deltas, not full reloads.")
      (is (= journal-a (:root-uuid bundle)))
      (is (= block-uuids (set (keys (:blocks bundle)))))
      (is (= block-uuids (set (keys (:children bundle))))
          "The bootstrap includes direct membership slots for leaves too.")
      (doseq [block (vals (:blocks bundle))]
        (assert-canonical-block block))
      (is (= [[journal-child-a "a0"]
              [journal-child-b "b0"]]
             (get-in bundle [:children journal-a :items])))
      (is (= [[journal-grandchild "a1"]]
             (get-in bundle [:children journal-child-a :items])))
      (is (= [] (get-in bundle [:children journal-child-b :items])))
      (is (= [] (get-in bundle [:children journal-grandchild :items])))
      (doseq [[parent-uuid membership] (:children bundle)]
        (is (= (get-in bundle [:blocks parent-uuid :block/tx-id])
               (:parent-tx-id membership))))
      (is (= response
             (-> response ldb/write-transit-str ldb/read-transit-str))))))

(deftest block-reactions-resource-returns-final-render-summary-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn reaction-target creator-a creator-b]}
          (render-resource-fixture)
          resource-key [:block-reactions reaction-target creator-a]
          expected [{:emoji-id "thumbsup"
                     :count 2
                     :reacted-by-me? true
                     :usernames ["Alpha" "Zed"]}]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope
       @conn
       resource-key
       #{[:reactions reaction-target]
         [:entity creator-a]
         [:entity creator-b]}
       expected
       response))))

(deftest block-display-properties-resource-returns-only-normalized-entity-identities-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block display-property hidden-property
                  property-value closed-value]}
          (render-resource-fixture)
          resource-key [:block-display-properties resource-block default-display-context]
          description-property-uuid (:block/uuid
                                     (d/entity @conn :logseq.property/description))
          class-properties-property-uuid
          (:block/uuid (d/entity @conn :logseq.property.class/properties))
          expected {:full-properties
                    [{:property-uuid display-property
                      :property-ident :user.property/display
                      :value property-value
                      :closed-value-uuids [closed-value]}]
                    :hidden-properties
                    [{:property-uuid hidden-property
                      :property-ident :user.property/hidden
                      :value "secret"
                      :closed-value-uuids []}]
                    :description-property-uuid description-property-uuid
                    :class-properties-property-uuid class-properties-property-uuid}
          response (call-resource api conn resource-key)]
      (assert-resource-envelope
       @conn
       resource-key
       #{[:display-properties resource-block]
         [:entity display-property]
         [:entity hidden-property]
         [:entity property-value]
         [:entity closed-value]
         [:property-membership :block/closed-value-property]}
       expected
       response)
      (is (not-any? map?
                    (concat (map :value (get-in response [:value :full-properties]))
                            (map :value (get-in response [:value :hidden-properties]))))
          "Graph property values cross the resource boundary only as UUIDs."))))

(deftest block-positioned-properties-resource-watches-every-candidate-definition-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block display-property positioned-property hidden-property]}
          (render-resource-fixture)
          resource-key [:block-positioned-properties resource-block :block-right]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope
       @conn
       resource-key
       #{[:entity resource-block]
         [:entity display-property]
         [:entity positioned-property]
         [:entity hidden-property]}
       [positioned-property]
       response))))

(deftest block-bidirectional-properties-resource-returns-uuid-groups-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block bidirectional-class bidirectional-entity]}
          (render-resource-fixture)
          resource-key [:block-bidirectional-properties resource-block]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope
       @conn
       resource-key
       #{[:bidirectional resource-block]}
       [{:class-uuid bidirectional-class
         :entity-uuids [bidirectional-entity]}]
       response))))

(deftest block-bidirectional-properties-resource-has-an-authoritative-empty-value-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-b]} (render-resource-fixture)
          resource-key [:block-bidirectional-properties journal-child-b]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:bidirectional journal-child-b]}
                                []
                                response))))

(deftest block-ref-count-resource-uses-the-target-reference-key-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block]} (render-resource-fixture)
          resource-key [:block-ref-count resource-block]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:refs resource-block]}
                                1
                                response))))

(deftest block-ref-count-resource-has-an-authoritative-zero-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-b]} (render-resource-fixture)
          resource-key [:block-ref-count journal-child-b]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:refs journal-child-b]}
                                0
                                response))))

(deftest block-unlinked-ref-exists-resource-gates-empty-reference-views-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page view-row]} (render-resource-fixture)
          page-id (entity-id @conn page)
          row-id (entity-id @conn view-row)
          resource-key [:block-unlinked-ref-exists page]
          _ (d/transact! conn [[:db/add page-id :block/title "Reference target"]
                               [:db/add row-id :block/title "Mentions reference target"]])]
      (with-redefs [search-handler/search-blocks
                    (fn [_repo _query _opts] [{:db/id row-id}])]
        (let [response (call-resource-with-runtime api conn resource-key {:repo test-repo})]
          (assert-resource-envelope @conn resource-key
                                    #{[:entity page] [:unlinked-index]}
                                    true
                                    response)))
      (with-redefs [search-handler/search-blocks (fn [& _] [])]
        (let [response (call-resource-with-runtime api conn resource-key {:repo test-repo})]
          (assert-resource-envelope @conn resource-key
                                    #{[:entity page] [:unlinked-index]}
                                    false
                                    response))))))

(deftest block-comment-threads-resource-returns-only-ordered-thread-uuids-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block comment-thread]} (render-resource-fixture)
          resource-key [:block-comment-threads resource-block]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:comments resource-block]}
                                [comment-thread]
                                response)
      (is (not-any? map? (:value response))
          "Comment blocks load through ordinary block and child subscriptions."))))

(deftest block-comment-threads-resource-has-an-authoritative-empty-value-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-b]} (render-resource-fixture)
          resource-key [:block-comment-threads journal-child-b]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:comments journal-child-b]}
                                []
                                response))))

(deftest block-comment-summary-resource-returns-plain-summary-and-exact-watches-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn comment-thread comment-block comment-block-b
                  comment-author-a comment-author-b]}
          (render-resource-fixture)
          resource-key [:block-comment-summary comment-thread]
          watch-keys #{[:entity comment-thread]
                       [:children comment-thread]
                       [:entity comment-block]
                       [:entity comment-block-b]
                       [:entity comment-author-a]
                       [:entity comment-author-b]}
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                watch-keys
                                {:count 2
                                 :latest-author "Beta"
                                 :latest-created-at 3000}
                                response)
      (d/transact! conn
                   [[:db/add [:block/uuid comment-block-b]
                     :block/title "Edited comment"]
                    [:db/add [:block/uuid comment-block-b]
                     :logseq.property/created-by-ref
                     [:block/uuid comment-author-a]]
                    [:db/add [:block/uuid comment-block-b]
                     :block/created-at 500]])
      (assert-resource-envelope @conn
                                resource-key
                                #{[:entity comment-thread]
                                  [:children comment-thread]
                                  [:entity comment-block]
                                  [:entity comment-block-b]
                                  [:entity comment-author-a]}
                                {:count 2
                                 :latest-author "Alpha"
                                 :latest-created-at 1000}
                                (call-resource api conn resource-key)))))

(deftest block-comment-summary-follows-comment-lifecycle-and-author-renames-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page comment-thread comment-block-b]}
          (render-resource-fixture)
          resource-key [:block-comment-summary comment-thread]
          comment-uuid (random-uuid)
          author-uuid (random-uuid)
          add-report
          (d/transact! conn
                       [{:block/uuid author-uuid
                         :block/tx-id 21
                         :block/title "Gamma"}
                        {:block/uuid comment-uuid
                         :block/tx-id 21
                         :block/title "Newest comment"
                         :block/created-at 5000
                         :block/page [:block/uuid page]
                         :block/parent [:block/uuid comment-thread]
                         :block/order "c0"
                         :block/tags :logseq.class/Comment
                         :logseq.property/created-by-ref
                         [:block/uuid author-uuid]}])
          add-keys (render-affected-keys/affected-keys add-report)]
      (is (contains? add-keys [:children comment-thread]))
      (let [response (call-resource api conn resource-key)]
        (is (contains? (:watch-keys response) [:entity author-uuid]))
        (is (= {:count 3
                :latest-author "Gamma"
                :latest-created-at 5000}
               (:value response))))
      (let [rename-report
            (d/transact! conn
                         [[:db/add [:block/uuid author-uuid]
                           :block/title "Gamma renamed"]])
            rename-keys (render-affected-keys/affected-keys rename-report)]
        (is (contains? rename-keys [:entity author-uuid]))
        (is (= "Gamma renamed"
               (get-in (call-resource api conn resource-key)
                       [:value :latest-author]))))
      (let [remove-report
            (d/transact! conn
                         [[:db/retractEntity
                           (entity-id @conn comment-uuid)]])
            remove-keys (render-affected-keys/affected-keys remove-report)]
        (is (contains? remove-keys [:children comment-thread]))
        (is (= {:count 2
                :latest-author "Beta"
                :latest-created-at 3000}
               (:value (call-resource api conn resource-key))))
        (is (contains? (:watch-keys (call-resource api conn resource-key))
                       [:entity comment-block-b]))))))

(deftest block-comment-summary-resource-has-an-authoritative-empty-value-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn empty-comment-thread]} (render-resource-fixture)
          resource-key [:block-comment-summary empty-comment-thread]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:entity empty-comment-thread]
                                  [:children empty-comment-thread]}
                                {:count 0
                                 :latest-author nil
                                 :latest-created-at nil}
                                response))))

(deftest block-comment-summary-resource-rejects-invalid-uuid-and-thread-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block]} (render-resource-fixture)]
      (doseq [resource-key [[:block-comment-summary "not-a-uuid"]
                            [:block-comment-summary (random-uuid)]
                            [:block-comment-summary resource-block]
                            [:block-comment-summary resource-block :extra]]]
        (is (thrown? js/Error
                     (call-resource-raw api conn resource-key))
            (str "Expected invalid comment summary resource: "
                 (pr-str resource-key)))))))

(deftest block-task-time-resource-normalizes-statuses-and-uses-an-explicit-clock-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn task-block]} (render-resource-fixture)
          doing-status-uuid (:block/uuid
                             (d/entity @conn :logseq.property/status.doing))
          done-status-uuid (:block/uuid
                            (d/entity @conn :logseq.property/status.done))
          resource-key [:block-task-time task-block]]
      (with-redefs [common-util/time-ms (constantly 10000)]
        (let [response (call-resource api conn resource-key)]
          (assert-resource-envelope
           @conn
           resource-key
           #{[:task-time task-block]}
           {:history [{:created-at 1000 :status-uuid doing-status-uuid}
                      {:created-at 4000 :status-uuid done-status-uuid}]
            :seconds 3}
           response))))))

(deftest block-task-time-resource-preserves-custom-status-uuid-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn task-block]} (render-resource-fixture)
          custom-status-uuid (random-uuid)
          custom-history-uuid (random-uuid)
          custom-status-id -1001]
      (d/transact! conn
                   [{:db/id custom-status-id
                     :block/uuid custom-status-uuid
                     :block/tx-id 21
                     :block/title "Paused"
                     :logseq.property/created-from-property
                     :logseq.property/status}
                    {:block/uuid custom-history-uuid
                     :block/tx-id 21
                     :block/created-at 7000
                     :logseq.property.history/block [:block/uuid task-block]
                     :logseq.property.history/property :logseq.property/status
                     :logseq.property.history/ref-value custom-status-id}])
      (let [response (call-resource api conn [:block-task-time task-block])]
        (is (= custom-status-uuid
               (get-in response [:value :history 2 :status-uuid])))))))

(deftest block-task-time-resource-has-an-authoritative-empty-value-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-b]} (render-resource-fixture)
          resource-key [:block-task-time journal-child-b]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:task-time journal-child-b]}
                                {:history [] :seconds 0}
                                response))))

(deftest route-block-resource-watches-the-page-lookup-and-resolved-entities-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page route-heading]} (render-resource-fixture)
          resource-key [:route-block "Page Identity" "ROUTE HEADING"]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:page-lookup "page identity"]
                                  [:entity page]
                                  [:route-page page]}
                                route-heading
                                response))))

(deftest missing-route-block-keeps-the-page-lookup-and-page-entity-watch-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          resource-key [:route-block "page identity" "missing heading"]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:page-lookup "page identity"]
                                  [:entity page]
                                  [:route-page page]}
                                nil
                                response))))

(deftest route-block-resource-reuses-reference-aware-page-route-matching-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page]} (render-resource-fixture)
          reference-uuid (random-uuid)
          heading-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid reference-uuid
                     :block/tx-id 21
                     :block/title "Project Atlas"
                     :block/name "project atlas"
                     :block/tags :logseq.class/Page}
                    {:block/uuid heading-uuid
                     :block/tx-id 21
                     :block/title (str "## Plans [[" reference-uuid "]]")
                     :block/page [:block/uuid page]
                     :block/parent [:block/uuid page]
                     :block/order "v1"
                     :block/refs [:block/uuid reference-uuid]
                     :logseq.property/heading 2}])
      (let [resource-key
            [:route-block "Page Identity" "PLANS [[PROJECT ATLAS]]"]
            response (call-resource api conn resource-key)]
        (assert-resource-envelope @conn
                                  resource-key
                                  #{[:page-lookup "page identity"]
                                    [:entity page]
                                    [:route-page page]
                                    [:entity reference-uuid]}
                                  heading-uuid
                                  response)
        (let [rename-report
              (d/transact! conn
                           [[:db/add [:block/uuid reference-uuid]
                             :block/title "Project Nova"]])
              affected-keys
              (render-affected-keys/affected-keys rename-report)]
          (is (contains? affected-keys [:entity reference-uuid]))
          (is (not (contains? affected-keys [:route-page page])))
          (is (nil? (:value (call-resource api conn resource-key)))))))))

(deftest missing-route-block-is-invalidated-when-a-heading-starts-matching-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page route-heading]} (render-resource-fixture)
          resource-key [:route-block "page identity" "new route"]
          before (call-resource api conn resource-key)
          tx-report
          (d/transact! conn
                       [[:db/add [:block/uuid route-heading]
                         :block/title "## New Route"]])
          affected-keys (render-affected-keys/affected-keys tx-report)]
      (is (nil? (:value before)))
      (is (contains? (:watch-keys before) [:route-page page]))
      (is (contains? affected-keys [:route-page page]))
      (is (= route-heading
             (:value (call-resource api conn resource-key)))))))

(deftest class-page-membership-returns-only-visible-direct-child-uuids-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn class-page class-visible-child]} (render-resource-fixture)
          resource-key [:page-membership class-page :class]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:entity class-page]
                                  [:children class-page]
                                  [:class-membership class-page]}
                                [class-visible-child]
                                response))))

(deftest property-page-membership-watches-its-property-ident-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn property-page property-visible-child]}
          (render-resource-fixture)
          resource-key [:page-membership property-page :property]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope
       @conn
       resource-key
       #{[:entity property-page]
         [:children property-page]
         [:property-membership :user.property/page-mode]}
       [property-visible-child]
       response))))

(deftest quick-add-page-membership-keeps-unowned-and-current-user-blocks-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn quick-add-page current-user quick-add-unowned
                  quick-add-current-user]}
          (render-resource-fixture)
          resource-key [:page-membership quick-add-page :quick-add current-user]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{[:entity quick-add-page]
                                  [:graph]}
                                [quick-add-unowned quick-add-current-user]
                                response))))

(deftest views-resource-returns-only-ordered-definition-uuids-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-owner view-a view-b]}
          (render-resource-fixture)
          resource-key [:views view-owner :class-objects]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                #{resource-key}
                                [view-a view-b]
                                response))))

(deftest view-data-resource-supports-every-feature-with-flat-uuid-rows-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page view-owner view-a other-view view-row reference-block
                  property-page property-filtered-child]}
          (render-resource-fixture)
          all-pages-view (add-view! conn :all-pages)
          property-view (add-view! conn :property-objects property-page)
          unlinked-view (add-view! conn :unlinked-references page)
          query-view (add-view! conn :query-result)
          reference-id (entity-id @conn reference-block)
          row-id (entity-id @conn view-row)
          _ (d/transact! conn
                         [[:db/add reference-id :block/refs
                           (entity-id @conn view-owner)]
                          [:db/add row-id :block/title
                           "Mentions Page Identity without a link"]])
          sorting [{:id :block/title :asc? true}]
          cases
          [{:key [:view-data all-pages-view
                  {:feature-type :all-pages :sorting sorting}]
            :watch #{[:entity all-pages-view]
                     [:page-membership]
                     [:attr :block/title]}
            :row page}
           {:key [:view-data view-a
                  {:feature-type :class-objects :sorting sorting}]
            :watch #{[:entity view-a]
                     [:entity view-owner]
                     [:class-membership view-owner]
                     [:class-tree]
                     [:attr :block/title]}
            :row view-row}
           {:key [:view-data property-view
                  {:feature-type :property-objects :sorting sorting}]
            :watch #{[:entity property-view]
                     [:entity property-page]
                     [:property-membership :user.property/page-mode]
                     [:attr :block/title]}
            :row property-filtered-child}
           {:key [:view-data other-view
                  {:feature-type :linked-references :sorting sorting}]
            :watch #{[:entity other-view]
                     [:entity view-owner]
                     [:refs view-owner]
                     [:ref-scope]
                     [:attr :block/title]}
            :row reference-block}
           {:key [:view-data unlinked-view
                  {:feature-type :unlinked-references :sorting sorting}]
            :watch #{[:entity unlinked-view]
                     [:entity page]
                     [:unlinked-index]
                     [:attr :block/title]}
            :row view-row}
           {:key [:view-data query-view
                  {:feature-type :query-result
                   :sorting sorting
                   :query-row-uuids [view-row]}]
            :watch #{[:entity query-view]
                     [:attr :block/title]}
            :row view-row}]]
      (doseq [{:keys [key watch row]} cases]
        (let [response (call-resource api conn key)]
          (assert-resource-envelope @conn key watch (:value response) response)
          (is (= :flat (get-in response [:value :partition])))
          (is (uuid? row))
          (is (contains? (set (get-in response [:value :rows])) row))
          (is (every? uuid? (get-in response [:value :rows]))))))))

(deftest query-view-resource-supports-transient-missing-feature-type-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-row]} (render-resource-fixture)
          query-view (add-view! conn :query-result)
          query-view-id (entity-id @conn query-view)
          _ (d/transact! conn
                         [[:db/retract query-view-id
                           :logseq.property.view/feature-type
                           :query-result]])
          resource-key [:view-data query-view
                        {:feature-type :query-result
                         :sorting []
                         :query-row-uuids [view-row]}]
          response (call-resource api conn resource-key)]
      (is (= [view-row] (get-in response [:value :rows])))
      (is (contains? (:watch-keys response) [:entity query-view])))))

(deftest view-data-resource-normalizes-grouped-and-grouped-list-partitions-test
  (when-let [api (render-resource-api)]
    (testing "grouped scalar rows"
      (let [{:keys [conn view-owner view-a view-row]}
            (render-resource-fixture)
            view-id (entity-id @conn view-a)
            _ (d/transact! conn
                           [[:db/add view-id
                             :logseq.property.view/group-by-property
                             :block/title]])
            resource-key [:view-data view-a
                          {:feature-type :class-objects
                           :sorting [{:id :block/title :asc? true}]}]
            response (call-resource api conn resource-key)]
        (assert-resource-envelope
         @conn
         resource-key
         #{[:entity view-a]
           [:entity view-owner]
           [:class-membership view-owner]
           [:class-tree]
           [:attr :block/title]
           [:attr :block/journal-day]}
         {:partition :grouped
          :count 1
          :groups [{:value {:kind :scalar :value "Object row"}
                    :rows [view-row]}]}
         response)))
    (testing "grouped list rows"
      (let [{:keys [conn view-owner view-a view-row journal-a
                    journal-child-a journal-grandchild]}
            (render-resource-fixture)
            view-id (entity-id @conn view-a)
            owner-id (entity-id @conn view-owner)
            row-id (entity-id @conn view-row)
            child-id (entity-id @conn journal-child-a)
            grandchild-id (entity-id @conn journal-grandchild)
            _ (d/transact! conn
                           [[:db/retract row-id :block/tags owner-id]
                            [:db/add child-id :block/tags owner-id]
                            [:db/add grandchild-id :block/tags owner-id]
                            [:db/add view-id
                             :logseq.property.view/group-by-property
                             :block/page]
                            [:db/add view-id
                             :logseq.property.view/type
                             :logseq.property.view/type.list]])
            resource-key [:view-data view-a
                          {:feature-type :class-objects
                           :sorting [{:id :block/title :asc? true}]}]
            response (call-resource api conn resource-key)
            value (:value response)
            group (first (:groups value))]
        (assert-resource-envelope
         @conn
         resource-key
         #{[:entity view-a]
           [:entity view-owner]
           [:class-membership view-owner]
           [:class-tree]
           [:attr :block/title]
           [:attr :block/page]
           [:attr :block/journal-day]
           [:attr :block/parent]
           [:attr :block/order]}
         value
         response)
        (is (= :grouped-list (:partition value)))
        (is (= 2 (:count value)))
        (is (= {:kind :entity :uuid journal-a} (:value group)))
        (is (= #{[journal-child-a [journal-child-a]]
                 [journal-grandchild [journal-grandchild]]}
               (into #{}
                     (map (juxt :breadcrumb-uuid :rows))
                     (:partitions group))))
        (is (not-any? map?
                      (mapcat :rows (:partitions group)))
            "Nested view rows cross the boundary only as UUIDs.")))))

(deftest unlinked-references-resource-normalizes-list-partitions-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-owner view-a view-row]} (render-resource-fixture)
          view-id (entity-id @conn view-a)
          _ (d/transact! conn
                         [[:db/add view-id
                           :logseq.property.view/feature-type
                           :unlinked-references]])
          resource-key [:view-data view-a
                        {:feature-type :unlinked-references
                         :sorting [{:id :block/updated-at :asc? false}]
                         :input ""
                         :group-by-property-ident :block/page}]]
      (with-redefs [db-view/get-view-data
                    (fn [_db _view-id _option]
                      {:count 1
                       :data [[{:db/id (entity-id @conn view-owner)
                                :block/uuid view-owner}
                               [[view-row
                                 (list {:db/id (entity-id @conn view-row)
                                        :block/parent view-owner})]]]]})]
        (let [response (call-resource api conn resource-key)]
          (is (= {:partition :grouped-list
                  :count 1
                  :groups [{:value {:kind :entity :uuid view-owner}
                            :partitions [{:breadcrumb-uuid view-row
                                          :rows [view-row]}]}]}
                 (:value response))))))))

(deftest view-data-resource-watches-effective-persisted-configuration-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-owner view-a]} (render-resource-fixture)
          view-id (entity-id @conn view-a)
          _ (d/transact! conn
                         [[:db/add view-id
                           :logseq.property.table/sorting
                           [{:id :block/created-at :asc? true}]]
                          [:db/add view-id
                           :logseq.property.table/filters
                           {:or? false
                            :filters [[:block/title :text-contains "Object"]]}]
                          [:db/add view-id
                           :logseq.property.view/group-by-property
                           :block/tags]
                          [:db/add view-id
                           :logseq.property.view/sort-groups-by-property
                           :user.property/page-mode]])
          resource-key [:view-data
                        view-a
                        {:feature-type :class-objects
                         :sorting [{:id :block/updated-at :asc? false}]
                         :filters {:or? false
                                   :filters [[:block/page :is #{}]]}
                         :group-by-property-ident :block/page
                         :input "Object"}]]
      (with-redefs [db-view/get-view-data
                    (fn [_db _view-id _option]
                      {:count 0 :data []})]
        (let [response (call-resource api conn resource-key)]
          (assert-resource-envelope
           @conn
           resource-key
           #{[:entity view-a]
             [:entity view-owner]
             [:class-membership view-owner]
             [:class-tree]
             [:attr :block/created-at]
             [:attr :block/title]
             [:attr :block/tags]
             [:attr :user.property/page-mode]}
           {:partition :grouped :count 0 :groups []}
           response)
          (is (not (contains? (:watch-keys response)
                              [:attr :block/updated-at])))
          (is (not (contains? (:watch-keys response)
                              [:attr :block/page]))))))))

(deftest query-resource-executes-dsl-with-only-serialized-context-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-row]} (render-resource-fixture)
          query-string "(task TODO)"
          query-spec {:kind :dsl
                      :query query-string
                      :cards? false
                      :current-page-title "Page Identity"
                      :today-day 20200101}
          resource-key [:query query-spec]
          calls (atom [])]
      (with-redefs [query-dsl/execute-query
                    (fn [requested-query-string _db opts]
                      (swap! calls conj [requested-query-string opts])
                      [[(query-block-row @conn view-row)]])]
        (let [response (call-resource api conn resource-key)]
          (is (= [[query-string
                   {:cards? false
                    :current-page-title "Page Identity"
                    :today-day 20200101
                    :block-attrs [:db/id :block/uuid
                                  {:block/parent [:db/id]}]}]]
                 @calls))
          (assert-resource-envelope @conn
                                    resource-key
                                    #{[:graph]}
                                    {:rows [view-row]}
                                    response))))))

(deftest blank-dsl-query-resource-renders-an-empty-result-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn]} (render-resource-fixture)
          resource-key [:query {:kind :dsl :query ""}]
          calls (atom 0)]
      (with-redefs [query-dsl/execute-query
                    (fn [& _args]
                      (swap! calls inc)
                      [])]
        (let [response (call-resource api conn resource-key)]
          (is (zero? @calls)
              "A blank query is an editable transient state, not an executable query.")
          (assert-resource-envelope @conn
                                    resource-key
                                    #{[:graph]}
                                    {:rows []}
                                    response))))))

(deftest query-resource-resolves-advanced-page-block-and-today-inputs-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-a journal-grandchild]}
          (render-resource-fixture)
          query '[:find (pull ?child [:block/uuid])
                  :in $ ?current-page ?query-page ?current-block ?parent-block ?today
                  :where
                  [?child :block/parent ?current-block]
                  [?current-block :block/parent ?parent-block]
                  [?current-block :block/page ?page]
                  [?page :block/name ?query-page]
                  [(= ?current-page ?query-page)]
                  [(= ?today 20200101)]]
          resource-key
          [:query {:kind :datalog
                   :query query
                   :inputs [:current-page :query-page :current-block
                            :parent-block :today]
                   :current-block-uuid journal-child-a
                   :today-day 20200101}]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                (datalog-query-watch-keys resource-key)
                                {:rows [journal-grandchild]}
                                response))))

(deftest query-resource-injects-built-in-rules-and-merges-user-rules-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block reference-block]}
          (render-resource-fixture)
          query-without-rules
          '[:find (pull ?b [:block/uuid])
            :in $ ?target-uuid
            :where
            (has-ref ?b ?target)
            [?target :block/uuid ?target-uuid]]
          query-with-user-rules
          '[:find (pull ?b [:block/uuid])
            :in $ ?target-uuid %
            :where
            (custom-ref ?b ?target)
            (has-ref ?b ?target)
            [?target :block/uuid ?target-uuid]]
          user-rules
          '[[(custom-ref ?b ?target)
             [?b :block/refs ?target]]]]
      (doseq [query-spec [{:kind :datalog
                           :query query-without-rules
                           :inputs [resource-block]}
                          {:kind :datalog
                           :query query-with-user-rules
                           :inputs [resource-block]
                           :rules user-rules}]]
        (let [resource-key [:query query-spec]
              response (call-resource api conn resource-key)]
          (assert-resource-envelope @conn
                                    resource-key
                                    (datalog-query-watch-keys resource-key)
                                    {:rows [reference-block]}
                                    response))))))

(deftest query-resource-preserves-scalar-tuples-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn]} (render-resource-fixture)
          resource-key
          [:query {:kind :datalog
                   :query '[:find ?title ?day
                            :in $ ?day
                            :where
                            [?page :block/journal-day ?day]
                            [?page :block/title ?title]]
                   :inputs [20200101]}]
          response (call-resource api conn resource-key)]
      (assert-resource-envelope @conn
                                resource-key
                                (datalog-query-watch-keys resource-key)
                                {:rows [["Jan 1st, 2020" 20200101]]}
                                response))))

(deftest query-resource-applies-serialized-transform-and-top-level-filter-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-a journal-child-b journal-grandchild
                  view-row]}
          (render-resource-fixture)
          query-result (mapv (fn [block-uuid]
                               [(query-block-row @conn block-uuid)])
                             [journal-child-a journal-grandchild
                              journal-child-b view-row])
          resource-key
          [:query {:kind :dsl
                   :query "(task TODO)"
                   :current-block-uuid view-row
                   :remove-block-children? true
                   :result-transform-edn "(fn [rows] (reverse rows))"}]]
      (with-redefs [query-dsl/execute-query
                    (fn [_query _db _opts] query-result)]
        (let [response (call-resource api conn resource-key)]
          (assert-resource-envelope @conn
                                    resource-key
                                    #{[:graph]}
                                    {:rows [journal-child-b journal-child-a]}
                                    response))))))

(deftest query-resource-can-keep-nested-block-results-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn journal-child-a journal-grandchild]}
          (render-resource-fixture)
          query-result (mapv (fn [block-uuid]
                               [(query-block-row @conn block-uuid)])
                             [journal-child-a journal-grandchild])
          resource-key
          [:query {:kind :dsl
                   :query "(task TODO)"
                   :remove-block-children? false}]]
      (with-redefs [query-dsl/execute-query
                    (fn [_query _db _opts] query-result)]
        (let [response (call-resource api conn resource-key)]
          (assert-resource-envelope @conn
                                    resource-key
                                    #{[:graph]}
                                    {:rows [journal-child-a journal-grandchild]}
                                    response))))))

(deftest quoted-full-text-query-uses-worker-search-and-filters-results-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-row resource-block]}
          (render-resource-fixture)
          hidden-uuid (random-uuid)
          calls (atom [])
          resource-key
          [:query {:kind :dsl
                   :query "\"needle\""
                   :current-block-uuid view-row}]]
      (with-redefs [search-handler/search-blocks
                    (fn [repo query-text options]
                      (swap! calls conj [repo query-text options])
                      [{:block/uuid view-row :block/title "needle current"}
                       {:block/uuid hidden-uuid
                        :block/title "needle hidden"
                        :logseq.property/hide? true}
                       {:block/uuid resource-block
                        :block/title "needle visible"}])]
        (let [response (call-resource-with-runtime api conn resource-key
                                                   {:repo test-repo})]
          (is (= [[test-repo
                   "needle"
                   {:limit 30
                    :feature/enable-semantic-search? false}]]
                 @calls))
          (assert-resource-envelope @conn
                                    resource-key
                                    #{[:graph]}
                                    {:rows [resource-block]}
                                    response))))))

(deftest view-and-query-resources-reject-non-data-contracts-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn view-a view-row]} (render-resource-fixture)
          row-entity (d/entity @conn [:block/uuid view-row])
          ownerless-class-view (add-view! conn :class-objects)]
      (testing "view contexts are one typed serializable path"
        (doseq [resource-key
                [[:view-data view-a
                  {:feature-type :class-objects
                   :owner-uuid (random-uuid)}]
                 [:view-data view-a
                  {:feature-type :linked-references}]
                 [:view-data ownerless-class-view
                  {:feature-type :class-objects}]
                 [:view-data view-a
                  {:feature-type :class-objects
                   :sorting [{:id :block/title
                              :value-fn identity}]}]
                 [:view-data view-a
                  {:feature-type :class-objects
                   :filters {:or? false
                             :filters [[:block/tags :is #{row-entity}]]}}]
                 [:view-data view-a
                  {:feature-type :query-result
                   :query-row-uuids ["not-a-uuid"]}]]]
          (is (thrown? js/Error
                       (call-resource-raw api conn resource-key))
              (str "Expected invalid view resource: " (pr-str resource-key)))))
      (testing "query specs contain no closures, entities, or untyped options"
        (doseq [resource-key
                [[:query {:kind :dsl :query "(task TODO)" :cards? "false"}]
                 [:query {:kind :dsl
                          :query "(task TODO)"
                          :query-fn identity}]
                 [:query {:kind :datalog
                          :query '[:find ?e :where [?e :block/title]]
                          :inputs [row-entity]}]
                 [:query {:kind :datalog :query "not datalog"}]
                 [:query {:kind :datalog
                          :query '[:find ?e :where [?e :block/title]]
                          :result-transform-edn '(fn [rows] rows)}]]]
          (is (thrown? js/Error
                       (call-resource-raw api conn resource-key))
              (str "Expected invalid query resource: " (pr-str resource-key)))))
      (testing "full-text has one worker-search path and requires repo context"
        (is (thrown? js/Error
                     (call-resource-raw api conn
                                        [:query {:kind :dsl
                                                 :query "\"needle\""}]))))
      (testing "query result maps without UUIDs never cross the boundary"
        (with-redefs [query-dsl/execute-query
                      (fn [_query _db _opts]
                        [[{:db/id 1 :block/title "No UUID"}]])]
          (is (thrown? js/Error
                       (call-resource-raw api conn
                                          [:query {:kind :dsl
                                                   :query "(task TODO)"}]))))))))

(deftest block-sync-conflicts-resource-is-owned-by-the-sync-state-provider-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn resource-block]} (render-resource-fixture)
          resource-key [:block-sync-conflicts resource-block]]
      (try
        (call-resource-raw api conn resource-key)
        (is false "The DB resource handler must reject sync-state resources.")
        (catch :default error
          (is (= {:provider :sync-state
                  :resource-key resource-key}
                 (select-keys (ex-data error) [:provider :resource-key])))
          (is (= "Renderer resource belongs to a non-DB provider"
                 (ex-message error))))))))

(deftest render-resource-dispatch-rejects-unknown-and-malformed-keys-test
  (when-let [api (render-resource-api)]
    (let [{:keys [conn page resource-block quick-add-page]} (render-resource-fixture)]
      (testing "unknown and malformed resource shapes"
        (doseq [resource-key [nil
                              []
                              [:unknown]
                              [:journals :extra]
                              [:journal-bundle "not-a-uuid"]
                              [:block-display-properties resource-block
                               (dissoc default-display-context :publishing?)]
                              [:block-display-properties resource-block
                               (assoc default-display-context :unknown? false)]
                              [:block-positioned-properties resource-block :properties]
                              [:block-bidirectional-properties "not-a-uuid"]
                              [:block-ref-count resource-block :extra]
                              [:block-comment-threads nil]
                              [:block-task-time resource-block :extra]
                              [:route-block "" "route"]
                              [:route-block "page identity" ""]
                              [:page-membership page :class]
                              [:page-membership page :property]
                              [:page-membership quick-add-page :quick-add nil]
                              [:page-membership quick-add-page :unknown]
                              [:view-data (random-uuid)]
                              [:query {:kind :dsl}]]]
          (is (thrown? js/Error
                       (call-resource-raw api conn resource-key))
              (str "Expected fail-fast for " (pr-str resource-key)))))
      (testing "UI closures never enter worker resource keys"
        (is (thrown? js/Error
                     (call-resource-raw api
                                        conn
                                        [:query {:kind :dsl
                                                 :query "(task TODO)"
                                                 :query-fn identity}])))))))
