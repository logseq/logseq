(ns logseq.cli.humanize
  "CLI-local wrappers around clj-commons humanize helpers."
  (:require [clj-commons.humanize :as humanize]
            [clj-commons.humanize.inflect :as humanize-inflect]))

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

(defn relative-datetime
  [then-ms now-ms]
  (cond
    (not (number? then-ms)) "-"
    (not (number? now-ms)) "-"
    (<= then-ms 0) "-"
    :else
    (humanize/relative-datetime (js/Date. then-ms)
                                :now-dt (js/Date. now-ms)
                                :max-terms 1
                                :number-format str)))
