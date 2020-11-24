(ns frontend.log
  (:require [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [frontend.config :as config]))

(glogi-console/install!)

(if config/dev?
  (log/set-levels {:glogi/root :info})
  (log/set-levels {:glogi/root :warn}))
