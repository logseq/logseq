(ns capacitor.events
  (:require [capacitor.init :as init]
            [frontend.handler.events :as events]
            [promesa.core :as p]))

(defmethod events/handle :mobile/post-init [_]
  (p/do!
   (p/delay 1000)
   (init/mobile-post-init)))
