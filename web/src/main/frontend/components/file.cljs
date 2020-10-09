(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler.project :as project]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.image :as image-handler]
            [frontend.handler.file :as file]
            [frontend.handler.export :as export-handler]
            [frontend.config :as config]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.config :as config]
            [frontend.utf8 :as utf8]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.date :as date]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :path])))

(rum/defc files < rum/reactive
  []
  (rum/with-context [[tongue] i18n/*tongue-context*]
    [:div.flex-1.overflow-hidden
     [:h1.title
      (tongue :all-files)]
     (when-let [current-repo (state/sub :git/current-repo)]
       (let [files (db/get-files current-repo)]
         [:table.table-auto
          [:thead
           [:tr
            [:th (tongue :file/name)]
            [:th (tongue :file/last-modified-at)]
            [:th ""]]]
          [:tbody
           (for [[file modified-at] files]
             (let [file-id (util/url-encode file)]
               [:tr {:key file-id}
                [:td
                 (let [href (if (config/draw? file)
                              (rfe/href :draw nil {:file (string/replace file (str config/default-draw-directory "/") "")})
                              (rfe/href :file {:path file-id}))]
                   [:a.text-gray-700 {:href href}
                    file])]
                [:td [:span.text-gray-500.text-sm
                      (if (zero? modified-at)
                        (tongue :file/no-data)
                        (date/get-date-time-string
                         (t/to-default-time-zone (tc/to-date-time modified-at))))]]

                [:td [:a.text-sm
                      {:on-click (fn [e]
                                   (export-handler/download-file! file))}
                      [:span (tongue :download)]]]]))]]))]))

(defn- save-file!
  [path content]
  (fn [value]
    (when (not= (string/trim value) (string/trim content))
      (file/alter-file (state/get-current-repo) path (string/trim value)
                       {:re-render-root? true}))))

(rum/defcs file < rum/reactive
  {:did-mount (fn [state]
                (state/set-file-component! (:rum/react-component state))
                state)
   :will-unmount (fn [state]
                   (state/clear-file-component!)
                   state)}
  [state]
  (let [path (get-path state)
        format (format/get-format path)
        page (db/get-file-page path)
        config? (= path (str config/app-name "/" config/config-file))]
    (rum/with-context [[tongue] i18n/*tongue-context*]
      [:div.file {:id (str "file-" path)}
       [:h1.title
        path]
       (when page
         [:div.text-sm.mb-4.ml-1 "Page: "
          [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                  :href (rfe/href :page {:name (util/url-encode page)})
                                  :on-click (fn [e]
                                              (util/stop e)
                                              (when (gobj/get e "shiftKey")
                                                (when-let [page (db/entity [:page/name (string/lower-case page)])]
                                                  (state/sidebar-add-block!
                                                   (state/get-current-repo)
                                                   (:db/id page)
                                                   :page
                                                   {:page page}))))}
           page]])

       (when (and config? (state/logged?))
         [:a.mb-8.block {:on-click (fn [_e] (project/sync-project-settings!))}
          (tongue :project/sync-settings)])
       (cond
         ;; image type
         (and format (contains? (config/img-formats) format))
         [:img {:src path}]

         (and format (contains? config/markup-formats format))
         (when-let [file-content (db/get-file path)]
           (let [content (string/trim file-content)]
             (content/content path {:config {:file? true
                                             :file-path path}
                                    :content content
                                    :format format})))

         (and format (contains? (config/text-formats) format))
         (when-let [file-content (db/get-file path)]
           (let [content (string/trim file-content)
                 mode (util/get-file-ext path)
                 mode (if (= mode "edn") "clojure" mode)]
             (lazy-editor/editor {:file? true
                                  :file-path path} path {:data-lang mode} content nil)))

         :else
         [:div (tongue :file/format-not-supported (name format))])])))
