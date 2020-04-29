(ns frontend.state
  (:require [frontend.storage :as storage]
            [rum.core :as rum]
            [frontend.util :as util]
            [clojure.string :as string]))

;; TODO: move git/latest-commit, git/status, git/error to corresponding datascript
;; dbs.
(def state (atom
            {:route-match nil
             :notification/show? false
             :notification/content nil
             :root-component nil
             :edit? false
             :edit-input-id nil
             :repo/cloning? false
             :repo/loading-files? nil
             :repo/importing-to-db? nil
             :me nil
             :git/current-repo (storage/get :git/current-repo)
             :format/loading {}
             :search/result nil
             :edit-journal nil
             :edit-file nil
             :journals-length 1

             :search/q nil
             :ui/toggle-state false
             :ui/collapsed-headings {}
             :edit-content ""
             :cursor-range nil
             :cursor-pos nil

             ;; [owner repo-name commit path] -> content
             :github/contents {}
             :config {}
             }))

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

(defn set-current-repo!
  [repo]
  (swap! state assoc :git/current-repo repo)
  (storage/set :git/current-repo repo))

(defn delete-repo!
  [repo]
  (swap! state update-in [:me :repos]
         (fn [repos]
           (->> (remove #(= (:url repo)
                            (:url %))
                        repos)
                (util/distinct-by :url))))
  (when (= (get-current-repo) (:url repo))
    (set-current-repo! (:url (first (get-repos))))))

(defn ui-toggle-state!
  []
  (update-state! :ui/toggle-state not))

(defn get-edit-content
  []
  (:edit-content @state))
(defn set-edit-content!
  [value]
  (set-state! :edit-content value))

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

(defn cloning?
  []
  (:repo/cloning? @state))

(defn set-cloning?
  [value]
  (set-state! :repo/cloning? value))

(defn collapse-heading!
  [heading-id]
  (set-state! [:ui/collapsed-headings heading-id] true))

(defn expand-heading!
  [heading-id]
  (set-state! [:ui/collapsed-headings heading-id] false))

(defn clear-collapsed-headings!
  []
  (set-state! :ui/collapsed-headings {}))

(defn set-q!
  [value]
  (set-state! :search/q value))

(defn set-config!
  [repo-url value]
  (set-state! [:config repo-url] value))

(defn star-page!
  [repo-url page starred?]
  (update-state! [:config repo-url :starred]
                 (fn [pages]
                   (if starred?
                     (vec
                      (remove
                       #(= (string/lower-case page) (string/lower-case %))
                       pages))
                     (vec (distinct (conj pages page)))))))
