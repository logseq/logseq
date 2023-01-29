(ns frontend.handler.route-test
  (:require [frontend.handler.route :as route-handler]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.utils :as db-utils]
            [clojure.test :refer [deftest is use-fixtures testing]]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest default-page-route
  (load-test-files [{:file/path "foo.md"
                     :file/content "foo:: bar
- b1
- ## B1
- b2
- ### Header 2
foo:: bar
- ## Header 3 [[Dec 19th, 2022]]"}])

  (testing ":page-block route"
    (let [block (ffirst
                 (db-utils/q '[:find (pull ?b [:block/uuid])
                               :where [?b :block/content "## B1"]]))]
      (is (= {:to :page-block
              :path-params {:name "foo" :block-route-name "b1"}}
             (#'route-handler/default-page-route (:block/uuid block)))
          "Generates a page-block link if route-name is found")))

  (let [block (ffirst
               (db-utils/q '[:find (pull ?b [:block/uuid])
                             :where [?b :block/content "### Header 2\nfoo:: bar"]]))]
    (is (= {:to :page-block
            :path-params {:name "foo" :block-route-name "header 2"}}
           (#'route-handler/default-page-route (:block/uuid block)))
        "Generates a page-block link for route-name with whitespace and properties is found")

    (let [block (ffirst
                 (db-utils/q '[:find (pull ?b [:block/uuid])
                               :where [?b :block/content "## Header 3 [[Dec 19th, 2022]]"]]))]
      (is (= {:to :page-block
              :path-params {:name "foo" :block-route-name "header 3 [[dec 19th, 2022]]"}}
             (#'route-handler/default-page-route (:block/uuid block)))
          "Generates a page-block link for route name with page ref")))

  (testing ":page route"
    (let [uuid (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                                 :where [?b :block/content "b2"]])
                   ffirst
                   :block/uuid)]
      (is (= {:to :page :path-params {:name (str uuid)}}
             (#'route-handler/default-page-route uuid))
          "Generates a page link if route-name is not found"))

    (is (= {:to :page :path-params {:name "page-name"}}
           (#'route-handler/default-page-route "page-name"))
        "Generates a page link if name is not a uuid")

    (is (= {:to :page :path-params {:name "page name"}}
           (#'route-handler/default-page-route "Page name"))
        "Generates a case insensitive page link")))
