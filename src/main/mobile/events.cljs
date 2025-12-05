(ns mobile.events
  "Mobile events"
  (:require [frontend.handler.events :as events]
            [frontend.state :as state]
            [mobile.components.recorder :as recorder]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [reitit.frontend.easy :as rfe]))

(defmethod events/handle :mobile/clear-edit [_]
  (state/clear-edit!)
  (init/keyboard-hide))

(defmethod events/handle :mobile/start-audio-record [_]
  (recorder/record! {:save-to-today? true}))

(defmethod events/handle :mobile/redirect-to [[_ {:keys [k params query]}]]
  (rfe/push-state k params query))

(defmethod events/handle :mobile/set-tab [[_ tab]]
  (when tab
    (mobile-state/set-tab! tab)))
