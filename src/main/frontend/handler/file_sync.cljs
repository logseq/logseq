(ns frontend.handler.file-sync
  "Provides util handler fns for file sync"
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
            [frontend.fs :as fs]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(def *beta-unavailable? (volatile! false))

(def refresh-file-sync-component (atom false))


(defn get-current-graph-uuid []
  (state/get-current-file-sync-graph-uuid))

(defn enable-sync?
  []
  (or (state/enable-sync?)
      config/dev?))

(defn current-graph-sync-on?
  []
  (when-let [sync-state (state/sub-file-sync-state (state/get-current-file-sync-graph-uuid))]
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
          (<! (apply sync/<update-graphs-txid! tx-info))
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
    (let [same-graph? (= graph-uuid (get-current-graph-uuid))]
      (when same-graph?
        (<! (sync/<sync-stop)))
      (let [r (<! (sync/<delete-graph sync/remoteapi graph-uuid))]
        (if (instance? ExceptionInfo r)
          (notification/show! (str "Delete graph failed: " graph-uuid) :warning)
          (do
            (when same-graph?
              (sync/clear-graphs-txid! graph-uuid)
              (swap! refresh-file-sync-component not))
            (notification/show! (str "Graph deleted") :success)))))))

(defn <list-graphs
  []
  (go (:Graphs (<! (sync/<list-remote-graphs sync/remoteapi)))))

(defn load-session-graphs
  []
  (when-not (state/sub [:file-sync/remote-graphs :loading])
    (go (state/set-state! [:file-sync/remote-graphs :loading] true)
        (let [graphs (<! (<list-graphs))]
          (state/set-state! :file-sync/remote-graphs {:loading false :graphs graphs})))))

(defn reset-session-graphs
  []
  (state/set-state! :file-sync/remote-graphs {:loading false :graphs nil}))

(defn init-graph [graph-uuid]
  (go
    (let [repo (state/get-current-repo)
          user-uuid (user/user-uuid)]
      (state/set-state! :sync-graph/init? true)
      (<! (sync/<update-graphs-txid! 0 graph-uuid user-uuid repo))
      (swap! refresh-file-sync-component not)
      (state/pub-event! [:graph/switch repo {:persist? false}]))))

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


(defn init-remote-graph
  [local graph]
  (when (and local graph)
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
        topics [:finished-local->remote :finished-remote->local :start]]
    (doseq [topic topics]
      (async/sub p topic c))

    (async/go-loop []
      (let [{:keys [event data]} (async/<! c)]
        (case event
          (list :finished-local->remote :finished-remote->local)
          (when-let [current-uuid (state/get-current-file-sync-graph-uuid)]
            (state/clear-file-sync-progress! current-uuid)
            (state/set-state! [:file-sync/graph-state current-uuid :file-sync/last-synced-at] (:epoch data)))

          :start
          (when-let [current-uuid (state/get-current-file-sync-graph-uuid)]
            (state/set-state! [:file-sync/graph-state current-uuid :file-sync/start-time] data))

          nil)

        (when (and (:file-change-events data)
                   (= :page (state/get-current-route)))
          (state/pub-event! [:file-sync/maybe-onboarding-show :sync-history])))
      (recur))

    #(doseq [topic topics]
       (async/unsub p topic c))))

(defn reset-user-state! []
  (vreset! *beta-unavailable? false)
  (state/set-state! :file-sync/onboarding-state nil))

(defn calculate-time-left
  "This assumes that the network speed is stable which could be wrong sometimes."
  [sync-state progressing]
  (when-let [start-time (get-in @state/state
                                [:file-sync/graph-state
                                 (state/get-current-file-sync-graph-uuid)
                                 :file-sync/start-time
                                 :epoch])]
    (let [now (tc/to-epoch (t/now))
          diff-seconds (- now start-time)
          finished (reduce + (map (comp :progress second) progressing))
          local->remote-files (:full-local->remote-files sync-state)
          remote->local-files (:full-remote->local-files sync-state)
          total (if (seq remote->local-files)
                  (reduce + (map (fn [m] (or (:size m) 0)) remote->local-files))
                  (reduce + (map #(:size (.-stat %)) local->remote-files)))
          mins (int (/ (* (/ total finished) diff-seconds) 60))]
      (if (or (zero? total) (zero? finished))
        "waiting"
        (cond
          (zero? mins) "soon"
          (= mins 1) "1 min left"
          (> mins 30) "calculating..."
          :else (str mins " mins left"))))))
