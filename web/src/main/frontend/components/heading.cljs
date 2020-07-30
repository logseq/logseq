(ns frontend.components.heading
  (:require [frontend.db :as db]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [clojure.string :as string]))

(defn heading-parents
  [repo heading-id format]
  (let [parents (db/get-heading-parents repo heading-id 3)
        page (db/get-heading-page repo heading-id)
        page-name (:page/name page)]
    [:div.heading-parents.flex-row.flex
     [:a {:href (str "/page/" (util/encode-str page-name))}
      (:page/original-name page)]
     (for [[id content] parents]
       (let [title (->> (take 24
                              (-> (string/split content #"\n")
                                  first
                                  (handler/remove-level-spaces format)))
                        (apply str))]
         (when (and (not (string/blank? title))
                    (not= (util/capitalize-all page-name) title))
           [:div
            [:span.mx-2.opacity-50 "⮞"]
            [:a {:href (str "/page/" id)}
             title]])))]))
