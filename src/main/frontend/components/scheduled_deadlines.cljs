(ns frontend.components.scheduled-deadlines
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.context.i18n :refer [t]]
            [frontend.components.editor :as editor]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- scheduled-or-deadlines?
  [page-name]
  (and (date/valid-journal-title? (string/capitalize page-name))
       (not (true? (state/scheduled-deadlines-disabled?)))
       (= (date/journal-title->int (string/capitalize page-name))
          (date/today-journal-day))))

(hsx/defc scheduled-and-deadlines
  [page-name]
  (let [[scheduled-or-deadlines set-scheduled-or-deadlines!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [result (when (scheduled-or-deadlines? page-name)
                        (db-async/<get-date-scheduled-or-deadlines (string/capitalize page-name)))]
         (set-scheduled-or-deadlines! result)))
     [page-name])
    (when (seq scheduled-or-deadlines)
      [:div.scheduled-or-deadlines
       (ui/foldable
        [:div.text-sm.font-medium (t :page/scheduled-and-deadline)]
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
