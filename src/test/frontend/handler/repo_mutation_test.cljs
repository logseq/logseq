(ns frontend.handler.repo-mutation-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.config :as config]
            [frontend.db.persist :as db-persist]
            [frontend.db.subs :as db-subs]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.search :as search]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest removable-repo?-demo-graph-test
  (let [demo {:url config/demo-repo}
        other {:url "logseq_db_other"}]
    (testing "the demo graph can't be removed when it is the only graph"
      (is (false? (repo-handler/removable-repo? demo [demo])))
      (is (false? (repo-handler/removable-repo? demo [demo demo]))))
    (testing "the demo graph can be removed when there are other graphs"
      (is (true? (repo-handler/removable-repo? demo [demo other]))))
    (testing "any other graph can be removed, also when it is the only one"
      (is (true? (repo-handler/removable-repo? other [other])))
      (is (true? (repo-handler/removable-repo? other [demo other]))))))

(deftest removing-current-repo-switches-to-the-first-remaining-graph-test
  (async done
         (let [repo {:url "logseq_db_current"}
               repos (atom [repo {:url "logseq_db_first"} {:url "logseq_db_second"}])
               events (atom [])]
           (-> (p/with-redefs [state/get-repos (fn [] @repos)
                               state/get-current-repo (fn [] (:url repo))
                               db-persist/delete-graph! (fn [_graph-id] (p/resolved nil))
                               search/remove-db! (fn [_graph-id] nil)
                               state/delete-repo! (fn [removed-repo]
                                                    (swap! repos (fn [rs] (vec (remove #{removed-repo} rs)))))
                               state/set-current-repo! (fn [_graph-id] nil)
                               db-subs/reset-graph! (fn [_graph-id] nil)
                               notification/show! (fn [& _args] nil)
                               state/pub-event! (fn [event] (swap! events conj event) nil)]
                 (repo-handler/remove-repo! repo))
               (p/then
                (fn []
                  (is (= [[:graph/switch "logseq_db_first" {:persist? false}]] @events))))
               (p/catch
                (fn [error]
                  (is false (str error))))
               (p/finally done)))))

(deftest new-db-creates-today-journal-only-for-a-new-graph-test
  (async done
         (let [events (atom [])]
           (-> (p/with-redefs [persist-db/<new (fn [_repo _opts] (p/resolved nil))
                               state/add-repo! (fn [_repo] (p/resolved nil))
                               repo-handler/restore-and-setup-repo! (fn [_repo _opts] (p/resolved nil))
                               route-handler/redirect-to-home! (fn [] nil)
                               repo-config-handler/set-repo-config-state! (fn [_repo _content] nil)
                               state/pub-event! (fn [event] (swap! events conj (first event)) nil)
                               ui-handler/re-render-root! (fn [] nil)
                               graph-handler/settle-metadata-to-local! (fn [_metadata] (p/resolved nil))
                               graph-handler/<upsert-current-graph-registry! (fn [] (p/resolved nil))
                               graph-handler/remember-current-graph-id-in-tab! (fn [] (p/resolved nil))]
                 (p/let [_ (repo-handler/new-db! "created" {})
                         _ (do
                             (is (some #{:page/create} @events)
                                 "a new graph starts with today's journal")
                             (reset! events []))
                         _ (#'repo-handler/create-db "logseq_db_imported" {:file-graph-import? true})]
                   (is (not-any? #{:page/create} @events)
                       "an imported graph brings its own pages")))
               (p/catch
                (fn [error]
                  (is false (str error))))
               (p/finally done)))))
