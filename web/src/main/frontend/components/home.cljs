(ns frontend.components.home
  (:require [frontend.state :as state]
            [frontend.handler :as handler]
            [rum.core :as rum]
            [frontend.components.sidebar :as sidebar]))

(rum/defc home < rum/reactive
  ;; {:will-mount (fn [state]
  ;;                (handler/get-me)
  ;;                state)}
  []
  (sidebar/sidebar (sidebar/main-content)))
