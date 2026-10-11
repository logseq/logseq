(ns logseq.outliner.op.construct-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op.construct :as op-construct]))

(defn- conn-with-blocks-a-b
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "a"} {:block/title "b"}]}]}))

(defn- forward-ops
  [db tx-data outliner-ops]
  (:forward-outliner-ops
   (op-construct/derive-history-outliner-ops db db tx-data {:outliner-ops outliner-ops})))

(defn- conn-with-blocks-a-b-c
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "a"} {:block/title "b"} {:block/title "c"}]}]}))

(defn- inverse-ops
  ([db outliner-ops]
   (inverse-ops db [] {:outliner-ops outliner-ops}))
  ([db tx-data tx-meta]
   (:inverse-outliner-ops
    (op-construct/derive-history-outliner-ops db db tx-data tx-meta))))

(defn- new-block-datoms
  [e block-uuid]
  [{:e e :a :block/uuid :v block-uuid :added true}
   {:e e :a :block/title :v "s" :added true}
   {:e e :a :block/parent :v 1 :added true}])

(deftest derive-history-outliner-ops-resolves-block-maps-to-uuids-test
  (testing "a block id given as a map with only :block/uuid or only :db/id becomes the block's uuid"
    (let [conn (conn-with-blocks-a-b)
          a (db-test/find-block-by-content @conn "a")
          b (db-test/find-block-by-content @conn "b")]
      (is (= [[:move-blocks-up-down [[(:block/uuid a) (:block/uuid b)] true]]]
             (forward-ops @conn []
                          [[:move-blocks-up-down [[{:block/uuid (:block/uuid a)}
                                                   {:db/id (:db/id b)}]
                                                  true]]]))))))

(deftest derive-history-outliner-ops-save-block-marks-refs-created-in-tx-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        created-uuid (random-uuid)
        save-op (fn [refs]
                  [[:save-block [{:block/uuid (:block/uuid a)
                                  :block/title "a"
                                  :block/refs refs}
                                 {}]]])]
    (testing "a ref to a block whose uuid the tx adds ([:db/add e :block/uuid v]) is kept as a created ref"
      (is (= [created-uuid]
             (get-in (forward-ops @conn
                                  [[:db/add -1 :block/uuid created-uuid]]
                                  (save-op [{:block/uuid created-uuid :block/title "New"}]))
                     [0 1 0 op-construct/rebase-created-refs-key]))))
    (testing "without created refs the block has no created-refs key"
      (is (not (contains? (get-in (forward-ops @conn
                                               []
                                               (save-op [{:block/uuid (:block/uuid a) :block/title "a"}]))
                                  [0 1 0])
                          op-construct/rebase-created-refs-key))))))

(deftest rewrite-block-title-with-retracted-refs-restores-missing-ref-test
  (testing "a ref missing from the db is put back as a page with its title, and the title shows its name"
    (let [conn (conn-with-blocks-a-b)
          gone-uuid (random-uuid)
          block {:block/uuid (random-uuid)
                 :block/title (str "see [[" gone-uuid "]]")
                 :block/refs [[:block/uuid gone-uuid]]
                 op-construct/rebase-refs-key [{:block/uuid gone-uuid :block/title "Gone"}]}
          result (op-construct/rewrite-block-title-with-retracted-refs @conn block)]
      (is (= "see Gone" (:block/title result)))
      (is (= [["Gone" gone-uuid]]
             (map (juxt :block/title :block/uuid) (:block/refs result))))
      (is (not (contains? result op-construct/rebase-refs-key))))))

(deftest derive-history-outliner-ops-create-page-finds-created-uuid-in-tx-data-test
  (testing "from entity maps: the map with the page's title"
    (let [conn (conn-with-blocks-a-b)
          other-uuid (random-uuid)
          page-uuid (random-uuid)]
      (is (= page-uuid
             (get-in (forward-ops @conn
                                  [{:block/uuid other-uuid :block/title "Other"}
                                   {:block/uuid page-uuid :block/title "New"}]
                                  [[:create-page ["New" {}]]])
                     [0 1 1 :uuid])))))
  (testing "from datoms: the entity that adds the page's title, whatever the datom order"
    (let [conn (conn-with-blocks-a-b)
          other-uuid (random-uuid)
          page-uuid (random-uuid)]
      (is (= page-uuid
             (get-in (forward-ops @conn
                                  [{:e 1 :a :block/title :v "Other" :added true}
                                   {:e 1 :a :block/uuid :v other-uuid :added true}
                                   {:e 2 :a :block/uuid :v page-uuid :added true}
                                   {:e 2 :a :block/title :v "New" :added true}]
                                  [[:create-page ["New" {}]]])
                     [0 1 1 :uuid]))))))

