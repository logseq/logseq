(ns frontend.common.missionary-util
  "Macros for missionary"
  (:require [missionary.core :as m]))

(defmacro <?
  "Like m/?, but async channel as arg"
  [c]
  `(m/? (<! ~c)))
