(ns frontend.components.file
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.export :as export-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :path])))

(rum/defc files < rum/reactive
  []
  [:div.flex-1.overflow-hidden
   [:h1.title
    (t :all-files)]
   (when-let [current-repo (state/sub :git/current-repo)]
     (let [files (db/get-files current-repo)
           mobile? (util/mobile?)]
       [:table.table-auto
        [:thead
         [:tr
          [:th (t :file/name)]
          (when-not mobile?
            [:th (t :file/last-modified-at)])
          (when-not mobile?
            [:th ""])]]
        [:tbody
         (for [[file modified-at] files]
           (let [file-id file]
             [:tr {:key file-id}
              [:td
               (let [href (if (gp-config/draw? file)
                            (rfe/href :draw nil {:file (string/replace file (str gp-config/default-draw-directory "/") "")})
                            (rfe/href :file {:path file-id}))]
                 [:a {:href href}
                  file])]
              (when-not mobile?
                [:td [:span.text-gray-500.text-sm
                      (if (zero? modified-at)
                        (t :file/no-data)
                        (date/get-date-time-string
                         (t/to-default-time-zone (tc/to-date-time modified-at))))]])

              (when-not mobile?
                [:td [:a.text-sm
                      {:on-click (fn [_e]
                                   (export-handler/download-file! file))}
                      [:span (t :download)]]])]))]]))])

(rum/defcs file < rum/reactive
  {:did-mount (fn [state]
                (state/set-file-component! (:rum/react-component state))
                state)
   :will-unmount (fn [state]
                   (state/clear-file-component!)
                   state)}
  [state]
  (let [path (get-path state)
        format (gp-util/get-format path)
        original-name (db/get-file-page path)
        random-id (str (d/squuid))]
    [:div.file {:id (str "file-edit-wrapper-" random-id)
                :key path}
     [:h1.title
      [:bdi (js/decodeURI path)]]
     (when original-name
       [:div.text-sm.mb-4.ml-1 "Page: "
        [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                :href (rfe/href :page {:name original-name})
                                :on-click (fn [e]
                                            (when (gobj/get e "shiftKey")
                                              (when-let [page (db/entity [:block/name (util/page-name-sanity-lc original-name)])]
                                                (state/sidebar-add-block!
                                                 (state/get-current-repo)
                                                 (:db/id page)
                                                 :page))
                                              (util/stop e)))}
         original-name]])

     (when (and original-name (not (string/starts-with? original-name "logseq/")))
       [:p.text-sm.ml-1.mb-4
        (svg/warning {:style {:width "1em"
                              :display "inline-block"}})
        [:span.ml-1 "Please don't remove the page's title property (you can still modify it)."]])

     (cond
       ;; image type
       (and format (contains? (gp-config/img-formats) format))
       [:img {:src (util/node-path.join "file://" path)}]

       (and format (contains? (gp-config/text-formats) format))
       (when-let [file-content (or (db/get-file path) "")]
         (let [content (string/trim file-content)
               mode (util/get-file-ext path)]
            (lazy-editor/editor {:file?     true
                                 :file-path path}
                                (str "file-edit-" random-id)
                                {:data-lang mode}
                                content
                               {})))

       :else
       [:div (t :file/format-not-supported (name format))])]))
