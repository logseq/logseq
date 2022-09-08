(ns frontend.components.file-sync
  (:require [cljs.core.async :as async]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.util.persist-var :as persist-var]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.onboarding.quick-tour :as quick-tour]
            [frontend.components.page :as page]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.fs :as fs]
            [frontend.fs.sync :as fs-sync]
            [frontend.handler.file-sync :refer [*beta-unavailable?] :as file-sync-handler]
            [frontend.handler.notification :as notifications]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [logseq.graph-parser.config :as gp-config]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(declare maybe-onboarding-show)
(declare open-icloud-graph-clone-picker)

(rum/defc clone-local-icloud-graph-panel
  [repo graph-name close-fn]

  (rum/use-effect!
   #(some->> (state/sub :file-sync/jstour-inst)
             (.complete))
   [])

  (let [graph-dir      (config/get-repo-dir repo)
        [selected-path set-selected-path] (rum/use-state "")
        selected-path? (and (not (string/blank? selected-path))
                            (not (mobile-util/iCloud-container-path? selected-path)))
        on-confirm     (fn []
                         (when-let [dest-dir (and selected-path?
                                                  ;; avoid using `util/node-path.join` to join mobile path since it replaces `file:///abc` to `file:/abc`
                                                  (str (string/replace selected-path #"/+$" "") "/" graph-name))]
                           (-> (cond
                                 (util/electron?)
                                 (ipc/ipc :copyDirectory graph-dir dest-dir)

                                 (mobile-util/native-ios?)
                                 (fs/copy! repo graph-dir dest-dir)

                                 :else
                                 nil)
                               (.then #(do
                                         (notifications/show! (str "Cloned to => " dest-dir) :success)
                                         (web-nfs/ls-dir-files-with-path! dest-dir)
                                         (repo-handler/remove-repo! {:url repo})
                                         (close-fn)))
                               (.catch #(js/console.error %)))))]

    [:div.cp__file-sync-related-normal-modal
     [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "folders")]]

     [:h1.text-xl.font-semibold.opacity-90.text-center.py-2
      "Clone your local graph away from " [:strong "☁️"] " iCloud!"]
     [:h2.text-center.opacity-70.text-xs.leading-5
      "Unfortunately, Logseq Sync and iCloud don't work perfectly together at the moment. To make sure"
      [:br]
      "You can always delete the remote graph at a later point."]

     [:div.folder-tip.flex.flex-col.items-center
      [:h3
       [:span (ui/icon "folder") [:label.pl-0.5 (js/decodeURIComponent graph-name)]]]
      [:h4.px-6 (config/get-string-repo-dir repo)]

      (when (not (string/blank? selected-path))
        [:h5.text-xs.pt-1.-mb-1.flex.items-center.leading-none
         (if (mobile-util/iCloud-container-path? selected-path)
           [:span.inline-block.pr-1.text-red-600.scale-75 (ui/icon "alert-circle")]
           [:span.inline-block.pr-1.text-green-600.scale-75 (ui/icon "circle-check")])
         selected-path])

      [:div.out-icloud
       (ui/button
        [:span.inline-flex.items-center.leading-none.opacity-90
         "Select new parent folder outside of iCloud" (ui/icon "arrow-right")]

        :on-click
        (fn []
          ;; TODO: support mobile
          (cond
            (util/electron?)
            (p/let [path (ipc/ipc "openDialog")]
              (set-selected-path path))

            (mobile-util/native-ios?)
            (p/let [{:keys [path _localDocumentsPath]}
                    (p/chain
                     (.pickFolder mobile-util/folder-picker)
                     #(js->clj % :keywordize-keys true))]
              (set-selected-path path))

            :else
            nil)))]]

     [:p.flex.items-center.space-x-2.pt-6.flex.justify-center.sm:justify-end.-mb-2
      (ui/button "Cancel" :background "gray" :class "opacity-50" :on-click close-fn)
      (ui/button "Clone graph" :disabled (not selected-path?) :on-click on-confirm)]]))

(rum/defc create-remote-graph-panel
  [repo graph-name close-fn]

  (rum/use-effect!
   #(some->> (state/sub :file-sync/jstour-inst)
             (.complete))
   [])

  (let [on-confirm
        (fn []
          (async/go
            (close-fn)
            (if (mobile-util/iCloud-container-path? repo)
              (open-icloud-graph-clone-picker repo)
              (do
                (state/set-state! [:ui/loading? :graph/create-remote?] true)
                (when-let [GraphUUID (get (async/<! (file-sync-handler/create-graph graph-name)) 2)]
                  (async/<! (fs-sync/sync-start))
                  (state/set-state! [:ui/loading? :graph/create-remote?] false)
                 ;; update existing repo
                 (state/set-repos! (map (fn [r]
                                          (if (= (:url r) repo)
                                            (assoc r
                                                   :GraphUUID GraphUUID
                                                   :GraphName graph-name
                                                   :remote? true)
                                            r))
                                     (state/get-repos))))))))]

    [:div.cp__file-sync-related-normal-modal
     [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "cloud-upload")]]

     [:h1.text-xl.font-semibold.opacity-90.text-center.py-2
      "Are you sure you want to create a new remote graph?"]
     [:h2.text-center.opacity-70.text-xs
      "By continuing this action you will create an encrypted cloud version of your current local graph." [:br]
      "You can always delete the remote graph at a later point."]

     [:div.folder-tip.flex.flex-col.items-center
      [:h3
       [:span (ui/icon "folder") [:label.pl-0.5 graph-name]]
       [:span.opacity-50.scale-75 (ui/icon "arrow-right")]
       [:span (ui/icon "cloud-lock")]]
      [:h4.px-4 (config/get-string-repo-dir repo)]]

     [:p.flex.items-center.space-x-2.pt-6.flex.justify-center.sm:justify-end.-mb-2
      (ui/button "Cancel" :background "gray" :class "opacity-50" :on-click close-fn)
      (ui/button "Create remote graph" :on-click on-confirm)]]))

(rum/defcs ^:large-vars/cleanup-todo indicator < rum/reactive
  < {:key-fn #(identity "file-sync-indicator")}
  {:will-mount   (fn [state]
                   (let [unsub-fn (file-sync-handler/setup-file-sync-event-listeners)]
                     (assoc state ::unsub-events unsub-fn)))
   :will-unmount (fn [state]
                   (apply (::unsub-events state) nil)
                   state)}
  [_state]
  (let [_                      (state/sub :auth/id-token)
        current-repo           (state/get-current-repo)
        creating-remote-graph? (state/sub [:ui/loading? :graph/create-remote?])
        sync-state             (state/sub [:file-sync/sync-state current-repo])
        _                      (rum/react file-sync-handler/refresh-file-sync-component)
        synced-file-graph?     (file-sync-handler/synced-file-graph? current-repo)
        uploading-files        (:current-local->remote-files sync-state)
        downloading-files      (:current-remote->local-files sync-state)
        queuing-files          (:queued-local->remote-files sync-state)

        status                 (:state sync-state)
        status                 (or (nil? status) (keyword (name status)))
        off?                   (or (nil? sync-state) (fs-sync/sync-state--stopped? sync-state))
        full-syncing?          (contains? #{:local->remote-full-sync :remote->local-full-sync} status)
        syncing?               (or full-syncing? (contains? #{:local->remote :remote->local} status))
        idle?                  (contains? #{:idle} status)
        need-password?         (contains? #{:need-password} status)
        queuing?               (and idle? (boolean (seq queuing-files)))
        no-active-files?       (empty? (concat downloading-files queuing-files uploading-files))
        create-remote-graph-fn #(when (and current-repo (not (config/demo-graph? current-repo)))
                                  (let [graph-name
                                        (js/decodeURI (util/node-path.basename current-repo))

                                        confirm-fn
                                        (fn [close-fn]
                                          (create-remote-graph-panel current-repo graph-name close-fn))]

                                    (state/set-modal! confirm-fn {:center? true :close-btn? false})))
        turn-on                #(async/go
                                  (async/<! (p->c (persist-var/-load fs-sync/graphs-txid)))
                                  (cond
                                    @*beta-unavailable?
                                    (state/pub-event! [:file-sync/onboarding-tip :unavailable])

                                    ;; current graph belong to other user, do nothing
                                    (and (first @fs-sync/graphs-txid)
                                         (not (fs-sync/check-graph-belong-to-current-user (user-handler/user-uuid)
                                                                                          (first @fs-sync/graphs-txid))))
                                    nil

                                    (and synced-file-graph?
                                         (second @fs-sync/graphs-txid)
                                         (async/<! (fs-sync/<check-remote-graph-exists (second @fs-sync/graphs-txid))))
                                    (fs-sync/sync-start)


                                    ;; remote graph already has been deleted, clear repos first, then create-remote-graph
                                    synced-file-graph?      ; <check-remote-graph-exists -> false
                                    (do (state/set-repos!
                                         (map (fn [r]
                                                (if (= (:url r) current-repo)
                                                  (dissoc r :GraphUUID :GraphName :remote?)
                                                  r))
                                              (state/get-repos)))
                                        (create-remote-graph-fn))

                                    :else
                                    (create-remote-graph-fn)))]

    (if creating-remote-graph?
      (ui/loading "")
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
            synced-file-graph?
            (concat
             (if (and no-active-files? idle?)
               [{:item [:div.flex.justify-center.w-full.py-2
                        [:span.opacity-60 "Everything is synced!"]]
                 :as-link? false}]
               (if need-password?
                 [{:title   [:div.file-item
                             (ui/icon "lock") "Password is required"]
                   :options {:on-click #(state/pub-event! [:file-sync/restart])}}]
                 [{:title   [:div.file-item.is-first ""]
                   :options {:class "is-first-placeholder"}}]))

             (map (fn [f] {:title [:div.file-item
                                   {:key (str "downloading-" f)}
                                   (js/decodeURIComponent f)]
                           :key   (str "downloading-" f)
                           :icon  (ui/icon "arrow-narrow-down")}) downloading-files)
             (map (fn [e] (let [icon (case (.-type e)
                                       "add"    "plus"
                                       "unlink" "minus"
                                       "edit")
                                path (fs-sync/relative-path e)]
                            {:title [:div.file-item
                                     {:key (str "queue-" path)}
                                     (js/decodeURIComponent path)]
                             :key   (str "queue-" path)
                             :icon  (ui/icon icon)})) (take 10 queuing-files))
             (map (fn [f] {:title [:div.file-item
                                   {:key (str "uploading-" f)}
                                   (js/decodeURIComponent f)]
                           :key   (str "uploading-" f)
                           :icon  (ui/icon "arrow-up")}) uploading-files)

             (when sync-state
               (map-indexed (fn [i f] (:time f)
                              (let [path       (:path f)
                                    ext        (string/lower-case (util/get-file-ext path))
                                    _supported? (gp-config/mldoc-support? ext)
                                    full-path  (util/node-path.join (config/get-repo-dir current-repo) path)
                                    page-name  (db/get-file-page full-path)]
                                {:title [:div.files-history.cursor-pointer
                                         {:key i :class (when (= i 0) "is-first")
                                          :on-click (fn []
                                                      (if page-name
                                                        (rfe/push-state :page {:name page-name})
                                                        (rfe/push-state :file {:path full-path})))}
                                         [:span.file-sync-item (js/decodeURIComponent (:path f))]
                                         [:div.opacity-50 (ui/humanity-time-ago (:time f) nil)]]}))
                            (take 10 (:history sync-state))))))

          {:links-header
           [:<>
            (when (and synced-file-graph? queuing?)
              [:div.head-ctls
               (ui/button "Sync now"
                          :class "block cursor-pointer"
                          :small? true
                          :on-click #(async/offer! fs-sync/immediately-local->remote-chan true))])

                                        ;(when config/dev?
                                        ;  [:strong.debug-status (str status)])
            ]}))])))

(rum/defc pick-local-graph-for-sync [graph]
  (rum/use-effect!
   (fn []
     (file-sync-handler/set-wait-syncing-graph graph)
     #(file-sync-handler/set-wait-syncing-graph nil))
   [graph])

  [:div.cp__file-sync-related-normal-modal
   [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "cloud-download")]]

   [:h1.mb-5.text-2xl.text-center.font-bold "Sync a remote graph to local"]

   [:div.folder-tip.flex.flex-col.items-center
    {:style {:border-bottom-right-radius 0 :border-bottom-left-radius 0}}
    [:h3
     [:span.flex.space-x-2.leading-none.pb-1
      (ui/icon "cloud-lock")
      [:span (:GraphName graph)]
      [:span.scale-75 (ui/icon "arrow-right")]
      [:span (ui/icon "folder")]]]
    [:h4.px-2.-mb-1.5 [:strong "UUID: "] (:GraphUUID graph)]]

   [:div.-mt-1
    (ui/button
      (str "Open a local directory")
      :class "w-full rounded-t-none py-4"
      :on-click #(->
                  (page-handler/ls-dir-files!
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
                                  (fs-util/read-graphs-txid-info root)))

                              (p/then (fn [^js info]
                                        (when (and (not empty-dir?)
                                                   (or (nil? info)
                                                       (nil? (second info))
                                                       (not= (second info) (:GraphUUID graph))))
                                          (if (js/confirm "This directory is not empty, are you sure to sync the remote graph to it? Make sure to back up the directory first.")
                                            (do
                                              (state/set-state! :graph/remote-binding? true)
                                              (p/resolved nil))
                                            (throw (js/Error. nil)))))))

                          ;; cancel pick a directory
                          (throw (js/Error. nil)))))})
                  (p/catch (fn []))))
    [:p.text-xs.opacity-50.px-1 (ui/icon "alert-circle") " An empty directory or an existing remote graph!"]]])

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
            [:a.item-link.block.fade-link.flex.justify-between
             {:title    version-uuid
              :class    (util/classnames
                         [{:active (and current-page (= version-uuid (get-version-key current-page)))}])
              :on-click #(set-page-fn version)}

             [:div.text-sm.pt-1
              (ui/humanity-time-ago
               (or (:CreateTime version)
                   (:create-time version)) nil)]
             [:small.opacity-50.translate-y-1
              (if _local?
                [:<> (ui/icon "git-commit") " local"]
                [:<> (ui/icon "cloud") " remote"])]]])))]))

