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
            [frontend.handler.page :as page-handler]))


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
           (log/error :publish/delete-page-failed error)
           (reject error)))))))

(rum/defc my-publishing
  < rum/reactive db-mixins/query
  []
  (let [current-repo (state/sub :git/current-repo)
        current-project (state/get-current-project)
        pages (get-published-pages)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex-1
       [:h1.title (t :my-publishing)]
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
                                   (page-handler/page-add-properties! page-name {:published false}))
                                 (p/catch
                                   (fn [error]
                                     (let [status (.-status error)
                                           not-found-on-server 404]
                                       (when (= not-found-on-server status)
                                         (page-handler/page-add-properties! page-name {:published false})))))))}
                       (t :page/cancel-publishing)]]]]))]])])))