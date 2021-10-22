(ns frontend.components.page-menu
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor]
            [frontend.components.export :as export]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.handler.shell :as shell]
            [frontend.handler.plugin :as plugin-handler]))

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
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       [:div.sm:flex.items-center
        [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
         [:span.text-red-600.text-xl
          (ui/icon "alert-triangle")]]
        [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium
          (t :page/delete-confirmation)]]]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :class "ui__modal-enter"
           :on-click (fn []
                       (delete-page! page-name))}
          (t :yes)]]
        [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click close-fn}
          (t :cancel)]]]])))

(defn page-menu
  [page-name]
  (when-let [page-name (or
                        page-name
                        (and (state/get-current-page)
                             (string/lower-case (state/get-current-page))))]
    (let [t i18n/t
          repo (state/sub :git/current-repo)
          page (and page-name (db/entity repo [:block/name page-name]))
          page-original-name (:block/original-name page)
          journal? (db/journal-page? page-name)
          block? (and page (util/uuid-string? page-name))
          contents? (= (string/lower-case (str page-name)) "contents")
          {:keys [title] :as properties} (:block/properties page)
          title (or title page-original-name page-name)
          public? (true? (:public properties))
          favorites (:favorites (state/sub-graph-config))
          favorited? (contains? (set (map string/lower-case favorites))
                                (string/lower-case page-name))
          developer-mode? (state/sub [:ui/developer-mode?])]
      (when (and page (not block?))
        (->>
         [{:title   (if favorited?
                      (t :page/unfavorite)
                      (t :page/add-to-favorites))
           :options {:on-click
                     (fn []
                       (if favorited?
                         (page-handler/unfavorite-page! page-original-name)
                         (page-handler/favorite-page! page-original-name)))}}

          {:title (t :page/presentation-mode)
           :options {:on-click (fn []
                                 (state/sidebar-add-block!
                                  repo
                                  (:db/id page)
                                  :page-presentation
                                  {:page page}))}}

          (when-let [file-path (and (util/electron?) (page-handler/get-page-file-path))]
            [{:title   (t :page/open-in-finder)
              :options {:on-click #(js/window.apis.showItemInFolder file-path)}}
             {:title   (t :page/open-with-default-app)
              :options {:on-click #(js/window.apis.openPath file-path)}}])

          (when-not contents?
            {:title   (t :page/delete)
             :options {:on-click #(state/set-modal! (delete-page-dialog page-name))}})

          (when (state/get-current-page)
            {:title   (t :export-page)
             :options {:on-click #(state/set-modal!
                                   (fn []
                                     (export/export-blocks [(:block/uuid page)])))}})

          (when (util/electron?)
            {:title   (t (if public? :page/make-private :page/make-public))
             :options {:on-click
                       (fn []
                         (page-handler/update-public-attribute!
                          page-name
                          (if public? false true))
                         (state/close-modal!))}})

          (when (util/electron?)
            {:title   (t :page/version-history)
             :options {:on-click
                       (fn []
                         (shell/get-file-latest-git-log page 100))}})

          (when plugin-handler/lsp-enabled?
            (for [[_ {:keys [key label] :as cmd} action pid] (state/get-plugins-commands-with-type :page-menu-item)]
              {:title label
               :options {:on-click #(commands/exec-plugin-simple-command!
                                     pid (assoc cmd :page (state/get-current-page)) action)}}))

          (when developer-mode?
            {:title   "(Dev) Show page data"
             :options {:on-click (fn []
                                   (let [page-data (with-out-str (pprint/pprint (db/pull (:db/id page))))]
                                     (println page-data)
                                     (notification/show!
                                      [:div
                                       [:pre.code page-data]
                                       [:br]
                                       (ui/button "Copy to clipboard"
                                         :on-click #(.writeText js/navigator.clipboard page-data))]
                                      :success
                                      false)))}})]
         (flatten)
         (remove nil?))))))
