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
            [logseq.graph-parser.config :as gp-config]))

(defn- page-exists-in-another-file
  "Conflict of files towards same page"
  [repo-url page file]
  (when-let [page-name (:block/name page)]
    (let [current-file (:file/path (db/get-page-file repo-url page-name))]
      (when (not= file current-file)
        current-file))))

(defn- get-delete-blocks [repo-url first-page file]
  (let [delete-blocks (->
                       (concat
                        (db/delete-file-blocks! repo-url file)
                        (when first-page (db/delete-page-blocks repo-url (:block/name first-page))))
                       (distinct))]
    (when-let [current-file (page-exists-in-another-file repo-url first-page file)]
      (when (not= file current-file)
        (let [error (str "Page already exists with another file: " current-file ", current file: " file)]
          (state/pub-event! [:notification/show
                             {:content error
                              :status :error
                              :clear? false}]))))
    delete-blocks))

(defn reset-file!
  "Main fn for updating a db with the results of a parsed file"
  ([repo-url file content]
   (reset-file! repo-url file content {}))
  ([repo-url file content {:keys [verbose] :as options}]
   (let [electron-local-repo? (and (util/electron?)
                                   (config/local-db? repo-url))
         file (cond
                (and electron-local-repo?
                     util/win32?
                     (utils/win32 file))
                file

                (and electron-local-repo? (or
                                           util/win32?
                                           (not= "/" (first file))))
                (str (config/get-repo-dir repo-url) "/" file)

                (and (mobile-util/native-android?) (not= "/" (first file)))
                file

                (and (mobile-util/native-ios?) (not= "/" (first file)))
                file

                :else
                file)
         file (gp-util/path-normalize file)
         new? (nil? (db/entity [:file/path file]))
         options (merge (dissoc options :verbose)
                        {:new? new?
                         :delete-blocks-fn (partial get-delete-blocks repo-url)
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file))
                                            :supported-formats (gp-config/supported-formats)
                                            :uri-encoded? (boolean (util/mobile?))
                                            :filename-format (state/get-filename-format repo-url)}
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (graph-parser/parse-file (db/get-db repo-url false) file content options)))))
