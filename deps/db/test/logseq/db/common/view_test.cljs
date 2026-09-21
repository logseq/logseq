(ns logseq.db.common.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn feature-type & {:keys [view-for-id]}]
  (let [tx (d/transact! conn [(cond-> {:db/id -100
                                       :block/title "Test view"
                                       :block/uuid (random-uuid)
                                       :logseq.property.view/feature-type feature-type
                                       :logseq.property.view/type :logseq.property.view/type.table}
                                view-for-id
                                (assoc :logseq.property/view-for view-for-id))])]
    (get-in tx [:tempids -100])))

(defn- result-titles
  [conn result]
  (mapv (fn [id] (:block/title (d/entity @conn id))) (:data result)))

(deftest get-view-data-journals-returns-ordered-compact-index-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               (mapv (fn [journal-day]
                       {:page {:build/journal journal-day}
                        :blocks [{:block/title (str "Block " journal-day)}]})
                     [20260716 20260715 20260714 20260713 20260712])})
        result (db-view/get-view-data @conn nil {:journals? true})
        index (:data result)]
    (is (= 5 (:count result)))
    (is (= [20260716 20260715 20260714 20260713 20260712]
           (mapv :block/journal-day index)))
    (is (every? map? index))
    (when (every? map? index)
      (is (every? #(= #{:db/id :block/journal-day} (set (keys %))) index)
          "The journal index should include only the identity and placeholder title data."))
    (is (not (contains? result :selection-block-ids))
        "Blocks are loaded only for visible journals.")))

(deftest get-view-data-all-pages-sorts-and-filters-hidden-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Alpha" :block/updated-at 10}}
                {:page {:block/title "Beta" :block/updated-at 20}}
                {:page {:block/title "Hidden" :block/updated-at 30 :logseq.property/hide? true}}
                {:page {:block/title "Deleted" :block/updated-at 40 :logseq.property/deleted-at 1}}]})
        view-id (create-view-id conn :all-pages)
        result (db-view/get-view-data @conn view-id {:view-feature-type :all-pages
                                                     :sorting [{:id :block/updated-at :asc? false}]})
        ids (:data result)
        titles (map (fn [id] (:block/title (d/entity @conn id))) ids)]
    (is (= 2 (:count result)))
    (is (= ["Beta" "Alpha"] titles))))

(deftest journal-window-excludes-future-journals-with-aliases-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:build/journal 20240101}}
                                  {:page {:build/journal 29990101}}
                                  {:page {:block/title "Alias target"}}]})
        future-id (:e (first (d/datoms @conn :avet :block/journal-day 29990101)))
        alias-id (:db/id (db-test/find-page-by-title @conn "Alias target"))]
    (d/transact! conn [[:db/add future-id :block/alias alias-id]])
    (doseq [options [{:journals? true} {:journals? true :row-limit 26}]]
      (let [result (db-view/get-view-data @conn nil options)]
        (is (= 1 (:count result)))
        (is (= [20240101] (mapv :block/journal-day (:data result))))))))

(deftest small-class-window-does-not-scan-unrelated-sort-values-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Tagged" :build/tags [:Topic]}}
                {:page {:block/title "Unrelated"}
                 :blocks (mapv (fn [i] {:block/title (str "Unrelated " i)}) (range 1000))}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        scanned (atom 0)
        instrument (fn [scan]
                     (fn [db index & components]
                       (let [datoms (apply scan db index components)]
                         (if (and (= :avet index) (= :block/updated-at (first components)))
                           (map (fn [datom] (swap! scanned inc) datom) datoms)
                           datoms))))
        result (with-redefs [d/datoms (instrument d/datoms)
                             d/rseek-datoms (instrument d/rseek-datoms)]
                 (db-view/get-view-data @conn view-id
                                       {:view-feature-type :class-objects
                                        :view-for-id class-id
                                        :sorting [{:id :block/updated-at :asc? false}]
                                        :row-limit 26}))]
    (is (= 1 (:count result)))
    (is (= ["Tagged"] (mapv #(:block/title (d/entity @conn %)) (:data result))))
    (is (< @scanned 26) "A class that fits its window must not scan unrelated rows.")))

(deftest get-view-data-all-pages-title-sort-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "gamma" :block/updated-at 1}}
                {:page {:block/title "alpha" :block/updated-at 2}}
                {:page {:block/title "beta" :block/updated-at 3}}]})
        view-id (create-view-id conn :all-pages)
        result (db-view/get-view-data @conn view-id {:view-feature-type :all-pages
                                                     :sorting [{:id :block/title :asc? true}]})
        ids (:data result)
        titles (map (fn [id] (:block/title (d/entity @conn id))) ids)]
    (is (= ["alpha" "beta" "gamma"] titles))))

