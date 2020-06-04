(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.utf8 :as utf8]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.date :as date]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))
        encoded-path (get-in route-match [:parameters :path :path])
        decoded-path (util/url-decode encoded-path)]
    [encoded-path decoded-path]))

(rum/defc files < rum/reactive
  []
  [:div.flex-1
   [:h1.title
    "All files"]
   (when-let [current-repo (state/sub :git/current-repo)]
     (let [files (db/get-files current-repo)]
       [:table
        [:thead
         [:tr
          [:th "File name"]
          [:th "Last modified at"]]]
        [:tbody
         (for [[file modified-at] files]
           (let [file-id (util/url-encode file)]
             [:tr {:key file-id}
              [:td [:a.text-gray-700 {:href (str "/file/" file-id)}
                    (util/capitalize-all file)]]
              [:td [:span.text-gray-500.text-sm
                    (if (zero? modified-at)
                      "No data"
                      (date/get-date-time-string
                       (t/to-default-time-zone (tc/to-date-time modified-at))))]]]))]]))])

(rum/defcs file < rum/reactive
  [state]
  (let [[encoded-path path] (get-path state)
        format (format/get-format path)
        save-file-handler (fn [content]
                            (fn [_]
                              (when (handler/file-changed? encoded-path content)
                                (let [new-content (-> (gdom/getElement encoded-path)
                                                    (gobj/get "value"))]
                                  (handler/alter-file (state/get-current-repo) path new-content nil)))))
        edit-raw-handler (fn []
                           (let [content (db/get-file path)]
                             (content/content encoded-path {:content content
                                                            :format format
                                                            :on-hide (save-file-handler content)})))]
    [:div.file
     [:h1.title
      path]
     (cond
       ;; image type
       (and format (contains? (config/img-formats) format))
       [:img {:src path}]

       (and format (contains? (config/text-formats) format))
       (edit-raw-handler)

       :else
       [:div "Format ." (name format) " is not supported."])]))
