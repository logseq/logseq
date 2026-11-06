(ns frontend.worker.handler.clock-history-import-test
  "Checks that clock history imported from OG logbooks is derived by the
  existing task-time algorithm, without importer-specific duration logic."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [frontend.worker.handler.query :as query-handler]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [promesa.core :as p]))

(def ^:private og-graph
  (str
   "- TODO todo one clock\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:15]--[2024-01-03 Wed 11:00:15] =>  01:00:00\n"
   "  :END:\n"
   "- DONE done two clocks\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00\n"
   "  CLOCK: [2024-01-03 Wed 13:00:00]--[2024-01-03 Wed 14:30:00] =>  01:30:00\n"
   "  :END:\n"
   "- DOING doing no logbook\n"
   "- DOING doing completed only\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00\n"
   "  :END:\n"
   "- DOING doing open final\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00\n"
   "  CLOCK: [2024-01-03 Wed 13:00:00]\n"
   "  :END:\n"
   "- DOING doing open only\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 13:00:00]\n"
   "  :END:\n"
   "- DONE duration shorter wins\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 14:00:00] =>  01:15:00\n"
   "  :END:\n"
   "- DONE adjacent boundary\n"
   "  :LOGBOOK:\n"
   "  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00\n"
   "  CLOCK: [2024-01-03 Wed 11:00:00]--[2024-01-03 Wed 12:00:00] =>  01:00:00\n"
   "  :END:\n"))

(defn- import-og-graph!
  [conn opts]
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-clock-import-test-"))
        file (node-path/join dir "pages" "clocks.md")]
    (fs/mkdirSync (node-path/dirname file) #js {:recursive true})
    (fs/writeFileSync file og-graph)
    (reset! gp-block/*export-to-db-graph? true)
    (-> (p/let [doc-options (gp-exporter/build-doc-options
                             {:macros {} :file/name-format :triple-lowbar}
                             {:rpath-key ::rpath
                              :notify-user (fn [m] (throw (ex-info (:msg m) m)))
                              :<read-file (fn [f] (p/resolved (str (fs/readFileSync (:path f)))))
                              :default-config {}
                              :user-options (merge {:convert-all-tags? false} opts)})]
          (gp-exporter/export-doc-files conn [{:path file}]
                                        (fn [f] (p/resolved (str (fs/readFileSync (:path f)))))
                                        doc-options))
        (p/finally (fn [_] (reset! gp-block/*export-to-db-graph? false))))))

(defn- task-time
  "[history seconds] from master's task-spent-time, or nil without history"
  [db title now-ms]
  (let [block (db-test/find-block-by-content db title)]
    (query-handler/task-spent-time db (:db/id block) now-ms)))

(defn- ms [h m s] (date-time-util/local-datetime->ms 2024 1 3 h m s))

(deftest imported-clock-history-derives-existing-task-time
  (async done
    (let [conn (db-test/create-conn)
          now-ms (ms 15 0 0)]
      (db-pipeline/add-listener conn)
      (-> (p/let [_ (import-og-graph! conn {:import-clock-history? true})
                  db @conn
                  seconds #(second (task-time db % now-ms))]
            (testing "completed clocks"
              (is (= 3600 (seconds "todo one clock")))
              (is (= 9000 (seconds "done two clocks")) "1h + 1.5h")
              (is (= 4500 (seconds "duration shorter wins")) "printed 1h15m wins over the 4h range")
              (is (= 7199 (seconds "adjacent boundary"))
                  "the 1ms boundary nudge costs one second because derived time truncates"))
            (testing "Doing with completed clocks only has no running timer"
              (is (= 3600 (seconds "doing completed only")))
              (let [later (+ now-ms (* 10 3600 1000))]
                (is (= 3600 (second (task-time db "doing completed only" later)))
                    "elapsed time does not grow")))
            (testing "Doing without clocks is untracked"
              (is (nil? (task-time db "doing no logbook" now-ms))))
            (testing "open final clock runs from its source start"
              (is (= (+ 3600 7200) (seconds "doing open final")) "1h + 2h from 13:00 to 15:00")
              (is (= (+ 3600 (* 3 3600))
                     (second (task-time db "doing open final" (ms 16 0 0))))))
            (done))
          (p/catch (fn [e] (is false (str e)) (done)))))))
