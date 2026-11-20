(ns logseq.db.sqlite.build-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.test.helper :as db-test]))

;; Fails if, in `build-class-extends`, `when` becomes `when-not`.
(deftest class-parent-warns-about-deprecation-only-when-given-test
  (let [with-parent (with-out-str
                      (db-test/create-conn-with-blocks
                       {:classes {:Parent {}
                                  :Child {:build/class-parent :Parent}}}))
        without-parent (with-out-str
                         (db-test/create-conn-with-blocks
                          {:classes {:Plain {}}}))]
    (is (re-find #":build/class-parent is deprecated" with-parent))
    (is (nil? (re-find #":build/class-parent is deprecated" without-parent)))))

;; Fails if, in `build-pvalue`, `if` becomes `if-not`.
(deftest property-value-with-nested-many-property-values-test
  (let [uuid-a (random-uuid)
        uuid-b (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p-one {:logseq.property/type :default}
                            :user.property/p-many {:logseq.property/type :default :db/cardinality :many}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "a" :block/uuid uuid-a :build/keep-uuid? true}
                          {:block/title "b" :block/uuid uuid-b :build/keep-uuid? true}
                          {:block/title "b1"
                           :build/properties {:user.property/p-one
                                              {:build/property-value :block
                                               :block/title "outer"
                                               :build/properties {:user.property/p-many #{"x" "y"}}}}}
                          {:block/title "b2"
                           :build/properties {:user.property/p-one
                                              {:build/property-value :block
                                               :block/title "outer by uuid"
                                               :build/properties {:user.property/p-many #{uuid-a uuid-b}}}}}]}]})
        nested-values (fn [title]
                        (->> (db-test/find-block-by-content @conn title)
                             :user.property/p-one
                             :user.property/p-many
                             (map :block/title)
                             set))]
    (is (= #{"x" "y"} (nested-values "b1")))
    (is (= #{"a" "b"} (nested-values "b2")))))
