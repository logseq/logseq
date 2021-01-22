(ns electron.ipc
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]))

;; TODO: handle errors
(defn ipc
  [& args]
  (p/let [result (js/window.apis.doAction (bean/->js args))]
    result))
