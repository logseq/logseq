(ns frontend.handler.file-sync
  (:require ["path" :as path]
            [cljs-time.coerce :as tc]
            [cljs-time.format :as tf]
            [cljs.core.async :as async :refer [go <!]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.sync :as sync]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.user :as user]
            [frontend.fs :as fs]))

(def hiding-login&file-sync (not config/dev?))
(def refresh-file-sync-component (atom false))

(defn graph-txid-exists?
  []
  (let [[_user-uuid graph-uuid _txid] @sync/graphs-txid]
    (some? graph-uuid)))


(defn create-graph
  [name]
  (go
    (let [r* (<! (sync/create-graph sync/remoteapi name))
          r (if (instance? ExceptionInfo r*) r* (:GraphUUID r*))]
      (if (and (not (instance? ExceptionInfo r))
               (string? r))
        (let [tx-info [0 r (user/user-uuid) (state/get-current-repo)]]
          (apply sync/update-graphs-txid! tx-info)
          (swap! refresh-file-sync-component not) tx-info)
        (if (= 404 (get-in (ex-data r) [:err :status]))
          (notification/show! (str "Create graph failed: already existed graph: " name) :warning)
          (notification/show! (str "Create graph failed: " r) :warning))))))

(defn delete-graph
  [graph-uuid]
  (sync/sync-stop)
  (go
    (let [r (<! (sync/delete-graph sync/remoteapi graph-uuid))]
      (if (instance? ExceptionInfo r)
        (notification/show! (str "Delete graph failed: " graph-uuid) :warning)
        (let [[_ local-graph-uuid _] @sync/graphs-txid]
          (when (= graph-uuid local-graph-uuid)
            (sync/clear-graphs-txid! (state/get-current-repo))
            (swap! refresh-file-sync-component not))
          (notification/show! (str "Graph deleted") :success))))))

(defn list-graphs
  []
  (go (:Graphs (<! (sync/list-remote-graphs sync/remoteapi)))))


(defn download-all-files
  [repo graph-uuid user-uuid base-path]
  (go
    (state/reset-file-sync-download-init-state!)
    (state/set-file-sync-download-init-state! {:total js/NaN :finished 0 :downloading? true})
    (let [remote-all-files-meta (<! (sync/get-remote-all-files-meta sync/remoteapi graph-uuid))
          local-all-files-meta (<! (sync/get-local-all-files-meta sync/rsapi graph-uuid base-path))
          diff-remote-files (set/difference remote-all-files-meta local-all-files-meta)
          latest-txid (:TXId (<! (sync/get-remote-graph sync/remoteapi nil graph-uuid)))
          partitioned-filetxns
          (sequence (sync/filepaths->partitioned-filetxns 10 graph-uuid user-uuid)
                    (map sync/relative-path diff-remote-files))]
      (state/set-file-sync-download-init-state! {:total (count diff-remote-files) :finished 0})
      (let [r (<! (sync/apply-filetxns-partitions
                   nil user-uuid graph-uuid base-path partitioned-filetxns repo nil (atom false)
                   (fn [filetxns]
                     (state/set-file-sync-download-init-state!
                      {:downloading-files (mapv sync/relative-path filetxns)}))
                   (fn [filetxns]
                     (state/set-file-sync-download-init-state!
                      {:finished (+ (count filetxns)
                                    (or (:finished (state/get-file-sync-download-init-state)) 0))}))))]
        (if (instance? ExceptionInfo r)
          ;; TODO: add re-download button
          (notification/show! (str "Download graph failed: " (ex-cause r)) :warning)
          (do (state/reset-file-sync-download-init-state!)
              (sync/update-graphs-txid! latest-txid graph-uuid user-uuid repo)))))))

(defn load-session-graphs
  []
  (when-not (state/sub [:file-sync/remote-graphs :loading])
    (go (state/set-state! [:file-sync/remote-graphs :loading] true)
      (let [graphs (<! (list-graphs))]
        (state/set-state! :file-sync/remote-graphs {:loading false :graphs graphs})))))

(defn reset-session-graphs
  []
  (state/set-state! :file-sync/remote-graphs {:loading false :graphs nil}))