(deftest get-view-data-all-pages-row-limit-keeps-full-count-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "alpha" :block/updated-at 1}}
                {:page {:block/title "beta" :block/updated-at 2}}
                {:page {:block/title "gamma" :block/updated-at 3}}]})
        view-id (create-view-id conn :all-pages)
        result (db-view/get-view-data @conn view-id {:view-feature-type :all-pages
                                                     :sorting [{:id :block/title :asc? true}]
                                                     :row-limit 2})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 3 (:count result)))
    (is (= ["alpha" "beta"] titles))))

(deftest get-view-data-class-objects-row-limit-keeps-full-count-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :block/updated-at 10 :build/tags [:Topic]}}
                {:page {:block/title "B" :block/updated-at 20 :build/tags [:Topic]}}
                {:page {:block/title "C" :block/updated-at 30 :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :block/title :asc? true}]
                                                     :row-limit 2})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 3 (:count result)))
    (is (= ["A" "B"] titles))))

(deftest get-view-data-all-pages-row-offset-returns-the-scrolled-window-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "alpha" :block/updated-at 1}}
                {:page {:block/title "beta" :block/updated-at 2}}
                {:page {:block/title "gamma" :block/updated-at 3}}
                {:page {:block/title "delta" :block/updated-at 4}}]})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/title :asc? true}]}
        full (db-view/get-view-data @conn view-id option)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 2 :row-offset 1))
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data window))]
    (is (= 4 (:count window) (:count full)))
    (is (= ["beta" "delta"] titles)
        "row-offset drops the first window and takes the next screen.")
    (is (= (subvec (vec (:data full)) 1 3) (:data window)))))

(deftest get-view-data-class-objects-row-offset-returns-the-scrolled-window-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :block/updated-at 10 :build/tags [:Topic]}}
                {:page {:block/title "B" :block/updated-at 20 :build/tags [:Topic]}}
                {:page {:block/title "C" :block/updated-at 30 :build/tags [:Topic]}}
                {:page {:block/title "D" :block/updated-at 40 :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/title :asc? true}]}
        full (db-view/get-view-data @conn view-id option)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 2 :row-offset 2))
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data window))]
    (is (= 4 (:count window) (:count full)))
    (is (= ["C" "D"] titles))
    (is (= (subvec (vec (:data full)) 2 4) (:data window)))
    (with-redefs [db-class/get-class-object-ids
                  (fn [& _args]
                    (throw (js/Error. "offset window must not walk hidden ancestors")))]
      (is (= ["C" "D"]
             (map (fn [id] (:block/title (d/entity @conn id)))
                  (:data (db-view/get-view-data
                          @conn view-id (assoc option :row-limit 2 :row-offset 2)))))
          "Scroll uses the tag-index first-window path, not leftover get-class-object-ids."))))

(deftest get-view-data-class-objects-id-path-stays-bounded-with-many-rows-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Topic " idx)
                              :block/updated-at idx
                              :build/tags [:Topic]}})
                    (range 400))
        conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks pages})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/title :asc? true}]}
        entity-path-calls (atom 0)
        window (with-redefs [db-class/get-class-objects
                             (fn [& _args]
                               (swap! entity-path-calls inc)
                               (throw (js/Error. "class-objects must use the id-only path")))]
                 (db-view/get-view-data @conn view-id (assoc option :row-limit 30)))
        full (with-redefs [db-class/get-class-objects
                           (fn [& _args]
                             (swap! entity-path-calls inc)
                             (throw (js/Error. "class-objects must use the id-only path")))]
               (db-view/get-view-data @conn view-id option))]
    (is (zero? @entity-path-calls)
        "Unfiltered Tags/class-objects queries must not hydrate every object entity.")
    (is (= 400 (:count window) (:count full)))
    (is (= 30 (count (:data window)))
        "The first window must not wait for the remaining ids.")
    (is (= 400 (count (:data full))))
    (is (= (take 30 (:data full)) (:data window)))
    (is (every? integer? (:data window)))
    (is (every? integer? (:data full)))))

(defn- first-window-without-row-hydration
  [conn view-id option]
  (let [entity* d/entity
        entity-calls (atom 0)
        started (js/Date.now)
        result (with-redefs [db-class/get-class-objects
                             (fn [& _args]
                               (throw (js/Error. "first window must not hydrate class objects")))
                             entity-plus/unsafe->Entity
                             (fn [& _args]
                               (throw (js/Error. "first window must not build row entities to sort")))
                             d/entity
                             (fn [db x]
                               (swap! entity-calls inc)
                               (entity* db x))]
                 (db-view/get-view-data @conn view-id option))]
    {:result result
     :entity-calls @entity-calls
     :elapsed-ms (- (js/Date.now) started)}))

