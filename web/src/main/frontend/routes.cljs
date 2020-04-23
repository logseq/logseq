(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.repo :as repo]
            [frontend.components.file :as file]
            [frontend.components.page :as page]
            [frontend.components.agenda :as agenda]
            [clojure.string :as string]))

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

   ["/page/:name"
    {:name :page
     :view page/page}]

   ["/agenda"
    {:name :agenda
     :view agenda/agenda}]

   ;; Settings
   ;; ["/item/:id"
   ;;  {:name ::item
   ;;   :view item-page
   ;;   :parameters {:path {:id int?}
   ;;                :query {(ds/opt :foo) keyword?}}}]
   ])
