(ns frontend.common.missionary
  "Macros for missionary"
  (:require [missionary.core :as m]))

(defmacro <?
  "Like m/?, but async channel or promise as arg"
  [chan-or-promise-or-task]
  `(m/? (<! ~chan-or-promise-or-task)))
