(ns logseq.cli.format
  "Formatting helpers for CLI output."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.style :as style]
            [logseq.common.util :as common-util]))

(defn- normalize-json
  [value]
  (walk/postwalk (fn [entry]
                   (if (uuid? entry)
                     (str entry)
                     entry))
                 value))

(defn- ->json
  [{:keys [status data error command]}]
  (let [obj (js-obj)]
    (set! (.-status obj) (name status))
    (cond
      (= status :ok)
      (set! (.-data obj) (clj->js (normalize-json data)))

      (= status :error)
      (do
        (set! (.-error obj) (clj->js (normalize-json (update error :code name))))
        (when (and (= :doctor command) (some? data))
          (set! (.-data obj) (clj->js (normalize-json data))))))
    (js/JSON.stringify obj)))

(defn- pad-right
  [value width]
  (let [text (str value)
        missing (- width (count text))]
    (if (pos? missing)
      (str text (apply str (repeat missing " ")))
      text)))

(defn- normalize-cell
  [value]
  (cond
    (nil? value) "-"
    (keyword? value) (str value)
    :else (str value)))

(defn- render-table
  [headers rows]
  (let [split-lines (fn [value]
                      (string/split (normalize-cell value) #"\n" -1))
        normalized-rows (mapv (fn [row]
                                (mapv split-lines row))
                              rows)
        trim-right (fn [value]
                     (string/replace value #"\s+$" ""))
        widths (mapv (fn [idx header]
                       (reduce max
                               (count header)
                               (mapcat #(map count (nth % idx)) normalized-rows)))
                     (range (count headers))
                     headers)
        render-row (fn [row]
                     (->> (map pad-right row widths)
                          (string/join "  ")
                          (trim-right)))
        render-multiline-row (fn [row]
                               (let [line-count (reduce max 1 (map count row))]
                                 (mapv (fn [line-idx]
                                         (->> (map-indexed (fn [col-idx lines]
                                                            (pad-right (get lines line-idx "")
                                                                       (nth widths col-idx)))
                                                          row)
                                              (string/join "  ")
                                              (trim-right)))
                                       (range line-count))))
        lines (cons (render-row headers)
                    (mapcat render-multiline-row normalized-rows))]
    (string/join "\n" lines)))

(defn- format-counted-table
  [headers rows]
  (str (if headers
         (str (render-table headers rows) "\n")
         (str (string/join "\n" (map (comp string/trimr first) rows)) "\n"))
       "Count: "
       (count rows)))

(defn- error-hint
  [{:keys [code]}]
  (case code
    :missing-graph "Use --graph <name>"
    :missing-repo "Use --graph <name>"
    :missing-content "Use --content or pass content as args"
    :missing-tag-name "Use --name <tag-name>"
    :missing-query "Use --query <edn>"
    :unknown-query "Use `logseq query list` to see available queries"
    :ambiguous-tag-name "Retry with --id <tag-id>"
    :ambiguous-property-name "Retry with --id <property-id>"
    :data-dir-permission "Check filesystem permissions or set LOGSEQ_CLI_DATA_DIR"
    :server-owned-by-other "Retry from the process owner that started the server"
    :server-start-timeout-orphan "Check and stop lingering db-worker-node processes, then retry"
    nil))

(defn- format-candidates
  [candidates]
  (when (seq candidates)
    (str "\nCandidates:\n"
         (string/join "\n"
                      (map (fn [{:keys [id name]}]
                             (str "  " id "  " (or name "-")))
                           candidates)))))

(defn- format-error
  [error]
  (let [{:keys [code message candidates]} error
        hint (error-hint error)
        message* (style/bold-keywords message ["option" "command" "argument"])
        candidates* (format-candidates candidates)]
    (if (= :graph-validation-failed code)
      message*
      (cond-> (str "Error (" (name (or code :error)) "): " message*)
        candidates* (str candidates*)
        hint (str "\nHint: " hint)))))

(defn- parse-ts
  [value]
  (cond
    (number? value) value
    (string? value) (let [ms (js/Date.parse value)]
                      (when-not (js/isNaN ms) ms))
    :else nil))

(defn- human-ago
  [value now-ms]
  (if-let [ts (parse-ts value)]
    (let [diff-ms (max 0 (- now-ms ts))
          secs (js/Math.floor (/ diff-ms 1000))
          mins (js/Math.floor (/ secs 60))
          hours (js/Math.floor (/ mins 60))
          days (js/Math.floor (/ hours 24))
          months (js/Math.floor (/ days 30))
          years (js/Math.floor (/ days 365))]
      (cond
        (< secs 60) (str secs "s ago")
        (< mins 60) (str mins "m ago")
        (< hours 24) (str hours "h ago")
        (< days 30) (str days "d ago")
        (< months 12) (str months "mo ago")
        :else (str years "y ago")))
    "-"))

(defn- items-have-key?
  [items & ks]
  (some (fn [item] (some #(contains? item %) ks)) items))

(def ^:private list-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item)))           [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item)))  [:title :block/title :name]]
   ["IDENT"      (fn [item _] (:db/ident item))                       [:db/ident]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-dynamic
  [items now-ms columns]
  (let [items (or items [])
        active (filterv (fn [[_ _ ks always?]]
                          (or always? (apply items-have-key? items ks)))
                        columns)
        headers (mapv first active)
        rows (mapv (fn [item]
                     (mapv (fn [[_ extractor _]] (extractor item now-ms)) active))
                   items)]
    (format-counted-table headers rows)))

(defn- format-list-page
  [items now-ms]
  (format-list-dynamic items now-ms list-columns))

(defn- format-list-tag
  [items now-ms]
  (format-list-dynamic items now-ms list-columns))

(defn- normalize-property-type
  [value]
  (cond
    (keyword? value) (name value)
    (nil? value) "-"
    :else (str value)))

(def ^:private list-property-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item)))           [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item)))  [:title :block/title :name]]
   ["TYPE"       (fn [item _] (normalize-property-type (:logseq.property/type item))) [:logseq.property/type]]
   ["IDENT"      (fn [item _] (:db/ident item))                       [:db/ident]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-property
  [items now-ms]
  (format-list-dynamic items now-ms list-property-columns))

(defn- quote-posix-shell
  [value]
  (str "'" (string/replace (normalize-cell value) #"'" "'\"'\"'") "'"))

(defn- posix-join
  [base leaf]
  (let [base (normalize-cell base)
        leaf (normalize-cell leaf)
        base (string/replace base #"/+$" "")
        leaf (string/replace leaf #"^/+" "")]
    (if (seq base)
      (str base "/" leaf)
      leaf)))

(defn- graph-list-item->entry
  [item]
  (if (string? item)
    {:kind :canonical
     :graph-name item}
    item))

(defn- legacy-graph-item?
  [{:keys [kind]}]
  (contains? #{:legacy :legacy-undecodable} kind))

(defn- format-legacy-warning-lines
  [legacy-item data-dir]
  (let [{:keys [kind legacy-dir legacy-graph-name target-graph-dir conflict?]} legacy-item
        legacy-dir (or legacy-dir "-")]
    (case kind
      :legacy
      (cond
        conflict?
        [(str "Warning: target directory already exists for legacy graph '"
              (normalize-cell legacy-graph-name)
              "'.")
         "Please rename manually after resolving the conflict."]

        (and (seq legacy-graph-name)
             (seq target-graph-dir))
        (let [source-path (if (seq data-dir)
                            (posix-join data-dir legacy-dir)
                            legacy-dir)
              target-path (if (seq data-dir)
                            (posix-join data-dir target-graph-dir)
                            target-graph-dir)]
          ["Rename suggestion:"
           (str "  mv "
                (quote-posix-shell source-path)
                " "
                (quote-posix-shell target-path))])

        :else
        [(str "Warning: cannot derive graph name for legacy dir '"
              (normalize-cell legacy-dir)
              "'; rename command is not available.")])

      :legacy-undecodable
      [(str "Warning: cannot derive graph name for legacy dir '"
            (normalize-cell legacy-dir)
            "'; rename command is not available.")]

      [])))

(defn- format-graph-list
  [{:keys [graphs graph-items]} {:keys [current-graph data-dir]}]
  (let [graph-items (->> (or graph-items graphs [])
                         (mapv graph-list-item->entry))
        graph-names (mapv (fn [{:keys [kind graph-name legacy-graph-name legacy-dir]}]
                            (case kind
                              :canonical graph-name
                              :legacy (or legacy-graph-name legacy-dir)
                              :legacy-undecodable legacy-dir
                              (or graph-name legacy-graph-name legacy-dir)))
                          graph-items)
        has-current? (and (seq current-graph)
                          (some #(= % current-graph) graph-names))
        rows (mapv (fn [item graph-name]
                     (let [legacy? (legacy-graph-item? item)
                           display-name (str graph-name (when legacy? " [legacy]"))
                           selected? (= graph-name current-graph)]
                       [(if has-current?
                          (if selected?
                            (str "* " display-name)
                            (str "  " display-name))
                          display-name)]))
                   graph-items
                   graph-names)
        base-output (format-counted-table nil rows)
        legacy-items (filterv legacy-graph-item? graph-items)]
    (if (seq legacy-items)
      (let [warning-lines (vec (concat [(str "Warning: " (count legacy-items) " legacy graph directories detected.")]
                                       (mapcat #(format-legacy-warning-lines % data-dir) legacy-items)))]
        (str base-output "\n\n" (string/join "\n" warning-lines)))
      base-output)))

(defn- format-server-list-warning
  [{:keys [cli-revision servers]}]
  (when (seq servers)
    (str "Warning: server revision mismatch detected\n"
         "Local CLI revision: " (normalize-cell cli-revision) "\n"
         "Mismatched servers:\n"
         (string/join "\n"
                      (map (fn [{:keys [repo revision]}]
                             (str "  - " (normalize-cell repo)
                                  " (revision: "
                                  (normalize-cell revision)
                                  ")"))
                           servers)))))

(defn- format-server-list
  [servers revision-mismatch]
  (let [table (format-counted-table
               ["GRAPH" "STATUS" "HOST" "PORT" "PID" "OWNER" "REVISION"]
               (mapv (fn [server]
                       [(:repo server)
                        (:status server)
                        (:host server)
                        (:port server)
                        (:pid server)
                        (:owner-source server)
                        (:revision server)])
                     (or servers [])))]
    (if-let [warning (format-server-list-warning revision-mismatch)]
      (str table "\n\n" warning)
      table)))

(defn- format-query-results
  [result]
  (let [edn-str (pr-str result)
        parsed (common-util/safe-read-string {:log-error? false} edn-str)
        valid? (or (some? parsed) (= "nil" (string/trim edn-str)))]
    (if valid?
      edn-str
      edn-str)))

(defn- format-query-list
  [queries]
  (format-counted-table
   ["NAME" "INPUTS" "SOURCE" "DOC"]
   (mapv (fn [{:keys [name inputs source doc]}]
           [name
            (if (seq inputs) (string/join ", " inputs) "-")
            (clojure.core/name (or source :custom))
            (or doc "-")])
         (or queries []))))

(declare kv-key->string
         graph-info-human-max-string-length
         graph-info-truncated-suffix)

(defn- format-graph-info
  [{:keys [graph kv logseq.kv/graph-created-at logseq.kv/schema-version]} now-ms]
  (let [summary-lines [(str "Graph: " (or graph "-"))
                       (str "Created at: " (if (some? graph-created-at)
                                             (human-ago graph-created-at now-ms)
                                             "-"))
                       (str "Schema version: " (or schema-version "-"))]
        truncate-value (fn [value]
                         (if (and (string? value)
                                  (> (count value) graph-info-human-max-string-length))
                           (str (subs value 0 graph-info-human-max-string-length)
                                graph-info-truncated-suffix)
                           value))
        kv-lines (if (seq kv)
                   (into ["KV:"]
                         (->> kv
                              (sort-by (comp kv-key->string key))
                              (map (fn [[kv-key kv-value]]
                                     (str "  " (kv-key->string kv-key) ": "
                                          (pr-str (truncate-value kv-value)))))))
                   ["KV:" "  (empty)"])]
    (string/join "\n" (into summary-lines kv-lines))))

(defn- format-server-status
  [{:keys [repo status host port]}]
  (string/join "\n"
               (cond-> [(str "Server " (name (or status :unknown)) ": " repo)]
                 (and host port) (conj (str "Host: " host "  Port: " port)))))

(defn- format-server-action
  [command {:keys [repo status host port]}]
  (let [status (or status
                   (case command
                     :server-start :started
                     :server-stop :stopped
                     :server-restart :restarted
                     :unknown))]
    (string/join "\n"
                 (cond-> [(str "Server " (name status) ": " repo)]
                   (and host port) (conj (str "Host: " host "  Port: " port))))))

(def ^:private redacted-token "[REDACTED]")
(def ^:private graph-info-sensitive-kv-pattern #"(?i)(token|secret|password)")
(def ^:private graph-info-human-max-string-length 120)
(def ^:private graph-info-truncated-suffix "... [truncated]")

(defn- kv-key->string
  [kv-key]
  (if (keyword? kv-key)
    (if-let [kv-ns (namespace kv-key)]
      (str kv-ns "/" (name kv-key))
      (name kv-key))
    (str kv-key)))

(defn- sensitive-graph-kv-key?
  [kv-key]
  (boolean (re-find graph-info-sensitive-kv-pattern (kv-key->string kv-key))))

(defn- redact-graph-kv
  [kv]
  (into {}
        (map (fn [[kv-key kv-value]]
               [kv-key
                (if (sensitive-graph-kv-key? kv-key)
                  redacted-token
                  kv-value)]))
        (or kv {})))

(defn- sanitize-graph-info-data
  [data]
  (if (map? data)
    (update data :kv redact-graph-kv)
    data))

(defn- sanitize-auth-data
  [data]
  (if (map? data)
    (apply dissoc data [:id-token :access-token :refresh-token])
    data))

(defn- sanitize-result
  [result]
  (cond
    (and (= :ok (:status result))
         (= :graph-info (:command result)))
    (update result :data sanitize-graph-info-data)

    (= :login (:command result))
    (update result :data sanitize-auth-data)

    :else
    result))

(defn- format-sync-status
  [{:keys [repo graph-id ws-state pending-local pending-asset pending-server local-tx remote-tx last-error]}]
  (let [last-error-line (when (map? last-error)
                          (str "last-error: "
                               (or (:code last-error) :error)
                               (when-let [message (:message last-error)]
                                 (str " (" message ")"))))]
    (string/join "\n"
                 (cond-> [(str "Sync status")
                          (str "repo: " (or repo "-"))
                          (str "graph-id: " (or graph-id "-"))
                          (str "ws-state: " (or ws-state :unknown))
                          (str "pending-local: " (or pending-local 0))
                          (str "pending-asset: " (or pending-asset 0))
                          (str "pending-server: " (or pending-server 0))
                          (str "local-tx: " (or local-tx "-"))
                          (str "remote-tx: " (or remote-tx "-"))]
                   last-error-line (conj last-error-line)))))

(defn- format-sync-remote-graphs
  [graphs]
  (format-counted-table
   ["GRAPH-ID" "GRAPH-NAME" "ROLE" "E2EE"]
   (mapv (fn [{:keys [graph-id graph-name role graph-e2ee?]}]
           [graph-id
            graph-name
            (or role "-")
            (if (nil? graph-e2ee?)
              "-"
              (if graph-e2ee? "true" "false"))])
         (or graphs []))))

(defn- format-sync-action
  [command {:keys [repo email]}]
  (case command
    :sync-start (str "Sync started: " repo)
    :sync-stop (str "Sync stopped: " repo)
    :sync-upload (str "Sync upload requested: " repo)
    :sync-download (str "Sync download requested: " repo)
    :sync-ensure-keys "Sync keys ensured"
    :sync-grant-access (str "Sync access granted: " email " (repo: " repo ")")
    "Sync updated"))

(defn- format-sync-config-get
  [{:keys [key value]}]
  (let [display-value (if (contains? #{:auth-token :e2ee-password} key)
                        redacted-token
                        (if (some? value) value "-"))]
    (str "sync config " (name key) ": " display-value)))

(defn- format-sync-config-set
  [{:keys [key]}]
  (str "sync config set: " (name key)))

(defn- format-sync-config-unset
  [{:keys [key]}]
  (str "sync config unset: " (name key)))

(defn- format-login
  [{:keys [auth-path email sub]}]
  (string/join "\n"
               (cond-> ["Login successful"
                        (str "Auth file: " (or auth-path "-"))]
                 (seq email) (conj (str "Email: " email))
                 (seq sub) (conj (str "User: " sub)))))

(defn- format-logout
  [{:keys [auth-path deleted? opened? logout-completed?]}]
  (string/join "\n"
               (cond-> [(str (if deleted?
                               "Logged out"
                               "Already logged out")
                             ": "
                             (or auth-path "-"))]
                 logout-completed? (conj "Cognito logout: completed")
                 (and (not logout-completed?) (true? opened?))
                 (conj "Cognito logout: browser opened, completion not confirmed")
                 (false? opened?)
                 (conj "Cognito logout: could not open browser"))))

(defn- format-upsert-block
  [{:keys [repo source target update-tags update-properties remove-tags remove-properties]} result]
  (if (vector? result)
    (str "Upserted blocks:\n" (pr-str (vec (or result []))))
    (let [change-parts (cond-> []
                         (seq update-tags) (conj (str "tags:+" (count update-tags)))
                         (seq update-properties) (conj (str "properties:+" (count update-properties)))
                         (seq remove-tags) (conj (str "remove-tags:+" (count remove-tags)))
                         (seq remove-properties) (conj (str "remove-properties:+" (count remove-properties))))
          changes (when (seq change-parts)
                    (str ", " (string/join ", " change-parts)))
          move-fragment (when (seq target)
                          (str " -> " target))]
      (str "Upserted block: " source (or move-fragment "") " (repo: " repo (or changes "") ")"))))

(defn- format-upsert-page
  [_context ids]
  (str "Upserted page:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-tag
  [_context ids]
  (str "Upserted tag:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-property
  [_context ids]
  (str "Upserted property:\n" (pr-str (vec (or ids [])))))

(defn- format-remove-block
  [{:keys [repo uuid id ids]}]
  (cond
    (seq uuid) (str "Removed block: " uuid " (repo: " repo ")")
    (seq ids) (str "Removed blocks: " (count ids) " (repo: " repo ")")
    (some? id) (str "Removed block: " id " (repo: " repo ")")
    :else (str "Removed block (repo: " repo ")")))

(defn- format-remove-page
  [{:keys [repo name]}]
  (str "Removed page: " name " (repo: " repo ")"))

(defn- format-remove-tag
  [{:keys [repo name id]}]
  (if (seq name)
    (str "Removed tag: " name " (repo: " repo ")")
    (str "Removed tag: " id " (repo: " repo ")")))

(defn- format-remove-property
  [{:keys [repo name id]}]
  (if (seq name)
    (str "Removed property: " name " (repo: " repo ")")
    (str "Removed property: " id " (repo: " repo ")")))

(defn- format-graph-export
  [{:keys [export-type file]}]
  (str "Exported " export-type " to " file))

(defn- format-graph-import
  [{:keys [import-type input]}]
  (str "Imported " import-type " from " input))

(defn- format-graph-action
  [command {:keys [graph]}]
  (let [verb (case command
               :graph-create "Created"
               :graph-switch "Switched to"
               :graph-remove "Removed"
               :graph-validate "Validated"
               "Updated")]
    (str verb " graph " (pr-str graph))))

(defn- quote-cli-arg
  [value]
  (let [value (normalize-cell value)]
    (if (re-find #"\s" value)
      (str "\"" (string/replace value #"\"" "\\\"") "\"")
      value)))

(defn- format-doctor-check
  [{:keys [id status message servers]}]
  (let [check-line (str "[" (name (or status :unknown))
                        "] "
                        (name (or id :unknown))
                        (when (seq message)
                          (str " - " message)))]
    (if (= :server-revision-mismatch id)
      (let [guidance-lines (mapv (fn [{:keys [graph repo]}]
                                   (str "  Run: logseq server restart --graph "
                                        (quote-cli-arg (or graph repo))))
                                 (or servers []))]
        (into [check-line] guidance-lines))
      [check-line])))

(defn- format-doctor
  [status checks]
  (let [header (str "Doctor: " (name (or status :unknown)))
        check-lines (mapcat format-doctor-check (or checks []))]
    (string/join "\n" (into [header] check-lines))))

(defn- ->human
  [{:keys [status data error command context human]} {:keys [now-ms graph data-dir]}]
  (let [now-ms (or now-ms (js/Date.now))]
    (case status
      :ok
      (case command
        :graph-list (format-graph-list data {:current-graph graph
                                             :data-dir data-dir})
        :graph-info (format-graph-info data now-ms)
        (:graph-create :graph-switch :graph-remove :graph-validate)
        (format-graph-action command context)
        :server-list (format-server-list (:servers data)
                                         (get-in human [:server-list :revision-mismatch]))
        :server-status (format-server-status data)
        (:server-start :server-stop :server-restart)
        (format-server-action command data)
        :sync-status (format-sync-status data)
        :sync-remote-graphs (format-sync-remote-graphs (:graphs data))
        (:sync-start :sync-stop :sync-upload :sync-download :sync-ensure-keys :sync-grant-access)
        (format-sync-action command context)
        :sync-config-get (format-sync-config-get data)
        :sync-config-set (format-sync-config-set data)
        :sync-config-unset (format-sync-config-unset data)
        :login (format-login data)
        :logout (format-logout data)
        :list-page (format-list-page (:items data) now-ms)
        :list-tag (format-list-tag (:items data) now-ms)
        :list-property (format-list-property (:items data) now-ms)
        :upsert-block (format-upsert-block context (:result data))
        :upsert-page (format-upsert-page context (:result data))
        :upsert-tag (format-upsert-tag context (:result data))
        :upsert-property (format-upsert-property context (:result data))
        :remove-block (format-remove-block context)
        :remove-page (format-remove-page context)
        :remove-tag (format-remove-tag context)
        :remove-property (format-remove-property context)
        :graph-export (format-graph-export context)
        :graph-import (format-graph-import context)
        :query (format-query-results (:result data))
        :query-list (format-query-list (:queries data))
        :show (or (:message data) (pr-str data))
        :doctor (format-doctor (:status data) (:checks data))
        (if (and (map? data) (contains? data :message))
          (:message data)
          (pr-str data)))

      :error
      (if (= :doctor command)
        (format-doctor (or (get-in data [:status]) :error)
                       (or (get-in data [:checks])
                           (get-in error [:checks])))
        (format-error error))

      (pr-str {:status status :data data :error error}))))

(defn- ->edn
  [{:keys [status data error command]}]
  (pr-str (cond-> {:status status}
            (= status :ok) (assoc :data data)
            (= status :error) (assoc :error error)
            (and (= status :error) (= :doctor command) (some? data))
            (assoc :data data))))

(defn- normalize-graph-result
  [result]
  (walk/postwalk
   (fn [entry]
     (if (map? entry)
       (cond-> entry
         (string? (:repo entry)) (update :repo command-core/repo->graph)
         (string? (:graph entry)) (update :graph command-core/repo->graph)
         (seq (:graphs entry)) (update :graphs (fn [graphs]
                                                 (mapv command-core/repo->graph graphs))))
       entry))
   result))

(defn format-result
  [result {:keys [output-format] :as opts}]
  (let [result (-> result
                   normalize-graph-result
                   sanitize-result)
        format (cond
                 (= output-format :edn) :edn
                 (= output-format :json) :json
                 :else :human)]
    (case format
      :json (->json result)
      :edn (->edn result)
      (->human result opts))))
