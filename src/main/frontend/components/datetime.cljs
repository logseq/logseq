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
            [frontend.mixins :as mixins]
            [rum.core :as rum]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(defonce default-timestamp-value {:time ""
                                  :repeater {}})
(defonce *timestamp (atom default-timestamp-value))

(defonce *show-time? (atom false))
(rum/defc time-input < rum/reactive
  [default-value]
  (let [show? (rum/react *show-time?)]
    (if (or show? (not (string/blank? default-value)))
      [:div.flex.flex-row {:style {:height 32}}
       [:input#time.form-input.w-20.ms:w-60
        {:default-value default-value
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
      [:div.w.full.flex.flex-row.justify-left
       [:input#repeater-num.form-input.w-8.mr-2.px-1.sm:w-20.sm:px-2.text-center
        {:default-value num
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
        (fn [_e value]
          (swap! *timestamp assoc-in [:repeater :duration] value))
        nil)

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

(defn- clear-timestamp!
  []
  (reset! *timestamp default-timestamp-value)
  (reset! *show-time? false)
  (reset! *show-repeater? false)
  (state/set-state! :date-picker/date nil))

(defn- on-submit
  "Submit handler of date picker"
  [e]
  (when e (util/stop e))
  (let [{:keys [repeater] :as timestamp} @*timestamp
        date (:date-picker/date @state/state)
        timestamp (assoc timestamp :date (or date (t/today)))
        kind (if (= "w" (:duration repeater)) "++" ".+")
        timestamp (assoc-in timestamp [:repeater :kind] kind)
        text (repeated/timestamp-map->text timestamp)
        block-data (state/get-timestamp-block)
        {:keys [block typ show?]} block-data
        editing-block-id (:block/uuid (state/get-edit-block))
        block-id (or (:block/uuid block)
                     editing-block-id)
        typ (or @commands/*current-command typ)]
    (if (and (state/editing?) (= editing-block-id block-id))
      (editor-handler/set-editing-block-timestamp! typ
                                                   text)
      (editor-handler/set-block-timestamp! block-id
                                           typ
                                           text))

    (when show?
      (reset! show? false)))
  (clear-timestamp!)
  (state/set-timestamp-block! nil)
  (commands/restore-state))

(rum/defc time-repeater < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (when-let [input (state/get-input)]
       (js/setTimeout #(mixins/on-enter state
                                        :node input
                                        :on-enter on-submit) 100))))
  []
  (let [{:keys [time repeater]} (rum/react *timestamp)]
    [:div#time-repeater.py-1.px-4
     [:p.text-sm.opacity-50.font-medium.mt-4 "Time:"]
     (time-input time)

     [:p.text-sm.opacity-50.font-medium.mt-4 "Repeater:"]
     (repeater-cp repeater)

     [:p.mt-4
      (ui/button "Submit"
                 :on-click on-submit)]]))

(rum/defc date-picker < rum/reactive
  {:init (fn [state]
           (let [ts (last (:rum/args state))]
             (clear-timestamp!)
             (if ts
               (reset! *timestamp ts)
               (reset! *timestamp {:time ""
                                   :repeater {}}))
             (when-not (:date-picker/date @state/state)
               (state/set-state! :date-picker/date (get ts :date (t/today)))))
           state)}
  [dom-id format _ts]
  (let [current-command @commands/*current-command
        deadline-or-schedule? (and current-command
                                   (contains? #{"deadline" "scheduled"}
                                              (string/lower-case current-command)))
        date (state/sub :date-picker/date)]
    [:div#date-time-picker.flex.flex-col.sm:flex-row {:on-click (fn [e] (util/stop e))
                                                      :on-mouse-down (fn [e] (.stopPropagation e))}
     (ui/datepicker
      date
      {:deadline-or-schedule? deadline-or-schedule?
       :on-change
       (fn [e date]
         (util/stop e)
         (let [date (t/to-default-time-zone date)
               journal (date/journal-name date)]
           ;; deadline-or-schedule? is handled in on-submit, not here
           (when-not deadline-or-schedule?
               ;; similar to page reference
             (editor-handler/insert-command! dom-id
                                             (page-ref/->page-ref journal)
                                             format
                                             {:command :page-ref})
             (state/clear-editor-action!)
             (reset! commands/*current-command nil))))})
     (when deadline-or-schedule?
       (time-repeater))]))
