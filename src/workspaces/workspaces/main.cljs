(ns workspaces.main
  (:require [nubank.workspaces.core :as ws]
            [workspaces.cards]))

(defonce init (ws/mount))
