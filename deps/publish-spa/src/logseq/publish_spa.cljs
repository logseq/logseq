(ns logseq.publish-spa
  (:require [datascript.transit :as dt]
            [logseq.publish-spa.html :as html]
            [logseq.publish-spa.export :as export]
            [logseq.publish-spa.db :as db]))

(defn prep-for-export [db {:keys [app-state repo-config html-options]}]
  (let [[db asset-filenames']
        (if (:publishing/all-pages-public? repo-config)
          (db/clean-export! db)
          (db/filter-only-public-pages-and-blocks db))
        asset-filenames (remove nil? asset-filenames')
        db-str (dt/write-transit-str db)
        state (assoc (select-keys app-state
                            [:ui/theme
                             :ui/sidebar-collapsed-blocks])
                     :config {"local" repo-config})
        raw-html-str (html/publishing-html db-str state html-options)]
    {:html raw-html-str
     :asset-filenames asset-filenames}))

(defn publish [db static-dir graph-dir output-path options]
  (let [{:keys [html asset-filenames]} (prep-for-export db options)]
    (export/export html static-dir graph-dir output-path {:asset-filenames asset-filenames})))
