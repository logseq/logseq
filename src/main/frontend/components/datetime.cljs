(ns frontend.components.datetime
  (:require [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.repeated :as repeated]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defonce default-timestamp-value {:date nil
                                  :time ""
                                  :repeater {}})
(defonce *timestamp (atom default-timestamp-value))

(defonce *show-time? (atom false))
(rum/defc time-input < rum/reactive
  [default-value]
  (let [show? (rum/react *show-time?)]
    (if (or show? (not (string/blank? default-value)))
      [:div.flex.flex-row {:style {:height 32}}
       [:input#time.form-input
        {:style {:width 240}
         :default-value default-value
         :on-change (fn [event]
                      (util/stop event)
                      (let [value (util/evalue event)]
                        (swap! *timestamp assoc :time value)))}]
       [:a.ml-2.self-center {:on-click (fn []
                                         (reset! *show-time? false)
                                         (swap! *timestamp assoc :time nil))}
        svg/close]]
      [:a.text-sm {:on-click (fn []
                               (reset! *show-time? true)
                               (let [{:keys [hour minute]} (date/get-local-date)
                                     result (str hour ":" (util/zero-pad minute))]
                                 (swap! *timestamp assoc :time result)))}
       "Add time"])))

(defonce *show-repeater? (atom false))
(rum/defc repeater-cp < rum/reactive
  [{:keys [num duration kind]}]
  (let [show? (rum/react *show-repeater?)]
    (if (or show? (and num duration kind))
      [:div.flex.flex-row.justify-center {:style {:height 32}}
       [:div.block.text-medium.mr-2.mt-1 {:style {:width 110}}
        "Every"]
       [:input#repeater-num.form-input.mt-1
        {:style {:width 48}
         :default-value num
         :on-change (fn [event]
                      (let [value (util/evalue event)]
                        (swap! *timestamp assoc-in [:repeater :num] value)))}]
       (ui/select
        (mapv
         (fn [item]
           (if (= (:label item) duration)
             (assoc item :selected "selected")
             item))
         [{:label "h"}
          {:label "d"}
          {:label "w"}
          {:label "m"}
          {:label "y"}])
        (fn [value]
          (swap! *timestamp assoc-in [:repeater :duration] value)))

       [:a.ml-2.self-center {:on-click (fn []
                                         (reset! *show-repeater? false)
                                         (swap! *timestamp assoc :repeater {}))}
        svg/close]]
      [:a.text-sm {:on-click (fn []
                               (reset! *show-repeater? true)
                               (swap! *timestamp assoc :repeater
                                      {:kind ".+"
                                       :num 1
                                       :duration "d"}))}
       "Add repeater"])))

(defn clear-timestamp!
  []
  (reset! *timestamp default-timestamp-value)
  (reset! *show-time? false)
  (reset! *show-repeater? false))

(rum/defc time-repeater < rum/reactive
  []
  (let [{:keys [date time repeater] :as timestamp} (rum/react *timestamp)
        timestamp (if date
                    timestamp
                    (assoc timestamp :date (t/today)))
        kind (if (= "w" (:duration repeater)) "++" ".+")
        timestamp (assoc-in timestamp [:repeater :kind] kind)
        text (repeated/timestamp-map->text timestamp)]
    [:div.py-1.px-4 {:style {:min-width 300}}
     [:p.text-sm.opacity-50.font-medium.mt-4 "Time:"]
     (time-input time)

     [:p.text-sm.opacity-50.font-medium.mt-4 "Repeater:"]
     (repeater-cp repeater)

     [:p.mt-4
      (ui/button "Submit"
                 :on-click (fn [e]
                             (util/stop e)
                             (let [block-data (state/get-timestamp-block)]
                               (let [{:keys [block typ show?]} block-data
                                     block-id (or (:block/uuid (state/get-edit-block))
                                                  (:block/uuid block))
                                     typ (or @commands/*current-command typ)]
                                 (editor-handler/set-block-timestamp! block-id
                                                                      typ
                                                                      text)
                                 (state/clear-edit!)
                                 (when show?
                                   (reset! show? false))))
                             (clear-timestamp!)
                             (state/set-editor-show-date-picker! false)))]]))

(rum/defc date-picker < rum/reactive
  {:init (fn [state]
           (let [ts (last (:rum/args state))]
             (if ts
               (reset! *timestamp ts)
               (reset! *timestamp {:date (if (and ts (:date ts))
                                           (:date ts)
                                           (t/today))
                                   :time ""
                                   :repeater {}})))
           state)
   :will-unmount (fn [state]
                   (clear-timestamp!)
                   state)}
  [id format ts]
  (let [current-command @commands/*current-command
        deadline-or-schedule? (and current-command
                                   (contains? #{"deadline" "scheduled"}
                                              (string/lower-case current-command)))
        date (get @*timestamp :date)]
    (when (state/sub :editor/show-date-picker?)
      [:div#date-time-picker.flex.flex-row {:on-click (fn [e] (util/stop e))
                                            :on-mouse-down (fn [e] (.stopPropagation e))}
       (ui/datepicker
        date
        {:deadline-or-schedule? deadline-or-schedule?
         :on-change
         (fn [e date]
           (util/stop e)
           (let [date (t/to-default-time-zone date)
                 journal (date/journal-name date)]
             (when-not deadline-or-schedule?
               ;; similar to page reference
               (editor-handler/insert-command! id
                                               (util/format "[[%s]]" journal)
                                               format
                                               nil)
               (state/set-editor-show-date-picker! false)
               (reset! commands/*current-command nil))
             (swap! *timestamp assoc :date date)))})
       (when deadline-or-schedule?
         (time-repeater))])))
