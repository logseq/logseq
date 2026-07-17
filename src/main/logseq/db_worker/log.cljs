(ns logseq.db-worker.log
  "Unified db-worker-node logging."
  (:require [logseq.melange.bridge.common.api :as melange-common]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [goog.log :as glog]
            [lambdaisland.glogi :as log]
            [logseq.cli.root-dir :as root-dir]))

(def stdio-redirected-env "LOGSEQ_DB_WORKER_NODE_STDIO_REDIRECTED_TO_LOG")

(defonce ^:private *installed (atom nil))
(defonce ^:private *writing? (atom false))
(defonce ^:private *forwarding? (atom false))

(defn- pad2
  [value]
  (if (< value 10)
    (str "0" value)
    (str value)))

(defn- yyyymmdd
  [^js date]
  (str (.getFullYear date)
       (pad2 (inc (.getMonth date)))
       (pad2 (.getDate date))))

(defn resolve-root-dir
  [root-dir]
  (root-dir/normalize-root-dir root-dir))

(defn graphs-dir
  [root-dir]
  (root-dir/graphs-dir (resolve-root-dir root-dir)))

(defn repo-dir
  [root-dir repo]
  (when-not (seq repo)
    (throw (ex-info "repo is required" {:code :missing-repo})))
  (node-path/join (graphs-dir root-dir)
                  (melange-common/repo-to-encoded-graph-dir-name repo)))

(defn log-path
  [root-dir repo]
  (node-path/join (repo-dir root-dir repo)
                  (str "db-worker-node-" (yyyymmdd (js/Date.)) ".log")))

