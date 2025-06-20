(ns frontend.components.scheduled-deadlines
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- scheduled-or-deadlines?
  [page-name]
  (and (date/valid-journal-title? (string/capitalize page-name))
       (not (true? (state/scheduled-deadlines-disabled?)))
       (= (string/lower-case page-name) (string/lower-case (date/journal-name)))))

(rum/defcs scheduled-and-deadlines < rum/reactive
  {:init (fn [state]
           (let [*result (atom nil)
                 page-name (first (:rum/args state))]
             (p/let [result (when (scheduled-or-deadlines? page-name)
                              (db-async/<get-date-scheduled-or-deadlines (string/capitalize page-name)))]
               (reset! *result result))
             (assoc state ::result *result)))}
  [state page-name]
  (let [scheduled-or-deadlines (rum/react (::result state))]
    (when (seq scheduled-or-deadlines)
      [:div.scheduled-or-deadlines.mt-8
       (ui/foldable
        [:div "SCHEDULED AND DEADLINE"]
        (fn []
          [:div.scheduled-deadlines.references-blocks.mb-6
           (let [ref-hiccup (block/->hiccup scheduled-or-deadlines
                                            {:id (str page-name "-agenda")
                                             :ref? true
                                             :group-by-page? true
                                             :editor-box editor/box}
                                            {})]
             (content/content page-name {:hiccup ref-hiccup}))])
        {:title-trigger? true
         :default-collapsed? true})])))
