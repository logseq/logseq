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
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [frontend.storage :as storage]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [goog.functions :refer [debounce]]
            [logseq.graph-parser.util :as gp-util]))

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
                            (not (mobile-util/in-iCloud-container-path? selected-path)))
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
                                         (notification/show! (str "Cloned to => " dest-dir) :success)
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
       [:span (ui/icon "folder") [:label.pl-0.5 (gp-util/safe-decode-uri-component graph-name)]]]
      [:h4.px-6 (config/get-string-repo-dir repo)]

      (when (not (string/blank? selected-path))
        [:h5.text-xs.pt-1.-mb-1.flex.items-center.leading-none
         (if (mobile-util/in-iCloud-container-path? selected-path)
           [:span.inline-block.pr-1.text-error.scale-75 (ui/icon "alert-circle")]
           [:span.inline-block.pr-1.text-success.scale-75 (ui/icon "circle-check")])
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
            (if (mobile-util/in-iCloud-container-path? repo)
              (open-icloud-graph-clone-picker repo)
              (do
                (state/set-state! [:ui/loading? :graph/create-remote?] true)
                (when-let [GraphUUID (get (async/<! (file-sync-handler/create-graph graph-name)) 2)]
                  (async/<! (fs-sync/<sync-start))
                  (state/set-state! [:ui/loading? :graph/create-remote?] false)
                  ;; update both local && remote graphs
                  (state/add-remote-graph! {:GraphUUID GraphUUID
                                            :GraphName graph-name})
                  (state/set-repos! (map (fn [r]
                                           (if (= (:url r) repo)
                                             (assoc r
                                                    :GraphUUID GraphUUID
                                                    :GraphName graph-name
                                                    :remote? true)
                                             r))
                                         (state/get-repos))))))))]

    [:div.cp__file-sync-related-normal-modal
     [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "cloud-upload" {:size 20})]]

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

(rum/defc indicator-progress-pie
  [percentage]

  (let [*el (rum/use-ref nil)]
    (rum/use-effect!
     #(when-let [^js el (rum/deref *el)]
        (set! (.. el -style -backgroundImage)
              (util/format "conic-gradient(var(--ls-pie-fg-color) %s%, var(--ls-pie-bg-color) %s%)" percentage percentage)))
     [percentage])
    [:span.cp__file-sync-indicator-progress-pie {:ref *el}]))

(rum/defc last-synced-cp < rum/reactive
  []
  (let [last-synced-at (state/sub [:file-sync/graph-state
                                   (state/get-current-file-sync-graph-uuid)
                                   :file-sync/last-synced-at])
        last-synced-at (if last-synced-at
                         (util/time-ago (tc/from-long (* last-synced-at 1000)))
                         "just now")]
    [:div.cl
     [:span.opacity-60 "Last change was"]
     [:span.pl-1 last-synced-at]]))

(rum/defc sync-now
  []
  (ui/button "Sync now"
             :class "block cursor-pointer"
             :small? true
             :on-click #(async/offer! fs-sync/immediately-local->remote-chan true)
             :style {:color "#ffffff"}))

(def *last-calculated-time (atom nil))

