(ns frontend.handler.repeated
  "Provides fns related to schedule and deadline"
  (:require [cljs-time.core :as t]
            [cljs-time.local :as tl]
            [cljs-time.format :as tf]
            [clojure.string :as string]
            [frontend.util :as util]))

(def custom-formatter (tf/formatter "yyyy-MM-dd EEE"))

(defn repeated?
  [timestamp]
  (some? (:repetition timestamp)))

(defn- get-duration-f-and-text
  [duration]
  (case duration
    "Hour"
    [t/hours "h"]
    "Day"
    [t/days "d"]
    "Week"
    [t/weeks "w"]
    "Month"
    [t/months "m"]
    "Year"
    [t/years "y"]
    nil))

(defn get-repeater-symbol
  [kind]
  (case kind
    "Plus"
    "+"
    "Dotted"
    ".+"
    "++"))

(defn timestamp->text
  ([timestamp]
   (timestamp->text timestamp nil))
  ([{:keys [date repetition time]} start-time]
   (let [{:keys [year month day]} date
         {:keys [hour min]
          :or {hour 0 min 0}} time
         [hour min] (if start-time
                      [(t/hour start-time)
                       (t/minute start-time)]
                      [hour min])
         [[kind] [duration] num] repetition
         start-time (or start-time (t/local-date-time year month day hour min))
         [_duration-f d] (get-duration-f-and-text duration)
         kind (get-repeater-symbol kind)
         repeater (when (and kind num d)
                    (str kind num d))
         time-repeater (if time
                         (str (util/zero-pad hour) ":" (util/zero-pad min)
                              (if (string/blank? repeater)
                                ""
                                (str " " repeater)))
                         repeater)]
     (util/format "%s%s"
                  (tf/unparse custom-formatter start-time)
                  (if (string/blank? time-repeater)
                    ""
                    (str " " time-repeater))))))

(defn- repeat-until-future-timestamp
  [datetime now delta keep-week?]
  (let [datetime (t/plus datetime delta)
        result (loop [result datetime]
                 (if (t/after? result now)
                   result
                   (recur (t/plus result delta))))
        w1 (t/day-of-week datetime)
        w2 (t/day-of-week result)]
    (if (and keep-week? (not= w1 w2))
      ;; next week
      (if (> w2 w1)
        (t/plus result (t/days (- 7 (- w2 w1))))
        (t/plus result (t/days (- w1 w2))))
      result)))

(defn next-timestamp-text
  [{:keys [date repetition time] :as timestamp}]
  (let [{:keys [year month day]} date
        {:keys [hour min]
         :or {hour 0 min 0}} time
        [[kind] [duration] num] repetition
        week? (or (= duration "Week")
                  (= duration "w"))
        [duration-f _] (get-duration-f-and-text duration)
        delta (duration-f num)
        start-time (t/local-date-time year month day hour min)
        now (tl/local-now)
        start-time' (case kind
                      "Dotted"
                      (repeat-until-future-timestamp start-time now delta week?)

                      "DoublePlus"
                      (if (t/after? start-time now)
                        start-time
                        (t/plus start-time delta))


                      ;; "Plus"
                      (t/plus start-time delta))]
    (timestamp->text timestamp start-time')))

(defn timestamp-map->text
  [{:keys [date time repeater]}]
  (let [{:keys [kind duration num]} repeater
        repeater (when (and kind num duration)
                   (str kind num duration))
        time-repeater (if-not (string/blank? time)
                        (str time
                             (if (string/blank? repeater)
                               ""
                               (str " " repeater)))
                        repeater)]
    (util/format "<%s%s>"
                 (tf/unparse custom-formatter date)
                 (if (string/blank? time-repeater)
                   ""
                   (str " " time-repeater)))))

(defn timestamp->map
  [{:keys [date repetition time]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [[kind] [duration] num] repetition]
    {:date (t/local-date year month day)
     :time (when (and hour min)
             (str (util/zero-pad hour) ":" (util/zero-pad min)))
     :repeater (when (and kind duration num)
                 {:kind (get-repeater-symbol kind)
                  :duration (last (get-duration-f-and-text duration))
                  :num num})}))
