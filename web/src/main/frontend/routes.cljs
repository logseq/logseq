(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.repo :as repo]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.file :as file]
            [frontend.components.page :as page]
            [frontend.components.diff :as diff]
            [frontend.components.draw :as draw]
            [frontend.components.agenda :as agenda]))

(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/repos"
    {:name :repos
     :view repo/repos}]

   ["/repo/add"
    {:name :repo-add
     :view repo/add-repo}]

   ["/all-files"
    {:name :all-files
     :view file/files}]

   ["/file/:path"
    {:name :file
     :view file/file}]

   ["/page/:name"
    {:name :page
     :view page/page}]

   ["/agenda"
    {:name :agenda
     :view agenda/agenda}]

   ["/all-pages"
    {:name :all-pages
     :view page/all-pages}]

   ["/diff"
    {:name :diff
     :view diff/diff}]

   ["/draw"
    {:name :draw
     :view draw/draw}]])
