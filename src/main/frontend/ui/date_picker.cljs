(ns ^:no-doc frontend.ui.date-picker
  (:require [cljs-time.core       :refer [after? before? day day-of-week days first-day-of-the-month minus month months plus year]]
            [cljs-time.format     :refer [formatter unparse]]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.util  :as util    :refer [deref-or-value now->utc]]
            [rum.core :as rum]))

;; Adapted from re-com date-picker

;; TODO: add left, right, up, down, enter bindings

;; Loosely based on ideas: https://github.com/dangrossman/bootstrap-daterangepicker

;; --- cljs-time facades ------------------------------------------------------

(def ^:const month-format (formatter "MMMM yyyy"))

(def ^:const week-format (formatter "ww"))

(defn- month-label [date] (unparse month-format date))

(defn- dec-month [date] (minus date (months 1)))

(defn- inc-month [date] (plus date (months 1)))

(defn- inc-date [date n] (plus date (days n)))

(defn previous
  "If date fails pred, subtract period until true, otherwise answer date"
  ;; date   - a date object that satisfies cljs-time.core/DateTimeProtocol.
  ;;          If omitted, use now->utc, which returns a goog.date.UtcDateTime version of now with time removed.
  ;; pred   - can be one of cljs-time.predicate e.g. sunday? but any valid pred is supported.
  ;; period - a period which will be subtracted see cljs-time.core periods
  ;; Note:  If period and pred do not represent same granularity, some steps may be skipped
                                        ;         e.g Pass a Wed date, specify sunday? as pred and a period (days 2) will skip one Sunday.
  ([pred]
   (previous pred (now->utc)))
  ([pred date]
   (previous pred date (days 1)))
  ([pred date period]
   (if (pred date)
     date
     (recur pred (minus date period) period))))

(defn- =date [date1 date2]
  (and
   (= (year date1)  (year date2))
   (= (month date1) (month date2))
   (= (day date1)   (day date2))))

(defn- <=date [date1 date2]
  (or (=date date1 date2) (before? date1 date2)))

(defn- >=date [date1 date2]
  (or (=date date1 date2) (after? date1 date2)))

(def ^:private days-vector
  [{:key :Mo :short-name "M" :name "MON"}
   {:key :Tu :short-name "T" :name "TUE"}
   {:key :We :short-name "W" :name "WED"}
   {:key :Th :short-name "T" :name "THU"}
   {:key :Fr :short-name "F" :name "FRI"}
   {:key :Sa :short-name "S" :name "SAT"}
   {:key :Su :short-name "S" :name "SUN"}])

(defn- rotate
  [n coll]
  (let [c (count coll)]
    (take c (drop (mod n c) (cycle coll)))))

