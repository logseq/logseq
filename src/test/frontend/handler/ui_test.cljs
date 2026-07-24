(ns frontend.handler.ui-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.storage :as storage]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest ui-file-loaders-read-local-files-through-worker-test
  (async done
    (let [repo "logseq_db_ui_file_worker"
          worker-calls (atom [])
          added-styles (atom [])
          previous-state @state/state
          previous-js-execed @ui-handler/*js-execed]
      (swap! state/state assoc :git/current-repo repo)
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
               (reset! state/state previous-state)
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
          previous-state @state/state
          ref #js {:scrollToIndex (fn [opts]
                                    (swap! scroll-calls conj (.-index opts)))}]
      (swap! state/state assoc :git/current-repo repo)
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
                       [:thread-api/get-block-parents repo 42 3]]
                      @worker-calls))
               (is (= [1] @scroll-calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (done))))))))
