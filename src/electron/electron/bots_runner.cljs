(ns electron.bots-runner
  (:require ["electron" :refer [app dialog safeStorage]]
            ["fs" :as fs]
            ["path" :as node-path]
            [promesa.core :as p]))

(defonce ^:private runtime (atom nil))
(defonce ^:private current (atom nil))
(defonce ^:private status (atom "off"))
(defonce ^:private pairing? (atom false))
(defonce ^:private pairing-generation (atom 0))

(defn- client []
  (let [staged (node-path/join js/__dirname "bots-runner" "runner-client.cjs")]
    (js/require (if (fs/existsSync staged)
                  staged
                  (node-path/join js/__dirname ".." "deps" "db-sync" "worker" "bots" "runner-client.cjs")))))

(defn- config-path []
  (node-path/join (.getPath app "userData") "bot-runner.enc"))

(defn- secure-storage? []
  (and (.isEncryptionAvailable safeStorage)
       (or (not= "linux" (.-platform js/process))
           (not= "basic_text" (.getSelectedStorageBackend safeStorage)))))

(defn- read-config []
  (let [file (config-path)]
    (when (fs/existsSync file)
      (-> (.decryptString safeStorage (fs/readFileSync file))
          js/JSON.parse
          (js->clj :keywordize-keys true)))))

(defn- save-config! [config]
  (let [file (config-path)
        pending (str file ".new")
        encrypted (.encryptString safeStorage (js/JSON.stringify (clj->js config)))]
    (fs/writeFileSync pending encrypted #js {:mode 384})
    (fs/renameSync pending file)))

(defn stop! []
  (when-let [controller @runtime]
    (reset! runtime nil)
    (.abort controller))
  (reset! status "off"))

(defn- start! [config]
  (stop!)
  (let [controller (js/AbortController.)
        ^js runner (client)]
    (reset! runtime controller)
    (reset! status "connecting")
    (-> (.listen runner (clj->js config)
                 #js {:signal (.-signal controller)
                      :onStatus (fn [next]
                                  (when (identical? @runtime controller)
                                    (reset! status next)))})
        (p/catch (fn [_]
                   (when (identical? @runtime controller)
                     (reset! status "error")))))))

(defn restore! []
  (when (fs/existsSync (config-path))
    (try
      (when-not (secure-storage?) (throw (js/Error. "Secure storage unavailable")))
      (when-let [config (read-config)]
        (reset! current config)
        (if (:disabled config)
          (reset! status "offline")
          (start! config)))
      (catch :default _
        (reset! status "error")))))

(defn snapshot []
  (let [^js runner (client)]
    {:status @status
     :workspace (:root @current)
     :repository (:repository @current)
     :agents (mapv name (keys (:commands @current)))
     :installed (vec (js/Object.keys (.discoverAgents runner)))}))

(defn <pair! [window server account-token agents repository]
  (cond
    (not (secure-storage?))
    (p/rejected (js/Error. "System secure storage is required to pair this device"))

    (or @current (not (compare-and-set! pairing? false true)))
    (p/rejected (js/Error. "This desktop already has a Bot runner"))

    :else
    (-> (p/let [generation @pairing-generation
                ^js runner (client)
                choices (js->clj (.discoverAgents runner))
                commands (select-keys choices agents)]
          (when (or (empty? commands) (not= (count commands) (count agents)))
            (throw (js/Error. "Select installed Codex or Pi executables")))
          (when-not (and (string? account-token) (seq account-token))
            (throw (js/Error. "Sign in to pair this desktop")))
          (p/let [^js folder (.showOpenDialog dialog window #js {:properties #js ["openDirectory"]})]
            (if (.-canceled folder)
              (snapshot)
              (let [root (fs/realpathSync (aget (.-filePaths folder) 0))]
                (p/let [^js device (.pair runner #js {:server server
                                                     :accountToken account-token
                                                     :agents (clj->js agents)
                                                     :repository repository})
                        config {:server server :root root :repository repository
                                :credential (.-credential device) :commands commands}]
                  (try
                    (when-not (= generation @pairing-generation)
                      (throw (js/Error. "Device pairing was cancelled")))
                    (save-config! config)
                    (reset! current config)
                    (start! config)
                    (snapshot)
                    (catch :default error
                      (-> (.revoke runner (clj->js config))
                          (p/catch (fn [_] nil)))
                      (throw error))))))))
        (p/finally #(reset! pairing? false)))))

(defn <disconnect! []
  (swap! pairing-generation inc)
  (stop!)
  (if-let [config @current]
    (let [disabled (assoc config :disabled true)
          ^js runner (client)]
      (save-config! disabled)
      (reset! current disabled)
      (reset! status "offline")
      (p/let [_ (.revoke runner (clj->js config))]
        (fs/rmSync (config-path) #js {:force true})
        (reset! current nil)
        (reset! status "off")
        (snapshot)))
    (p/resolved (snapshot))))
