(ns electron.db-worker
  (:require [logseq.cli.server :as cli-server]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]))

(defn- initial-state
  []
  {:repos {}
   :window->repo {}})

(defn- ensure-state
  [state]
  (merge (initial-state) state))

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
                     true
                     (update :window->repo dissoc window-id)

                     (seq remaining)
                     (assoc-in [:repos repo :windows] remaining)

                     (empty? remaining)
                     (update :repos dissoc repo))]
        [state' (when (empty? remaining) (:runtime entry))]))))

(defn create-manager
  [{:keys [start-daemon! stop-daemon! runtime-ready?] :as deps}]
  {:deps deps
   :start-daemon! start-daemon!
   :stop-daemon! stop-daemon!
   :runtime-ready? (or runtime-ready? (fn [_runtime] (p/resolved true)))
   :state (atom (initial-state))})

(defn ensure-window-stopped!
  [{:keys [state stop-daemon!]} window-id]
  (let [runtime* (atom nil)]
    (swap! state
           (fn [current]
             (let [[next-state runtime] (detach-window current window-id)]
               (reset! runtime* runtime)
               next-state)))
    (if-let [runtime @runtime*]
      (p/let [_ (stop-daemon! runtime)]
        true)
      (p/resolved false))))

(defn ensure-started!
  [{:keys [state start-daemon! stop-daemon! runtime-ready?] :as manager} repo window-id]
  (p/let [current-repo (get-in (ensure-state @state) [:window->repo window-id])
          _ (when (and current-repo (not= current-repo repo))
              (ensure-window-stopped! manager window-id))]
    (if-let [entry (get-in (ensure-state @state) [:repos repo])]
      (p/let [runtime (:runtime entry)
              ready? (runtime-ready? runtime)]
        (if ready?
          (do
            (swap! state (fn [current]
                           (-> (ensure-state current)
                               (update-in [:repos repo :windows] (fnil conj #{}) window-id)
                               (assoc-in [:window->repo window-id] repo))))
            runtime)
          (p/let [_ (-> (stop-daemon! runtime)
                        (p/catch (fn [_] nil)))
                  runtime' (start-daemon! repo)]
            (swap! state
                   (fn [current]
                     (let [current' (ensure-state current)
                           windows (get-in current' [:repos repo :windows] #{})]
                       (-> current'
                           (assoc-in [:repos repo] {:runtime runtime'
                                                    :windows (conj windows window-id)})
                           (assoc-in [:window->repo window-id] repo)))))
            runtime')))
      (p/let [runtime (start-daemon! repo)]
        (swap! state (fn [current]
                       (-> (ensure-state current)
                           (assoc-in [:repos repo] {:runtime runtime
                                                    :windows #{window-id}})
                           (assoc-in [:window->repo window-id] repo))))
        runtime))))

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
  (if (= repo (get-in (ensure-state @state) [:window->repo window-id]))
    (ensure-window-stopped! {:state state :stop-daemon! stop-daemon!} window-id)
    (let [runtime* (atom nil)]
      (swap! state
             (fn [current]
               (let [[next-state runtime] (detach-window-from-repo current repo window-id)]
                 (reset! runtime* runtime)
                 next-state)))
      (if-let [runtime @runtime*]
        (p/let [_ (stop-daemon! runtime)]
          true)
        (p/resolved false)))))

(defn stop-all!
  [{:keys [state stop-daemon!]}]
  (let [entries (vals (:repos (ensure-state @state)))]
    (-> (p/all (map (fn [{:keys [runtime]}]
                      (stop-daemon! runtime))
                    entries))
        (p/then (fn [_]
                  (reset! state (initial-state))
                  true)))))

(defn- start-managed-daemon!
  [repo]
  (p/let [config (cli-server/ensure-server! {} repo)]
    {:repo repo
     :base-url (:base-url config)
     :auth-token nil}))

(defn- stop-managed-daemon!
  [{:keys [repo]}]
  (p/let [result (cli-server/stop-server! {} repo)]
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

(defn stop-all-managed!
  []
  (stop-all! manager))
