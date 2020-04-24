(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]))

;; TODO: replace this with datascript
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/content nil
             :root-component nil
             :edit? false
             :edit-input-id nil
             :repo/cloning? nil
             :repo/loading-files? nil
             :repo/importing-to-db? nil
             :me nil
             :git/latest-commit (storage/get :git/latest-commit)
             :git/status (storage/get :git/status)
             :git/error (storage/get :git/error)
             :git/current-repo (storage/get :git/current-repo)
             ;; format => boolean
             :format/loading {}
             :search/result nil
             :edit-journal nil
             :edit-file nil
             :journals-length 1}))

;; TODO: add to global state
(def edit-content (atom ""))
(def cursor-range (atom nil))
(def cursor-pos (atom nil))

;; TODO: Add more states
(def toggle-state (atom false))
(def collapsed-headings (atom #{}))

(def q (atom nil))

(defn get-current-repo
  []
  (:git/current-repo @state))

(defn set-current-repo!
  [repo]
  (swap! state assoc :git/current-repo repo)
  (storage/set :git/current-repo repo))

(defn sub
  [ks]
  (if (coll? ks)
    (rum/react (rum/cursor-in state ks))
    (rum/react (rum/cursor state ks))))
