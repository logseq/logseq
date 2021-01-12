(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.repo :as repo]
            [frontend.components.file :as file]
            [frontend.components.page :as page]
            [frontend.components.diff :as diff]
            [frontend.components.draw :as draw]
            [frontend.components.journal :as journal]
            [frontend.components.settings :as settings]
            [frontend.components.external :as external]
            [frontend.components.publishing :as publishing]))

(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/graphs"
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
     :view draw/draw}]

   ["/settings"
    {:name :settings
     :view settings/settings}]

   ["/import"
    {:name :import
     :view external/import-cp}]

   ["/all-journals"
    {:name :all-journals
     :view journal/all-journals}]

   ["/my-publishing"
    {:name :my-publishing
     :view publishing/my-publishing}]])
