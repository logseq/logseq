(ns exporter.core
    (:require [frontend.db :as db]
              [frontend.db.conn :as db-conn]
              [frontend.state :as state]
              [frontend.publishing.html :as html]
              [frontend.handler.repo :as repo]
              [frontend.handler.common :as common-handler]
              ["/exporter/loader" :as loader]
              [exporter.writer :as writer]
              [logseq.graph-parser :as graph-parser]))

(defn load-to-db [repo-url files]
    (let [supported-files (graph-parser/filter-files files)
        new-graph? nil]
    (state/set-current-repo! repo-url)
    (state/set-parsing-state! {:total (count supported-files)})
    (doseq [file supported-files]
      (state/set-parsing-state! (fn [m]
                                  (assoc m :current-parsing-file (:file/path file))))
      (repo/parse-and-load-file! repo-url file new-graph?))
        
    (repo/load-pages-metadata! repo-url (map :file/path files) files true)
    (state/reset-parsing-state!)
    (state/set-loading-files! repo-url false)))

(defn load-files
    [repo]
    (let [files (js->clj (loader/readFiles repo) :keywordize-keys true)]
        (state/set-current-repo! repo)
        (db-conn/start! repo {})
        (load-to-db repo files)
        (common-handler/reset-config! repo nil)
        ))

(defn main [repo out-dir]
    (state/set-indexedb-support! false)
    (load-files repo)
    (state/set-theme-mode! "dark")
    (when-let [db (db/get-db repo)]
        (let [[db asset-filenames]           (if (state/all-pages-public?)
                                            (db/clean-export! db)
                                            (db/filter-only-public-pages-and-blocks db))
            db-str       (db/db->string db)
            state        (select-keys @state/state
                                        [:ui/theme
                                        :ui/sidebar-collapsed-blocks
                                        :ui/show-recent?
                                        :config])
            state        (update state :config (fn [config]
                                                {"local" (get config repo)}))
            raw-html-str (html/publishing-html db-str (pr-str state))]
                
        (writer/export-publish-assets
            raw-html-str
            repo
            (clj->js asset-filenames)
            out-dir
        ))))