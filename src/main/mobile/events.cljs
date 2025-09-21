(ns mobile.events
  "Mobile events"
  (:require [frontend.components.quick-add :as quick-add]
            [frontend.handler.events :as events]
            [mobile.components.recorder :as recorder]
            [mobile.state :as mobile-state]))

(defmethod events/handle :dialog/mobile-quick-add [_]
  (mobile-state/set-popup! {:open? true
                            :content-fn (fn []
                                          (quick-add/quick-add))
                            :opts {:id :ls-quick-add}}))

(defmethod events/handle :mobile/start-audio-record [_]
  (recorder/record! {:save-to-today? true}))
