(ns electron.db-worker
  (:require [logseq.cli.server :as cli-server]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]))

(defn- initial-state
  []
  {:repos {}
   :window->repo {}})

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

(defn- detach-window-from-repo
  [state repo window-id]
  (let [state (ensure-state state)
        entry (get-in state [:repos repo])]
    (if-not entry
      [state nil]
      (let [remaining (disj (:windows entry) window-id)
            state' (cond-> state
                     (= repo (get-in state [:window->repo window-id]))
                     (update :window->repo dissoc window-id)

                     (seq remaining)
                     (assoc-in [:repos repo :windows] remaining)

                     (empty? remaining)
                     (update :repos dissoc repo))]
        [state' (when (empty? remaining) (:runtime entry))]))))

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
  (let [runtime* (atom nil)]
    (swap! state
           (fn [current]
             (let [[next-state runtime] (detach-window current window-id)]
               (reset! runtime* runtime)
               next-state)))
    (if-let [runtime @runtime*]
      (if (owned-runtime? runtime)
        (p/let [_ (stop-daemon! runtime)]
          true)
        (p/resolved true))
      (p/resolved false))))

(defn ensure-started!
  [{:keys [state start-daemon! stop-daemon! runtime-ready?] :as manager} repo window-id]
  (let [key (repo-key repo)]
    (p/let [current-repo (get-in (ensure-state @state) [:window->repo window-id])
            _ (when (and current-repo (not= current-repo key))
                (ensure-window-stopped! manager window-id))]
      (if-let [entry (get-in (ensure-state @state) [:repos key])]
        (p/let [runtime (:runtime entry)
                ready? (runtime-ready? runtime)]
          (if ready?
            (do
              (swap! state (fn [current]
                             (-> (ensure-state current)
                                 (update-in [:repos key :windows] (fnil conj #{}) window-id)
                                 (assoc-in [:window->repo window-id] key))))
              runtime)
            (p/let [_ (when (owned-runtime? runtime)
                        (-> (stop-daemon! runtime)
                            (p/catch (fn [_] nil))))
                    runtime' (start-daemon! repo)]
              (swap! state
                     (fn [current]
                       (let [current' (ensure-state current)
                             windows (get-in current' [:repos key :windows] #{})]
                         (-> current'
                             (assoc-in [:repos key] {:runtime runtime'
                                                     :windows (conj windows window-id)})
                             (assoc-in [:window->repo window-id] key)))))
              runtime')))
        (p/let [runtime (start-daemon! repo)]
          (swap! state (fn [current]
                         (-> (ensure-state current)
                             (assoc-in [:repos key] {:runtime runtime
                                                     :windows #{window-id}})
                             (assoc-in [:window->repo window-id] key))))
          runtime)))))

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
  [runtime]
  (if-let [lock (parse-runtime-lock runtime)]
    (daemon/ready? lock)
    (p/resolved false)))

(defn ensure-stopped!
  [{:keys [state stop-daemon!]} repo window-id]
  (let [key (repo-key repo)]
    (if (= key (get-in (ensure-state @state) [:window->repo window-id]))
      (ensure-window-stopped! {:state state :stop-daemon! stop-daemon!} window-id)
      (let [runtime* (atom nil)]
        (swap! state
               (fn [current]
                 (let [[next-state runtime] (detach-window-from-repo current key window-id)]
                   (reset! runtime* runtime)
                   next-state)))
        (if-let [runtime @runtime*]
          (if (owned-runtime? runtime)
            (p/let [_ (stop-daemon! runtime)]
              true)
            (p/resolved true))
          (p/resolved false))))))

(defn stop-all!
  [{:keys [state stop-daemon!]}]
  (let [entries (vals (:repos (ensure-state @state)))]
    (-> (p/all (map (fn [{:keys [runtime]}]
                      (if (owned-runtime? runtime)
                        (stop-daemon! runtime)
                        (p/resolved true)))
                    entries))
        (p/then (fn [_]
                  (reset! state (initial-state))
                  true)))))

(defn ensure-repo-stopped!
  [{:keys [state stop-daemon!]} repo]
  (let [key (repo-key repo)
        runtime* (atom nil)]
    (swap! state
           (fn [current]
             (let [[next-state runtime] (detach-repo current key)]
               (reset! runtime* runtime)
               next-state)))
    (if-let [runtime @runtime*]
      (if (owned-runtime? runtime)
        (p/let [_ (stop-daemon! runtime)]
          true)
        (p/resolved true))
      (p/resolved false))))

(defn- start-managed-daemon!
  [repo]
  (p/let [config (cli-server/ensure-server! {:owner-source :electron} repo)]
    {:repo repo
     :base-url (:base-url config)
     :auth-token nil
     :owned? (:owned? config)}))

(defn- stop-managed-daemon!
  [{:keys [repo]}]
  (p/let [result (cli-server/stop-server! {:owner-source :electron} repo)]
    (:ok? result)))

(defonce manager
  (create-manager
   {:start-daemon! start-managed-daemon!
    :stop-daemon! stop-managed-daemon!
    :runtime-ready? runtime-ready-default?}))

(defn ensure-runtime!
  [repo window-id]
  (ensure-started! manager repo window-id))

(defn release-window!
  [window-id]
  (ensure-window-stopped! manager window-id))

(defn release-runtime!
  ([repo window-id]
   (release-runtime! manager repo window-id))
  ([mgr repo window-id]
   (ensure-stopped! mgr repo window-id)))

(defn release-repo!
  [repo]
  (ensure-repo-stopped! manager repo))

(defn stop-all-managed!
  []
  (stop-all! manager))
