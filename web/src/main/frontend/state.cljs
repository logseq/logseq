(ns frontend.state
  (:require [frontend.storage :as storage]))

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/text nil
             :root-component nil
             :git-status nil
             :git-error nil
             :edit? false
             :latest-journals []
             :repo/cloning? nil
             :repo/loading-files? nil
             :repo/importing-to-db? nil
             :me nil}))
