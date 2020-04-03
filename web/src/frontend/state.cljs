(ns frontend.state)

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/text nil
             :tasks-transactions nil}))
