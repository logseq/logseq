(ns frontend.publishing-home-test
  "HTML export should honor :default-home as the published start page."
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is]]
            [electron.ipc :as ipc]
            [frontend.components.container :as container]
            [frontend.components.left-sidebar :as left-sidebar]
            [frontend.publishing :as publishing]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [logseq.db.test.helper :as db-test]
            [logseq.publishing.html :as publish-html]))

(defn- parse-published-state
  [html]
  (let [encoded (second (re-find #"window\.logseq_state=(.*)</script>" html))]
    (reader/read-string (js/JSON.parse encoded))))

(deftest published-html-includes-default-home-from-graph-config
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "My Home"}
                :blocks [{:block/title "welcome"}]}])
        {:keys [html]} (publish-html/build-html
                        @conn
                        {:repo "logseq_db_published"
                         :app-state {:ui/theme "light"}
                         :repo-config {:publishing/all-pages-public? true
                                       :default-home {:page "My Home"}}
                         :html-options {:title "Published"}})
        published (parse-published-state html)]
    (is (= "logseq_db_published" (:git/current-repo published))
        "Export writes :git/current-repo so restore does not guess from config keys")
    (is (= {:page "My Home"}
           (get-in published [:config "logseq_db_published" :default-home])))))

(deftest publishing-home-routing-uses-default-home-page
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
             :latest-journals nil})))
    (is (nil? (container/home-redirect-target
               {:default-home nil
                :current-route :home
                :route-has-p? nil
                :publishing? true
                :latest-journals nil}))
        "Home stays on journals when default-home is absent")))

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
      (with-redefs [state/get-current-repo (fn []
                                             (:git/current-repo (state/get-state)))
                    storage/set (fn [_key _value] nil)
                    ipc/ipc (fn [& _args] nil)]
        (#'publishing/apply-published-state! published)
        (is (= repo (state/get-current-repo)))
        (is (= {:page "My Home"} (state/get-default-home))))
      (finally
        (state/replace-state! previous-state)))))
