(ns frontend.log
  "System-component-like ns that encapsulates logging functionality"
  (:require [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]))

;; TODO: Move code below into a fn to behave like a system component
;; instead of having no control over its behavior at require time
(glogi-console/install!)

(if config/dev?
  (log/set-levels {:glogi/root :info})
  (log/set-levels {:glogi/root :info}))
