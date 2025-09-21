(ns frontend.components.home
  (:require [rum.core :as rum]
            [frontend.components.container :as container]))

(rum/defc home
  []
  (container/main-content))
