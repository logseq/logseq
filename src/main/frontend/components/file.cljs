(ns frontend.components.file
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.components.content :as content]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.handler.export :as export-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

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
             (let [file-id file]
               [:tr {:key file-id}
                [:td
                 (let [href (if (config/draw? file)
                              (rfe/href :draw nil {:file (string/replace file (str config/default-draw-directory "/") "")})
                              (rfe/href :file {:path file-id}))]
                   [:a {:href href}
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
        config? (= path (config/get-config-path))]
    (rum/with-context [[tongue] i18n/*tongue-context*]
      [:div.file {:id (str "file-" path)}
       [:h1.title
        path]
       (when page
         [:div.text-sm.mb-4.ml-1 "Page: "
          [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                  :href (rfe/href :page {:name page})
                                  :on-click (fn [e]
                                              (when (gobj/get e "shiftKey")
                                                (when-let [page (db/entity [:block/name (string/lower-case page)])]
                                                  (state/sidebar-add-block!
                                                   (state/get-current-repo)
                                                   (:db/id page)
                                                   :page
                                                   {:page page}))
                                                (util/stop e)))}
           page]])

       (when (and page (not (string/starts-with? page "logseq/")))
         [:p.text-sm.ml-1.mb-4
          (svg/warning {:style {:width "1em"
                                :display "inline-block"}})
          [:span.ml-1 "Please don't remove the page's title property (you can still modify it)."]])

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
                 mode (if (contains? #{"edn" "clj" "cljc" "cljs" "clojure"} mode) "text/x-clojure" mode)]
             (lazy-editor/editor {:file? true
                                  :file-path path} path {:data-lang mode} content {})))

         :else
         [:div (tongue :file/format-not-supported (name format))])])))