(rum/defc pick-page-histories-for-sync
  [repo-url graph-uuid page-name page-entity]
  (let [[selected-page set-selected-page] (rum/use-state nil)
        get-version-key    #(or (:VersionUUID %) (:relative-path %))
        file-uuid          (:FileUUID selected-page)
        version-uuid       (:VersionUUID selected-page)
        [version-content set-version-content] (rum/use-state nil)
        [list-ready? set-list-ready?] (rum/use-state false)
        [content-ready? set-content-ready?] (rum/use-state false)
        *ref-contents      (rum/use-ref (atom {}))
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

(rum/defc onboarding-welcome-logseq-sync
  [close-fn]

  (let [[loading? set-loading?] (rum/use-state false)]
    [:div.cp__file-sync-welcome-logseq-sync
     [:span.head-bg

      [:strong "CLOSED BETA"]]

     [:h1.text-2xl.font-bold.flex-col.sm:flex-row
      [:span.opacity-80 "Welcome to "]
      [:span.pl-2.dark:text-white.text-gray-800 "Logseq Sync! 👋"]]

     [:h2
      "No more cloud storage worries. With Logseq's encrypted file syncing, "
      [:br]
      "you'll always have your notes backed up and available in real-time on any device."]

     [:div.pt-6.flex.justify-center.space-x-2.sm:justify-end
      (ui/button "Later" :on-click close-fn :background "gray" :class "opacity-60")
      (ui/button "Start syncing"
                 :disabled loading?
                 :on-click (fn []
                             (set-loading? true)
                             (let [result (:user/info @state/state)
                                   ex-time (:ExpireTime result)]
                               (if (and (number? ex-time)
                                        (< (* ex-time 1000) (js/Date.now)))
                                 (do
                                   (vreset! *beta-unavailable? true)
                                   (maybe-onboarding-show :unavailable))

                                 ;; Logseq sync available
                                 (maybe-onboarding-show :sync-initiate))
                               (close-fn)
                               (set-loading? false))
                             ))]]))

(rum/defc onboarding-unavailable-file-sync
  [close-fn]

  [:div.cp__file-sync-unavailable-logseq-sync
   [:span.head-bg]

   [:h1.text-2xl.font-bold
    [:span.pr-2.dark:text-white.text-gray-800 "Logseq Sync"]
    [:span.opacity-80 "is not yet available for you. 😔 "]]

   [:h2
    "Thanks for creating an account! To ensure that our file syncing service runs well when we release it"
    [:br]
    "to our users, we need a little more time to test it. That’s why we decided to first roll it out only to our "
    [:br]
    "charitable OpenCollective sponsors. We can notify you once it becomes available for you."]

   [:div.pt-6.flex.justify-end.space-x-2
    (ui/button "Close" :on-click close-fn :background "gray" :class "opacity-60")]])

(rum/defc onboarding-congrats-successful-sync
  [close-fn]

  [:div.cp__file-sync-related-normal-modal
   [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "checkup-list")]]

   [:h1.text-xl.font-semibold.opacity-90.text-center.py-2
    [:span.dark:opacity-80 "Congrats on your first successful sync!"]]

   [:h2.text-center.dark:opacity-70.text-sm.opacity-90
    [:div "By using this graph with Logseq Sync you can now transition seamlessly between your different "]
    [:div
     [:span "devices. Go to the "]
     [:span.dark:text-white "All Graphs "]
     [:span "pages to manage your remote graph or switch to another local graph "]]
    [:div "and sync it as well."]]

   [:div.cloud-tip.rounded-md.mt-6.py-4
    [:div.items-center.opacity-90.flex.justify-center
     [:span.pr-2 (ui/icon "bell-ringing" {:class "font-semibold"})]
     [:strong "Logseq Sync is still in Beta and we're working on a Pro plan!"]]

    ;; [:ul.flex.py-6.px-4
    ;;  [:li.it
    ;;   [:h1.dark:text-white "10"]
    ;;   [:h2 "Remote Graphs"]]
    ;;  [:li.it
    ;;   [:h1.dark:text-white "5G"]
    ;;   [:h2 "Storage per Graph"]]

    ;;  [:li.it
    ;;   [:h1.dark:text-white "50G"]
    ;;   [:h2 "Total Storage"]]]
    ]

   [:div.pt-6.flex.justify-end.space-x-2
    (ui/button "Done" :on-click close-fn)]])

(defn open-icloud-graph-clone-picker
  ([] (open-icloud-graph-clone-picker (state/get-current-repo)))
  ([repo]
   (when (and repo (mobile-util/iCloud-container-path? repo))
     (state/set-modal!
      (fn [close-fn]
        (clone-local-icloud-graph-panel repo (util/node-path.basename repo) close-fn))
      {:close-btn? false :center? true}))))

(defn make-onboarding-panel
  [type]

  (fn [close-fn]

    (case type
      :welcome
      (onboarding-welcome-logseq-sync close-fn)

      :unavailable
      (onboarding-unavailable-file-sync close-fn)

      :congrats
      (onboarding-congrats-successful-sync close-fn)

      [:p
       [:h1.text-xl.font-bold "Not handled!"]
       [:a.button {:on-click close-fn} "Got it!"]])))

(defn maybe-onboarding-show
  [type]
  (when-not (get (state/sub :file-sync/onboarding-state) (keyword type))
    (try
      (let [current-repo (state/get-current-repo)
            local-repo?  (= current-repo config/local-repo)
            login?       (boolean (state/sub :auth/id-token))]

        (when login?
          (case type

            :welcome
            (when (or local-repo?
                      (:GraphUUID (repo-handler/get-detail-graph-info current-repo)))
              (throw (js/Error. "current repo have been local or remote graph")))

            (:sync-initiate :sync-learn :sync-history)
            (do (quick-tour/ready
                 (fn []
                   (quick-tour/start-file-sync type)
                   (state/set-state! [:file-sync/onboarding-state type] true)))
                (throw (js/Error. nil)))
            :default)

          (state/pub-event! [:file-sync/onboarding-tip type])
          (state/set-state! [:file-sync/onboarding-state (keyword type)] true)))
      (catch js/Error e
        (js/console.warn "[onboarding SKIP] " (name type) e)))))
