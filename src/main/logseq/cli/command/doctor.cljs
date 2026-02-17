(ns logseq.cli.command.doctor
  "Doctor command for CLI runtime diagnostics."
  (:require ["fs" :as fs]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.data-dir :as data-dir]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(def entries
  [(core/command-entry ["doctor"]
                       :doctor
                       "Run runtime diagnostics"
                       {:dev-script {:desc "Check static/db-worker-node.js instead of bundled dist runtime"
                                     :coerce :boolean}})])

(defn build-action
  ([]
   (build-action {}))
  ([options]
   {:ok? true
    :action (cond-> {:type :doctor}
              (:dev-script options)
              (assoc :script-path (cli-server/db-worker-dev-script-path)))}))

(defn- doctor-error
  [checks code message]
  {:status :error
   :error {:code code
           :message message
           :checks checks}
   :data {:status :error
          :checks checks}})

(defn- check-db-worker-script
  [action]
  (let [path (or (:script-path action)
                 (cli-server/db-worker-runtime-script-path))]
    (try
      (cond
        (not (fs/existsSync path))
        {:ok? false
         :check {:id :db-worker-script
                 :status :error
                 :code :doctor-script-missing
                 :path path
                 :message (str "db-worker script is missing: " path)}}

        :else
        (let [stat (fs/statSync path)]
          (if-not (.isFile stat)
            {:ok? false
             :check {:id :db-worker-script
                     :status :error
                     :code :doctor-script-unreadable
                     :path path
                     :message (str "db-worker script path is not a file: " path)}}
            (let [constants (.-constants fs)]
              (fs/accessSync path (.-R_OK constants))
              {:ok? true
               :check {:id :db-worker-script
                       :status :ok
                       :path path
                       :message (str "Found readable file: " path)}}))))
      (catch :default e
        {:ok? false
         :check {:id :db-worker-script
                 :status :error
                 :code :doctor-script-unreadable
                 :path path
                 :cause (.-code e)
                 :message (str "db-worker script is not readable: " path)}}))))

(defn- check-data-dir
  [config]
  (try
    (let [path (data-dir/ensure-data-dir! (:data-dir config))]
      {:ok? true
       :check {:id :data-dir
               :status :ok
               :path path
               :message (str "Read/write access confirmed: " path)}})
    (catch :default e
      (let [data (ex-data e)
            code (or (:code data) :data-dir-permission)
            path (or (:path data) (:data-dir config))
            message (or (.-message e)
                        "data-dir check failed")]
        {:ok? false
         :check {:id :data-dir
                 :status :error
                 :code code
                 :path path
                 :cause (:cause data)
                 :message message}}))))

(defn- check-running-servers
  [config]
  (-> (p/let [servers (or (cli-server/list-servers config) [])
              starting (vec (filter #(= :starting (:status %)) servers))]
        (if (seq starting)
          {:ok? true
           :warning? true
           :check {:id :running-servers
                   :status :warning
                   :code :doctor-server-not-ready
                   :servers starting
                   :message (str (count starting)
                                 " server"
                                 (when (> (count starting) 1) "s")
                                 " still starting: "
                                 (string/join ", " (map :repo starting)))}}
          {:ok? true
           :warning? false
           :check {:id :running-servers
                   :status :ok
                   :servers servers
                   :message (if (seq servers)
                              "All running servers are ready"
                              "No running db-worker servers detected")}}))
      (p/catch (fn [e]
                 {:ok? false
                  :check {:id :running-servers
                          :status :error
                          :code :doctor-server-check-failed
                          :message (or (.-message e)
                                       "running server check failed")}}))))

(defn execute-doctor
  [action config]
  (p/let [script-check (check-db-worker-script action)]
    (if-not (:ok? script-check)
      (let [check (:check script-check)]
        (doctor-error [check] (:code check) (:message check)))
      (let [checks [(:check script-check)]
            data-dir-check (check-data-dir config)]
        (if-not (:ok? data-dir-check)
          (let [check (:check data-dir-check)
                checks (conj checks check)]
            (doctor-error checks (:code check) (:message check)))
          (p/let [server-check (check-running-servers config)
                  checks (conj checks (:check data-dir-check) (:check server-check))]
            (if-not (:ok? server-check)
              (let [check (:check server-check)]
                (doctor-error checks (:code check) (:message check)))
              {:status :ok
               :data {:status (if (:warning? server-check) :warning :ok)
                      :checks checks}})))))))
