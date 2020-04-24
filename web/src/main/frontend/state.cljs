(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]))

;; TODO: move git/latest-commit, git/status, git/error to corresponding datascript
;; dbs.
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
             :journals-length 1

             ;; :search/q nil
             :ui/toggle-state false
             :ui/collapsed-headings #{}
             ;; :edit-content ""
             :cursor-range nil
             :cursor-pos nil}))

(defn sub
  [ks]
  (if (coll? ks)
    (rum/react (rum/cursor-in state ks))
    (rum/react (rum/cursor state ks))))

(defn set-state!
  [path value]
  (if (vector? path)
    (swap! state assoc-in path value)
    (swap! state assoc path value)))

(defn update-state!
  [path f]
  (if (vector? path)
    (swap! state update-in path f)
    (swap! state update path f)))

(defn get-current-repo
  []
  (:git/current-repo @state))

(defn get-repos
  []
  (get-in @state [:me :repos]))

(defn delete-repo!
  [repo]
  (swap! state update-in [:me :repos]
         (fn [repos]
           (remove #(= (:url repo)
                       (:url %))
                   repos)))
  (when (= (get-current-repo) (:url repo))
    (set-state! :git/current-repo
                (first (get-repos)))))

(defn set-current-repo!
  [repo]
  (swap! state assoc :git/current-repo repo)
  (storage/set :git/current-repo repo))

(defn ui-toggle-state!
  []
  (update-state! :ui/toggle-state not))

(defn add-collapsed-heading!
  [heading]
  (update-state! :ui/collapsed-headings (fn [headings]
                                          (conj headings heading))))

(defn remove-collapsed-heading!
  [heading]
  (update-state! :ui/collapsed-headings (fn [headings]
                                          (disj headings heading))))

(defn clear-collapsed-headings!
  []
  (set-state! :ui/collapsed-headings #{}))

(defonce edit-content (atom ""))
(defn get-edit-content
  []
  @edit-content)
(defn set-edit-content!
  [value]
  (reset! edit-content value))

;; TODO: not working well, input cursor jumps to the end when typing the first character.
;; (defn get-edit-content
;;   []
;;   (:edit-content @state))
;; (defn set-edit-content!
;;   [value]
;;   (set-state! :edit-content value))

(defn clear-edit-content!
  []
  (set-edit-content! ""))

(defn get-cursor-range
  []
  (:cursor-range @state))

(defn set-cursor-range!
  [range]
  (set-state! :cursor-range range))

(defn set-cursor-pos!
  [value]
  (set-state! :cursor-pos value))
