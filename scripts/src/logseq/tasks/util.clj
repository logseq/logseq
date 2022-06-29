(ns logseq.tasks.util
  "Utils for tasks"
  (:require [clojure.pprint :as pprint]
            [babashka.fs :as fs]))

(defn file-modified-later-than?
  [file comparison-instant]
  (pos? (.compareTo (fs/file-time->instant (fs/last-modified-time file))
                    comparison-instant)))

(defn print-usage [arg-str]
  (println (format
            "Usage: bb %s %s"
            (System/getProperty "babashka.task")
            arg-str))
  (System/exit 1))

(defn print-table
  [rows]
  (pprint/print-table rows)
  (println "Total:" (count rows)))