(defn- is-day-pred [d]
  #(= (day-of-week %) (inc d)))

;; ----------------------------------------------------------------------------

(def *internal-model (rum/cursor state/state :date-picker/date))

(defn- main-div-with
  [table-div class style attr]
  [:div.rc-datepicker-wrapper
   [:div {:style {:border-radius 4}}
    [:div (merge
           {:class (str "rc-datepicker datepicker noselect " class)
            :style (merge {:font-size "13px"
                           :position  "static"}
                          style)}
           attr)
     table-div]]])

(rum/defc table-thead
  "Answer 2 x rows showing month with nav buttons and days NOTE: not internationalized"
  [display-month {show-weeks? :show-weeks? minimum :minimum maximum :maximum start-of-week :start-of-week}]
  (let [prev-date     (dec-month display-month)
        minimum       (deref-or-value minimum)
        maximum       (deref-or-value maximum)
        prev-enabled? (if minimum (after? prev-date (dec-month minimum)) true)
        next-date     (inc-month display-month)
        next-enabled? (if maximum (before? next-date maximum) true)
        template-row  (if show-weeks? [:tr [:th]] [:tr])]
    [:thead
     (conj template-row
           [:th {:class (str "prev " (if prev-enabled? "available selectable" "disabled"))
                 :style {:padding "0px"}
                 :on-click #(when prev-enabled? (reset! *internal-model prev-date))}
            [:span.font-bold "<"]]
           [:th {:class "month" :col-span "5"} (month-label display-month)]
           [:th {:class (str "next " (if next-enabled? "available selectable" "disabled"))
                 :style {:padding "0px"}
                 :on-click #(when next-enabled? (reset! *internal-model next-date))}
            [:span.font-bold ">"]])
     (conj template-row
           (for [day (rotate start-of-week days-vector)]
             ^{:key (:key day)} [:th {:class "day-enabled"} (str (:name day))]))]))

(defn- table-td
  [date focus-month selected today {minimum :minimum maximum :maximum :as attributes} disabled? on-change]
  ;;following can be simplified and terse
  (let [minimum       (deref-or-value minimum)
        maximum       (deref-or-value maximum)
        enabled-min   (if minimum (>=date date minimum) true)
        enabled-max   (if maximum (<=date date maximum) true)
        enabled-day   (and enabled-min enabled-max)
        disabled-day? (if enabled-day
                        (not ((:selectable-fn attributes) date))
                        true)
        classes       (cond disabled?                    "off"
                            disabled-day?                "off"
                            (= focus-month (month date)) "available"
                            :else                        "available off")
        classes       (cond (and selected (=date selected date)) (str classes " active start-date end-date")
                            (and today (=date date today))       (str classes " today")
                            :else                                classes)
        on-click      (fn [e]
                        (when-not (or disabled? disabled-day?)
                          (reset! *internal-model date)
                          (on-change e date)))]
    [:td {:class    classes
          :on-click on-click} (day date)]))

(defn- week-td [date]
  [:td {:class "week"} (unparse week-format date)])

(defn- table-tr
  "Return 7 columns of date cells from date inclusive"
  [date focus-month selected attributes disabled? on-change]
                                        ;  {:pre [(sunday? date)]}
  (let [table-row (if (:show-weeks? attributes) [:tr (week-td date)] [:tr])
        row-dates (map #(inc-date date %) (range 7))
        today     (when (:show-today? attributes) (now->utc))]
    (into table-row (map #(table-td % focus-month selected today attributes disabled? on-change) row-dates))))

(rum/defc table-tbody
  "Return matrix of 6 rows x 7 cols table cells representing 41 days from start-date inclusive"
  [display-month selected attributes disabled? on-change]
  (let [start-of-week   (:start-of-week attributes)
        current-start   (previous (is-day-pred start-of-week) display-month)
        focus-month     (month display-month)
        row-start-dates (map #(inc-date current-start (* 7 %)) (range 6))]
    (into [:tbody] (map #(table-tr % focus-month selected attributes disabled? on-change) row-start-dates))))

(defn- configure
  "Augment passed attributes with extra info/defaults"
  [attributes]
  (let [selectable-fn (if (-> attributes :selectable-fn fn?)
                        (:selectable-fn attributes)
                        (constantly true))]
    (merge attributes {:selectable-fn selectable-fn})))


(rum/defc date-picker < rum/reactive
  {:init (fn [state]
           (reset! *internal-model (first (:rum/args state)))
           state)}
  (shortcut/mixin :shortcut.handler/date-picker false)
  [_model {:keys [on-change disabled? start-of-week class style attr]
           :or   {start-of-week (state/get-start-of-week)} ;; Default to Sunday
           :as   args}]
  (let [internal-model (util/react *internal-model)
        display-month (first-day-of-the-month (or internal-model (now->utc)))
        props-with-defaults (merge args {:start-of-week start-of-week})
        configuration       (configure props-with-defaults)]
    (main-div-with
     [:table.table-auto {:class "table-condensed"}
      (table-thead display-month configuration)
      (table-tbody display-month internal-model configuration disabled? on-change)]
     class
     style
     attr)))
