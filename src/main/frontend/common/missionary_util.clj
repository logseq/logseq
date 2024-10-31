(ns frontend.common.missionary-util
  "Macros for missionary"
  (:require [missionary.core :as m]))

(defmacro <?
  "Like m/?, but async channel or promise as arg"
  [chan-or-promise]
  `(m/? (<! ~chan-or-promise)))
