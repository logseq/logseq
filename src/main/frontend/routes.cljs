(ns frontend.routes
  "Defines routes for use with reitit router"
  (:require [frontend.components.file :as file]
            [frontend.components.home :as home]
            [frontend.components.journal :as journal]
            [frontend.components.onboarding.setups :as setups]
            [frontend.components.page :as page]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.search :as search]
            [frontend.components.settings :as settings]
            [frontend.components.shortcut :as shortcut]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.extensions.zotero :as zotero]))

;; http://localhost:3000/#?anchor=fn.1
(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/graphs"
    {:name :repos
     :view repo/repos}]

   ["/whiteboard/:name"
    {:name :whiteboard
     :view whiteboard/whiteboard-route}]

   ["/whiteboards"
    {:name :whiteboards
     :view whiteboard/whiteboard-dashboard}]

   ["/repo/add"
    {:name :repo-add
     :view setups/picker}]

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

   ["/page/:name/block/:block-route-name"
    {:name :page-block
     :view page/page}]

   ["/all-pages"
    {:name :all-pages
     :view page/all-pages}]

   ["/graph"
    {:name :graph
     :view page/global-graph}]

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
     :view setups/importer}]

   ["/all-journals"
    {:name :all-journals
     :view journal/all-journals}]

   ["/plugins"
    {:name :plugins
     :view plugins/plugins-page}]])
