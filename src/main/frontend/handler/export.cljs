(ns ^:no-doc frontend.handler.export
  (:require
   ["@capacitor/filesystem" :refer [Encoding Filesystem]]
   [cljs.pprint :as pprint]
   [clojure.set :as s]
   [clojure.string :as string]
   [clojure.walk :as walk]
   [frontend.config :as config]
   [frontend.db :as db]
   [frontend.extensions.zip :as zip]
   [frontend.external.roam-export :as roam-export]
   [frontend.handler.notification :as notification]
   [frontend.mobile.util :as mobile-util]
   [logseq.publishing.html :as publish-html]
   [frontend.state :as state]
   [frontend.util :as util]
   [goog.dom :as gdom]
   [lambdaisland.glogi :as log]
   [promesa.core :as p]
   [frontend.persist-db :as persist-db]
   [cljs-bean.core :as bean]
   [frontend.handler.export.common :as export-common-handler]
   [logseq.db.sqlite.common-db :as sqlite-common-db]
   [logseq.db :as ldb]
   [frontend.idb :as idb]
   ["/frontend/utils" :as utils])
  (:import
   [goog.string StringBuffer]))

(defn download-repo-as-html!
  "download public pages as html"
  [repo]
  (when-let [db (db/get-db repo)]
    (let [{:keys [asset-filenames html]}
          (publish-html/build-html db
                                   {:app-state (select-keys @state/state
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

(defn export-repo-as-zip!
  [repo]
  (p/let [files (export-common-handler/<get-file-contents repo "md")
          [owner repo-name] (util/get-git-owner-and-repo repo)
          repo-name (str owner "-" repo-name)
          files (map (fn [{:keys [path content]}] [path content]) files)]
    (when (seq files)
      (p/let [zipfile (zip/make-zip repo-name files repo)]
        (when-let [anchor (gdom/getElement "download")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

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

(defn export-repo-as-debug-json!
  [repo]
  (p/let [result (export-common-handler/<get-debug-datoms repo)
          json-str (-> result
                       bean/->js
                       js/JSON.stringify)
          filename (file-name (str repo "-debug-datoms") :json)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
    (when-let [anchor (gdom/getElement "download-as-json-debug")]
      (.setAttribute anchor "href" data-str)
      (.setAttribute anchor "download" filename)
      (.click anchor))))

(defn export-repo-as-sqlite-db!
  [repo]
  (p/let [data (persist-db/<export-db repo {:return-data? true})
          filename (file-name repo "sqlite")
          url (js/URL.createObjectURL (js/Blob. #js [data]))]
    (when-not (mobile-util/native-platform?)
      (when-let [anchor (gdom/getElement "download-as-sqlite-db")]
        (.setAttribute anchor "href" url)
        (.setAttribute anchor "download" filename)
        (.click anchor)))))

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

(defn backup-db-graph
  [repo]
  (when (and repo (= repo (state/get-current-repo)))
    (when-let [backup-folder (ldb/get-key-value (db/get-db repo) :logseq.kv/graph-backup-folder)]
      (p/let [handle (idb/get-item (str "file-handle/" backup-folder))
              repo-name (sqlite-common-db/sanitize-db-name repo)]
        (if handle
          (p/let [graph-dir-handle (.getDirectoryHandle handle repo-name #js {:create true})
                  backup-handle (.getFileHandle graph-dir-handle "backup.db" #js {:create true})
                  data (persist-db/<export-db repo {:return-data? true})
                  _ (utils/writeFile backup-handle data)]
            (println "Successfully created a backup for" repo-name "at" (str (js/Date.)) ".")
            true)
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

      (when backup-now? (backup-db-graph repo))

    ;; run backup every hour
      (let [interval (js/setInterval #(backup-db-graph repo) (* 1 60 60 1000))]
        (reset! *backup-interval interval)))))
