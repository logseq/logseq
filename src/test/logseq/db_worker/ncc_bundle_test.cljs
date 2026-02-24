(ns logseq.db-worker.ncc-bundle-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [logseq.db :as ldb]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]
            ["child_process" :as child-process]
            ["fs" :as fs]
            ["path" :as node-path]))

(defonce ^:private bundle-built? (atom false))

(defn- repo-root
  []
  (.cwd js/process))

(defn- dist-path
  [& segments]
  (apply node-path/join (repo-root) "dist" segments))

(defn- absolute-path
  [path]
  (node-path/resolve path))

(defn- run-bundle-build!
  []
  (.execFileSync child-process
                 "yarn"
                 #js ["db-worker-node:release:bundle"]
                 #js {:cwd (repo-root)
                      :encoding "utf8"}))

(defn- ensure-bundle-built!
  []
  (when-not @bundle-built?
    (run-bundle-build!)
    (reset! bundle-built? true)))

(defn- read-asset-manifest
  []
  (let [manifest-path (dist-path "db-worker-node-assets.json")]
    (js->clj (js/JSON.parse (.toString (fs/readFileSync manifest-path) "utf8"))
             :keywordize-keys true)))

(defn- write-asset-manifest!
  [manifest]
  (let [manifest-path (dist-path "db-worker-node-assets.json")
        payload (str (js/JSON.stringify (clj->js manifest) nil 2) "\n")]
    (fs/writeFileSync manifest-path payload "utf8")))

