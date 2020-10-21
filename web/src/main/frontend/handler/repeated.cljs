(ns frontend.handler.repeated
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

(defn timestamp->text
  ([timestamp]
   (timestamp->text timestamp nil))
  ([{:keys [date wday repetition time active]} start-time]
   (let [{:keys [year month day]} date
         {:keys [hour min]
          :or {hour 0 min 0}} time
         [hour min] (if start-time
                      [(t/hour start-time)
                       (t/minute start-time)]
                      [hour min])
         [[kind] [duration] num] repetition
         start-time (or start-time (t/local-date-time year month day hour min))
         [duration-f d] (get-duration-f-and-text duration)
         kind (case kind
                "Plus"
                "+"
                "Dotted"
                ".+"
                "++")
         repeater (str kind num d)
         time-repeater (if time
                         (str (util/zero-pad hour) ":" (util/zero-pad min)
                              (if (string/blank? repeater)
                                ""
                                (str " " repeater)))
                         repeater)]
     (util/format "<%s%s>"
                  (tf/unparse custom-formatter start-time)
                  (if (string/blank? time-repeater)
                    ""
                    (str " " time-repeater))))))

(defn next-timestamp-text
  [{:keys [date wday repetition time active] :as timestamp}]
  (let [{:keys [year month day]} date
        {:keys [hour min]
         :or {hour 0 min 0}} time
        [[kind] [duration] num] repetition
        start-time (if (= kind "Plus")
                     (t/local-date-time year month day hour min)
                     (tl/local-now))
        [duration-f _] (get-duration-f-and-text duration)
        start-time' (t/plus start-time (duration-f num))]
    (timestamp->text timestamp start-time')))

(defn timestamp-map->text
  [{:keys [date time repeater]}]
  (let [{:keys [kind duration num]} repeater
        repeater (str kind num duration)
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
