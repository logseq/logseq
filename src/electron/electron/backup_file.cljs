(ns electron.backup-file
  (:require [clojure.string :as string]
            ["path" :as node-path]
            ["fs" :as fs]
            ["fs-extra" :as fs-extra]))

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

;; TODO: add interval support like days
(defn- truncate-old-versioned-files!
  "reserve the latest 6 version files"
  [dir]
  (let [files (fs/readdirSync dir (clj->js {:withFileTypes true}))
        files (mapv #(.-name %) files)
        old-versioned-files (drop 6 (reverse (sort files)))]
    (doseq [file old-versioned-files]
      (fs-extra/removeSync (node-path/join dir file)))))

(defn backup-file
  "backup CONTENT under DIR :backup-dir or :version-file-dir
  :backup-dir = `backup-dir`
  :version-file-dir = `version-file-dir`"
  [repo dir relative-path ext content & {:keys [add-desktop? skip-backup-fn]
                                         :or {add-desktop? true}}]
  {:pre [(contains? #{:backup-dir :version-file-dir} dir)]}
  (let [dir* (case dir
               :backup-dir (get-backup-dir repo relative-path)
               :version-file-dir (get-version-file-dir repo relative-path))
        _ (fs-extra/ensureDirSync dir*)
        backups (fs/readdirSync dir*)
        latest-backup-size (when (seq backups)
                             (some->> (nth backups (dec (count backups)))
                                      (node-path/join dir*)
                                      (fs/statSync)
                                      (.-size)))]
    (when-not (and (fn? skip-backup-fn) latest-backup-size (skip-backup-fn latest-backup-size))
      (let [new-path (node-path/join dir*
                                     (str (string/replace (.toISOString (js/Date.)) ":" "_")
                                          (when add-desktop? ".Desktop")
                                          ext))]
        (fs/writeFileSync new-path content)
        (fs/statSync new-path)
        (truncate-old-versioned-files! dir*)))))
