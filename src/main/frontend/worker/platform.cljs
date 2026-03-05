(ns frontend.worker.platform
  "Platform adapter contract for db-worker runtimes.")

(def ^:private required-sections
  [:env :storage :kv :broadcast :websocket :crypto :timers])

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

(defn kv-get
  [platform k]
  (if-let [f (get-in platform [:kv :get])]
    (f k)
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

(defn websocket-connect
  [platform url]
  (if-let [f (get-in platform [:websocket :connect])]
    (f url)
    (throw (ex-info "platform websocket/connect missing" {:url url}))))

(defn post-message!
  [platform type payload]
  (when-let [f (get-in platform [:broadcast :post-message!])]
    (f type payload)))

(defn transfer
  [platform data transferables]
  (if-let [f (get-in platform [:storage :transfer])]
    (f data transferables)
    data))
