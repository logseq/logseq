(ns frontend.components.datepicker
  "Datepicker component"
  (:require [cljs-time.core :as t]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.common.util.page-ref :as page-ref]
            [rum.core :as rum]))

(rum/defc date-picker < rum/reactive
  {:init (fn [state]
           (when-not (:date-picker/date @state/state)
             (state/set-state! :date-picker/date (t/today)))
           state)}
  [dom-id format]
  (let [date (state/sub :date-picker/date)
        select-handler! (fn [^js d]
                          ;; d is nil when clicked more than once
                          (when d
                            (let [gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
                                  journal (date/js-date->journal-title gd)]
                              ;; similar to page reference
                              (editor-handler/insert-command! dom-id
                                                              (page-ref/->page-ref journal)
                                                              format
                                                              {:command :page-ref})
                              (state/clear-editor-action!)
                              (reset! commands/*current-command nil)
                              (state/set-state! :date-picker/date d))))]
    [:div#date-time-picker.flex.flex-col.sm:flex-row
     ;; inline container
     [:div.border-red-500
      (ui/nlp-calendar
       {:mode "single"
        :initial-focus true
        :show-week-number false
        :selected date
        :on-select select-handler!
        :on-day-key-down (fn [^js d _ ^js e]
                           (when (= "Enter" (.-key e))
                             (select-handler! d)
                             (util/stop e)))})]]))
