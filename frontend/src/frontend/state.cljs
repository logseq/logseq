(ns frontend.state)

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :github-token nil
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
             :current-repo nil
             :current-file nil

             :width nil
             :drawer? false
             :tasks {}

             }))
