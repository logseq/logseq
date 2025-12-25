(ns frontend.components.page-menu
  (:require [electron.ipc :as ipc]
            [frontend.commands :as commands]
            [frontend.components.export :as export]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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
                  (t :page/db-delete-confirmation)]
          :content [:p.opacity-60 (str "- " (:block/title page))]
          :outside-cancel? true})
        (p/then #(delete-page! page))
        (p/catch #()))))

(defn ^:large-vars/cleanup-todo page-menu
  [page]
  (when-let [page-name (and page (db/page? page) (:block/name page))]
    (let [repo (state/sub :git/current-repo)
          page-title (str (:block/uuid page))
          whiteboard? (ldb/whiteboard? page)
          block? (and page (util/uuid-string? page-name) (not whiteboard?))
          contents? (= page-name "contents")
          public? (:logseq.property/publishing-public? page)
          _favorites-updated? (state/sub :favorites/updated?)
          favorited? (page-handler/favorited? page-title)
          developer-mode? (state/sub [:ui/developer-mode?])
          file-rpath (when (util/electron?) (page-util/get-page-file-rpath page-name))
          _ (state/sub :auth/id-token)]
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

          (when (or (util/electron?)
                    (mobile-util/native-platform?))
            {:title   (t :page/copy-page-url)
             :options {:on-click #(page-handler/copy-page-url (:block/uuid page))}})

          (when-not (or contents?
                        config/publishing?
                        (:logseq.property/built-in? page))
            {:title   (t :page/delete)
             :options {:on-click #(delete-page-confirm! page)}})

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

          (when page
            {:title   (t :export-page)
             :options {:on-click #(shui/dialog-open!
                                   (fn []
                                     (export/export-blocks [(:block/uuid page)] {:whiteboard? whiteboard?
                                                                                 :export-type :page}))
                                   {:class "w-auto md:max-w-4xl max-h-[80vh] overflow-y-auto"})}})

          (when (util/electron?)
            {:title   (t (if public? :page/make-private :page/make-public))
             :options {:on-click
                       (fn []
                         (page-handler/update-public-attribute!
                          repo
                          page
                          (if public? false true)))}})

          (when config/lsp-enabled?
            (for [[_ {:keys [label] :as cmd} action pid] (state/get-plugins-commands-with-type :page-menu-item)]
              {:title label
               :options {:on-click #(commands/exec-plugin-simple-command!
                                     pid (assoc cmd :page page-name) action)}}))

          (when (and (ldb/internal-page? page) (not (:logseq.property/built-in? page)))
            {:title (t :page/convert-to-tag)
             :options {:on-click (fn []
                                   (db-page-handler/convert-page-to-tag! page))}})

          (when (and (ldb/class? page) (not (:logseq.property/built-in? page)))
            {:title (t :page/convert-tag-to-page)
             :options {:on-click (fn []
                                   (db-page-handler/convert-tag-to-page! page))}})

          (when developer-mode?
            {:title   (t :dev/show-page-data)
             :options {:on-click (fn []
                                   (dev-common-handler/show-entity-data (:db/id page)))}})]
         (flatten)
         (remove nil?))))))
