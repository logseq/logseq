(ns frontend.state)

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/text nil
             :root-component nil
             :git-status nil
             :git-error nil
             :edit? false
             :latest-journals []}))
