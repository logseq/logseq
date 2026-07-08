(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require [fipp.edn :as fipp]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defonce debug-state (atom (state/get-state :rtc/state)))

(defn- stop
  []
  (p/do!
   (state/<invoke-db-worker :thread-api/rtc-stop)
   (reset! debug-state nil)))

(hsx/defc ^:large-vars/cleanup-todo rtc-debug-ui
  []
  (let [[debug-state*] (hooks/use-atom debug-state)
        [rtc-logs set-rtc-logs!] (hooks/use-state nil)
        [keys-state set-keys-state!] (hooks/use-state nil)
        [current-page-blocks-count set-current-page-blocks-count!] (hooks/use-state nil)
        rtc-state (:rtc-state debug-state*)
        rtc-lock (:rtc-lock debug-state*)]
    (hooks/use-effect!
     (fn []
       (let [logs* (atom nil)
             watch-key ::sub-logs]
         (add-watch rtc-flows/rtc-log watch-key
                    (fn [_ _ _ log]
                      (let [logs (if log
                                   (take 10 (conj @logs* log))
                                   @logs*)]
                        (reset! logs* logs)
                        (set-rtc-logs! logs))))
         #(remove-watch rtc-flows/rtc-log watch-key)))
     [])
    (hooks/use-effect!
     (fn []
       (if-let [page (state/get-current-page)]
         (p/let [blocks-count (state/<invoke-db-worker
                                :thread-api/q
                                (state/get-current-repo)
                                ['[:find (count ?block) .
                                   :in $ ?page-name
                                   :where
                                   [?page :block/name ?page-name]
                                   [?block :block/page ?page]]
                                 page])]
           (set-current-page-blocks-count! blocks-count))
         (set-current-page-blocks-count! nil))
       nil)
     [(state/get-current-page)])
    [:div
     {:on-click (fn [^js e]
                  (when-let [^js btn (.closest (.-target e) ".ui__button")]
                    (.setAttribute btn "disabled" "true")
                    (js/setTimeout #(.removeAttribute btn "disabled") 2000)))}
     [:div.flex.gap-2.flex-wrap.items-center.pb-3
      (shui/button
       {:size :sm
        :on-click (fn [_]
                    (p/let [new-state (state/<invoke-db-worker :thread-api/rtc-get-debug-state)]
                      (swap! debug-state (fn [old] (merge old new-state)))))}
       (shui/tabler-icon "refresh") "state")

      (shui/button
       {:size :sm
        :on-click
        (fn [_]
          (let [token (state/get-auth-id-token)]
            (p/let [graph-list (state/<invoke-db-worker :thread-api/rtc-get-graphs token)]
              (swap! debug-state assoc
                     :remote-graphs
                     (map
                      #(into {}
                             (filter second
                                     (select-keys % [:graph-uuid
                                                     :graph-schema-version
                                                     :graph-name
                                                     :graph-status
                                                     :graph<->user-user-type
                                                     :graph<->user-grant-by-user])))
                      graph-list)))))}
       (shui/tabler-icon "download") "graph-list")
      (shui/button
       {:size :sm
        :on-click #(user/<upload-user-avatar "TEST_AVATAR")}
       (shui/tabler-icon "upload") "upload-test-avatar")]

     [:div.pb-4
      [:pre.select-text
       (-> {:user-uuid (user/user-uuid)
            :graph (:graph-uuid debug-state*)
            :rtc-state rtc-state
            :rtc-logs rtc-logs
            :local-tx (:local-tx debug-state*)
            :pending-block-update-count (:unpushed-block-update-count debug-state*)
            :remote-graphs (:remote-graphs debug-state*)
            :online-users (:online-users debug-state*)
            :auto-push? (:auto-push? debug-state*)
            :remote-profile? (:remote-profile? debug-state*)
            :current-page (state/get-current-page)
            :blocks-count current-page-blocks-count
            :schema-version {:app (db-schema/schema-version->string db-schema/version)
                             :local-graph (:local-graph-schema-version debug-state*)
                             :remote-graph (str (:remote-graph-schema-version debug-state*))}}
           (fipp/pprint {:width 20})
           with-out-str)]]

     (if (nil? rtc-lock)
       (shui/button
        {:variant :outline
         :size :sm
         :class "text-green-rx-09 border-green-rx-10 hover:text-green-rx-10"
         :on-click (fn [] (state/<invoke-db-worker :thread-api/rtc-start false))}
        (shui/tabler-icon "player-play") "start")

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "Toggle auto push updates ("
                                   (if (:auto-push? debug-state*)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (state/<invoke-db-worker :thread-api/rtc-toggle-auto-push))})]
        [:div.mr-2 (ui/button (str "Toggle remote profile ("
                                   (if (:remote-profile? debug-state*)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (state/<invoke-db-worker :thread-api/rtc-toggle-remote-profile))})]
        [:div (shui/button
               {:variant :outline
                :class "text-red-rx-09 border-red-rx-08 hover:text-red-rx-10"
                :size :sm
                :on-click (fn [] (stop))}
               (shui/tabler-icon "player-stop") "stop")]])

     [:hr.my-2]
     [:div
        [:div.pb-2.flex.flex-row.items-center.gap-2
         (shui/button
          {:size :sm
           :on-click (fn [_]
                       (when-let [user-uuid (user/user-uuid)]
                         (p/let [user-rsa-key-pair (state/<invoke-db-worker
                                                    :thread-api/get-user-rsa-key-pair
                                                    (state/get-auth-id-token) user-uuid)]
                           (set-keys-state! user-rsa-key-pair))))}
          (shui/tabler-icon "refresh") "keys-state")
         (shui/button
          {:size :sm
           :on-click (fn [_]
                       (when-let [token (state/get-auth-id-token)]
                         (p/let [r (state/<invoke-db-worker :thread-api/init-user-rsa-key-pair token (user/user-uuid))]
                           (when (instance? ExceptionInfo r)
                             (log/error :init-user-rsa-key-pair r)))))}
          (shui/tabler-icon "upload") "init upload user rsa-key-pair")]
        [:div.pb-1
         [:pre.select-text
          (-> keys-state
              (fipp/pprint {:width 20})
              with-out-str)]]]]))
