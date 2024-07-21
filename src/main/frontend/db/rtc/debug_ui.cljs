(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require [fipp.edn :as fipp]
            [frontend.common.missionary-util :as c.m]
            [frontend.db :as db]
            [frontend.handler.user :as user]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce debug-state (:rtc/state @state/state))
(defonce rtc-log-flow (m/watch (:rtc/log @state/state)))

(defn- stop
  []
  (let [^object worker @db-browser/*worker]
    (.rtc-stop2 worker))
  (reset! debug-state nil))

(rum/defcs ^:large-vars/cleanup-todo rtc-debug-ui < rum/reactive
  (rum/local nil ::logs)
  (rum/local nil ::sub-log-canceler)
  {:will-mount (fn [state]
                 (let [canceler
                       (c.m/run-task
                        (m/reduce
                         (fn [logs log]
                           (let [logs* (if log
                                         (take 10 (conj logs log))
                                         logs)]
                             (reset! (get state ::logs) logs*)
                             logs*))
                         nil rtc-log-flow)
                        ::sub-logs)]
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
                    (let [^object worker @db-browser/*worker]
                      (p/let [result (.rtc-get-debug-state2 worker)
                              new-state (ldb/read-transit-str result)]
                        (swap! debug-state (fn [old] (merge old new-state))))))}
       (shui/tabler-icon "refresh") "state")

      (shui/button
       {:size :sm
        :on-click
        (fn [_]
          (let [token (state/get-auth-id-token)
                ^object worker @db-browser/*worker]
            (p/let [result (.rtc-get-graphs2 worker token)
                    graph-list (ldb/read-transit-str result)]
              (swap! debug-state assoc
                     :remote-graphs
                     (map
                      #(into {}
                             (filter second
                                     (select-keys % [:graph-uuid :graph-name
                                                     :graph-status
                                                     :graph<->user-user-type
                                                     :graph<->user-grant-by-user])))
                      graph-list)))))}
       (shui/tabler-icon "download") "graph-list")
      (shui/button
       {:size :sm
        :on-click #(c.m/run-task
                    (user/new-task--upload-user-avatar "TEST_AVATAR")
                    :upload-test-avatar)}
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
            :current-page (state/get-current-page)
            :blocks-count (when-let [page (state/get-current-page)]
                            (count (:block/_page (db/get-page page))))}
           (fipp/pprint {:width 20})
           with-out-str)]]

     (if (nil? rtc-lock)
       (shui/button
        {:variant :outline
         :class "text-green-rx-09 border-green-rx-10 hover:text-green-rx-10"
         :on-click (fn []
                     (let [token (state/get-auth-id-token)
                           ^object worker @db-browser/*worker]
                       (.rtc-start2 worker (state/get-current-repo) token)))}
        (shui/tabler-icon "player-play") "start")

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if (:auto-push? debug-state*)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (let [^object worker @db-browser/*worker]
                                   (.rtc-toggle-auto-push worker (state/get-current-repo))))})]
        [:div (shui/button
               {:variant :outline
                :class "text-red-rx-09 border-red-rx-08 hover:text-red-rx-10"
                :size :sm
                :on-click (fn [] (stop))}
               (shui/tabler-icon "player-stop") "stop")]])

     (when (some? debug-state*)
       [:hr]
       [:div.flex.flex-row.items-center.gap-2
        (ui/button "grant graph access to"
                   {:icon "award"
                    :on-click (fn []
                                (let [token (state/get-auth-id-token)
                                      user-uuid (some-> (:grant-access-to-user debug-state*) parse-uuid)
                                      user-email (when-not user-uuid (:grant-access-to-user debug-state*))]
                                  (when-let [graph-uuid (:graph-uuid debug-state*)]
                                    (let [^object worker @db-browser/*worker]
                                      (.rtc-grant-graph-access2 worker token graph-uuid
                                                                (some-> user-uuid vector ldb/write-transit-str)
                                                                (some-> user-email vector ldb/write-transit-str))))))})

        [:b "➡️"]
        [:input.form-input.my-2.py-1
         {:on-change (fn [e] (swap! debug-state assoc :grant-access-to-user (util/evalue e)))
          :on-focus (fn [e] (let [v (.-value (.-target e))]
                              (when (= v "input email or user-uuid here")
                                (set! (.-value (.-target e)) ""))))
          :placeholder "input email or user-uuid here"}]])

     [:hr.my-2]

     [:div.flex.flex-row.items-center.gap-2
      (ui/button (str "download graph to")
                 {:icon "download"
                  :class "mr-2"
                  :on-click (fn []
                              (when-let [graph-name (:download-graph-to-repo debug-state*)]
                                (when-let [graph-uuid (:graph-uuid-to-download debug-state*)]
                                  (let [^object worker @db-browser/*worker]
                                    (prn :download-graph graph-uuid :to graph-name)
                                    (p/let [token (state/get-auth-id-token)
                                            download-info-uuid (.rtc-request-download-graph worker token graph-uuid)
                                            download-info-uuid (ldb/read-transit-str download-info-uuid)
                                            result (.rtc-wait-download-graph-info-ready
                                                    worker token download-info-uuid graph-uuid 60000)
                                            {:keys [_download-info-uuid
                                                    download-info-s3-url
                                                    _download-info-tx-instant
                                                    _download-info-t
                                                    _download-info-created-at]
                                             :as result} (ldb/read-transit-str result)]
                                      (when (not= result :timeout)
                                        (assert (some? download-info-s3-url) result)
                                        (.rtc-download-graph-from-s3 worker graph-uuid graph-name download-info-s3-url)))))))})

      [:b "➡"]
      [:div.flex.flex-row.items-center.gap-2
       (shui/select
        {:on-value-change (fn [v]
                            (some->> (parse-uuid v)
                                     str
                                     (swap! debug-state assoc :graph-uuid-to-download)))}
        (shui/select-trigger
         {:class "!px-2 !py-0 !h-8 border-gray-04"}
         (shui/select-value
          {:placeholder "Select a graph-uuid"}))
        (shui/select-content
         (shui/select-group
          (for [{:keys [graph-uuid graph-status]} (sort-by :graph-uuid (:remote-graphs debug-state*))]
            (shui/select-item {:value graph-uuid :disabled (some? graph-status)} graph-uuid)))))

       [:b "＋"]
       [:input.form-input.my-2.py-1
        {:on-change (fn [e] (swap! debug-state assoc :download-graph-to-repo (util/evalue e)))
         :on-focus (fn [e] (let [v (.-value (.-target e))]
                             (when (= v "repo name here")
                               (set! (.-value (.-target e)) ""))))
         :placeholder "repo name here"}]]]

     [:div.flex.my-2.items-center.gap-2
      (ui/button (str "upload current repo")
                 {:icon "upload"
                  :on-click (fn []
                              (let [repo (state/get-current-repo)
                                    token (state/get-auth-id-token)
                                    remote-graph-name (:upload-as-graph-name debug-state*)
                                    ^js worker @db-browser/*worker]
                                (.rtc-async-upload-graph2 worker repo token remote-graph-name)))})
      [:b "➡️"]
      [:input.form-input.my-2.py-1.w-32
       {:on-change (fn [e] (swap! debug-state assoc :upload-as-graph-name (util/evalue e)))
        :on-focus (fn [e] (let [v (.-value (.-target e))]
                            (when (= v "remote graph name here")
                              (set! (.-value (.-target e)) ""))))
        :placeholder "remote graph name here"}]]

     [:div.pb-2.flex.flex-row.items-center.gap-2
      (ui/button (str "delete graph")
                 {:icon "trash"
                  :on-click (fn []
                              (when-let [graph-uuid (:graph-uuid-to-delete debug-state*)]
                                (let [token (state/get-auth-id-token)
                                      ^object worker @db-browser/*worker]
                                  (prn ::delete-graph graph-uuid)
                                  (.rtc-delete-graph2 worker token graph-uuid))))})

      (shui/select
       {:on-value-change (fn [v]
                           (some->> (parse-uuid v)
                                    str
                                    (swap! debug-state assoc :graph-uuid-to-delete)))}
       (shui/select-trigger
        {:class "!px-2 !py-0 !h-8"}
        (shui/select-value
         {:placeholder "Select a graph-uuid"}))
       (shui/select-content
        (shui/select-group
         (for [{:keys [graph-uuid graph-status]} (:remote-graphs debug-state*)]
           (shui/select-item {:value graph-uuid :disabled (some? graph-status)} graph-uuid)))))]]))
