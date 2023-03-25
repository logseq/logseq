(ns logseq.publish-spa
  (:require [datascript.transit :as dt]
            [logseq.publish-spa.html :as html]
            [logseq.publish-spa.export :as export]
            [logseq.publish-spa.db :as db]
            ["path" :as path]))

(defn prep-for-export [db {:keys [app-state repo-config]}]
  (let [[db asset-filenames']
        (if (:publishing/all-pages-public? repo-config)
          (db/clean-export! db)
          (db/filter-only-public-pages-and-blocks db))
        asset-filenames (remove nil? asset-filenames')
        db-str (dt/write-transit-str db)
        state (assoc (select-keys app-state
                            [:ui/theme
                             :ui/sidebar-collapsed-blocks
                             :ui/show-recent?])
                     :config {"local" repo-config})
        raw-html-str (html/publishing-html db-str (pr-str state))]
    {:html raw-html-str
     :asset-filenames asset-filenames}))

(defn publish [db graph-dir output-path options]
  (let [{:keys [html asset-filenames]}
        (prep-for-export db options)
        custom-css-path (path/join graph-dir "logseq" "custom.css")
        export-css-path (path/join graph-dir "logseq" "export.css")
        app-path "../../static"]
    (export/handle-export-publish-assets html app-path custom-css-path export-css-path graph-dir asset-filenames output-path)))