(deftest get-view-data-class-objects-first-window-is-instant-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Topic " idx)
                              :block/updated-at idx
                              :build/tags [:Topic]}})
                    (range 400))
        conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks pages})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        {:keys [result entity-calls elapsed-ms]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :block/title :asc? true}]
                       :row-limit 30})]
    (is (<= entity-calls 3)
        "Opening Tags must not hydrate one entity per object.")
    (is (= 400 (:count result)))
    (is (= 30 (count (:data result)))
        "The first paint uses only the first window of ids.")
    (is (every? integer? (:data result)))
    (is (< elapsed-ms 400)
        (str "First-window Tags query must stay cheap enough to paint immediately, took "
             elapsed-ms "ms"))))

(deftest get-view-data-all-pages-first-window-count-matches-hidden-filter-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Alpha" :block/updated-at 10}}
                {:page {:block/title "Beta" :block/updated-at 20}}
                {:page {:block/title "Hidden" :block/updated-at 30 :logseq.property/hide? true}}
                {:page {:block/title "Deleted" :block/updated-at 40 :logseq.property/deleted-at 1}}]})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/updated-at :asc? false}]}
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 10))
        full (db-view/get-view-data @conn view-id option)]
    (is (= (:count full) (:count window)))
    (is (= 2 (:count window)))
    (is (= (take 10 (:data full)) (:data window)))))

(deftest get-view-data-all-pages-count-drops-after-delete-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Alpha" :block/updated-at 10}}
                {:page {:block/title "Beta" :block/updated-at 20}}
                {:page {:block/title "Gamma" :block/updated-at 30}}]})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/updated-at :asc? false}]}
        before (db-view/get-view-data @conn view-id (assoc option :row-limit 10))
        gamma (db-test/find-page-by-title @conn "Gamma")
        _ (d/transact! conn [{:db/id (:db/id gamma)
                              :logseq.property/deleted-at 1}])
        after (db-view/get-view-data @conn view-id (assoc option :row-limit 10))]
    (is (= 3 (:count before)))
    (is (= ["Gamma" "Beta" "Alpha"] (result-titles conn before)))
    (is (= 2 (:count after))
        "Deleting a page must shrink All Pages. A leftover estimate left empty rows.")
    (is (= ["Beta" "Alpha"] (result-titles conn after)))
    (is (= (:count after) (count (:data after))))))

(deftest get-view-data-all-pages-filter-count-matches-rows-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "alpha" :block/updated-at 1}}
                {:page {:block/title "alpine" :block/updated-at 2}}
                {:page {:block/title "beta" :block/updated-at 3}}]})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/title :asc? true}]}
        unfiltered (db-view/get-view-data @conn view-id (assoc option :row-limit 10))
        filtered (db-view/get-view-data
                  @conn view-id
                  (assoc option
                         :row-limit 10
                         :filters {:or? false
                                   :filters [[:block/title :text-contains "alp"]]}))]
    (is (= 3 (:count unfiltered)))
    (is (= 2 (:count filtered) (count (:data filtered)))
        "A title filter must not keep the unfiltered All Pages count.")
    (is (= ["alpha" "alpine"] (result-titles conn filtered)))))

(deftest get-view-data-all-pages-first-window-is-instant-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Page " idx)
                              :block/updated-at idx}})
                    (range 200))
        conn (db-test/create-conn-with-blocks {:pages-and-blocks pages})
        view-id (create-view-id conn :all-pages)
        {:keys [result entity-calls elapsed-ms]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :all-pages
                       :sorting [{:id :block/updated-at :asc? false}]
                       :row-limit 30})]
    (is (<= entity-calls 3)
        "Opening All Pages must not hydrate one entity per page.")
    (is (= 200 (:count result)))
    (is (= 30 (count (:data result))))
    (is (every? integer? (:data result)))
    (is (< elapsed-ms 400)
        (str "First-window All Pages query must stay cheap enough to paint immediately, took "
             elapsed-ms "ms"))))

(deftest get-view-data-class-objects-small-set-sorts-the-eids-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Tag " idx)
                              :block/updated-at idx
                              :build/tags [:Topic]}})
                    (range 21))
        conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks pages})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/updated-at :asc? false}]}
        started (js/Date.now)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 26))
        elapsed-ms (- (js/Date.now) started)
        full (db-view/get-view-data @conn view-id option)]
    (is (= 21 (:count window) (:count full)))
    (is (= 21 (count (:data window))))
    (is (= (:data full) (:data window))
        "A leftover set that already fits the window must sort those eids, not the AVET index.")
    (is (< elapsed-ms 50)
        (str "21 Tags must not copy the updated-at index, took " elapsed-ms "ms"))))

(deftest get-view-data-all-pages-first-window-does-not-sort-every-page-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Page " idx)
                              :block/updated-at idx}})
                    (range 2500))
        conn (db-test/create-conn-with-blocks {:pages-and-blocks pages})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/updated-at :asc? false}]}
        started (js/Date.now)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 30))
        elapsed-ms (- (js/Date.now) started)
        full (db-view/get-view-data @conn view-id option)]
    (is (= 2500 (:count window) (:count full)))
    (is (= 30 (count (:data window))))
    (is (= (take 30 (:data full)) (:data window))
        "AVET top-N must match a full updated-at sort.")
    (is (< elapsed-ms 150)
        (str "A 2500-page first window must not sort every page, took "
             elapsed-ms "ms"))))

