(ns frontend.routes
  "Defines routes for use with reitit router"
  (:require [frontend.components.file :as file]
            [frontend.components.home :as home]
            [frontend.components.journal :as journal]
            [frontend.components.page :as page]
            [frontend.components.all-pages :as all-pages]
            ;; [frontend.components.all-pages2 :as all-pages]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.settings :as settings]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.extensions.zotero :as zotero]
            [frontend.components.bug-report :as bug-report]
            [frontend.components.user.login :as login]
            [logseq.shui.demo2 :as shui]
            [frontend.components.imports :as imports]
            [frontend.config :as config]
            [logseq.db :as ldb]
            [frontend.db :as db]))

;; http://localhost:3000/#?anchor=fn.1
(def routes
  [["/"
    {:name :home
     :view home/home}]

   ["/graphs"
    {:name :graphs
     :view repo/repos}]

   ["/whiteboards"
    {:name :whiteboards
     :view whiteboard/whiteboard-dashboard}]

   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (let [page-name (get-in route-match [:parameters :path :name])
                   whiteboard? (ldb/whiteboard? (db/get-page page-name))]
               (if whiteboard?
                 (whiteboard/whiteboard-route route-match)
                 (page/page route-match))))}]

   ["/page/:name/block/:block-route-name"
    {:name :page-block
     :view page/page}]

   ["/all-pages"
    {:name :all-pages
     :view all-pages/all-pages}]

   ["/graph"
    {:name :graph
     :view page/global-graph}]

   ["/settings"
    {:name :settings
     :view settings/settings}]

   ["/settings/zotero"
    {:name :zotero-setting
     :view zotero/settings}]

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
