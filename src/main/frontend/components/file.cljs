(ns frontend.components.file
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.string :as gstring]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :path])))

(rum/defcs files-all < rum/reactive
  {:init (fn [state]
           (let [*files (atom nil)]
             (p/let [result (db-async/<get-files (state/get-current-repo))]
               (reset! *files result))
             (assoc state ::files *files)))}
  [state]
  (let [files (rum/react (::files state))
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
            (let [href (if (common-config/draw? file)
                         (rfe/href :draw nil {:file (string/replace file (str common-config/default-draw-directory "/") "")})
                         (rfe/href :file {:path file-id}))]
              [:a {:href href}
               file])]
           (when-not mobile?
             [:td [:span.text-gray-500.text-sm
                   (if (or (nil? modified-at) (zero? modified-at))
                     (t :file/no-data)
                     (date/get-date-time-string
                      (t/to-default-time-zone (tc/to-date-time modified-at))))]])]))]]))

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
                       repo (state/get-current-repo)
                       repo-dir (config/get-repo-dir repo)
                       [dir path] (cond
                                    (path/absolute? path)
                                    [nil path]

                                    ;; assume local file, relative path
                                    :else
                                    [repo-dir path])]
                   (when (and format (contains? (common-config/text-formats) format))
                     (p/let [content (if (and (config/db-based-graph? repo)
                                              ;; not global
                                              (not (string/starts-with? path "/")))
                                       (db/get-file path)
                                       (fs/read-file dir path))]
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
        title (db/get-file-page (or path rel-path))
        in-db? (when-not (path/absolute? path)
                 (boolean (db/get-file (or path rel-path))))
        file-path (cond
                    (config/db-based-graph? (state/get-current-repo))
                    path

                    in-db?
                    (path/path-join repo-dir path)

                    :else
                    path)
        random-id (str (common-uuid/gen-uuid))
        content (rum/react (::file-content state))]
    [:div.file {:id (str "file-edit-wrapper-" random-id)
                :key path}
     [:h1.title
      [:bdi (or title rel-path path)]]
     (when title
       [:div.text-sm.mb-4.ml-1 "Page: "
        [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                :href (rfe/href :page {:name title})
                                :on-click (fn [e]
                                            (when (gobj/get e "shiftKey")
                                              (when-let [page (db/get-page title)]
                                                (state/sidebar-add-block!
                                                 (state/get-current-repo)
                                                 (:db/id page)
                                                 :page))
                                              (util/stop e)))}
         title]])

     (when (and title (not (string/starts-with? title "logseq/")))
       [:p.text-sm.ml-1.mb-4
        (svg/warning {:style {:width "1em"
                              :display "inline-block"}})
        [:span.ml-1 "Please don't remove the page's title property (you can still modify it)."]])

     (cond
       ;; image type
       (and format (contains? (common-config/img-formats) format))
       [:img {:src (path/path-join "file://" path)}]

       (and format
            (contains? (common-config/text-formats) format)
            content)
       (let [content' (string/trim content)
             mode (util/get-file-ext path)]
         (lazy-editor/editor {:file?     true
                              :file-path file-path}
                             (str "file-edit-" random-id)
                             {:data-lang mode}
                             content'
                             {}))

       ;; wait for content load
       (and format
            (contains? (common-config/text-formats) format))
       (ui/loading)

       :else
       [:div (t :file/format-not-supported (name format))])]))

(rum/defcs file
  [state]
  (let [path (get-path state)
        format (common-util/get-format path)]
    (rum/with-key (file-inner path format) path)))
