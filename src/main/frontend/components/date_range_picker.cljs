(ns frontend.components.date-range-picker
  "Date-range property value picker.

  Supports three precisions (year / month / day) and optional end-date ranges.
  The picker emits maps of the form
    {:precision :day | :month | :year
     :start     <YYYYMMDD integer>
     :end       <YYYYMMDD integer | nil>}
  via the :on-change callback.  The parent is responsible for persisting the
  value to the DB (see property/value.cljs)."
  (:require [cljs-time.core :as t]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

;;; ─── YYYYMMDD helpers ────────────────────────────────────────────────────────

(defn- ymd->int
  "Return a YYYYMMDD integer from year, month (1-12), day (1-31)."
  [y m d]
  (+ (* 10000 y) (* 100 m) d))

(defn- int->parts
  "Destructure a YYYYMMDD integer into [year month day]."
  [n]
  [(quot n 10000)
   (mod (quot n 100) 100)
   (mod n 100)])

(defn- js-date->int
  "Convert a js/Date to a YYYYMMDD integer using local time."
  [^js d]
  (ymd->int (.getFullYear d) (inc (.getMonth d)) (.getDate d)))

(defn- int->js-date
  "Convert a YYYYMMDD integer to a js/Date (midnight local time)."
  [n]
  (let [[y m d] (int->parts n)]
    (js/Date. y (dec m) d 0 0 0 0)))

;;; ─── Display label ───────────────────────────────────────────────────────────

(def ^:private month-abbr
  ["" "Jan" "Feb" "Mar" "Apr" "May" "Jun"
   "Jul" "Aug" "Sep" "Oct" "Nov" "Dec"])

(defn format-label
  "Return a human-readable string for a date-range value map."
  [{:keys [precision start end]}]
  (when start
    (let [fmt (case precision
                :year  (fn [n] (str (quot n 10000)))
                :month (fn [n]
                         (let [[y m] (int->parts n)]
                           (str (get month-abbr m "?") " " y)))
                (fn [n]
                  (let [[y m d] (int->parts n)]
                    (str (get month-abbr m "?") " " d ", " y))))]
      (if end
        (str (fmt start) " – " (fmt end))
        (fmt start)))))

;;; ─── Sub-pickers ─────────────────────────────────────────────────────────────

(rum/defc year-picker
  "Shows the current year with ‹ / › navigation. Clicking the year label
   selects it as the value."
  [{:keys [year on-select]}]
  [:div.flex.items-center.gap-3
   (shui/button {:variant :ghost :size :icon
                 :on-click #(on-select (dec year))}
                (ui/icon "chevron-left" {:size 14}))
   (shui/button {:variant :ghost :size :sm
                 :class "font-semibold text-base min-w-[5rem]"
                 :on-click #(on-select year)}
                (str year))
   (shui/button {:variant :ghost :size :icon
                 :on-click #(on-select (inc year))}
                (ui/icon "chevron-right" {:size 14}))])

(rum/defc month-grid
  "A 4×3 month grid with year navigation. Clicking a month calls on-select with
   the YYYYMMDD integer for the 1st of that month."
  [{:keys [year month on-select]}]
  (let [rows [["Jan" "Feb" "Mar"] ["Apr" "May" "Jun"]
              ["Jul" "Aug" "Sep"] ["Oct" "Nov" "Dec"]]]
    [:div.flex.flex-col.gap-1
     ;; year navigation header
     [:div.flex.items-center.justify-between.px-1
      (shui/button {:variant :ghost :size :icon
                    :on-click #(on-select (ymd->int (dec year) (or month 1) 1))}
                   (ui/icon "chevron-left" {:size 14}))
      [:span.font-semibold.text-sm (str year)]
      (shui/button {:variant :ghost :size :icon
                    :on-click #(on-select (ymd->int (inc year) (or month 1) 1))}
                   (ui/icon "chevron-right" {:size 14}))]
     ;; month grid
     (for [[r row] (map-indexed vector rows)]
       [:div.flex.gap-1 {:key r}
        (for [[c label] (map-indexed vector row)]
          (let [m (+ (* r 3) c 1)
                selected? (= m month)]
            (shui/button
             {:key label
              :variant (if selected? :default :ghost)
              :size :sm
              :class "flex-1"
              :on-click #(on-select (ymd->int year m 1))}
             label)))])]))

(rum/defc day-calendar
  "Wraps the existing nlp-calendar for day-precision selection."
  [{:keys [value on-select]}]
  (let [initial-day (when value (int->js-date value))]
    (ui/nlp-calendar
     {:selected   initial-day
      :on-day-click (fn [^js d]
                      (when d
                        (on-select (js-date->int d))))})))

;;; ─── Single endpoint picker ──────────────────────────────────────────────────

(rum/defcs endpoint-picker < (rum/local nil ::display-year)
  "Picker for a single start or end date.  Maintains its own local display-year
   atom for the year/month sub-pickers.  Calls on-select with a YYYYMMDD int."
  [state {:keys [precision value on-select label]}]
  (let [*display-year (::display-year state)
        [val-year val-month _] (when value (int->parts value))
        display-year (or @*display-year val-year (t/year (t/now)))]
    [:div.flex.flex-col.gap-2
     (when label
       [:span.text-xs.text-muted-foreground.font-medium.uppercase.tracking-wide label])
     (case precision
       :year
       (year-picker {:year      display-year
                     :on-select (fn [y]
                                  (reset! *display-year y)
                                  (on-select (ymd->int y 1 1)))})

       :month
       (month-grid  {:year      display-year
                     :month     val-month
                     :on-select (fn [yyyymmdd]
                                  (reset! *display-year (quot yyyymmdd 10000))
                                  (on-select yyyymmdd))})

       ;; :day (default)
       (day-calendar {:value     value
                      :on-select on-select}))]))

;;; ─── Main component ──────────────────────────────────────────────────────────

(rum/defcs date-range-picker-inner <
  rum/reactive
  (rum/local :day   ::precision)
  (rum/local false  ::range?)
  {:init (fn [state]
           (state/set-editor-action! :property-set-date)
           state)
   :will-unmount (fn [state]
                   (shui/popup-hide!)
                   (state/set-editor-action! nil)
                   state)}
  [state {:keys [value on-change on-delete del-btn?]}]
  (let [*precision (::precision state)
        *range?    (::range? state)
        ;; Initialise precision from existing value if any
        _          (when (and value (nil? @*precision))
                     (reset! *precision (:precision value)))
        precision  (or @*precision :day)
        range?     @*range?
        start      (:start value)
        end        (:end value)

        emit!      (fn [new-start new-end]
                     (when (fn? on-change)
                       (on-change {:precision precision
                                   :start     new-start
                                   :end       new-end})))]

    [:div.flex.flex-col.gap-3.p-1

     ;; ── precision selector ────────────────────────────────────────────────
     [:div.flex.gap-1
      (for [p [:year :month :day]]
        (shui/button
         {:key      (name p)
          :variant  (if (= p precision) :default :outline)
          :size     :sm
          :on-click (fn []
                      (reset! *precision p)
                      ;; coerce existing value to new precision if present
                      (when start
                        (let [[y m d] (int->parts start)
                              new-start (case p
                                          :year  (ymd->int y 1 1)
                                          :month (ymd->int y m 1)
                                          (ymd->int y m d))
                              new-end   (when end
                                          (let [[ey em ed] (int->parts end)]
                                            (case p
                                              :year  (ymd->int ey 1 1)
                                              :month (ymd->int ey em 1)
                                              (ymd->int ey em ed))))]
                          (emit! new-start new-end))))}
         (util/capitalize (name p))))]

     ;; ── start date ───────────────────────────────────────────────────────
     (endpoint-picker {:precision precision
                       :value     start
                       :label     (when range? "Start")
                       :on-select (fn [v] (emit! v end))})

     ;; ── end date (only shown when range mode is active) ───────────────────
     (when range?
       (endpoint-picker {:precision precision
                         :value     end
                         :label     "End"
                         :on-select (fn [v] (emit! start v))}))

     ;; ── footer buttons ────────────────────────────────────────────────────
     [:div.flex.justify-between.items-center.pt-1
      [:div.flex.gap-1
       (when-not range?
         (shui/button
          {:variant  :outline
           :size     :sm
           :on-click (fn []
                       (reset! *range? true))}
          (ui/icon "calendar-plus" {:size 14 :class "mr-1"})
          "Add end"))
       (when range?
         (shui/button
          {:variant  :outline
           :size     :sm
           :on-click (fn []
                       (reset! *range? false)
                       (emit! start nil))}
          "Single date"))]
      (when del-btn?
        (shui/button
         {:variant  :ghost
          :size     :icon
          :class    "text-muted-foreground hover:text-destructive"
          :on-click (fn [e]
                      (util/stop-propagation e)
                      (when (fn? on-delete) (on-delete e)))}
         (ui/icon "trash" {:size 14})))]]))