(deftest get-view-data-class-objects-first-window-filters-hidden-objects-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Parent {:block/title "Parent"}
                         :Child {:block/title "Child"
                                 :build/class-extends [:Parent]}}
               :pages-and-blocks [{:page {:block/title "Visible"
                                          :block/updated-at 10
                                          :build/tags [:Child]}}
                                  {:page {:block/title "Deleted"
                                          :block/updated-at 20
                                          :build/tags [:Child]
                                          :logseq.property/deleted-at 1}}
                                  {:page {:block/title "Hidden"
                                          :block/updated-at 30
                                          :build/tags [:Child]
                                          :logseq.property/hide? true}}
                                  {:page {:block/title "Hidden parent"
                                          :logseq.property/hide? true}
                                   :blocks [{:block/title "Nested hidden"
                                             :block/updated-at 40
                                             :build/tags [:Child]}]}
                                  {:page {:block/title "Visible parent"}
                                   :blocks [{:block/title "Nested visible"
                                             :block/updated-at 50
                                             :build/tags [:Child]}]}]})
        class-id (:db/id (d/entity @conn :user.class/Parent))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/updated-at :asc? false}]}
        full (db-view/get-view-data @conn view-id option)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 10))]
    (is (= (:count full) (:count window)))
    (is (= #{"Visible" "Nested visible"} (set (result-titles conn window))))
    (is (= (:data full) (:data window))
        "First-window class objects must use the same hidden/deleted contract as the full path.")))

(defn- topic-conn
  [pages & {:keys [properties]}]
  (db-test/create-conn-with-blocks
   (cond-> {:classes {:Topic {:block/title "Topic"}}
            :pages-and-blocks pages}
     properties
     (assoc :properties properties))))

(deftest get-view-data-class-objects-number-property-sort-test
  (let [conn (topic-conn
              [{:page {:block/title "A" :build/tags [:Topic]
                       :build/properties {:user.property/score 2}}}
               {:page {:block/title "B" :build/tags [:Topic]
                       :build/properties {:user.property/score 10}}}
               {:page {:block/title "C" :build/tags [:Topic]
                       :build/properties {:user.property/score 1}}}]
              :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id}
        asc (db-view/get-view-data @conn view-id (assoc option :sorting [{:id :user.property/score :asc? true}]))
        desc (db-view/get-view-data @conn view-id (assoc option :sorting [{:id :user.property/score :asc? false}]))
        window (first-window-without-row-hydration
                conn view-id (assoc option
                                    :sorting [{:id :user.property/score :asc? true}]
                                    :row-limit 2))]
    (is (= ["C" "A" "B"] (result-titles conn asc)))
    (is (= ["B" "A" "C"] (result-titles conn desc)))
    (is (= 3 (:count (:result window))))
    (is (= ["C" "A"] (result-titles conn (:result window))))
    (is (<= (:entity-calls window) 3)
        "Custom property sort must stay on the id-only path.")))

(deftest get-view-data-class-objects-number-sort-first-window-is-instant-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Topic " idx)
                              :block/updated-at idx
                              :build/tags [:Topic]
                              :build/properties {:user.property/score idx}}})
                    (range 200))
        conn (topic-conn pages :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        {:keys [result entity-calls elapsed-ms]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :user.property/score :asc? false}]
                       :row-limit 30})]
    (is (<= entity-calls 3))
    (is (= 200 (:count result)))
    (is (= 30 (count (:data result))))
    (is (= (mapv #(str "Topic " %) (range 199 169 -1))
           (result-titles conn result)))
    (is (< elapsed-ms 400)
        (str "Sorted first window must stay cheap, took " elapsed-ms "ms"))))

