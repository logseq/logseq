(ns frontend.components.publishing
  (:require [rum.core :as rum]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [frontend.db-mixins :as db-mixins]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.handler.page :as page-handler]
            [frontend.handler.notification :as notification]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.handler.project :as project-handler]))


(defn project
  [editor-state current-project pages]
  (rum/with-context [[t] i18n/*tongue-context*]
    (if (= :display @editor-state)
      (when current-project
        [:div.cp__publishing-pj
         [:span.cp__publishing-pj-name current-project]
         [:span.cp__publishing-edit
          {:on-click
           (fn [_]
             (reset! editor-state :editor))}
          (t :publishing/edit)]])
      [:div.flex.cp__publishing_pj_edit
       [:input#cp__publishing-project-input
        {:placeholder current-project
         :default-value current-project}]
       [:div.cp__publishing-pj-bt
        (ui/button
          (t :publishing/save)
          :on-click (fn [e]
                      (util/stop e)
                      (let [editor (.getElementById js/document "cp__publishing-project-input")
                            v (.-value editor)
                            data {:name v}]
                        (-> (p/let [result (project-handler/update-project current-project data)]
                              (when (:result result)
                                (state/update-current-project :name v)
                                (notification/show! "Updated project name successfully." :success)
                                (reset! editor-state :display)))
                            (p/catch
                              (fn [error]
                                (notification/show! "Failed to update project name." :failed))))))
          :background "green")]

       [:div.cp__publishing-pj-bt
        (ui/button
          (t :publishing/delete)
          :on-click (fn [e]
                      (util/stop e)
                      (let [confirm-message
                            (util/format
                              "This operation will delete all the published pages under the project \"%s\", are you sure?"
                              current-project)]
                        (when (.confirm js/window confirm-message)
                          (p/let [result (project-handler/delete-project current-project)]
                            (when (:result result)
                              (reset! editor-state :display)
                              (doseq [page pages]
                                (let [page (first page)
                                      page-name (:page/name page)]
                                  (page-handler/page-add-properties! page-name {:published false})))
                              (state/remove-current-project)
                              (notification/show! "The project was deleted successfully." :success))))))
          :background "pink")]

       [:div.cp__publishing-pj-bt
        (ui/button
          (t :publishing/cancel)
          :on-click (fn [e]
                      (util/stop e)
                      (reset! editor-state :display)))]])))

(rum/defcs my-publishing
  < rum/reactive db-mixins/query
    (rum/local :display ::project-state)
  [state]
  (let [current-repo (state/sub :git/current-repo)
        projects (state/sub [:me :projects])
        pages (db/get-published-pages)
        editor-state (get state ::project-state)
        current-project (project-handler/get-current-project current-repo projects)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex-1
       [:h1.title (t :my-publishing)]
       [:div#cp__publishing-pj-ct
        [:span (t :publishing/current-project)]
        (project editor-state current-project pages)]
       (when current-repo
         [:div#cp__publishing-pg-ct
          [:div (t :publishing/pages)]
          [:table.table-auto
                [:thead
                 [:tr
                  [:th (t :publishing/page-name)]
                  [:th (t :publishing/delete-from-logseq)]]]
                [:tbody
                 (for [page pages]
                   (let [page (first page)
                         {:keys [title permalink]} (:page/properties page)
                         page-name (:page/name page)]
                     [:tr {:key permalink}
                      [:td [:div.flex {}
                            [:span [:a {:on-click (fn [e] (util/stop e))
                                        :href (rfe/href :page {:name title})}
                                    page-name]]
                            [:span [:a {:href (util/format "%s/%s/%s" config/website current-project page-name)
                                        :target "_blank"}
                                    svg/external-link]]]
                       ]
                      [:td [:span.text-gray-500.text-sm
                            [:a {:on-click
                                 (fn [e]
                                   (util/stop e)
                                   (-> (p/let [_ (page-handler/delete-page-from-logseq current-project permalink)]
                                         (page-handler/update-state-and-notify page-name))
                                       (p/catch
                                         (fn [error]
                                           (let [status (.-status error)
                                                 not-found-on-server 404]
                                             (if (= not-found-on-server status)
                                               (page-handler/update-state-and-notify page-name)
                                               (let [message (util/format "Failed to remove the page \"%s\" from Logseq"
                                                               page-name)]
                                                 (notification/show! message :failed))))))))}
                             (t :publishing/delete)]]]]))]]])])))