(deftest derive-history-outliner-ops-delete-blocks-takes-ids-retracted-in-tx-data-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        b (db-test/find-block-by-content @conn "b")]
    (testing "from a [:db/retractEntity id] vector"
      (is (= [[:delete-blocks [[(:block/uuid a)] {}]]]
             (forward-ops @conn
                          [[:db/retractEntity (:db/id a)]]
                          [[:delete-blocks [[(:db/id b)] {}]]]))))
    (testing "from datom maps: only the entities whose :block/uuid is retracted"
      (is (= [[:delete-blocks [[(:block/uuid a)] {}]]]
             (forward-ops @conn
                          [{:e (:db/id a) :a :block/uuid :v (:block/uuid a) :added false}
                           {:e (:db/id b) :a :block/title :v "b" :added false}]
                          [[:delete-blocks [[(:db/id a)] {}]]]))))))

(deftest derive-history-outliner-ops-delete-blocks-takes-created-uuids-for-missing-lookups-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        missing-uuid (random-uuid)
        created-uuid (random-uuid)
        tx-data [[:db/add -1 :block/uuid created-uuid]]]
    (testing "every id a lookup of a missing block, as many as the uuids the tx adds: the added uuids"
      (is (= [[:delete-blocks [[created-uuid] {}]]]
             (forward-ops @conn tx-data [[:delete-blocks [[[:block/uuid missing-uuid]] {}]]]))))
    (testing "a lookup of an existing block is kept"
      (is (= [[:delete-blocks [[(:block/uuid a)] {}]]]
             (forward-ops @conn tx-data [[:delete-blocks [[[:block/uuid (:block/uuid a)]] {}]]]))))))