(deftest get-view-data-class-objects-title-is-filter-uses-id-path-test
  (let [conn (topic-conn
              [{:page {:block/title "A" :build/tags [:Topic]}}
               {:page {:block/title "B" :build/tags [:Topic]}}
               {:page {:block/title "C" :build/tags [:Topic]}}])
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        {:keys [result entity-calls]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :block/title :asc? true}]
                       :filters {:or? false
                                 :filters [[:block/title :is #{"B"}]]}})]
    (is (<= entity-calls 3)
        "A title :is filter must not hydrate every object.")
    (is (= ["B"] (result-titles conn result)))
    (is (= 1 (:count result)))))

(deftest get-view-data-class-objects-title-is-not-and-empty-filter-test
  (let [conn (topic-conn
              [{:page {:block/title "A" :build/tags [:Topic]}}
               {:page {:block/title "B" :build/tags [:Topic]}}
               {:page {:block/title "C" :build/tags [:Topic]}}])
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/title :asc? true}]}
        is-not (db-view/get-view-data @conn view-id (assoc option :filters {:or? false
                                                                           :filters [[:block/title :is-not #{"B"}]]}))
        empty-result (db-view/get-view-data @conn view-id (assoc option :filters {:or? false
                                                                                 :filters [[:block/title :is :empty]]}))]
    (is (= ["A" "C"] (result-titles conn is-not)))
    (is (= [] (result-titles conn empty-result)))))

(deftest get-view-data-class-objects-text-contains-and-input-filter-test
  (let [conn (topic-conn
              [{:page {:block/title "Alpha" :build/tags [:Topic]}}
               {:page {:block/title "Alpine" :build/tags [:Topic]}}
               {:page {:block/title "Beta" :build/tags [:Topic]}}])
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/title :asc? true}]}
        contains (first-window-without-row-hydration
                  conn view-id (assoc option :filters {:or? false
                                                       :filters [[:block/title :text-contains "alp"]]}))
        input (first-window-without-row-hydration
               conn view-id (assoc option :input "be"))]
    (is (<= (:entity-calls contains) 3))
    (is (= ["Alpha" "Alpine"] (result-titles conn (:result contains))))
    (is (<= (:entity-calls input) 3))
    (is (= ["Beta"] (result-titles conn (:result input))))))

(deftest get-view-data-class-objects-number-filter-and-sort-test
  (let [conn (topic-conn
              [{:page {:block/title "A" :build/tags [:Topic]
                       :build/properties {:user.property/score 2}}}
               {:page {:block/title "B" :build/tags [:Topic]
                       :build/properties {:user.property/score 10}}}
               {:page {:block/title "C" :build/tags [:Topic]
                       :build/properties {:user.property/score 1}}}
               {:page {:block/title "D" :build/tags [:Topic]
                       :build/properties {:user.property/score 7}}}]
              :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :user.property/score :asc? true}]}
        gt (db-view/get-view-data @conn view-id (assoc option :filters {:or? false
                                                                        :filters [[:user.property/score :number-gt 2]]}))
        between (db-view/get-view-data @conn view-id (assoc option :filters {:or? false
                                                                            :filters [[:user.property/score :between [2 7]]]}))
        window (first-window-without-row-hydration
                conn view-id (assoc option
                                    :filters {:or? false
                                              :filters [[:user.property/score :number-gt 2]]}
                                    :row-limit 1))]
    (is (= ["D" "B"] (result-titles conn gt)))
    (is (= ["A" "D"] (result-titles conn between)))
    (is (= 2 (:count (:result window))))
    (is (= ["D"] (result-titles conn (:result window))))
    (is (<= (:entity-calls window) 3))))

(deftest get-view-data-class-objects-or-and-and-filters-test
  (let [conn (topic-conn
              [{:page {:block/title "A" :build/tags [:Topic]
                       :build/properties {:user.property/score 1}}}
               {:page {:block/title "B" :build/tags [:Topic]
                       :build/properties {:user.property/score 5}}}
               {:page {:block/title "C" :build/tags [:Topic]
                       :build/properties {:user.property/score 9}}}]
              :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/title :asc? true}]}
        or-result (db-view/get-view-data @conn view-id (assoc option :filters {:or? true
                                                                              :filters [[:block/title :is #{"A"}]
                                                                                        [:user.property/score :number-gt 5]]}))
        and-result (db-view/get-view-data @conn view-id (assoc option :filters {:or? false
                                                                               :filters [[:block/title :text-contains "B"]
                                                                                         [:user.property/score :number-gte 5]]}))]
    (is (= ["A" "C"] (result-titles conn or-result)))
    (is (= ["B"] (result-titles conn and-result)))))

(deftest get-view-data-class-objects-ref-filter-first-window-is-instant-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Page " idx)}
                       :blocks [{:block/title (str "Obj " idx)
                                 :build/tags [:Topic]}]})
                    (range 80))
        conn (topic-conn pages)
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        page-0-uuid (:block/uuid (d/entity @conn (d/q '[:find ?e .
                                                        :in $ ?title
                                                        :where [?e :block/title ?title]]
                                                      @conn
                                                      "Page 0")))
        {:keys [result entity-calls elapsed-ms]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :block/title :asc? true}]
                       :filters {:or? false
                                 :filters [[:block/page :is #{page-0-uuid}]]}})]
    (is (<= entity-calls 5)
        "A ref :is filter must resolve match ids once, not hydrate every object.")
    (is (= ["Obj 0"] (result-titles conn result)))
    (is (< elapsed-ms 400)
        (str "Filtered first window must stay cheap, took " elapsed-ms "ms"))))

(deftest get-view-data-class-objects-combined-sort-filter-input-first-window-test
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str (if (even? idx) "Keep " "Skip ") idx)
                              :block/updated-at idx
                              :build/tags [:Topic]
                              :build/properties {:user.property/score idx}}})
                    (range 120))
        conn (topic-conn pages :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        {:keys [result entity-calls elapsed-ms]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :user.property/score :asc? false}]
                       :filters {:or? false
                                 :filters [[:user.property/score :number-gte 40]]}
                       :input "Keep"
                       :row-limit 10})]
    (is (<= entity-calls 3)
        "Combined sort, filter, and search must stay on the id-only path.")
    (is (= 40 (:count result))
        "Keep even scores from 40 to 118 inclusive.")
    (is (= (mapv #(str "Keep " %) [118 116 114 112 110 108 106 104 102 100])
           (result-titles conn result)))
    (is (< elapsed-ms 400)
        (str "Combined first window must stay cheap, took " elapsed-ms "ms"))))

