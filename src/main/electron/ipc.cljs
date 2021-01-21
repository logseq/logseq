(ns electron.ipc
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defn ipc
  [& args]
  (js/window.api.doAction (bean/->js args)))
