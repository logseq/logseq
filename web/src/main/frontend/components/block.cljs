(ns frontend.components.block
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.text :as text]))

(defn block-parents
  ([repo block-id format]
   (block-parents repo block-id format true))
  ([repo block-id format show-page?]
   (let [parents (db/get-block-parents repo block-id 3)
         page (db/get-block-page repo block-id)
         page-name (:page/name page)]
     (when (or (seq parents)
               show-page?
               page-name)
       (let [parents-atom (atom parents)
             component [:div.block-parents.flex-row.flex
                        (when show-page?
                          [:a {:href (str "/page/" (util/encode-str page-name))}
                           (or (:page/original-name page)
                               (:page/name page))])

                        (when (and show-page? (seq parents))
                          [:span.mx-2.opacity-50 "⮞"])

                        (when (seq parents)
                          (let [parents (for [{:block/keys [uuid content]} parents]
                                          (let [title (->> (take 24
                                                                 (-> (string/split content #"\n")
                                                                     first
                                                                     (text/remove-level-spaces format)))
                                                           (apply str))]
                                            (when (and (not (string/blank? title))
                                                       (not= (string/lower-case page-name) (string/lower-case title)))
                                              [:a {:href (str "/page/" uuid)}
                                               title])))
                                parents (remove nil? parents)]
                            (reset! parents-atom parents)
                            (when (seq parents)
                              (interpose [:span.mx-2.opacity-50 "⮞"]
                                         parents))))]]
         (when (or (seq @parents-atom) show-page?)
           component))))))
