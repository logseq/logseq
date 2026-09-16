(ns electron.db-worker
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            [logseq.cli.server :as cli-server]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.common.version :as version]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]))

(defn- initial-state
  []
  {:repos {}
   :window->repo {}
   :epochs {}})

(defn- repo-key
  [repo]
  (graph-dir/repo-identity repo))

(defn- merge-repo-entry
  [existing entry]
  (if existing
    (-> existing
        (update :windows (fnil into #{}) (:windows entry))
        (update :runtime #(or % (:runtime entry))))
    entry))

(defn- normalize-state
  [state]
  (let [state (merge (initial-state) state)
        repos (reduce-kv (fn [m repo entry]
                           (if-let [key (repo-key repo)]
                             (update m key merge-repo-entry entry)
                             m))
                         {}
                         (:repos state))
        window->repo (reduce-kv (fn [m window-id repo]
                                  (if-let [key (repo-key repo)]
                                    (assoc m window-id key)
                                    m))
                                {}
                                (:window->repo state))]
    (assoc state
           :repos repos
           :window->repo window->repo)))

(defn- ensure-state
  [state]
  (normalize-state state))

(defn- dissoc-window
  [state window-id]
  (update state :window->repo dissoc window-id))

(defn- detach-window
  [state window-id]
  (let [state (ensure-state state)
        repo (get-in state [:window->repo window-id])]
    (if-not repo
      [state nil]
      (let [entry (get-in state [:repos repo])]
        (if-not entry
          [(dissoc-window state window-id) nil]
          (let [remaining (disj (:windows entry) window-id)
                state' (cond-> (dissoc-window state window-id)
                         (seq remaining)
                         (assoc-in [:repos repo :windows] remaining)

                         (empty? remaining)
                         (update :repos dissoc repo))]
            [state' (when (empty? remaining) (:runtime entry))]))))))

(defn- detach-repo
  [state repo]
  (let [state (ensure-state state)
        entry (get-in state [:repos repo])]
    (if-not entry
      [state nil]
      (let [windows (or (:windows entry) #{})
            state' (-> state
                       (update :repos dissoc repo)
                       (update :window->repo
                               (fn [window->repo]
                                 (reduce (fn [m window-id]
                                           (if (= repo (get m window-id))
                                             (dissoc m window-id)
                                             m))
                                         window->repo
                                         windows))))]
        [state' (:runtime entry)]))))

(defn create-manager
  [{:keys [start-daemon! stop-daemon! runtime-ready?] :as deps}]
  {:deps deps
   :start-daemon! start-daemon!
   :stop-daemon! stop-daemon!
   :runtime-ready? (or runtime-ready? (fn [_runtime] (p/resolved true)))
   :state (atom (initial-state))})

(defn- owned-runtime?
  [runtime]
  (not= false (:owned? runtime)))

(defn ensure-window-stopped!
  [{:keys [state stop-daemon!]} window-id]
  (let [key (get-in @state [:window->repo window-id])
        [next-state runtime] (detach-window @state window-id)
        stopping (when runtime (p/deferred))]
    ;; Assign the last-window stop before yielding to another close or open.
    (reset! state (cond-> next-state
                    runtime (assoc-in [:repos key] {:runtime runtime
                                                    :windows #{}
                                                    :stopping stopping})))
    (if-not runtime
      (p/resolved false)
      (let [finish! (fn [success?]
                      (swap! state
                             (fn [current]
                               (if (identical? stopping (get-in current [:repos key :stopping]))
                                 (if success?
                                   (update current :repos dissoc key)
                                   (update-in current [:repos key] dissoc :stopping))
                                 current))))]
        (-> (p/let [stopped? (if (owned-runtime? runtime)
                              (stop-daemon! runtime)
                              (p/resolved true))]
              (when-not (true? stopped?)
                (throw (ex-info "Worker stop did not complete" {:code :server-stop-failed})))
              (when-let [close! (:close-observer! runtime)] (close!))
              (finish! true)
              (p/resolve! stopping true)
              true)
            (p/catch (fn [error]
                       (finish! false)
                       (p/resolve! stopping false)
                       (throw error))))))))

(defn ensure-started!
  ([manager repo window-id] (ensure-started! manager repo window-id nil))
  ([{:keys [state start-daemon! stop-daemon! runtime-ready?] :as manager} repo window-id
    {:keys [generation] :as opts}]
   (let [key (repo-key repo)
         epoch (get-in @state [:epochs key] 0)
         assert-current! (fn []
                           (when-not (= epoch (get-in @state [:epochs key] 0))
                             (throw (ex-info "Graph lifecycle changed" {:code :graph-not-exists :repo repo}))))
         install! (fn [runtime]
                    (try
                      (assert-current!)
                      (let [previous (get-in @state [:repos key :runtime])]
                        (when-not (identical? previous runtime)
                          (when-let [close! (:close-observer! previous)] (close!))))
                      (swap! state
                             (fn [current]
                               (let [current' (ensure-state current)
                                     windows (get-in current' [:repos key :windows] #{})]
                                 (-> current'
                                     (assoc-in [:repos key] {:runtime runtime
                                                            :windows (conj windows window-id)})
                                     (assoc-in [:window->repo window-id] key)))))
                      runtime
                      (catch :default error
                        (when-let [close! (:close-observer! runtime)] (close!))
                        (throw error))))]
     (p/let [current-repo (get-in (ensure-state @state) [:window->repo window-id])
             _ (when (and current-repo (not= current-repo key))
                 (ensure-window-stopped! manager window-id))]
       (if-let [entry (get-in (ensure-state @state) [:repos key])]
         (if-let [stopping (:stopping entry)]
           (p/let [stopped? stopping]
             (when-not stopped?
               (throw (ex-info "Worker stop did not complete" {:code :server-stop-failed})))
             (assert-current!)
             (ensure-started! manager repo window-id opts))
           (p/let [runtime (:runtime entry)
                   _ (when (and generation (not= generation (:generation runtime)))
                       (throw (ex-info "Graph generation changed" {:code :graph-not-exists :repo repo})))
                   ready? (runtime-ready? runtime)
                   _ (assert-current!)]
             (if ready?
               (do
                 (swap! state (fn [current]
                                (-> (ensure-state current)
                                    (update-in [:repos key :windows] (fnil conj #{}) window-id)
                                    (assoc-in [:window->repo window-id] key))))
                 runtime)
               (do
                 (when-let [close! (:close-observer! runtime)] (close!))
                 (p/let [_ (when (owned-runtime? runtime)
                             (-> (stop-daemon! runtime)
                                 (p/catch (fn [_] nil))))
                         _ (assert-current!)
                         runtime' (start-daemon! repo opts)]
                   (install! runtime'))))))
         (p/let [_ (assert-current!)
                 runtime (start-daemon! repo opts)]
           (install! runtime)))))))

(defn- parse-runtime-lock
  [{:keys [base-url]}]
  (when (seq base-url)
    (try
      (let [^js parsed-url (js/URL. base-url)
            host (.-hostname parsed-url)
            port-str (.-port parsed-url)
            port (js/parseInt port-str 10)]
        (when (and (seq host) (number? port) (pos-int? port))
          {:host host
           :port port}))
      (catch :default _
        nil))))

(defn- runtime-ready-default?
  [{:keys [storage repo generation] :as runtime}]
  (let [current (lifecycle/snapshot storage repo)]
    (if (and (= generation (.-generation current))
             (= "available" (.-phase current)))
      (if-let [lock (parse-runtime-lock runtime)]
        (daemon/ready? lock)
        (p/resolved false))
      (p/resolved false))))

(defn ensure-stopped!
  [manager repo window-id]
  (if (= (repo-key repo) (get-in (ensure-state @(:state manager)) [:window->repo window-id]))
    (ensure-window-stopped! manager window-id)
    (p/resolved false)))

(defn ensure-repo-stopped!
  [{:keys [state stop-daemon!]} repo]
  (let [key (repo-key repo)
        runtime (get-in (ensure-state @state) [:repos key :runtime])]
    (if-not runtime
      (p/resolved false)
      (p/let [stopped? (if (owned-runtime? runtime)
                         (stop-daemon! runtime)
                         (p/resolved true))]
        (when-not (true? stopped?)
          (throw (ex-info "Worker stop did not complete" {:code :server-stop-failed :repo repo})))
        (when-let [close! (:close-observer! runtime)] (close!))
        (swap! state (fn [current]
                       (if (identical? runtime (get-in current [:repos key :runtime]))
                         (first (detach-repo current key))
                         current)))
        true))))

(defn stop-all!
  [{:keys [state] :as manager}]
  (-> (p/all (map #(ensure-repo-stopped! manager %)
                  (keys (:repos (ensure-state @state)))))
      (p/then (fn [_] true))))

(defn invalidate-repo!
  [{:keys [state]} repo & {:keys [keep-observer?]}]
  (let [key (repo-key repo)
        runtime (get-in @state [:repos key :runtime])]
    (when-not keep-observer?
      (when-let [close! (:close-observer! runtime)] (close!)))
    (swap! state (fn [current]
                   (-> (first (detach-repo current key))
                       (update-in [:epochs key] (fnil inc 0)))))))

(declare manager)

(defn <prepare-startup!
  []
  (lifecycle/stopOutdatedWorkers (cli-server/resolve-storage {}) (version/revision)))

(defn- start-managed-daemon!
  [repo opts]
  (let [config (assoc opts :owner-source :electron)]
    (p/let [config' (cli-server/ensure-server! config repo)
            storage (cli-server/resolve-storage config)
            root (.-root ^js storage)
            generation (:generation config')
            close-observer! (lifecycle/observe
                             storage repo generation
                             (fn [current]
                               (when (= generation (get-in @(:state manager) [:repos (repo-key repo) :runtime :generation]))
                                 (invalidate-repo! manager repo :keep-observer? true))
                               (when-let [notify! (:on-graph-lifecycle! config)]
                                 (notify! repo (assoc (js->clj current :keywordize-keys true) :generation generation)))))]
      {:repo repo :root-dir root :storage storage :generation generation
       :base-url (:base-url config') :auth-token nil
       :close-observer! close-observer!
       :owned? (:owned? config')})))

(defn- stop-managed-daemon!
  [{:keys [repo root-dir storage]}]
  (p/let [result (cli-server/stop-server! {:owner-source :electron :root-dir root-dir :storage storage} repo)]
    (:ok? result)))

(defonce manager
  (create-manager
   {:start-daemon! start-managed-daemon!
    :stop-daemon! stop-managed-daemon!
    :runtime-ready? runtime-ready-default?}))

(defn ensure-runtime!
  ([repo window-id]
   (ensure-started! manager repo window-id))
  ([repo window-id opts]
   (ensure-started! manager repo window-id opts)))

(defn release-window!
  [window-id]
  (ensure-window-stopped! manager window-id))

(defn release-runtime!
  ([repo window-id]
   (release-runtime! manager repo window-id))
  ([mgr repo window-id]
   (ensure-stopped! mgr repo window-id)))

(defn stop-all-managed!
  []
  (stop-all! manager))
