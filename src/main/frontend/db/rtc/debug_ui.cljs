(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require [fipp.edn :as fipp]
            [frontend.common.missionary :as c.m]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce debug-state (:rtc/state @state/state))

(defn- stop
  []
  (p/do!
   (state/<invoke-db-worker :thread-api/rtc-stop)
   (reset! debug-state nil)))

(rum/defcs ^:large-vars/cleanup-todo rtc-debug-ui < rum/reactive
  (rum/local nil ::logs)
  (rum/local nil ::sub-log-canceler)
  (rum/local nil ::keys-state)
  {:will-mount (fn [state]
                 (let [canceler
                       (c.m/run-task ::sub-logs
                         (m/reduce
                          (fn [logs log]
                            (let [logs* (if log
                                          (take 10 (conj logs log))
                                          logs)]
                              (reset! (get state ::logs) logs*)
                              logs*))
                          nil rtc-flows/rtc-log-flow))]
                   (reset! (get state ::sub-log-canceler) canceler)
                   state))
   :will-unmount (fn [state]
                   (when-let [canceler (some-> (get state ::sub-log-canceler) deref)]
                     (canceler))
                   state)}
  [state]
  (let [debug-state* (rum/react debug-state)
        rtc-logs @(get state ::logs)
        rtc-state (:rtc-state debug-state*)
        rtc-lock (:rtc-lock debug-state*)]
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
        :on-click #(c.m/run-task :upload-test-avatar
                     (user/new-task--upload-user-avatar "TEST_AVATAR"))}
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
            :blocks-count (when-let [page (state/get-current-page)]
                            (count (:block/_page (db/get-page page))))
            :schema-version {:app (db-schema/schema-version->string db-schema/version)
                             :local-graph (:local-graph-schema-version debug-state*)
                             :remote-graph (str (:remote-graph-schema-version debug-state*))}}
           (fipp/pprint {:width 20})
           with-out-str)]]

     (if (nil? rtc-lock)
       (shui/button
        {:variant :outline
         :class "text-green-rx-09 border-green-rx-10 hover:text-green-rx-10"
         :on-click (fn [] (state/<invoke-db-worker :thread-api/rtc-start false))}
        (shui/tabler-icon "player-play") "start")

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if (:auto-push? debug-state*)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (state/<invoke-db-worker :thread-api/rtc-toggle-auto-push))})]
        [:div.mr-2 (ui/button (str "Toggle remote profile("
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
     (let [*keys-state (get state ::keys-state)
           keys-state @*keys-state]
       [:div
        [:div.pb-2.flex.flex-row.items-center.gap-2
         (shui/button
          {:size :sm
           :on-click (fn [_]
                       (when-let [user-uuid (user/user-uuid)]
                         (p/let [user-rsa-key-pair (state/<invoke-db-worker
                                                    :thread-api/get-user-rsa-key-pair
                                                    (state/get-auth-id-token) user-uuid)]
                           (reset! *keys-state user-rsa-key-pair))))}
          (shui/tabler-icon "refresh") "keys-state")
         (shui/button
          {:size :sm
           :on-click (fn [_]
                       (when-let [token (state/get-auth-id-token)]
                         (p/let [r (state/<invoke-db-worker :thread-api/init-user-rsa-key-pair token (user/user-uuid))]
                           (when (instance? ExceptionInfo r)
                             (log/error :init-user-rsa-key-pair r)))))}
          (shui/tabler-icon "upload") "init upload user rsa-key-pair")]
        [:div.pb-4
         [:pre.select-text
          (-> keys-state
              (fipp/pprint {:width 20})
              with-out-str)]]])]))
