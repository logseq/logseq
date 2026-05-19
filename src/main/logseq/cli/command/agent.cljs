(ns logseq.cli.command.agent
  "Agent bridge command helpers."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private bridge-spec
  {:dry-run {:desc "Print Codex commands without starting Codex or writing agent-session-id"
             :coerce :boolean}})

(def ^:private bridge-list-spec
  {:all {:desc "Include completed sessions"
         :coerce :boolean}})

(def entries
  [(core/command-entry ["agent" "bridge"]
                       :agent-bridge
                       "Run task agent bridge"
                       bridge-spec
                       {:examples ["logseq agent bridge --graph my-graph"
                                   "logseq agent bridge --graph my-graph --dry-run"]})
   (core/command-entry ["agent" "bridge" "list"]
                       :agent-bridge-list
                       "List agent bridge sessions"
                       bridge-list-spec
                       {:examples ["logseq agent bridge list"
                                   "logseq agent bridge list --all"]})])

(defn- trim-non-empty
  [value]
  (some-> value str string/trim not-empty))

(defn resolve-agent-name
  ([config]
   (resolve-agent-name config {:hostname (.hostname os)}))
  ([config {:keys [hostname]}]
   (let [configured? (contains? config :agent-name)
         configured (trim-non-empty (:agent-name config))
         hostname (trim-non-empty hostname)
         agent-name (if configured?
                      configured
                      hostname)]
     (if (seq agent-name)
       {:ok? true
        :agent-name agent-name}
       {:ok? false
        :error {:code :agent-name-invalid
                :message (if configured?
                           "agent-name in cli.edn must be a non-empty string"
                           "agent-name cannot be resolved from cli.edn or hostname")}}))))

