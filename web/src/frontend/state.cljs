(ns frontend.state)

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :tasks {}
             :notification/show? false
             :notification/text nil
             }))
