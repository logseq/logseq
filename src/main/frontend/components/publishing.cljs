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
            [clojure.string :as string]
            [frontend.ui :as ui]))


(defn get-published-pages
  []
  (when-let [repo (state/get-current-repo)]
    (when (db/get-conn repo)
      (->> (db/q repo [:page/published] {:use-cache? false}
             '[:find (pull ?page [*])
               :in $
               :where
               [?page :page/properties ?properties]
               [(get ?properties :published) ?publish]
               [(= "true" ?publish)]])
        db/react))))

(defn delete-page-from-logseq
  [project permalink]
  (let [url (util/format "%s%s/%s" config/api project permalink)]
    (js/Promise.
      (fn [resolve reject]
        (util/delete url
          (fn [result]
            (resolve result))
          (fn [error]
            (log/error :page/http-delete-failed error)
            (reject error)))))))

(defn update-state-and-notify
  [page-name]
  (page-handler/page-add-properties! page-name {:published false})
  (notification/show! (util/format "Remove Page \"%s\" from Logseq server success" page-name) :success))

(defn update-project
  [project-name data]
  (let [url (util/format "%sprojects/%s" config/api project-name)]
    (js/Promise.
      (fn [resolve reject]
        (util/post url data
          (fn [result]
            (resolve result))
          (fn [error]
            (log/error :project/http-update-failed error)
            (reject error)))))))

(defn delete-project
  [project-name]
  (let [url (util/format "%sprojects/%s" config/api project-name)]
    (js/Promise.
      (fn [resolve reject]
        (util/delete url
          (fn [result]
            (resolve result))
          (fn [error]
            (log/error :project/http-delete-failed error)
            (reject error)))))))

(defn get-current-project
  [current-repo projects]
  (let [project (some (fn [p]
                        (when (= (:repo p) current-repo)
                          p))
                  projects)
        project-name (:name project)]
    (when-not (string/blank? project-name) project-name)))

(defn project
  [editor-state current-project]
  (if (= :display @editor-state)
    [:h2
     {:on-click
      (fn [_]
        (reset! editor-state :editor))}
     current-project]
    [:div.block-body
     [:input#project-editor
      {:placeholder current-project
       :default-value current-project}]
     (ui/button
       "Save"
       :on-click (fn [e]
                   (util/stop e)
                   (let [editor (.getElementById js/document "project-editor")
                         v (.-value editor)
                         data {:name v}]
                     (-> (p/let [result (update-project current-project data)]
                           (when (:result result)
                             (state/update-current-project :name v)
                             (notification/show! "Updated project name successfully." :success)
                             (reset! editor-state :display)))
                         (p/catch
                           (fn [error]
                             (notification/show! "Failed to updated project name." :failed))))))
       :background "green")

     (ui/button
       "Cancel"
       :on-click (fn [e]
                   (util/stop e)
                   (reset! editor-state :display))
       :background "pink")
     (ui/button
       "Delete"
       :on-click (fn [e]
                   (util/stop e)
                   (let [confirm-message
                         (util/format
                           "This operation will also delete all publishing under project \"%s\", continue?"
                           current-project)]
                    (when (.confirm js/window confirm-message)
                      (p/let [result (delete-project current-project)]
                        (when (:result result)
                          (reset! editor-state :display))))))
       :background "red")]))

(rum/defcs my-publishing
  < rum/reactive db-mixins/query
    (rum/local :display ::project-state)
  [state]
  (let [current-repo (state/sub :git/current-repo)
        projects (state/sub [:me :projects])
        pages (get-published-pages)
        editor-state (get state ::project-state)
        current-project (get-current-project current-repo projects)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex-1
       [:h1.title (t :my-publishing)]
       [:div#project-name
        [:span "Current Project:"
         (project editor-state current-project)]]
       (when current-repo
         [:table.table-auto
          [:thead
           [:tr
            [:th (t :page/name)]
            [:th (t :page/cancel-publishing)]]]
          [:tbody
           (for [page pages]
             (let [page (first page)
                   {:keys [title permalink]} (:page/properties page)
                   page-name (:page/name page)]
               [:tr {:key permalink}
                [:td [:a {:on-click (fn [e]
                                      (util/stop e))
                          :href (rfe/href :page {:name title})}
                      page-name]]
                [:td [:span.text-gray-500.text-sm
                      [:a {:on-click
                           (fn [e]
                             (util/stop e)
                             (-> (p/let [_ (delete-page-from-logseq current-project permalink)]
                                   (update-state-and-notify page-name))
                                 (p/catch
                                   (fn [error]
                                     (let [status (.-status error)
                                           not-found-on-server 404]
                                       (if (= not-found-on-server status)
                                         (update-state-and-notify page-name)
                                         (let [message (util/format "Remove Page \"%s\" from Logseq server failed."
                                                         page-name)]
                                           (notification/show! message :failed))))))))}
                       (t :page/cancel-publishing)]]]]))]])])))