(ns frontend.util.clock
  "Provides clock related functionality used by tasks"
  (:require [frontend.util :as util]))

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
    (cond
      (> days 0)
      (util/format "%s%s"
                   (if (zero? days) "" (str days "d"))
                   (if (zero? hours) "" (str hours "h")))

      (> minutes 0)
      (util/format "%s%s"
                   (if (zero? hours) "" (str hours "h"))
                   (if (zero? minutes) "" (str minutes "m")))
      :else
      (if (> seconds 0)
        (str seconds "s")
        ""))))

(comment
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
      (util/format "%02d:%02d:%02d" hours minutes seconds))))
