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
            [frontend.config :as config]))

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
       (for [file files]
         (let [file-id (util/url-encode file)]
           [:div {:key file-id}
            [:a {:href (str "/file/" file-id)}
             file]]))))])

(rum/defcs file < rum/reactive
  [state]
  (let [[encoded-path path] (get-path state)
        format (format/get-format path)]
    (cond
      ;; image type
      (and format (contains? (config/img-formats) format))
      [:img {:src path}]

      (and format (contains? config/hiccup-support-formats format))
      (let [headings (db/get-file-by-concat-headings path)
            headings (db/with-dummy-heading headings format)
            hiccup (hiccup/->hiccup headings {:id encoded-path})]
        (content/content encoded-path {:hiccup hiccup}))

      (and format (contains? (config/text-formats) format))
      (let [content (db/sub-file path)]
        (content/content encoded-path
                         {:content content
                          :format format
                          :on-hide (fn []
                                     (when (handler/file-changed? content)
                                       (handler/alter-file (state/get-current-repo) path (state/get-edit-content) nil)))}))

      :else
      [:div "Format ." (name format) " is not supported."])))
