(ns electron.ipc
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.util :as util]))

;; TODO: handle errors
(defn ipc
  [& args]
  (when (util/electron?)
    (p/let [result (js/window.apis.doAction (bean/->js args))]
      result)))
