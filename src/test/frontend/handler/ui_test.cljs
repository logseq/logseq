(ns frontend.handler.ui-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.config :as config]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.storage :as storage]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest auto-complete-scroll-geometry-test
  (testing "normalizes focused-item geometry from container and target DOM data"
    (let [container #js {:scrollTop 100
                         :clientHeight 240
                         :getBoundingClientRect (fn [] #js {:top 40 :height 240})}
          element #js {:getBoundingClientRect (fn [] #js {:top 90 :height 30})}]
      (is (= {:scroll-top 100
              :viewport-height 240
              :item-top 150
              :item-height 30}
             (#'ui-handler/auto-complete-scroll-geometry container element)))))
  (testing "includes the preceding group heading in the focused cluster"
    (let [heading #js {:classList #js {:contains (fn [class-name]
                                                   (= class-name "ui__ac-group-name"))}
                       :getBoundingClientRect (fn [] #js {:top 40 :height 32})}
          wrap #js {:previousElementSibling heading}
          container #js {:scrollTop 100
                         :clientHeight 240
                         :getBoundingClientRect (fn [] #js {:top 40 :height 240})}
          element #js {:parentElement wrap
                       :getBoundingClientRect (fn [] #js {:top 72 :height 30})}]
      (is (= {:scroll-top 100
              :viewport-height 240
              :item-top 100
              :item-height 62}
             (#'ui-handler/auto-complete-scroll-geometry container element)))))
  (testing "scrolls the group heading back into view with the first command"
    (let [heading #js {:classList #js {:contains (fn [class-name]
                                                   (= class-name "ui__ac-group-name"))}
                       :getBoundingClientRect (fn [] #js {:top 8 :height 32})}
          wrap #js {:previousElementSibling heading}
          container #js {:scrollTop 32
                         :clientHeight 240
                         :getBoundingClientRect (fn [] #js {:top 40 :height 240})}
          element #js {:parentElement wrap
                       :getBoundingClientRect (fn [] #js {:top 40 :height 30})}]
      (is (zero? (#'ui-handler/auto-complete-keep-visible-scroll-top
                  (#'ui-handler/auto-complete-scroll-geometry container element))))))
  (testing "returns nil when container or element is missing"
    (is (nil? (#'ui-handler/auto-complete-scroll-geometry nil #js {})))
    (is (nil? (#'ui-handler/auto-complete-scroll-geometry #js {} nil)))))

(deftest auto-complete-keep-visible-scroll-top-test
  (testing "scrolls down when the focused item is below the viewport"
    (is (= 170
           (#'ui-handler/auto-complete-keep-visible-scroll-top
            {:scroll-top 0
             :viewport-height 200
             :item-top 350
             :item-height 20}))))
  (testing "scrolls up when the focused item is above the viewport"
    (is (= 40
           (#'ui-handler/auto-complete-keep-visible-scroll-top
            {:scroll-top 200
             :viewport-height 200
             :item-top 40
             :item-height 20}))))
  (testing "scrolls back to 0 when the first grouped command is above the viewport"
    (is (zero? (#'ui-handler/auto-complete-keep-visible-scroll-top
                {:scroll-top 400
                 :viewport-height 200
                 :item-top 0
                 :item-height 52}))))
  (testing "keeps scroll-top when the focused item is already visible"
    (is (= 100
           (#'ui-handler/auto-complete-keep-visible-scroll-top
            {:scroll-top 100
             :viewport-height 200
             :item-top 140
             :item-height 20}))))
  (testing "keeps a partially clipped item fully visible at the bottom edge"
    (is (= 20
           (#'ui-handler/auto-complete-keep-visible-scroll-top
            {:scroll-top 0
             :viewport-height 200
             :item-top 190
             :item-height 30})))))

(deftest ui-file-loaders-read-local-files-through-worker-test
  (async done
    (let [repo "logseq_db_ui_file_worker"
          worker-calls (atom [])
          added-styles (atom [])
          previous-state (state/get-state)
          previous-js-execed @ui-handler/*js-execed]
      (state/swap-state! assoc :git/current-repo repo)
      (reset! ui-handler/*js-execed #{})
      (p/with-redefs [state/get-custom-css-link (constantly nil)
                      state/get-custom-js-link (constantly nil)
                      config/get-custom-js-path (constantly "logseq/custom.js")
                      storage/get (fn [_] (.now js/Date))
                      ui-handler/<get-file-content
                      (fn [repo' path]
                        (swap! worker-calls conj [:thread-api/get-file-content repo' path])
                        (p/resolved
                         (case path
                           "logseq/custom.css" "body { color: green; }"
                           "logseq/custom.js" "   ")))
                      assets-handler/<expand-assets-links-for-db-graph
                      (fn [style]
                        (p/resolved (str "expanded:" style)))
                      util/add-style!
                      (fn [style]
                        (swap! added-styles conj style)
                        nil)]
        (-> (p/let [_ (ui-handler/add-style-if-exists!)
                    _ (ui-handler/exec-js-if-exists-&-allowed! (constantly "Allow custom JS?"))]
              (is (= [[:thread-api/get-file-content repo "logseq/custom.css"]
                      [:thread-api/get-file-content repo "logseq/custom.js"]]
                     @worker-calls))
              (is (= ["expanded:body { color: green; }"]
                     @added-styles)))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (state/replace-state! previous-state)
               (reset! ui-handler/*js-execed previous-js-execed)
               (done))))))))

(deftest scroll-to-anchor-block-resolves-parent-through-worker-test
  (async done
    (let [repo "logseq_db_scroll_anchor_worker"
          anchor-uuid #uuid "11111111-1111-1111-1111-111111111111"
          sibling-uuid #uuid "33333333-3333-3333-3333-333333333333"
          parent-uuid #uuid "22222222-2222-2222-2222-222222222222"
          worker-calls (atom [])
          scroll-calls (atom [])
          previous-state (state/get-state)
          ref #js {:scrollToIndex (fn [opts]
                                    (swap! scroll-calls conj (.-index opts)))}]
      (state/swap-state! assoc :git/current-repo repo)
      (p/with-redefs [state/get-route-match
                      (constantly {:query-params {:anchor (str "ls-block-" anchor-uuid)}})
                      ui-handler/<invoke-db-worker
                      (fn [api repo' & args]
                        (swap! worker-calls conj (into [api repo'] args))
                        (p/resolved
                         (case api
                           :thread-api/pull
                           {:db/id 42
                            :block/uuid anchor-uuid}

                           :thread-api/get-block-parents
                           [{:db/id 7
                             :block/uuid parent-uuid}])))
                      ui-handler/highlight-element!
                      (fn [_fragment] nil)]
        (-> (p/do!
             (ui-handler/scroll-to-anchor-block ref [{:block/uuid sibling-uuid}
                                                     {:block/uuid parent-uuid}]
                                                false)
             (p/delay 250))
            (p/then
             (fn []
               (is (= [[:thread-api/pull repo [:db/id :block/uuid] [:block/uuid anchor-uuid]]
                       [:thread-api/get-block-parents repo 42 100]]
                      @worker-calls))
               (is (= [1] @scroll-calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (state/replace-state! previous-state)
               (done))))))))

(deftest get-file-content-skips-when-db-worker-not-ready-test
  (let [previous @state/*db-worker]
    (try
      (reset! state/*db-worker nil)
      (is (nil? (ui-handler/<get-file-content "repo" "logseq/custom.css")))
      (reset! state/*db-worker (fn [& _] :content))
      (is (some? (ui-handler/<get-file-content "repo" "logseq/custom.css")))
      (finally
        (reset! state/*db-worker previous)))))
