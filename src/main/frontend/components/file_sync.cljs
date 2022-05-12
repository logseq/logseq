(ns frontend.components.file-sync
  (:require [frontend.state :as state]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.fs.sync :as fs-sync]
            [frontend.components.svg :as svg]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.util :as util]
            [rum.core :as rum]
            [cljs.core.async :as as]))

(rum/defcs file-sync-remote-graphs <
  (rum/local nil ::remote-graphs)
  [state]
  (let [*remote-graphs  (::remote-graphs state)
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
  (rum/local nil ::existed-graphs)
  [state]
  (let [_                  (state/sub :auth/id-token)
        sync-state         (state/sub :file-sync/sync-state)
        not-syncing?       (or (nil? sync-state) (fs-sync/sync-state--stopped? sync-state))
        *existed-graphs    (::existed-graphs state)
        _                  (rum/react file-sync-handler/refresh-file-sync-component)
        graph-txid-exists? (file-sync-handler/graph-txid-exists?)
        uploading-files    (:current-local->remote-files sync-state)
        downloading-files  (:current-remote->local-files sync-state)]

    [:div.cp__file-sync-indicator
     (when (and (not config/publishing?)
             (user-handler/logged-in?))
       (when-not (file-sync-handler/graph-txid-exists?)
         (as/go (reset! *existed-graphs (as/<! (file-sync-handler/list-graphs)))))

       (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           (if not-syncing?
             [:a.button
              {:on-click toggle-fn}
              (ui/icon "cloud-off" {:style {:fontSize ui/icon-size}})]
             [:a.button
              {:on-click toggle-fn}
              (ui/icon "cloud" {:style {:fontSize ui/icon-size}})]))
         (cond-> []
           (not graph-txid-exists?)
           (concat (->> @*existed-graphs
                     (filterv #(and (:GraphName %) (:GraphUUID %)))
                     (mapv (fn [graph]
                             {:title   (:GraphName graph)
                              :options {:on-click #(file-sync-handler/switch-graph (:GraphUUID graph))}})))
             [{:hr true}
              {:title   "Create graph"
               :options {:on-click #(file-sync-handler/create-graph (util/node-path.basename (state/get-current-repo)))}}])

           graph-txid-exists?
           (concat
             [{:title   "Toggle file sync"
               :options {:on-click #(if not-syncing? (fs-sync/sync-start) (fs-sync/sync-stop))}}
              {:title   "Remote graph list"
               :options {:on-click #(state/set-sub-modal! file-sync-remote-graphs)}}]

             [{:hr true}]
             (map (fn [f] {:title f
                           :icon  (ui/icon "arrow-narrow-up")}) uploading-files)
             (map (fn [f] {:title f
                           :icon  (ui/icon "arrow-narrow-down")}) downloading-files)
             (when sync-state
               (map-indexed (fn [i f] (:time f)
                              {:title [:div {:key i} [:div (:path f)] [:div.opacity-50 (util/time-ago (:time f))]]})
                 (take 10 (:history sync-state))))

             ))

         (cond-> {}
           (not graph-txid-exists?)
           (assoc :links-header
             [:div.font-medium.text-sm.opacity-60.px-4.pt-2
              "Switch to:"])))
       )]))
