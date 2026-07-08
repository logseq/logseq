(ns frontend.handler.editor-test
  (:require [clojure.test :refer [async deftest is testing use-fixtures]]
            [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor-component]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.transact :as db-transact]
            [frontend.db.utils :as db-utils]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.core :as outliner-core]
            [promesa.core :as p]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after (fn []
                              (state/set-current-repo! nil)
                              (test-helper/destroy-test-db!))})

(defn- <pull-page-from-test-db
  [api _repo _selector lookup]
  (p/resolved
   (when (= api :thread-api/pull)
     (when (= :block/name (first lookup))
       (let [test-db (conn/get-db test-helper/test-db)
             page-name (second lookup)]
         (if-let [page (ldb/get-page test-db page-name)]
           (select-keys page [:block/uuid :block/title :block/name])
           (gp-block/page-name->map page-name test-db true (state/get-date-formatter))))))))

(deftest extract-nearest-link-from-text-test
  (testing "Page, block and tag links"
    (is (= "page1"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 0))
        "Finds first page link correctly based on cursor position")

    (is (= "page2"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 10))
        "Finds second page link correctly based on cursor position")

    (is (= "tag"
           (editor/extract-nearest-link-from-text "#tag [[page1]]" 3))
        "Finds tag correctly")

    (is (= "61e057b9-f799-4532-9258-cfef6ce58370"
           (editor/extract-nearest-link-from-text
            "((61e057b9-f799-4532-9258-cfef6ce58370)) #todo" 5))
        "Finds block correctly"))

  (testing "Url links"
    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "https://github.com/logseq/logseq is #awesome :)" 0 editor/url-regex))
        "Finds url correctly")

    (is (not= "https://github.com/logseq/logseq"
              (editor/extract-nearest-link-from-text
               "https://github.com/logseq/logseq is #awesome :)" 0))
        "Doesn't find url if regex not passed")

    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "[logseq](https://github.com/logseq/logseq) is #awesome :)" 0 editor/url-regex))
        "Finds url in markdown link correctly"))

  (is (= "https://github.com/logseq/logseq"
         (editor/extract-nearest-link-from-text
          "[[https://github.com/logseq/logseq][logseq]] is #awesome :)" 0 editor/url-regex))
      "Finds url in org link correctly"))

(deftest own-order-number-list-uses-passed-block-test
  (is (true? (editor/own-order-number-list?
              {:db/id 1
               :logseq.property/order-list-type {:block/title "number"}})))
  (is (false? (editor/own-order-number-list?
               {:db/id 2
                :logseq.property/order-list-type {:block/title "roman"}}))))

(deftest get-state-uses-editor-args-block-without-renderer-rehydration-test
  (let [block {:db/id 1
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
               :block/title "current block"}
        node #js {:value "content"}]
    (with-redefs [state/get-editor-args
                  (constantly [{:on-hide :hide
                                :block block
                                :block-id 1
                                :block-parent-id 2
                                :format :markdown
                                :sidebar? true}
                               "edit-block-test"
                               {:container-id :main}])
                  gdom/getElement (fn [id]
                                    (when (= "edit-block-test" id)
                                      node))
                  util/get-selection-start (constantly 3)
                  util/rec-get-node (fn [_node attr]
                                      (when (= "ls-block" attr)
                                        :container))]
      (is (= {:config {:container-id :main}
              :on-hide :hide
              :sidebar? true
              :format :markdown
              :id "edit-block-test"
              :block block
              :block-id 1
              :block-parent-id 2
              :node node
              :value "content"
              :pos 3
              :block-container :container}
             (editor/get-state))))))

(deftest edit-pending-new-block-loads-inserted-block-through-worker-test
  (async done
    (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
          pending-block {:block/uuid block-id
                         :block/title "created"}
          inserted-block (assoc pending-block :db/id 10)
          calls (atom [])
          original-get-state state/get-state
          original-editor-get-state editor/get-state
          original-get-current-repo state/get-current-repo
          original-<get-block db-async/<get-block
          original-indent-outdent-blocks! block-handler/indent-outdent-blocks!
          original-edit-block! editor/edit-block!
          original-set-state! state/set-state!
          restore! (fn []
                     (set! state/get-state original-get-state)
                     (set! editor/get-state original-editor-get-state)
                     (set! state/get-current-repo original-get-current-repo)
                     (set! db-async/<get-block original-<get-block)
                     (set! block-handler/indent-outdent-blocks! original-indent-outdent-blocks!)
                     (set! editor/edit-block! original-edit-block!)
                     (set! state/set-state! original-set-state!))]
      (set! state/get-state (fn [k]
                              (when (= :editor/pending-new-block k)
                                {:typed-text "abc"
                                 :tab-indent? true})))
      (set! editor/get-state (constantly nil))
      (set! state/get-current-repo (constantly "test"))
      (set! db-async/<get-block
            (fn [repo block-id' opts]
              (swap! calls conj [:get-block repo block-id' opts])
              (p/resolved inserted-block)))
      (set! block-handler/indent-outdent-blocks!
            (fn [blocks indent? _opts]
              (swap! calls conj [:indent blocks indent?])))
      (set! editor/edit-block!
            (fn [block pos opts]
              (swap! calls conj [:edit block pos opts])))
      (set! state/set-state!
            (fn [k value]
              (swap! calls conj [:set-state k value])))
      (-> (try
            (#'editor/edit-pending-new-block! pending-block true)
            (catch :default error
              (p/rejected error)))
          (p/then
           (fn []
             (is (= [[:get-block "test" block-id {:children? false}]
                     [:indent [inserted-block] true]
                     [:edit inserted-block
                      3
                      {:container-id nil
                       :custom-content "abccreated"}]
                     [:set-state :editor/pending-new-block nil]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore!)
             (done)))))))

(deftest save-block-if-changed-uses-passed-block-content-test
  (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        block {:db/id 1
               :block/uuid block-uuid
               :block/title "Old title"}
        save-calls (atom [])
        tx-calls (atom [])]
    (with-redefs [conn/get-db (constantly :test-db)
                  db-transact/apply-outliner-ops (fn [db ops opts]
                                                   (reset! tx-calls [db ops opts])
                                                   :tx)
                  editor/wrap-parse-block identity
                  outliner-op/save-block! (fn [block opts]
                                            (swap! save-calls conj [block opts]))]
      (is (nil? (editor/save-block-if-changed! block " Old title ")))
      (is (empty? @save-calls)
          "Same trimmed title should not build a save op")
      (is (empty? @tx-calls)
          "Same trimmed title should not save")
      (is (= :tx (editor/save-block-if-changed! block "New title" {:source :test})))
      (is (= [[{:block/uuid block-uuid
                :block/title "New title"}
               nil]]
             @save-calls))
      (is (= [nil
              []
              {:source :test
               :outliner-op :save-block}]
             @tx-calls))
      (reset! save-calls [])
      (reset! tx-calls [])
      (is (= :tx (editor/save-block-if-changed! block "Old title" {:force? true})))
      (is (= [[{:block/uuid block-uuid
                :block/title "Old title"}
               nil]]
             @save-calls))
      (is (= [nil
              []
              {:force? true
               :outliner-op :save-block}]
             @tx-calls)))))

(deftest open-block-in-sidebar-loads-target-through-worker-test
  (async done
    (let [page-id #uuid "11111111-1111-1111-1111-111111111111"
          block-id #uuid "22222222-2222-2222-2222-222222222222"
          worker-calls (atom [])
          sidebar-calls (atom [])
          original-get-current-repo state/get-current-repo
          original-<invoke-db-worker state/<invoke-db-worker
          original-sidebar-add-block! state/sidebar-add-block!
          restore! (fn []
                     (set! state/get-current-repo original-get-current-repo)
                     (set! state/<invoke-db-worker original-<invoke-db-worker)
                     (set! state/sidebar-add-block! original-sidebar-add-block!))]
      (set! state/get-current-repo (constantly "test"))
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! worker-calls conj (vec args))
              (p/resolved
               (case (last args)
                 [:block/uuid page-id] {:db/id 10}
                 [:block/uuid block-id] {:db/id 20
                                         :block/page {:db/id 10}}
                 nil))))
      (set! state/sidebar-add-block!
            (fn [& args]
              (swap! sidebar-calls conj (vec args))))
      (-> (p/do!
           (editor/open-block-in-sidebar! page-id)
           (editor/open-block-in-sidebar! block-id))
          (p/then
           (fn []
             (is (= [[:thread-api/pull "test" [:db/id {:block/page [:db/id]}] [:block/uuid page-id]]
                     [:thread-api/pull "test" [:db/id {:block/page [:db/id]}] [:block/uuid block-id]]]
                    @worker-calls))
             (is (= [["test" 10 :page]
                     ["test" 20 :block]]
                    @sidebar-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore!)
             (done)))))))

(deftest open-link-in-sidebar-loads-target-through-worker-test
  (async done
    (let [page-db-id 10
          block-id #uuid "22222222-2222-2222-2222-222222222222"
          block-db-id 20
          nearest-pages (atom ["Some Page" (str block-id)])
          worker-calls (atom [])
          sidebar-calls (atom [])
          original-get-nearest-page editor/get-nearest-page
          original-get-current-repo state/get-current-repo
          original-<invoke-db-worker state/<invoke-db-worker
          original-sidebar-add-block! state/sidebar-add-block!
          restore! (fn []
                     (set! editor/get-nearest-page original-get-nearest-page)
                     (set! state/get-current-repo original-get-current-repo)
                     (set! state/<invoke-db-worker original-<invoke-db-worker)
                     (set! state/sidebar-add-block! original-sidebar-add-block!))]
      (set! editor/get-nearest-page (fn []
                                      (let [[pages] (swap-vals! nearest-pages rest)]
                                        (first pages))))
      (set! state/get-current-repo (constantly "test"))
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! worker-calls conj (vec args))
              (p/resolved
               (case (last args)
                 [:block/name "some page"] {:db/id page-db-id}
                 [:block/uuid block-id] {:db/id block-db-id}
                 nil))))
      (set! state/sidebar-add-block!
            (fn [& args]
              (swap! sidebar-calls conj (vec args))))
      (-> (p/do!
           (editor/open-link-in-sidebar!)
           (editor/open-link-in-sidebar!))
          (p/then
           (fn []
             (is (= [[:thread-api/pull "test" [:db/id] [:block/name "some page"]]
                     [:thread-api/pull "test" [:db/id] [:block/uuid block-id]]]
                    @worker-calls))
             (is (= [["test" page-db-id :page]
                     ["test" block-db-id :block]]
                    @sidebar-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore!)
             (done)))))))

(deftest zoom-in-uses-current-edit-block-without-renderer-lookup-test
  (async done
    (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
          calls (atom [])]
      (-> (p/with-redefs [state/editing? (constantly true)
                          state/get-edit-block (constantly {:block/uuid block-id})
                          state/clear-editor-action! (fn []
                                                       (swap! calls conj [:clear-editor-action]))
                          state/set-editing-block-id! (fn [id]
                                                        (swap! calls conj [:set-editing-block-id id]))
                          editor/save-current-block! (fn []
                                                       (swap! calls conj [:save-current-block])
                                                       (p/resolved nil))
                          route-handler/redirect-to-page! (fn [id]
                                                            (swap! calls conj [:redirect id])
                                                            (p/resolved nil))]
            (-> (try
                  (editor/zoom-in!)
                  (catch :default error
                    (p/rejected error)))
                (p/then
                 (fn []
                   (is (= [[:clear-editor-action]
                           [:set-editing-block-id [:unknown-container block-id]]
                           [:save-current-block]
                           [:redirect block-id]]
                          @calls))))
                (p/catch
                 (fn [error]
                   (is false (str error))))))
          (p/finally done)))))

