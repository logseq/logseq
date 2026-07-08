(ns frontend.handler.route-test
  (:require [frontend.handler.route :as route-handler]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.config :as config]
            [frontend.util :as util]
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

(deftest get-current-graph-name-test
  (testing "returns nil when there is no current repo"
    (with-redefs [state/get-current-repo (constantly nil)]
      (is (nil? (#'route-handler/get-current-graph-name))
          "Returns nil when no current repo is set")))

  (testing "returns 'Demo' when the short repo name is the local-repo value"
    (with-redefs [state/get-current-repo (constantly "local")
                  db/get-repo-name       (constantly config/local-repo)
                  db/get-short-repo-name (constantly config/local-repo)]
      (is (= "Demo" (#'route-handler/get-current-graph-name))
          "Returns 'Demo' for the local demo repo")))

  (testing "returns the short repo name for a regular repo"
    (with-redefs [state/get-current-repo (constantly "https://github.com/user/my-notes")
                  db/get-repo-name       (constantly "user/my-notes")
                  db/get-short-repo-name (constantly "my-notes")]
      (is (= "my-notes" (#'route-handler/get-current-graph-name))
          "Returns the short repo name for a regular repo")))

  (testing "returns nil when get-repo-name returns nil"
    (with-redefs [state/get-current-repo (constantly "some-repo")
                  db/get-repo-name       (constantly nil)]
      (is (nil? (#'route-handler/get-current-graph-name))
          "Returns nil when repo name cannot be determined"))))

(deftest update-page-title-test
  (testing "sets title without graph name when no current repo"
    (let [captured (atom nil)]
      (with-redefs [state/get-current-repo (constantly nil)
                    util/set-title!        (fn [t] (reset! captured t))]
        (route-handler/update-page-title! {:data {:name :home} :path-params {}})
        (is (= "Logseq" @captured)
            "Title is unchanged when there is no current graph"))))

  (testing "appends graph name to title when current repo exists"
    (let [captured (atom nil)]
      (with-redefs [state/get-current-repo (constantly "https://github.com/user/my-notes")
                    db/get-repo-name       (constantly "user/my-notes")
                    db/get-short-repo-name (constantly "my-notes")
                    util/set-title!        (fn [t] (reset! captured t))]
        (route-handler/update-page-title! {:data {:name :home} :path-params {}})
        (is (= "Logseq — my-notes" @captured)
            "Title includes graph name separated by em dash"))))

  (testing "uses 'Demo' label for the local demo repo"
    (let [captured (atom nil)]
      (with-redefs [state/get-current-repo (constantly config/local-repo)
                    db/get-repo-name       (constantly config/local-repo)
                    db/get-short-repo-name (constantly config/local-repo)
                    util/set-title!        (fn [t] (reset! captured t))]
        (route-handler/update-page-title! {:data {:name :home} :path-params {}})
        (is (= "Logseq — Demo" @captured)
            "Title uses 'Demo' for the local demo repo"))))

  (testing "title has no graph suffix when graph name is nil"
    (let [captured (atom nil)]
      (with-redefs [state/get-current-repo (constantly "some-repo")
                    db/get-repo-name       (constantly nil)
                    util/set-title!        (fn [t] (reset! captured t))]
        (route-handler/update-page-title! {:data {:name :settings} :path-params {}})
        (is (= "Settings" @captured)
            "Title is unchanged when graph name cannot be determined")))))
