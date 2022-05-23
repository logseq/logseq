(ns frontend.components.file-sync
  (:require [frontend.state :as state]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.fs.sync :as fs-sync]
            [frontend.components.svg :as svg]
            [frontend.handler.notification :as notifications]
            [frontend.ui :as ui]
            [frontend.handler.page :as page-handler]
            [promesa.core :as p]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.util :as util]
            [rum.core :as rum]
            [electron.ipc :as ipc]
            [cljs.core.async :as as]))

(rum/defcs file-sync-remote-graphs <
  (rum/local nil ::remote-graphs)
  [state]
  (let [*remote-graphs (::remote-graphs state)
        refresh-list-fn #(as/go (reset! *remote-graphs (as/<! (file-sync-handler/list-graphs))))]
    (when (nil? @*remote-graphs)
      (refresh-list-fn))
    [:div
     [:div.flex
      [:h1.title "Remote Graphs"]
      [:div
       {:on-click refresh-list-fn}
       svg/refresh]]
     [:p.text-sm "click to delete the selected graph"]
     [:ul
      (for [graph @*remote-graphs]
        [:li.mb-4
         [:a.font-medium
          {:on-click #(do (println "delete graph" (:GraphName graph) (:GraphUUID graph))
                          (file-sync-handler/delete-graph (:GraphUUID graph)))}
          (:GraphName graph)]])]]))

(rum/defcs indicator <
  rum/reactive
  [_state]
  (let [_ (state/sub :auth/id-token)
        toggling? (state/sub :file-sync/toggling?)
        sync-state (state/sub :file-sync/sync-state)
        _ (rum/react file-sync-handler/refresh-file-sync-component)
        graph-txid-exists? (file-sync-handler/graph-txid-exists?)
        uploading-files (:current-local->remote-files sync-state)
        downloading-files (:current-remote->local-files sync-state)
        queuing-files (:queued-local->remote-files sync-state)

        status (:state sync-state)
        status (or (nil? status) (keyword (name status)))
        off? (or (nil? sync-state) (fs-sync/sync-state--stopped? sync-state))
        full-syncing? (contains? #{:local->remote-full-sync :remote->local-full-sync} status)
        syncing? (or full-syncing? (contains? #{:local->remote :remote->local} status))
        idle? (contains? #{:idle} status)
        queuing? (and idle? (boolean (seq queuing-files)))

        turn-on #(when-not toggling?
                   (state/set-state! :file-sync/toggling? true)
                   (if-not graph-txid-exists?
                     (as/go
                       (notifications/show! "Not a remote graph, ready to init remote graph!" :warn)
                       (let [repo (state/get-current-repo)
                             GraphName (util/node-path.basename repo)]
                         (when-let [GraphUUID (get (as/<! (file-sync-handler/create-graph GraphName)) 2)]
                           (as/<! (fs-sync/sync-start))
                           ;; update existing repo
                           (state/set-repos! (map (fn [r]
                                                    (if (= (:url r) repo)
                                                      (assoc r :GraphUUID GraphUUID
                                                               :GraphName GraphName
                                                               :remote? true)
                                                      r))
                                                  (state/get-repos))))))
                     (fs-sync/sync-start)))

        _ (when (and (not off?) toggling?) (state/set-state! :file-sync/toggling? false))]

    [:div.cp__file-sync-indicator
     (when (and (not config/publishing?)
                (user-handler/logged-in?))

       (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           (if (or (true? toggling?) (not off?))
             [:a.button.cloud.on
              {:on-click toggle-fn
               :class    (util/classnames [{:syncing syncing?
                                            :is-full full-syncing?
                                            :queuing queuing?
                                            :idle    (and (not queuing?) idle?)}])}
              [:span.flex.items-center
               (ui/icon "cloud"
                        {:style {:fontSize ui/icon-size}})]
              (when full-syncing? [:small.full-loading.animate-spin (ui/icon "rotate-clockwise")])]

             [:a.button.cloud.off
              {:on-click turn-on}
              (ui/icon "cloud-off" {:style {:fontSize ui/icon-size}})]))

         (cond-> []
                 graph-txid-exists?
                 (concat
                   (map (fn [f] {:title [:div.file-item f]
                                 :icon  (ui/icon "point")}) queuing-files)
                   (map (fn [f] {:title [:div.file-item f]
                                 :icon  (ui/icon "arrow-narrow-up")}) uploading-files)
                   (map (fn [f] {:title [:div.file-item f]
                                 :icon  (ui/icon "arrow-narrow-down")}) downloading-files)
                   (when sync-state
                     (map-indexed (fn [i f] (:time f)
                                    {:title [:div {:key i} [:div (:path f)] [:div.opacity-50 (util/time-ago (:time f))]]})
                                  (take 10 (:history sync-state))))))

         {:links-header
          [:strong.debug-status (str status)]}))]))

(rum/defc pick-local-graph-for-sync [graph]
  (rum/use-effect!
   (fn []
     (file-sync-handler/set-wait-syncing-graph graph)
     #(file-sync-handler/set-wait-syncing-graph nil))
   [graph])

  [:div.p-5
   [:h1.mb-4.text-4xl "Sync a remote graph to local"]

   [:div.py-3
    [:p.px-2.pb-2
     [:strong "Name: " (:GraphName graph)] [:br]
     [:small "UUID: " (:GraphUUID graph)]]

    [:div
     (ui/button
       (str "Open a local directory")
       :on-click #(-> (page-handler/ls-dir-files!
                       (fn [{:keys [url]}]
                         (file-sync-handler/init-remote-graph url)
                         ;; TODO: wait for switch done
                         (js/setTimeout (fn [] (repo-handler/refresh-repos!)) 200))

                       {:empty-dir?-or-pred
                        (fn [ret]
                          (when-not (nil? (second ret))
                            (if-let [root (first ret)]
                              (do
                                (js/console.log root)
                                (-> (ipc/ipc :readGraphTxIdInfo root)
                                    (p/then (fn [^js info]
                                              (when (or (nil? info)
                                                        (nil? (second info))
                                                        (not= (second info) (:GraphUUID graph)))
                                                (throw (js/Error. "AssertDirectoryError")))))))
                              (throw (js/Error. nil)))))})

                      (p/catch (fn [^js e]
                                 (when (= "AssertDirectoryError" (.-message e))
                                   (notifications/show! "Please select an empty directory or an existing remote graph!" :error))))))
     [:p.text-xs.opacity-50.px-1 (ui/icon "alert-circle") " An empty directory or an existing remote graph!"]]]])

(defn pick-dest-to-sync-panel [graph]
  (pick-local-graph-for-sync graph))
