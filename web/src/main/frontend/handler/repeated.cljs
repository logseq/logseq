(ns frontend.handler.repeated
  (:require [cljs-time.core :as t]
            [cljs-time.local :as tl]
            [cljs-time.format :as tf]
            [frontend.date :as date]
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
         kind (get-repeater-symbol kind)
         repeater (when (and kind num d)
                    (str kind num d))
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

(defn- repeat-until-future-timestamp
  [datetime now delta keep-week?]
  (let [result (loop [result datetime]
                 (if (t/after? result now)
                   result
                   (recur (t/plus result delta))))
        w1 (t/day-of-week datetime)
        w2 (t/day-of-week result)]
    (reset! debug-data {:w1 w1
          :w2 w2
          :result result
          :datetime datetime
          :now now})
    (if (and keep-week? (not= w1 w2))
      ;; next week
      (if (> w2 w1)
        (t/plus result (t/days (- 7 (- w2 w1))))
        (t/plus result (t/days (- w1 w2))))
      result)))

;; Fro https://www.reddit.com/r/orgmode/comments/hr2ytg/difference_between_the_repeaters_orgzly/fy2izqx?utm_source=share&utm_medium=web2x&context=3
;; I use these repeaters for habit tracking and it can get a little tricky to keep track. This is my short form understanding:
;; ".+X" = repeat in X d/w/m from the last time I marked it done
;; "++X" = repeat in at least X d/w/m from the last time I marked it done and keep it on the same day of the week move the due date into the future by increments of d/w/m. If the due date, after being moved forward X d/w/m is still in the past, adjust it by however many d/w/m needed to get it into the future. For the w, the day of the week is kept constant.
;; "+X" = repeat in X d/w/m from when I originally scheduled it, regardless of when I marked it done. Rarely used (as described by u/serendependy). A relevant case would be "paying rent" from the link.
(defn next-timestamp-text
  [{:keys [date wday repetition time active] :as timestamp}]
  (let [{:keys [year month day]} date
        {:keys [hour min]
         :or {hour 0 min 0}} time
        [[kind] [duration] num] repetition
        [duration-f _] (get-duration-f-and-text duration)
        delta (duration-f num)
        today (date/get-local-date)
        start-time (t/local-date-time year month day hour min)
        start-time' (if (or (= kind "Dotted")
                            (= kind "DoublePlus"))
                      (if (t/before? (tl/local-now) start-time)
                        start-time

                        ;; Repeatedly add delta to make it a future timestamp
                        (repeat-until-future-timestamp start-time (tl/local-now) delta
                                                       (= kind "DoublePlus")))
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
  [{:keys [date wday repetition time active]}]
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