(deftest zoom-out-loads-parent-through-worker-test
  (async done
    (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
          parent-id #uuid "22222222-2222-2222-2222-222222222222"
          calls (atom [])
          original-editing? state/editing?
          original-get-current-repo state/get-current-repo
          original-get-current-page state/get-current-page
          original-get-edit-block state/get-edit-block
          original-get-editor-action state/get-editor-action
          original-clear-editor-action! state/clear-editor-action!
          original-set-editing-block-id! state/set-editing-block-id!
          original-<invoke-db-worker state/<invoke-db-worker
          original-redirect! route-handler/redirect!
          restore! (fn []
                     (set! state/editing? original-editing?)
                     (set! state/get-current-repo original-get-current-repo)
                     (set! state/get-current-page original-get-current-page)
                     (set! state/get-edit-block original-get-edit-block)
                     (set! state/get-editor-action original-get-editor-action)
                     (set! state/clear-editor-action! original-clear-editor-action!)
                     (set! state/set-editing-block-id! original-set-editing-block-id!)
                     (set! state/<invoke-db-worker original-<invoke-db-worker)
                     (set! route-handler/redirect! original-redirect!))]
      (set! state/editing? (constantly true))
      (set! state/get-current-repo (constantly "test"))
      (set! state/get-current-page (constantly (str block-id)))
      (set! state/get-edit-block (constantly {:block/uuid block-id}))
      (set! state/get-editor-action (constantly :skip-save))
      (set! state/clear-editor-action! (fn []
                                         (swap! calls conj [:clear-editor-action])))
      (set! state/set-editing-block-id! (fn [id]
                                          (swap! calls conj [:set-editing-block-id id])))
      (set! state/<invoke-db-worker (fn [api repo & args]
                                      (case api
                                        :thread-api/get-blocks
                                        (let [requests (ldb/read-transit-str (first args))]
                                          (swap! calls conj [:get-blocks repo requests])
                                          (p/resolved (ldb/write-transit-str
                                                       [{:block {:db/id 10
                                                                 :block/uuid block-id
                                                                 :block/page {:db/id 100}}}])))

                                        :thread-api/get-block-parents
                                        (let [[id depth] args]
                                          (swap! calls conj [:get-block-parents repo id depth])
                                          (p/resolved [{:db/id 9
                                                        :block/uuid parent-id
                                                        :block/title "Parent"}]))

                                        :thread-api/get-page-route-info
                                        (let [page-name (first args)]
                                          (swap! calls conj [:route-info repo page-name])
                                          (p/resolved {:page-title (str page-name)})))))
      (set! route-handler/redirect! (fn [route]
                                      (swap! calls conj [:redirect route])
                                      nil))
      (-> (try
            (editor/zoom-out!)
            (catch :default error
              (p/rejected error)))
          (p/then
           (fn []
             (is (some #(= [:get-blocks "test" [{:id (str block-id)
                                                 :opts {:children? false}}]]
                           %)
                       @calls))
             (is (some #(= [:get-block-parents "test" 10 1] %)
                       @calls))
             (is (some #(and (= :route-info (first %))
                             (= parent-id (nth % 2 nil)))
                       @calls))
             (is (some #(= [:redirect {:to :page
                                       :path-params {:name (str parent-id)}
                                       :query-params nil}]
                           %)
                       @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore!)
             (done)))))))

(deftest edit-last-block-after-inserted-uses-returned-block-test
  (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
        inserted-block {:db/id 10
                        :block/uuid block-id
                        :block/title "inserted"}
        calls (atom [])]
    (with-redefs [util/schedule (fn [f]
                                  (swap! calls conj [:schedule])
                                  (f))
                  editor/edit-block! (fn [& args]
                                       (swap! calls conj (into [:edit-block] args)))
                  editor/clear-when-saved! (fn []
                                             (swap! calls conj [:clear-when-saved]))]
      (try
        (#'editor/edit-last-block-after-inserted! {:blocks [inserted-block]})
        (is (= [[:schedule]
                [:clear-when-saved]
                [:edit-block inserted-block :max]]
               @calls))
        (catch :default error
          (is false (str error)))))))

