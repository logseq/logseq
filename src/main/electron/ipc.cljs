(ns electron.ipc
  "Provides fns to send ipc messages to electron's main process"
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.util :as util]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn- maybe-read-transit
  [result]
  (if (string? result)
    (sqlite-util/read-transit-str result)
    result))

(defn- js-pure-object?
  [x]
  (or (array? x)
    (and (some? x)
      (= "[object Object]"
        (.call (.-toString (.-prototype js/Object)) x))
      (let [prototype (js/Object.getPrototypeOf x)]
        (or (nil? prototype)
          (nil? (js/Object.getPrototypeOf prototype)))))))

(defn- has-js-obj?
  [args]
  (some js-pure-object? args))

(defn ipc
  [& args]
  (when (util/electron?)
    (if-let [args (and (has-js-obj? args)
                    (conj (vec args) :js-obj))]
      (js/window.apis.doAction (bean/->js args))
      (p/let [payload (sqlite-util/write-transit-str args)
              maybe-result-str (js/window.apis.doAction payload)]
        (maybe-read-transit maybe-result-str)))))

(defn invoke
  [channel & args]
  (when (util/electron?)
    (p/let [result (js/window.apis.invoke channel (bean/->js args))]
      result)))