(defn- log-files
  [graph-dir-path]
  (->> (when (fs/existsSync graph-dir-path)
         (fs/readdirSync graph-dir-path))
       (filter (fn [^js name]
                 (re-matches #"db-worker-node-\d{8}\.log" name)))
       (sort)))

(defn enforce-retention!
  [graph-dir-path]
  (let [files (log-files graph-dir-path)
        excess (max 0 (- (count files) 7))]
    (doseq [name (take excess files)]
      (fs/unlinkSync (node-path/join graph-dir-path name)))))

(defn- ensure-log-file!
  [{:keys [root-dir repo]}]
  (let [graph-dir-path (repo-dir root-dir repo)
        file-path (log-path root-dir repo)]
    (fs/mkdirSync graph-dir-path #js {:recursive true})
    (fs/writeFileSync file-path "" #js {:flag "a"})
    (enforce-retention! graph-dir-path)
    {:repo-dir graph-dir-path
     :file-path file-path}))

(defn- format-glogi-line
  [{:keys [time level message logger-name exception]}]
  (let [ts (.toISOString (js/Date. time))
        base (str ts
                  " ["
                  (name level)
                  "] ["
                  logger-name
                  "] "
                  (pr-str message))]
    (str base (when exception (str " " (pr-str exception))) "\n")))

(defn- goog-get-level
  [^js logger]
  (if (exists? glog/getLevel)
    (^:cljs.analyzer/no-resolve glog/getLevel logger)
    (.getLevel logger)))

(defn- current-root-level
  []
  (let [level (goog-get-level log/root-logger)]
    (some (fn [[k v]]
            (when (= v level)
              k))
          log/levels)))

(defn- value->text
  ([value] (value->text value nil))
  ([value encoding]
   (cond
     (nil? value)
     ""

     (string? value)
     value

     (instance? js/Error value)
     (or (.-stack value) (.-message value) (str value))

     (and encoding
          (exists? js/Buffer)
          (.isBuffer js/Buffer value))
     (.toString value encoding)

     (and value (fn? (.-toString value)))
     (.toString value)

     :else
     (str value))))

(defn- args->text
  [args]
  (->> args
       (map value->text)
       (string/join " ")))

(defn- chunk-args->text
  [args]
  (let [payload (first args)
        encoding (when (string? (second args))
                   (second args))]
    (value->text payload encoding)))

(defn- append-lines!
  [file-path source text]
  (when-not (or @*writing? @*forwarding?)
    (reset! *writing? true)
    (try
      (let [text (string/replace (str text) #"\r\n?" "\n")
            text (string/replace text #"\n$" "")
            lines (if (string/blank? text)
                    [""]
                    (string/split text #"\n"))]
        (doseq [line lines]
          (fs/appendFileSync file-path
                             (str (.toISOString (js/Date.))
                                  " [stdio] ["
                                  source
                                  "] "
                                  line
                                  "\n"))))
      (finally
        (reset! *writing? false)))))

(defn- call-original
  [f this args]
  (reset! *forwarding? true)
  (try
    (.apply f this (to-array args))
    (finally
      (reset! *forwarding? false))))

(defn- call-print-original
  [f value]
  (reset! *forwarding? true)
  (try
    (f value)
    (finally
      (reset! *forwarding? false))))

(defn- wrap-print!
  [{:keys [file-path stdio-redirected?] :as state}]
  (let [original-print-fn *print-fn*
        original-print-err-fn *print-err-fn*]
    (set-print-fn!
     (fn [value]
       (append-lines! file-path "stdout" value)
       (when-not stdio-redirected?
         (call-print-original original-print-fn value))))
    (set-print-err-fn!
     (fn [value]
       (append-lines! file-path "stderr" value)
       (when-not stdio-redirected?
         (call-print-original original-print-err-fn value))))
    (assoc state
           :original-print-fn original-print-fn
           :original-print-err-fn original-print-err-fn)))

(defn- wrap-console!
  [{:keys [file-path stdio-redirected?] :as state}]
  (let [original-log (.-log js/console)
        original-warn (.-warn js/console)
        original-error (.-error js/console)]
    (set! (.-log js/console)
          (fn [& args]
            (append-lines! file-path "console.log" (args->text args))
            (when-not stdio-redirected?
              (call-original original-log js/console args))))
    (set! (.-warn js/console)
          (fn [& args]
            (append-lines! file-path "console.warn" (args->text args))
            (when-not stdio-redirected?
              (call-original original-warn js/console args))))
    (set! (.-error js/console)
          (fn [& args]
            (append-lines! file-path "console.error" (args->text args))
            (when-not stdio-redirected?
              (call-original original-error js/console args))))
    (assoc state
           :original-console-log original-log
           :original-console-warn original-warn
           :original-console-error original-error)))

(defn- wrap-stream!
  [stream source file-path stdio-redirected?]
  (let [original-write (.-write stream)]
    (set! (.-write stream)
          (fn [& args]
            (append-lines! file-path source (chunk-args->text args))
            (if stdio-redirected?
              true
              (call-original original-write stream args))))
    original-write))

(defn- wrap-streams!
  [{:keys [file-path stdio-redirected?] :as state}]
  (assoc state
         :original-stdout-write (wrap-stream! (.-stdout js/process) "stdout" file-path stdio-redirected?)
         :original-stderr-write (wrap-stream! (.-stderr js/process) "stderr" file-path stdio-redirected?)))

(defn uninstall!
  []
  (when-let [{:keys [handler
                     original-print-fn
                     original-print-err-fn
                     original-console-log
                     original-console-warn
                     original-console-error
                     original-stdout-write
                     original-stderr-write
                     original-root-level]} @*installed]
    (when handler
      (log/remove-handler handler))
    (when original-print-fn
      (set-print-fn! original-print-fn))
    (when original-print-err-fn
      (set-print-err-fn! original-print-err-fn))
    (when original-console-log
      (set! (.-log js/console) original-console-log))
    (when original-console-warn
      (set! (.-warn js/console) original-console-warn))
    (when original-console-error
      (set! (.-error js/console) original-console-error))
    (when original-stdout-write
      (set! (.-write (.-stdout js/process)) original-stdout-write))
    (when original-stderr-write
      (set! (.-write (.-stderr js/process)) original-stderr-write))
    (when original-root-level
      (log/set-level :glogi/root original-root-level))
    (reset! *installed nil)))

(defn install!
  [{:keys [root-dir repo log-level]}]
  (uninstall!)
  (let [{:keys [file-path]} (ensure-log-file! {:root-dir root-dir :repo repo})
        stdio-redirected? (= "1" (aget (.-env js/process) stdio-redirected-env))
        original-root-level (current-root-level)
        handler (fn [record]
                  (when-not @*forwarding?
                    (fs/appendFileSync file-path (format-glogi-line record))))
        state (-> {:file-path file-path
                   :handler handler
                   :original-root-level original-root-level
                   :stdio-redirected? stdio-redirected?}
                  wrap-print!
                  wrap-console!
                  wrap-streams!)]
    (log/add-handler handler)
    (log/set-levels {:glogi/root (or log-level :info)})
    (reset! *installed state)
    file-path))

(defn child-stdio!
  [{:keys [root-dir repo]}]
  (let [{:keys [file-path]} (ensure-log-file! {:root-dir root-dir :repo repo})
        stdout-fd (fs/openSync file-path "a")]
    (try
      (let [stderr-fd (fs/openSync file-path "a")]
        {:stdio #js ["ignore" stdout-fd stderr-fd]
         :close! (fn []
                   (fs/closeSync stdout-fd)
                   (fs/closeSync stderr-fd))})
      (catch :default e
        (fs/closeSync stdout-fd)
        (throw e)))))
