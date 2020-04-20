(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.ui :as ui]
            [frontend.format.org-mode :as org]
            [frontend.components.content :as content]
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
       (and format (contains? #{:png :jpg :jpeg} format))
       [:img {:src path}]

       (and format (contains? handler/text-formats format))
       (let [content (db/get-file (last (get-path state)))
             html (db/get-cached-html (last (get-path state)))]
         [:div.content
          (content/content encoded-path html format
                           {:content content
                            :on-click (fn []
                                        (handler/edit-file!
                                         {:path encoded-path
                                          :content content}))
                            :on-hide (fn []
                                       (when (handler/file-changed? content)
                                         (handler/alter-file path))
                                       (handler/clear-edit!))})])

       :else
       [:div "Format ." (name format) " is not supported."]))))
