(ns logseq.publish.render-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.publish.render :as render]))

(deftest entity-properties-filters-explicitly-hidden-properties
  (testing "property is filtered when ctx marks it hidden"
    (let [entity {:user.property/secret "value"}
          ctx {:property-hidden-by-ident {:user.property/secret true}}
          result (render/entity-properties entity ctx {})]
      (is (nil? (get result :user.property/secret))))))

(deftest entity-properties-filters-built-in-hidden-properties
  (testing "built-in properties with :hide? true are filtered without property entity metadata"
    (let [entity {:logseq.property/created-from-property "some-value"}
          ctx {:property-hidden-by-ident {}}
          result (render/entity-properties entity ctx {})]
      (is (nil? (get result :logseq.property/created-from-property))))))

(deftest filter-tags-removes-built-in-tag-values
  (testing "built-in class keyword tags are removed"
    (let [result (render/filter-tags [:logseq.class/Tag :user.property/custom] {})]
      (is (= [:user.property/custom] result))))
  (testing "built-in class entities are removed"
    (let [entities {1 {:db/ident :logseq.class/Tag}
                    2 {:db/ident :user.property/custom}}
          result (render/filter-tags [1 2] entities)]
      (is (= [2] result)))))

(deftest block-content-nodes-use-auto-dir
  (let [node (render/block-content-nodes
              {:block/content "english then عربي"}
              {:uuid->title {} :graph-uuid "g"}
              1)]
    (is (= "auto" (get-in node [1 :dir])))))

(deftest block-content-from-ref-uses-auto-dir
  (let [node (render/block-content-from-ref
              {"source_block_content" "كلام عربي then english"}
              {:uuid->title {} :graph-uuid "g"})]
    (is (= "auto" (get-in node [1 :dir])))))

(deftest render-properties-use-auto-dir
  (let [props {:user.property/sample "english then عربي"}
        ctx {:property-title-by-ident {}
             :property-type-by-ident {}}
        rendered (render/render-properties props ctx {})
        entry (first (second rendered))
        dd-node (nth entry 2)]
    (is (= :dd.property-value (first dd-node)))
    (is (= "auto" (get-in dd-node [1 :dir])))))
