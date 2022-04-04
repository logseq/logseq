(ns frontend.components.home
  (:require [rum.core :as rum]
            [frontend.components.sidebar :as sidebar]))

(rum/defc home
  []
  (throw (ex-info "OOPS!" {}))
  (sidebar/main-content))
