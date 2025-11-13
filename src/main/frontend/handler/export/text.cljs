(ns frontend.handler.export.text
  "export blocks/pages as text"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.extensions.zip :as zip]
            [frontend.handler.export.common :as common]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.common.path :as path]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;;; export fns

(defn export-blocks-as-markdown
  "options:
  :indent-style \"dashes\" | \"spaces\" | \"no-indent\"
  :remove-options [:emphasis :page-ref :tag :property]
  :other-options {:keep-only-level<=N int :newline-after-block bool}"
  [repo root-block-uuids-or-page-uuid options]
  {:pre [(or (coll? root-block-uuids-or-page-uuid)
             (uuid? root-block-uuids-or-page-uuid))]}
  (util/profile
   :export-blocks-as-markdown
   (try
     (let [content
           (cond
             ;; page
             (and (= 1 (count root-block-uuids-or-page-uuid))
                  (ldb/page? (db/entity [:block/uuid (first root-block-uuids-or-page-uuid)])))
             (common/get-page-content (first root-block-uuids-or-page-uuid))
             (and (coll? root-block-uuids-or-page-uuid) (every? #(ldb/page? (db/entity [:block/uuid %])) root-block-uuids-or-page-uuid))
             (->> (mapv (fn [id] (:block/title (db/entity [:block/uuid id]))) root-block-uuids-or-page-uuid)
                  (string/join "\n"))
             :else
             (common/root-block-uuids->content repo root-block-uuids-or-page-uuid))
           first-block (and (coll? root-block-uuids-or-page-uuid)
                            (db/entity [:block/uuid (first root-block-uuids-or-page-uuid)]))
           format (get first-block :block/format :markdown)]
       (binding [cli-export-common/*current-db* (conn/get-db repo)
                 cli-export-common/*current-repo* repo
                 cli-export-common/*content-config* (common/get-content-config)]
         (cli-export-text/export-helper repo content format options)))
     (catch :default e
       (js/console.error e)))))

(defn export-files-as-markdown
  "options see also `export-blocks-as-markdown`"
  [files options]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)
        content-config (common/get-content-config)]
    (mapv
     (fn [{:keys [path title content]}]
       (util/profile (print-str :export-files-as-markdown title)
                     [(or path title)
                      (binding [cli-export-common/*current-db* db
                                cli-export-common/*current-repo* repo
                                cli-export-common/*content-config* content-config]
                        (cli-export-text/export-helper repo content :markdown options))]))
     files)))

(defn export-repo-as-markdown!
  "TODO: indent-style and remove-options"
  [repo]
  (p/let [files* (util/profile :get-file-content (common/<get-file-contents repo "md"))]
    (when (seq files*)
      (let [files (export-files-as-markdown files* nil)
            repo' (if (config/db-based-graph? repo)
                    (string/replace repo config/db-version-prefix "")
                    (path/basename repo))
            zip-file-name (str repo' "_markdown_" (quot (util/time-ms) 1000))]
        (p/let [zipfile (zip/make-zip zip-file-name files repo')]
          (when-let [anchor (gdom/getElement "export-as-markdown")]
            (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
            (.setAttribute anchor "download" (.-name zipfile))
            (.click anchor)))))))

;;; export fns (ends)
