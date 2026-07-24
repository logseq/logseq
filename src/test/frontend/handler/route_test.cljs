(ns frontend.handler.route-test
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.date :as date]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- test-db
  []
  (conn/get-db test-helper/test-db))

(deftest default-page-route
  (let [journal-uuid (random-uuid)]
    (load-test-files
     [{:page {:block/title "foo"}
       :blocks
       [{:block/title "b1"}
        {:block/title "B1"
         :build/properties {:logseq.property/heading 2}}
        {:block/title "b2"}
        {:block/title "Header 2"
         :build/properties {:logseq.property/heading 3}}
        {:block/title (str "Header 3 [[" journal-uuid "]]")
         :build/properties {:logseq.property/heading 2}}]}
      {:page {:build/journal 20221219
              :build/keep-uuid? true
              :block/uuid journal-uuid}}]))

  (testing ":page-block route"
    (let [block (ffirst
                 (db-utils/q (test-db)
                             '[:find (pull ?b [:block/uuid])
                               :where [?b :block/title "B1"]]))]
      (is (= {:to :page-block
              :path-params {:name "foo" :block-route-name "b1"}}
             (#'route-handler/default-page-route (:block/uuid block)
                                                 {:block-page-name "foo"
                                                  :block-route-name "b1"}))
          "Generates a page-block link if route-name is found")))

  (let [block (ffirst
               (db-utils/q (test-db)
                           '[:find (pull ?b [:block/uuid])
                             :where [?b :block/title "Header 2"]]))]
    (is (= {:to :page-block
            :path-params {:name "foo" :block-route-name "header 2"}}
           (#'route-handler/default-page-route (:block/uuid block)
                                               {:block-page-name "foo"
                                                :block-route-name "header 2"}))
        "Generates a page-block link for route-name with whitespace and properties is found")

    (let [block (test-helper/find-block-by-content #"Header 3")]
      (is (= {:to :page-block
              :path-params {:name "foo" :block-route-name "header 3 [[dec 19th, 2022]]"}}
             (#'route-handler/default-page-route (:block/uuid block)
                                                 {:block-page-name "foo"
                                                  :block-route-name "header 3 [[dec 19th, 2022]]"}))
          "Generates a page-block link for route name with page ref")))

  (testing ":page route"
    (let [uuid (-> (db-utils/q (test-db)
                               '[:find (pull ?b [:block/uuid])
                                 :where [?b :block/title "b2"]])
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

(deftest redirect-to-page-uses-worker-route-info-test
  (async done
    (let [source-uuid #uuid "11111111-1111-1111-1111-111111111111"
          calls (atom [])
          graph-id (atom "graph-uuid")]
      (p/with-redefs [state/get-current-repo (constantly "test")
                      state/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (case (first args)
                          :thread-api/get-page-route-info
                          (p/resolved
                           (when (= "Alias" (last args))
                             {:page-id 42
                              :page-uuid #uuid "22222222-2222-2222-2222-222222222222"
                              :page-title "Alias"
                              :alias-source-id 43
                              :alias-source-uuid source-uuid}))

                          :thread-api/get-journal-page-by-day
                          (p/resolved {:db/id 99})

                          (p/resolved nil)))
                      date/today-journal-day (constantly 20260707)
                      graph-handler/current-graph-id (fn [] @graph-id)
                      recent-handler/add-page-to-recent!
                      (fn [& args]
                        (swap! calls conj (into [:recent] args)))
                      state/sidebar-add-block!
                      (fn [& args]
                        (swap! calls conj (vec args)))
                      rfe/push-state
                      (fn [& args]
                        (swap! calls conj (into [:push-state] args)))]
        (-> (p/do!
             (route-handler/redirect-to-page! "Page name")
             (route-handler/redirect-to-page! "Page name" {:anchor "ls-block-block-uuid"})
             (reset! graph-id nil)
             (route-handler/redirect-to-page! "Page name")
             (reset! graph-id "graph-uuid")
             (route-handler/redirect-to-page! "Alias")
             (route-handler/sidebar-journals!))
            (p/then
             (fn []
               (is (= [[:thread-api/get-page-route-info "test" "Page name"]
                       [:push-state :page {:name "page name"} {:graph-id "graph-uuid"}]
                       [:thread-api/get-page-route-info "test" "Page name"]
                       [:push-state :page {:name "page name"}
                        {:anchor "ls-block-block-uuid"
                         :graph-id "graph-uuid"}]
                       [:thread-api/get-page-route-info "test" "Page name"]
                       [:push-state :page {:name "page name"} nil]
                       [:thread-api/get-page-route-info "test" "Alias"]
                       [:thread-api/get-page-route-info "test" source-uuid]
                       [:recent 43 false]
                       [:push-state :page {:name (str source-uuid)} {:graph-id "graph-uuid"}]
                       [:thread-api/get-journal-page-by-day "test" 20260707]
                       ["test" 99 :page]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest route-title-and-label-use-worker-test
  (async done
    (let [block-id #uuid "33333333-3333-3333-3333-333333333333"
          block-title "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
          page-route {:data {:name :page}
                      :path-params {:name "Page"}}
          block-route {:data {:name :page}
                       :path-params {:name (str block-id)}}
          document #js {:title ""
                        :body #js {:dataset #js {:page ""}}}
          previous-document (.-document js/global)
          previous-state @state/state
          previous-worker @state/*db-worker
          calls (atom [])]
      (set! (.-document js/global) document)
      (swap! state/state assoc :git/current-repo "test")
      (reset! state/*db-worker
              (fn [& args]
                (swap! calls conj (vec args))
                (p/resolved
                 (case (last args)
                   "Page" {:page-title "Page"}
                   "33333333-3333-3333-3333-333333333333" {:block-title block-title}
                   nil))))
      (-> (p/do!
           (route-handler/update-page-title! page-route)
           (route-handler/update-page-label! page-route)
           (route-handler/update-page-title! block-route))
          (p/then
           (fn []
             (is (= [[:thread-api/get-route-title "test" "Page"]
                     [:thread-api/get-route-title "test" "Page"]
                     [:thread-api/get-route-title "test" (str block-id)]]
                    @calls))
             (is (= "Page" (.-page (.-dataset (.-body document)))))
             (is (= (str (subs block-title 0 48) "...")
                    (.-title document)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/state previous-state)
             (reset! state/*db-worker previous-worker)
             (set! (.-document js/global) previous-document)
             (done)))))))
