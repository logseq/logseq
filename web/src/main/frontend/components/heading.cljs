(ns frontend.components.heading
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.util :as util]
            [clojure.string :as string]))

(defn heading-parents
  ([repo heading-id format]
   (heading-parents repo heading-id format true))
  ([repo heading-id format show-page?]
   (let [parents (db/get-heading-parents repo heading-id 3)
         page (db/get-heading-page repo heading-id)
         page-name (:page/name page)]
     (when (seq parents)
       [:div.heading-parents.flex-row.flex
       (when show-page?
         [:a {:href (str "/page/" (util/encode-str page-name))}
          (:page/original-name page)])

       (when show-page?
         [:span.mx-2.opacity-50 "⮞"])

       (let [parents (for [{:heading/keys [uuid content]} parents]
                       (let [title (->> (take 24
                                              (-> (string/split content #"\n")
                                                  first
                                                  (editor/remove-level-spaces format)))
                                        (apply str))]
                         (when (and (not (string/blank? title))
                                    (not= (string/lower-case page-name) (string/lower-case title)))
                           [:a {:href (str "/page/" uuid)}
                            title])))]
         (interpose [:span.mx-2.opacity-50 "⮞"]
                    parents))]))))
