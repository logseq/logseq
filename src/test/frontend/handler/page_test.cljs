(ns frontend.handler.page-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest favorite-page-actions-load-page-through-worker-test
  (async done
    (let [page-id #uuid "33333333-3333-3333-3333-333333333333"
          calls (atom [])]
      (p/with-redefs [state/get-current-repo (constantly "test")
                      state/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved {:block/uuid page-id}))
                      page-common-handler/<db-favorite-page!
                      (fn [id]
                        (swap! calls conj [:favorite id])
                        (p/resolved nil))
                      page-common-handler/<db-unfavorite-page!
                      (fn [id]
                        (swap! calls conj [:unfavorite id])
                        (p/resolved nil))
                      state/update-favorites-updated!
                      (fn []
                        (swap! calls conj [:favorites-updated])
                        nil)]
        (-> (p/do!
             (page-handler/<favorite-page! "Page Name")
             (page-handler/<unfavorite-page! "Page Name"))
            (p/then
             (fn []
               (is (= [[:thread-api/pull "test" [:block/uuid] [:block/name "page name"]]
                       [:favorite page-id]
                       [:favorites-updated]
                       [:thread-api/pull "test" [:block/uuid] [:block/name "page name"]]
                       [:unfavorite page-id]
                       [:favorites-updated]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest page-on-chosen-loads-uuid-result-through-worker-test
  (async done
    (let [page-id #uuid "11111111-1111-1111-1111-111111111111"
          loaded-page {:db/id 10
                       :block/uuid page-id
                       :block/title "Page"
                       :block/name "page"
                       :block/tags [{:db/ident :logseq.class/Page}]}
          event (doto (js-obj)
                  (aset "preventDefault" (fn []))
                  (aset "stopPropagation" (fn [])))
          calls (atom [])
          previous-state @state/state
          previous-worker @state/*db-worker]
      (swap! state/state assoc :git/current-repo "test")
      (reset! state/*db-worker
              (fn [& args]
                (swap! calls conj (vec args))
                (p/resolved [])))
      (p/with-redefs [state/clear-editor-action!
                      (fn []
                        (swap! calls conj [:clear-editor-action]))
                      util/stop
                      (fn [e]
                        (swap! calls conj [:stop e]))
                      db-async/<get-block
                      (fn [repo id opts]
                        (swap! calls conj [:get-block repo id opts])
                        (p/resolved loaded-page))
                      editor-handler/insert-command!
                      (fn [& args]
                        (swap! calls conj (into [:insert-command] args))
                        (p/resolved nil))
                      editor-handler/get-selected-text (constantly nil)
                      state/conj-block-ref!
                      (fn [& args]
                        (swap! calls conj (into [:conj-block-ref] args)))
                      page-handler/<create!
                      (fn [& _]
                        (throw (js/Error. "existing worker-loaded page should not be recreated")))]
        (let [handler (#'page-handler/page-on-chosen-handler "edit-input" :markdown "Pa")]
          (-> (try
                (handler {:block/uuid page-id
                          :block/title "Page"}
                         event)
                (catch :default error
                  (p/rejected error)))
              (p/then
               (fn []
                 (let [calls' (vec (remove #(= :thread-api/update-thread-atom (first %)) @calls))
                       insert-call (last calls')
                       insert-opts (nth insert-call 4)]
                   (is (= [[:stop event]
                           [:clear-editor-action]
                           [:get-block "test" page-id {:children? false}]
                           [:thread-api/datoms "test" :avet :block/name "page"]
                           [:insert-command "edit-input" "[[Page]]" :markdown
                            {:last-pattern "[[Pa"
                             :end-pattern "]]"
                             :command :page-ref}]]
                          (update-in calls' [4 4] dissoc :postfix-fn)))
                   (is (fn? (:postfix-fn insert-opts))))))
              (p/catch
               (fn [error]
                 (is false (str error))))
              (p/finally
               (fn []
                 (reset! state/state previous-state)
                 (reset! state/*db-worker previous-worker)
                 (done)))))))))

(deftest chosen-result-loads-uuid-result-through-worker-test
  (async done
    (let [tag-id #uuid "22222222-2222-2222-2222-222222222222"
          loaded-tag {:db/id 11
                      :block/uuid tag-id
                      :block/title "Tag"
                      :block/name "tag"}
          calls (atom [])
          previous-worker @state/*db-worker]
      (reset! state/*db-worker
              (fn [api repo requests-transit]
                (case api
                  :thread-api/get-blocks
                  (do
                    (swap! calls conj [api repo (ldb/read-transit-str requests-transit)])
                    (p/resolved (ldb/write-transit-str [{:id (str tag-id) :block loaded-tag}])))

                  (p/resolved nil))))
      (-> (#'page-handler/<chosen-result
           "test"
           {:block/uuid tag-id
            :block/title "Tag"})
          (p/then
           (fn [result]
             (is (= loaded-tag result))
             (is (= [[:thread-api/get-blocks
                      "test"
                      [{:id (str tag-id) :opts {:children? false}}]]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/*db-worker previous-worker)
             (done)))))))

(deftest reorder-favorites-uses-worker-outliner-ops-test
  (async done
    (let [page-a #uuid "11111111-1111-1111-1111-111111111111"
          page-b #uuid "22222222-2222-2222-2222-222222222222"
          ops [[:save-block [{:block/uuid #uuid "33333333-3333-3333-3333-333333333333"
                               :block/link 1}
                              nil]]]
          calls (atom [])
          previous-state @state/state
          previous-worker @state/*db-worker
          original-update-favorites-updated! state/update-favorites-updated!]
      (swap! state/state assoc :git/current-repo "test")
      (reset! state/*db-worker
              (fn [api repo & args]
                (swap! calls conj (into [api repo] args))
                (case api
                  :thread-api/build-reorder-favorites-ops (p/resolved ops)
                  :thread-api/apply-outliner-ops (p/resolved nil)
                  (p/resolved nil))))
      (set! state/update-favorites-updated!
            (fn []
              (swap! calls conj [:favorites-updated])))
      (-> (page-handler/<reorder-favorites! [page-a page-b])
          (p/then
           (fn []
             (is (= [[:thread-api/build-reorder-favorites-ops "test" [page-a page-b]]
                     [:thread-api/apply-outliner-ops "test" ops nil]
                     [:favorites-updated]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (set! state/update-favorites-updated! original-update-favorites-updated!)
             (reset! state/*db-worker previous-worker)
             (reset! state/state previous-state)
             (done)))))))

(deftest today-journal-actions-load-page-through-worker-test
  (async done
    (let [calls (atom [])
          worker-results (atom [nil {:db/id 42}])
          created-page {:block/title "Jul 7th, 2026"}
          previous-state @state/state
          previous-worker @state/*db-worker]
      (swap! state/state assoc :git/current-repo "test")
      (reset! state/*db-worker
              (fn [& args]
                (let [result (first @worker-results)]
                  (swap! worker-results rest)
                  (swap! calls conj (vec args))
                  (p/resolved result))))
      (p/with-redefs [date/today (constantly "Jul 7th, 2026")
                      date/today-journal-day (constantly 20260707)
                      state/set-today!
                      (fn [title]
                        (swap! calls conj [:set-today title]))
                      page-handler/<create!
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved created-page))
                      plugin-handler/hook-plugin-app
                      (fn [& args]
                        (swap! calls conj (vec args)))
                      state/sidebar-add-block!
                      (fn [& args]
                        (swap! calls conj (vec args)))]
        (-> (p/do!
             (page-handler/create-today-journal!)
             (page-handler/open-today-in-sidebar))
            (p/then
             (fn []
               (is (= [[:set-today "Jul 7th, 2026"]
                       [:thread-api/get-journal-page-by-day "test" 20260707]
                       ["Jul 7th, 2026" {:redirect? false
                                          :split-namespace? false
                                          :today-journal? true}]
                       [:today-journal-created {:title "jul 7th, 2026"}]
                       [:thread-api/get-journal-page-by-day "test" 20260707]
                       ["test" 42 :page]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (reset! state/*db-worker previous-worker)
               (done))))))))
