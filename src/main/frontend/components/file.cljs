(ns frontend.components.file
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.string :as gstring]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(defn- get-path
  [route-match]
  (get-in route-match [:parameters :path :path]))

(hsx/defc files-all
  []
  (let [[files set-files!] (hooks/use-state nil)
        _ (hooks/use-effect!
           (fn []
             (p/let [result (db-async/<get-files (state/get-current-repo))]
               (set-files! result)))
           [])
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
            (let [href (rfe/href :file {:path file-id})]
              [:a {:href href}
               file])]
           (when-not mobile?
             [:td [:span.text-gray-500.text-sm
                   (if (or (nil? modified-at) (zero? modified-at))
                     (t :file/no-data)
                     (date/get-date-time-string
                      (t/to-default-time-zone (tc/to-date-time modified-at))))]])]))]]))

(hsx/defc files
  []
  [:div.flex-1.overflow-hidden
   [:h1.title
    (t :nav/all-files)]
   (files-all)])

;; FIXME: misuse of rpath and fpath
(hsx/defc file-inner
  [path format]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))
        rel-path (when (string/starts-with? path repo-dir)
                   (path/trim-dir-prefix repo-dir path))
        file-path path
        random-id (hooks/use-memo #(str (common-uuid/gen-uuid)) [path])
        [content set-content!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (let [repo (state/get-current-repo)
             repo-dir (config/get-repo-dir repo)
             [dir path] (cond
                          (path/absolute? path)
                          [nil path]

                          ;; assume local file, relative path
                          :else
                          [repo-dir path])]
         (when (and format (contains? (common-config/text-formats) format))
           (p/let [content (if-not (string/starts-with? path "/")
                             (db/get-file path)
                             (fs/read-file dir path))]
             (set-content! (or content "")))))
       #(state/clear-file-component!))
     [path format])
    [:div.file {:id (str "file-edit-wrapper-" random-id)
                :key path}
     [:h1.title
      [:bdi (or rel-path path)]]

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

(hsx/defc file
  [route-match]
  (let [path (get-path route-match)
        format (common-util/get-format path)]
    ^{:key path}
    [file-inner path format]))
