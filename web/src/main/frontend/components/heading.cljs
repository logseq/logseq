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
     [:div.heading-parents.flex-row.flex
      (when show-page?
        [:a {:href (str "/page/" (util/encode-str page-name))}
         (or (:page/original-name page)
             (:page/name page))])

      (when (and show-page? (seq parents))
        [:span.mx-2.opacity-50 "⮞"])

      (when (seq parents)
        (let [parents (for [{:heading/keys [uuid content]} parents]
                        (let [title (->> (take 24
                                               (-> (string/split content #"\n")
                                                   first
                                                   (editor/remove-level-spaces format)))
                                         (apply str))]
                          (when (and (not (string/blank? title))
                                     (not= (string/lower-case page-name) (string/lower-case title)))
                            [:a {:href (str "/page/" uuid)}
                             title])))
              parents (remove nil? parents)]
          (interpose [:span.mx-2.opacity-50 "⮞"]
                     parents)))])))
