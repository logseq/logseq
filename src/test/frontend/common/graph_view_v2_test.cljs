(ns frontend.common.graph-view-v2-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.common.graph-view :as graph-view]
            [logseq.db.test.helper :as db-test]))

(defn- node-labels
  [result]
  (set (map :label (:nodes result))))

(defn- link-endpoints
  [result]
  (set (mapcat (juxt :source :target) (:links result))))

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