(defn switch-graph [graph-uuid]
  (let [repo (state/get-current-repo)
        base-path (config/get-repo-dir repo)
        user-uuid (user/user-uuid)]
    (sync/update-graphs-txid! 0 graph-uuid user-uuid repo)
    (download-all-files repo graph-uuid user-uuid base-path)
    (swap! refresh-file-sync-component not)))

(defn- download-version-file [graph-uuid file-uuid version-uuid]

  (go
    (let [key (path/join "version-files" file-uuid version-uuid)
          r (<! (sync/update-local-files
                 sync/rsapi graph-uuid (config/get-repo-dir (state/get-current-repo)) [key]))]
      (if (instance? ExceptionInfo r)
        (notification/show! (ex-cause r) :error)
        (notification/show! [:div
                             [:div "Downloaded version file at: "]
                             [:div key]] :success false))
      (when-not (instance? ExceptionInfo r)
        key))))

(defn- list-file-local-versions
  [page]
  (go
    (when-let [path (-> page :block/file :file/path)]
      (let [base-path           (config/get-repo-dir (state/get-current-repo))
            rel-path            (string/replace-first path base-path "")
            version-files-dir   (->> (path/join "version-files/local" rel-path)
                                     path/parse
                                     (#(js->clj % :keywordize-keys true))
                                     ((juxt :dir :name))
                                     (apply path/join base-path))
            version-file-paths* (<! (p->c (fs/readdir version-files-dir)))]
        (when-not (instance? ExceptionInfo version-file-paths*)
          (let [version-file-paths
                (filterv
                 ;; filter dir
                 (fn [dir-or-file]
                   (-> (path/parse dir-or-file)
                       (js->clj :keywordize-keys true)
                       :ext
                       seq))
                 (js->clj (<! (p->c (fs/readdir version-files-dir)))))]
            (mapv
             (fn [path]
               (let [create-time
                     (-> (path/parse path)
                         (js->clj :keywordize-keys true)
                         :name
                         (#(tf/parse (tf/formatter "yyyy-MM-dd'T'HH_mm_ss.SSSZZ") %)))]
                 {:create-time create-time :path path :relative-path (string/replace-first path base-path "")}))
             version-file-paths)))))))

(defn list-file-versions [graph-uuid page]
  (let [file-id (:db/id (:block/file page))]
    (when-let [path (:file/path (db/entity file-id))]
      (let [base-path (config/get-repo-dir (state/get-current-repo))
            path*     (string/replace-first path base-path "")]
        (go
          (let [version-list       (:VersionList
                                    (<! (sync/get-remote-file-versions sync/remoteapi graph-uuid path*)))
                local-version-list (<! (list-file-local-versions page))
                all-version-list   (->> (concat version-list local-version-list)
                                        (sort-by #(or (tc/from-string (:CreateTime %))
                                                      (:create-time %))
                                                 >))]
            (notification/show! [:div
                                 [:div.font-bold "File history - " path*]
                                 [:hr.my-2]
                                 (for [version all-version-list]
                                   (let [version-uuid (or (:VersionUUID version) (:relative-path version))
                                         local?       (some? (:relative-path version))]
                                     [:div.my-4 {:key version-uuid}
                                      [:div
                                       [:a.text-xs.inline
                                        {:on-click #(if local?
                                                      (js/window.apis.openPath (:path version))
                                                      (go
                                                        (let [relative-path
                                                              (<! (download-version-file graph-uuid
                                                                                         (:FileUUID version)
                                                                                         (:VersionUUID version)))]
                                                          (js/window.apis.openPath (path/join base-path relative-path)))))}
                                        version-uuid]
                                       (when-not local?
                                         [:div.opacity-70 (str "Size: " (:Size version))])]
                                      [:div.opacity-50
                                       (util/time-ago (or (tc/from-string (:CreateTime version))
                                                          (:create-time version)))]]))]
                                :success false)))))))

(defn get-current-graph-uuid [] (second @sync/graphs-txid))

(def *wait-syncing-graph (atom nil))

(defn set-wait-syncing-graph
  [graph]
  (reset! *wait-syncing-graph graph))

(defn switch-to-waiting-graph
  [local]
  (when-let [graph (and local @*wait-syncing-graph)]
    (notification/show!
      (str "Start to sync <" (:GraphName graph) "> to <" local ">")
      :warning)

    (switch-graph (:GraphUUID graph))
    (state/close-modal!)))