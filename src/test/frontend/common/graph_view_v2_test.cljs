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
