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

(defn ipc
  [& args]
  (when (util/electron?)
    (p/let [payload (sqlite-util/write-transit-str (vec args))
            maybe-result-str (js/window.apis.doAction payload)]
      (maybe-read-transit maybe-result-str))))

(defn invoke
  [channel & args]
  (when (util/electron?)
    (p/let [result (js/window.apis.invoke channel (bean/->js args))]
      result)))
