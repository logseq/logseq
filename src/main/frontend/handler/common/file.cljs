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

(defn- get-clear-blocks-tx
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

(defn- get-clear-block-tx
  "Returns the transactional operations to clear blocks belonging to the given
  page and file.

  Blocks are by default fully deleted via retractEntity. However, a collection
  of block UUIDs to retain can be passed, and any blocks with matching uuids
  will instead have their attributes cleared individually via
  'retractAttribute'. This will preserve block references to the retained
  UUIDs."
  [repo-url first-page file retain-uuid-blocks]
  (let [pages-to-clear (filter some? [(db/get-file-page file) file])
        blocks (mapcat (fn [page] (db/get-page-blocks-no-cache repo-url page {:pull-keys [:db/id :block/uuid]})) pages-to-clear)
        retain-uuids (if (seq retain-uuid-blocks) (set (filter some? (map :block/uuid retain-uuid-blocks))) [])
        tx (get-clear-blocks-tx blocks retain-uuids)]
    (when-let [current-file (page-exists-in-another-file repo-url first-page file)]
      (when (not= file current-file)
        (let [error (str "Page already exists with another file: " current-file ", current file: " file)]
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
                         :delete-blocks-fn (partial get-clear-block-tx repo-url)
                         :extract-options (merge
                                           {:user-config (state/get-config)
                                            :date-formatter (state/get-date-formatter)
                                            :block-pattern (config/get-block-pattern (gp-util/get-format file))
                                            :supported-formats (gp-config/supported-formats)
                                            :uri-encoded? (boolean (mobile-util/native-platform?))
                                            :filename-format (state/get-filename-format repo-url)}
                                           (when (some? verbose) {:verbose verbose}))})]
     (:tx (graph-parser/parse-file (db/get-db repo-url false) file content options)))))
