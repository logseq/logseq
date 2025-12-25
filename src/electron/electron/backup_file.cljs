(ns electron.backup-file
  (:require ["fs" :as fs]
            ["fs-extra" :as fs-extra]
            ["path" :as node-path]
            [clojure.string :as string]))

(def backup-dir "logseq/bak")
(def version-file-dir "logseq/version-files/local")

(defn- get-backup-dir*
  [repo relative-path bak-dir]
  (let [relative-path* (string/replace relative-path repo "")
        bak-dir (node-path/join repo bak-dir)
        path (node-path/join bak-dir relative-path*)
        parsed-path (node-path/parse path)]
    (node-path/join (.-dir parsed-path)
                    (.-name parsed-path))))

(defn get-backup-dir
  [repo relative-path]
  (get-backup-dir* repo relative-path backup-dir))

(defn get-version-file-dir
  [repo relative-path]
  (get-backup-dir* repo relative-path version-file-dir))

(defn- truncate-old-versioned-files!
  "reserve the latest `keep-versions` version files"
  [dir keep-versions]
  (let [files (fs/readdirSync dir (clj->js {:withFileTypes true}))
        files (mapv #(.-name %) files)
        old-versioned-files (drop keep-versions (reverse (sort files)))]
    (doseq [file old-versioned-files]
      (fs-extra/removeSync (node-path/join dir file)))))

(defn- parse-backup-ts
  "Backup filenames are like: 2025-12-25T01_23_45.678Z.ext
   We turn '_' back into ':' and parse as ISO."
  [filename]
  (let [base (-> filename
                 ;; drop extension (keep last '.' part)
                 (string/replace #"\.[^./]+$" "")
                 (string/replace "_" ":"))
        ms   (.parse js/Date base)]
    (when-not (js/isNaN ms) ms)))

(defn- truncate-daily-versioned-files!
  "Keep the latest `keep-versions` version files, but:
   - the newest 6 kept are deduped per-hour (keep newest file per hour)
   - the remaining kept (if any) are deduped per-day (keep newest file per day)

   Example: keep-versions=12 => 6 hourly + 6 daily."
  [dir keep-versions]
  (let [keep-versions (max 0 (or keep-versions 0))
        keep-hourly   (min 6 keep-versions)

        ;; list file names (ignore directories)
        dirents (fs/readdirSync dir (clj->js {:withFileTypes true}))
        files   (->> dirents
                     (filter #(.-isFile %))
                     (mapv #(.-name %)))

        ;; sort newest -> oldest primarily by parsed timestamp; fall back to name
        files* (->> files
                    (map (fn [n] {:name n :ts (or (parse-backup-ts n) -1)}))
                    (sort-by (juxt (comp - :ts) :name))
                    (mapv :name))

        ;; decide which files to keep
        keep-set
        (loop [xs files*
               kept #{}
               kept-count 0
               hour-seen #{}
               day-seen #{}]
          (if (or (empty? xs) (>= kept-count keep-versions))
            kept
            (let [f (first xs)
                  ts (parse-backup-ts f)
                  ;; derive keys; if unparseable, treat as unique bucket
                  hour-key (if ts
                             (.toISOString (js/Date. (-> ts
                                                         (js/Math.floor)
                                                         (- (mod ts 3600000)))))
                             (str "unparseable-hour:" f))
                  day-key  (if ts
                             (.slice (.toISOString (js/Date. ts)) 0 10)
                             (str "unparseable-day:" f))]
              (cond
                ;; Phase 1: hourly buckets (newest 6 hours)
                (< (count hour-seen) keep-hourly)
                (if (contains? hour-seen hour-key)
                  (recur (rest xs) kept kept-count hour-seen day-seen)
                  (recur (rest xs)
                         (conj kept f)
                         (inc kept-count)
                         (conj hour-seen hour-key)
                         day-seen))

                ;; Phase 2: daily buckets (fill remaining up to keep-versions)
                :else
                (if (contains? day-seen day-key)
                  (recur (rest xs) kept kept-count hour-seen day-seen)
                  (recur (rest xs)
                         (conj kept f)
                         (inc kept-count)
                         hour-seen
                         (conj day-seen day-key)))))))

        ;; remove everything not in keep-set
        to-remove (remove keep-set files)]
    (doseq [file to-remove]
      (fs-extra/removeSync (node-path/join dir file)))))

(defn- latest-backup-info
  "Return {:name .. :ts .. :size ..} for the latest backup in dir, or nil.
   Prefers timestamp parsed from filename; falls back to file mtimeMs."
  [dir]
  (let [dirents (fs/readdirSync dir (clj->js {:withFileTypes true}))
        files   (->> dirents (filter #(.-isFile %)) (map #(.-name %)))]
    (when (seq files)
      (->> files
           (map (fn [name]
                  (let [p    (node-path/join dir name)
                        stat (fs/statSync p)
                        ts   (or (parse-backup-ts name) (.-mtimeMs stat))]
                    {:name name
                     :ts   ts
                     :size (.-size stat)})))
           (apply max-key :ts)))))

(defn- too-soon?
  [dir]
  (let [info (latest-backup-info dir)
        ;; default: if using daily+hourly retention, don’t create more than 1 per hour
        min-interval-ms 3600000
        now-ms (.now js/Date)
        latest-backup-ts   (:ts info)]
    (and latest-backup-ts
         (pos? min-interval-ms)
         (< (- now-ms latest-backup-ts) min-interval-ms))))

(defn backup-file
  "backup CONTENT under DIR :backup-dir or :version-file-dir
  :backup-dir = `backup-dir`
  :version-file-dir = `version-file-dir`"
  [repo dir relative-path ext content & {:keys [truncate-daily?
                                                keep-versions backups-dir]
                                         :or {keep-versions 6}}]
  (let [dir* (or backups-dir
                 (case dir
                   :backup-dir (get-backup-dir repo relative-path)
                   :version-file-dir (get-version-file-dir repo relative-path)))
        _ (fs-extra/ensureDirSync dir*)
        new-path (node-path/join dir*
                                 (str (string/replace (.toISOString (js/Date.)) ":" "_")
                                      ext))]
    (when-not (and truncate-daily? (too-soon? dir*))
      (fs/writeFileSync new-path content)
      (fs/statSync new-path)
      (if truncate-daily?
        (truncate-daily-versioned-files! dir* keep-versions)
        (truncate-old-versioned-files! dir* keep-versions)))))
