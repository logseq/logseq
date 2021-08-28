(ns frontend.util.clock
  (:require [frontend.util.drawer :as drawer]
            [frontend.util :as util]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [frontend.date :as date]
            [clojure.string :as string]))

(defn minutes->hours:minutes
  [minutes]
  (let [hours (/ minutes 60)
        minutes (mod minutes 60)]
    (util/format "%02d:%02d" hours minutes)))

(defn clock-in
  [format content]
  (drawer/insert-drawer
   format content "logbook"
   (util/format "CLOCK: [%s]"
                (date/get-date-time-string-3))))

(defn clock-out
  [format content]
  (if-let [clock-in-log (last (last (drawer/get-drawer-ast format content "logbook")))]
    (when (string/starts-with? clock-in-log "CLOCK:")
      (let [clock-start (subs clock-in-log 8 (- (count clock-in-log) 1))
            clock-end (date/get-date-time-string-3)
            clock-span (minutes->hours:minutes
                        (t/in-minutes
                         (t/interval
                          (tf/parse date/custom-formatter-3 clock-start)
                          (tf/parse date/custom-formatter-3 clock-end))))
            clock-out-log (util/format "CLOCK: [%s]--[%s] =>  %s"
                                       clock-start clock-end clock-span)]
        (string/replace
         content
         (str clock-in-log "\n")
         (str clock-out-log "\n"))))
    content))

(defn clock-summary
  [format content]
  (when-let [logbook-lines (last (drawer/get-drawer-ast format content "logbook"))]
    (when-let [clock-lines (filter #(string/starts-with? % "CLOCK: ") logbook-lines)]
      (let [times (map #(string/trim (last (string/split % "=>"))) clock-lines)
            hours (map #(int (first (string/split % ":"))) times)
            minutes (map #(int (second (string/split % ":"))) times)
            minutes (+ (* 60 (reduce + hours))
                       (reduce + minutes))]
        (str minutes "m")))))
