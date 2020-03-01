(ns frontend.state
  (:require [frontend.storage :as storage]))

(def state (atom {:user nil
                  :tokens []
                  :repos {}
                  ;; nested in repos -> repo->url -> map
                  ;; {
                  ;;  :cloning? false
                  ;;  :cloned? (storage/get :cloned?)
                  ;;  :files []
                  ;;  :contents {}          ; file name -> string

                  ;;  :loadings {}            ; file name -> bool
                  ;;  }

                  :repo-url ""
                  :current-page :home
                  :current-repo nil
                  :current-file nil

                  :width nil
                  :drawer? false
                  :tasks {}
                  }))
