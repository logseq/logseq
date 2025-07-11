(ns ^:no-doc frontend.handler.export
  (:require
   ["/frontend/utils" :as utils]
   ["@capacitor/filesystem" :refer [Encoding Filesystem]]
   [cljs-bean.core :as bean]
   [cljs.pprint :as pprint]
   [clojure.set :as s]
   [clojure.string :as string]
   [clojure.walk :as walk]
   [frontend.config :as config]
   [frontend.db :as db]
   [frontend.extensions.zip :as zip]
   [frontend.external.roam-export :as roam-export]
   [frontend.handler.assets :as assets-handler]
   [frontend.handler.export.common :as export-common-handler]
   [frontend.handler.notification :as notification]
   [frontend.idb :as idb]
   [frontend.mobile.util :as mobile-util]
   [frontend.persist-db :as persist-db]
   [frontend.state :as state]
   [frontend.util :as util]
   [goog.dom :as gdom]
   [lambdaisland.glogi :as log]
   [logseq.db :as ldb]
   [logseq.db.common.sqlite :as common-sqlite]
   [logseq.publishing.html :as publish-html]
   [promesa.core :as p])
  (:import
   [goog.string StringBuffer]))

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
                                    :repo-config (get-in @state/state [:config repo])
                                    :db-graph? (config/db-based-graph? repo)})
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

(defn file-based-export-repo-as-zip!
  [repo]
  (p/let [files (export-common-handler/<get-file-contents repo "md")
          [owner repo-name] (util/get-git-owner-and-repo repo)
          repo-name (str owner "-" repo-name)
          files (map (fn [{:keys [path content]}] [path content]) files)]
    (when (seq files)
      (p/let [zipfile (zip/make-zip repo-name files repo)]
        (when-let [anchor (gdom/getElement "download-as-zip")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

(defn export-repo-as-zip!
  [repo]
  (if (config/db-based-graph? repo)
    (db-based-export-repo-as-zip! repo)
    (file-based-export-repo-as-zip! repo)))

(defn- export-file-on-mobile [data path]
  (p/catch
   (.writeFile Filesystem (clj->js {:path path
                                    :data data
                                    :encoding (.-UTF8 Encoding)
                                    :recursive true}))
   (notification/show! "Export succeeded! You can find you exported file in the root directory of your graph." :success)
    (fn [error]
      (notification/show! "Export failed!" :error)
      (log/error :export-file-failed error))))

;; FIXME: All uses of :block/properties in this ns
(defn- dissoc-properties [m ks]
  (if (:block/properties m)
    (update m :block/properties
            (fn [v]
              (apply dissoc v ks)))
    m))

(defn- nested-select-keys
  [keyseq vec-tree]
  (walk/postwalk
   (fn [x]
     (cond
       (and (map? x) (contains? x :block/uuid))
       (-> x
           (s/rename-keys {:block/uuid :block/id
                           :block/title :block/page-name})
           (dissoc-properties [:id])
           (select-keys keyseq))

       :else
       x))
   vec-tree))

(defn- <build-blocks
  [repo]
  (p/let [pages (export-common-handler/<get-all-pages repo)]
    {:version 1
     :blocks
     (nested-select-keys [:block/id
                          :block/type
                          :block/page-name
                          :block/properties
                          :block/format
                          :block/children
                          :block/title
                          :block/created-at
                          :block/updated-at]
                         pages)}))

(defn- file-name [repo extension]
  (-> (string/replace repo config/local-db-prefix "")
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn- <export-repo-as-edn-str [repo]
  (p/let [result (<build-blocks repo)]
    (let [sb (StringBuffer.)]
      (pprint/pprint result (StringBufferWriter. sb))
      (str sb))))

(defn export-repo-as-edn!
  [repo]
  (p/let [edn-str (<export-repo-as-edn-str repo)]
    (when edn-str
      (let [data-str (some->> edn-str
                              js/encodeURIComponent
                              (str "data:text/edn;charset=utf-8,"))
            filename (file-name repo :edn)]
        (if (mobile-util/native-platform?)
          (export-file-on-mobile edn-str filename)
          (when-let [anchor (gdom/getElement "download-as-edn-v2")]
            (.setAttribute anchor "href" data-str)
            (.setAttribute anchor "download" filename)
            (.click anchor)))))))

(defn- nested-update-id
  [vec-tree]
  (walk/postwalk
   (fn [x]
     (if (and (map? x) (contains? x :block/id))
       (update x :block/id str)
       x))
   vec-tree))

(defn export-repo-as-json!
  [repo]
  (p/let [result (<build-blocks repo)
          json-str (-> result
                       nested-update-id
                       clj->js
                       js/JSON.stringify)
          filename (file-name repo :json)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
    (if (mobile-util/native-platform?)
      (export-file-on-mobile json-str filename)
      (when-let [anchor (gdom/getElement "download-as-json-v2")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" filename)
        (.click anchor)))))

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
  (p/let [data (persist-db/<export-db repo {:return-data? true})
          filename (file-name repo "sqlite")
          url (js/URL.createObjectURL (js/Blob. #js [data]))]
    (when-let [anchor (gdom/getElement "download-as-sqlite-db")]
      (.setAttribute anchor "href" url)
      (.setAttribute anchor "download" filename)
      (.click anchor))))

;;;;;;;;;;;;;;;;;;;;;;;;;
;; Export to roam json ;;
;;;;;;;;;;;;;;;;;;;;;;;;;

;; https://roamresearch.com/#/app/help/page/Nxz8u0vXU
;; export to roam json according to above spec
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
      (.click anchor))))

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

(defn backup-db-graph
  [repo _backup-type]
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

(defonce *backup-interval (atom nil))
(defn cancel-db-backup!
  []
  (when-let [i @*backup-interval]
    (js/clearInterval i)))

(defn auto-db-backup!
  [repo {:keys [backup-now?]
         :or {backup-now? true}}]
  (when (ldb/get-key-value (db/get-db repo) :logseq.kv/graph-backup-folder)
    (when (and (config/db-based-graph? repo) util/web-platform? (utils/nfsSupported))
      (cancel-db-backup!)

      (when backup-now? (backup-db-graph repo :backup-now))

    ;; run backup every hour
      (let [interval (js/setInterval #(backup-db-graph repo :auto)
                                     (* 1 60 60 1000))]
        (reset! *backup-interval interval)))))
