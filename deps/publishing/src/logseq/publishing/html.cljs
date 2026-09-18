(ns logseq.publishing.html
  "This frontend only ns builds the publishing html including doing all the
necessary db filtering"
  (:require [datascript.core :as d]
            [datascript.transit :as dt]
            [logseq.publishing.db :as db]
            [logseq.publishing.page :as publish-page]))

(defn build-html
  "Given the graph's db, filters the db using the given options and returns the
generated index.html string and assets used by the html"
  [db* {:keys [repo app-state repo-config html-options dev?]}]
  (let [all-pages-public? (if-let [value (:publishing/all-pages-public? repo-config)]
                            value
                            (:all-pages-public? repo-config))
        [db asset-filenames'] (if all-pages-public?
                                (db/clean-export! db*)
                                (db/filter-only-public-pages-and-blocks db*))
        _ (when dev?
            (println "Exporting" (count (d/datoms db :eavt)) "of" (count (d/datoms db* :eavt)) "datoms and"
                     (count asset-filenames') "asset(s)..."))
        asset-filenames (remove nil? asset-filenames')

        db-str (dt/write-transit-str db)
        ;; The repo-name is used by the client and thus determines whether
        ;; it's a db graph or not
        state (assoc app-state
                     :config {repo repo-config})
        raw-html-str (publish-page/index-html db-str state html-options)]
    {:html raw-html-str
     :asset-filenames asset-filenames}))
