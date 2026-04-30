(ns electron.logger
  "Electron logger, do not depends other libs"
  (:require ["electron-log" :as logger]
            [lambdaisland.glogi :as log]))

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

(log/add-handler (fn [{:keys [level message exception]}]
                   (let [f (case level
                             :warn
                             warn
                             :error
                             error
                             :debug
                             debug
                             info)]
                     (f message exception))))
