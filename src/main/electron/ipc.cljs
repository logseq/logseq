(ns electron.ipc
  "Provides fns to send ipc messages to electron's main process"
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.util :as util]))

;; TODO: handle errors
(defn ipc
  [& args]
  (when (util/electron?)
    (p/let [result (js/window.apis.doAction (bean/->js args))]
      result)))

(defn invoke
  [channel & args]
  (when (util/electron?)
    (p/let [result (js/window.apis.invoke channel (bean/->js args))]
      result)))
