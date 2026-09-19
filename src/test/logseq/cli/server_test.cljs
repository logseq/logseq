(ns logseq.cli.server-test
  {:clj-kondo/config '{:linters {:private-var-access {:level :off}}}}
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.server :as cli-server]
            [logseq.cli.test-helper :as test-helper]
            [logseq.db-worker.daemon :as daemon]
            [logseq.db-worker.server-list :as server-list]
            [promesa.core :as p]))

(deftest db-worker-runtime-script-path-matches-runtime-selection
  (is (= (cli-server/db-worker-script-path)
         (cli-server/db-worker-runtime-script-path))))

(deftest db-worker-release-script-path-supports-cli-packaged-layout
  (is (= (node-path/join "/tmp/app.asar/js" "db-worker-node.js")
         (#'cli-server/db-worker-release-script-path-from "/tmp/app.asar/js"))))

(deftest db-worker-release-script-path-supports-electron-packaged-layout
  (is (= (node-path/join "/tmp/app.asar" "js" "db-worker-node.js")
         (#'cli-server/db-worker-release-script-path-from "/tmp/app.asar"))))

(deftest ensure-server-preserves-generation-and-owner
  (async done
    (-> (test-helper/with-js-property-override
         lifecycle "startGraph"
         (fn [_] (p/resolved #js {:repo "logseq_db_demo" :host "127.0.0.1" :port 9400
                                  :revision "expected" :generation "instance-1" :owner-source "cli"}))
         #(cli-server/ensure-server! {:root-dir "/tmp" :expected-revision "expected"
                                     :owner-source :electron} "demo"))
        (p/then (fn [result]
                  (is (= "instance-1" (:generation result)))
                  (is (= false (:owned? result)))
                  (is (= "http://127.0.0.1:9400" (:base-url result)))))
        (p/catch #(is false (str %)))
        (p/finally done))))

(deftest revision-mismatch-restarts-across-owner-sources
  (async done
    (let [starts (atom 0)
          stops (atom [])]
      (-> (test-helper/with-js-property-override
           lifecycle "startGraph"
           (fn [_] (p/resolved #js {:repo "demo" :host "127.0.0.1" :port 9400
                                    :revision (if (= 1 (swap! starts inc)) "old" "expected")
                                    :owner-source "cli"}))
           #(test-helper/with-js-property-override
             lifecycle "stopGraph"
             (fn [_ repo owner] (swap! stops conj [repo owner]) (p/resolved nil))
             (fn [] (cli-server/ensure-server! {:root-dir "/tmp" :owner-source :electron
                                                :expected-revision "expected"} "demo"))))
          (p/then (fn [_]
                    (is (= 2 @starts))
                    (is (= [["demo" "cli"]] @stops))))
          (p/catch #(is false (str %)))
          (p/finally done)))))

(deftest stop-failure-is-returned-without-success
  (async done
    (-> (test-helper/with-js-property-override
         lifecycle "stopGraph"
         (fn [& _] (p/rejected (js/Object.assign (js/Error. "Worker remains alive")
                                                 #js {:code "server-stop-timeout"})))
         #(cli-server/stop-server! {:root-dir "/tmp"} "demo"))
        (p/then (fn [result]
                  (is (false? (:ok? result)))
                  (is (= :server-stop-timeout (get-in result [:error :code])))))
        (p/catch #(is false (str %)))
        (p/finally done))))

(deftest list-servers-reads-server-list-and-healthz-details
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-list-revision")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (server-list/path root-dir)
               repo (str "logseq_db_list_revision_" (subs (str (random-uuid)) 0 8))
               host "127.0.0.1"
               port* (atom nil)
               server (http/createServer
                       (fn [^js req ^js res]
                         (case (.-url req)
                           "/healthz" (do (.writeHead res 200 #js {"Content-Type" "application/json"})
                                          (.end res (js/JSON.stringify #js {:repo repo
                                                                            :status "ready"
                                                                            :host host
                                                                            :port @port*
                                                                            :pid (.-pid js/process)
                                                                            :owner-source "cli"
                                                                            :root-dir root-dir
                                                                            :revision "server-revision"})))
                           (do (.writeHead res 404 #js {"Content-Type" "text/plain"})
                               (.end res "not-found")))))]
           (.listen server 0 host
                    (fn []
                      (let [address (.address server)
                            port (if (number? address) address (.-port address))
                            _ (reset! port* port)]
                        (fs/writeFileSync server-list-file (str (.-pid js/process) " " port "\n"))
                        (-> (cli-server/list-servers {:root-dir root-dir
                                                      :config-path config-path})
                            (p/then (fn [servers]
                                      (is (= 1 (count servers)))
                                      (is (= repo (:repo (first servers))))
                                      (is (= :ready (:status (first servers))))
                                      (is (= root-dir (:root-dir (first servers))))
                                      (is (= "server-revision" (:revision (first servers))))))
                            (p/catch (fn [e]
                                       (is false (str "unexpected error: " e))))
                            (p/finally (fn []
                                         (.close server (fn [] (done))))))))))))

(deftest list-servers-lazily-cleans-stale-server-list-entries
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-list-cleanup")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (server-list/path root-dir)]
           (fs/writeFileSync server-list-file "999999 65535\n")
           (-> (cli-server/list-servers {:root-dir root-dir
                                         :config-path config-path})
               (p/then (fn [servers]
                         (is (empty? servers))
                         (let [contents (when (fs/existsSync server-list-file)
                                          (.toString (fs/readFileSync server-list-file) "utf8"))]
                           (is (or (nil? contents)
                                   (= "" contents))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest list-servers-preserves-concurrent-server-list-writes
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-list-race")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (server-list/path root-dir)
               stale-entry {:pid 999999 :port 65535}
               live-entry {:pid (.-pid js/process) :port 65432}
               appended? (atom false)]
           (fs/writeFileSync server-list-file
                             (str (:pid stale-entry) " " (:port stale-entry) "\n")
                             "utf8")
           (-> (p/with-redefs [daemon/pid-status (fn [pid]
                                                   (when (and (= (:pid stale-entry) pid)
                                                              (not @appended?))
                                                     (reset! appended? true)
                                                     (server-list/append-entry! server-list-file live-entry))
                                                   :not-found)]
                 (cli-server/list-servers {:root-dir root-dir
                                           :config-path config-path}))
               (p/then (fn [servers]
                         (is (empty? servers))
                         (is @appended?)
                         (is (= [live-entry]
                                (server-list/read-entries server-list-file)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest cleanup-revision-mismatched-servers-kills-only-cli-owned-targets
  (async done
         (let [stop-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-servers (fn [_]
                                                         (p/resolved [{:repo "logseq_db_a"
                                                                       :pid 11
                                                                       :owner-source :cli
                                                                       :revision "worker-rev-a"}
                                                                      {:repo "logseq_db_b"
                                                                       :pid 22
                                                                       :owner-source :electron
                                                                       :revision "worker-rev-b"}
                                                                      {:repo "logseq_db_c"
                                                                       :pid 33
                                                                       :owner-source :cli
                                                                       :revision "cli-rev"}
                                                                      {:repo "logseq_db_nil"
                                                                       :pid 44
                                                                       :owner-source :cli
                                                                       :revision nil}]))
                               cli-server/stop-server! (fn [config repo]
                                                         (swap! stop-calls conj {:config config
                                                                                 :repo repo})
                                                         (p/resolved {:ok? true
                                                                      :data {:repo repo}}))]
                 (cli-server/cleanup-revision-mismatched-servers! {:root-dir "/tmp/graphs"} "cli-rev"))
               (p/then (fn [result]
                         (is (= true (:ok? result)))
                         (is (= 4 (get-in result [:data :checked])))
                         (is (= 3 (get-in result [:data :mismatched])))
                         (is (= 2 (get-in result [:data :eligible])))
                         (is (= 1 (get-in result [:data :skipped-owner])))
                         (is (= ["logseq_db_a" "logseq_db_nil"]
                                (mapv :repo (get-in result [:data :killed]))))
                         (is (empty? (get-in result [:data :failed])))
                         (is (= #{"logseq_db_a" "logseq_db_nil"}
                                (set (map :repo @stop-calls))))
                         (is (every? #(= :cli (get-in % [:config :owner-source]))
                                     @stop-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest cleanup-revision-mismatched-servers-reports-failures
  (async done
         (-> (p/with-redefs [cli-server/list-servers (fn [_]
                                                       (p/resolved [{:repo "logseq_db_a"
                                                                     :pid 11
                                                                     :owner-source :cli
                                                                     :revision "worker-rev-a"}
                                                                    {:repo "logseq_db_b"
                                                                     :pid 22
                                                                     :owner-source :cli
                                                                     :revision "worker-rev-b"}]))
                             cli-server/stop-server! (fn [_ repo]
                                                       (p/resolved (if (= "logseq_db_a" repo)
                                                                     {:ok? true
                                                                      :data {:repo repo}}
                                                                     {:ok? false
                                                                      :error {:code :server-stop-timeout
                                                                              :message "timed out stopping server"}})))]
               (cli-server/cleanup-revision-mismatched-servers! {:root-dir "/tmp/graphs"} "cli-rev"))
             (p/then (fn [result]
                       (is (= true (:ok? result)))
                       (is (= ["logseq_db_a"]
                              (mapv :repo (get-in result [:data :killed]))))
                       (is (= ["logseq_db_b"]
                              (mapv :repo (get-in result [:data :failed]))))
                       (is (= :server-stop-timeout
                              (get-in result [:data :failed 0 :error :code])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest list-graph-items-ignores-non-graph-directories
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-ignore")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["alpha"
                       "backup"
                       "foo~2G"
                       "Unlinked graphs"
                       "logseq_local_1"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})]
    (is (= [{:kind :canonical
             :graph-name "alpha"
             :graph-dir "alpha"}]
           items))))

(deftest list-graph-items-marks-legacy-conflict
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-legacy")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["legacy++name"
                       "legacy~2Fname"
                       "bad%ZZname"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})
        by-kind (group-by :kind items)
        legacy-item (first (get by-kind :legacy))
        undecodable-item (first (get by-kind :legacy-undecodable))]
    (is (= "legacy/name" (:legacy-graph-name legacy-item)))
    (is (= "legacy~2Fname" (:target-graph-dir legacy-item)))
    (is (= true (:conflict? legacy-item)))
    (is (= "bad%ZZname" (:legacy-dir undecodable-item)))))

(deftest list-graph-items-treats-percent-encoded-dir-as-legacy-when-non-canonical
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-percent-legacy")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["yy y"
                       "yy~20y"
                       "yy%20y"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})
        by-kind (group-by :kind items)
        canonical-item (first (get by-kind :canonical))
        legacy-items (get by-kind :legacy)
        legacy-by-dir (into {} (map (juxt :legacy-dir identity) legacy-items))]
    (is (= "yy y" (:graph-dir canonical-item)))
    (is (= "yy y" (:graph-name canonical-item)))
    (is (= #{"yy~20y" "yy%20y"}
           (set (map :legacy-dir legacy-items))))
    (doseq [legacy-dir ["yy~20y" "yy%20y"]]
      (let [legacy-item (get legacy-by-dir legacy-dir)]
        (is (= "yy y" (:legacy-graph-name legacy-item)))
        (is (= "yy y" (:target-graph-dir legacy-item)))
        (is (= true (:conflict? legacy-item)))))))
