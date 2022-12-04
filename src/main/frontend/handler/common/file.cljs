(ns frontend.handler.common.file
  "Common file related fns for handlers"
  (:require [frontend.util :as util]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]
            ["/frontend/utils" :as utils]
            [frontend.mobile.util :as mobile-util]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]
            [frontend.fs.capacitor-fs :as capacitor-fs]))

(defn- page-exists-in-another-file
  "Conflict of files towards same page"
  [repo-url page file]
  (when-let [page-name (:block/name page)]
    (let [current-file (:file/path (db/get-page-file repo-url page-name))]
      (when (not= file current-file)
        current-file))))

(defn- validate-existing-file
  [repo-url file-page file-path]
  (when-let [current-file (page-exists-in-another-file repo-url file-page file-path)]
    (when (not= file-path current-file)
      (let [error (str "Page already exists with another file: " current-file ", current file: " file-path ". Please keep only one of them and re-index your graph.")]
        (state/pub-event! [:notification/show
                           {:content error
                            :status :error
                            :clear? false}])))))

(defn- validate-and-get-blocks-to-delete
  [repo-url db file-page file-path retain-uuid-blocks]
  (validate-existing-file repo-url file-page file-path)
  (graph-parser/get-blocks-to-delete db file-page file-path retain-uuid-blocks))

(defn reset-file!
  "Main fn for updating a db with the results of a parsed file"
  ([repo-url file content]
   (reset-file! repo-url file content {}))
  ([repo-url file content {:keys [verbose] :as options}]
   (let [electron-local-repo? (and (util/electron?)
                                   (config/local-db? repo-url))
         repo-dir (config/get-repo-dir repo-url)
         file (cond
                (and electron-local-repo?
                     util/win32?
                     (utils/win32 file))
                file

                (and electron-local-repo? (or
                                           util/win32?
                                           (not= "/" (first file))))
                (str repo-dir "/" file)

                (mobile-util/native-platform?)
                (capacitor-fs/normalize-file-protocol-path repo-dir file)

                :else
                file)
         file (gp-util/path-normalize file)
         new? (nil? (db/entity [:file/path file]))
         options (merge (dissoc options :verbose)
                        {:new? new?
                         :delete-blocks-fn (partial validate-and-get-blocks-to-delete repo-url)
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file))
                                            :supported-formats (gp-config/supported-formats)
                                            :uri-encoded? (boolean (mobile-util/native-platform?))
                                            :filename-format (state/get-filename-format repo-url)}
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (graph-parser/parse-file (db/get-db repo-url false) file content options)))))
