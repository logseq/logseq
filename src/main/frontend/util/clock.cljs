(ns frontend.util.clock
  "Provides clock related functionality used by tasks"
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

(defn s->dhms-util
  "A function that returns the values for easier testing. 
   Always in the order [days, hours, minutes, seconds]"
  [seconds]
  (let [days (quot (quot seconds 3600) 24)
        n (mod seconds (* 24 3600))
        hours (quot n 3600)
        n (mod n 3600)
        minutes (quot n 60)
        secs (mod n 60)]
    [days hours minutes secs]))

(defn seconds->days:hours:minutes:seconds
  [seconds]
  (let [[days hours minutes seconds] (s->dhms-util seconds)]
    (util/format "%s%s%s%s"
                 (if (zero? days) "" (str days "d"))
                 (if (zero? hours) "" (str hours "h"))
                 (if (zero? minutes) "" (str minutes "m"))
                 (if (zero? seconds) "" (str seconds "s")))))

(def support-seconds?
  (get-in (state/get-config)
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
    (catch :default _e
      content)))

(defn clock-summary
  [body string?]
  (when-let [logbook (drawer/get-logbook body)]
    (when-let [logbook-lines (last logbook)]
      (when-let [clock-lines (seq (filter #(string/starts-with? % "CLOCK:") logbook-lines))]
        (let [[hours minutes seconds] (apply map + (->> clock-lines
                                                        (map #(string/split (string/trim (last (string/split % "=>"))) ":"))
                                                        (map #(map int %))))
              duration (t/period :hours hours
                                 :minutes minutes
                                 :seconds seconds)
              duration-in-minutes (t/in-minutes duration)
              zero-minutes? (zero? duration-in-minutes)]
          (if string?
            (if zero-minutes?
              (str seconds "s")
              (-> (tf/unparse-duration duration)
                  (string/replace #"\s+days?\s+" "d")
                  (string/replace #"\s+hours?\s+" "h")
                  (string/replace #"\s+minutes?$" "m")))
            (if zero-minutes?
              seconds
              (* 60 duration-in-minutes))))))))