(deftest cycle-todo-uses-current-edit-block-test
  (let [edit-block {:db/id 1
                    :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                    :logseq.property/status {:db/ident :logseq.property/status.todo}}
        tx-calls (atom [])
        cycle-calls (atom [])]
    (with-redefs [state/get-editor-action (constantly nil)
                  editor/get-selected-blocks (constantly nil)
                  state/get-edit-block (constantly edit-block)
                  state/get-edit-input-id (constantly "edit-block-test")
                  gdom/getElement (constantly #js {})
                  state/get-edit-pos (constantly 0)
                  conn/get-db (constantly :test-db)
                  db-transact/apply-outliner-ops (fn [db ops opts]
                                                   (reset! tx-calls [db ops opts])
                                                   :tx)
                  editor/db-based-cycle-todo! (fn [block]
                                                (swap! cycle-calls conj block))]
      (editor/cycle-todo!)
      (is (= [edit-block] @cycle-calls))
      (is (= [nil
              []
              {:outliner-op :cycle-todos}]
             @tx-calls)))))

(deftest delete-block-aux-uses-passed-block-test
  (let [block-id #uuid "11111111-1111-1111-1111-111111111111"
        block {:db/id 1
               :block/uuid block-id
               :block/title "delete me"}
        top-level-block (assoc block :block/level 1)
        calls (atom [])]
    (with-redefs [block-handler/get-top-level-blocks
                  (fn [blocks]
                    (swap! calls conj [:top-level blocks])
                    [top-level-block])
                  outliner-op/delete-blocks!
                  (fn [blocks opts]
                    (swap! calls conj [:delete blocks opts]))
                  db-transact/apply-outliner-ops
                  (fn [_db ops opts]
                    (swap! calls conj [:apply ops opts]))]
      (try
        (editor/delete-block-aux! block)
        (is (= [[:top-level [block]]
                [:delete [top-level-block] {}]
                [:apply [] {:outliner-op :delete-blocks}]]
               @calls))
        (catch :default error
          (is false (str error)))))))

(deftest move-selected-blocks-loads-selection-through-worker-test
  (async done
    (let [block-id-a #uuid "11111111-1111-1111-1111-111111111111"
          block-id-b #uuid "22222222-2222-2222-2222-222222222222"
          block-a {:db/id 1
                   :block/uuid block-id-a
                   :block/title "A"}
          block-b {:db/id 2
                   :block/uuid block-id-b
                   :block/title "B"}
          top-level-blocks [block-a]
          event #js {}
          calls (atom [])]
      (-> (p/with-redefs [util/stop (fn [e]
                                      (swap! calls conj [:stop e]))
                          state/get-selection-block-ids (constantly [block-id-a block-id-b])
                          state/get-current-repo (constantly "test")
                          db-async/<get-blocks
                          (fn [repo ids opts]
                            (swap! calls conj [:get-blocks repo ids opts])
                            (p/resolved [block-a block-b]))
                          block-handler/get-top-level-blocks
                          (fn [blocks]
                            (let [blocks (vec blocks)]
                              (swap! calls conj [:top-level blocks])
                              top-level-blocks))
                          route-handler/go-to-search!
                          (fn [route opts]
                            (swap! calls conj [:go-to-search route (update (select-keys opts [:action :blocks])
                                                                            :blocks
                                                                            vec)]))]
            (-> (try
                  (editor/move-selected-blocks event)
                  (catch :default error
                    (p/rejected error)))
                (p/then
                 (fn []
                   (is (= [[:stop event]
                           [:get-blocks "test" [block-id-a block-id-b] {:children? false}]
                           [:top-level [block-a block-b]]
                           [:go-to-search :nodes {:action :move-blocks
                                                  :blocks top-level-blocks}]]
                          @calls))))
                (p/catch
                 (fn [error]
                   (is false (str error))))))
          (p/finally done)))))

(deftest cycle-todo-loads-selected-blocks-through-worker-test
  (async done
    (let [block-id-a #uuid "11111111-1111-1111-1111-111111111111"
          block-id-b #uuid "22222222-2222-2222-2222-222222222222"
          block-a {:db/id 1
                   :block/uuid block-id-a
                   :logseq.property/status {:db/ident :logseq.property/status.todo}}
          block-b {:db/id 2
                   :block/uuid block-id-b
                   :logseq.property/status {:db/ident :logseq.property/status.doing}}
          cycle-calls (atom [])
          worker-calls (atom [])]
      (-> (p/with-redefs [state/get-editor-action (constantly nil)
                          editor/get-selected-blocks (constantly [:node-a :node-b])
                          dom/attr (fn [node attr]
                                     (when (= "blockid" attr)
                                       (case node
                                         :node-a (str block-id-a)
                                         :node-b (str block-id-b))))
                          state/get-current-repo (constantly "test")
                          db-async/<get-blocks
                          (fn [repo ids opts]
                            (swap! worker-calls conj [:get-blocks repo ids opts])
                            (p/resolved [block-a block-b]))
                          editor/db-based-cycle-todo! (fn [block]
                                                        (swap! cycle-calls conj block))]
            (-> (try
                  (editor/cycle-todo!)
                  (catch :default error
                    (p/rejected error)))
                (p/then
                 (fn []
                   (is (= [[:get-blocks "test" [block-id-a block-id-b] {:children? false}]]
                          @worker-calls))
                   (is (= [block-a block-b] @cycle-calls))))
                (p/catch
                 (fn [error]
                   (is false (str error))))))
          (p/finally done)))))

(deftest db-based-cycle-todo-uses-block-status-test
  (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        set-calls (atom [])]
    (with-redefs [property-handler/set-block-property!
                  (fn [& args]
                    (swap! set-calls conj (vec args)))]
      (editor/db-based-cycle-todo!
       {:block/uuid block-uuid
        :logseq.property/status {:db/ident :logseq.property/status.todo}})
      (is (= [[block-uuid :logseq.property/status :logseq.property/status.doing]]
             @set-calls)))))

(defn- follow-page-link-result
  [{:keys [page-title existing-page?]}]
  (let [events (atom [])
        redirects (atom [])
        worker-page-uuid (random-uuid)
        input-id "edit-block-test"
        input #js {:value (str "Open [[" page-title "]]")}]
    (p/with-redefs [state/get-edit-block (constantly {:block/uuid (random-uuid)})
                    state/get-edit-input-id (constantly input-id)
                    gdom/getElement (fn [id]
                                      (when (= input-id id)
                                        input))
                    cursor/pos (constantly 10)
                    editor/save-current-block! (constantly nil)
                    state/clear-editor-action! (constantly nil)
                    state/clear-edit! (constantly nil)
                    db-async/<get-block (fn [_repo title _opts]
                                          (p/resolved
                                           (when (and existing-page? (= page-title title))
                                             {:block/title title
                                              :block/uuid worker-page-uuid})))
                    state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       (p/resolved nil))
                    route-handler/redirect-to-page! (fn [& args]
                                                      (swap! redirects conj args))]
      (p/let [_ (editor/follow-link-under-cursor!)]
        {:events @events
         :redirects @redirects}))))

(deftest follow-link-under-cursor-opens-existing-page-test
  (async done
    (-> (follow-page-link-result {:page-title "Project"
                                  :existing-page? true})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (empty? events))
           (is (= [["Project"]] redirects))
           (done))))))

(deftest follow-link-under-cursor-creates-missing-page-test
  (async done
    (-> (follow-page-link-result {:page-title "May 15th, 2026"
                                  :existing-page? false})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (= [[:page/create "May 15th, 2026"]] events))
           (is (empty? redirects))
           (done))))))

(deftest follow-link-under-cursor-uses-worker-page-before-creating-test
  (async done
    (-> (follow-page-link-result {:page-title "May 15th, 2026"
                                  :existing-page? true})
        (p/then
         (fn [{:keys [events redirects]}]
           (is (empty? events))
           (is (= [["May 15th, 2026"]] redirects))
           (done))))))

