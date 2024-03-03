(ns frontend.components.page-menu
  (:require [frontend.commands :as commands]
            [frontend.components.export :as export]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [frontend.handler.shell :as shell]
            [frontend.mobile.util :as mobile-util]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [logseq.common.path :as path]))

(defn- delete-page!
  [page-name]
  (page-handler/delete! page-name
                        (fn []
                          (notification/show! (str "Page " page-name " was deleted successfully!")
                                              :success)))
  (state/close-modal!)
  (route-handler/redirect-to-home!))

(defn delete-page-dialog
  [page-name]
  (fn [close-fn]
    [:div
     [:div.sm:flex.items-center
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10
       [:span.text-error.text-xl
        (ui/icon "alert-triangle")]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (t :page/delete-confirmation)]]]

     [:div.mt-5.sm:mt-4.flex.gap-4
      (ui/button
       (t :cancel)
       {:theme :gray
        :on-click close-fn})
      (ui/button
       (t :yes)
       {:class "ui__modal-enter"
        :on-click (fn []
                    (delete-page! page-name))
        :button-props {:autoFocus "on"}})]]))

(defn ^:large-vars/cleanup-todo page-menu
  [page-name]
  (when-let [page-name (or
                        page-name
                        (state/get-current-page)
                        (state/get-current-whiteboard))]
    (let [page-name (util/page-name-sanity-lc page-name)
          repo (state/sub :git/current-repo)
          page (db/entity repo [:block/name page-name])
          page-original-name (:block/original-name page)
          whiteboard? (= "whiteboard" (:block/type page))
          block? (and page (util/uuid-string? page-name) (not whiteboard?))
          contents? (= page-name "contents")
          properties (:block/properties page)
          public? (true? (:public properties))
          favorites (:favorites (state/sub-config))
          favorited? (contains? (set (map util/page-name-sanity-lc favorites))
                                page-name)
          developer-mode? (state/sub [:ui/developer-mode?])
          file-rpath (when (util/electron?) (page-util/get-page-file-rpath page-name))
          _ (state/sub :auth/id-token)
          file-sync-graph-uuid (and (user-handler/logged-in?)
                                    (file-sync-handler/enable-sync?)
                                    ;; FIXME: Sync state is not cleared when switching to a new graph
                                    (file-sync-handler/current-graph-sync-on?)
                                    (file-sync-handler/get-current-graph-uuid))]
      (when (and page (not block?))
        (->>
         [(when-not config/publishing?
            {:title   (if favorited?
                        (t :page/unfavorite)
                        (t :page/add-to-favorites))
             :options {:on-click
                       (fn []
                         (if favorited?
                           (page-handler/unfavorite-page! page-original-name)
                           (page-handler/favorite-page! page-original-name)))}})

          (when (or (util/electron?) file-sync-graph-uuid)
            {:title   (t :page/version-history)
             :options {:on-click
                       (fn []
                         (cond
                           file-sync-graph-uuid
                           (state/pub-event! [:graph/pick-page-histories file-sync-graph-uuid page-name])

                           (util/electron?)
                           (shell/get-file-latest-git-log page 100)

                           :else
                           nil))
                       :class "cp__btn_history_version"}})

          (when (or (util/electron?)
                    (mobile-util/native-platform?))
            {:title   (t :page/copy-page-url)
             :options {:on-click #(page-handler/copy-page-url page-original-name)}})

          (when-not (or contents?
                        config/publishing?)
            {:title   (t :page/delete)
             :options {:on-click #(state/set-modal! (delete-page-dialog page-name))}})

          (when (and (not (mobile-util/native-platform?))
                     (state/get-current-page))
            {:title (t :page/slide-view)
             :options {:on-click (fn []
                                   (state/sidebar-add-block!
                                    repo
                                    (:db/id page)
                                    :page-slide-view))}})

          ;; TODO: In the future, we'd like to extract file-related actions
          ;; (such as open-in-finder & open-with-default-app) into a sub-menu of
          ;; this one. However this component doesn't yet exist. PRs are welcome!
          ;; Details: https://github.com/logseq/logseq/pull/3003#issuecomment-952820676
          (when file-rpath
            (let [repo-dir (config/get-repo-dir repo)
                  file-fpath (path/path-join repo-dir file-rpath)]
              [{:title   (t :page/open-in-finder)
                :options {:on-click #(ipc/ipc "openFileInFolder" file-fpath)}}
               {:title   (t :page/open-with-default-app)
                :options {:on-click #(js/window.apis.openPath file-fpath)}}]))

          (when (or (state/get-current-page) whiteboard?)
            {:title   (t :export-page)
             :options {:on-click #(state/set-modal!
                                   (fn []
                                     (export/export-blocks (:block/name page) {:whiteboard? whiteboard?})))}})

          (when (util/electron?)
            {:title   (t (if public? :page/make-private :page/make-public))
             :options {:on-click
                       (fn []
                         (page-handler/update-public-attribute!
                          page-name
                          (if public? false true))
                         (state/close-modal!))}})

          (when (and (util/electron?) file-rpath
                     (not (file-sync-handler/synced-file-graph? repo)))
            {:title   (t :page/open-backup-directory)
             :options {:on-click
                       (fn []
                         (ipc/ipc "openFileBackupDir" (config/get-local-dir repo) file-rpath))}})

          (when config/lsp-enabled?
            (for [[_ {:keys [label] :as cmd} action pid] (state/get-plugins-commands-with-type :page-menu-item)]
              {:title label
               :options {:on-click #(commands/exec-plugin-simple-command!
                                     pid (assoc cmd :page page-name) action)}}))

          (when developer-mode?
            {:title   (t :dev/show-page-data)
             :options {:on-click (fn []
                                   (dev-common-handler/show-entity-data (:db/id page)))}})

          (when developer-mode?
            {:title   (t :dev/show-page-ast)
             :options {:on-click (fn []
                                   (let [page (db/pull '[:block/format {:block/file [:file/content]}] (:db/id page))]
                                     (dev-common-handler/show-content-ast
                                      (get-in page [:block/file :file/content])
                                      (:block/format page))))}})]
         (flatten)
         (remove nil?))))))