(rum/defc ^:large-vars/cleanup-todo indicator-progress-pane
  [sync-state sync-progress
   {:keys [idle? syncing? no-active-files? online? history-files? queuing?]}]

  (rum/use-effect!
   (fn []
     #(reset! *last-calculated-time nil))
   [])

  (let [uploading-files        (:current-local->remote-files sync-state)
        downloading-files      (:current-remote->local-files sync-state)
        uploading?             (seq uploading-files)
        downloading?           (seq downloading-files)

        progressing?           (or uploading? downloading?)

        full-upload-files      (:full-local->remote-files sync-state)
        full-download-files    (:full-remote->local-files sync-state)
        calc-progress-total    #(cond
                                  uploading? (count full-upload-files)
                                  downloading? (count full-download-files)
                                  :else 0)
        calc-progress-finished (fn []
                                 (let [current-sync-files (set
                                                           (->> (or (seq full-upload-files) (seq full-download-files))
                                                                (map :path)))]
                                   (count (filter #(and (= (:percent (second %)) 100)
                                                        (contains? current-sync-files (first %))) sync-progress))))
        calc-time-left         (fn [] (let [last-calculated-at (:calculated-at @*last-calculated-time)
                                            now                (tc/to-epoch (t/now))]
                                        (if (and last-calculated-at (< (- now last-calculated-at) 10))
                                          (:result @*last-calculated-time)
                                          (let [result (file-sync-handler/calculate-time-left sync-state sync-progress)]
                                            (reset! *last-calculated-time {:calculated-at now
                                                                           :result        result})
                                            result))))

        p-total                (if syncing? (calc-progress-total) 0)
        p-finished             (if syncing? (calc-progress-finished) 0)
        tip-b&p                (if (and syncing? progressing?)
                                 [[:span (util/format "%s of %s files" p-finished p-total)]
                                  [:div.progress-bar [:i {:style
                                                          {:width (str (if (> p-total 0)
                                                                         (* (/ p-finished p-total) 100) 0) "%")}}]]]
                                 [[:span.opacity-60 "all file edits"]
                                  (last-synced-cp)])
        *el-ref                (rum/use-ref nil)
        [list-active?, set-list-active?] (rum/use-state
                                          (-> (storage/get :ui/file-sync-active-file-list?)
                                              (#(if (nil? %) true %))))]

    (rum/use-effect!
     (fn []
       (when-let [^js outer-class-list
                  (some-> (rum/deref *el-ref)
                          (.closest ".menu-links-outer")
                          (.-classList))]
         (->> "is-list-active"
              (#(if list-active?
                  (.add outer-class-list %)
                  (.remove outer-class-list %))))
         (storage/set :ui/file-sync-active-file-list? list-active?)))
     [list-active?])

    (let [idle-&-no-active? (and idle? no-active-files?)
          waiting? (not (or (not online?)
                            idle-&-no-active?
                            syncing?))]
      [:div.cp__file-sync-indicator-progress-pane
       {:ref *el-ref
        :class (when (and syncing? progressing?) "is-progress-active")}
       [:div.a
        [:div.al
         [:strong
          {:class (when idle-&-no-active? "is-no-active")}
          (cond
            (not online?) (ui/icon "wifi-off")
            uploading? (ui/icon "arrow-up")
            downloading? (ui/icon "arrow-down")
            :else (ui/icon "thumb-up"))]
         [:span
          (cond
            (not online?) "Currently having connection issues..."
            idle-&-no-active? "Everything is synced!"
            syncing? "Currently syncing your graph..."
            :else "Waiting...")]]
        [:div.ar
         (when queuing? (sync-now))]]

       (when-not waiting?
         [:div.b.dark:text-gray-200
          [:div.bl
           [:span.flex.items-center
            (if no-active-files?
              [:span.opacity-100.pr-1 "Successfully processed"]
              [:span.opacity-60.pr-1 "Processed"])]

           (first tip-b&p)]

          [:div.br
           [:small.opacity-50
            (when syncing?
              (calc-time-left))]]])

       [:div.c
        (second tip-b&p)
        (when (or history-files? (not no-active-files?))
          [:span.inline-flex.ml-1.active:opacity-50
           {:on-click #(set-list-active? (not list-active?))}
           (if list-active?
             (ui/icon "chevron-up" {:style {:font-size 24}})
             (ui/icon "chevron-left" {:style {:font-size 24}}))])]])))

(defn- sort-files
  [files]
  (sort-by (fn [f] (or (:size f) 0)) > files))

(rum/defcs ^:large-vars/cleanup-todo indicator <
  rum/reactive
  {:key-fn #(identity "file-sync-indicator")}
  {:will-mount   (fn [state]
                   (let [unsub-fn (file-sync-handler/setup-file-sync-event-listeners)]
                     (assoc state ::unsub-events unsub-fn)))
   :will-unmount (fn [state]
                   (apply (::unsub-events state) nil)
                   state)}
  [_state]
  (let [_                       (state/sub :auth/id-token)
        online?                 (state/sub :network/online?)
        enabled-progress-panel? true
        current-repo            (state/get-current-repo)
        creating-remote-graph?  (state/sub [:ui/loading? :graph/create-remote?])
        current-graph-id        (state/sub-current-file-sync-graph-uuid)
        sync-state              (state/sub-file-sync-state current-graph-id)
        sync-progress           (state/sub [:file-sync/graph-state
                                            current-graph-id
                                            :file-sync/progress])
        _                       (rum/react file-sync-handler/refresh-file-sync-component)
        synced-file-graph?      (file-sync-handler/synced-file-graph? current-repo)
        uploading-files         (sort-files (:current-local->remote-files sync-state))
        downloading-files       (sort-files (:current-remote->local-files sync-state))
        queuing-files           (:queued-local->remote-files sync-state)
        history-files           (:history sync-state)
        status                  (:state sync-state)
        status                  (or (nil? status) (keyword (name status)))
        off?                    (fs-sync/sync-off? sync-state)
        full-syncing?           (contains? #{:local->remote-full-sync :remote->local-full-sync} status)
        syncing?                (or full-syncing? (contains? #{:local->remote :remote->local} status))
        idle?                   (contains? #{:idle} status)
        need-password?          (and (contains? #{:need-password} status)
                                     (not (fs-sync/graph-encrypted?)))
        queuing?                (and idle? (boolean (seq queuing-files)))
        no-active-files?        (empty? (concat downloading-files queuing-files uploading-files))
        create-remote-graph-fn  #(when (and current-repo (not (config/demo-graph? current-repo)))
                                   (let [graph-name
                                         (js/decodeURI (util/node-path.basename current-repo))

                                         confirm-fn
                                         (fn [close-fn]
                                           (create-remote-graph-panel current-repo graph-name close-fn))]

                                     (state/set-modal! confirm-fn {:center? true :close-btn? false})))
        turn-on                 (->
                                 (fn []
                                   (when-not (file-sync-handler/current-graph-sync-on?)
                                     (async/go
                                       (let [graphs-txid fs-sync/graphs-txid]
                                         (async/<! (p->c (persist-var/-load graphs-txid)))
                                         (cond
                                           @*beta-unavailable?
                                           (state/pub-event! [:file-sync/onboarding-tip :unavailable])

                                           ;; current graph belong to other user, do nothing
                                           (let [user-uuid (async/<! (user-handler/<user-uuid))
                                                 user-uuid (when-not (instance? ExceptionInfo user-uuid) user-uuid)]
                                             (and (first @graphs-txid)
                                                  user-uuid
                                                  (not (fs-sync/check-graph-belong-to-current-user
                                                        user-uuid
                                                        (first @graphs-txid)))))
                                           nil

                                           (and (second @graphs-txid)
                                                (fs-sync/graph-sync-off? (second @graphs-txid))
                                                (async/<! (fs-sync/<check-remote-graph-exists (second @graphs-txid))))
                                           (fs-sync/<sync-start)

                                           ;; remote graph already has been deleted, clear repos first, then create-remote-graph
                                           (second @graphs-txid) ; <check-remote-graph-exists -> false
                                           (do (state/set-repos!
                                                (map (fn [r]
                                                       (if (= (:url r) current-repo)
                                                         (dissoc r :GraphUUID :GraphName :remote?)
                                                         r))
                                                     (state/get-repos)))
                                               (create-remote-graph-fn))

                                           (second @graphs-txid) ; sync not started yet
                                           nil

                                           :else
                                           (create-remote-graph-fn))))))
                                 (debounce 1500))]
    (if creating-remote-graph?
      (ui/loading "")
      [:div.cp__file-sync-indicator
       {:class (util/classnames
                [{:is-enabled-progress-pane enabled-progress-panel?
                  :has-active-files         (not no-active-files?)}
                 (str "status-of-" (and (keyword? status) (name status)))])}
       (when (and (not config/publishing?)
                  (user-handler/logged-in?))
         (ui/dropdown-with-links
          ;; trigger
          (fn [{:keys [toggle-fn]}]
            (if (not off?)
              [:a.button.cloud.on
               {:on-click toggle-fn
                :class    (util/classnames [{:syncing syncing?
                                             :is-full full-syncing?
                                             :queuing queuing?
                                             :idle    (and (not queuing?) idle?)}])}
               [:span.flex.items-center
                (ui/icon "cloud" {:size ui/icon-size})]]

              [:a.button.cloud.off
               {:on-click turn-on}
               (ui/icon "cloud-off" {:size ui/icon-size})]))

          ;; links
          (cond-> (vec
                   (when-not (and no-active-files? idle?)
                     (cond
                       need-password?
                       [{:title   [:div.file-item.flex.items-center.leading-none.pt-3
                                   {:style {:margin-left -8}}
                                   (ui/icon "lock" {:size 20}) [:span.pl-1.font-semibold "Password is required"]]
                         :options {:on-click fs-sync/sync-need-password!}}]

                       ;; head of upcoming sync
                       (not no-active-files?)
                       [{:title   [:div.file-item.is-first ""]
                         :options {:class "is-first-placeholder"}}])))
            synced-file-graph?
            (concat
             (map (fn [f] {:title [:div.file-item
                                   {:key (str "downloading-" f)}
                                   f]
                           :key   (str "downloading-" f)
                           :icon  (if enabled-progress-panel?
                                    (let [progress (get sync-progress f)
                                          percent (or (:percent progress) 0)]
                                      (if (and (number? percent)
                                               (< percent 100))
                                        (indicator-progress-pie percent)
                                        (ui/icon "circle-check")))
                                    (ui/icon "arrow-narrow-down"))}) downloading-files)

             (map (fn [e] (let [icon (case (.-type e)
                                       "add" "plus"
                                       "unlink" "minus"
                                       "edit")
                                path (fs-sync/relative-path e)]
                            {:title [:div.file-item
                                     {:key (str "queue-" path)}
                                     path]
                             :key   (str "queue-" path)
                             :icon  (ui/icon icon)})) (take 10 queuing-files))

             (map (fn [f] {:title [:div.file-item
                                   {:key (str "uploading-" f)}
                                   f]
                           :key   (str "uploading-" f)
                           :icon  (if enabled-progress-panel?
                                    (let [progress (get sync-progress f)
                                          percent (or (:percent progress) 0)]
                                      (if (and (number? percent)
                                               (< percent 100))
                                        (indicator-progress-pie percent)
                                        (ui/icon "circle-check")))
                                    (ui/icon "arrow-up"))}) uploading-files)

             (when (seq history-files)
               (map-indexed (fn [i f] (:time f)
                              (when-let [path (:path f)]
                                (let [full-path   (util/node-path.join (config/get-repo-dir current-repo) path)
                                      page-name   (db/get-file-page full-path)]
                                  {:title [:div.files-history.cursor-pointer
                                           {:key      i :class (when (= i 0) "is-first")
                                            :on-click (fn []
                                                        (if page-name
                                                          (rfe/push-state :page {:name page-name})
                                                          (rfe/push-state :file {:path full-path})))}
                                           [:span.file-sync-item (:path f)]
                                           [:div.opacity-50 (ui/humanity-time-ago (:time f) nil)]]})))
                            (take 10 history-files)))))

          ;; options
          {:outer-header
           [:<>
            (indicator-progress-pane
             sync-state sync-progress
             {:idle?            idle?
              :syncing?         syncing?
              :need-password?   need-password?
              :full-sync?       full-syncing?
              :online?          online?
              :queuing?         queuing?
              :no-active-files? no-active-files?
              :history-files?   (seq history-files)})

            (when (and
                   (not enabled-progress-panel?)
                   synced-file-graph? queuing?)
              [:div.head-ctls (sync-now)])]}))])))

(rum/defc pick-local-graph-for-sync [graph]
  [:div.cp__file-sync-related-normal-modal
   [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "cloud-download")]]

   [:h1.mb-5.text-2xl.text-center.font-bold (util/format "Sync graph \"%s\" to local"
                                                         (:GraphName graph))]

   (ui/button
    "Open a local directory"
    :class "block w-full py-4 mt-4"
    :on-click #(do
                 (state/close-modal!)
                 (fs-sync/<sync-stop)
                 (->
                  (page-handler/ls-dir-files!
                   (fn [{:keys [url]}]
                     (file-sync-handler/init-remote-graph url graph)
                     (js/setTimeout (fn [] (repo-handler/refresh-repos!)) 200))

                   {:on-open-dir
                    (fn [result]
                      (prn ::on-open-dir result)
                      (let [empty-dir? (not (seq (:files result)))
                            root (:path result)]
                        (cond
                          (string/blank? root)
                          (p/rejected (js/Error. nil))  ;; cancel pick a directory

                          empty-dir?
                          (p/resolved nil)

                          :else ; dir is not empty
                          (-> (if (util/electron?)
                                (ipc/ipc :readGraphTxIdInfo root)
                                (fs-util/read-graphs-txid-info root))
                              (p/then (fn [^js info]
                                        (when (or (nil? info)
                                                  (nil? (second info))
                                                  (not= (second info) (:GraphUUID graph)))
                                          (if (js/confirm "This directory is not empty, are you sure to sync the remote graph to it? Make sure to back up the directory first.")
                                            (p/resolved nil)
                                            (p/rejected (js/Error. nil))))))))))}) ;; cancel pick a non-empty directory
                  (p/catch (fn [])))))

   [:div.text-xs.opacity-50.px-1.flex-row.flex.items-center.p-2
    (ui/icon "alert-circle")
    [:span.ml-1 " An empty directory or an existing remote graph!"]]])

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
             (let [files (async/<! (file-sync-handler/<fetch-page-file-versions graph-uuid page-entity))]
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
               local?       (some? (:relative-path version))]
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
             [:small.opacity-50.translate-y-1.flex.items-center.space-x-1
              (if local?
                [:<> (ui/icon "git-commit") [:span "local"]]
                [:<> (ui/icon "cloud") [:span "remote"]])]]])))]))

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
                             (let [result  (:user/info @state/state)
                                   ex-time (:ExpireTime result)]
                               (if (and (number? ex-time)
                                        (< (* ex-time 1000) (js/Date.now)))
                                 (do
                                   (vreset! *beta-unavailable? true)
                                   (maybe-onboarding-show :unavailable))

                                 ;; Logseq sync available
                                 (maybe-onboarding-show :sync-initiate))
                               (close-fn)
                               (set-loading? false))))]]))

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
    "charitable OpenCollective sponsors and backers. We can notify you once it becomes available for you."]

   [:div.pt-6.flex.justify-end.space-x-2
    (ui/button "Close" :on-click close-fn :background "gray" :class "opacity-60")]])

(rum/defc onboarding-congrats-successful-sync
  [close-fn]

  [:div.cp__file-sync-related-normal-modal
   [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "checkup-list" {:size 28})]]

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
     [:span.pr-2.flex (ui/icon "bell-ringing" {:class "font-semibold"})]
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
   (when (and repo (mobile-util/in-iCloud-container-path? repo))
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
      (catch :default e
        (js/console.warn "[onboarding SKIP] " (name type) e)))))
