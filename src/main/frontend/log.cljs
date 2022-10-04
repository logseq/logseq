(ns frontend.log
  "System-component-like ns that encapsulates logging functionality"
  (:require [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [frontend.config :as config]))

;; TODO: Move code below into a fn to behave like a system component
;; instead of having no control over its behavior at require time
(glogi-console/install!)

(if config/dev?
  (log/set-levels {:glogi/root :info})
  (log/set-levels {:glogi/root :warn}))
