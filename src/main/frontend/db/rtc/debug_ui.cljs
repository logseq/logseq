(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require [cljs-bean.core :as bean]
            [fipp.edn :as fipp]
            [frontend.db :as db]
            [frontend.handler.user :as user]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [logseq.db :as ldb]))

(defonce debug-state (:rtc/state @state/state))

(defn- stop
  []
  (let [^object worker @db-browser/*worker]
    (.rtc-stop worker))
  (reset! debug-state nil))

(defn- push-pending-ops
  []
  (let [^object worker @db-browser/*worker]
    (.rtc-push-pending-ops worker)))

(rum/defc ^:large-vars/cleanup-todo rtc-debug-ui <
  rum/reactive
  []
  (let [state (rum/react debug-state)
        rtc-state (:rtc-state state)]
    [:div
     [:div.flex
      (ui/button "local-state"
                 :class "mr-2"
                 :icon "refresh"
                 :on-click (fn [_]
                             (let [repo (state/get-current-repo)
                                   ^object worker @db-browser/*worker]
                               (p/let [result (.rtc-get-debug-state worker repo)
                                       new-state (ldb/read-transit-str result)]
                                 (swap! debug-state (fn [old] (merge old new-state)))))))
      (ui/button "graph-list"
                 :icon "refresh"
                 :class "mr-2"
                 :on-click (fn [_]
                             (let [repo (state/get-current-repo)
                                   token (state/get-auth-id-token)
                                   ^object worker @db-browser/*worker]
                               (p/let [result (.rtc-get-graphs worker repo token)
                                       graph-list (bean/->clj result)]
                                 (swap! debug-state assoc
                                        :remote-graphs
                                        (map
                                         #(into {}
                                                (filter second
                                                        (select-keys % [:graph-uuid :graph-name
                                                                        :graph-status
                                                                        :graph<->user-user-type
                                                                        :graph<->user-grant-by-user])))
                                         graph-list))))))
      (shui/button
       {:size :sm
        :on-click #(let [^object worker @db-browser/*worker]
                     (p/let [result (.rtc-get-online-info worker)
                             result* (bean/->clj result)]
                       (swap! debug-state assoc :online-info result*)))}
       (shui/tabler-icon "refresh") "online-info")]

     [:pre.select-text
      (-> {:user-uuid (user/user-uuid)
           :graph (:graph-uuid state)
           :rtc-state rtc-state
           :ws (:ws-state state)
           :local-tx (:local-tx state)
           :pending-block-update-count (:unpushed-block-update-count state)
           :remote-graphs (:remote-graphs state)
           :online-info (:online-info state)
           :auto-push-updates? (:auto-push-updates? state)
           :current-page (state/get-current-page)
           :blocks-count (when-let [page (state/get-current-page)]
                           (count (:block/_page (db/entity [:block/name (util/page-name-sanity-lc page)]))))}
          (fipp/pprint {:width 20})
          with-out-str)]
     (if (or (nil? rtc-state)
             (= :closed rtc-state))
       (ui/button "start" {:class "my-2"
                           :on-click (fn []
                                       (let [token (state/get-auth-id-token)
                                             ^object worker @db-browser/*worker]
                                         (.rtc-start worker (state/get-current-repo) token
                                                     (state/sub [:ui/developer-mode?]))))})

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "send pending ops")
                              {:on-click (fn [] (push-pending-ops))})]
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if (:auto-push-client-ops? state)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (let [^object worker @db-browser/*worker]
                                   (p/let [result (.rtc-toggle-sync worker (state/get-current-repo))]
                                     (swap! debug-state assoc :auto-push-updates? result))))})]
        [:div (ui/button "stop" {:on-click (fn [] (stop))})]])
     (when (some? state)
       [:hr]
       [:div.flex.flex-row
        (ui/button "grant graph access to"
                   {:class "mr-2"
                    :on-click (fn []
                                (let [user-uuid (some-> (:grant-access-to-user state) parse-uuid)
                                      user-email (when-not user-uuid (:grant-access-to-user state))]
                                  (when-let [graph-uuid (:graph-uuid state)]
                                    (let [^object worker @db-browser/*worker]
                                      (.rtc-grant-graph-access worker graph-uuid
                                                               (some-> user-uuid vector ldb/write-transit-str)
                                                               (some-> user-email vector ldb/write-transit-str))))))})

        [:input.form-input.my-2
         {:on-change (fn [e] (swap! debug-state assoc :grant-access-to-user (util/evalue e)))
          :on-focus (fn [e] (let [v (.-value (.-target e))]
                              (when (= v "input email or user-uuid here")
                                (set! (.-value (.-target e)) ""))))
          :default-value "input email or user-uuid here"}]])
     [:hr]
     [:div.flex.flex-row
      (ui/button (str "download graph to")
                 {:class "mr-2"
                  :on-click (fn []
                              (when-let [repo (:download-graph-to-repo state)]
                                (when-let [graph-uuid (:graph-uuid-to-download state)]
                                  (prn :download-graph graph-uuid :to repo)
                                  (let [token (state/get-auth-id-token)
                                        ^object worker @db-browser/*worker]
                                    (.rtc-download-graph worker repo token graph-uuid)))))})
      [:div.flex.flex-col
       (shui/select
        {:on-value-change (fn [v]
                            (some->> (parse-uuid v)
                                     str
                                     (swap! debug-state assoc :graph-uuid-to-download)))}
        (shui/select-trigger
         {:class "!px-2 !py-0 !h-8"}
         (shui/select-value
          {:placeholder "Select a graph-uuid"}))
        (shui/select-content
         (shui/select-group
          (for [{:keys [graph-uuid graph-status]} (:remote-graphs state)]
            (shui/select-item {:value graph-uuid :disabled (some? graph-status)} graph-uuid)))))
       [:input.form-input.my-2
        {:on-change (fn [e] (swap! debug-state assoc :download-graph-to-repo (util/evalue e)))
         :on-focus (fn [e] (let [v (.-value (.-target e))]
                             (when (= v "repo name here")
                               (set! (.-value (.-target e)) ""))))
         :default-value "repo name here"}]]]
     [:div.flex.my-2
      (ui/button (str "upload current repo")
                 {:on-click (fn []
                              (let [repo (state/get-current-repo)
                                    token (state/get-auth-id-token)
                                    remote-graph-name (:upload-as-graph-name state)
                                    ^js worker @db-browser/*worker]
                                (.rtc-upload-graph worker repo token remote-graph-name)))})
      [:input.form-input.my-2
       {:on-change (fn [e] (swap! debug-state assoc :upload-as-graph-name (util/evalue e)))
        :on-focus (fn [e] (let [v (.-value (.-target e))]
                            (when (= v "remote graph name here")
                              (set! (.-value (.-target e)) ""))))
        :default-value "remote graph name here"}]]
     [:div
      (ui/button (str "delete graph")
                 {:on-click (fn []
                              (when-let [graph-uuid (:graph-uuid-to-delete state)]
                                (let [token (state/get-auth-id-token)
                                      ^object worker @db-browser/*worker]
                                  (prn ::delete-graph graph-uuid)
                                  (.rtc-delete-graph worker token graph-uuid))))})
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
         (for [{:keys [graph-uuid graph-status]} (:remote-graphs state)]
           (shui/select-item {:value graph-uuid :disabled (some? graph-status)} graph-uuid)))))]]))
