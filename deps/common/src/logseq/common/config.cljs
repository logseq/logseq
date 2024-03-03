(ns logseq.common.config
  "This ns provides common fns related to user config"
  (:require [clojure.string :as string]))

(defn- hidden?
  [path patterns]
  (let [path (if (and (string? path)
                      (= \/ (first path)))
               (subs path 1)
               path)]
    (some (fn [pattern]
            (let [pattern (if (and (string? pattern)
                                   (not= \/ (first pattern)))
                            (str "/" pattern)
                            pattern)]
              (string/starts-with? (str "/" path) pattern))) patterns)))

(defn remove-hidden-files
  "Removes files that match a pattern specified by :hidden config"
  [files config get-path-fn]
  (if-let [patterns (seq (:hidden config))]
    (remove (fn [file]
              (let [path (get-path-fn file)]
                (hidden? path patterns))) files)
    files))