(deftest get-view-data-class-objects-missing-custom-sort-value-stays-last-test
  (let [conn (topic-conn
              [{:page {:block/title "With score" :build/tags [:Topic]
                       :build/properties {:user.property/score 3}}}
               {:page {:block/title "Without score" :build/tags [:Topic]}}]
              :properties {:user.property/score {:logseq.property/type :number}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :user.property/score :asc? false}]})]
    (is (= ["With score" "Without score"] (result-titles conn result)))))

(deftest get-view-data-class-objects-status-closed-value-sort-test
  (let [conn (topic-conn
              [{:page {:block/title "Doing" :build/tags [:Topic]
                       :build/properties {:logseq.property/status :logseq.property/status.doing}}}
               {:page {:block/title "Todo" :build/tags [:Topic]
                       :build/properties {:logseq.property/status :logseq.property/status.todo}}}
               {:page {:block/title "Done" :build/tags [:Topic]
                       :build/properties {:logseq.property/status :logseq.property/status.done}}}])
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :logseq.property/status :asc? true}]})
        orders (mapv (fn [id]
                       (:block/order (:logseq.property/status (d/entity @conn id))))
                     (:data result))]
    (is (= 3 (:count result)))
    (is (= (sort orders) orders)
        "Closed-value sort must follow :block/order, not title.")
    (is (= (set (result-titles conn result)) #{"Doing" "Todo" "Done"}))))

(deftest get-view-data-all-pages-title-filter-and-sort-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "alpha" :block/updated-at 1}}
                {:page {:block/title "alpine" :block/updated-at 2}}
                {:page {:block/title "beta" :block/updated-at 3}}]})
        view-id (create-view-id conn :all-pages)
        {:keys [result entity-calls]}
        (first-window-without-row-hydration
         conn view-id {:view-feature-type :all-pages
                       :sorting [{:id :block/title :asc? false}]
                       :filters {:or? false
                                 :filters [[:block/title :text-contains "alp"]]}})]
    (is (<= entity-calls 3))
    (is (= ["alpine" "alpha"] (result-titles conn result)))))

(deftest get-view-data-class-objects-sort-keeps-rows-with-missing-sort-value-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "With timestamp"
                        :block/updated-at 20
                        :build/tags [:Topic]}}
                {:page {:block/title "Without timestamp"
                        :block/updated-at 10
                        :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        without-ts-id (d/q '[:find ?e .
                             :in $ ?title
                             :where [?e :block/title ?title]]
                           @conn
                           "Without timestamp")
        without-ts-value (:block/updated-at (d/entity @conn without-ts-id))
        _ (d/transact! conn [[:db/retract without-ts-id :block/updated-at without-ts-value]])
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :block/updated-at :asc? false}]})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 2 (:count result)))
    (is (= #{"With timestamp" "Without timestamp"} (set titles)))))

(deftest get-view-data-class-objects-row-offset-keeps-missing-sort-value-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "With timestamp 1"
                        :block/updated-at 10
                        :build/tags [:Topic]}}
                {:page {:block/title "With timestamp 2"
                        :block/updated-at 20
                        :build/tags [:Topic]}}
                {:page {:block/title "Without timestamp"
                        :block/updated-at 1
                        :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        without-ts-id (d/q '[:find ?e .
                             :in $ ?title
                             :where [?e :block/title ?title]]
                           @conn
                           "Without timestamp")
        without-ts-value (:block/updated-at (d/entity @conn without-ts-id))
        _ (d/transact! conn [[:db/retract without-ts-id :block/updated-at without-ts-value]])
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/updated-at :asc? false}]}
        full (db-view/get-view-data @conn view-id option)
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 2 :row-offset 2))]
    (is (= ["With timestamp 2" "With timestamp 1" "Without timestamp"]
           (result-titles conn full)))
    (is (= 3 (:count window)))
    (is (= ["Without timestamp"] (result-titles conn window)))
    (is (= (subvec (vec (:data full)) 2 3) (:data window)))))

