(ns logseq.db-worker.server-list
  "Helpers for the centralized db-worker-node server-list file."
  (:require [clojure.string :as string]
            ["fs" :as fs]
            ["path" :as node-path]))

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
  [path]
  (if (and (seq path) (fs/existsSync path))
    (->> (.toString (fs/readFileSync path) "utf8")
         string/split-lines
         (keep parse-line)
         vec)
    []))

(defn rewrite-entries!
  [path entries]
  (when (seq path)
    (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
    (let [payload (if (seq entries)
                    (str (string/join "\n" (map (fn [{:keys [pid port]}]
                                                     (str pid " " port))
                                                   entries))
                         "\n")
                    "")]
      (fs/writeFileSync path payload "utf8"))))

(defn append-entry!
  [path {:keys [pid port] :as entry}]
  (when (and (seq path) (pos-int? pid) (pos-int? port))
    (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
    (fs/appendFileSync path (str pid " " port "\n") "utf8")
    entry))

(defn remove-entry!
  [path {:keys [pid port]}]
  (when (seq path)
    (let [entries (->> (read-entries path)
                       (remove (fn [entry]
                                 (and (= pid (:pid entry))
                                      (= port (:port entry)))))
                       vec)]
      (rewrite-entries! path entries))))
