(ns mobile.events
  "Mobile events"
  (:require [frontend.components.quick-add :as quick-add]
            [frontend.handler.events :as events]
            [mobile.components.ui :as mobile-ui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

;; TODO: move more events here
(defmethod events/handle :mobile/post-init [_]
  (p/do!
   (p/delay 1000)
   (init/mobile-post-init)))

(defmethod events/handle :dialog/mobile-quick-add [_]
  (mobile-state/set-popup! {:open? true
                            :content-fn (fn []
                                          (mobile-ui/classic-app-container-wrap
                                           (quick-add/quick-add)))
                            :opts {:id :ls-quick-add}}))
