(ns logseq.db-worker.server-list
  "Helpers for the centralized db-worker-node server-list file."
  (:require [clojure.string :as string]
            ["fs" :as fs]
            ["path" :as node-path]))

(def ^:private write-lock-timeout-ms 2000)
(def ^:private write-lock-poll-interval-ms 25)

(defn path
  [root-dir-path]
  (when-not (seq root-dir-path)
    (throw (js/Error. "root-dir is required")))
  (node-path/join root-dir-path "server-list"))

(defn lock-path
  [file-path]
  (when-not (seq file-path)
    (throw (js/Error. "server-list file path is required")))
  (node-path/join (node-path/dirname file-path) "server-list.lock"))

(defn- parse-int
  [value]
  (when (re-matches #"\d+" value)
    (js/parseInt value 10)))

(defn parse-line
  [line]
  (when (string? line)
    (let [trimmed (string/trim line)]
      (when-let [[_ pid-str port-str] (re-matches #"(\d+)\s+(\d+)" trimmed)]
        (let [pid (parse-int pid-str)
              port (parse-int port-str)]
          (when (and (pos-int? pid) (pos-int? port))
            {:pid pid
             :port port}))))))

(defn read-entries
  [file-path]
  (if (seq file-path)
    (try
      (->> (.toString (fs/readFileSync file-path) "utf8")
           string/split-lines
           (keep parse-line)
           vec)
      (catch :default e
        (if (= "ENOENT" (.-code e))
          []
          (throw e))))
    []))

(defn- entry-key
  [{:keys [pid port]}]
  [pid port])

(defn- valid-entry?
  [{:keys [pid port]}]
  (and (pos-int? pid) (pos-int? port)))

(defn- normalize-entries
  [entries]
  (:entries
   (reduce (fn [{:keys [seen] :as acc} entry]
             (let [key (entry-key entry)]
               (if (and (valid-entry? entry)
                        (not (contains? seen key)))
                 (-> acc
                     (update :seen conj key)
                     (update :entries conj {:pid (:pid entry)
                                            :port (:port entry)}))
                 acc)))
           {:seen #{}
            :entries []}
           (or entries []))))

(defn- payload-for-entries
  [entries]
  (if (seq entries)
    (str (string/join "\n" (map (fn [{:keys [pid port]}]
                                  (str pid " " port))
                                entries))
         "\n")
    ""))

(defn- sleep-sync!
  [ms]
  (let [shared (js/SharedArrayBuffer. 4)
        view (js/Int32Array. shared)]
    (js/Atomics.wait view 0 0 ms)))

(defn- process-status
  [pid]
  (try
    (.kill js/process pid 0)
    :alive
    (catch :default e
      (case (.-code e)
        "ESRCH" :not-found
        "EPERM" :no-permission
        :unknown))))

(defn- read-lock-metadata
  [lock-file]
  (try
    (let [raw (.toString (fs/readFileSync lock-file) "utf8")]
      (try
        {:raw raw
         :metadata (js->clj (js/JSON.parse raw) :keywordize-keys true)}
        (catch :default e
          {:raw raw
           :parse-error e})))
    (catch :default e
      (if (= "ENOENT" (.-code e))
        nil
        {:read-error e}))))

(defn- lock-stale?
  [lock-info]
  (let [pid (get-in lock-info [:metadata :pid])]
    (and (pos-int? pid)
         (= :not-found (process-status pid)))))

(defn- unlink-if-exists!
  [file-path]
  (try
    (fs/unlinkSync file-path)
    (catch :default e
      (when-not (= "ENOENT" (.-code e))
        (throw e)))))

(defn- lock-timeout-error
  [file-path lock-file lock-info]
  (ex-info (str "Timed out acquiring server-list lock: " lock-file)
           (cond-> {:code :server-list-lock-timeout
                    :file-path file-path
                    :lock-path lock-file}
             (:metadata lock-info) (assoc :lock-metadata (:metadata lock-info))
             (:raw lock-info) (assoc :lock-raw (:raw lock-info)))))

(defn- write-lock-metadata!
  [fd metadata]
  (fs/writeFileSync fd (js/JSON.stringify (clj->js metadata)) "utf8"))

(defn- acquire-write-lock!
  [file-path]
  (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
  (let [lock-file (lock-path file-path)
        deadline (+ (js/Date.now) write-lock-timeout-ms)]
    (loop []
      (let [lock-id (str (random-uuid))
            metadata {:pid (.-pid js/process)
                      :lock-id lock-id
                      :created-at (.toISOString (js/Date.))}
            result (try
                     (let [fd (fs/openSync lock-file "wx")
                           write-error (try
                                         (write-lock-metadata! fd metadata)
                                         nil
                                         (catch :default e
                                           e))]
                       (fs/closeSync fd)
                       (when write-error
                         (unlink-if-exists! lock-file)
                         (throw write-error))
                       {:file-path file-path
                        :lock-path lock-file
                        :metadata metadata})
                     (catch :default e
                       (if (= "EEXIST" (.-code e))
                         (let [lock-info (read-lock-metadata lock-file)]
                           (when (lock-stale? lock-info)
                             (unlink-if-exists! lock-file))
                           (if (>= (js/Date.now) deadline)
                             (throw (lock-timeout-error file-path lock-file lock-info))
                             ::retry))
                         (throw e))))]
        (if (= ::retry result)
          (do
            (sleep-sync! write-lock-poll-interval-ms)
            (recur))
          result)))))

(defn- release-write-lock!
  [{lock-file :lock-path metadata :metadata}]
  (let [lock-info (read-lock-metadata lock-file)]
    (when (= (:lock-id metadata) (get-in lock-info [:metadata :lock-id]))
      (unlink-if-exists! lock-file))))

(defn- with-write-lock!
  [file-path f]
  (let [lock (acquire-write-lock! file-path)]
    (try
      (f)
      (finally
        (release-write-lock! lock)))))

(defn- write-entries-unlocked!
  [file-path entries]
  (let [dir (node-path/dirname file-path)
        tmp-file (node-path/join dir (str "server-list."
                                          (.-pid js/process)
                                          "."
                                          (random-uuid)
                                          ".tmp"))
        payload (payload-for-entries entries)]
    (try
      (fs/writeFileSync tmp-file payload "utf8")
      (fs/renameSync tmp-file file-path)
      (catch :default e
        (try
          (fs/rmSync tmp-file #js {:force true})
          (catch :default _))
        (throw e)))))

(defn update-entries!
  [file-path transform]
  (when (seq file-path)
    (with-write-lock!
      file-path
      (fn []
        (let [entries (read-entries file-path)
              next-entries (normalize-entries (transform entries))]
          (write-entries-unlocked! file-path next-entries)
          next-entries)))))

(defn rewrite-entries!
  [file-path entries]
  (when (seq file-path)
    (update-entries! file-path (constantly entries))
    nil))

(defn append-entry!
  [file-path {:keys [pid port] :as entry}]
  (when (and (seq file-path) (pos-int? pid) (pos-int? port))
    (update-entries! file-path #(conj (vec %) {:pid pid :port port}))
    entry))

(defn remove-entry!
  [file-path {:keys [pid port]}]
  (when (seq file-path)
    (update-entries!
     file-path
     (fn [entries]
       (remove (fn [entry]
                 (and (= pid (:pid entry))
                      (= port (:port entry))))
               entries)))
    nil))

(defn remove-entries!
  [file-path entries-to-remove]
  (when (seq file-path)
    (let [keys-to-remove (set (map entry-key (normalize-entries entries-to-remove)))]
      (update-entries!
       file-path
       (fn [entries]
         (remove (fn [entry]
                   (contains? keys-to-remove (entry-key entry)))
                 entries))))))
