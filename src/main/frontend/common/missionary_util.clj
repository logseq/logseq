(ns frontend.common.missionary-util
  (:require [missionary.core :as m]))

(defmacro <?
  "Like m/?, but async channel as arg"
  [c]
  `(m/? (<! ~c)))
