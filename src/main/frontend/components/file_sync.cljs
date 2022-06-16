(ns frontend.components.file-sync
  (:require [frontend.state :as state]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.fs.sync :as fs-sync]
            [frontend.handler.notification :as notifications]
            [frontend.ui :as ui]
            [frontend.handler.page :as page-handler]
            [frontend.components.page :as page]
            [promesa.core :as p]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.util :as util]
            [frontend.db.model :as db-model]
            [frontend.components.lazy-editor :as lazy-editor]
            [rum.core :as rum]
            [cljs-time.coerce :as tc]
            [electron.ipc :as ipc]
            [frontend.util.fs :as fs-util]
            [cljs.core.async :as async]))

(rum/defcs indicator <
  rum/reactive
  [_state]
  (let [_                  (state/sub :auth/id-token)
        current-repo       (state/get-current-repo)
        sync-state         (state/sub [:file-sync/sync-state current-repo])
        _                  (rum/react file-sync-handler/refresh-file-sync-component)
        graph-txid-exists? (file-sync-handler/graph-txid-exists?)
        uploading-files    (:current-local->remote-files sync-state)
        downloading-files  (:current-remote->local-files sync-state)
        queuing-files      (:queued-local->remote-files sync-state)

        status             (:state sync-state)
        status             (or (nil? status) (keyword (name status)))
        off?               (or (nil? sync-state) (fs-sync/sync-state--stopped? sync-state))
        full-syncing?      (contains? #{:local->remote-full-sync :remote->local-full-sync} status)
        syncing?           (or full-syncing? (contains? #{:local->remote :remote->local} status))
        idle?              (contains? #{:idle} status)
        need-password?     (contains? #{:need-password} status)
        queuing?           (and idle? (boolean (seq queuing-files)))

        turn-on            #(if-not graph-txid-exists?
                              (async/go
                                (notifications/show! "Going to init a remote graph!" :warn)
                                (let [repo      (state/get-current-repo)
                                      GraphName (util/node-path.basename repo)]
                                  (when-let [GraphUUID (get (async/<! (file-sync-handler/create-graph GraphName)) 2)]
                                    (async/<! (fs-sync/sync-start))
                                    ;; update existing repo
                                    (state/set-repos! (map (fn [r]
                                                             (if (= (:url r) repo)
                                                               (assoc r :GraphUUID GraphUUID
                                                                      :GraphName GraphName
                                                                      :remote? true)
                                                               r))
                                                           (state/get-repos))))))
                              (fs-sync/sync-start))]

    [:div.cp__file-sync-indicator
     (when (and (not config/publishing?)
                (user-handler/logged-in?))

       (ui/dropdown-with-links
        (fn [{:keys [toggle-fn]}]
          (if (not off?)
            [:a.button.cloud.on
             {:on-click toggle-fn
              :class    (util/classnames [{:syncing syncing?
                                           :is-full full-syncing?
                                           :queuing queuing?
                                           :idle    (and (not queuing?) idle?)}])}
             [:span.flex.items-center
              (ui/icon "cloud"
                       {:style {:fontSize ui/icon-size}})]]

            [:a.button.cloud.off
             {:on-click turn-on}
             (ui/icon "cloud-off" {:style {:fontSize ui/icon-size}})]))

        (cond-> []
          need-password?
          (conj {:title   [:strong "Set a password to start"]
                 :icon    (ui/icon "lock-off")
                 :options {:on-click #(let [current-graph (repo-handler/get-detail-graph-info current-repo)]
                                        (state/pub-event!
                                         [:modal/remote-encryption-input-pw-dialog current-repo current-graph
                                          :input-pwd-remote (fn [] (fs-sync/restore-pwd! (:GraphUUID current-graph)))]))}})

          graph-txid-exists?
          (concat
           (map (fn [f] {:title [:div.file-item f]
                         :key   (str "downloading-" f)
                         :icon  (ui/icon "arrow-narrow-down")}) downloading-files)
           (map (fn [f] {:title [:div.file-item f]
                         :key   (str "queue-" f)
                         :icon  (ui/icon "point")}) (take 10 queuing-files))
           (map (fn [f] {:title [:div.file-item f]
                         :key   (str "uploading-" f)
                         :icon  (ui/icon "arrow-narrow-up")}) uploading-files)
           (when sync-state
             (map-indexed (fn [i f] (:time f)
                            {:title [:div {:key i} [:div (:path f)] [:div.opacity-50 (util/time-ago (:time f))]]})
                          (take 10 (:history sync-state))))))

        {:links-header
         [:<>
          (when (and graph-txid-exists? queuing?)
            [:div.px-2.py-1
             (ui/button "Sync now"
                        :class "block"
                        :small? true
                        :on-click #(async/offer! fs-sync/immediately-local->remote-chan true))])
          (when config/dev?
            [:strong.debug-status (str status)])]}))]))

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
     [:small.italic "UUID: " (:GraphUUID graph)]]

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
                         (let [empty-dir? (nil? (second ret))]
                           (if-let [root (first ret)]

                             ;; verify directory
                             (-> (if empty-dir?
                                   (p/resolved nil)
                                   (if (util/electron?)
                                     (ipc/ipc :readGraphTxIdInfo root)
                                     (fs-util/read-graph-txid-info root)))

                                 (p/then (fn [^js info]
                                           (when (and (not empty-dir?)
                                                      (or (nil? info)
                                                          (nil? (second info))
                                                          (not= (second info) (:GraphUUID graph))))
                                             (throw (js/Error. "AssertDirectoryError"))))))

                             ;; cancel pick a directory
                             (throw (js/Error. nil)))))})

                     (p/catch (fn [^js e]
                                (when (= "AssertDirectoryError" (.-message e))
                                  (notifications/show! "Please select an empty directory or an existing remote graph!" :error))))))
     [:p.text-xs.opacity-50.px-1 (ui/icon "alert-circle") " An empty directory or an existing remote graph!"]]]])

