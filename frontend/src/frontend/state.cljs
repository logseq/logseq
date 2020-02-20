(ns frontend.state
  (:require [frontend.storage :as storage]))

(def state (atom {:current-page :home
                  :cloning? false
                  :cloned? (storage/get :cloned?)
                  :files []
                  :contents {}          ; file name -> string
                  :current-file nil
                  :loadings {}            ; file name -> bool
                  :github-username ""
                  :github-token ""
                  :github-repo ""
                  :width nil
                  :drawer? false
                  :tasks {}
                  :links []
                  :add-link-dialog? false
                  }))
