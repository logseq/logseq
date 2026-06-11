(ns frontend.state.core
  "Core application state facade.

  This namespace is the migration entry point for code that needs generic state
  reads, writes, RFX subscription registration, or event publication."
  (:require [frontend.state :as state]))

(def state state/state)

(def get-state state/get-state)
(def set-state! state/set-state!)
(def update-state! state/update-state!)
(def replace-state! state/replace-state!)
