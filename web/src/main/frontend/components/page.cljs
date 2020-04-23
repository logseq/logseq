(ns frontend.components.page
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

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

;; A page is just a logical heading

(rum/defcs page
  [state]
  (let [page-name (get-page-name state)
        id (uuid page-name)]
    (prn id)
    (sidebar/sidebar
     [:div "page"]
     ;; (let [headings (db/get-file-by-concat-headings path)
     ;;       headings (db/with-dummy-heading headings)
     ;;       hiccup (hiccup/->hiccup headings {:id encoded-path})]
     ;;   (content/content encoded-path format {:hiccup hiccup}))
     )))
