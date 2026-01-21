(ns logseq.cli.command.show
  "Show-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private show-spec
  {:id {:desc "Block db/id"
        :coerce :long}
   :uuid {:desc "Block UUID"}
   :page-name {:desc "Page name"}
   :level {:desc "Limit tree depth"
           :coerce :long}
   :format {:desc "Output format (text, json, edn)"}})

(def entries
  [(core/command-entry ["show"] :show "Show tree" show-spec)])

(def ^:private show-formats
  #{"text" "json" "edn"})

(defn invalid-options?
  [opts]
  (let [format (:format opts)
        level (:level opts)]
    (cond
      (and (seq format) (not (contains? show-formats (string/lower-case format))))
      (str "invalid format: " format)

      (and (some? level) (< level 1))
      "level must be >= 1"

      :else
      nil)))

(def ^:private tree-block-selector
  [:db/id
   :block/uuid
   :block/title
   {:logseq.property/status [:db/ident :block/name :block/title]}
   :block/order
   {:block/parent [:db/id]}
   {:block/tags [:db/id :block/name :block/title :block/uuid]}])

(def ^:private linked-ref-selector
  [:db/id
   :block/uuid
   :block/title
   {:logseq.property/status [:db/ident :block/name :block/title]}
   {:block/tags [:db/id :block/name :block/title :block/uuid]}
   {:block/page [:db/id :block/name :block/title :block/uuid]}
   {:block/parent [:db/id
                   :block/name
                   :block/title
                   :block/uuid
                   {:block/page [:db/id :block/name :block/title :block/uuid]}]}])

(declare tree->text)

(def ^:private uuid-ref-pattern #"\[\[([0-9a-fA-F-]{36})\]\]")
(def ^:private uuid-ref-max-depth 10)

(defn- tag-label
  [tag]
  (or (:block/title tag)
      (:block/name tag)
      (some-> (:block/uuid tag) str)))

(defn- replace-uuid-refs-once
  [value uuid->label]
  (if (and (string? value) (seq uuid->label))
    (string/replace value uuid-ref-pattern
                    (fn [[_ id]]
                      (if-let [label (get uuid->label (string/lower-case id))]
                        (str "[[" label "]]")
                        (str "[[" id "]]"))))
    value))

(defn- replace-uuid-refs
  [value uuid->label]
  (loop [current value
         remaining uuid-ref-max-depth]
    (if (or (not (string? current)) (zero? remaining) (empty? uuid->label))
      current
      (let [next (replace-uuid-refs-once current uuid->label)]
        (if (= next current)
          current
          (recur next (dec remaining)))))))

(defn- tags->suffix
  [tags]
  (let [labels (->> tags
                    (map tag-label)
                    (remove string/blank?))]
    (when (seq labels)
      (string/join " " (map #(str "#" %) labels)))))

(defn- status-from-ident
  [ident]
  (let [name* (name ident)
        parts (string/split name* #"\.")
        status (or (last parts) name*)]
    (string/upper-case status)))

(defn- status-label
  [node]
  (let [status (:logseq.property/status node)]
    (cond
      (string? status) (when (seq status) status)
      (keyword? status) (status-from-ident status)
      (map? status) (or (:block/title status)
                        (:block/name status)
                        (when-let [ident (:db/ident status)]
                          (status-from-ident ident)))
      :else nil)))

(defn- block-label
  [node]
  (let [title (:block/title node)
        status (status-label node)
        uuid->label (:uuid->label node)
        base (cond
               (and title (seq status)) (str status " " title)
               title title
               (:block/name node) (:block/name node)
               (:block/uuid node) (some-> (:block/uuid node) str))
        base (replace-uuid-refs base uuid->label)
        tags-suffix (tags->suffix (:block/tags node))]
    (cond
      (and base tags-suffix) (str base " " tags-suffix)
      tags-suffix tags-suffix
      :else base)))

(defn- resolve-uuid-refs-in-node
  [node uuid->label]
  (cond-> node
    (:block/title node) (update :block/title replace-uuid-refs uuid->label)
    (:block/name node) (update :block/name replace-uuid-refs uuid->label)
    (:block/children node) (update :block/children (fn [children]
                                                     (mapv #(resolve-uuid-refs-in-node % uuid->label) children)))
    (:block/page node) (update :block/page (fn [page]
                                             (if (map? page)
                                               (resolve-uuid-refs-in-node page uuid->label)
                                               page)))
    (:block/tags node) (update :block/tags (fn [tags]
                                             (mapv #(resolve-uuid-refs-in-node % uuid->label) tags)))))

(defn- resolve-uuid-refs-in-tree-data
  [{:keys [linked-references] :as tree-data} uuid->label]
  (let [resolve-node #(resolve-uuid-refs-in-node % uuid->label)]
    (cond-> (update tree-data :root resolve-node)
      (seq (:blocks linked-references))
      (update :linked-references
              (fn [refs]
                (update refs :blocks #(mapv resolve-node %)))))))

(defn- page-label
  [block]
  (let [page (:block/page block)]
    (or (:block/title page)
        (:block/name page)
        (some-> (:block/uuid page) str)
        (some-> (:block/uuid block) str))))

(defn- fetch-linked-references
  [config repo root-id]
  (p/let [refs (transport/invoke config :thread-api/get-block-refs false [repo root-id])
          ref-ids (vec (keep :db/id refs))
          pulled (if (seq ref-ids)
                   (p/all (map (fn [id]
                                 (transport/invoke config :thread-api/pull false [repo linked-ref-selector id]))
                               ref-ids))
                   [])]
    (let [blocks (vec (remove nil? pulled))
          page-lookup-key (fn [value]
                            (cond
                              (map? value) (or (:db/id value)
                                               (when-let [uuid (:block/uuid value)]
                                                 [:block/uuid uuid]))
                              (number? value) value
                              (uuid? value) [:block/uuid value]
                              (and (string? value) (common-util/uuid-string? value)) [:block/uuid (uuid value)]
                              :else nil))
          page-id-from (fn [block]
                         (let [page (:block/page block)
                               parent (:block/parent block)
                               parent-page (:block/page parent)]
                           (or (page-lookup-key page)
                               (page-lookup-key parent-page)
                               (page-lookup-key parent))))
          page-ids (->> blocks
                        (keep page-id-from)
                        distinct
                        vec)]
      (p/let [pages (if (seq page-ids)
                      (p/all (map (fn [id]
                                    (transport/invoke config :thread-api/pull false
                                                      [repo [:db/id :block/name :block/title :block/uuid] id]))
                                  page-ids))
                      [])]
        (let [page-id->page (zipmap page-ids pages)
              blocks (mapv (fn [block]
                             (let [page (:block/page block)
                                   parent (:block/parent block)
                                   parent-page (:block/page parent)
                                   page-id (page-id-from block)
                                   page (or (when (map? page)
                                              (select-keys page [:db/id :block/name :block/title :block/uuid]))
                                            (when (map? parent-page)
                                              (select-keys parent-page [:db/id :block/name :block/title :block/uuid]))
                                            (get page-id->page page-id)
                                            (when (map? parent)
                                              (select-keys parent [:db/id :block/name :block/title :block/uuid]))
                                            (when (or (:block/title block) (:block/name block) (:block/uuid block))
                                              (select-keys block [:db/id :block/name :block/title :block/uuid])))]
                               (cond-> (dissoc block :block/parent)
                                 page (assoc :block/page page))))
                           blocks)]
          {:count (count blocks)
           :blocks blocks})))))

(defn- linked-refs->text
  [blocks uuid->label]
  (let [page-key (fn [block]
                   (let [page (:block/page block)]
                     (or (:db/id page)
                         (:block/uuid page)
                         (page-label block))))
        page-node (fn [block]
                    (let [page (:block/page block)]
                      (cond
                        (map? page) page
                        (some? page) {:db/id page}
                        :else {})))
        groups (->> blocks
                    (group-by page-key)
                    (sort-by (fn [[_ page-blocks]]
                               (page-label (first page-blocks)))))]
    (string/join
     "\n\n"
     (map (fn [[_ page-blocks]]
            (let [root (page-node (first page-blocks))
                  root (assoc root :block/children (vec page-blocks))]
              (tree->text {:root root :uuid->label uuid->label})))
          groups))))

(defn- extract-uuid-refs
  [value]
  (->> (re-seq uuid-ref-pattern (or value ""))
       (map second)
       (filter common-util/uuid-string?)
       distinct))

(defn- collect-uuid-refs
  [{:keys [root]} linked-refs]
  (let [collect-nodes (fn collect-nodes [node]
                        (if-let [children (:block/children node)]
                          (into [node] (mapcat collect-nodes children))
                          [node]))
        nodes (when root (collect-nodes root))
        ref-blocks (:blocks linked-refs)
        pages (keep :block/page ref-blocks)
        texts (->> (concat nodes ref-blocks pages)
                   (mapcat (fn [node] (keep node [:block/title :block/name])))
                   (remove string/blank?))]
    (->> texts
         (mapcat extract-uuid-refs)
         distinct
         vec)))

(defn- fetch-uuid-labels
  [config repo uuid-strings]
  (if (seq uuid-strings)
    (p/let [blocks (p/all (map (fn [uuid-str]
                                 (transport/invoke config :thread-api/pull false
                                                   [repo [:block/uuid :block/title :block/name]
                                                    [:block/uuid (uuid uuid-str)]]))
                               uuid-strings))]
      (->> blocks
           (remove nil?)
           (map (fn [block]
                  (let [uuid-str (some-> (:block/uuid block) str)]
                    [(string/lower-case uuid-str)
                     (or (:block/title block) (:block/name block) uuid-str)])))
           (into {})))
    (p/resolved {})))

(defn- fetch-blocks-for-page
  [config repo page-id]
  (let [query [:find (list 'pull '?b tree-block-selector)
               :in '$ '?page-id
               :where ['?b :block/page '?page-id]]]
    (p/let [rows (transport/invoke config :thread-api/q false [repo [query page-id]])]
      (mapv first rows))))

(defn- build-tree
  [blocks root-id max-depth]
  (let [parent->children (group-by #(get-in % [:block/parent :db/id]) blocks)
        sort-children (fn [children]
                        (vec (sort-by :block/order children)))
        build (fn build [parent-id depth]
                (mapv (fn [b]
                        (let [children (build (:db/id b) (inc depth))]
                          (cond-> b
                            (seq children) (assoc :block/children children))))
                      (if (and max-depth (>= depth max-depth))
                        []
                        (sort-children (get parent->children parent-id)))))]
    (build root-id 1)))

(defn- fetch-tree
  [config {:keys [repo id page-name level] :as opts}]
  (let [max-depth (or level 10)
        uuid-str (:uuid opts)]
    (cond
      (some? id)
      (p/let [entity (transport/invoke config :thread-api/pull false
                                       [repo [:db/id :block/name :block/uuid :block/title
                                              {:logseq.property/status [:db/ident :block/name :block/title]}
                                              {:block/page [:db/id :block/title]}
                                              {:block/tags [:db/id :block/name :block/title :block/uuid]}] id])]
        (if-let [page-id (get-in entity [:block/page :db/id])]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks (:db/id entity) max-depth)]
            {:root (assoc entity :block/children children)})
          (if (:db/id entity)
            (p/let [blocks (fetch-blocks-for-page config repo (:db/id entity))
                    children (build-tree blocks (:db/id entity) max-depth)]
              {:root (assoc entity :block/children children)})
            (throw (ex-info "block not found" {:code :block-not-found})))))

      (seq uuid-str)
      (if-not (common-util/uuid-string? uuid-str)
        (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
        (p/let [entity (transport/invoke config :thread-api/pull false
                                         [repo [:db/id :block/name :block/uuid :block/title
                                                {:logseq.property/status [:db/ident :block/name :block/title]}
                                                {:block/page [:db/id :block/title]}
                                                {:block/tags [:db/id :block/name :block/title :block/uuid]}]
                                          [:block/uuid (uuid uuid-str)]])
                entity (if (:db/id entity)
                         entity
                         (transport/invoke config :thread-api/pull false
                                           [repo [:db/id :block/name :block/uuid :block/title
                                                  {:logseq.property/status [:db/ident :block/name :block/title]}
                                                  {:block/page [:db/id :block/title]}
                                                  {:block/tags [:db/id :block/name :block/title :block/uuid]}]
                                            [:block/uuid uuid-str]]))]
          (if-let [page-id (get-in entity [:block/page :db/id])]
            (p/let [blocks (fetch-blocks-for-page config repo page-id)
                    children (build-tree blocks (:db/id entity) max-depth)]
              {:root (assoc entity :block/children children)})
            (if (:db/id entity)
              (p/let [blocks (fetch-blocks-for-page config repo (:db/id entity))
                      children (build-tree blocks (:db/id entity) max-depth)]
                {:root (assoc entity :block/children children)})
              (throw (ex-info "block not found" {:code :block-not-found}))))))

      (seq page-name)
      (p/let [page-entity (transport/invoke config :thread-api/pull false
                                            [repo [:db/id :block/uuid :block/title
                                                   {:logseq.property/status [:db/ident :block/name :block/title]}
                                                   {:block/tags [:db/id :block/name :block/title :block/uuid]}]
                                             [:block/name page-name]])]
        (if-let [page-id (:db/id page-entity)]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks page-id max-depth)]
            {:root (assoc page-entity :block/children children)})
          (throw (ex-info "page not found" {:code :page-not-found}))))

      :else
      (p/rejected (ex-info "block or page required" {:code :missing-target})))))

(defn tree->text
  [{:keys [root uuid->label]}]
  (let [label (fn [node]
                (or (block-label (assoc node :uuid->label uuid->label)) "-"))
        node-id (fn [node]
                  (or (:db/id node) "-"))
        collect-nodes (fn collect-nodes [node]
                        (if-let [children (:block/children node)]
                          (into [node] (mapcat collect-nodes children))
                          [node]))
        nodes (collect-nodes root)
        id-width (apply max (map (fn [node] (count (str (node-id node)))) nodes))
        pad-id (fn [node]
                 (let [id-str (str (node-id node))
                       padding (max 0 (- id-width (count id-str)))]
                   (str id-str (apply str (repeat padding " ")))))
        id-padding (apply str (repeat (inc id-width) " "))
        split-lines (fn [value]
                      (string/split (or value "") #"\n"))
        lines (atom [])
        walk (fn walk [node prefix]
               (let [children (:block/children node)
                     total (count children)]
                 (doseq [[idx child] (map-indexed vector children)]
                   (let [last-child? (= idx (dec total))
                         branch (if last-child? "└── " "├── ")
                         next-prefix (str prefix (if last-child? "    " "│   "))
                         rows (split-lines (label child))
                         first-row (first rows)
                         rest-rows (rest rows)
                         line (str (pad-id child) " " prefix branch first-row)]
                     (swap! lines conj line)
                     (doseq [row rest-rows]
                       (swap! lines conj (str id-padding next-prefix row)))
                     (walk child next-prefix)))))]
    (let [rows (split-lines (label root))
          first-row (first rows)
          rest-rows (rest rows)]
      (swap! lines conj (str (pad-id root) " " first-row))
      (doseq [row rest-rows]
        (swap! lines conj (str id-padding row))))
    (walk root "")
    (string/join "\n" @lines)))

(defn- tree->text-with-linked-refs
  [{:keys [linked-references uuid->label] :as tree-data}]
  (let [tree-text (tree->text tree-data)
        refs (:blocks linked-references)
        count (:count linked-references)]
    (if (seq refs)
      (str tree-text
           "\n\n"
           "Linked References (" count ")\n"
           (linked-refs->text refs uuid->label))
      tree-text)))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for show"}}
    (let [format (some-> (:format options) string/lower-case)
          targets (filter some? [(:id options) (:uuid options) (:page-name options)])]
      (if (empty? targets)
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}
        {:ok? true
         :action {:type :show
                  :repo repo
                  :id (:id options)
                  :uuid (:uuid options)
                  :page-name (:page-name options)
                  :level (:level options)
                  :format format}}))))

(defn execute-show
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              tree-data (fetch-tree cfg action)
              root-id (get-in tree-data [:root :db/id])
              linked-refs (if root-id
                            (fetch-linked-references cfg (:repo action) root-id)
                            {:count 0 :blocks []})
              uuid-refs (collect-uuid-refs tree-data linked-refs)
              uuid->label (fetch-uuid-labels cfg (:repo action) uuid-refs)
              tree-data (assoc tree-data
                               :linked-references linked-refs
                               :uuid->label uuid->label)
              tree-data (resolve-uuid-refs-in-tree-data tree-data uuid->label)
              format (:format action)]
        (case format
          "edn"
          {:status :ok
           :data tree-data
           :output-format :edn}

          "json"
          {:status :ok
           :data tree-data
           :output-format :json}

          {:status :ok
           :data {:message (tree->text-with-linked-refs tree-data)}}))))
