(ns frontend.worker.platform
  "Platform adapter contract for db-worker runtimes.")

(defn- normalize-missing-value
  [value]
  (if (identical? js/undefined value)
    nil
    value))

(def ^:private required-sections
  [:env :storage :kv :broadcast :websocket :crypto :timers :sqlite])

(defonce ^:private *platform (atom nil))

(defn validate-platform!
  [platform]
  (doseq [section required-sections]
    (when-not (contains? platform section)
      (throw (ex-info (str "platform adapter missing section: " section)
                      {:section section
                       :platform-keys (keys platform)}))))
  platform)

(defn set-platform!
  [platform]
  (reset! *platform (validate-platform! platform)))

(defn current
  []
  (or @*platform
      (throw (ex-info "platform adapter not initialized" {}))))

(defn env-flag
  [platform flag]
  (get-in platform [:env flag]))

(defn storage
  [platform]
  (:storage platform))

(defn install-storage-pool
  [platform sqlite pool-name]
  (if-let [f (get-in platform [:storage :install-opfs-pool])]
    (f sqlite pool-name)
    (throw (ex-info "platform storage/install-opfs-pool missing"
                    {:pool-name pool-name}))))

(defn resolve-db-path
  [platform repo pool path]
  (if-let [f (get-in platform [:storage :resolve-db-path])]
    (f repo pool path)
    path))

(defn remove-storage-pool!
  [platform pool]
  (if-let [f (get-in platform [:storage :remove-vfs!])]
    (f pool)
    nil))

(defn kv-get
  [platform k]
  (if-let [f (get-in platform [:kv :get])]
    (-> (f k)
        (.then normalize-missing-value))
    (throw (ex-info "platform kv/get missing" {:key k}))))

(defn kv-set!
  [platform k value]
  (if-let [f (get-in platform [:kv :set!])]
    (f k value)
    (throw (ex-info "platform kv/set! missing" {:key k}))))

(defn read-text!
  [platform path]
  (if-let [f (get-in platform [:storage :read-text!])]
    (f path)
    (throw (ex-info "platform storage/read-text! missing" {:path path}))))

(defn write-text!
  [platform path text]
  (if-let [f (get-in platform [:storage :write-text!])]
    (f path text)
    (throw (ex-info "platform storage/write-text! missing" {:path path}))))

(defn asset-read-bytes!
  [platform repo file-name]
  (if-let [f (get-in platform [:storage :asset-read-bytes!])]
    (f repo file-name)
    (throw (ex-info "platform storage/asset-read-bytes! missing"
                    {:repo repo
                     :file-name file-name}))))

(defn asset-write-bytes!
  [platform repo file-name payload]
  (if-let [f (get-in platform [:storage :asset-write-bytes!])]
    (f repo file-name payload)
    (throw (ex-info "platform storage/asset-write-bytes! missing"
                    {:repo repo
                     :file-name file-name}))))

(defn asset-stat
  [platform repo file-name]
  (if-let [f (get-in platform [:storage :asset-stat])]
    (f repo file-name)
    (throw (ex-info "platform storage/asset-stat missing"
                    {:repo repo
                     :file-name file-name}))))

(defn save-secret-text!
  [platform key text]
  (if-let [f (get-in platform [:crypto :save-secret-text!])]
    (f key text)
    (throw (ex-info "platform crypto/save-secret-text! missing" {:key key}))))

(defn read-secret-text
  [platform key]
  (if-let [f (get-in platform [:crypto :read-secret-text])]
    (-> (f key)
        (.then normalize-missing-value))
    (throw (ex-info "platform crypto/read-secret-text missing" {:key key}))))

(defn delete-secret-text!
  [platform key]
  (if-let [f (get-in platform [:crypto :delete-secret-text!])]
    (f key)
    (throw (ex-info "platform crypto/delete-secret-text! missing" {:key key}))))

(defn websocket-connect
  [platform url]
  (if-let [f (get-in platform [:websocket :connect])]
    (f url)
    (throw (ex-info "platform websocket/connect missing" {:url url}))))

(defn sqlite-init!
  [platform]
  (when-let [f (get-in platform [:sqlite :init!])]
    (f)))

(defn sqlite-open
  [platform opts]
  (if-let [f (get-in platform [:sqlite :open-db])]
    (f opts)
    (throw (ex-info "platform sqlite/open-db missing" {:opts opts}))))

(defn post-message!
  [platform type payload]
  (when-let [f (get-in platform [:broadcast :post-message!])]
    (f type payload)))

(defn transfer
  [platform data transferables]
  (if-let [f (get-in platform [:storage :transfer])]
    (f data transferables)
    data))
