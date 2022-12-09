(ns frontend.handler.route-test
  (:require [frontend.handler.route :as route-handler]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.utils :as db-utils]
            [clojure.test :refer [deftest is use-fixtures]]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest default-page-route
  (load-test-files [{:file/path "foo.md"
                     :file/content "foo:: bar
- b1
logseq.block/route-name:: b1
- b2"}])

  (let [block (ffirst
               (db-utils/q '[:find (pull ?b [:block/uuid])
                             :where [?b :block/content "b1\nlogseq.block/route-name:: b1"]]))]
    (is (= {:to :page-block
            :path-params {:name "foo" :block-route-name "b1"}}
           (#'route-handler/default-page-route (:block/uuid block)))
        "Generates a page-block link if route-name is found"))

  (let [uuid (->
              (db-utils/q '[:find (pull ?b [:block/uuid])
                            :where [?b :block/content "b2"]])
              ffirst
              :block/uuid)]
    (is (= {:to :page :path-params {:name (str uuid)}}
          (#'route-handler/default-page-route uuid))
       "Generates a page link if route-name is not found"))

  (is (= {:to :page :path-params {:name "page-name"}}
         (#'route-handler/default-page-route "page-name"))
      "Generates a page link if name is not a uuid"))
