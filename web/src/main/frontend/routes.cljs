(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.repo :as repo]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.file :as file]
            [frontend.components.page :as page]
            [frontend.components.diff :as diff]
            [frontend.components.draw :as draw]))

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

   ["/new-page"
    {:name :new-page
     :view page/new}]

   ["/page/:name"
    {:name :page
     :view page/page}]

   ["/all-pages"
    {:name :all-pages
     :view page/all-pages}]

   ["/graph"
    {:name :graph
     :view page/global-graph}]

   ["/diff"
    {:name :diff
     :view diff/diff}]

   ["/draw"
    {:name :draw
     :view draw/draw}]])
