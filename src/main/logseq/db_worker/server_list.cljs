(ns logseq.db-worker.server-list
  "Helpers for the centralized db-worker-node server-list file."
  (:require [clojure.string :as string]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn path
  [root-dir-path]
  (when-not (seq root-dir-path)
    (throw (js/Error. "root-dir is required")))
  (node-path/join root-dir-path "server-list"))

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
  (if (and (seq file-path) (fs/existsSync file-path))
    (->> (.toString (fs/readFileSync file-path) "utf8")
         string/split-lines
         (keep parse-line)
         vec)
    []))

(defn rewrite-entries!
  [file-path entries]
  (when (seq file-path)
    (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
    (let [payload (if (seq entries)
                    (str (string/join "\n" (map (fn [{:keys [pid port]}]
                                                     (str pid " " port))
                                                   entries))
                         "\n")
                    "")]
      (fs/writeFileSync file-path payload "utf8"))))

(defn append-entry!
  [file-path {:keys [pid port] :as entry}]
  (when (and (seq file-path) (pos-int? pid) (pos-int? port))
    (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
    (fs/appendFileSync file-path (str pid " " port "\n") "utf8")
    entry))

(defn remove-entry!
  [file-path {:keys [pid port]}]
  (when (seq file-path)
    (let [entries (->> (read-entries file-path)
                       (remove (fn [entry]
                                 (and (= pid (:pid entry))
                                      (= port (:port entry)))))
                       vec)]
      (rewrite-entries! file-path entries))))
