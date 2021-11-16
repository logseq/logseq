(ns frontend.util.clock
  (:require [frontend.state :as state]
            [frontend.util.drawer :as drawer]
            [frontend.util :as util]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [frontend.date :as date]
            [clojure.string :as string]))

(defn minutes->hours:minutes
  [minutes]
  (let [hours (quot minutes 60)
        minutes (mod minutes 60)]
    (util/format "%02d:%02d" hours minutes)))

(defn seconds->hours:minutes:seconds
  [seconds]
  (let [hours (quot seconds 3600)
        minutes (quot (- seconds (* hours 3600)) 60)
        seconds (mod seconds 60)]
    (util/format "%02d:%02d:%02d" hours minutes seconds)))

(defn minutes->days:hours:minutes
  [minutes]
  (let [days (quot (quot minutes 60) 24)
        hours (quot (- minutes (* days 60 24)) 60)
        minutes (mod minutes 60)]
    (util/format "%s%s%s"
                 (if (zero? days) "" (str days "d"))
                 (if (zero? hours) "" (str hours "h"))
                 (if (zero? minutes) "" (str minutes "m")))))

(def support-seconds?
  (get (state/get-config)
       [:logbook/settings :with-second-support?] true))

(defn- now []
  (if support-seconds?
    (date/get-date-time-string-4)
    (date/get-date-time-string-3)))

(defn- clock-interval
  [stime etime]
  (let [[stime etime] (map #(tf/parse
                             (if support-seconds?
                               date/custom-formatter-4
                               date/custom-formatter-3)
                             %)
                           [stime etime])
        interval (t/interval stime etime)
        minutes (t/in-minutes interval)
        seconds (t/in-seconds interval)]
    (if support-seconds?
      (seconds->hours:minutes:seconds seconds)
      (minutes->hours:minutes minutes))))

(defn clock-in
  [format content]
  (drawer/insert-drawer
   format content "logbook"
   (util/format "CLOCK: [%s]" (now))))

(defn clock-out
  [format content]
  (try
    (or
     (when-let [clock-in-log (last (last (drawer/get-drawer-ast format content "logbook")))]
       (let [clock-in-log (string/trim clock-in-log)]
         (when (string/starts-with? clock-in-log "CLOCK:")
           (let [clock-start (subs clock-in-log 8 (- (count clock-in-log) 1))
                 clock-end (now)
                 clock-span (clock-interval clock-start clock-end)
                 clock-out-log (util/format "CLOCK: [%s]--[%s] =>  %s"
                                            clock-start clock-end clock-span)]
             (string/replace
              content
              (str clock-in-log "\n")
              (str clock-out-log "\n"))))))
     content)
    (catch js/Error e
      content)))

(defn clock-summary
  [body string?]
  (when-let [logbook (drawer/get-logbook body)]
    (when-let [logbook-lines (last logbook)]
      (when-let [clock-lines (filter #(string/starts-with? % "CLOCK:") logbook-lines)]
        (let [times (map #(string/trim (last (string/split % "=>"))) clock-lines)
              hours-coll (map #(int (first (string/split % ":"))) times)
              minutes-coll (map #(int (second (string/split % ":"))) times)
              seconds-coll (map #(int (nth (string/split % ":") 2 0)) times)
              reduced-seconds (reduce + seconds-coll)
              reduced-minutes (reduce + minutes-coll)
              reduced-hours (reduce + hours-coll)
              seconds (mod reduced-seconds 60)
              minutes (mod (+ reduced-minutes (quot reduced-seconds 60)) 60)
              hours (+ reduced-hours
                       (quot reduced-minutes 60)
                       (quot (+ (mod reduced-minutes 60) reduced-seconds) 3600))]
          (if string?
            (util/format "%s%s%s"
                         (if (>= hours 1)
                           (when hours (str hours "h"))
                           "")
                         (if (zero? minutes)
                           ""
                           (str minutes "m"))
                         (if (zero? seconds)
                           ""
                           (str seconds "s")))
            (let [minutes (+ (* hours 60) minutes)]
              (if (zero? minutes)
                seconds
                minutes))))))))
