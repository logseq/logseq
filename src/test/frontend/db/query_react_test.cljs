(ns frontend.db.query-react-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [clojure.pprint]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.utils :as db-utils]
            [frontend.db.react :as react]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- custom-query
  "Use custom-query over react-query for testing since it handles rules the way users
expect"
  [query & [opts]]
  (react/clear-query-state!)
  (when-let [result (query-custom/custom-query test-helper/test-db query opts)]
    (map first (deref result))))

(deftest resolve-input
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content
                     "- parent
   - child 1
   - child 2"}])

  (is (= ["child 2" "child 1" "parent"]
         (with-redefs [state/get-current-page (constantly "page1")]
           (map :block/content
                (custom-query {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]}))))
      ":current-page input resolves to current page name")

  (is (= ["child 1" "child 2"]
         (let [block-uuid (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                                            :where [?b :block/content "parent"]])
                              ffirst
                              :block/uuid)]
           (map :block/content
                (custom-query {:inputs [:current-block]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-block
                                        :where [?b :block/parent ?current-block]]}
                              {:current-block-uuid block-uuid}))))
      ":current-block input resolves to current block's :db/id")
  (is (= ["parent"]
         (let [block-uuid (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                                            :where [?b :block/content "child 1"]])
                              ffirst
                              :block/uuid)]
           (map :block/content
                (custom-query {:inputs [:parent-block]
                               :query '[:find (pull ?parent-block [*])
                                        :in $ ?parent-block
                                        :where [?parent-block :block/parent]]}
                              {:current-block-uuid block-uuid}))))
      ":parent-block input resolves to parent of current blocks's :db/id"))