(deftest follow-link-under-cursor-uses-worker-without-renderer-page-lookup-test
  (async done
    (let [page-title "Project"
          events (atom [])
          redirects (atom [])
          input-id "edit-block-test"
          input #js {:value (str "Open [[" page-title "]]")}]
      (p/with-redefs [state/get-edit-block (constantly {:block/uuid (random-uuid)})
                      state/get-edit-input-id (constantly input-id)
                      gdom/getElement (fn [id]
                                        (when (= input-id id)
                                          input))
                      cursor/pos (constantly 10)
                      editor/save-current-block! (constantly nil)
                      state/clear-editor-action! (constantly nil)
                      state/clear-edit! (constantly nil)
                      state/get-current-repo (constantly "test")
                      db-async/<get-block (fn [repo title opts]
                                            (is (string? repo))
                                            (is (= page-title title))
                                            (is (= {:children? false} opts))
                                            (p/resolved {:block/title title
                                                         :block/uuid (random-uuid)}))
                      state/pub-event! (fn [event]
                                         (swap! events conj event)
                                         (p/resolved nil))
                      route-handler/redirect-to-page! (fn [& args]
                                                        (swap! redirects conj args))]
        (-> (editor/follow-link-under-cursor!)
            (p/then
             (fn []
               (is (empty? @events))
               (is (= [[page-title]] @redirects))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(defn- keyup-handler
  "Spied version of editor/keyup-handler"
  [{:keys [value cursor-pos action commands]
    ;; Default to some commands matching which matches default behavior for most
    ;; completion scenarios
    :or {commands [:fake-command]}}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! action)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))
        input #js {:value value}
        command (subs value 1)]
    (with-redefs [editor/get-last-command (constantly command)
                  editor/get-matched-commands (constantly commands)
                  ;; Ignore as none of its behaviors are tested
                  editor/default-case-for-keyup-handler (constantly nil)
                  cursor/pos (constantly pos)]
      ((editor/keyup-handler nil input)
       #js {:key (subs value (dec (count value)))}
       nil))))

(deftest keyup-handler-test
  (testing "Command autocompletion"
    ;; default last matching command is ""
    (keyup-handler {:value "/z"
                    :action :commands
                    :commands []})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if no matches but differs from last success by <= 2 chars")

    (keyup-handler {:value "/zz"
                    :action :commands
                    :commands []})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if no matches but differs from last success by <= 2 chars")

    (keyup-handler {:value "/zzz"
                    :action :commands
                    :commands []})
    (is (= nil (state/get-editor-action))
        "Completion closed if no matches and > 2 chars form last success")

    (keyup-handler {:value "/b"
                    :action :commands
                    :commands [:fake-command]})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if there is a matching command")

    (keyup-handler {:value "/ " :action :commands})
    (is (= nil (state/get-editor-action))
        "Completion closed after a space follows /")

    (keyup-handler {:value "/block " :action :commands})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if space is part of the search term for /"))

  (testing "Tag autocompletion"
    (keyup-handler {:value "foo #b" :action :page-search-hashtag})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open for one tag")

    (keyup-handler {:value "text # #bar"
                    :action :page-search-hashtag
                    :cursor-pos 6})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open when typing tag before another tag"))
  ;; Reset state
  (state/set-editor-action! nil))

(defn- create-tag-with-alias!
  []
  (let [{:keys [init-tx block-props-tx]}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks [{:page {:block/title "Project Tag"}
                              :blocks []}
                             {:page {:block/title "Alias Only"}
                              :blocks []}]
          :auto-create-ontology? true})
        init-index (map #(select-keys % [:block/uuid]) init-tx)
        test-conn (conn/get-db test-helper/test-db false)]
    (d/transact! test-conn (concat init-index init-tx block-props-tx)))
  (let [test-db (conn/get-db test-helper/test-db)
        class (ldb/get-case-page test-db "Project Tag")
        alias (ldb/get-case-page test-db "Alias Only")]
    (d/transact! (conn/get-db test-helper/test-db false)
                 [{:db/id (:db/id class)
                   :block/alias #{(:db/id alias)}
                   :block/tags #{:logseq.class/Tag}}])))

(deftest get-matched-classes-includes-class-aliases
  (async done
    (let [class-uuid #uuid "11111111-1111-1111-1111-111111111111"
          alias-uuid #uuid "22222222-2222-2222-2222-222222222222"
          alias {:db/id 2
                 :block/uuid alias-uuid
                 :block/title "Alias Only"}
          class {:db/id 1
                 :block/uuid class-uuid
                 :block/title "Project Tag"
                 :block/alias #{alias}}
          original-<get-all-classes db-async/<get-all-classes
          original-<invoke-db-worker state/<invoke-db-worker
          previous-worker @state/*db-worker]
      (set! state/<invoke-db-worker (fn [& _args] (p/resolved nil)))
      (reset! state/*db-worker (fn [& _args] (p/resolved nil)))
      (create-tag-with-alias!)
      (set! db-async/<get-all-classes (fn [_repo _opts]
                                        (p/resolved [class])))
      (-> (p/let [title-matches (editor/get-matched-classes "Project Tag")
                  alias-matches (editor/get-matched-classes "Alias Only")]
            (is (= ["Project Tag"]
                   (map :block/title title-matches))
                "Existing tag title matching still works")
            (is (= ["Alias Only"]
                   (map :block/title alias-matches))
                "Tag aliases stay available as tag completion choices"))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (set! db-async/<get-all-classes original-<get-all-classes)
                       (set! state/<invoke-db-worker original-<invoke-db-worker)
                       (reset! state/*db-worker previous-worker)
                       (done)))))))

(deftest tag-search-does-not-convert-class-aliases
  (async done
    (let [matched-pages (atom nil)
          original-<get-block db-async/<get-block
          original-<get-all-classes db-async/<get-all-classes
          original-<invoke-db-worker state/<invoke-db-worker
          previous-worker @state/*db-worker]
      (set! state/<invoke-db-worker (fn [& _args] (p/resolved nil)))
      (reset! state/*db-worker (fn [& _args] (p/resolved nil)))
      (create-tag-with-alias!)
      (set! db-async/<get-block (fn [_repo _title _opts]
                                  (let [test-db (conn/get-db test-helper/test-db)
                                        alias (ldb/get-page test-db "Alias Only")]
                                    (p/resolved (assoc alias :block/alias-source-page-class? true)))))
      (set! db-async/<get-all-classes
            (fn [_repo _opts]
              (let [test-db (conn/get-db test-helper/test-db)
                    alias (ldb/get-case-page test-db "Alias Only")
                    class (assoc (select-keys (ldb/get-case-page test-db "Project Tag")
                                              [:db/id :block/uuid :block/title])
                                 :block/alias #{(select-keys alias [:db/id :block/uuid :block/title])})]
                (p/resolved [class]))))
      (-> (#'editor-component/search-pages "Alias Only" true #(reset! matched-pages %) (fn [_]))
          (p/then
           (fn []
             (is (some #(= "Alias Only" (:block/title %)) @matched-pages)
                 "The alias is still selectable from tag completion")
             (is (not-any? :convert-page-to-tag? @matched-pages)
                 "A class alias must not show a redundant Convert action")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally (fn []
                       (set! db-async/<get-block original-<get-block)
                       (set! db-async/<get-all-classes original-<get-all-classes)
                       (set! state/<invoke-db-worker original-<invoke-db-worker)
                       (reset! state/*db-worker previous-worker)
                       (done)))))))

(defn- default-keyup-result
  [{:keys [value cursor-pos key code action is-processed?]
    :or {code "KeyA"
         is-processed? false}}]
  (let [pos (or cursor-pos (count value))
        input #js {:id "edit-block-test"
                   :value value}
        content (atom nil)
        cursor-pos' (atom nil)
        steps (atom [])]
    (with-redefs [state/get-editor-action (constantly action)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos' pos'))
                  state/set-editor-action-data! (constantly nil)
                  state/set-editor-last-pos! (fn [pos']
                                               (reset! cursor-pos' pos'))
                  state/clear-editor-action! (constantly nil)
                  util/get-selected-text (constantly "")
                  cursor/pos (constantly pos)
                  cursor/get-caret-pos (fn [_] {:pos @cursor-pos'})
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos' pos'))
                  commands/handle-step (fn [step]
                                         (swap! steps conj step))]
      (#'editor/default-case-for-keyup-handler input pos key code is-processed?)
      {:content @content
       :cursor-pos @cursor-pos'
       :steps @steps})))

(deftest default-keyup-handler-normalizes-fullwidth-page-ref-input
  (doseq [[value cursor-pos expected-content expected-pos]
          [["【【" 2 "[[]]" 2]
           ["【【】" 3 "[[]]" 2]
           ["【】【】" 4 "[[]]" 2]
           ["【【】】" 2 "[[]]" 2]
           ;; cursor=1: IME may place cursor early; full pattern must still match
           ["【【】】" 1 "[[]]" 2]
           ["abc【【】】def" 5 "abc[[]]def" 5]
           ["abc【】【】def" 7 "abc[[]]def" 5]]]
    (is (= {:content expected-content
            :cursor-pos expected-pos
            :steps [[:editor/search-page]]}
           (default-keyup-result {:value value
                                  :cursor-pos cursor-pos
                                  :key "Process"
                                  :is-processed? true}))
        (str "Normalizes " value " at cursor " cursor-pos))))

(deftest default-keyup-handler-normalizes-hashtag-fullwidth-page-ref-input
  (is (= {:content "#[[]]"
          :cursor-pos 3
          :steps [[:editor/search-page-hashtag]]}
         (default-keyup-result {:value "#【】【】"
                                :cursor-pos 5
                                :key "Process"
                                :is-processed? true
                                :action :page-search-hashtag}))))

(deftest default-keyup-handler-ignores-non-page-ref-trigger-key
  (is (= {:content nil
          :cursor-pos nil
          :steps []}
         (default-keyup-result {:value "【【】】"
                                :cursor-pos 2
                                :key "a"}))))

(deftest keydown-not-matched-handler-wraps-selected-text-with-single-dollar
  (let [content (atom nil)
        cursor-pos (atom nil)
        selection-range (atom nil)
        input #js {:id "edit-block-test"
                   :value "inline math"
                   :setSelectionRange (fn [start end]
                                        (reset! selection-range [start end]))}
        event #js {:key "$"
                   :ctrlKey false
                   :metaKey false}
        selected "math"]
    (with-redefs [state/get-edit-input-id (constantly "edit-block-test")
                  state/get-input (constantly input)
                  state/get-editor-action (constantly nil)
                  state/set-state! (constantly nil)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos pos'))
                  gdom/getElement (constantly input)
                  util/get-selected-text (constantly selected)
                  util/stop (constantly nil)
                  cursor/pos (constantly 7)
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos pos'))]
      ((editor/keydown-not-matched-handler :markdown) event nil)
      (is (= "inline $math$" @content))
      (is (= 8 @cursor-pos))
      (is (= [8 12] @selection-range)))))

(defn- keydown-dollar-without-selection-result
  [{:keys [value cursor-pos]}]
  (let [content (atom nil)
        cursor-pos' (atom nil)
        input #js {:id "edit-block-test"
                   :value value}
        event #js {:key "$"
                   :ctrlKey false
                   :metaKey false}]
    (with-redefs [state/get-edit-input-id (constantly "edit-block-test")
                  state/get-input (constantly input)
                  state/get-editor-action (constantly nil)
                  state/set-state! (constantly nil)
                  state/set-block-content-and-last-pos! (fn [_input-id value' pos']
                                                          (reset! content value')
                                                          (reset! cursor-pos' pos'))
                  gdom/getElement (constantly input)
                  util/get-selected-text (constantly "")
                  util/stop (constantly nil)
                  cursor/pos (constantly cursor-pos)
                  cursor/move-cursor-to (fn [_ pos' & _]
                                          (reset! cursor-pos' pos'))]
      ((editor/keydown-not-matched-handler :markdown) event nil)
      {:content @content
       :cursor-pos @cursor-pos'})))

(deftest keydown-not-matched-handler-expands-dollar-delimiters-without-selection
  (is (= {:content "inline $$"
          :cursor-pos 8}
         (keydown-dollar-without-selection-result {:value "inline "
                                                   :cursor-pos 7})))
  (is (= {:content "inline $$$$"
          :cursor-pos 9}
         (keydown-dollar-without-selection-result {:value "inline $$"
                                                   :cursor-pos 8}))))

(defn- delete-block-at-zero-pos-result
  [block]
  (let [deleted? (atom false)
        stopped? (atom false)
        input #js {:value ""}]
    (with-redefs [state/get-input (constantly input)
                  cursor/pos (constantly 0)
                  util/stop (fn [_] (reset! stopped? true))
                  state/get-current-repo (constantly test-helper/test-db)
                  state/get-edit-block (constantly block)
                  ldb/get-left-sibling (constantly nil)
                  editor/get-state (constantly {:config {}})
                  editor/delete-block! (fn [_] (reset! deleted? true))]
      (#'editor/delete-block-when-zero-pos! nil)
      {:deleted? @deleted?
       :stopped? @stopped?})))

(deftest delete-block-when-zero-pos-keeps-asset-block-test
  (testing "Backspace at the start of an asset block does not delete the block"
    (is (= {:deleted? false
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}
             :logseq.property.asset/type "png"})))))

(deftest delete-block-when-zero-pos-keeps-comments-block-test
  (testing "Backspace at the start of a Comments block does not delete the block"
    (is (= {:deleted? false
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}
             :block/tags [{:db/ident :logseq.class/Comments}]})))))

(deftest delete-block-when-zero-pos-keeps-regular-empty-block-behavior-test
  (testing "Backspace at the start of a regular empty block still deletes it"
    (is (= {:deleted? true
            :stopped? true}
           (delete-block-at-zero-pos-result
            {:db/id 1
             :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
             :block/title ""
             :block/page {:db/id 10}})))))

(deftest move-to-prev-block-edit-fn-focuses-merged-asset-title-test
  (async done
    (let [asset-block {:db/id 1
                       :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                       :block/title ""
                       :logseq.property.asset/type "png"}
          sibling-dom #js {:getAttribute #({"blockid" (str (:block/uuid asset-block))
                                            "containerid" nil} %)}
          edit-calls (atom [])
          original-<get-block db-async/<get-block
          original-edit-block! editor/edit-block!]
      (set! db-async/<get-block
            (fn [_repo id _opts]
              (when (= id (:block/uuid asset-block))
                (p/resolved asset-block))))
      (set! editor/edit-block!
            (fn [block pos opts]
              (swap! edit-calls conj {:block block
                                      :pos pos
                                      :opts opts})))
      (-> (p/let [{:keys [new-content pos edit-block-f]} (#'editor/move-to-prev-block
                                                          test-helper/test-db
                                                          sibling-dom
                                                          "after")]
            (is (= "after" new-content))
            (is (= 0 pos))
            (edit-block-f)
            (is (= [{:block asset-block
                     :pos 0
                     :opts {:custom-content "after"
                            :tail-len 5
                            :container-id nil}}]
                   @edit-calls)))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (set! db-async/<get-block original-<get-block)
                       (set! editor/edit-block! original-edit-block!)
                       (done)))))))

(deftest move-to-prev-block-edit-fn-uses-loaded-sibling-entity-test
  (async done
    (let [sibling-block {:db/id 1
                         :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                         :block/title "before"}
          sibling-dom #js {:getAttribute #({"blockid" (str (:block/uuid sibling-block))
                                            "containerid" nil} %)}
          worker-lookups (atom [])
          edit-calls (atom [])
          original-<get-block db-async/<get-block
          original-get-edit-block state/get-edit-block
          original-edit-block! editor/edit-block!]
      (set! db-async/<get-block
            (fn [_repo id _opts]
              (swap! worker-lookups conj id)
              (when (= id (:block/uuid sibling-block))
                (p/resolved sibling-block))))
      (set! state/get-edit-block (constantly nil))
      (set! editor/edit-block!
            (fn [block pos opts]
              (swap! edit-calls conj {:block block
                                      :pos pos
                                      :opts opts})))
      (-> (p/let [{:keys [new-content pos edit-block-f]} (#'editor/move-to-prev-block
                                                          test-helper/test-db
                                                          sibling-dom
                                                          "after")]
            (is (= "beforeafter" new-content))
            (is (= 6 pos))
            (edit-block-f)
            (is (= [(:block/uuid sibling-block)]
                   @worker-lookups))
            (is (= [{:block sibling-block
                     :pos 6
                     :opts {:custom-content "beforeafter"
                            :tail-len 5
                            :container-id nil}}]
                   @edit-calls)))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (set! db-async/<get-block original-<get-block)
                       (set! state/get-edit-block original-get-edit-block)
                       (set! editor/edit-block! original-edit-block!)
                       (done)))))))

(defn- handle-last-input-handler
  "Spied version of editor/handle-last-input"
  [{:keys [value cursor-pos editor-config]}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! nil)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))]
    (with-redefs [state/get-input (constantly #js {:value value})
                  state/get-editor-args (constantly [nil nil editor-config])
                  cursor/pos (constantly pos)
                  cursor/move-cursor-backward (constantly nil) ;; ignore if called
                  cursor/get-caret-pos (constantly {})]
      (editor/handle-last-input))))

(deftest handle-last-input-handler-test
  (testing "Command autocompletion"
    (handle-last-input-handler {:value "/"})
    (is (= :commands (state/get-editor-action))
        "Command search if only / has been typed")

    (handle-last-input-handler {:value "some words /"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of new word")

    (handle-last-input-handler {:value "a line\n/"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of a new line")

    (handle-last-input-handler {:value "/"
                                :editor-config {:comment-editor? true}})
    (is (= nil (state/get-editor-action))
        "No command search in comment editors")

    (handle-last-input-handler {:value "https://"})
    (is (= nil (state/get-editor-action))
        "No command search in middle of a word")

    (handle-last-input-handler {:value "#blah/"})
    (is (= nil (state/get-editor-action))
        "No command search after a tag search to allow for namespace completion"))

  (testing "Tag autocompletion"
    (handle-last-input-handler {:value "#"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if only hashtag has been typed")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag has been typed at EOL")

    (handle-last-input-handler {:value "#Some words"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at start of line and there are existing words")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at EOL and after a space")

    (handle-last-input-handler {:value "foo #bar"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is in middle of line and after a space")

    (handle-last-input-handler {:value "String#" :cursor-pos 7})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag has been typed at end of a word")

    (handle-last-input-handler {:value "foo#bar" :cursor-pos 4})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag is in middle of word")

    (handle-last-input-handler {:value "`String#gsub and String#`"
                                :cursor-pos (dec (count "`String#gsub and String#`"))})
    (is (= nil (state/get-editor-action))
        "No page search within backticks"))

  (testing "Comment editors do not open tag autocompletion"
    (handle-last-input-handler {:value "#"
                                :cursor-pos 1
                                :editor-config {:comment-editor? true}})
    (is (= nil (state/get-editor-action))
        "No tag search in comment editors"))
  ;; Reset state
  (state/set-editor-action! nil))

(deftest comment-editor-quote-trigger-does-not-convert-draft-block
  (let [input #js {:id "edit-block-test"
                   :value ">"}
        events (atom [])]
    (with-redefs [cursor/pos (constantly 1)
                  state/get-editor-args (constantly [nil nil {:comment-editor? true}])
                  state/set-edit-content! (fn [& _])
                  state/pub-event! (fn [event] (swap! events conj event))
                  editor/default-case-for-keyup-handler (fn [& _])]
      ((editor/keyup-handler nil input) #js {:key ">"} nil)
      (is (empty? @events)
          "Comment editor > should stay plain text instead of converting the draft to a quote block"))))

(deftest comment-editor-collapse-expand-shortcuts-do-not-touch-draft-blocks
  (let [draft-uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        expanded (atom [])
        collapsed (atom [])]
    (with-redefs [state/editing? (constantly true)
                  state/get-editor-args (constantly [nil nil {:comment-editor? true}])
                  state/get-edit-block (constantly {:block/uuid draft-uuid})
                  editor/expand-block! (fn [block-id] (swap! expanded conj block-id))
                  editor/collapse-block! (fn [block-id] (swap! collapsed conj block-id))
                  util/stop (constantly nil)]
      (editor/expand! nil)
      (editor/collapse! nil)
      (is (empty? @expanded)
          "Comment editor expand shortcut should not expand synthetic draft blocks")
      (is (empty? @collapsed)
          "Comment editor collapse shortcut should not collapse synthetic draft blocks"))))

(deftest db-based-save-assets-honors-explicit-target-block
  (async done
    (let [draft-uuid #uuid "8789a99e-5147-41a1-a836-4e0a6f03fe9e"
          target-block {:block/uuid #uuid "aa2b426a-7357-452d-a5cc-f1d9117b1772"
                        :block/title "Comments"}
          inserted (atom nil)
          original-ensure-assets-dir! assets-handler/ensure-assets-dir!
          original-get-file-checksum assets-handler/get-file-checksum
          original-exceed-limit-size? assets-handler/exceed-limit-size?
          original-<get-today-journal-title db-async/<get-today-journal-title
          original-<get-journal-page-by-day db-async/<get-journal-page-by-day
          original-db-based-write-asset! editor/db-based-write-asset!
          original-insert-blocks! outliner-op/insert-blocks!
          original-<get-blocks db-async/<get-blocks
          original-get-edit-block state/get-edit-block
          original-get-edit-content state/get-edit-content
          original-get-editor-args state/get-editor-args]
      (set! assets-handler/ensure-assets-dir! (fn [_repo]
                                                (p/resolved ["/tmp/repo" "assets"])))
      (set! assets-handler/get-file-checksum (constantly nil))
      (set! assets-handler/exceed-limit-size? (constantly false))
      (set! db-async/<get-today-journal-title (fn [_repo]
                                                (p/resolved "Today")))
      (set! db-async/<get-journal-page-by-day (fn [_repo _journal-day]
                                                (p/resolved {:block/uuid #uuid "f43caf78-18c4-4724-99d2-b2f61f697a0e"})))
      (set! editor/db-based-write-asset! (fn [& _args]
                                           (p/resolved nil)))
      (set! outliner-op/insert-blocks! (fn [blocks target opts]
                                         (reset! inserted {:blocks blocks
                                                           :target target
                                                           :opts opts})))
      (set! db-async/<get-blocks (fn [_repo blocks _opts]
                                   (p/resolved (mapv (fn [block]
                                                       {:block/uuid block})
                                                     blocks))))
      (set! state/get-edit-block (constantly {:block/uuid draft-uuid
                                              :block/title ""}))
      (set! state/get-edit-content (constantly ""))
      (set! state/get-editor-args (constantly [nil nil {:comment-editor? true
                                                        :comment-asset-target-block target-block}]))
      (-> (editor/db-based-save-assets! "repo" [#js {:name "image.jpeg"}]
                                        :target-block target-block)
          (p/then (fn [_]
                    (is (= target-block (:target @inserted)))
                    (is (= {:bottom? true
                            :keep-uuid? true
                            :replace-empty-target? false
                            :sibling? false}
                           (:opts @inserted)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (set! assets-handler/ensure-assets-dir! original-ensure-assets-dir!)
                       (set! assets-handler/get-file-checksum original-get-file-checksum)
                       (set! assets-handler/exceed-limit-size? original-exceed-limit-size?)
                       (set! db-async/<get-today-journal-title original-<get-today-journal-title)
                       (set! db-async/<get-journal-page-by-day original-<get-journal-page-by-day)
                       (set! editor/db-based-write-asset! original-db-based-write-asset!)
                       (set! outliner-op/insert-blocks! original-insert-blocks!)
                       (set! db-async/<get-blocks original-<get-blocks)
                       (set! state/get-edit-block original-get-edit-block)
                       (set! state/get-edit-content original-get-edit-content)
                       (set! state/get-editor-args original-get-editor-args)
                       (done)))))))

(deftest db-based-save-assets-ignores-stale-comment-target-without-explicit-target
  (async done
    (let [edit-block {:block/uuid #uuid "f387fbb5-ef2a-41f7-9b99-f49b91a61cde"
                      :block/title "Current block"}
          stale-comment-target {:block/uuid #uuid "4da73880-13d5-4952-86fc-eb1be04bb030"
                                :block/title "Stale comments"}
          inserted (atom nil)
          original-ensure-assets-dir! assets-handler/ensure-assets-dir!
          original-get-file-checksum assets-handler/get-file-checksum
          original-exceed-limit-size? assets-handler/exceed-limit-size?
          original-<get-today-journal-title db-async/<get-today-journal-title
          original-<get-journal-page-by-day db-async/<get-journal-page-by-day
          original-db-based-write-asset! editor/db-based-write-asset!
          original-insert-blocks! outliner-op/insert-blocks!
          original-<get-blocks db-async/<get-blocks
          original-get-edit-block state/get-edit-block
          original-get-edit-content state/get-edit-content
          original-get-editor-args state/get-editor-args]
      (set! assets-handler/ensure-assets-dir! (fn [_repo]
                                                (p/resolved ["/tmp/repo" "assets"])))
      (set! assets-handler/get-file-checksum (constantly nil))
      (set! assets-handler/exceed-limit-size? (constantly false))
      (set! db-async/<get-today-journal-title (fn [_repo]
                                                (p/resolved "Today")))
      (set! db-async/<get-journal-page-by-day (fn [_repo _journal-day]
                                                (p/resolved {:block/uuid #uuid "f43caf78-18c4-4724-99d2-b2f61f697a0e"})))
      (set! editor/db-based-write-asset! (fn [& _args]
                                           (p/resolved nil)))
      (set! outliner-op/insert-blocks! (fn [blocks target opts]
                                         (reset! inserted {:blocks blocks
                                                           :target target
                                                           :opts opts})))
      (set! db-async/<get-blocks (fn [_repo blocks _opts]
                                   (p/resolved (mapv (fn [block]
                                                       {:block/uuid block})
                                                     blocks))))
      (set! state/get-edit-block (constantly edit-block))
      (set! state/get-edit-content (constantly "Current block"))
      (set! state/get-editor-args (constantly [nil nil {:comment-editor? true
                                                        :comment-asset-target-block stale-comment-target}]))
      (-> (editor/db-based-save-assets! "repo" [#js {:name "image.jpeg"}])
          (p/then (fn [_]
                    (is (= edit-block (:target @inserted)))
                    (is (= {:bottom? true
                            :keep-uuid? true
                            :replace-empty-target? true
                            :sibling? true}
                           (:opts @inserted)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (set! assets-handler/ensure-assets-dir! original-ensure-assets-dir!)
                       (set! assets-handler/get-file-checksum original-get-file-checksum)
                       (set! assets-handler/exceed-limit-size? original-exceed-limit-size?)
                       (set! db-async/<get-today-journal-title original-<get-today-journal-title)
                       (set! db-async/<get-journal-page-by-day original-<get-journal-page-by-day)
                       (set! editor/db-based-write-asset! original-db-based-write-asset!)
                       (set! outliner-op/insert-blocks! original-insert-blocks!)
                       (set! db-async/<get-blocks original-<get-blocks)
                       (set! state/get-edit-block original-get-edit-block)
                       (set! state/get-edit-content original-get-edit-content)
                       (set! state/get-editor-args original-get-editor-args)
                       (done)))))))

(deftest save-block!
  (async done
    (testing "Saving blocks with and without properties"
      (test-helper/load-test-files [{:page {:block/title "foo"}
                                     :blocks [{:block/title "foo"
                                               :build/properties {:logseq.property/heading 1}}]}])
      (let [repo test-helper/test-db
            block-uuid (random-uuid)
            block {:db/id 1
                   :block/uuid block-uuid
                   :block/title "foo"
                   :logseq.property/heading 1}
            tx-calls (atom [])
            original-<get-block db-async/<get-block
            original-apply-outliner-ops db-transact/apply-outliner-ops
            original-<invoke-db-worker state/<invoke-db-worker]
        (set! state/<invoke-db-worker (fn [& _args] (p/resolved nil)))
        (set! db-async/<get-block (fn [_repo id _opts]
                                    (p/resolved (assoc block :block/uuid id))))
        (set! db-transact/apply-outliner-ops
              (fn [db ops opts]
                (swap! tx-calls conj [db ops opts])
                :tx))
        (-> (p/do!
             (editor/save-block! repo block-uuid "# bar")
             (editor/save-block! repo block-uuid "# bar")
	             (is (= [[nil
	                       [[:save-block [{:block/title "bar"
	                                        :block/uuid block-uuid
	                                        :block/tags ()
	                                        :block/refs ()
	                                        :logseq.property/heading 1}
	                                       nil]]]
	                       {:outliner-op :save-block}]
	                      [nil
	                       [[:save-block [{:block/title "bar"
	                                        :block/uuid block-uuid
	                                        :block/tags ()
	                                        :block/refs ()
	                                        :logseq.property/heading 1}
	                                       nil]]]
	                       {:outliner-op :save-block}]]
	                    @tx-calls)))
            (p/catch (fn [error]
                       (is false (str error))))
            (p/finally (fn []
                         (set! db-async/<get-block original-<get-block)
                         (set! db-transact/apply-outliner-ops original-apply-outliner-ops)
                         (set! state/<invoke-db-worker original-<invoke-db-worker)
                         (done))))))))

(deftest block-default-collapsed-respects-ignore-block-collapsed-flag
  (is (true? (editor/block-default-collapsed?
              {:block/collapsed? true}
              {})))
  (is (not (editor/block-default-collapsed?
            {:block/collapsed? true}
            {:ignore-block-collapsed? true}))
      "Flashcard review should be able to ignore persisted collapsed state")
  (is (true? (editor/block-default-collapsed?
              {:block/collapsed? false}
              {:ignore-block-collapsed? true
               :default-collapsed? true}))
      "Ignore flag should not disable other default-collapsed rules"))

(deftest load-children-respects-ignore-block-collapsed-flag
  (is (false? (#'editor/load-children?
               {:block/collapsed? true}
               nil
               false))
      "Collapsed blocks should not load children by default")
  (is (true? (#'editor/load-children?
              {:block/collapsed? true}
              nil
              true))
      "Flashcard answer mode should force loading children for collapsed blocks")
  (is (true? (#'editor/load-children?
              {:block/collapsed? true}
              false
              false))
      "Temporary expanded UI state should load children")
  (is (false? (#'editor/load-children?
               {:block/collapsed? false}
               true
               false))
      "Temporary collapsed UI state should skip children loading"))

(deftest paste-cut-recycled-block-moves-existing-node-out-of-recycle
  (test-helper/load-test-files [{:page {:block/title "Page 1"}
                                 :blocks [{:block/title "source"}]}
                                {:page {:block/title "Page 2"}
                                 :blocks [{:block/title "target"}]}])
  (let [source (test-helper/find-block-by-content "source")
        target (test-helper/find-block-by-content "target")
        test-db (conn/get-db test-helper/test-db)
        recycle-page (ldb/get-page test-db "Recycle")]
    (outliner-core/delete-blocks! (conn/get-db test-helper/test-db false) [source] {})
    (state/set-block-op-type! :cut)
    (editor/paste-blocks [{:block/uuid (:block/uuid source)
                           :block/title "source"}]
                         {:target-block target
                          :sibling? true
                          :keep-uuid? true
                          :ops-only? true})
    (let [source' (db-utils/entity (conn/get-db test-helper/test-db)
                                   [:block/uuid (:block/uuid source)])]
      (is (= (:db/id (:block/page target)) (:db/id (:block/page source'))))
      (is (= (:db/id (:block/parent target)) (:db/id (:block/parent source'))))
      (is (nil? (:logseq.property/deleted-at source')))
      (is (nil? (:logseq.property.recycle/original-page source')))
      (is (not= (:db/id recycle-page) (:db/id (:block/page source')))))))

(deftest paste-og-copied-heading-page-refs-creates-journal-pages
  (async done
    (db/transact! [{:db/ident :logseq.class/Journal
                    :logseq.property.journal/title-format "yyyy-MM-dd"}])
    (let [target {:db/id 10
                  :block/uuid (random-uuid)
                  :block/title "target"
                  :block/page {:db/id 1
                               :block/name "paste target"}}
          clipboard "- ## [[2026-06-15]]\n\t- Nudeln mit Soße"
          inserted (atom nil)]
      (p/with-redefs [state/get-edit-block (constantly target)
                      state/get-edit-content (constantly (:block/title target))
                      state/get-block-op-type (constantly nil)
                      state/set-block-op-type! (constantly nil)
                      state/get-current-page (constantly "Paste target")
                      state/get-date-formatter (constantly "yyyy-MM-dd")
                      db-async/<get-today-journal-title (fn [_repo]
                                                         (p/resolved "Today"))
                      db-async/<get-journal-page-by-day (fn [_repo _journal-day]
                                                         (p/resolved nil))
                      state/<invoke-db-worker <pull-page-from-test-db
                      outliner-op/insert-blocks! (fn [blocks target opts]
                                                   (reset! inserted {:blocks blocks
                                                                     :target target
                                                                     :opts opts})
                                                   blocks)
                      editor/edit-block! (constantly nil)]
        (-> (#'paste-handler/paste-text-parseable :markdown clipboard)
            (p/then
             (fn [_]
               (let [heading-block (first (:blocks @inserted))
                     journal (first (:block/refs heading-block))]
                 (is (= "2026-06-15" (:block/title journal)))
                 (is (= 20260615 (:block/journal-day journal)))
                 (is (= {:logseq.property/heading 2
                         :block/title (str "[[" (:block/uuid journal) "]]")}
                        (select-keys heading-block [:block/title :logseq.property/heading])))
                 (is (= [20260615]
                        (mapv :block/journal-day (:block/refs heading-block))))
                 (is (= target (:target @inserted)))
                 (done))))
            (p/catch
             (fn [e]
               (is false (str e))
               (done))))))))

(deftest paste-og-copied-heading-page-refs-uses-default-journal-title
  (async done
    (let [target {:db/id 10
                  :block/uuid (random-uuid)
                  :block/title "target"
                  :block/page {:db/id 1
                               :block/name "paste target"}}
          clipboard "- ## [[2026-06-15]]\n\t- Nudeln mit Soße"
          inserted (atom nil)]
      (p/with-redefs [state/get-edit-block (constantly target)
                      state/get-edit-content (constantly (:block/title target))
                      state/get-block-op-type (constantly nil)
                      state/set-block-op-type! (constantly nil)
                      state/get-current-page (constantly "Paste target")
                      state/get-date-formatter (constantly "MMM do, yyyy")
                      db-async/<get-today-journal-title (fn [_repo]
                                                         (p/resolved "Today"))
                      db-async/<get-journal-page-by-day (fn [_repo _journal-day]
                                                         (p/resolved nil))
                      state/<invoke-db-worker <pull-page-from-test-db
                      outliner-op/insert-blocks! (fn [blocks target opts]
                                                   (reset! inserted {:blocks blocks
                                                                     :target target
                                                                     :opts opts})
                                                   blocks)
                      editor/edit-block! (constantly nil)]
        (-> (#'paste-handler/paste-text-parseable :markdown clipboard)
            (p/then
             (fn [_]
               (let [heading-block (first (:blocks @inserted))
                     journal (first (:block/refs heading-block))]
                 (is (= "Jun 15th, 2026" (:block/title journal)))
                 (is (= 20260615 (:block/journal-day journal)))
                 (is (= {:logseq.property/heading 2
                         :block/title (str "[[" (:block/uuid journal) "]]")}
                        (select-keys heading-block [:block/title :logseq.property/heading])))
                 (is (= [20260615]
                        (mapv :block/journal-day (:block/refs heading-block))))
                 (is (= target (:target @inserted)))
                 (done))))
            (p/catch
             (fn [e]
               (is false (str e))
               (done))))))))

(deftest focused-root-block-operation-guards-test
  (let [root-block {:db/id 1}
        focused-root-block {:db/id 1}
        root-child-block {:db/id 2
                          :block/parent {:db/id 1}}
        non-root-block {:db/id 3
                        :block/parent {:db/id 9}}
        comments-area {:db/id 4
                       :block/tags [{:db/ident :logseq.class/Comments}]}
        comment-block {:db/id 5
                       :block/parent comments-area}]
    (testing "Root block cannot be indented or outdented when focused"
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-block true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-block false focused-root-block))))
    (testing "A direct child of focused root cannot be outdented but can be indented"
      (is (false? (#'editor/block-eligible-for-indent-outdent? root-child-block false focused-root-block)))
      (is (true? (#'editor/block-eligible-for-indent-outdent? root-child-block true focused-root-block))))
    (testing "Non-root blocks keep normal indent/outdent behavior"
      (is (true? (#'editor/block-eligible-for-indent-outdent? non-root-block true focused-root-block)))
      (is (true? (#'editor/block-eligible-for-indent-outdent? non-root-block false focused-root-block))))
    (testing "Root block cannot move up/down when focused"
      (is (false? (#'editor/block-eligible-for-move-up-down? root-block focused-root-block)))
      (is (true? (#'editor/block-eligible-for-move-up-down? non-root-block focused-root-block))))
    (testing "Comment area and comment blocks cannot be indented, outdented, or moved up/down"
      (is (false? (#'editor/block-eligible-for-indent-outdent? comments-area true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comment-block true focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comments-area false focused-root-block)))
      (is (false? (#'editor/block-eligible-for-indent-outdent? comment-block false focused-root-block)))
      (is (false? (#'editor/block-eligible-for-move-up-down? comments-area focused-root-block)))
      (is (false? (#'editor/block-eligible-for-move-up-down? comment-block focused-root-block))))))

(deftest navigable-sibling-block-skips-comment-items-test
  (let [current-node (js-obj "id" "current")
        comment-node (js-obj "id" "comment"
                             "blockid" "6a073572-fefe-44c5-8b43-267ccc715077"
                             "data-comment-item" "true")
        target-node (js-obj "id" "target"
                            "blockid" "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comment-node
                      (= node comment-node) target-node))]
    (is (true? (#'editor/comment-item-node? comment-node)))
    (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {})))))

(deftest navigable-sibling-block-skips-comments-area-test
  (let [current-node (js-obj "id" "current")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) target-node))]
    (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {}))
        "Cursor boundary navigation should skip comments area")))

(deftest navigable-sibling-block-enters-comments-area-for-up-down-test
  (let [current-node (js-obj "id" "current")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) target-node))]
    (is (= comments-node (#'editor/navigable-sibling-block current-node sibling-f {:up-down? true}))
        "Up/down navigation should enter comments instead of skipping the comments area")))

(deftest navigable-sibling-block-skips-open-comments-subtree-for-left-right-test
  (let [current-node (js-obj "id" "current")
        comment-node (js-obj "id" "comment" "nodeType" 1)
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true"
                              "nodeType" 1
                              "contains" (fn [node] (= node comment-node)))
        target-node (js-obj "id" "target")
        sibling-f (fn [node _opts]
                    (cond
                      (= node current-node) comments-node
                      (= node comments-node) comment-node))]
    (with-redefs [util/get-blocks-noncollapse (fn [] [current-node comments-node comment-node target-node])]
      (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {:direction :right}))
          "Left/right navigation should skip the whole open comments subtree"))))

(deftest navigable-sibling-block-skips-comment-item-before-block-below-comments-test
  (let [target-node (js-obj "id" "target")
        comments-node (js-obj "id" "comments"
                              "data-comments-area" "true")
        comment-uuid #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        comment-node (js-obj "id" "comment"
                             "blockid" (str comment-uuid)
                             "data-comment-item" "true")
        current-node (js-obj "id" "current")
        sibling-f (fn [node _opts]
                    (when (= node current-node)
                      comment-node))]
    (with-redefs [util/get-blocks-noncollapse (fn [] [target-node comments-node comment-node current-node])]
      (is (= target-node (#'editor/navigable-sibling-block current-node sibling-f {:direction :left}))
          "Left/right navigation from a block below open comments should skip comment items and the comments area"))))

(deftest enter-comments-area-node-focuses-reply-input-test
  (let [comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        focused? (atom false)
        selected (atom nil)
        input (js-obj "focus" #(reset! focused? true))
        comments-node (js-obj "id" "comments"
                              "blockid" (str comments-id)
                              "data-collapsed" "false"
                              "querySelector" (fn [_selector] input))]
    (with-redefs [state/clear-edit! (fn [])
                  state/get-current-page (fn [] (str comments-id))
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (true? @focused?)
          "Open comments should focus the reply input when the comments block is the current page")
      (is (nil? @selected)
          "Open comments should not select the comments area when the reply input exists"))))

(deftest enter-comments-area-node-activates-inline-reply-placeholder-test
  (let [selected (atom nil)
        clicked? (atom false)
        comments-id #uuid "6a073572-fefe-44c5-8b43-267ccc715077"
        placeholder (js-obj "click" #(reset! clicked? true))
        comments-node (js-obj "id" "comments"
                              "blockid" (str comments-id)
                              "data-collapsed" "false"
                              "querySelector" (fn [selector]
                                                (when (= selector ".ls-comment-reply-placeholder")
                                                  placeholder)))]
    (with-redefs [state/clear-edit! (fn [])
                  state/get-current-page (fn [] "fd94c4c7-bfb8-49d5-bbb1-46617e4f2154")
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (true? @clicked?)
          "Open inline comments should activate the reply placeholder when entered by arrow navigation")
      (is (nil? @selected)))))

(deftest enter-comments-area-node-selects-collapsed-comments-test
  (let [selected (atom nil)
        comments-node (js-obj "id" "comments"
                              "data-collapsed" "true")]
    (with-redefs [state/clear-edit! (fn [])
                  state/exit-editing-and-set-selected-blocks! (fn [blocks] (reset! selected blocks))]
      (#'editor/enter-comments-area-node! comments-node)
      (is (= [comments-node] @selected)
          "Collapsed comments should be selected for keyboard shortcuts"))))
