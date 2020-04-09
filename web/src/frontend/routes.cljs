(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.repo :as repo]
            [frontend.components.file :as file]
            [frontend.components.agenda :as agenda]
            ))

(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/repo/add"
    {:name :repo-add
     :view repo/add-repo}]

   ["/file/:path"
    {:name :file
     :view file/file}]

   ["/file/:path/edit"
    {:name :file-edit
     :view file/edit}]

   ["/agenda"
    {:name :agenda
     :view agenda/agenda}]

   ;; TODO: edit file
   ;; Settings
   ;; ["/item/:id"
   ;;  {:name ::item
   ;;   :view item-page
   ;;   :parameters {:path {:id int?}
   ;;                :query {(ds/opt :foo) keyword?}}}]
   ])
