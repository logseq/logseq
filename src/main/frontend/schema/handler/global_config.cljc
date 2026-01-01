(ns frontend.schema.handler.global-config
  "Malli schemas for global-config"
  (:require [frontend.schema.handler.common-config :as common-config-schema]))

;; For now this just references a common schema but repo-config and
;; global-config could diverge
(def Config-edn
  "Schema for global config.edn"
  common-config-schema/Config-edn)
