(ns frontend.publishing-home-test
  "HTML export should honor :default-home as the published start page."
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is testing]]
            [electron.ipc :as ipc]
            [frontend.components.container :as container]
            [frontend.components.left-sidebar :as left-sidebar]
            [frontend.handler.export :as export]
            [frontend.publishing :as publishing]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [logseq.db.test.helper :as db-test]
            [logseq.publishing.html :as publish-html]))

(defn- parse-published-state
  [html]
  (let [encoded (second (re-find #"window\.logseq_state=(.*)</script>" html))]
    (reader/read-string (js/JSON.parse encoded))))

(defn- build-published-state
  [db repo-config]
  (let [{:keys [html]} (publish-html/build-html
                        db
                        {:repo "logseq_db_published"
                         :app-state {:ui/theme "light"}
                         :repo-config repo-config
                         :html-options {:title "Published"}})]
    (parse-published-state html)))

(deftest published-html-includes-default-home-from-graph-config
  (testing "a graph with :default-home produces published state that includes it"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "My Home"}
                  :blocks [{:block/title "welcome"}]}])
          published (build-published-state
                     @conn
                     {:publishing/all-pages-public? true
                      :default-home {:page "My Home"}})]
      (is (= "logseq_db_published" (:git/current-repo published))
          "Export writes :git/current-repo so restore does not guess from config keys")
      (is (= {:page "My Home"}
             (get-in published [:config "logseq_db_published" :default-home])))))

  (testing "published config has no default-home page when the setting is absent"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Other"}
                  :blocks [{:block/title "notes"}]}])
          published (build-published-state
                     @conn
                     {:publishing/all-pages-public? true})]
      (is (= "logseq_db_published" (:git/current-repo published)))
      (is (nil? (get-in published [:config "logseq_db_published" :default-home :page]))))))

(deftest publishing-export-options-include-default-home
  (let [repo "logseq_db_export_home"
        previous-state (state/get-state)]
    (try
      (state/set-current-repo! repo)
      (state/set-config! repo {:default-home {:page "My Home"}
                               :publishing/all-pages-public? true})
      (let [options (#'export/publishing-export-options repo)]
        (is (= repo (get-in options [:app-state :git/current-repo])))
        (is (= {:page "My Home"}
               (get-in options [:repo-config :default-home]))))
      (finally
        (state/replace-state! previous-state)))))

(deftest publishing-home-routing-uses-default-home-page
  (testing "publishing start route uses default-home even before page-identity is ready"
    (let [default-home (left-sidebar/default-home-if-valid
                        {:page "My Home"}
                        {:publishing? true
                         :page-identity-status :loading
                         :page-identity-value nil})]
      (is (= {:page "My Home"} default-home)
          "Publishing does not wait on page-identity to keep the configured page")
      (is (= [:page "My Home"]
             (container/home-redirect-target
              {:default-home default-home
               :current-route :home
               :route-has-p? nil
               :publishing? true
               :latest-journals nil})))))

  (testing "app still requires page-identity before treating default-home as valid"
    (is (= {}
           (left-sidebar/default-home-if-valid
            {:page "My Home"}
            {:publishing? false
             :page-identity-status :loading
             :page-identity-value nil})))
    (is (= {:page "My Home"}
           (left-sidebar/default-home-if-valid
            {:page "My Home"}
            {:publishing? false
             :page-identity-status :ready
             :page-identity-value #uuid "11111111-1111-1111-1111-111111111111"}))))

  (testing "journals remain the published start page when default-home is absent"
    (let [default-home (left-sidebar/default-home-if-valid
                        nil
                        {:publishing? true
                         :page-identity-status :ready
                         :page-identity-value nil})]
      (is (nil? default-home))
      (is (nil? (container/home-redirect-target
                 {:default-home default-home
                  :current-route :home
                  :route-has-p? nil
                  :publishing? true
                  :latest-journals nil}))
          "Home stays on journals instead of redirecting to a page"))))

(deftest apply-published-state-sets-current-repo-so-default-home-is-readable
  (let [previous-state (state/get-state)
        leftover-repo "logseq_db_broken"
        repo "logseq_db_published"
        published {:git/current-repo repo
                   :ui/theme "dark"
                   :config {repo {:default-home {:page "My Home"}}}}]
    (try
      (state/replace-state! (-> previous-state
                                (assoc :git/current-repo leftover-repo)
                                (assoc :config {leftover-repo {}})))
      ;; Isolate getters/setters from leaked with-redefs in the same Node shard
      ;; (frontend.handler.graph-test stubs get-current-repo to leftover-repo).
      (with-redefs [state/get-current-repo (fn []
                                             (:git/current-repo (state/get-state)))
                    storage/set (fn [_key _value] nil)
                    ipc/ipc (fn [& _args] nil)]
        (#'publishing/apply-published-state! published)
        (is (= repo (:git/current-repo (state/get-state)))
            "Merge of published state writes :git/current-repo")
        (is (= repo (state/get-current-repo))
            "set-current-repo! keeps the exported repo as current")
        (is (= {:page "My Home"}
               (get-in (state/get-state) [:config repo :default-home])))
        (is (= {:page "My Home"} (state/get-default-home))))
      (finally
        (state/replace-state! previous-state)))))
