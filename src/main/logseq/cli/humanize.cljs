(ns logseq.cli.humanize
  "CLI-local wrappers around clj-commons humanize helpers."
  (:require [clj-commons.humanize :as humanize]
            [clj-commons.humanize.inflect :as humanize-inflect]
            [clojure.string :as string]))

(def ^:private relative-unit->abbr
  {"second" "s"
   "minute" "m"
   "hour" "h"
   "day" "d"
   "week" "w"
   "month" "mo"
   "year" "y"})

(defn format-count
  [value]
  (let [n (if (number? value) value 0)]
    (humanize/intcomma (js/Math.floor n))))

(defn pluralize-noun
  [count noun]
  (humanize-inflect/pluralize-noun (or count 0) noun))

(defn format-count-with-noun
  [count noun]
  (str (format-count count)
       " "
       (pluralize-noun count noun)))

(defn format-filesize
  [byte-count]
  (if (number? byte-count)
    (humanize/filesize byte-count :binary true :format "%.1f")
    "-"))

(defn- unit->abbr
  [unit]
  (let [unit* (-> unit string/lower-case (string/replace #"s$" ""))]
    (get relative-unit->abbr unit* unit*)))

(defn- abbreviate-relative-datetime
  [result]
  (let [result (string/trim (or result ""))]
    (or (when-let [[_ n unit] (re-matches #"^(\d+)\s+([a-zA-Z]+)\s+ago$" result)]
          (str n (unit->abbr unit) " ago"))
        (when-let [[_ n unit] (re-matches #"^in\s+(\d+)\s+([a-zA-Z]+)$" result)]
          (str "in " n (unit->abbr unit)))
        (when (= "in 0s" result)
          result)
        result)))

(defn relative-datetime
  [then-ms now-ms]
  (cond
    (not (number? then-ms)) "-"
    (not (number? now-ms)) "-"
    (<= then-ms 0) "-"
    :else
    (-> (humanize/relative-datetime (js/Date. then-ms)
                                    :now-dt (js/Date. now-ms)
                                    :max-terms 1
                                    :number-format str
                                    :short-text "0s"
                                    :prefix "in"
                                    :suffix "ago")
        abbreviate-relative-datetime)))

(defn relative-ago
  [then-ms now-ms]
  (cond
    (not (number? then-ms)) "-"
    (not (number? now-ms)) "-"
    (<= then-ms 0) "-"
    (>= then-ms now-ms) "0s ago"
    :else
    (let [result (relative-datetime then-ms now-ms)]
      (if (string/starts-with? result "in ")
        "0s ago"
        result))))