(deftest get-view-data-class-objects-simple-is-filter-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]}}
                {:page {:block/title "B" :build/tags [:Topic]}}
                {:page {:block/title "C" :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :filters {:or? false
                                                               :filters [[:block/title :is #{"B"}]]}})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 1 (:count result)))
    (is (= ["B"] titles))))

(deftest get-view-data-class-objects-groups-by-title-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]}}
                {:page {:block/title "B" :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :block/title]])
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id})
        group-titles (map first (:data result))]
    (is (= ["B" "A"] group-titles))))

(deftest get-view-data-class-objects-groups-by-many-values-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}
                         :SciFi {:block/title "Sci-Fi"}
                         :Drama {:block/title "Drama"}}
               :pages-and-blocks
               [{:page {:block/title "Movie A" :build/tags [:Topic :SciFi :Drama]}}
                {:page {:block/title "Movie B" :build/tags [:Topic :SciFi]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :block/tags]])
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id})
        group->titles (into {}
                            (map (fn [[group rows]]
                                   [(:block/title group)
                                    (set (map (fn [id] (:block/title (d/entity @conn id))) rows))]))
                            (:data result))]
    (is (= #{"Movie A" "Movie B"} (get group->titles "Sci-Fi")))
    (is (= #{"Movie A"} (get group->titles "Drama")))))

(deftest get-view-data-all-pages-groups-by-context-tags-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}
                         :Project {:block/title "Project"}}
               :pages-and-blocks
               [{:page {:block/title "Alpha" :build/tags [:Topic]}}
                {:page {:block/title "Beta" :build/tags [:Topic]}}
                {:page {:block/title "Gamma" :build/tags [:Project]}}]})
        view-id (create-view-id conn :all-pages)
        option {:view-feature-type :all-pages
                :group-by-property-ident :block/tags}
        result (db-view/get-view-data @conn view-id option)
        group->titles (fn [result]
                        (into {}
                              (map (fn [[group rows]]
                                     [(:block/title group)
                                      (set (map (fn [id]
                                                  (:block/title (d/entity @conn id)))
                                                rows))]))
                              (:data result)))]
    (is (= #{"Alpha" "Beta"} (get (group->titles result) "Topic"))
        "A context-only Tags group must sort by readable tag values, not compare raw entity maps.")
    (is (= #{"Gamma"} (get (group->titles result) "Project")))
    (is (= ["Topic" "Project"]
           (filter #{"Project" "Topic"}
                   (mapv (fn [[group _rows]] (:block/title group))
                         (:data result))))
        "Groups sort descending by default because sort-groups-desc? defaults to true.")
    (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? false]])
    (is (= ["Project" "Topic"]
           (filter #{"Project" "Topic"}
                   (mapv (fn [[group _rows]] (:block/title group))
                         (:data (db-view/get-view-data @conn view-id option)))))
        "Ascending group order must use readable tag-title order.")))

(deftest get-view-data-group-sort-ref-values-use-readable-keys-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}
                         :Project {:block/title "Project"}
                         :Item {:block/title "Item"}}
               :pages-and-blocks
               [{:page {:block/title "Alpha" :build/tags [:Topic]}
                 :blocks [{:block/title "Alpha item"
                           :build/tags [:Item]}]}
                {:page {:block/title "Beta" :build/tags [:Project]}
                 :blocks [{:block/title "Beta item"
                           :build/tags [:Item]}]}]})
        class-id (:db/id (d/entity @conn :user.class/Item))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        page-property (:db/id (d/entity @conn :block/page))
        tags-property (:db/id (d/entity @conn :block/tags))
        _ (d/transact! conn [[:db/add view-id
                              :logseq.property.view/group-by-property
                              page-property]
                             [:db/add view-id
                              :logseq.property.view/sort-groups-by-property
                              tags-property]])
        result (db-view/get-view-data @conn view-id
                                      {:view-feature-type :class-objects
                                       :view-for-id class-id})]
    (is (= ["Alpha" "Beta"]
           (mapv (fn [[group _rows]] (:block/title group))
                 (:data result)))
        "Ref-valued group sort keys must be rendered to scalar keys before compare.")))

(deftest get-view-data-list-view-keeps-one-row-shape-for-pages-and-blocks-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Tagged page"
                        :build/tags [:Topic]}}
                {:page {:block/title "Block page"}
                 :blocks [{:block/title "Tagged block"
                           :build/tags [:Topic]}]}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id
                              :logseq.property.view/group-by-property
                              :block/page]
                             [:db/add view-id
                              :logseq.property.view/type
                              :logseq.property.view/type.list]])
        result (db-view/get-view-data @conn view-id
                                      {:view-feature-type :class-objects
                                       :view-for-id class-id})]
    (is (= 2 (:count result)))
    (is (every? (fn [[_group partitions]]
                  (every? (fn [[breadcrumb-uuid rows]]
                            (and (uuid? breadcrumb-uuid)
                                 (sequential? rows)
                                 (every? map? rows)))
                          partitions))
                (:data result))
        "A list view must not mix flat row IDs with nested partitions.")))

