(ns frontend.routes
  "Defines routes for use with reitit router"
  (:require [frontend.components.all-pages :as all-pages]
            [frontend.components.bug-report :as bug-report]
            [frontend.components.file :as file]
            [frontend.components.home :as home]
            [frontend.components.imports :as imports]
            [frontend.components.journal :as journal]
            [frontend.components.page :as page]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.settings :as settings]
            [frontend.components.user.login :as login]
            [frontend.config :as config]
            [logseq.shui.demo :as shui]))

;; http://localhost:3000/#?anchor=fn.1
(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/graphs"
    {:name :graphs
     :view repo/repos-cp}]

   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (page/page-cp (assoc route-match :current-page? true)))}]

   ["/page/:name/block/:block-route-name"
    {:name :page-block
     :view page/page-cp}]

   ["/all-pages"
    {:name :all-pages
     :view all-pages/all-pages}]

   ["/graph"
    {:name :graph
     :view page/global-graph}]

   ["/settings"
    {:name :settings
     :view settings/settings}]

   ["/import"
    {:name :import
     :view imports/importer}]

   ["/bug-report"
    {:name :bug-report
     :view bug-report/bug-report}]

   ["/bug-report-tool/:tool"
    {:name :bug-report-tools
     :view bug-report/bug-report-tool-route}]

   ["/all-journals"
    {:name :all-journals
     :view journal/all-journals}]

   ["/plugins"
    {:name :plugins
     :view plugins/plugins-page}]

   ["/login"
    {:name :user-login
     :view login/page}]

   ["/all-files"
    {:name :all-files
     :view file/files}]

   ["/file/:path"
    {:name :file
     :view file/file}]

   (when config/dev?
     ["/ui"
      {:name :ui
       :view shui/page}])])
