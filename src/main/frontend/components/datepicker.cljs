(ns frontend.components.datepicker
  "Datepicker component"
  (:require [cljs-time.core :as t]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(def ^:private focused-day-selector
  "[role='gridcell'][aria-selected='true'] button, [role='gridcell'] button[tabindex='0']")

(defn- focus-calendar-day!
  [root-id remaining]
  (when (pos? remaining)
    (if-let [day (some-> root-id
                         (js/document.getElementById)
                         (.querySelector focused-day-selector))]
      (.focus day)
      (js/setTimeout #(focus-calendar-day! root-id (dec remaining)) 16))))

(hsx/defc date-picker
  [dom-id format]
  (hooks/use-effect!
   (fn []
     (when-not (:date-picker/date @state/state)
       (state/set-state! :date-picker/date (t/today))))
   [])
  (let [selected-date (state/use-sub :date-picker/date)
        select-handler! (hooks/use-callback
                         (fn [^js d]
                           (when-let [d (or d selected-date)]
                             (let [gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
                                   journal (date/js-date->journal-title gd)]
                               ;; similar to page reference
                               (editor-handler/insert-command! dom-id
                                                               (melange-common/to-page-ref journal)
                                                               format
                                                               {:command :page-ref})
                               (state/clear-editor-action!)
                               (reset! commands/*current-command nil)
                               (state/set-state! :date-picker/date d))))
                         [dom-id format selected-date])]
    (hooks/use-effect!
     (fn []
       (js/setTimeout #(focus-calendar-day! "date-time-picker" 10) 16)
       nil)
     [selected-date])
    (hooks/use-window-keydown
     (fn [^js e]
       (when (and (= "Enter" (.-key e))
                  (not (some-> (.-target e)
                               (.closest ".ls-nlp-calendar input"))))
         (select-handler! selected-date)
         (util/stop e)))
     [selected-date select-handler!])
    [:div#date-time-picker.ls-editor-date-picker.flex.flex-col
     ;; inline container
     [:div.border-red-500
      (ui/nlp-calendar
       {:mode "single"
        :initial-focus true
        :show-week-number false
        :selected selected-date
        :on-select select-handler!
        :on-day-key-down (fn [^js d _ ^js e]
                           (when (= "Enter" (.-key e))
                             (select-handler! d)
                             (util/stop e)))})]]))
