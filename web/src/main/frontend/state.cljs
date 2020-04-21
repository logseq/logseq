(ns frontend.state
  (:require [frontend.storage :as storage]))

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/content nil
             :root-component nil
             :edit? false
             :latest-journals []
             :repo/cloning? nil
             :repo/loading-files? nil
             :repo/importing-to-db? nil
             :me nil
             :git/latest-commit (storage/get :git/latest-commit)
             :git/status (storage/get :git/status)
             :git/error (storage/get :git/error)
             ;; format => boolean
             :format/loading {}
             :search/result nil
             :edit-journal nil
             :edit-file nil}))

;; TODO: add to global state
(def edit-node (atom nil))
(def edit-id (atom nil))
(def edit-content (atom ""))
(def cursor-range (atom nil))
(def cursor-pos (atom nil))

;; TODO: Add more states
(def toggle-state (atom false))
(def collapsed-headings (atom #{}))

(def q (atom nil))
