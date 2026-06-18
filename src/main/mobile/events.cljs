(ns mobile.events
  "Mobile events"
  (:require-macros [frontend.handler.events.macros :refer [defevent!]])
  (:require [frontend.handler.events]
            [frontend.state :as state]
            [mobile.components.recorder :as recorder]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [reitit.frontend.easy :as rfe]))

(defevent! :mobile/clear-edit [_]
  (state/clear-edit!)
  (init/keyboard-hide))

(defevent! :mobile/start-audio-record [[_ {:keys [target-block save-to-today?]
                                           :or {save-to-today? true}}]]
  (recorder/record! (cond-> {:save-to-today? save-to-today?}
                      target-block
                      (assoc :target-block target-block))))

(defevent! :mobile/redirect-to [[_ {:keys [k params query]}]]
  (rfe/push-state k params query))

(defevent! :mobile/set-tab [[_ tab]]
  (when tab
    (mobile-state/set-tab! tab)))
