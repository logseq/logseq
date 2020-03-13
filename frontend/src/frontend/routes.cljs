(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.auth :as auth]
            [frontend.components.repo :as repo]))

(def routes
  [["/"
    {:name :home
     :view home/home}]
   ["/auth/github"
    {:name :github-auth
     :view auth/auth}]

   ["/repo/add"
    {:name :repo-add
     :view repo/add-repo}]

   ;; TODO: edit file
   ;; Settings
   ;; ["/item/:id"
   ;;  {:name ::item
   ;;   :view item-page
   ;;   :parameters {:path {:id int?}
   ;;                :query {(ds/opt :foo) keyword?}}}]
   ])
