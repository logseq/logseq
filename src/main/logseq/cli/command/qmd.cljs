(ns logseq.cli.command.qmd
  "QMD-backed CLI search commands."
  (:require ["child_process" :as child-process]
            ["crypto" :as crypto]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.root-dir :as root-dir]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.cli.uuid-refs :as uuid-refs]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(def ^:private markdown-glob "**/*.md")
(def ^:private block-id-comment-re #"<!--\s*id:\s*(-?\d+)\s*-->")
(def ^:private block-line-re #"^(\s*)-\s?.*<!--\s*id:\s*(-?\d+)\s*-->.*$")
(def ^:private qmd-hunk-header-re #"(?m)^@@\s+-([0-9]+)(?:,[0-9]+)?\s+\@\@.*$")
(def ^:private qsearch-context-lookback 50)
(def ^:private qsearch-context-lookahead 10)

(def ^:private qmd-common-spec
  {:index {:desc "QMD index name"}
   :collection {:desc "QMD collection name"}})

(def ^:private qmd-init-spec
  qmd-common-spec)

(def ^:private qsearch-spec
  (merge qmd-common-spec
         {:limit {:desc "Limit results"
                  :alias :n
                  :coerce :long}
          :no-rerank {:desc "Skip QMD reranking"
                      :coerce :boolean}}))

(def entries
  [(core/command-entry ["qmd" "init"] :qmd-init
                       "Initialize QMD for the graph Markdown Mirror"
                       qmd-init-spec
                       {:examples ["logseq qmd init --graph my-graph"]})
   (core/command-entry ["qsearch"] :qsearch
                       "Search graph Markdown Mirror with QMD"
                       qsearch-spec
                       {:examples ["logseq qsearch \"markdown mirror\" --graph my-graph"]})])

(defn- sha1-prefix
  [value length]
  (subs (.digest (.update (.createHash crypto "sha1") (str value)) "hex")
        0
        length))

(defn- slug
  [value]
  (let [value (-> (str value)
                  string/lower-case
                  (string/replace #"[^a-z0-9]+" "-")
                  (string/replace #"^-+" "")
                  (string/replace #"-+$" ""))]
    (if (seq value) value "graph")))

(defn default-collection-name
  [repo]
  (str "logseq-"
       (slug (core/repo->graph repo))
       "-"
       (sha1-prefix repo 8)))

(defn mirror-dir
  [config repo]
  (node-path/join (root-dir/graphs-dir (:root-dir config))
                  (graph-dir/repo->encoded-graph-dir-name repo)
                  "mirror"
                  "markdown"))

(defn- qmd-args
  [index args]
  (cond-> []
    (seq index) (into ["--index" index])
    true (into args)))

(defn <run-qmd
  [args]
  (p/create
   (fn [resolve _reject]
     (let [stdout (atom "")
           stderr (atom "")
           settled? (atom false)
           child (.spawn child-process "qmd" (clj->js args)
                         #js {:stdio #js ["ignore" "pipe" "pipe"]})]
       (some-> (.-stdout child)
               (.on "data" (fn [chunk]
                             (swap! stdout str (.toString chunk)))))
       (some-> (.-stderr child)
               (.on "data" (fn [chunk]
                             (swap! stderr str (.toString chunk)))))
       (.on child "error"
            (fn [error]
              (when-not @settled?
                (reset! settled? true)
                (resolve {:exit 127
                          :out @stdout
                          :err (or (.-message error) (str error))
                          :error error
                          :args args}))))
       (.on child "close"
            (fn [code]
              (when-not @settled?
                (reset! settled? true)
                (resolve {:exit (or code 0)
                          :out @stdout
                          :err @stderr
                          :args args}))))))))

(defn- qmd-error
  [code message result]
  {:status :error
   :error (cond-> {:code code
                   :message message}
            (:err result) (assoc :stderr (:err result))
            (:out result) (assoc :stdout (:out result)))})

(defn- <ensure-qmd!
  [index]
  (p/let [result (<run-qmd (qmd-args index ["--help"]))]
    (if (zero? (:exit result))
      {:ok? true}
      {:ok? false
       :result result})))

(defn- parse-collection-path
  [output]
  (some-> (re-find #"(?m)^\s*Path:\s+([^\r\n]+)\s*$" (or output ""))
          second
          string/trim))

(defn- normalize-path
  [path]
  (some-> path
          node-path/resolve
          (as-> resolved
                (try
                  (.realpathSync fs resolved)
                  (catch :default _ resolved)))))

(defn- same-path?
  [left right]
  (= (normalize-path left)
     (normalize-path right)))

(defn- qmd-command-failed
  [message result]
  (qmd-error :qmd-command-failed message result))

(defn build-init-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for qmd init"}}
    {:ok? true
     :action {:type :qmd-init
              :repo repo
              :graph (core/repo->graph repo)
              :collection (or (:collection options)
                              (default-collection-name repo))
              :index (:index options)}}))

(defn build-search-action
  [options args repo]
  (let [query (->> args
                   (map str)
                   (string/join " ")
                   string/trim)]
    (cond
      (not (seq repo))
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for qsearch"}}

      (not (seq query))
      {:ok? false
       :error {:code :missing-query-text
               :message "query text is required"}}

      :else
      {:ok? true
       :action {:type :qsearch
                :repo repo
                :graph (core/repo->graph repo)
                :query query
                :limit (:limit options)
                :collection (or (:collection options)
                                (default-collection-name repo))
                :index (:index options)
                :no-rerank (true? (:no-rerank options))}})))

(defn execute-qmd-init
  [action config]
  (p/let [qmd-check (<ensure-qmd! (:index action))]
    (if-not (:ok? qmd-check)
      (qmd-error :qmd-not-found
                 "qmd executable is required"
                 (:result qmd-check))
      (p/let [cfg (cli-server/ensure-server! config (:repo action))
              _ (transport/invoke cfg :thread-api/markdown-mirror-regenerate [(:repo action)])
              mirror-dir* (mirror-dir cfg (:repo action))
              show-result (<run-qmd (qmd-args (:index action)
                                              ["collection" "show" (:collection action)]))]
        (if (zero? (:exit show-result))
          (if-let [existing-path (parse-collection-path (:out show-result))]
            (if (same-path? existing-path mirror-dir*)
              (p/let [update-result (<run-qmd (qmd-args (:index action) ["update"]))]
                (if (zero? (:exit update-result))
                  {:status :ok
                   :data {:repo (:repo action)
                          :collection (:collection action)
                          :mirror-dir mirror-dir*
                          :action :updated}}
                  (qmd-command-failed "qmd update failed" update-result)))
              {:status :error
               :error {:code :qmd-collection-path-mismatch
                       :message "QMD collection exists for a different path"
                       :collection (:collection action)
                       :expected-path mirror-dir*
                       :actual-path existing-path}})
            {:status :error
             :error {:code :qmd-collection-show-invalid
                     :message "Unable to read QMD collection path"
                     :collection (:collection action)}})
          (p/let [add-result (<run-qmd (qmd-args (:index action)
                                                 ["collection" "add" mirror-dir*
                                                  "--name" (:collection action)
                                                  "--mask" markdown-glob]))]
            (if (zero? (:exit add-result))
              {:status :ok
               :data {:repo (:repo action)
                      :collection (:collection action)
                      :mirror-dir mirror-dir*
                      :action :created}}
              (qmd-command-failed "qmd collection add failed" add-result))))))))

(defn parse-qmd-json-output
  [output]
  (let [output (or output "")
        end (string/last-index-of output "]")]
    (loop [start (when end (string/index-of output "["))]
      (when (and start (<= start end))
        (let [candidate (subs output start (inc end))
              parsed (try
                       (js/JSON.parse candidate)
                       (catch :default _ nil))]
          (if (array? parsed)
            (js->clj parsed :keywordize-keys true)
            (recur (string/index-of output "[" (inc start)))))))))

(defn- qmd-json-parse-failed
  [result]
  (qmd-error :qmd-json-parse-failed
             "Unable to parse QMD JSON output"
             result))

(defn extract-block-ids
  [results]
  (->> (or results [])
       (mapcat (fn [result]
                 (map (fn [[_ id]]
                        (js/parseInt id 10))
                      (re-seq block-id-comment-re (or (:snippet result) "")))))
       (reduce (fn [acc id]
                 (if (some #{id} acc)
                   acc
                   (conj acc id)))
               [])))

(defn- positive-int
  [value]
  (let [parsed (cond
                 (number? value) value
                 (string? value) (js/parseInt value 10)
                 :else js/NaN)]
    (when (and (number? parsed)
               (not (js/isNaN parsed))
               (pos? parsed))
      parsed)))

(defn- split-snippet-lines
  [snippet]
  (let [lines (string/split-lines (or snippet ""))]
    (if (seq lines) (vec lines) [""])))

(defn- hunk-start-line
  [snippet]
  (some-> (re-find qmd-hunk-header-re (or snippet ""))
          second
          positive-int))

(defn- qmd-result-line
  [result]
  (or (positive-int (:line result))
      (hunk-start-line (:snippet result))))

(defn- find-subsequence-index
  [lines candidate]
  (let [lines (vec lines)
        candidate (vec candidate)
        candidate-count (count candidate)
        last-start (- (count lines) candidate-count)]
    (when (and (pos? candidate-count)
               (not (neg? last-start)))
      (loop [idx 0]
        (cond
          (> idx last-start) nil
          (= candidate (subvec lines idx (+ idx candidate-count))) idx
          :else (recur (inc idx)))))))

(defn- leading-space-count
  [line]
  (count (second (re-find #"^(\s*)" (or line "")))))

(defn- block-line-info
  [line]
  (when-let [[_ indent] (re-matches block-line-re (or line ""))]
    {:line line
     :indent (count indent)}))

(defn- enclosing-block-line
  [context-lines snippet-lines snippet-start-index]
  (let [first-line (first snippet-lines)
        first-indent (leading-space-count first-line)
        needs-parent-indent? (pos? first-indent)]
    (loop [idx snippet-start-index]
      (when (>= idx 0)
        (if-let [{:keys [line indent]} (block-line-info (get context-lines idx))]
          (if (and needs-parent-indent?
                   (not (< indent first-indent)))
            (recur (dec idx))
            line)
          (recur (dec idx)))))))

(defn- expanded-snippet
  [result context]
  (let [snippet (:snippet result)
        snippet-lines (split-snippet-lines snippet)
        context-lines (vec (string/split-lines (or context "")))
        line (qmd-result-line result)
        start-line (max 1 (- line qsearch-context-lookback))
        snippet-start (or (find-subsequence-index context-lines snippet-lines)
                          (let [idx (- line start-line)]
                            (when (<= 0 idx (dec (count context-lines)))
                              idx)))
        enclosing-line (when snippet-start
                         (enclosing-block-line context-lines snippet-lines snippet-start))]
    (if (and enclosing-line
             (not (some #{enclosing-line} snippet-lines)))
      (str enclosing-line "\n" snippet)
      snippet)))

(defn- qmd-get-args
  [action file start-line line-count]
  (qmd-args (:index action)
            ["get" (str file ":" start-line) "-l" (str line-count)]))

(defn- <expand-qmd-result-snippet
  [action result]
  (let [file (:file result)
        line (qmd-result-line result)
        snippet (:snippet result)]
    (if (and (string? file)
             (seq file)
             line
             (string? snippet)
             (seq snippet))
      (let [snippet-line-count (max 1 (count (split-snippet-lines snippet)))
            start-line (max 1 (- line qsearch-context-lookback))
            line-count (+ (- line start-line)
                          snippet-line-count
                          qsearch-context-lookahead)]
        (p/catch
         (p/let [get-result (<run-qmd (qmd-get-args action file start-line line-count))]
           (if (zero? (:exit get-result))
             (assoc result :snippet (expanded-snippet result (:out get-result)))
             result))
         (fn [_] result)))
      (p/resolved result))))

(defn- <expand-qmd-result-snippets
  [action results]
  (p/let [expanded (p/all (map #(<expand-qmd-result-snippet action %) results))]
    (vec expanded)))

(def ^:private qsearch-pull-selector
  show-command/block-render-selector)

(defn- qmd-result-by-id
  [results]
  (reduce-kv (fn [acc idx result]
               (reduce (fn [acc' id]
                         (if (contains? acc' id)
                           acc'
                           (assoc acc' id (assoc result :qmd/rank (inc idx)))))
                       acc
                       (extract-block-ids [result])))
             {}
             (vec (or results []))))

(defn- normalize-qsearch-item
  [entity qmd-result]
  (let [page (:block/page entity)]
    (cond-> {:db/id (:db/id entity)
             :block/title (:block/title entity)
             :qmd/rank (:qmd/rank qmd-result)}
      (:block/uuid entity) (assoc :block/uuid (:block/uuid entity))
      (:score qmd-result) (assoc :qmd/score (:score qmd-result))
      (:file qmd-result) (assoc :qmd/file (:file qmd-result))
      (:db/id page) (assoc :block/page-id (:db/id page))
      (or (:block/title page) (:block/name page))
      (assoc :block/page-title (or (:block/title page) (:block/name page))))))

(defn- qsearch-entity-present?
  [entity]
  (and (map? entity)
       (or (contains? entity :block/title)
           (contains? entity :block/uuid)
           (contains? entity :block/page))))

(defn- <normalize-qsearch-item-refs
  [config repo items]
  (let [uuid-strings (uuid-refs/collect-uuid-refs-from-items items [:block/title :block/page-title])]
    (p/let [uuid->label (uuid-refs/fetch-uuid-labels config repo uuid-strings)]
      (uuid-refs/normalize-item-string-fields items [:block/title :block/page-title] uuid->label))))

(defn- qsearch-ok-data
  ([action result-count items missing-ids]
   (qsearch-ok-data action result-count items missing-ids nil))
  ([action result-count items missing-ids human-data]
   (cond-> {:status :ok
            :data {:items items
                   :missing-ids missing-ids
                   :qmd {:collection (:collection action)
                         :index (:index action)
                         :result-count result-count}}}
     human-data (assoc :human {:qsearch human-data}))))

(defn- human-output?
  [config]
  (not (output-mode/structured? (output-mode/parse (:output-format config)))))

(defn- <qsearch-human-data
  [config action entities]
  (let [entities (vec (filter qsearch-entity-present? entities))]
    (if (seq entities)
      (p/let [items (show-command/attach-render-properties config (:repo action) entities)
              tree-data (show-command/prepare-tree-render-data
                         config
                         action
                         {:root {:block/children items}})]
        {:query (:query action)
         :items (get-in tree-data [:root :block/children])
         :property-titles (:property-titles tree-data)
         :property-value-labels (:property-value-labels tree-data)
         :uuid->label (:uuid->label tree-data)})
      (p/resolved {:query (:query action)
                   :items []}))))

(defn- qsearch-args
  [{:keys [query collection limit no-rerank index]}]
  (cond-> (qmd-args index ["query" query "--json" "-c" collection])
    limit (into ["-n" (str limit)])
    no-rerank (conj "--no-rerank")))

(defn execute-qsearch
  [action config]
  (p/let [cfg (cli-server/ensure-server! config (:repo action))
          qmd-result (<run-qmd (qsearch-args action))]
    (if-not (zero? (:exit qmd-result))
      (qmd-command-failed "qmd query failed" qmd-result)
      (if-let [parsed-results (parse-qmd-json-output (:out qmd-result))]
        (let [results (vec parsed-results)
              result-count (count results)]
          (p/let [results (<expand-qmd-result-snippets action results)]
            (let [ids (extract-block-ids results)]
              (cond
                (empty? results)
                (qsearch-ok-data action 0 [] [])

                (not (seq ids))
                {:status :error
                 :error {:code :qmd-no-block-ids
                         :message "QMD results did not include Markdown Mirror block ids"
                         :hint "Run `logseq qmd init [--graph <graph>]` and retry"}}

                :else
                (let [result-by-id (qmd-result-by-id results)]
                  (p/let [entities (p/all
                                    (map (fn [id]
                                           (transport/invoke cfg :thread-api/pull
                                                             [(:repo action) qsearch-pull-selector id]))
                                         ids))
                          pairs (mapv vector ids entities)
                          items (->> pairs
                                     (keep (fn [[id entity]]
                                             (when (qsearch-entity-present? entity)
                                               (normalize-qsearch-item entity
                                                                       (get result-by-id id)))))
                                     vec)
                          missing-ids (->> pairs
                                           (keep (fn [[id entity]]
                                                   (when-not (qsearch-entity-present? entity) id)))
                                           vec)
                          items (<normalize-qsearch-item-refs cfg (:repo action) items)
                          human-data (when (human-output? config)
                                       (<qsearch-human-data cfg action entities))]
                    (qsearch-ok-data action result-count items missing-ids human-data)))))))
        (if (string/blank? (:out qmd-result))
          (qsearch-ok-data action 0 [] [])
          (qmd-json-parse-failed qmd-result))))))
