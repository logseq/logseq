(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.hiccup :as hiccup]
            [frontend.ui :as ui]
            [frontend.format.org-mode :as org]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [goog.crypt.base64 :as b64]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))
        encoded-path (get-in route-match [:parameters :path :path])
        decoded-path (b64/decodeString encoded-path)]
    [encoded-path decoded-path]))

(rum/defcs file
  [state]
  (let [[encoded-path path] (get-path state)
        format (keyword (string/lower-case (last (string/split path #"\."))))]
    (sidebar/sidebar
     (cond
       ;; image type
       (and format (contains? config/img-formats format))
       [:img {:src path}]

       (and format (contains? config/hiccup-support-formats format))
       (let [headings (db/get-file-by-concat-headings path)
             headings (db/with-dummy-heading headings)
             hiccup (hiccup/->hiccup headings {:id encoded-path})]
         (content/content encoded-path format {:hiccup hiccup}))

       (and format (contains? config/text-formats format))
       (let [content (db/get-file path)]
         (content/content encoded-path format
                          {:content content
                           :on-click (fn []
                                       (handler/edit-file!
                                        {:path encoded-path
                                         :content content}))
                           :on-hide (fn []
                                      (when (handler/file-changed? content)
                                        (handler/alter-file path (state/get-edit-content)))
                                      (handler/clear-edit!))}))

       :else
       [:div "Format ." (name format) " is not supported."]))))
