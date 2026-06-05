(ns frontend.mobile.flows
  "Shared mobile state atoms.")

;; Can't require ["@capacitor/network" :refer [^js Network]] here
;; because the node js environment doesn't have `Window`
(defonce *network (atom nil))

(def *mobile-network-status (atom nil))
(def *mobile-app-state (atom nil))