(deftest get-view-data-linked-references-page-view-does-not-crash-on-missing-db-ident-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Foo"}}
                {:page {:block/title "Bar"}}]})
        foo-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Foo")
        bar-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Bar")
        _ (d/transact! conn [[:db/add bar-id :block/refs foo-id]])
        view-id (create-view-id conn :linked-references :view-for-id foo-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :linked-references
                                                     :view-for-id foo-id})]
    (is (number? (:count result)))
    (is (contains? (set (:data result)) bar-id))))

(deftest get-view-data-groups-page-level-linked-references-under-the-referring-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Target"}}
                {:page {:block/title "Referring page"}}]})
        target-id (d/q '[:find ?e .
                         :in $ ?title
                         :where [?e :block/title ?title]]
                       @conn
                       "Target")
        referring-page-id (d/q '[:find ?e .
                                 :in $ ?title
                                 :where [?e :block/title ?title]]
                               @conn
                               "Referring page")
        target (d/entity @conn target-id)
        referring-page (d/entity @conn referring-page-id)
        view-id (create-view-id conn :linked-references
                                :view-for-id (:db/id target))
        _ (d/transact! conn
                       [[:db/add (:db/id referring-page)
                         :block/refs
                         (:db/id target)]
                        [:db/add view-id
                         :logseq.property.view/type
                         :logseq.property.view/type.list]
                        [:db/add view-id
                         :logseq.property.view/group-by-property
                         :block/page]])
        result (db-view/get-view-data
                @conn view-id
                {:view-feature-type :linked-references
                 :view-for-id (:db/id target)})
        [[group partitions]] (:data result)]
    (is (= (:block/uuid referring-page) (:block/uuid group)))
    (is (= [[(:block/uuid referring-page)
             [{:db/id (:db/id referring-page)
               :block/parent nil}]]]
           (mapv (fn [[breadcrumb rows]]
                   [breadcrumb (vec rows)])
                 partitions)))))

(deftest get-view-data-class-objects-ref-filter-fast-path-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Page A"}
                        :blocks [{:block/title "Obj A"
                                  :build/tags [:Topic]}]}
                {:page {:block/title "Page B"}
                 :blocks [{:block/title "Obj B"
                           :build/tags [:Topic]}]}]})
        obj-a-id (d/q '[:find ?e .
                         :in $ ?title
                         :where [?e :block/title ?title]]
                       @conn
                       "Obj A")
        obj-b-id (d/q '[:find ?e .
                         :in $ ?title
                         :where [?e :block/title ?title]]
                       @conn
                       "Obj B")
        page-a-uuid (:block/uuid (d/entity @conn (d/q '[:find ?e .
                                                        :in $ ?title
                                                        :where [?e :block/title ?title]]
                                                      @conn
                                                      "Page A")))
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        is-result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                        :view-for-id class-id
                                                        :filters {:or? false
                                                                  :filters [[:block/page :is #{page-a-uuid}]]}})
        is-titles (map (fn [id] (:block/title (d/entity @conn id))) (:data is-result))
        is-not-result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                            :view-for-id class-id
                                                            :filters {:or? false
                                                                      :filters [[:block/page :is-not #{page-a-uuid}]]}})
        is-not-titles (set (map (fn [id] (:block/title (d/entity @conn id))) (:data is-not-result)))]
    (is (= #{"Obj A"} (set is-titles)))
    (is (= #{"Obj B"} is-not-titles))
    (is (= #{obj-a-id} (set (:data is-result))))
    (is (= #{obj-b-id} (set (:data is-not-result))))))

(deftest get-view-data-class-objects-groups-by-number-property-sorts-numerically-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :properties {:user.property/score {:logseq.property/type :number}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]
                        :build/properties {:user.property/score 2}}}
                {:page {:block/title "B" :build/tags [:Topic]
                        :build/properties {:user.property/score 10}}}
                {:page {:block/title "C" :build/tags [:Topic]
                        :build/properties {:user.property/score 1}}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :user.property/score]])
        desc-groups (map first (:data (db-view/get-view-data @conn view-id
                                                             {:view-feature-type :class-objects
                                                              :view-for-id class-id})))
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? false]])
        asc-groups (map first (:data (db-view/get-view-data @conn view-id
                                                            {:view-feature-type :class-objects
                                                             :view-for-id class-id})))]
    ;; Number groups must sort numerically (10 2 1), not lexicographically (2 10 1)
    (is (= [10 2 1] desc-groups))
    ;; Explicit ascending order must reverse the default descending order.
    (is (= [1 2 10] asc-groups))))
