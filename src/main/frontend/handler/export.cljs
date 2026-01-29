(ns ^:no-doc frontend.handler.export
  (:require ["/frontend/utils" :as utils]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.extensions.zip :as zip]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.export.common :as export-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.idb :as idb]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.publishing.html :as publish-html]
            [promesa.core :as p]))

(defn download-repo-as-html!
  "download public pages as html"
  [repo]
  (when-let [db (db/get-db repo)]
    (let [{:keys [asset-filenames html]}
          (publish-html/build-html db
                                   {:repo repo
                                    :app-state (select-keys @state/state
                                                            [:ui/theme
                                                             :ui/sidebar-collapsed-blocks])
                                    :repo-config (get-in @state/state [:config repo])})
          html-str     (str "data:text/html;charset=UTF-8,"
                            (js/encodeURIComponent html))]
      (if (util/electron?)
        (js/window.apis.exportPublishAssets
         html
         (config/get-repo-dir repo)
         (clj->js asset-filenames)
         (util/mocked-open-dir-path))

        (when-let [anchor (gdom/getElement "download-as-html")]
          (.setAttribute anchor "href" html-str)
          (.setAttribute anchor "download" "index.html")
          (.click anchor))))))

(defn db-based-export-repo-as-zip!
  [repo]
  (p/let [db-data (persist-db/<export-db repo {:return-data? true})
          filename "db.sqlite"
          repo-name (common-sqlite/sanitize-db-name repo)
          assets (assets-handler/<get-all-assets)
          files (cons [filename db-data] assets)
          zipfile (zip/make-zip repo-name files repo)]
    (when-let [anchor (gdom/getElement "download-as-zip")]
      (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
      (.setAttribute anchor "download" (.-name zipfile))
      (.click anchor))))

(defn export-repo-as-zip!
  [repo]
  (db-based-export-repo-as-zip! repo))

(defn- file-name [repo extension]
  (-> repo
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn export-repo-as-debug-transit!
  [repo]
  (p/let [result (export-common-handler/<get-debug-datoms repo)
          filename (file-name (str repo "-debug-datoms") :transit)
          data-str (str "data:text/transit;charset=utf-8,"
                        (js/encodeURIComponent (ldb/write-transit-str result)))]
    (when-let [anchor (gdom/getElement "download-as-transit-debug")]
      (.setAttribute anchor "href" data-str)
      (.setAttribute anchor "download" filename)
      (.click anchor))))

(defn export-repo-as-sqlite-db!
  [repo]
  (->
   (p/let [data (persist-db/<export-db repo {:return-data? true})
           filename (file-name repo "sqlite")
           url (js/URL.createObjectURL (js/Blob. #js [data]))]
     (when-let [anchor (gdom/getElement "download-as-sqlite-db")]
       (.setAttribute anchor "href" url)
       (.setAttribute anchor "download" filename)
       (.click anchor)))
   (p/catch (fn [error]
              (js/console.error error)))))

;;;;;;;;;;;;;;;;;;;;;;;;;
;; Export to roam json ;;
;;;;;;;;;;;;;;;;;;;;;;;;;

;; https://roamresearch.com/#/app/help/page/Nxz8u0vXU
;; export to roam json according to above spec
(comment
  (defn- <roam-data [repo]
    (p/let [pages (export-common-handler/<get-all-pages repo)]
      (let [non-empty-pages (remove #(empty? (:block/children %)) pages)]
        (roam-export/traverse
         [:page/title
          :block/string
          :block/uid
          :block/children]
         non-empty-pages))))

  (defn export-repo-as-roam-json!
    [repo]
    (p/let [data (<roam-data repo)
            json-str (-> data
                         bean/->js
                         js/JSON.stringify)
            data-str (str "data:text/json;charset=utf-8,"
                          (js/encodeURIComponent json-str))]
      (when-let [anchor (gdom/getElement "download-as-roam-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (file-name (str repo "_roam") :json))
        (.click anchor)))))

(defn- truncate-old-versioned-files!
  "reserve the latest 12 version files"
  [^js backups-handle]
  (p/let [files (utils/getFiles backups-handle true)
          old-versioned-files (drop 12 (reverse (sort-by (fn [^js file] (.-name file)) files)))]
    (p/map (fn [^js files]
             (doseq [^js file files]
               (.remove (.-handle file))))
           old-versioned-files)))

(defn choose-backup-folder
  [repo]
  (p/let [result (utils/openDirectory #js {:mode "readwrite"})
          handle (first result)
          folder-name (.-name handle)]
    (js/console.dir handle)
    (idb/set-item!
     (str "handle/" (js/btoa repo) "/" folder-name) handle)
    (db/transact! [(ldb/kv :logseq.kv/graph-backup-folder folder-name)])
    [folder-name handle]))

(defn- web-backup-db-graph
  [repo]
  (when (and repo (= repo (state/get-current-repo)))
    (when-let [backup-folder (ldb/get-key-value (db/get-db repo) :logseq.kv/graph-backup-folder)]
      ;; ensure file handle exists
      ;; ask user to choose a folder again when access expires
      (p/let [handle (try
                       (idb/get-item (str "handle/" (js/btoa repo) "/" backup-folder))
                       (catch :default _e
                         (throw (ex-info "Backup file handle no longer exists" {:repo repo}))))
              [_folder handle] (when handle
                                 (try
                                   (utils/verifyPermission handle true)
                                   [backup-folder handle]
                                   (catch :default e
                                     (js/console.error e)
                                     (choose-backup-folder repo))))
              repo-name (common-sqlite/sanitize-db-name repo)]
        (if handle
          (->
           (p/let [graph-dir-handle (.getDirectoryHandle handle repo-name #js {:create true})
                   backups-handle (.getDirectoryHandle graph-dir-handle "backups" #js {:create true})
                   backup-handle ^js (.getFileHandle graph-dir-handle "db.sqlite" #js {:create true})
                   file ^js (.getFile backup-handle)
                   file-content (.text file)
                   data (persist-db/<export-db repo {:return-data? true})
                   decoded-content (.decode (js/TextDecoder.) data)]
             (if (= file-content decoded-content)
               (do
                 (println "Graph has not been updated since last export.")
                 :graph-not-changed)
               (p/do!
                (when (> (.-size file) 0)
                  (.move backup-handle backups-handle (str (util/time-ms) ".db.sqlite")))
                (truncate-old-versioned-files! backups-handle)
                (p/let [new-backup-handle ^js (.getFileHandle graph-dir-handle "db.sqlite" #js {:create true})]
                  (utils/writeFile new-backup-handle data))
                (println "Successfully created a backup for" repo-name "at" (str (js/Date.)) ".")
                true)))
           (p/catch (fn [error]
                      (js/console.error error))))
          (p/do!
            ;; handle cleared
           (notification/show! "DB backup failed, please go to Export and specify a backup folder." :error)
           false))))))

(defn backup-db-graph
  [repo]
  (when-not (util/capacitor?)
    (web-backup-db-graph repo)))

(defonce *backup-interval (atom nil))
(defn cancel-db-backup!
  []
  (when-let [i @*backup-interval]
    (js/clearInterval i)))

(defn auto-db-backup!
  [repo]
  (when (and
         util/web-platform?
         (not (util/capacitor?))
         (ldb/get-key-value (db/get-db repo) :logseq.kv/graph-backup-folder))
    (cancel-db-backup!)

    ;; run backup every hour
    (let [interval (js/setInterval #(backup-db-graph repo)
                                   (* 1 60 60 1000))]
      (reset! *backup-interval interval))))
