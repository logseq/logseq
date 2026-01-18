(ns logseq.cli.format
  "Formatting helpers for CLI output."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]))

(defn- normalize-json
  [value]
  (walk/postwalk (fn [entry]
                   (if (uuid? entry)
                     (str entry)
                     entry))
                 value))

(defn- ->json
  [{:keys [status data error]}]
  (let [obj (js-obj)]
    (set! (.-status obj) (name status))
    (cond
      (= status :ok)
      (set! (.-data obj) (clj->js (normalize-json data)))

      (= status :error)
      (set! (.-error obj) (clj->js (normalize-json (update error :code name)))))
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
  (let [normalized-rows (mapv (fn [row]
                                (mapv normalize-cell row))
                              rows)
        trim-right (fn [value]
                     (string/replace value #"\s+$" ""))
        widths (mapv (fn [idx header]
                       (apply max (count header)
                              (map #(count (nth % idx)) normalized-rows)))
                     (range (count headers))
                     headers)
        render-row (fn [row]
                     (->> (map pad-right row widths)
                          (string/join "  ")
                          (trim-right)))
        lines (cons (render-row headers)
                    (map render-row normalized-rows))]
    (string/join "\n" lines)))

(defn- format-counted-table
  [headers rows]
  (str (render-table headers rows)
       "\n"
       "Count: "
       (count rows)))

(defn- error-hint
  [{:keys [code]}]
  (case code
    :missing-graph "Use --graph <name>"
    :missing-repo "Use --repo <name>"
    :missing-content "Use --content or pass content as args"
    :missing-search-text "Provide search text or --text"
    nil))

(defn- format-error
  [error]
  (let [{:keys [code message]} error
        hint (error-hint error)]
    (cond-> (str "Error (" (name (or code :error)) "): " message)
      hint (str "\nHint: " hint))))

(defn- maybe-ident-header
  [items]
  (when (some :db/ident items)
    ["IDENT"]))

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

(defn- format-list-row
  [item include-ident? now-ms]
  (let [base [(or (:db/id item) (:id item))
              (or (:title item) (:block/title item) (:name item))]
        with-ident (cond-> base
                     include-ident? (conj (:db/ident item)))
        updated (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)
        created (human-ago (or (:created-at item) (:block/created-at item)) now-ms)]
    (conj with-ident updated created)))

(defn- format-list-page
  [items now-ms]
  (let [items (or items [])
        include-ident? (boolean (some :db/ident items))
        headers (into ["ID" "TITLE"]
                      (concat (or (maybe-ident-header items) [])
                              ["UPDATED-AT" "CREATED-AT"]))]
    (format-counted-table
     headers
     (mapv #(format-list-row % include-ident? now-ms) items))))

(defn- format-list-tag-or-property
  [items now-ms]
  (let [items (or items [])
        include-ident? (boolean (some :db/ident items))
        headers (into ["ID" "TITLE"]
                      (concat (or (maybe-ident-header items) [])
                              ["UPDATED-AT" "CREATED-AT"]))]
    (format-counted-table
     headers
     (mapv #(format-list-row % include-ident? now-ms) items))))

(defn- format-graph-list
  [graphs]
  (format-counted-table
   ["GRAPH"]
   (mapv (fn [graph] [graph]) (or graphs []))))

(defn- format-server-list
  [servers]
  (format-counted-table
   ["REPO" "STATUS" "HOST" "PORT" "PID"]
   (mapv (fn [server]
           [(:repo server)
            (:status server)
            (:host server)
            (:port server)
            (:pid server)])
         (or servers []))))

(defn- format-search-results
  [results]
  (format-counted-table
   ["TYPE" "TITLE/CONTENT" "UUID" "UPDATED-AT" "CREATED-AT"]
   (mapv (fn [item]
           [(:type item)
            (or (:title item) (:content item))
            (:uuid item)
            (:updated-at item)
            (:created-at item)])
         (or results []))))

(defn- format-graph-info
  [{:keys [graph logseq.kv/graph-created-at logseq.kv/schema-version]} now-ms]
  (string/join "\n"
               [(str "Graph: " (or graph "-"))
                (str "Created at: " (if (some? graph-created-at)
                                      (human-ago graph-created-at now-ms)
                                      "-"))
                (str "Schema version: " (or schema-version "-"))]))

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

(defn- format-add-block
  [{:keys [repo blocks]}]
  (str "Added blocks: " (count blocks) " (repo: " repo ")"))

(defn- format-add-page
  [{:keys [repo page]}]
  (str "Added page: " page " (repo: " repo ")"))

(defn- format-remove-page
  [{:keys [repo page]}]
  (str "Removed page: " page " (repo: " repo ")"))

(defn- format-remove-block
  [{:keys [repo block]}]
  (str "Removed block: " block " (repo: " repo ")"))

(defn- format-graph-action
  [command {:keys [graph]}]
  (let [verb (case command
               :graph-create "created"
               :graph-switch "switched"
               :graph-remove "removed"
               :graph-validate "validated"
               "updated")]
    (str "Graph " verb ": " graph)))

(defn- ->human
  [{:keys [status data error command context]} {:keys [now-ms]}]
  (let [now-ms (or now-ms (js/Date.now))]
    (case status
      :ok
      (case command
        :graph-list (format-graph-list (:graphs data))
        :graph-info (format-graph-info data now-ms)
        (:graph-create :graph-switch :graph-remove :graph-validate)
        (format-graph-action command context)
        :server-list (format-server-list (:servers data))
        :server-status (format-server-status data)
        (:server-start :server-stop :server-restart)
        (format-server-action command data)
        :list-page (format-list-page (:items data) now-ms)
        (:list-tag :list-property) (format-list-tag-or-property (:items data) now-ms)
        :add-block (format-add-block context)
        :add-page (format-add-page context)
        :remove-page (format-remove-page context)
        :remove-block (format-remove-block context)
        :search (format-search-results (:results data))
        :show (or (:message data) (pr-str data))
        (if (and (map? data) (contains? data :message))
          (:message data)
          (pr-str data)))

      :error
      (format-error error)

      (pr-str {:status status :data data :error error}))))

(defn- ->edn
  [{:keys [status data error]}]
  (pr-str (cond-> {:status status}
            (= status :ok) (assoc :data data)
            (= status :error) (assoc :error error))))

(defn format-result
  [result {:keys [output-format] :as opts}]
  (let [format (cond
                 (= output-format :edn) :edn
                 (= output-format :json) :json
                 :else :human)]
    (case format
      :json (->json result)
      :edn (->edn result)
      (->human result opts))))
