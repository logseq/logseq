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
     {:on-click (fn [^js e]
                  (when-let [^js btn (.closest (.-target e) ".ui__button")]
                    (.setAttribute btn "disabled" "true")
                    (js/setTimeout #(.removeAttribute btn "disabled") 2000)))}
     [:div.flex.gap-2.flex-wrap.items-center.pb-3
      (shui/button
        {:size :sm
         :on-click (fn [_]
                     (let [repo (state/get-current-repo)
                           ^object worker @db-browser/*worker]
                       (p/let [result (.rtc-get-debug-state worker repo)
                               new-state (ldb/read-transit-str result)]
                         (swap! debug-state (fn [old] (merge old new-state))))))}
        (shui/tabler-icon "refresh") "local-state")

      (shui/button
        {:size :sm
         :on-click
         (fn [_]
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
                   graph-list)))))}
        (shui/tabler-icon "download") "graph-list")

      (shui/button
       {:size :sm
        :on-click #(let [^object worker @db-browser/*worker]
                     (p/let [result (.rtc-get-online-info worker)
                             result* (bean/->clj result)]
                       (swap! debug-state assoc :online-info result*)))}
       (shui/tabler-icon "users") "online-info")]

     [:div.pb-4
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
         with-out-str)]]

     (if (or (nil? rtc-state)
             (= :closed rtc-state))
       (shui/button
         {:variant :outline
          :class "text-green-rx-09 border-green-rx-10 hover:text-green-rx-10"
          :on-click (fn []
                      (let [token (state/get-auth-id-token)
                            ^object worker @db-browser/*worker]
                        (.rtc-start worker (state/get-current-repo) token
                          (state/sub [:ui/developer-mode?]))))}
         (shui/tabler-icon "player-play") "start")

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "send pending ops")
                              {:icon "brand-telegram" :on-click (fn [] (push-pending-ops))})]
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if (:auto-push-client-ops? state)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (let [^object worker @db-browser/*worker]
                                   (p/let [result (.rtc-toggle-sync worker (state/get-current-repo))]
                                     (swap! debug-state assoc :auto-push-updates? result))))})]
        [:div (shui/button
                {:variant :outline
                 :class "text-red-rx-09 border-red-rx-08 hover:text-red-rx-10"
                 :size :sm
                 :on-click (fn [] (stop))}
                (shui/tabler-icon "player-stop") "stop")]])

     (when (some? state)
       [:hr]
       [:div.flex.flex-row.items-center.gap-2
        (ui/button "grant graph access to"
                   {:icon "award"
                    :on-click (fn []
                                (let [user-uuid (some-> (:grant-access-to-user state) parse-uuid)
                                      user-email (when-not user-uuid (:grant-access-to-user state))]
                                  (when-let [graph-uuid (:graph-uuid state)]
                                    (let [^object worker @db-browser/*worker]
                                      (.rtc-grant-graph-access worker graph-uuid
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
                              (when-let [repo (:download-graph-to-repo state)]
                                (when-let [graph-uuid (:graph-uuid-to-download state)]
                                  (prn :download-graph graph-uuid :to repo)
                                  (let [token (state/get-auth-id-token)
                                        ^object worker @db-browser/*worker]
                                    (.rtc-download-graph worker repo token graph-uuid)))))})

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
          (for [{:keys [graph-uuid graph-status]} (:remote-graphs state)]
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
                                    remote-graph-name (:upload-as-graph-name state)
                                    ^js worker @db-browser/*worker]
                                (.rtc-upload-graph worker repo token remote-graph-name)))})
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
                              (-> (shui/dialog-confirm!
                                    {:title [:p.flex.flex-col.gap-1
                                             [:b "Are you sure delete current graph?"]
                                             [:small.line-through.opacity-80 (state/get-current-repo)]]})
                                (p/then #((when-let [graph-uuid (:graph-uuid-to-delete state)]
                                            (let [token (state/get-auth-id-token)
                                                  ^object worker @db-browser/*worker]
                                              (prn ::delete-graph graph-uuid)
                                              (.rtc-delete-graph worker token graph-uuid)))))))})

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
