(ns mobile.events
  "Mobile events"
  (:require [mobile.init :as init]
            [frontend.handler.events :as events]
            [promesa.core :as p]))

;; TODO: move more events here
(defmethod events/handle :mobile/post-init [_]
  (p/do!
   (p/delay 1000)
   (init/mobile-post-init)))
