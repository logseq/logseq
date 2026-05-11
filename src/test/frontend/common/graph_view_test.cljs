(ns frontend.common.graph-view-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.common.graph-view :as graph-view]
            [logseq.db.test.helper :as db-test]))

(defn- node-labels
  [result]
  (set (map :label (:nodes result))))

(defn- link-endpoints
  [result]
  (set (mapcat (juxt :source :target) (:links result))))

(defn- node-by-label
  [result label]
  (some #(when (= label (:label %)) %) (:nodes result)))

(defn- link-between-labels
  [result source-label target-label]
  (let [id-by-label (into {} (map (juxt :label :id) (:nodes result)))
        source-id (get id-by-label source-label)
        target-id (get id-by-label target-label)]
    (some #(when (and (= source-id (:source %))
                      (= target-id (:target %)))
             %)
          (:links result))))

(deftest global-graph-defaults-to-tags-and-objects
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Project"}
                 :blocks [{:block/title "task object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Plain Page"}}]
               :classes {:Topic {}}})
        result (graph-view/build-graph @conn {:type :global})
        labels (node-labels result)]
    (testing "Default global graph mode includes tag + object nodes"
      (is (contains? labels "Topic"))
      (is (contains? labels "task object")))
    (testing "Default mode excludes unrelated pages"
      (is (not (contains? labels "Plain Page"))))
    (is (= :tags-and-objects (get-in result [:meta :view-mode])))))

(deftest global-graph-can-switch-to-all-pages
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Project"}
                 :blocks [{:block/title "task object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Plain Page"}}]
               :classes {:Topic {}}})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages})
        labels (node-labels result)]
    (testing "All-pages mode includes normal pages"
      (is (contains? labels "Plain Page")))
    (is (= :all-pages (get-in result [:meta :view-mode])))))

(deftest global-all-pages-page-nodes-include-uuid
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Plain Page"}}]})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages
                                              :orphan-pages? true})
        page (ffirst (d/q '[:find (pull ?p [:block/uuid])
                            :where [?p :block/title "Plain Page"]]
                          @conn))]
    (is (= (str (:block/uuid page))
           (:uuid (node-by-label result "Plain Page"))))))

(deftest global-tags-and-objects-page-nodes-include-uuid
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Tagged Page"
                        :build/tags [:Topic]}}]
               :classes {:Topic {}}})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})
        page (ffirst (d/q '[:find (pull ?p [:block/uuid])
                            :where [?p :block/title "Tagged Page"]]
                          @conn))]
    (is (= (str (:block/uuid page))
           (:uuid (node-by-label result "Tagged Page"))))))

(deftest global-all-pages-graph-keeps-links-within-rendered-nodes
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Visible Page"}
                 :blocks [{:block/title "See [[Excluded Page]] and [[Kept Page]]"}]}
                {:page {:block/title "Excluded Page"
                        :build/properties {:logseq.property/exclude-from-graph-view true}}}
                {:page {:block/title "Kept Page"}}]})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages})
        node-ids (set (map :id (:nodes result)))]
    (is (not (contains? (node-labels result) "Excluded Page")))
    (is (contains? (node-labels result) "Kept Page"))
    (is (every? node-ids (link-endpoints result)))))

(deftest global-all-pages-graph-excludes-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:rating {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Normal Page"}}
                {:page {:block/title "rating"
                        :block/tags #{:logseq.class/Property}
                        :db/ident :user.property/rating}}]})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages
                                              :orphan-pages? true})
        labels (node-labels result)]
    (is (contains? labels "Normal Page"))
    (is (not (contains? labels "rating")))
    (is (every? #(not= "property" (:kind %)) (:nodes result)))))

(deftest global-graph-labels-node-property-edges-with-property-title
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/influences {:block/title "Influences"
                                                        :logseq.property/type :node}}
               :pages-and-blocks
               [{:page {:block/title "Project A"
                        :build/properties {:user.property/influences [:build/page {:block/title "Project B"}]}
                        :build/tags [:Project]}}
                {:page {:block/title "Project B"
                        :build/tags [:Project]}}]
               :classes {:Project {}}})
        all-pages-result (graph-view/build-graph @conn {:type :global
                                                        :view-mode :all-pages
                                                        :orphan-pages? true})
        tags-result (graph-view/build-graph @conn {:type :global
                                                   :view-mode :tags-and-objects})]
    (testing "All-pages mode carries the property title on relationship links"
      (is (= "Influences"
             (:label (link-between-labels all-pages-result "Project A" "Project B")))))
    (testing "Tags-and-objects mode carries the same property relationship label"
      (is (= "Influences"
             (:label (link-between-labels tags-result "Project A" "Project B")))))))

(deftest global-all-pages-time-filter-keeps-visible-node-links
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Early"
                        :block/created-at 1000}
                 :blocks [{:block/title "See [[Middle]] and [[Late]]"}]}
                {:page {:block/title "Middle"
                        :block/created-at 2000}}
                {:page {:block/title "Late"
                        :block/created-at 3000}}]})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages
                                              :orphan-pages? true
                                              :created-at-filter 1000})]
    (is (= #{"Early" "Middle"} (node-labels result)))
    (is (some? (link-between-labels result "Early" "Middle")))
    (is (nil? (link-between-labels result "Early" "Late")))
    (is (= 1000 (get-in result [:all-pages :created-at-min])))
    (is (<= 3000 (get-in result [:all-pages :created-at-max])))))

