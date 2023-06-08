(ns frontend.components.file
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.export :as export-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [logseq.common.path :as path]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :path])))

(rum/defc files-all < rum/reactive
  []
  (when-let [current-repo (state/sub :git/current-repo)]
    (let [files (db/get-files current-repo) ; [[string]]
          files (sort-by first gstring/intAwareCompare files)
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
                     [:span (t :download)]]])]))]])))

(rum/defc files
  []
  [:div.flex-1.overflow-hidden
   [:h1.title
    (t :all-files)]
   (files-all)
   ])

;; FIXME: misuse of rpath and fpath
(rum/defcs file-inner < rum/reactive
  {:will-mount (fn [state]
                 (let [*content (atom nil)
                       [path format] (:rum/args state)
                       repo-dir (config/get-repo-dir (state/get-current-repo))
                       [dir path] (cond
                                    ;; assume local file, relative path
                                    (not (string/starts-with? path "/"))
                                    [repo-dir path]

                                    :else ;; global file on native platform
                                    [nil path])]
                   (when (and format (contains? (gp-config/text-formats) format))
                     (p/let [content (fs/read-file dir path)]
                       (reset! *content (or content ""))))
                   (assoc state ::file-content *content)))
   :did-mount (fn [state]
                (state/set-file-component! (:rum/react-component state))
                state)
   :will-unmount (fn [state]
                   (state/clear-file-component!)
                   state)}
  [state path format]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))
        rel-path (when (string/starts-with? path repo-dir)
                   (path/trim-dir-prefix repo-dir path))
        original-name (db/get-file-page (or path rel-path))
        in-db? (when-not (path/absolute? path)
                 (boolean (db/get-file (or path rel-path))))
        file-fpath (if in-db?
                     (path/path-join repo-dir path)
                     path)
        random-id (str (d/squuid))
        content (rum/react (::file-content state))]
    [:div.file {:id (str "file-edit-wrapper-" random-id)
                :key path}
     [:h1.title
      [:bdi (or original-name rel-path path)]]
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
       [:img {:src (path/path-join "file://" path)}]

       (and format
            (contains? (gp-config/text-formats) format)
            content)
       (let [content' (string/trim content)
             mode (util/get-file-ext path)]
         (lazy-editor/editor {:file?     true
                              :file-path file-fpath}
                             (str "file-edit-" random-id)
                             {:data-lang mode}
                             content'
                             {}))

       ;; wait for content load
       (and format
            (contains? (gp-config/text-formats) format))
       (ui/loading)

       :else
       [:div (t :file/format-not-supported (name format))])]))

(rum/defcs file
  [state]
  (let [path (get-path state)
        format (gp-util/get-format path)]
    (rum/with-key (file-inner path format) path)))