(deftest derive-history-outliner-ops-insert-blocks-takes-uuids-of-inserted-blocks-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        page-uuid (:block/uuid (:block/page a))
        [s1 s2 x1 x2 new-page-uuid] (repeatedly 5 random-uuid)
        insert-op (fn [source-uuid]
                    [:insert-blocks [[{:block/uuid source-uuid :block/title "s"}]
                                     (:db/id a)
                                     {:sibling? true}]])
        block-uuids (fn [ops] (mapv #(get-in % [1 0 0 :block/uuid]) ops))]
    (testing "two inserts take the inserted blocks' uuids in turn, and keep their opts"
      (let [ops (forward-ops @conn
                             (concat (new-block-datoms 100 x1) (new-block-datoms 101 x2))
                             [(insert-op s1) (insert-op s2)])]
        (is (= [x1 x2] (block-uuids ops)))
        (is (= {:sibling? true :keep-uuid? true} (get-in ops [0 1 2])))))
    (testing "a page created in the same tx is not an inserted block"
      (testing "datom maps"
        (is (= [x1]
               (block-uuids
                (forward-ops @conn
                             (concat [{:e 99 :a :block/uuid :v new-page-uuid :added true}
                                      {:e 99 :a :block/title :v "New page" :added true}]
                                     (new-block-datoms 100 x1))
                             [(insert-op s1)])))))
      (testing "entity maps"
        (is (= [x1]
               (block-uuids
                (forward-ops @conn
                             [{:block/uuid new-page-uuid :block/title "New page"}
                              {:block/uuid x1 :block/title "s" :block/parent [:block/uuid new-page-uuid]}]
                             [(insert-op s1)])))))
      (testing "[:db/add e a v] vectors"
        (is (= [x1]
               (block-uuids
                (forward-ops @conn
                             [[:db/add -1 :block/uuid new-page-uuid]
                              [:db/add -1 :block/title "New page"]
                              [:db/add -2 :block/uuid x1]
                              [:db/add -2 :block/parent [:block/uuid page-uuid]]]
                             [(insert-op s1)]))))))))

(deftest derive-history-outliner-ops-insert-blocks-replaces-empty-target-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        target (db-test/find-block-by-content @conn "b")
        target-id (:db/id target)
        target-uuid (:block/uuid target)
        page-uuid (:block/uuid (:block/page a))
        [s1 s2 x1 x2] (repeatedly 4 random-uuid)
        insert-ops (fn [tx-data source-uuids opts]
                     (forward-ops @conn tx-data
                                  [[:insert-blocks [(mapv (fn [u] {:block/uuid u :block/title "s"}) source-uuids)
                                                    target-id
                                                    opts]]]))
        insert-uuids (fn [tx-data source-uuids opts]
                       (mapv :block/uuid (get-in (insert-ops tx-data source-uuids opts) [0 1 0])))
        new-x2-vectors [[:db/add -2 :block/uuid x2]
                        [:db/add -2 :block/parent [:block/uuid page-uuid]]]
        blank-title-retracted (into [[:db/retract target-id :block/title ""]] new-x2-vectors)]
    (testing "sibling insert of 2 blocks whose tx retracts the target's blank title: the 1st block takes the target's uuid"
      (is (= [target-uuid x2] (insert-uuids blank-title-retracted [s1 s2] {:sibling? true})))
      (is (= {:sibling? true :keep-uuid? true}
             (get-in (insert-ops blank-title-retracted [s1 s2] {:sibling? true}) [0 1 2]))))
    (testing "not a sibling insert: the target is not replaced"
      (is (= [x2] (insert-uuids blank-title-retracted [s1 s2] {:sibling? false}))))
    (testing "sibling insert of 1 block without :replace-empty-target?: the target is not replaced"
      (is (= [s1] (insert-uuids [[:db/retract target-id :block/title ""]] [s1] {:sibling? true}))))
    (testing "the 1st block already has the target's uuid: replaced"
      (is (= [target-uuid x2] (insert-uuids new-x2-vectors [target-uuid s2] {:sibling? true}))))
    (testing "adding a blank title is not replacing the target"
      (is (= [x2] (insert-uuids (into [[:db/add target-id :block/title ""]] new-x2-vectors)
                                [s1 s2] {:sibling? true}))))
    (testing "sibling insert of 2 new blocks after a target that keeps its title: both get the new uuids"
      (is (= [x1 x2] (insert-uuids (concat (new-block-datoms 100 x1) (new-block-datoms 101 x2))
                                   [s1 s2] {:sibling? true}))))
    (testing "with :replace-empty-target?"
      (testing "1 block replacing the target"
        (is (= [target-uuid] (insert-uuids [[:db/retract target-id :block/title ""]] [s1]
                                           {:replace-empty-target? true}))))
      (testing "as many new blocks as source blocks: the target is kept"
        (is (= [x1 x2] (insert-uuids (concat (new-block-datoms 100 x1) (new-block-datoms 101 x2))
                                     [s1 s2] {:replace-empty-target? true}))))
      (testing "1 new block fewer than source blocks: the 1st takes the target's uuid"
        (is (= [target-uuid x2] (insert-uuids new-x2-vectors [s1 s2] {:replace-empty-target? true})))))))

(deftest derive-history-outliner-ops-move-blocks-inverse-restores-in-page-order-test
  (let [conn (conn-with-blocks-a-b-c)
        a (db-test/find-block-by-content @conn "a")
        b (db-test/find-block-by-content @conn "b")
        c (db-test/find-block-by-content @conn "c")
        restored-uuids (fn [ids]
                         (mapv #(get-in % [1 0 0])
                               (inverse-ops @conn [[:move-blocks [ids (:db/id b) {:sibling? true}]]])))]
    (testing "ids in page order"
      (is (= [(:block/uuid a) (:block/uuid c)] (restored-uuids [(:db/id a) (:db/id c)]))))
    (testing "ids in reverse page order"
      (is (= [(:block/uuid a) (:block/uuid c)] (restored-uuids [(:db/id c) (:db/id a)]))))))

