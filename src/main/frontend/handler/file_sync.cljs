(ns frontend.handler.file-sync
  (:require ["path" :as path]
            [cljs-time.format :as tf]
            [cljs.core.async :as async :refer [go <!]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.sync :as sync]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.handler.user :as user]
            [frontend.fs :as fs]))

(def *beta-unavailable? (volatile! false))

(def refresh-file-sync-component (atom false))


(defn get-current-graph-uuid [] (second @sync/graphs-txid))

(defn enable-sync?
  []
  (or (state/enable-sync?)
      config/dev?))

(defn current-graph-sync-on?
  []
  (when-let [sync-state (state/sub [:file-sync/sync-state (state/get-current-repo)])]
    (not (sync/sync-state--stopped? sync-state))))

(defn synced-file-graph?
  [graph]
  (some (fn [item] (and (= graph (:url item))
                        (:GraphUUID item))) (state/get-repos)))

(defn create-graph
  [name]
  (go
    (let [r* (<! (sync/<create-graph sync/remoteapi name))
          r (if (instance? ExceptionInfo r*) r* (:GraphUUID r*))]
      (if (and (not (instance? ExceptionInfo r))
               (string? r))
        (let [tx-info [0 r (user/user-uuid) (state/get-current-repo)]]
          (apply sync/update-graphs-txid! tx-info)
          (swap! refresh-file-sync-component not) tx-info)
        (do
          (state/set-state! [:ui/loading? :graph/create-remote?] false)
          (cond
           ;; already processed this exception by events
           ;; - :file-sync/storage-exceed-limit
           ;; - :file-sync/graph-count-exceed-limit
           (or (sync/storage-exceed-limit? r)
               (sync/graph-count-exceed-limit? r))
           nil

           (contains? #{400 404} (get-in (ex-data r) [:err :status]))
           (notification/show! (str "Create graph failed: already existed graph: " name) :warning true nil 4000)

           :else
           (notification/show! (str "Create graph failed:" r) :warning true nil 4000)))))))

(defn <delete-graph
  [graph-uuid]
  (go
    (when (= graph-uuid (get-current-graph-uuid))
      (<! (sync/<sync-stop)))
    (let [r (<! (sync/<delete-graph sync/remoteapi graph-uuid))]
      (if (instance? ExceptionInfo r)
        (notification/show! (str "Delete graph failed: " graph-uuid) :warning)
        (let [[_ local-graph-uuid _] @sync/graphs-txid]
          (when (= graph-uuid local-graph-uuid)
            (sync/clear-graphs-txid! (state/get-current-repo))
            (swap! refresh-file-sync-component not))
          (notification/show! (str "Graph deleted") :success))))))

(defn list-graphs
  []
  (go (:Graphs (<! (sync/<list-remote-graphs sync/remoteapi)))))

(defn load-session-graphs
  []
  (when-not (state/sub [:file-sync/remote-graphs :loading])
    (go (state/set-state! [:file-sync/remote-graphs :loading] true)
        (let [graphs (<! (list-graphs))]
          (state/set-state! :file-sync/remote-graphs {:loading false :graphs graphs})))))

(defn reset-session-graphs
  []
  (state/set-state! :file-sync/remote-graphs {:loading false :graphs nil}))

(defn init-graph [graph-uuid]
  (let [repo (state/get-current-repo)
        user-uuid (user/user-uuid)]
    (sync/update-graphs-txid! 0 graph-uuid user-uuid repo)
    (swap! refresh-file-sync-component not)
    (state/pub-event! [:graph/switch repo {:persist? false}])))

(defn download-version-file
  ([graph-uuid file-uuid version-uuid]
   (download-version-file graph-uuid file-uuid version-uuid false))
  ([graph-uuid file-uuid version-uuid silent-download?]
   (go
     (let [key (path/join file-uuid version-uuid)
           r   (<! (sync/<download-version-files
                    sync/rsapi graph-uuid (config/get-repo-dir (state/get-current-repo)) [key]))]
       (if (instance? ExceptionInfo r)
         (notification/show! (ex-cause r) :error)
         (when-not silent-download?
           (notification/show! [:div
                                [:div "Downloaded version file at: "]
                                [:div key]] :success false)))
       (when-not (instance? ExceptionInfo r)
         (path/join "logseq" "version-files" key))))))

(defn- list-file-local-versions
  [page]
  (go
    (when-let [path (-> page :block/file :file/path)]
      (let [base-path           (config/get-repo-dir (state/get-current-repo))
            rel-path            (string/replace-first path base-path "")
            version-files-dir   (->> (path/join "logseq/version-files/local" rel-path)
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

(defn fetch-page-file-versions [graph-uuid page]
  []
  (let [file-id (:db/id (:block/file page))]
    (when-let [path (:file/path (db/entity file-id))]
      (let [base-path (config/get-repo-dir (state/get-current-repo))
            base-path (if (string/starts-with? base-path "file://")
                        (js/decodeURIComponent base-path)
                        base-path)
            path*     (string/replace-first (string/replace-first path base-path "") #"^/" "")]
        (go
          (let [version-list       (:VersionList
                                    (<! (sync/<get-remote-file-versions sync/remoteapi graph-uuid path*)))
                local-version-list (<! (list-file-local-versions page))
                all-version-list   (->> (concat version-list local-version-list)
                                        (sort-by #(or (:CreateTime %)
                                                      (:create-time %))
                                                 >))]
            all-version-list))))))


(def *wait-syncing-graph (atom nil))

(defn set-wait-syncing-graph
  [graph]
  (reset! *wait-syncing-graph graph))

(defn init-remote-graph
  [local]
  (when-let [graph (and local @*wait-syncing-graph)]
    (notification/show!
     (str "Start syncing the remote graph "
          (:GraphName graph)
          " to "
          (config/get-string-repo-dir (config/get-local-dir local)))
     :warning)

    (init-graph (:GraphUUID graph))
    (state/close-modal!)))

(defn setup-file-sync-event-listeners
  []
  (let [c     (async/chan 1)
        p     sync/sync-events-publication
        topic :finished-local->remote]

    (async/sub p topic c)

    (async/go-loop []
      (let [{:keys [data]} (async/<! c)]
        (when (and (:file-change-events data)
                   (= :page (state/get-current-route)))
          (state/pub-event!
           [:file-sync/maybe-onboarding-show :sync-history])))
      (recur))

    #(async/unsub p topic c)))

(defn reset-user-state! []
  (vreset! *beta-unavailable? false)
  (state/set-state! :file-sync/onboarding-state nil))
