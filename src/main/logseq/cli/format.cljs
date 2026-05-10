(ns logseq.cli.format
  "Formatting helpers for CLI output."
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.humanize :as cli-humanize]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.style :as style]
            [logseq.cli.tree-text :as tree-text]
            [logseq.common.util :as common-util]
            ["string-width" :default string-width]))

(defn- keyword->json-string
  [kw]
  (if-let [kw-ns (namespace kw)]
    (str kw-ns "/" (name kw))
    (name kw)))

(defn- normalize-json-key
  [entry-key]
  (if (keyword? entry-key)
    (keyword->json-string entry-key)
    entry-key))

(defn- normalize-json-value
  [entry]
  (cond
    (uuid? entry) (str entry)
    (keyword? entry) (keyword->json-string entry)
    :else entry))

(defn- normalize-json
  [value]
  (walk/postwalk (fn [entry]
                   (cond
                     (map? entry) (into {}
                                        (map (fn [[k v]]
                                               [(normalize-json-key k) v]))
                                        entry)
                     :else (normalize-json-value entry)))
                 value))

(defn- normalize-property-cardinality
  [value]
  (cond
    (nil? value) "one"
    (keyword? value) (let [normalized (name value)]
                       (if (#{"one" "many"} normalized)
                         normalized
                         "-"))
    (string? value) (if (#{"one" "many"} value) value "-")
    :else "-"))

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

(def ^:private list-human-title-max-display-width-default 40)
(def ^:private list-human-cell-max-lines 3)
(def ^:private truncation-suffix "…")
(def ^:private truncation-suffix-width (string-width truncation-suffix))

(defn- normalize-cell
  [value]
  (cond
    (nil? value) "-"
    (keyword? value) (str value)
    :else (str value)))

(defn- display-width
  [value]
  (string-width (normalize-cell value)))

(defn- pad-right
  [value width]
  (let [text (normalize-cell value)
        missing (- width (display-width text))]
    (if (pos? missing)
      (str text (apply str (repeat missing " ")))
      text)))

(defn- take-to-display-width
  [text max-width]
  (loop [remaining-chars (seq (js/Array.from text))
         acc ""]
    (if-let [ch (first remaining-chars)]
      (let [candidate (str acc ch)]
        (if (<= (display-width candidate) max-width)
          (recur (next remaining-chars) candidate)
          acc))
      acc)))

(defn- truncate-line-to-display-width
  [line max-width]
  (if (<= (display-width line) max-width)
    line
    (if (<= max-width truncation-suffix-width)
      (take-to-display-width truncation-suffix max-width)
      (str (take-to-display-width line (- max-width truncation-suffix-width))
           truncation-suffix))))

(defn- truncate-title-to-display-width
  [value max-width]
  (let [max-width (max 1 max-width)
        text (normalize-cell value)
        lines (if (string/includes? text "\n")
                (string/split-lines text)
                [text])]
    (->> lines
         (map #(truncate-line-to-display-width % max-width))
         (string/join "\n"))))

(defn- resolve-list-title-max-display-width
  [value]
  (if (and (number? value)
           (integer? value)
           (pos? value))
    value
    list-human-title-max-display-width-default))

(defn- truncate-cell-to-max-lines
  [value max-lines]
  (let [text (normalize-cell value)
        lines (if (string/includes? text "\n")
                (string/split-lines text)
                [text])]
    (if (and (pos? max-lines)
             (> (count lines) max-lines))
      (let [kept-lines (subvec (vec lines) 0 max-lines)
            suffix-line-idx (dec max-lines)]
        (string/join "\n"
                     (update kept-lines suffix-line-idx #(str % truncation-suffix))))
      text)))

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
                               (display-width header)
                               (mapcat #(map display-width (nth % idx)) normalized-rows)))
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
       (cli-humanize/format-count (count rows))))

(defn- missing-search-query-hint
  [command]
  (case command
    :search-block "Use: logseq search block --content <query>"
    :search-page "Use: logseq search page --content <query>"
    :search-property "Use: logseq search property --content <query>"
    :search-tag "Use: logseq search tag --content <query>"
    :qsearch "Use: logseq qsearch <query> [--graph <graph>]"
    "Use: logseq search <block|page|property|tag> --content <query>"))

(defn- error-hint
  [{:keys [code]} command]
  (case code
    :missing-graph "Use --graph <name>"
    :missing-repo "Use --graph <name>"
    :missing-content "Use --content or pass content as args"
    :missing-tag-name "Use --name <tag-name>"
    :missing-query "Use --query <edn>"
    :missing-query-text (missing-search-query-hint command)
    :qmd-no-block-ids "Run `logseq qmd [--graph <graph>]` and retry"
    :unknown-query "Use `logseq query list` to see available queries"
    :ambiguous-tag-name "Retry with --id <tag-id>"
    :ambiguous-property-name "Retry with --id <property-id>"
    :root-dir-permission "Check filesystem permissions or set LOGSEQ_CLI_ROOT_DIR"
    :server-owned-by-other "Retry from the process owner that started the server"
    :server-start-timeout-orphan "Check and stop lingering db-worker-node processes, then retry"
    :server-revision-mismatch "Logseq will restart revision-mismatched db-worker-node servers automatically; retry after stopping any lingering server manually"
    :server-revision-mismatch-restart-failed "Logseq tried to restart a revision-mismatched db-worker-node server and failed. Stop the server manually, then retry"
    :server-revision-mismatch-after-restart "Logseq restarted db-worker-node, but the replacement still reports a different revision. Check the installed Logseq build and retry"
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
  [error command]
  (let [{:keys [code message candidates context]} error
        hint (or (error-hint error command) (:hint error) (:hint context))
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
    (cli-humanize/relative-datetime ts now-ms)
    "-"))

(defn- format-task-datetime
  [value now-ms]
  (if-let [ts (parse-ts value)]
    (cli-humanize/relative-datetime ts now-ms)
    (if (string? value)
      (let [text (string/trim value)]
        (if (seq text)
          text
          "-"))
      "-")))

(defn- items-have-key?
  [items & ks]
  (some (fn [item] (some #(contains? item %) ks)) items))

(def ^:private list-page-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item)))           [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item)))  [:title :block/title :name]]
   ["UUID"       (fn [item _] (or (:block/uuid item) "-"))             [:block/uuid]]
   ["IDENT"      (fn [item _] (:db/ident item))                       [:db/ident]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-dynamic
  [items now-ms columns {:keys [title-max-display-width truncate-cell-max-lines]}]
  (let [items (or items [])
        active (filterv (fn [[_ _ ks always?]]
                          (or always? (apply items-have-key? items ks)))
                        columns)
        headers (mapv first active)
        rows (mapv (fn [item]
                     (mapv (fn [[header extractor _]]
                             (let [base-cell (extractor item now-ms)
                                   line-truncated-cell (if (number? truncate-cell-max-lines)
                                                         (truncate-cell-to-max-lines base-cell truncate-cell-max-lines)
                                                         base-cell)]
                               (if (and (= header "TITLE")
                                        (number? title-max-display-width))
                                 (truncate-title-to-display-width line-truncated-cell title-max-display-width)
                                 line-truncated-cell)))
                           active))
                   items)]
    (format-counted-table headers rows)))

(defn- format-list-page
  ([items now-ms]
   (format-list-dynamic items now-ms list-page-columns {:title-max-display-width nil
                                                         :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-page-columns {:title-max-display-width title-max-display-width
                                                         :truncate-cell-max-lines list-human-cell-max-lines})))

(defn- format-extends
  [classes]
  (if (seq classes) (string/join ", " classes) "-"))

(defn- format-properties
  [properties]
  (if (seq properties) (string/join ", " properties) "-"))

(def ^:private list-tag-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item)))           [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item)))  [:title :block/title :name]]
   ["UUID"       (fn [item _] (or (:block/uuid item) "-"))             [:block/uuid]]
   ["IDENT"      (fn [item _] (:db/ident item))                       [:db/ident]]
   ["EXTENDS"    (fn [item _] (format-extends (:logseq.property.class/extends item)))       [:logseq.property.class/extends]]
   ["PROPERTIES" (fn [item _] (format-properties (:logseq.property.class/properties item))) [:logseq.property.class/properties]]
   ["DESCRIPTION" (fn [item _] (:logseq.property/description item))  [:logseq.property/description]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-tag
  ([items now-ms]
   (format-list-dynamic items now-ms list-tag-columns {:title-max-display-width nil
                                                        :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-tag-columns {:title-max-display-width title-max-display-width
                                                        :truncate-cell-max-lines list-human-cell-max-lines})))

(defn- normalize-property-type
  [value]
  (cond
    (keyword? value) (name value)
    (nil? value) "-"
    :else (str value)))

(defn- format-classes
  [classes]
  (if (seq classes) (string/join ", " classes) "-"))

(def ^:private list-property-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item)))           [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item)))  [:title :block/title :name]]
   ["TYPE"       (fn [item _] (normalize-property-type (:logseq.property/type item))) [:logseq.property/type]]
   ["CARDINALITY" (fn [item _] (normalize-property-cardinality (:db/cardinality item))) [:db/cardinality]]
   ["CLASSES"    (fn [item _] (format-classes (:logseq.property/classes item)))       [:logseq.property/classes]]
   ["UUID"       (fn [item _] (or (:block/uuid item) "-"))             [:block/uuid]]
   ["IDENT"      (fn [item _] (:db/ident item))                       [:db/ident]]
   ["DESCRIPTION" (fn [item _] (:logseq.property/description item))  [:logseq.property/description]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-property
  ([items now-ms]
   (format-list-dynamic items now-ms list-property-columns {:title-max-display-width nil
                                                             :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-property-columns {:title-max-display-width title-max-display-width
                                                             :truncate-cell-max-lines list-human-cell-max-lines})))

(defn- format-task-choice
  [value prefix]
  (let [ident (cond
                (keyword? value) value
                (map? value) (:db/ident value)
                :else nil)]
    (cond
      ident (let [name' (name ident)]
              (if (string/starts-with? name' prefix)
                (subs name' (count prefix))
                name'))
      (string? value) value
      :else "-")))

(def ^:private list-task-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item))) [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item))) [:title :block/title :name]]
   ["STATUS"     (fn [item _] (format-task-choice (or (:status item) (:logseq.property/status item)) "status."))
    [:status :logseq.property/status]]
   ["PRIORITY"   (fn [item _] (format-task-choice (or (:priority item) (:logseq.property/priority item)) "priority."))
    [:priority :logseq.property/priority]]
   ["SCHEDULED"  (fn [item now-ms] (format-task-datetime (or (:scheduled item) (:logseq.property/scheduled item)) now-ms))
    [:scheduled :logseq.property/scheduled]]
   ["DEADLINE"   (fn [item now-ms] (format-task-datetime (or (:deadline item) (:logseq.property/deadline item)) now-ms))
    [:deadline :logseq.property/deadline]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-task
  ([items now-ms]
   (format-list-dynamic items now-ms list-task-columns {:title-max-display-width nil
                                                         :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-task-columns {:title-max-display-width title-max-display-width
                                                         :truncate-cell-max-lines list-human-cell-max-lines})))

(defn- normalize-node-type
  [value]
  (cond
    (keyword? value) (name value)
    (string? value) value
    :else "-"))

(def ^:private list-node-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item))) [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item))) [:title :block/title :name]]
   ["TYPE"       (fn [item _] (normalize-node-type (:node/type item))) [:node/type] true]
   ["PAGE-ID"    (fn [item _] (:block/page-id item)) [:block/page-id]]
   ["PAGE-TITLE" (fn [item _] (:block/page-title item)) [:block/page-title]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-node
  ([items now-ms]
   (format-list-dynamic items now-ms list-node-columns {:title-max-display-width nil
                                                         :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-node-columns {:title-max-display-width title-max-display-width
                                                         :truncate-cell-max-lines list-human-cell-max-lines})))

(defn- qsearch-item-id
  [item]
  (or (:db/id item) (:id item)))

(defn- qsearch-page-entity
  [item]
  (let [page (:block/page item)
        page-id (:block/page-id item)
        page-title (:block/page-title item)]
    (cond
      (map? page) page
      (or page-id page-title)
      (cond-> {}
        page-id (assoc :db/id page-id)
        page-title (assoc :block/title page-title))
      :else
      {:block/title "Unknown Page"})))

(defn- qsearch-page-label
  [page]
  (or (:block/title page)
      (:block/name page)
      (some-> (:block/uuid page) str)
      (some-> (:db/id page) str)
      "Unknown Page"))

(defn- qsearch-page-key
  [page]
  (if-let [id (:db/id page)]
    [:db/id id]
    [:label (qsearch-page-label page)]))

(defn- dedupe-qsearch-items
  [items]
  (second
   (reduce (fn [[seen acc] item]
             (let [id (qsearch-item-id item)]
               (if (and id (contains? seen id))
                 [seen acc]
                 [(cond-> seen id (conj id))
                  (conj acc item)])))
           [#{} []]
           (or items []))))

(defn- append-qsearch-group-item
  [{:keys [groups by-key] :as state} item]
  (let [page (qsearch-page-entity item)
        page-key (qsearch-page-key page)
        group-idx (get by-key page-key)
        item* (cond-> item
                (nil? (:db/id item)) (assoc :db/id (qsearch-item-id item)))]
    (if (some? group-idx)
      (update-in state [:groups group-idx :items] conj item*)
      (let [group {:page page
                   :items [item*]}
            group-idx (count groups)]
        (-> state
            (update :groups conj group)
            (assoc-in [:by-key page-key] group-idx))))))

(defn- qsearch-page-groups
  [items]
  (:groups
   (reduce append-qsearch-group-item
           {:groups [] :by-key {}}
           (dedupe-qsearch-items items))))

(defn- qsearch-group->text
  [{:keys [property-titles property-value-labels uuid->label]} {:keys [page items]}]
  (let [root (assoc page :block/children (vec items))]
    (tree-text/tree->text {:root root
                           :property-titles property-titles
                           :property-value-labels property-value-labels
                           :uuid->label uuid->label})))

(def ^:private ansi-or-text-pattern
  #"\u001b\[[0-9;]*m|[^\u001b]+")

(def ^:private regex-special-chars
  #{\. \* \+ \? \^ \$ \{ \} \( \) \| \[ \] \\})

(defn- escape-regex
  [value]
  (->> value
       str
       (map (fn [ch]
              (if (contains? regex-special-chars ch)
                (str "\\" ch)
                (str ch))))
       (apply str)))

(defn- qsearch-highlight-terms
  [query]
  (->> (string/split (or query "") #"\s+")
       (map string/trim)
       (remove string/blank?)
       (sort-by count >)
       (map escape-regex)
       distinct
       vec))

(defn- highlight-qsearch-query
  [text query]
  (let [terms (qsearch-highlight-terms query)]
    (if (seq terms)
      (let [pattern (js/RegExp. (string/join "|" terms) "gi")
            highlight-segment (fn [segment]
                                (if (re-matches style/ansi-pattern segment)
                                  segment
                                  (string/replace segment pattern
                                                  (fn [match]
                                                    (style/yellow match)))))]
        (->> (re-seq ansi-or-text-pattern text)
             (map highlight-segment)
             (apply str)))
      text)))

(defn- format-qsearch
  [data human-data _now-ms _title-max-display-width]
  (let [render-items (if (and (map? human-data)
                              (contains? human-data :items))
                       (:items human-data)
                       (:items data))
        groups (qsearch-page-groups render-items)
        body (if (seq groups)
               (string/join "\n\n" (map #(qsearch-group->text human-data %) groups))
               "No matches")
        missing-ids (vec (or (:missing-ids data) []))]
    (highlight-qsearch-query
     (cond-> body
       (seq missing-ids)
       (str "\nMissing ids: " (string/join ", " missing-ids)))
     (:query human-data))))

(defn- format-qmd
  [{:keys [collection mirror-dir collection-action embed]
    update-status :update}]
  (string/join "\n"
               [(str "QMD ready: " (or collection "-"))
                (str "Mirror: " (or mirror-dir "-"))
                (str "Collection: " (name (or collection-action :unknown)))
                (str "Embed: " (name (or embed :unknown)))
                (str "Update: " (name (or update-status :unknown)))]))

(defn- normalize-asset-type
  [value]
  (cond
    (keyword? value) (name value)
    (string? value) value
    :else "-"))

(def ^:private list-asset-columns
  [["ID"         (fn [item _] (or (:db/id item) (:id item))) [:db/id :id]]
   ["TITLE"      (fn [item _] (or (:title item) (:block/title item) (:name item))) [:title :block/title :name]]
   ["ASSET-TYPE" (fn [item _] (normalize-asset-type (:logseq.property.asset/type item))) [:logseq.property.asset/type]]
   ["SIZE"       (fn [item _] (cli-humanize/format-filesize (:logseq.property.asset/size item))) [:logseq.property.asset/size]]
   ["UPDATED-AT" (fn [item now-ms] (human-ago (or (:updated-at item) (:block/updated-at item)) now-ms)) [:updated-at :block/updated-at]]
   ["CREATED-AT" (fn [item now-ms] (human-ago (or (:created-at item) (:block/created-at item)) now-ms)) [:created-at :block/created-at]]])

(defn- format-list-asset
  ([items now-ms]
   (format-list-dynamic items now-ms list-asset-columns {:title-max-display-width nil
                                                          :truncate-cell-max-lines nil}))
  ([items now-ms title-max-display-width]
   (format-list-dynamic items now-ms list-asset-columns {:title-max-display-width title-max-display-width
                                                          :truncate-cell-max-lines list-human-cell-max-lines})))

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
  [legacy-item graphs-dir]
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
        (let [source-path (if (seq graphs-dir)
                            (posix-join graphs-dir legacy-dir)
                            legacy-dir)
              target-path (if (seq graphs-dir)
                            (posix-join graphs-dir target-graph-dir)
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
  [{:keys [graphs graph-items]} {:keys [current-graph graphs-dir]}]
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
      (let [legacy-count (count legacy-items)
            warning-lines (vec (concat [(str "Warning: "
                                             (cli-humanize/format-count legacy-count)
                                             " legacy graph "
                                             (cli-humanize/pluralize-noun legacy-count "directory")
                                             " detected.")]
                                       (mapcat #(format-legacy-warning-lines % graphs-dir) legacy-items)))]
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

(defn- format-debug-pull
  [{:keys [entity lookup selector]}]
  (let [header [(str "Selector: " (pr-str selector))
                (str "Lookup: " (pr-str lookup))
                "Entity:"]
        entity* (-> (with-out-str (pprint/pprint entity))
                    string/trimr)]
    (string/join "\n" (conj header entity*))))

(defn- format-example
  [{:keys [selector matched-commands examples message]}]
  (let [selector (or selector "-")
        matched-commands (vec (or matched-commands []))
        examples (vec (or examples []))
        matched-lines (if (seq matched-commands)
                        (mapv #(str "  - " %) matched-commands)
                        ["  - (none)"])
        example-lines (if (seq examples)
                        (mapv #(str "  - " %) examples)
                        ["  - (none)"])]
    (string/join "\n"
                 (concat (when (seq message) [message ""])
                         [(str "Selector: " selector)
                          "Matched commands:"]
                         matched-lines
                         ["Examples:"]
                         example-lines))))

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

(defn- format-server-cleanup-target
  [{:keys [repo pid owner-source revision]}]
  (str "  - " (normalize-cell repo)
       " (pid: " (normalize-cell pid)
       ", owner: " (normalize-cell owner-source)
       ", revision: " (normalize-cell revision)
       ")"))

(defn- format-server-cleanup-failed-target
  [{:keys [repo pid owner-source revision error]}]
  (str "  - " (normalize-cell repo)
       " (pid: " (normalize-cell pid)
       ", owner: " (normalize-cell owner-source)
       ", revision: " (normalize-cell revision)
       ", error: " (normalize-cell (or (:code error) :unknown))
       " - " (normalize-cell (:message error))
       ")"))

(defn- format-server-cleanup
  [{:keys [cli-revision checked mismatched eligible skipped-owner skipped-owner-targets killed failed]}]
  (let [failed (vec (or failed []))
        skipped-owner-targets (vec (or skipped-owner-targets []))
        header-lines ["Server cleanup summary"
                      (str "CLI revision: " (normalize-cell cli-revision))
                      (str "Checked: " (cli-humanize/format-count (or checked 0)))
                      (str "Mismatched: " (cli-humanize/format-count (or mismatched 0)))
                      (str "Eligible (:cli owner): " (cli-humanize/format-count (or eligible 0)))
                      (str "Skipped owner mismatch: " (cli-humanize/format-count (or skipped-owner 0)))
                      (str "Killed: " (cli-humanize/format-count (count (or killed []))))
                      (str "Failed: " (cli-humanize/format-count (count failed)))]
        skipped-lines (when (seq skipped-owner-targets)
                        (into ["" "Skipped owner targets:"]
                              (mapv format-server-cleanup-target skipped-owner-targets)))
        failed-lines (when (seq failed)
                       (into ["" "Failed targets:"]
                             (mapv format-server-cleanup-failed-target failed)))]
    (string/join "\n" (concat header-lines skipped-lines failed-lines))))

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
                 (cond-> ["Sync status"
                          (str "repo: " (or repo "-"))
                          (str "graph-id: " (or graph-id "-"))
                          (str "ws-state: " (or ws-state :unknown))
                          (str "pending-local: " (cli-humanize/format-count (or pending-local 0)))
                          (str "pending-asset: " (cli-humanize/format-count (or pending-asset 0)))
                          (str "pending-server: " (cli-humanize/format-count (or pending-server 0)))
                          (str "local-tx: " (if (number? local-tx)
                                               (cli-humanize/format-count local-tx)
                                               "-"))
                          (str "remote-tx: " (if (number? remote-tx)
                                                (cli-humanize/format-count remote-tx)
                                                "-"))]
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

(defn- format-sync-asset-download
  [{:keys [repo]} {:keys [asset-uuid download-requested? checksum-status hint]}]
  (cond
    (= :mismatch checksum-status)
    (str (or hint "Local asset checksum mismatched; requested re-download.")
         " " asset-uuid)

    (false? download-requested?)
    (str "Sync asset already downloaded: " asset-uuid " (repo: " repo ")")

    :else
    (str "Sync asset download requested: " asset-uuid " (repo: " repo ")")))

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
                         (seq update-tags) (conj (str "tags:+" (cli-humanize/format-count (count update-tags))))
                         (seq update-properties) (conj (str "properties:+" (cli-humanize/format-count (count update-properties))))
                         (seq remove-tags) (conj (str "remove-tags:+" (cli-humanize/format-count (count remove-tags))))
                         (seq remove-properties) (conj (str "remove-properties:+" (cli-humanize/format-count (count remove-properties)))))
          changes (when (seq change-parts)
                    (str ", " (string/join ", " change-parts)))
          move-fragment (when (seq target)
                          (str " -> " target))]
      (str "Upserted block: " source (or move-fragment "") " (repo: " repo (or changes "") ")"))))

(defn- format-upsert-page
  [_context ids]
  (str "Upserted page:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-task
  [_context ids]
  (str "Upserted task:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-tag
  [_context ids]
  (str "Upserted tag:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-property
  [_context ids]
  (str "Upserted property:\n" (pr-str (vec (or ids [])))))

(defn- format-upsert-asset
  [_context ids]
  (str "Upserted asset:\n" (pr-str (vec (or ids [])))))

(defn- format-remove-block
  [{:keys [repo uuid id ids]}]
  (cond
    (seq uuid) (str "Removed block: " uuid " (repo: " repo ")")
    (seq ids) (str "Removed blocks: " (cli-humanize/format-count (count ids)) " (repo: " repo ")")
    (some? id) (str "Removed block: " id " (repo: " repo ")")
    :else (str "Removed block (repo: " repo ")")))

(defn- format-remove-page
  [{:keys [repo page]}]
  (str "Removed page: " page " (repo: " repo ")"))

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
  [_context {:keys [message]}]
  message)

(defn- format-graph-backup-list
  [backups now-ms]
  (format-counted-table
   ["NAME" "CREATED-AT" "SIZE-BYTES"]
   (mapv (fn [{:keys [name created-at size-bytes]}]
           [(or name "-")
            (human-ago created-at now-ms)
            (or size-bytes 0)])
         (or backups []))))

(defn- format-graph-backup-create
  [context data]
  (let [backup-name (or (:backup-name data) (:backup-name context) "-")
        graph (or (:graph context) "-")]
    (str "Created backup: " backup-name " (graph: " graph ")")))

(defn- format-graph-backup-restore
  [{:keys [src dst]}]
  (str "Restored backup " (or src "-") " -> " (or dst "-")))

(defn- format-graph-backup-remove
  [{:keys [src]}]
  (str "Removed backup: " (or src "-")))

(defn- format-graph-create-enable-sync
  [{:keys [graph stages]}]
  (string/join "\n"
               ["Graph created and sync enabled"
                (str "  Graph: " (or graph "-"))
                (str "  Create: " (if (contains? stages :create) "ok" "-"))
                (str "  Sync upload: " (if (contains? stages :upload) "ok" "-"))
                (str "  Sync start: " (if (contains? stages :start) "ok" "-"))]))

(defn- format-graph-action
  [command {:keys [graph]} data]
  (if (and (= command :graph-create)
           (map? (:stages data)))
    (format-graph-create-enable-sync data)
    (let [verb (case command
                 :graph-create "Created"
                 :graph-switch "Switched to"
                 :graph-remove "Removed"
                 :graph-validate "Validated"
                 "Updated")]
      (str verb " graph " (pr-str graph)))))

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
  [{:keys [status data error command context human]}
   {:keys [now-ms graph graphs-dir list-title-max-display-width]}]
  (let [now-ms (or now-ms (js/Date.now))
        list-title-max-display-width (resolve-list-title-max-display-width list-title-max-display-width)]
    (case status
      :ok
      (case command
        :graph-list (format-graph-list data {:current-graph graph
                                             :graphs-dir graphs-dir})
        :graph-backup-list (format-graph-backup-list (:backups data) now-ms)
        :graph-backup-create (format-graph-backup-create context data)
        :graph-backup-restore (format-graph-backup-restore context)
        :graph-backup-remove (format-graph-backup-remove context)
        :graph-info (format-graph-info data now-ms)
        (:graph-create :graph-switch :graph-remove :graph-validate)
        (format-graph-action command context data)
        :server-list (format-server-list (:servers data)
                                         (get-in human [:server-list :revision-mismatch]))
        :server-cleanup (format-server-cleanup data)
        (:server-start :server-stop :server-restart)
        (format-server-action command data)
        :sync-status (format-sync-status data)
        :sync-remote-graphs (format-sync-remote-graphs (:graphs data))
        (:sync-start :sync-stop :sync-upload :sync-download :sync-ensure-keys :sync-grant-access)
        (format-sync-action command context)
        :sync-asset-download (format-sync-asset-download context data)
        :sync-config-get (format-sync-config-get data)
        :sync-config-set (format-sync-config-set data)
        :sync-config-unset (format-sync-config-unset data)
        :login (format-login data)
        :logout (format-logout data)
        :list-page (format-list-page (:items data) now-ms list-title-max-display-width)
        :list-tag (format-list-tag (:items data) now-ms list-title-max-display-width)
        :list-property (format-list-property (:items data) now-ms list-title-max-display-width)
        :list-task (format-list-task (:items data) now-ms list-title-max-display-width)
        :list-node (format-list-node (:items data) now-ms list-title-max-display-width)
        :list-asset (format-list-asset (:items data) now-ms list-title-max-display-width)
        (:search-block :search-page :search-property :search-tag)
        (format-list-page (:items data) now-ms)
        :qmd (format-qmd data)
        :qsearch (format-qsearch data (get-in human [:qsearch]) now-ms list-title-max-display-width)
        :upsert-block (format-upsert-block context (:result data))
        :upsert-page (format-upsert-page context (:result data))
        :upsert-task (format-upsert-task context (:result data))
        :upsert-asset (format-upsert-asset context (:result data))
        :upsert-tag (format-upsert-tag context (:result data))
        :upsert-property (format-upsert-property context (:result data))
        :remove-block (format-remove-block context)
        :remove-page (format-remove-page context)
        :remove-tag (format-remove-tag context)
        :remove-property (format-remove-property context)
        :graph-export (format-graph-export context)
        :graph-import (format-graph-import context data)
        :query (format-query-results (:result data))
        :query-list (format-query-list (:queries data))
        :example (format-example data)
        :show (or (:message data) (pr-str data))
        :debug-pull (format-debug-pull data)
        :doctor (format-doctor (:status data) (:checks data))
        (if (and (map? data) (contains? data :message))
          (:message data)
          (pr-str data)))

      :error
      (if (= :doctor command)
        (format-doctor (or (get-in data [:status]) :error)
                       (or (get-in data [:checks])
                           (get-in error [:checks])))
        (format-error error command))

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
        mode (or (output-mode/parse output-format) :human)]
    (case mode
      :json (->json result)
      :edn (->edn result)
      (->human result opts))))