(deftest global-tags-and-objects-nodes-include-created-at
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Timed Objects"
                        :block/created-at 1000}
                 :blocks [{:block/title "timed object"
                           :block/created-at 2000
                           :build/tags [:Topic]}]}]
               :classes {:Topic {:block/created-at 1500}}})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})]
    (is (= 1500 (:block/created-at (node-by-label result "Topic"))))
    (is (= 2000 (:block/created-at (node-by-label result "timed object"))))))

(deftest global-graph-nodes-include-icons
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Icon Page"
                        :build/properties {:logseq.property/icon {:type :emoji
                                                                   :id "star"}}}}
                {:page {:block/title "Objects"}
                 :blocks [{:block/title "icon object"
                           :build/tags [:Topic]
                           :build/properties {:logseq.property/icon {:type :emoji
                                                                      :id "rocket"}}}]}]
               :classes {:Topic {}}})
        all-pages-result (graph-view/build-graph @conn {:type :global
                                                        :view-mode :all-pages
                                                        :orphan-pages? true})
        tags-result (graph-view/build-graph @conn {:type :global
                                                   :view-mode :tags-and-objects})
        by-label (fn [result label]
                   (some #(when (= label (:label %)) %) (:nodes result)))]
    (is (= {:type :emoji :id "star"}
           (:icon (by-label all-pages-result "Icon Page"))))
    (is (= {:type :emoji :id "rocket"}
           (:icon (by-label tags-result "icon object"))))))

(deftest tags-and-objects-graph-allows-non-core-built-in-tags
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Built-in Tags"}
                 :blocks [{:block/title "task object"
                           :build/tags [:logseq.class/Task]}
                          {:block/title "asset object"
                           :build/tags [:logseq.class/Asset]}]}]})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})
        labels (node-labels result)]
    (testing "Non-core built-in tags can be selected and rendered"
      (is (contains? labels "Task"))
      (is (contains? labels "task object")))
    (testing "Core built-in tags stay hidden from displayed tags"
      (is (not (contains? labels "Asset")))
      (is (not (contains? labels "asset object"))))))

(deftest tags-and-objects-graph-respects-hidden-recycled-and-excluded-visibility
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Visible Page"}
                 :blocks [{:block/title "visible object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Hidden Page"
                        :build/properties {:logseq.property/hide? true}}
                 :blocks [{:block/title "hidden page object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Recycled Page"
                        :build/properties {:logseq.property/deleted-at 1712000000000}}
                 :blocks [{:block/title "recycled page object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Excluded Page"
                        :build/properties {:logseq.property/exclude-from-graph-view true}}
                 :blocks [{:block/title "excluded page object"
                           :build/tags [:Topic]}]}
                {:page {:block/title "Hidden Parent"}
                 :blocks [{:block/title "hidden parent block"
                           :build/properties {:logseq.property/hide? true}
                           :build/children [{:block/title "hidden child object"
                                             :build/tags [:Topic]}]}]}
                {:page {:block/title "Excluded Tagged Page"
                        :build/tags [:Topic]
                        :build/properties {:logseq.property/exclude-from-graph-view true}}}]
               :classes {:Topic {}}})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})
        labels (node-labels result)]
    (is (contains? labels "Topic"))
    (is (contains? labels "visible object"))
    (is (not (contains? labels "hidden page object")))
    (is (not (contains? labels "recycled page object")))
    (is (not (contains? labels "excluded page object")))
    (is (not (contains? labels "hidden child object")))
    (is (not (contains? labels "Excluded Tagged Page")))))

(deftest large-all-pages-graph-keeps-bounded-visible-links
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               (into
                [{:page {:block/title "Hub"}
                  :blocks [{:block/title "See [[Page 1]]"}]}]
                (mapv (fn [idx]
                        {:page {:block/title (str "Page " idx)}})
                      (range 10050)))})
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :all-pages
                                              :orphan-pages? true})
        hub-id (:id (node-by-label result "Hub"))
        page-id (:id (node-by-label result "Page 1"))]
    (is (some? hub-id))
    (is (some? page-id))
    (is (contains? (set (:links result))
                   {:source hub-id :target page-id}))))

(deftest tags-and-objects-graph-skips-large-unrelated-page-set-quickly
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               (mapv (fn [idx]
                       {:page {:block/title (str "Page " idx)}})
                     (range 12000))})
        start (.now js/performance)
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})
        elapsed (- (.now js/performance) start)]
    (is (empty? (:nodes result)))
    (is (< elapsed 1000))))

(deftest tags-and-objects-graph-builds-large-tagged-set-quickly
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Movies"}
                 :blocks (mapv (fn [idx]
                                  {:block/title (str "Movie " idx)
                                   :build/tags [:Movie]})
                                (range 3885))}]
               :classes {:Movie {}}})
        start (.now js/performance)
        result (graph-view/build-graph @conn {:type :global
                                              :view-mode :tags-and-objects})
        elapsed (- (.now js/performance) start)]
    (is (= 3886 (count (:nodes result))))
    (is (= 3885 (count (:links result))))
    (is (< elapsed 1000))))
