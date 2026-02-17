(ns logseq.db-worker.ncc-bundle-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node-lock :as db-lock]
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

(deftest bundle-missing-native-asset-has-actionable-error
  (let [_ (ensure-bundle-built!)
        {:keys [runtime-dir assets]} (copy-bundle-to-temp!)
        native-asset (first (filter #(string/ends-with? % ".node") assets))]
    (is (some? native-asset))
    (when native-asset
      (let [missing-path (node-path/join runtime-dir native-asset)
            _ (fs/unlinkSync missing-path)
            data-dir (absolute-path (node-helper/create-tmp-dir "db-worker-node-bundle-missing-asset"))
            repo (str "logseq_db_ncc_missing_" (subs (str (random-uuid)) 0 8))
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
                        (or (.-stdout result) ""))
            missing-file (node-path/basename missing-path)]
        (is (not= 0 status))
        (is (or (string/includes? output missing-file)
                (string/includes? output "Cannot find module")
                (string/includes? output "could not locate the bindings file")))))))
