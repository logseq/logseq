(ns frontend.handler.common.file
  "Common file related fns for handlers"
  (:require [frontend.util :as util]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]
            ["/frontend/utils" :as utils]
            [frontend.mobile.util :as mobile-util]
            [logseq.db.schema :as db-schema]
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

(defn- retract-blocks-tx
  [blocks retain-uuids]
  (let [tx-for-block (fn [block] (let [{uuid :block/uuid eid :db/id} block
                                       should-retain? (and uuid (contains? retain-uuids uuid))]
                                   (cond
                                     should-retain?
                                     (map (fn [attr] [:db.fn/retractAttribute eid attr]) db-schema/retract-attributes)
                                     :else
                                     [[:db.fn/retractEntity eid]])))]
    (mapcat tx-for-block (distinct blocks)))
  )

(defn- retract-file-blocks-tx
  "Returns the transactional operations to retract blocks belonging to the
  given page name and file path. This function is required when a file is being
  parsed from disk; before saving the parsed, blocks from the previous version
  of that file need to be retracted.
  
  The 'Page' parsed from the new file version is passed separately from the
  file-path, as the page name can be set via properties in the file, and thus
  can change between versions. If it has changed, existing blocks for both the
  old and new page name will be retracted.

  Blocks are by default fully cleared via retractEntity. However, a collection
  of block UUIDs to retain can be passed, and any blocks with matching uuids
  will instead have their attributes cleared individually via
  'retractAttribute'. This will preserve block references to the retained
  UUIDs."
  [repo-url file-page file-path retain-uuid-blocks]
  (let [existing-file-page (db/get-file-page file-path)
        pages-to-clear (distinct (filter some? [existing-file-page (:block/name file-page)]))
        blocks (mapcat (fn [page] (db/get-page-blocks-no-cache repo-url page {:pull-keys [:db/id :block/uuid]})) pages-to-clear)
        retain-uuids (if (seq retain-uuid-blocks) (set (filter some? (map :block/uuid retain-uuid-blocks))) [])
        tx (retract-blocks-tx blocks retain-uuids)]
    (when-let [current-file (page-exists-in-another-file repo-url file-page file-path)]
      (when (not= file-path current-file)
        (let [error (str "Page already exists with another file: " current-file ", current file: " file-path)]
          (state/pub-event! [:notification/show
                             {:content error
                              :status :error
                              :clear? false}]))))
    tx
    ))

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
                         :delete-blocks-fn (partial retract-file-blocks-tx repo-url)
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file))
                                            :supported-formats (gp-config/supported-formats)
                                            :uri-encoded? (boolean (mobile-util/native-platform?))
                                            :filename-format (state/get-filename-format repo-url)}
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (graph-parser/parse-file (db/get-db repo-url false) file content options)))))
