(ns electron.logger
  "Electron logger, do not depends other libs"
  (:require ["electron-log" :as logger]))


(defn- transform-args [args]
  (map #(cond
          (or (keyword? %) (map? %) (seq? %))
          (str %)

          :else
          %)
       args))


(defn debug
  [& args]
  (apply (.-debug logger) (transform-args args)))

(defn info
  [& args]
  (apply (.-info logger) (transform-args args)))

(defn warn
  [& args]
  (apply (.-warn logger) (transform-args args)))

(defn error
  [& args]
  (apply (.-error logger) (transform-args args)))

