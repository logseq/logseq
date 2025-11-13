(ns mobile.events
  "Mobile events"
  (:require [frontend.components.quick-add :as quick-add]
            [frontend.handler.events :as events]
            [frontend.state :as state]
            [mobile.components.recorder :as recorder]
            [mobile.init :as init]
            [mobile.state :as mobile-state]))

(defmethod events/handle :mobile/clear-edit [_]
  (state/clear-edit!)
  (init/keyboard-hide))

(defmethod events/handle :dialog/mobile-quick-add [_]
  (mobile-state/set-popup! {:open? true
                            :content-fn (fn []
                                          (quick-add/quick-add))
                            :opts {:id :ls-quick-add}}))

(defmethod events/handle :mobile/start-audio-record [_]
  (recorder/record! {:save-to-today? true}))
