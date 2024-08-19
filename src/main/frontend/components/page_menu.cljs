(ns frontend.components.page-menu
  (:require [frontend.commands :as commands]
            [frontend.components.export :as export]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [frontend.handler.shell :as shell]
            [frontend.mobile.util :as mobile-util]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [logseq.common.path :as path]
            [frontend.handler.property.util :as pu]))

(defn- delete-page!
  [page]
  (page-handler/<delete! (:block/uuid page)
                        (fn []
                          (notification/show! (str "Page " (:block/title page) " was deleted successfully!")
                                              :success))
                        {:error-handler (fn [{:keys [msg]}]
                                          (notification/show! msg :warning))}))

(defn delete-page-confirm!
  [page]
  (when page
    (-> (shui/dialog-confirm!
          {:title [:h3.text-lg.leading-6.font-medium.flex.gap-2.items-center
                   [:span.top-1.relative
                    (shui/tabler-icon "alert-triangle")]
                   (if (config/db-based-graph? (state/get-current-repo))
                     (t :page/db-delete-confirmation)
                     (t :page/delete-confirmation))]
           :content [:p.opacity-60 (str "- " (:block/title page))]
           :outside-cancel? true})
      (p/then #(delete-page! page))
      (p/catch #()))))

(defn ^:large-vars/cleanup-todo page-menu
  [page]
  (when-let [page-name (and page (db/page? page) (:block/name page))]
    (let [repo (state/sub :git/current-repo)
          db-based? (config/db-based-graph? repo)
          page-title (if db-based? (str (:block/uuid page)) (:block/title page))
          whiteboard? (ldb/whiteboard? page)
          block? (and page (util/uuid-string? page-name) (not whiteboard?))
          contents? (= page-name "contents")
          public? (pu/get-block-property-value page :logseq.property/public)
          _favorites-updated? (state/sub :favorites/updated?)
          favorited? (page-handler/favorited? page-title)
          developer-mode? (state/sub [:ui/developer-mode?])
          file-rpath (when (util/electron?) (page-util/get-page-file-rpath page-name))
          _ (state/sub :auth/id-token)
          file-sync-graph-uuid (and (user-handler/logged-in?)
                                    (file-sync-handler/enable-sync?)
                                    ;; FIXME: Sync state is not cleared when switching to a new graph
                                    (file-sync-handler/current-graph-sync-on?)
                                    (file-sync-handler/get-current-graph-uuid))]
      (when (not block?)
        (->>
         [(when-not config/publishing?
            {:title   (if favorited?
                        (t :page/unfavorite)
                        (t :page/add-to-favorites))
             :options {:on-click
                       (fn []
                         (if favorited?
                           (page-handler/<unfavorite-page! page-title)
                           (page-handler/<favorite-page! page-title)))}})

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
             :options {:on-click #(page-handler/copy-page-url (if db-based? (:block/uuid page) page-title))}})

          (when-not (or contents?
                        config/publishing?
                        (and db-based?
                             (:logseq.property/built-in? page)))
            {:title   (t :page/delete)
             :options {:on-click #(delete-page-confirm! page)}})

          (when (and (not (mobile-util/native-platform?))
                     (not whiteboard?)
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
             :options {:on-click #(shui/dialog-open!
                                   (fn []
                                     (export/export-blocks (:block/uuid page) {:whiteboard? whiteboard?}))
                                   {:class "w-auto md:max-w-4xl max-h-[80vh] overflow-y-auto"})}})

          (when (util/electron?)
            {:title   (t (if public? :page/make-private :page/make-public))
             :options {:on-click
                       (fn []
                         (page-handler/update-public-attribute!
                          page
                          (if public? false true)))}})

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

          (when (and db-based? (not whiteboard?))
            {:title (t :page/toggle-properties)
             :options {:on-click (fn []
                                   (page-handler/toggle-properties! page))}})

          (when (and db-based? (= (:block/type page) "page"))
            {:title (t :page/convert-to-tag)
             :options {:on-click (fn []
                                   (page-handler/convert-to-tag! page))}})

          (when developer-mode?
            {:title   (t :dev/show-page-data)
             :options {:on-click (fn []
                                   (dev-common-handler/show-entity-data (:db/id page)))}})

          (when (and developer-mode?
                     ;; Remove when we have an easy way to fetch file content for a DB graph
                     (not db-based?))
            {:title   (t :dev/show-page-ast)
             :options {:on-click (fn []
                                   (let [page (db/pull '[:block/format {:block/file [:file/content]}] (:db/id page))]
                                     (dev-common-handler/show-content-ast
                                      (get-in page [:block/file :file/content])
                                      (:block/format page))))}})]
         (flatten)
         (remove nil?))))))