(defn- copy-file!
  [source destination]
  (fs/mkdirSync (node-path/dirname destination) #js {:recursive true})
  (fs/copyFileSync source destination))

(defn- copy-bundle-to-temp!
  []
  (let [runtime-dir (absolute-path (node-helper/create-tmp-dir "db-worker-node-bundle-runtime"))
        manifest (read-asset-manifest)
        assets (vec (:assets manifest))
        entry-source (dist-path "db-worker-node.js")
        entry-destination (node-path/join runtime-dir "db-worker-node.js")]
    (copy-file! entry-source entry-destination)
    (doseq [asset assets]
      (copy-file! (dist-path asset)
                  (node-path/join runtime-dir asset)))
    {:runtime-dir runtime-dir
     :assets assets}))

(defn- lock-path
  [data-dir repo]
  (node-path/join (db-lock/repo-dir data-dir repo) "db-worker.lock"))

(defn- spawn-daemon!
  [runtime-dir repo data-dir]
  (let [child (.spawn child-process
                      "node"
                      #js ["./db-worker-node.js"
                           "--repo" repo
                           "--data-dir" data-dir
                           "--owner-source" "cli"]
                      #js {:cwd runtime-dir})
        stdout (atom "")
        stderr (atom "")]
    (.on (.-stdout child)
         "data"
         (fn [chunk]
           (swap! stdout str (.toString chunk "utf8"))))
    (.on (.-stderr child)
         "data"
         (fn [chunk]
           (swap! stderr str (.toString chunk "utf8"))))
    {:child child
     :stdout stdout
     :stderr stderr}))

(defn- invoke
  [host port method args]
  (let [payload (js/JSON.stringify
                 (clj->js {:method method
                           :directPass false
                           :argsTransit (ldb/write-transit-str args)}))]
    (daemon/http-request {:method "POST"
                          :host host
                          :port port
                          :path "/v1/invoke"
                          :headers {"Content-Type" "application/json"}
                          :timeout-ms 5000
                          :body payload})))

(deftest bundle-only-daemon-startup-smoke-test
  (async done
         (let [child* (atom nil)]
           (-> (p/let [_ (ensure-bundle-built!)
                       {:keys [runtime-dir]} (copy-bundle-to-temp!)
                       data-dir (absolute-path (node-helper/create-tmp-dir "db-worker-node-bundle-data"))
                       repo (str "logseq_db_ncc_smoke_" (subs (str (random-uuid)) 0 8))
                       lock-file (lock-path data-dir repo)
                       {:keys [child]} (spawn-daemon! runtime-dir repo data-dir)
                       _ (reset! child* child)
                       _ (daemon/wait-for-lock lock-file)
                       lock (daemon/read-lock lock-file)
                       _ (is (some? lock))
                       health (daemon/http-request {:method "GET"
                                                    :host (:host lock)
                                                    :port (:port lock)
                                                    :path "/healthz"
                                                    :timeout-ms 1000})
                       ready (daemon/http-request {:method "GET"
                                                   :host (:host lock)
                                                   :port (:port lock)
                                                   :path "/readyz"
                                                   :timeout-ms 1000})
                       shutdown (daemon/http-request {:method "POST"
                                                      :host (:host lock)
                                                      :port (:port lock)
                                                      :path "/v1/shutdown"
                                                      :headers {"Content-Type" "application/json"}
                                                      :timeout-ms 2000})
                       _ (is (= 200 (:status health)))
                       _ (is (= 200 (:status ready)))
                       _ (is (= 200 (:status shutdown)))
                       _ (daemon/wait-for (fn []
                                            (p/resolved (not (fs/existsSync lock-file))))
                                          {:timeout-ms 10000
                                           :interval-ms 200})]
                 (is (not (fs/existsSync lock-file)))
                 (done))
               (p/catch (fn [e]
                          (when-let [^js child @child*]
                            (try
                              (.kill child "SIGTERM")
                              (catch :default _)))
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest bundle-daemon-starts-with-empty-asset-manifest
  (async done
         (let [child* (atom nil)
               original-manifest* (atom nil)]
           (-> (p/let [_ (ensure-bundle-built!)
                       original-manifest (read-asset-manifest)
                       _ (reset! original-manifest* original-manifest)
                       _ (write-asset-manifest! (assoc original-manifest :assets []))
                       {:keys [runtime-dir]} (copy-bundle-to-temp!)
                       data-dir (absolute-path (node-helper/create-tmp-dir "db-worker-node-bundle-empty-assets"))
                       repo (str "logseq_db_ncc_empty_assets_" (subs (str (random-uuid)) 0 8))
                       lock-file (lock-path data-dir repo)
                       {:keys [child]} (spawn-daemon! runtime-dir repo data-dir)
                       _ (reset! child* child)
                       _ (daemon/wait-for-lock lock-file)
                       lock (daemon/read-lock lock-file)
                       _ (is (some? lock))
                       health (daemon/http-request {:method "GET"
                                                    :host (:host lock)
                                                    :port (:port lock)
                                                    :path "/healthz"
                                                    :timeout-ms 1000})
                       ready (daemon/http-request {:method "GET"
                                                   :host (:host lock)
                                                   :port (:port lock)
                                                   :path "/readyz"
                                                   :timeout-ms 1000})
                       create-db (invoke (:host lock)
                                         (:port lock)
                                         "thread-api/create-or-open-db"
                                         [repo {}])
                       create-db-body (js->clj (js/JSON.parse (:body create-db))
                                               :keywordize-keys true)
                       shutdown (daemon/http-request {:method "POST"
                                                      :host (:host lock)
                                                      :port (:port lock)
                                                      :path "/v1/shutdown"
                                                      :headers {"Content-Type" "application/json"}
                                                      :timeout-ms 2000})
                       _ (is (= 200 (:status health)))
                       _ (is (= 200 (:status ready)))
                       _ (is (= 200 (:status create-db)))
                       _ (is (:ok create-db-body))
                       _ (is (= 200 (:status shutdown)))
                       _ (daemon/wait-for (fn []
                                           (p/resolved (not (fs/existsSync lock-file))))
                                          {:timeout-ms 10000
                                           :interval-ms 200})]
                 (is (not (fs/existsSync lock-file))))
               (p/catch (fn [e]
                          (when-let [^js child @child*]
                            (try
                              (.kill child "SIGTERM")
                              (catch :default _)))
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (when-let [manifest @original-manifest*]
                              (write-asset-manifest! manifest))
                            (done)))))))

(deftest bundle-errors-are-actionable-when-manifest-or-entry-is-missing
  (let [_ (ensure-bundle-built!)
        manifest-path (dist-path "db-worker-node-assets.json")
        manifest-backup-path (dist-path "db-worker-node-assets.json.bak")
        _ (when (fs/existsSync manifest-backup-path)
            (fs/unlinkSync manifest-backup-path))
        _ (fs/renameSync manifest-path manifest-backup-path)
        missing-manifest-error (try
                                 (read-asset-manifest)
                                 nil
                                 (catch :default e
                                   e))
        _ (fs/renameSync manifest-backup-path manifest-path)
        {:keys [runtime-dir]} (copy-bundle-to-temp!)
        missing-entry-path (node-path/join runtime-dir "db-worker-node.js")
        _ (fs/unlinkSync missing-entry-path)
        data-dir (absolute-path (node-helper/create-tmp-dir "db-worker-node-bundle-missing-entry"))
        repo (str "logseq_db_ncc_missing_entry_" (subs (str (random-uuid)) 0 8))
        result (.spawnSync child-process
                           "node"
                           #js ["./db-worker-node.js"
                                "--repo" repo
                                "--data-dir" data-dir
                                "--owner-source" "cli"]
                           #js {:cwd runtime-dir
                                :encoding "utf8"})
        status (.-status result)
        output (str (or (.-stderr result) "")
                    (or (.-stdout result) ""))]
    (is (some? missing-manifest-error))
    (is (string/includes? (str missing-manifest-error) "db-worker-node-assets.json"))
    (is (string/includes? (str missing-manifest-error) "ENOENT"))
    (is (not= 0 status))
    (is (string/includes? output "db-worker-node.js"))
    (is (or (string/includes? output "Cannot find module")
            (string/includes? output "MODULE_NOT_FOUND")))))
