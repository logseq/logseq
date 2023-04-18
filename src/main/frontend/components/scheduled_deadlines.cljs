(ns frontend.components.scheduled-deadlines
  (:require [frontend.date :as date]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.components.content :as content]
            [frontend.components.block :as block]
            [clojure.string :as string]
            [frontend.components.editor :as editor]
            [rum.core :as rum]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]))

(defn- scheduled-or-deadlines?
  [page-name]
  (and (date/valid-journal-title? (string/capitalize page-name))
       (not (true? (state/scheduled-deadlines-disabled?)))
       (= (string/lower-case page-name) (string/lower-case (date/journal-name)))))

(rum/defc scheduled-and-deadlines-inner < rum/reactive db-mixins/query
  [page-name]
  (let [scheduled-or-deadlines (when (scheduled-or-deadlines? page-name)
                                 (db/get-date-scheduled-or-deadlines (string/capitalize page-name)))]
    (when (seq scheduled-or-deadlines)
      [:div.scheduled-or-deadlines.mt-8
       (ui/foldable
        [:h2.font-medium "SCHEDULED AND DEADLINE"]
        [:div.scheduled-deadlines.references-blocks.mb-6
         (let [ref-hiccup (block/->hiccup scheduled-or-deadlines
                                          {:id (str page-name "-agenda")
                                           :ref? true
                                           :group-by-page? true
                                           :editor-box editor/box}
                                          {})]
           (content/content page-name {:hiccup ref-hiccup}))]
        {:title-trigger? true})])))

(rum/defc scheduled-and-deadlines
  [page-name]
  (ui/lazy-visible
   (fn [] (scheduled-and-deadlines-inner page-name))
   {:debug-id "scheduled-and-deadlines"}))