(deftest derive-history-outliner-ops-move-blocks-up-down-inverse-test
  (let [conn (conn-with-blocks-a-b-c)
        [a b c] (map #(db-test/find-block-by-content @conn %) ["a" "b" "c"])
        inverse (fn [blocks up?]
                  (inverse-ops @conn [[:move-blocks-up-down [(mapv :db/id blocks) up?]]]))]
    (testing "b, c up: moving them down restores them"
      (is (= [[:move-blocks-up-down [[(:block/uuid b) (:block/uuid c)] false]]]
             (inverse [b c] true))))
    (testing "a, b up (a is the first child): restored by moves"
      (is (= [:move-blocks :move-blocks] (map first (inverse [a b] true)))))
    (testing "b, c down (c is the last child): restored by moves"
      (is (= [:move-blocks :move-blocks] (map first (inverse [b c] false)))))))

(deftest derive-history-outliner-ops-inverse-reverses-groups-of-different-sizes-test
  (testing "an indent that becomes 2 moves, then a save: the inverse is the save's, then the 2 moves'"
    (let [conn (conn-with-blocks-a-b-c)
          [a b c] (map #(db-test/find-block-by-content @conn %) ["a" "b" "c"])
          {forward :forward-outliner-ops inverse :inverse-outliner-ops}
          (op-construct/derive-history-outliner-ops
           @conn @conn
           [[(:db/id b) :block/parent (:db/id a) 1 true]
            [(:db/id c) :block/parent (:db/id a) 1 true]]
           {:outliner-ops [[:indent-outdent-blocks [[(:db/id b) (:db/id c)] true {:logical-outdenting? true}]]
                           [:save-block [{:block/uuid (:block/uuid a) :block/title "a2"} {}]]]})]
      (is (= {:logical-outdenting? true :sibling? true} (get-in forward [0 1 2])))
      (is (= [:save-block :move-blocks :move-blocks] (map first inverse)))
      (is (= [(:block/uuid b) (:block/uuid c)] (map #(get-in % [1 0 0]) (rest inverse)))))))

(deftest derive-history-outliner-ops-explicit-inverse-deletes-take-inserted-ids-test
  (testing "without a built inverse, each explicit delete takes the ids of the inserts in reverse order"
    (let [conn (conn-with-blocks-a-b)
          a (db-test/find-block-by-content @conn "a")
          [u1 u2 x y] (repeatedly 4 random-uuid)
          insert-op (fn [u] [:insert-blocks [[{:block/uuid u :block/title "s"}] (:db/id a) {:sibling? true}]])]
      (is (= [[:delete-blocks [[u2] {}]] [:delete-blocks [[u1] {}]]]
             (inverse-ops @conn []
                          {:outliner-ops [(insert-op u1) (insert-op u2)]
                           :db-sync/inverse-outliner-ops [[:delete-blocks [[x] {}]]
                                                          [:delete-blocks [[y] {}]]]}))))))

(deftest derive-history-outliner-ops-undo-picks-built-or-explicit-inverse-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        [u1 page-uuid] (repeatedly 2 random-uuid)
        tx-data [{:e 900 :a :block/uuid :v u1 :added true}
                 {:e 900 :a :block/title :v "s" :added true}]
        tx-meta {:undo? true
                 :outliner-ops [[:insert-blocks [[{:block/uuid u1 :block/title "s"}] (:db/id a) {:sibling? true}]]]
                 :db-sync/inverse-outliner-ops [[:delete-page [page-uuid {}]]]}]
    (testing "undo of an insert: the inverse built from the tx deletes only the entities whose uuid it adds"
      (is (= [[:delete-blocks [[u1] {}]]]
             (inverse-ops @conn tx-data (assoc tx-meta :outliner-op :insert-blocks)))))
    (testing "undo of a template: the explicit inverse"
      (is (= [[:delete-page [page-uuid {}]]]
             (inverse-ops @conn tx-data (assoc tx-meta :outliner-op :apply-template)))))))

(deftest derive-history-outliner-ops-rejects-stale-numeric-ids-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        stale-id 999999]
    (testing "create-page with a numeric :uuid"
      (is (thrown-with-msg? js/Error #"numeric entity ids"
                            (forward-ops @conn [] [[:create-page ["New" {:uuid stale-id}]]]))))
    (testing "insert-blocks with a numeric ref value"
      (is (thrown-with-msg? js/Error #"numeric entity ids"
                            (forward-ops @conn [] [[:insert-blocks [[{:block/uuid (random-uuid)
                                                                       :block/title "s"
                                                                       :block/tags #{stale-id}}]
                                                                     (:db/id a)
                                                                     {:sibling? true}]]]))))
    (testing "apply-template with a numeric template id"
      (is (thrown-with-msg? js/Error #"numeric entity ids"
                            (forward-ops @conn [] [[:apply-template [stale-id (:db/id a) {}]]]))))
    (testing "apply-template without a target"
      (is (thrown-with-msg? js/Error #"Invalid apply-template args"
                            (forward-ops @conn [] [[:apply-template [(:block/uuid a) nil {}]]]))))))

(deftest derive-history-outliner-ops-forward-op-shapes-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        page-uuid (random-uuid)]
    (testing "create-page keeps its opts and adds the created uuid"
      (is (= [[:create-page ["New" {:class? true :uuid page-uuid}]]]
             (forward-ops @conn [{:block/uuid page-uuid :block/title "New"}]
                          [[:create-page ["New" {:class? true}]]]))))
    (testing "a single op entry instead of a list of them"
      (is (= [[:move-blocks-up-down [[(:block/uuid a)] true]]]
             (forward-ops @conn [] [:move-blocks-up-down [[(:db/id a)] true]]))))
    (testing "a block id that is no uuid, lookup or entity id is left as it is"
      (is (= [[:set-block-property [{:db/id (:db/id a)} :logseq.property/status "x"]]]
             (forward-ops @conn [] [[:set-block-property [{:db/id (:db/id a)} :logseq.property/status "x"]]]))))
    (testing "a property id that is no ident or entity id, such as a lookup, is left as it is"
      (let [status-lookup [:block/uuid (:block/uuid (d/entity @conn :logseq.property/status))]]
        (is (= [[:remove-block-property [(:block/uuid a) status-lookup]]]
               (forward-ops @conn [] [[:remove-block-property [(:block/uuid a) status-lookup]]])))))))

(deftest derive-history-outliner-ops-inverse-needs-every-block-and-a-target-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        b (db-test/find-block-by-content @conn "b")
        page-uuid (:block/uuid (:block/page a))
        missing-uuid (random-uuid)]
    (testing "delete-blocks with an id that is not in the db"
      (is (nil? (inverse-ops @conn [[:delete-blocks [[(:block/uuid a) missing-uuid] {}]]]))))
    (testing "move-blocks with an id that is not in the db"
      (is (nil? (inverse-ops @conn [[:move-blocks [[(:block/uuid a) missing-uuid] (:db/id b) {:sibling? true}]]]))))
    (testing "delete-blocks of an entity with no parent or page to put it back in"
      (is (nil? (inverse-ops @conn [[:delete-blocks [[page-uuid] {}]]]))))
    (testing "move-blocks of an entity with no parent or page to move it back to"
      (is (nil? (inverse-ops @conn [[:move-blocks [[page-uuid] (:db/id b) {:sibling? true}]]]))))))

(deftest derive-history-outliner-ops-delete-inverse-defers-refs-to-later-blocks-test
  (testing "a ref to a block restored by a later insert is set after it; the other refs stay in the insert"
    (let [conn (conn-with-blocks-a-b-c)
          [a b c] (map #(db-test/find-block-by-content @conn %) ["a" "b" "c"])
          _ (d/transact! conn [[:db/add (:db/id a) :block/refs (:db/id b)]
                               [:db/add (:db/id a) :block/refs (:db/id c)]])
          inverse (inverse-ops @conn [[:delete-blocks [[(:db/id a) (:db/id c)] {}]]])]
      (is (= #{[:block/uuid (:block/uuid b)]} (get-in inverse [0 1 0 0 :block/refs])))
      (is (= [:save-block [{:block/uuid (:block/uuid a) :block/refs #{[:block/uuid (:block/uuid c)]}} {}]]
             (last inverse))))))
