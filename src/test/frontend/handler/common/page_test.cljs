(ns frontend.handler.common.page-test
  (:require [clojure.test :refer [is use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.transact :as db-transact]
            [frontend.handler.config :as config-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(use-fixtures :each
  {:before test-helper/start-test-db!
   :after test-helper/destroy-test-db!})

(deftest-async create-page-restores-recycled-page
  (let [page-uuid (random-uuid)
        child-uuid (random-uuid)]
    (p/let [conn (conn/get-db test-helper/test-db false)
            _ (d/transact! conn [{:block/uuid page-uuid
                                  :block/name "foo"
                                  :block/title "foo"
                                  :block/tags #{:logseq.class/Page}}
                                 {:block/uuid child-uuid
                                  :block/title "child block"
                                  :block/page [:block/uuid page-uuid]
                                  :block/parent [:block/uuid page-uuid]}])
            page (db-test/find-page-by-title @conn "foo")
            _ (d/transact! conn [[:db/add (:db/id page) :logseq.property/deleted-at 1]])
          recycled-page (d/entity @conn [:block/uuid page-uuid])
          _ (is (ldb/recycled? recycled-page)
                "Page should be recycled after deletion")
          restored-page (p/with-redefs [state/get-current-repo (constantly test-helper/test-db)
                                        state/<invoke-db-worker
                                        (fn [api _repo selector lookup-ref]
                                          (is (= :thread-api/pull api))
                                          (let [entity-id (if (and (vector? lookup-ref)
                                                                   (= :block/name (first lookup-ref)))
                                                            (:db/id (ldb/get-page @conn (second lookup-ref)))
                                                            lookup-ref)]
                                            (p/resolved (some->> entity-id (d/pull @conn selector)))))
                                        db-transact/apply-outliner-ops
                                        (fn [_conn ops opts]
                                          (let [[op [title create-options]] (first ops)]
                                            (is (= :create-page op))
                                            (is (= "foo" title))
                                            (is (= {:redirect? false
                                                    :split-namespace? true}
                                                   (select-keys create-options [:redirect? :split-namespace?]))))
                                          (is (= {:outliner-op :create-page} opts))
                                          (d/transact! conn [[:db/retract (:db/id page) :logseq.property/deleted-at 1]])
                                          (p/resolved ["foo" page-uuid]))]
                          (page-common-handler/<create! "foo" {:redirect? false}))]
      (is (= (:db/id restored-page) (:db/id page))
          "create! should return the restored page")
      (let [page' (d/entity @conn [:block/uuid page-uuid])]
        (is (not (ldb/recycled? page'))
            "Page should no longer be recycled after re-creation")
        (is (= "foo" (get-in (db-test/find-block-by-content @conn "child block") [:block/page :block/title]))
            "Restored page still has its block(s)")))))

(deftest-async create-existing-page-uses-worker-page-lookup-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        page {:db/id 42
              :block/title "Existing Page"
              :block/uuid page-uuid}
        page-selector '[:db/id :block/uuid :block/title :block/name :logseq.property/deleted-at
                        {:block/tags [:db/id :db/ident :block/uuid :block/title]}
                        {:block/parent ...}]
        calls (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (p/resolved page))
                    route-handler/redirect-to-page!
                    (fn [page-uuid']
                      (swap! calls conj [:redirect page-uuid']))]
      (p/let [result (page-common-handler/<create! "Existing Page" {:edit? false})]
        (is (= page result))
        (is (= [[:thread-api/pull "test" page-selector [:block/name "existing page"]]
                [:redirect page-uuid]]
               @calls))))))

(deftest-async favorite-mutations-use-worker-outliner-ops-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        favorite-ops [[:insert-blocks [[{:block/link [:block/uuid page-uuid]
                                         :block/title ""}]
                                       #uuid "22222222-2222-2222-2222-222222222222"
                                       {}]]]
        unfavorite-ops [[:delete-blocks [[#uuid "33333333-3333-3333-3333-333333333333"] {}]]]
        calls (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/<invoke-db-worker
                    (fn [api repo & args]
                      (swap! calls conj (into [api repo] args))
                      (case api
                        :thread-api/build-favorite-page-ops (p/resolved favorite-ops)
                        :thread-api/build-unfavorite-page-ops (p/resolved unfavorite-ops)
                        :thread-api/apply-outliner-ops (p/resolved nil)
                        (throw (ex-info "Unexpected worker API" {:api api}))))
                    conn/get-db
                    (fn [& _]
                      (throw (js/Error. "renderer DB conn should not be used")))]
      (p/let [_ (page-common-handler/<db-favorite-page! page-uuid)
              _ (page-common-handler/<db-unfavorite-page! page-uuid)]
        (is (= [[:thread-api/build-favorite-page-ops "test" page-uuid]
                [:thread-api/apply-outliner-ops "test" favorite-ops nil]
                [:thread-api/build-unfavorite-page-ops "test" page-uuid]
                [:thread-api/apply-outliner-ops "test" unfavorite-ops nil]]
               @calls))))))

(deftest-async edit-page-when-present-uses-worker-page-lookup-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        page {:db/id 42
              :block/uuid page-uuid}
        calls (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (p/resolved page))
                    page-common-handler/edit-page!
                    (fn [page']
                      (swap! calls conj [:edit page']))]
      (p/let [_ (page-common-handler/edit-page-when-present! "Some Page")]
        (is (= [[:thread-api/pull "test" [:db/id :block/uuid] [:block/name "some page"]]
                [:edit page]]
               @calls))))))

(deftest-async after-page-deleted-uses-worker-page-lookup-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        calls (atom [])]
    (p/with-redefs [state/get-current-repo (constantly "test")
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (p/resolved {:block/uuid page-uuid}))
                    page-common-handler/<db-unfavorite-page!
                    (fn [id]
                      (swap! calls conj [:unfavorite id])
                      (p/resolved nil))]
      (p/let [_ (page-common-handler/after-page-deleted! "Deleted Page")]
        (is (= [[:thread-api/pull "test" [:block/uuid] [:block/name "deleted page"]]
                [:unfavorite page-uuid]]
               @calls))))))

(deftest-async delete-page-uses-worker-page-lookup-and-delete-op-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        calls (atom [])]
    (p/with-redefs [state/*db-worker (atom true)
                    state/get-current-repo (constantly "test")
                    state/get-default-home (constantly {:page "Deleted Page" :sidebar? true})
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (case (first args)
                        :thread-api/pull
                        (p/resolved {:block/uuid page-uuid
                                     :block/title "Deleted Page"})

                        :thread-api/apply-outliner-ops
                        (p/resolved true)

                        (throw (js/Error. (str "Unexpected worker API " (first args))))))
                    config-handler/set-config!
                    (fn [k v]
                      (swap! calls conj [:set-config k v]))
                    notification/show!
                    (fn [_message status]
                      (swap! calls conj [:notification status]))
                    user-handler/user-uuid (constantly nil)
                    conn/get-db
                    (fn [& args]
                      (swap! calls conj (into [:renderer-get-db] args))
                      ::conn)
                    db-transact/apply-outliner-ops
                    (fn [& args]
                      (swap! calls conj (into [:ui-outliner-apply] args))
                      (p/resolved true))]
      (p/let [_ (page-common-handler/<delete!
                 "Deleted Page"
                 #(swap! calls conj [:ok])
                 :error-handler #(swap! calls conj [:error]))]
        (is (= [[:thread-api/pull "test" [:block/uuid :block/title] [:block/name "deleted page"]]
                [:set-config :default-home {:sidebar? true}]
                [:notification :success]
                [:thread-api/apply-outliner-ops "test" [[:delete-page [page-uuid {}]]] nil]
                [:ok]]
               @calls))))))

(deftest-async after-page-renamed-uses-worker-page-lookup-test
  (let [page-uuid #uuid "11111111-1111-1111-1111-111111111111"
        calls (atom [])]
    (p/with-redefs [state/get-current-page (constantly "Old Page")
                    state/get-config (constantly {:default-home {:page "Old Page"
                                                                 :sidebar? true}})
                    state/<invoke-db-worker
                    (fn [& args]
                      (swap! calls conj (vec args))
                      (p/resolved {:block/uuid page-uuid}))
                    config-handler/set-config!
                    (fn [k v]
                      (swap! calls conj [:set-config k v]))
                    route-handler/redirect!
                    (fn [route]
                      (swap! calls conj [:redirect route]))
                    ui-handler/re-render-root!
                    (fn []
                      (swap! calls conj [:re-render-root]))]
      (p/let [_ (page-common-handler/after-page-renamed!
                 "test"
                 {:page-id 42
                  :old-name "Old Page"
                  :new-name "New Page"})]
        (is (= [[:thread-api/pull "test" [:block/uuid] 42]
                [:redirect {:to :page
                            :push false
                            :path-params {:name (str page-uuid)}}]
                [:set-config :default-home {:page "New Page"
                                            :sidebar? true}]
                [:re-render-root]]
               @calls))))))
