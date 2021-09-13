(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.repo :as repo]
            [frontend.components.file :as file]
            [frontend.components.page :as page]
            [frontend.components.diff :as diff]
            [frontend.components.plugins :as plugins]
            [frontend.components.journal :as journal]
            [frontend.components.search :as search]
            [frontend.components.settings :as settings]
            [frontend.components.external :as external]
            [frontend.components.shortcut :as shortcut]
            [frontend.extensions.zotero :as zotero]))

;; http://localhost:3000/#?anchor=fn.1
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

   ["/search/:q"
    {:name :search
     :view search/more}]

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

   ["/settings"
    {:name :settings
     :view settings/settings}]

   ["/settings/shortcut"
    {:name :shortcut-setting
     :view shortcut/shortcut}]

   ["/settings/zotero"
    {:name :zotero-setting
     :view zotero/settings}]

   ["/import"
    {:name :import
     :view external/import-cp}]

   ["/all-journals"
    {:name :all-journals
     :view journal/all-journals}]

   ["/plugins"
    {:name :plugins
     :view plugins/plugins-page}]])
