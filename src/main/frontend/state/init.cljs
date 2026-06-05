(ns frontend.state.init
  "Initial application state access.

  The full initial-state assembly still lives in `frontend.state` during the
  compatibility phase. This namespace gives future extraction work a stable
  target without changing initialization timing."
  (:require [frontend.state :as state]))

(defn initial-state
  []
  @state/state)
