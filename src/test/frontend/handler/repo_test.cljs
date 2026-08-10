(ns frontend.handler.repo-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.persist :as db-persist]
            [frontend.db.subs :as db-subs]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.search :as search]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest create-db-does-not-start-renderer-db-conn-test
  (async done
    (let [calls (atom [])]
      (p/with-redefs [persist-db/<new
                      (fn [repo opts]
                        (swap! calls conj [:persist-new repo opts])
                        (p/resolved nil))
                      state/add-repo!
                      (fn [repo]
                        (swap! calls conj [:add-repo repo])
                        (p/resolved nil))
                      repo-handler/restore-and-setup-repo!
                      (fn [repo opts]
                        (swap! calls conj [:restore repo opts])
                        (p/resolved nil))
                      route-handler/redirect-to-home!
                      (fn []
                        (swap! calls conj [:redirect-home])
                        nil)
                      repo-config-handler/set-repo-config-state!
                      (fn [repo _content]
                        (swap! calls conj [:repo-config repo])
                        nil)
                      state/pub-event!
                      (fn [event]
                        (swap! calls conj [:event event])
                        nil)
                      ui-handler/re-render-root!
                      (fn []
                        (swap! calls conj [:rerender])
                        nil)
                      graph-handler/settle-metadata-to-local!
                      (fn [metadata]
                        (swap! calls conj [:metadata (keys metadata)])
                        (p/resolved nil))]
        (-> (#'repo-handler/create-db "logseq_db_created" {})
            (p/then
             (fn [repo]
               (is (= "logseq_db_created" repo))
               (is (some #(= [:restore "logseq_db_created" {:file-graph-import? nil}] %) @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest removing-current-repo-pauses-renderer-subscriptions-test
  (async done
         (let [repo {:url "logseq_db_current"}
               repos (atom [repo])
               calls (atom [])]
           (p/with-redefs [state/get-repos (fn [] @repos)
                           state/get-current-repo (fn [] (:url repo))
                           persist-db/<close-db
                           (fn [graph-id]
                             (swap! calls conj [:close graph-id])
                             (p/resolved nil))
                           db-persist/delete-graph!
                           (fn [graph-id]
                             (swap! calls conj [:delete-db graph-id])
                             (p/resolved nil))
                           search/remove-db!
                           (fn [graph-id]
                             (swap! calls conj [:remove-search graph-id])
                             nil)
                           state/delete-repo!
                           (fn [removed-repo]
                             (swap! calls conj [:delete-repo removed-repo])
                             (reset! repos []))
                           state/set-current-repo!
                           (fn [graph-id]
                             (swap! calls conj [:set-current graph-id])
                             nil)
                           db-subs/reset-graph!
                           (fn [graph-id]
                             (swap! calls conj [:reset-subscriptions graph-id])
                             nil)]
             (-> (repo-handler/remove-repo! repo)
                 (p/then
                  (fn []
                    (is (= [[:close (:url repo)]
                            [:delete-db (:url repo)]
                            [:remove-search (:url repo)]
                            [:delete-repo repo]
                            [:set-current nil]
                            [:reset-subscriptions nil]]
                           @calls))))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))