(defn build-action
  [command options repo graph]
  (case command
    :agent-bridge
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for agent bridge"}}
      {:ok? true
       :action {:type :agent-bridge
                :repo repo
                :graph graph
                :dry-run? (boolean (:dry-run options))}})

    :agent-bridge-list
    {:ok? true
     :action {:type :agent-bridge-list
              :all? (boolean (:all options))}}

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown agent command: " command)}}))

(defn- value-ident
  [value]
  (cond
    (keyword? value) value
    (map? value) (:db/ident value)
    :else nil))

(defn- value-title
  [value]
  (cond
    (nil? value) nil
    (string? value) value
    (keyword? value) (name value)
    (map? value) (or (:block/title value)
                     (:name value)
                     (some-> (:db/ident value) name))
    :else (str value)))

(defn- value-titles
  [value]
  (if (and (sequential? value)
           (not (string? value)))
    (keep value-title value)
    (keep value-title [value])))

(defn- task-tag?
  [tag]
  (or (= :logseq.class/Task (value-ident tag))
      (= "Task" (value-title tag))))

(defn- property-key-name
  [k]
  (cond
    (keyword? k) (name k)
    (string? k) k
    :else nil))

(defn- property-value-by-name
  [block property-name]
  (some (fn [[k v]]
          (when (= property-name (property-key-name k))
            v))
        block))

(defn- assignee-values
  [block]
  (->> (concat (mapcat (fn [k]
                         (value-titles (get block k)))
                       ["Assignee" :Assignee :assignee :logseq.property/assignee])
               (value-titles (property-value-by-name block "assignee"))
               (value-titles (property-value-by-name block "Assignee")))
       (keep trim-non-empty)
       set))

(defn- agent-session-id
  [block]
  (or (some (fn [k]
              (trim-non-empty (get block k)))
            ["agent-session-id" :agent-session-id :logseq.property/agent-session-id])
      (some-> (property-value-by-name block "agent-session-id") trim-non-empty)))

(defn routable-task-decision
  [block agent-name]
  (let [uuid (:block/uuid block)
        status-ident (value-ident (:logseq.property/status block))
        assignees (assignee-values block)]
    (cond
      (nil? uuid)
      {:routable? false :reason :missing-stable-uuid}

      (not-any? task-tag? (:block/tags block))
      {:routable? false :reason :missing-task-tag}

      (not= :logseq.property/status.todo status-ident)
      {:routable? false :reason :not-todo}

      (not (contains? assignees agent-name))
      {:routable? false :reason :assignee-mismatch}

      (seq (agent-session-id block))
      {:routable? false :reason :already-routed}

      :else
      {:routable? true})))

(defn routable-task?
  [block agent-name]
  (true? (:routable? (routable-task-decision block agent-name))))

(defn- block-uuid-str
  [block]
  (some-> (:block/uuid block) str))

(defn build-codex-prompt
  [{:keys [graph agent-name block tree-text]}]
  (string/join
   "\n"
   ["You are handling a Logseq AgentBridge task."
    ""
    (str "Graph: " graph)
    (str "Block UUID: " (block-uuid-str block))
    (str "AgentBridge name: " agent-name)
    ""
    "Do not operate outside the target graph."
    "Write task results back into the graph."
    "Report the final status, files changed, commands run, verification, and any blockers."
    ""
    "Task block tree:"
    (or tree-text (:block/title block) "")]))

(defn build-codex-command
  [prompt {:keys [codex-bin]}]
  [(or (trim-non-empty codex-bin) "codex") "exec" "--json" prompt])

(defn- shell-quote
  [value]
  (let [text (str value)]
    (if (re-matches #"[A-Za-z0-9._:/=-]+" text)
      text
      (str "'" (string/replace text #"'" "'\"'\"'") "'"))))

(defn command-preview
  [command]
  (string/join " " (map shell-quote command)))

(defn codex-available?
  [codex-bin]
  (let [result (.spawnSync child-process
                           (or (trim-non-empty codex-bin) "codex")
                           #js ["--version"]
                           #js {:encoding "utf8"})]
    (zero? (or (.-status result) 1))))

(defn parse-codex-session-id-line
  [line]
  (try
    (let [payload (js->clj (js/JSON.parse line) :keywordize-keys true)]
      (or (:session-id payload)
          (:session_id payload)
          (:thread-id payload)
          (:thread_id payload)
          (get-in payload [:session :id])
          (get-in payload [:session :session-id])
          (get-in payload [:session :session_id])
          (get-in payload [:thread :id])
          (get-in payload [:thread :thread-id])
          (get-in payload [:thread :thread_id])))
    (catch :default _
      nil)))

(defn start-codex!
  [command {:keys [on-exit]}]
  (p/create
   (fn [resolve reject]
     (let [bin (first command)
           args (clj->js (vec (rest command)))
           child (.spawn child-process bin args #js {:stdio #js ["ignore" "pipe" "pipe"]})
           settled? (atom false)
           session-id* (atom nil)
           child-closed? (atom false)
           stdout-closed? (atom false)
           exit-code* (atom nil)
           stdout-buffer (atom "")
           settle! (fn [f value]
                     (when-not @settled?
                       (reset! settled? true)
                       (f value)))
           handle-line! (fn [line]
                          (when-let [session-id (parse-codex-session-id-line line)]
                            (reset! session-id* session-id)
                            (settle! resolve {:session session-id
                                              :status :running
                                              :process child})))
           flush-stdout-buffer! (fn []
                                  (when (seq @stdout-buffer)
                                    (handle-line! @stdout-buffer)
                                    (reset! stdout-buffer "")))
           finalize! (fn []
                       (when (and @child-closed? @stdout-closed?)
                         (flush-stdout-buffer!)
                         (when (fn? on-exit)
                           (on-exit @exit-code* @session-id*))
                         (when-not @settled?
                           (if (zero? (or @exit-code* 1))
                             (settle! reject (ex-info "codex exited before reporting a session id"
                                                      {:code :codex-session-id-missing}))
                             (settle! reject (ex-info "codex exited before startup completed"
                                                      {:code :codex-start-failed
                                                       :exit-code @exit-code*}))))))]
       (.on child "error"
            (fn [error]
              (settle! reject (ex-info "failed to start codex"
                                       {:code :codex-start-failed
                                        :cause error}))))
       (.on (.-stdout child) "data"
            (fn [chunk]
              (let [text (str @stdout-buffer (.toString chunk "utf8"))
                    lines (vec (.split text #"\r?\n"))
                    complete-lines (butlast lines)
                    trailing (last lines)]
                (reset! stdout-buffer trailing)
                (doseq [line complete-lines]
                  (handle-line! line)))))
       (.on (.-stdout child) "close"
            (fn []
              (reset! stdout-closed? true)
              (finalize!)))
       (.on (.-stderr child) "data" (fn [_chunk] nil))
       (.on child "close"
            (fn [code _signal]
              (reset! exit-code* code)
              (reset! child-closed? true)
              (finalize!)))))))

(defn session-store-path
  [{:keys [root-dir]}]
  (node-path/join root-dir "agent-bridge-sessions.edn"))

(defn- read-session-store
  [config]
  (let [path (session-store-path config)]
    (if (fs/existsSync path)
      (reader/read-string (fs/readFileSync path "utf8"))
      {:sessions []})))

(defn- write-session-store!
  [config store]
  (let [path (session-store-path config)
        dir (node-path/dirname path)]
    (fs/mkdirSync dir #js {:recursive true})
    (fs/writeFileSync path (pr-str store) "utf8")
    store))

(def ^:private terminal-session-statuses #{:completed :failed})

(defn- merge-session-record
  [existing session]
  (let [merged (merge existing session)]
    (if (and (contains? terminal-session-statuses (:status existing))
             (= :running (:status session)))
      (assoc merged :status (:status existing))
      merged)))

(defn record-session!
  [config session]
  (let [store (read-session-store config)
        sessions (vec (:sessions store))
        session-id (:session session)
        sessions' (if (some #(= session-id (:session %)) sessions)
                    (mapv (fn [existing]
                            (if (= session-id (:session existing))
                              (merge-session-record existing session)
                              existing))
                          sessions)
                    (conj sessions session))]
    (write-session-store! config (assoc store :sessions sessions'))
    session))

(defn update-session-status!
  [config session-id status]
  (record-session! config {:session session-id
                           :status status
                           :updated-at (js/Date.now)}))

(defn list-sessions
  [config {:keys [all?]}]
  (let [sessions (vec (:sessions (read-session-store config)))]
    (if all?
      sessions
      (vec (remove #(= :completed (:status %)) sessions)))))

(defn execute-list
  [action config]
  {:status :ok
   :command :agent-bridge-list
   :data {:sessions (list-sessions config {:all? (:all? action)})}})

(defn- now-iso
  []
  (.toISOString (js/Date.)))

(defn- log-line
  [message]
  (str (now-iso) " " message))

(defn- bridge-error
  [code message]
  {:status :error
   :command :agent-bridge
   :error {:code code
           :message message}})

(defn- log-bridge-exit!
  [{:keys [repo graph agent-name reason exit-code error]}]
  (log/info :agent-bridge-exit
            (cond-> {:reason reason
                     :exit-code exit-code
                     :repo repo
                     :graph graph
                     :agent-name agent-name
                     :message (or (some-> error ex-message)
                                  (some-> error str))}
              (some-> error ex-data :code)
              (assoc :error-code (-> error ex-data :code)))))

(def agent-bridge-registry-page "AgentBridge")

(def agent-bridge-registry-page-query
  '[:find [(pull ?p [:db/id :block/uuid :block/name :block/title]) ...]
    :in $ ?page-name
    :where
    [?p :block/name ?page-name]])

(def registered-agent-query
  '[:find [(pull ?b [:db/id :block/uuid :block/title]) ...]
    :in $ ?page-id ?agent-name
    :where
    [?b :block/parent ?page-id]
    [?b :block/title ?agent-name]])

(defn random-bridge-block-uuid
  []
  (random-uuid))

(defn- first-entity
  [entities]
  (first (filter :db/id entities)))

(defn- registry-page-name
  []
  (common-util/page-name-sanity-lc agent-bridge-registry-page))

(defn- pull-registry-page
  [cfg repo]
  (p/let [pages (transport/invoke cfg :thread-api/q
                                  [repo [agent-bridge-registry-page-query
                                         (registry-page-name)]])]
    (first-entity pages)))

(defn- ensure-registry-page!
  [cfg repo]
  (p/let [existing (pull-registry-page cfg repo)]
    (if (:db/id existing)
      existing
      (p/let [result (transport/invoke cfg :thread-api/apply-outliner-ops
                                       [repo [[:create-page [agent-bridge-registry-page {}]]] {}])
              page-uuid (second result)]
        (if page-uuid
          (transport/invoke cfg :thread-api/pull
                            [repo [:db/id :block/uuid :block/name :block/title] [:block/uuid page-uuid]])
          (pull-registry-page cfg repo))))))

(defn register-agent-bridge!
  [cfg repo agent-name]
  (p/let [page (ensure-registry-page! cfg repo)
          page-id (:db/id page)
          page-uuid (:block/uuid page)
          _ (when-not page-id
              (throw (ex-info "agent bridge registry page not found"
                              {:code :agent-registration-failed})))
          _ (when-not page-uuid
              (throw (ex-info "agent bridge registry page uuid not found"
                              {:code :agent-registration-failed})))
          existing (transport/invoke cfg :thread-api/q
                                     [repo [registered-agent-query page-id agent-name]])]
    (if (first-entity existing)
      true
      (p/let [_ (transport/invoke cfg :thread-api/apply-outliner-ops
                                  [repo [[:insert-blocks [[{:block/title agent-name
                                                            :block/uuid (random-bridge-block-uuid)}]
                                                          page-uuid
                                                          {:outliner-op :insert-blocks
                                                           :sibling? false
                                                           :bottom? true
                                                           :keep-uuid? true}]]]
                                   {}])]
        true))))

(def agent-session-id-property-name "agent-session-id")

(def agent-session-id-property-schema
  {:logseq.property/type :default
   :db/cardinality :db.cardinality/one})

(def agent-session-id-property-query
  '[:find [(pull ?p [:db/id :db/ident :block/name :block/title]) ...]
    :in $ ?property-name
    :where
    [?p :block/name ?property-name]
    [?p :db/ident]])

(defn- pull-agent-session-id-property
  [cfg repo]
  (p/let [properties (transport/invoke cfg :thread-api/q
                                       [repo [agent-session-id-property-query
                                              (common-util/page-name-sanity-lc agent-session-id-property-name)]])]
    (first-entity properties)))

(defn- ensure-agent-session-id-property!
  [cfg repo]
  (p/let [existing (pull-agent-session-id-property cfg repo)]
    (if (:db/ident existing)
      existing
      (p/let [_ (transport/invoke cfg :thread-api/apply-outliner-ops
                                  [repo [[:upsert-property [nil
                                                            agent-session-id-property-schema
                                                            {:property-name agent-session-id-property-name}]]]
                                   {}])
              created (pull-agent-session-id-property cfg repo)]
        (if (:db/ident created)
          created
          (throw (ex-info "agent-session-id property not found after upsert"
                          {:code :agent-session-id-write-failed})))))))

(defn write-agent-session-id!
  [cfg repo block-uuid session-id]
  (p/let [property (ensure-agent-session-id-property! cfg repo)
          property-ident (:db/ident property)
          _ (when-not property-ident
              (throw (ex-info "agent-session-id property ident missing"
                              {:code :agent-session-id-write-failed})))
          _ (transport/invoke cfg :thread-api/apply-outliner-ops
                              [repo [[:batch-set-property [[block-uuid] property-ident session-id {}]]] {}])]
    true))

(def ^:private routable-task-query
  '[:find [(pull ?e [:db/id
                     :block/uuid
                     :block/title
                     {:block/tags [:db/ident :block/title]}
                     {:logseq.property/status [:db/ident :block/title]}
                     *]) ...]
    :in $ ?agent-name
    :where
    [?e :block/tags :logseq.class/Task]
    [?e :logseq.property/status ?status]
    [?status :db/ident :logseq.property/status.todo]
    [?assignee-property :block/name "assignee"]
    [?assignee-property :db/ident ?assignee-attr]
    [?e ?assignee-attr ?assignee-ref]
    [?assignee-ref :block/title ?agent-name]])

(defn list-routable-tasks
  [cfg repo agent-name]
  (p/let [blocks (transport/invoke cfg :thread-api/q [repo [routable-task-query agent-name]])]
    (p/all
     (mapv (fn [block]
             (p/let [show-result (show-command/execute-show {:type :show
                                                             :repo repo
                                                             :uuid (block-uuid-str block)
                                                             :level 100
                                                             :linked-references? false
                                                             :ref-id-footer? false}
                                                            cfg)]
               {:block block
                :tree-text (or (get-in show-result [:data :message])
                               (:block/title block))}))
           (filter #(routable-task? % agent-name)
                   (map #(assoc % "Assignee" agent-name) blocks))))))

(defn- dry-run-commands
  [graph agent-name tasks]
  (mapv (fn [{:keys [block tree-text]}]
          (let [prompt (build-codex-prompt {:graph graph
                                            :agent-name agent-name
                                            :block block
                                            :tree-text tree-text})
                command (build-codex-command prompt {})]
            {:block (block-uuid-str block)
             :backend :codex
             :command command
             :preview (command-preview command)}))
        tasks))

(defn- emit-log!
  [config line]
  (if-let [f (:log-fn config)]
    (f line)
    (.write (.-stdout js/process) (str line "\n"))))

(defn- session-record
  [graph agent-name block session-id status]
  {:session session-id
   :status status
   :backend :codex
   :graph graph
   :block (block-uuid-str block)
   :agent agent-name
   :started-at (js/Date.now)
   :updated-at (js/Date.now)})

(defn- route-task!
  [cfg {:keys [repo graph agent-name]} {:keys [block tree-text]}]
  (let [prompt (build-codex-prompt {:graph graph
                                    :agent-name agent-name
                                    :block block
                                    :tree-text tree-text})
        command (build-codex-command prompt {})
        preview (command-preview command)]
    (emit-log! cfg (log-line (str "Codex command prepared for " (block-uuid-str block) ": " preview)))
    (p/let [{:keys [session]} (start-codex! command
                                            {:on-exit (fn [code session-id]
                                                        (when session-id
                                                          (update-session-status! cfg session-id
                                                                                  (if (zero? (or code 1))
                                                                                    :completed
                                                                                    :failed))))})
            _ (when-not (seq session)
                (throw (ex-info "codex session id missing"
                                {:code :codex-session-id-missing})))
            cfg* (cli-server/ensure-server! cfg repo)
            _ (record-session! cfg* (session-record graph agent-name block session :running))
            _ (write-agent-session-id! cfg* repo (:block/uuid block) session)]
      (emit-log! cfg (log-line (str "agent-session-id written for " (block-uuid-str block))))
      {:block (block-uuid-str block)
       :session session
       :backend :codex
       :preview preview})))

(defn- process-tasks!
  [cfg {:keys [repo graph agent-name]}]
  (p/let [tasks (list-routable-tasks cfg repo agent-name)]
    (p/all (mapv #(route-task! cfg {:repo repo
                                    :graph graph
                                    :agent-name agent-name}
                               %)
                 tasks))))

(def ^:private assignee-property-ident :logseq.property/assignee)

(def ^:private assignee-value-selector
  [:db/id :block/title :block/name])

(def ^:private assignee-property-selector
  [:db/id :db/ident])

(def ^:private task-block-selector
  [:db/id
   :block/uuid
   :block/title
   {:block/tags [:db/ident :block/title]}
   {:logseq.property/status [:db/ident :block/title]}
   {:logseq.property/assignee [:db/id :block/title :block/name :db/ident]}
   '*])

(defn- datom-added?
  [datom]
  (cond
    (map? datom)
    (not (false? (if (contains? datom :added)
                   (:added datom)
                   (:added? datom))))

    (and (sequential? datom) (<= 5 (count datom)))
    (not (false? (nth datom 4)))

    :else
    (not (false? (or (unchecked-get datom "added")
                     (unchecked-get datom "added?")
                     true)))))

(defn- datom-e
  [datom]
  (cond
    (map? datom) (:e datom)
    (sequential? datom) (first datom)
    :else (unchecked-get datom "e")))

(defn- datom-attr
  [datom]
  (cond
    (map? datom) (:a datom)
    (sequential? datom) (second datom)
    :else (unchecked-get datom "a")))

(defn- datom-value
  [datom]
  (cond
    (map? datom) (:v datom)
    (sequential? datom) (nth datom 2 nil)
    :else (unchecked-get datom "v")))

(defn- unknown-attr-datom?
  [datom]
  (let [attr (datom-attr datom)]
    (and (datom-added? datom)
         (some? attr)
         (not (keyword? attr)))))

(defn- direct-assignee-datom?
  [datom]
  (and (datom-added? datom)
       (= assignee-property-ident (datom-attr datom))))

(defn- pull-assignee-property
  [cfg repo]
  (transport/invoke cfg :thread-api/pull [repo assignee-property-selector assignee-property-ident]))

(defn- resolve-assignee-datoms
  [cfg repo tx-data]
  (let [direct-datoms (filter direct-assignee-datom? tx-data)
        unknown-attr-datoms (filter unknown-attr-datom? tx-data)]
    (if (seq unknown-attr-datoms)
      (p/let [property (pull-assignee-property cfg repo)
              property-id (:db/id property)]
        (concat direct-datoms
                (filter #(= property-id (datom-attr %)) unknown-attr-datoms)))
      (p/resolved direct-datoms))))

(defn- direct-assignee-title
  [value]
  (when (or (string? value)
            (keyword? value)
            (map? value))
    (trim-non-empty (value-title value))))

(defn- assignee-value-matches?
  [cfg repo value agent-name]
  (if-let [title (direct-assignee-title value)]
    (p/resolved (= agent-name title))
    (p/let [entity (transport/invoke cfg :thread-api/pull [repo assignee-value-selector value])]
      (= agent-name (trim-non-empty (value-title entity))))))

(defn- pull-task-block
  [cfg repo block-id]
  (transport/invoke cfg :thread-api/pull [repo task-block-selector block-id]))

(defn- show-task-tree
  [cfg repo block]
  (p/let [show-result (show-command/execute-show {:type :show
                                                  :repo repo
                                                  :uuid (block-uuid-str block)
                                                  :level 100
                                                  :linked-references? false
                                                  :ref-id-footer? false}
                                                 cfg)]
    (or (get-in show-result [:data :message])
        (:block/title block))))

(defn- route-assignee-datom!
  [cfg {:keys [repo agent-name] :as opts} datom]
  (let [block-id (datom-e datom)
        assignee-value (datom-value datom)]
    (when block-id
      (p/let [matches? (assignee-value-matches? cfg repo assignee-value agent-name)]
        (when matches?
          (p/let [block (pull-task-block cfg repo block-id)]
            (when (routable-task? block agent-name)
              (p/let [tree-text (show-task-tree cfg repo block)]
                (route-task! cfg opts {:block block
                                       :tree-text tree-text})))))))))

(defn- process-sync-db-changes-event!
  [cfg {:keys [repo] :as opts} {:keys [tx-data]}]
  (p/let [assignee-datoms (resolve-assignee-datoms cfg repo tx-data)]
    (when (seq assignee-datoms)
      (p/all (mapv #(route-assignee-datom! cfg opts %) assignee-datoms)))))

(defn- listen-forever!
  [cfg {:keys [repo graph agent-name]}]
  (let [processing* (atom (p/resolved nil))
        process! (fn [payload]
                   (swap! processing*
                          (fn [previous]
                            (-> previous
                                (p/catch (fn [_] nil))
                                (p/then (fn [_]
                                          (process-sync-db-changes-event! cfg
                                                                          {:repo repo
                                                                           :graph graph
                                                                           :agent-name agent-name}
                                                                          payload)))
                                (p/catch (fn [e]
                                           (emit-log! cfg (log-line (str "Codex invocation failed: "
                                                                         (or (ex-message e) (str e)))))
                                           (log-bridge-exit! {:repo repo
                                                              :graph graph
                                                              :agent-name agent-name
                                                              :reason :task-processing-failed
                                                              :exit-code 1
                                                              :error e})
                                           (.exit js/process 1)))))))]
    (transport/connect-events! cfg
                               (fn [event-type payload]
                                 (when (= :sync-db-changes event-type)
                                   (emit-log! cfg (log-line "got graph changes: sync-db-changes"))
                                   (process! payload))))
    (p/create (fn [_resolve _reject] nil))))

(defn execute-bridge
  [action config]
  (let [repo (:repo action)
        graph (:graph action)
        logs [(log-line "checking the environment ...")
              (log-line (str "using graph: " graph))]]
    (p/let [agent-name-result (resolve-agent-name config)]
      (if-not (:ok? agent-name-result)
        (bridge-error (get-in agent-name-result [:error :code])
                      (get-in agent-name-result [:error :message]))
        (let [agent-name (:agent-name agent-name-result)
              logs (conj logs
                         (log-line (str "using agent name: " agent-name))
                         (log-line "checking codex cli ..."))]
          (if-not (codex-available? nil)
            (bridge-error :codex-not-found "codex executable is not available")
            (p/let [cfg (cli-server/ensure-server! config repo)
                    logs (conj logs (log-line "registering agent bridge ..."))
                    _ (register-agent-bridge! cfg repo agent-name)]
              (if (:dry-run? action)
                (p/let [tasks (list-routable-tasks cfg repo agent-name)
                        commands (dry-run-commands graph agent-name tasks)
                        logs (into (conj logs (log-line "listening graph changes ..."))
                                   (map (fn [{:keys [block preview]}]
                                          (log-line (str "would run Codex command for " block ": " preview)))
                                        commands))]
                  {:status :ok
                   :command :agent-bridge
                   :data {:mode :dry-run
                          :graph graph
                          :agent-name agent-name
                          :logs logs
                          :commands commands}})
                (do
                  (doseq [line (conj logs (log-line "listening graph changes ..."))]
                    (emit-log! cfg line))
                  (if (:process-once? action)
                    (p/let [routed (process-tasks! cfg {:repo repo
                                                        :graph graph
                                                        :agent-name agent-name})]
                      {:status :ok
                       :command :agent-bridge
                       :data {:mode :processed-once
                              :graph graph
                              :agent-name agent-name
                              :routed routed}})
                    (p/let [_ (process-tasks! cfg {:repo repo
                                                   :graph graph
                                                   :agent-name agent-name})]
                      (listen-forever! cfg {:repo repo
                                            :graph graph
                                            :agent-name agent-name}))))))))))))
