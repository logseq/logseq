(ns frontend.components.home
  (:require [io.factorhouse.hsx.core :as hsx]
            [frontend.components.container :as container]))

(hsx/defc home
  []
  (container/main-content))
