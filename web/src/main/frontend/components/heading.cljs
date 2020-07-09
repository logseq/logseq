(ns frontend.components.heading
  (:require [frontend.db :as db]
            [frontend.handler :as handler]
            [clojure.string :as string]))

(defn heading-parents
  [repo heading-id format]
  (let [parents (db/get-heading-parents repo heading-id 3)]
    (when (seq parents)
      [:div.heading-parents.mt-4.mb-2.flex-row.flex
       (for [[id content] parents]
         (let [title (->> (take 24
                                (-> (string/split content #"\n")
                                    first
                                    (handler/remove-level-spaces format)))
                          (apply str))]
           (when-not (string/blank? title)
             [:div
              [:span.mx-1 ">"]
              [:a {:href (str "/page/" id)}
               title]])))])))