(defn pick-dest-to-sync-panel [graph]
  (fn []
    (pick-local-graph-for-sync graph)))

(rum/defc page-history-list
  [graph-uuid page-entity set-list-ready? set-page]

  (let [[version-files set-version-files] (rum/use-state nil)
        [current-page set-current-page] (rum/use-state nil)
        [loading? set-loading?] (rum/use-state false)

        set-page-fn     (fn [page-meta]
                          (set-current-page page-meta)
                          (set-page page-meta))

        get-version-key #(or (:VersionUUID %) (:relative-path %))]

    ;; fetch version files
    (rum/use-effect!
     (fn []
       (when-not loading?
         (async/go
           (set-loading? true)
           (try
             (let [files (async/<! (file-sync-handler/fetch-page-file-versions graph-uuid page-entity))]
               (set-version-files files)
               (set-page-fn (first files))
               (set-list-ready? true))
             (finally (set-loading? false)))))
       #())
     [])

    [:div.version-list
     (if loading?
       [:div.p-4 (ui/loading "Loading...")]
       (for [version version-files]
         (let [version-uuid (get-version-key version)
               _local?      (some? (:relative-path version))]
           [:div.version-list-item {:key version-uuid}
            [:a.item-link.block.fade-link
             {:title    version-uuid
              :class    (util/classnames
                         [{:active (and current-page (= version-uuid (get-version-key current-page)))}])
              :on-click #(set-page-fn version)}

             [:div.text-sm.pt-1
              (util/time-ago (or (tc/from-string (:CreateTime version))
                                 (:create-time version)))]]])))]))

(rum/defc pick-page-histories-for-sync
  [repo-url graph-uuid page-name page-entity]
  (let [[selected-page set-selected-page] (rum/use-state nil)
        get-version-key #(or (:VersionUUID %) (:relative-path %))
        file-uuid       (:FileUUID selected-page)
        version-uuid    (:VersionUUID selected-page)
        [version-content set-version-content] (rum/use-state nil)
        [list-ready? set-list-ready?] (rum/use-state false)
        [content-ready? set-content-ready?] (rum/use-state false)
        *ref-contents   (rum/use-ref (atom {}))
        original-page-name (or (:block/original-name page-entity) page-name)]

    (rum/use-effect!
     #(when selected-page
        (set-content-ready? false)
        (let [k               (get-version-key selected-page)
              loaded-contents @(rum/deref *ref-contents)]
          (if (contains? loaded-contents k)
            (do
              (set-version-content (get loaded-contents k))
              (js/setTimeout (fn [] (set-content-ready? true)) 100))

            ;; without cache
            (let [load-file (fn [repo-url file]
                              (-> (fs-util/read-repo-file repo-url file)
                                  (p/then
                                   (fn [content]
                                     (set-version-content content)
                                     (set-content-ready? true)
                                     (swap! (rum/deref *ref-contents) assoc k content)))))]
              (if (and file-uuid version-uuid)
                ;; read remote content
                (async/go
                  (let [downloaded-path (async/<! (file-sync-handler/download-version-file graph-uuid file-uuid version-uuid true))]
                    (when downloaded-path
                      (load-file repo-url downloaded-path))))

                ;; read local content
                (when-let [relative-path (:relative-path selected-page)]
                  (load-file repo-url relative-path)))))))
     [selected-page])

    (rum/use-effect!
     (fn []
       (state/update-state! :editor/hidden-editors #(conj % page-name))

       ;; clear effect
       (fn []
         (state/update-state! :editor/hidden-editors #(disj % page-name))))
     [page-name])

    [:div.cp__file-sync-page-histories.flex-wrap
     {:class (util/classnames [{:is-list-ready list-ready?}])}

     [:h1.absolute.top-0.left-0.text-xl.px-4.py-4.leading-4
      (ui/icon "history")
      " History for page "
      [:span.font-medium original-page-name]]

     ;; history versions
     [:div.cp__file-sync-page-histories-left.flex-wrap
      ;; sidebar lists
      (page-history-list graph-uuid page-entity set-list-ready? set-selected-page)

      ;; content detail
      [:article
       (when-let [inst-id (and selected-page (get-version-key selected-page))]
         (if content-ready?
           [:div.relative.raw-content-editor
            (lazy-editor/editor
             nil inst-id {:data-lang "markdown"}
             version-content {:lineWrapping true :readOnly true :lineNumbers true})
            [:div.absolute.top-1.right-1.opacity-50.hover:opacity-100
             (ui/button "Restore"
               :small? true
               :on-click #(state/pub-event! [:file-sync-graph/restore-file (state/get-current-repo) page-entity version-content]))]]
           [:span.flex.p-15.items-center.justify-center (ui/loading "")]))]]

     ;; current version
     [:div.cp__file-sync-page-histories-right
      [:h1.title.text-xl
       "Current version"]
      (page/page-blocks-cp (state/get-current-repo) page-entity nil)]

     ;; ready loading
     [:div.flex.items-center.h-full.justify-center.w-full.absolute.ready-loading
      (ui/loading "Loading...")]]))

(defn pick-page-histories-panel [graph-uuid page-name]
  (fn []
    (if-let [page-entity (db-model/get-page page-name)]
      (pick-page-histories-for-sync (state/get-current-repo) graph-uuid page-name page-entity)
      (ui/admonition :warning (str "The page (" page-name ") does not exist!")))))
