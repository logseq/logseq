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
  [:db/id :block/uuid :block/title :block/order {:block/parent [:db/id]}])

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
                                       [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}] id])]
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
                                         [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}]
                                          [:block/uuid (uuid uuid-str)]])
                entity (if (:db/id entity)
                         entity
                         (transport/invoke config :thread-api/pull false
                                           [repo [:db/id :block/name :block/uuid :block/title {:block/page [:db/id :block/title]}]
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
                                            [repo [:db/id :block/uuid :block/title] [:block/name page-name]])]
        (if-let [page-id (:db/id page-entity)]
          (p/let [blocks (fetch-blocks-for-page config repo page-id)
                  children (build-tree blocks page-id max-depth)]
            {:root (assoc page-entity :block/children children)})
          (throw (ex-info "page not found" {:code :page-not-found}))))

      :else
      (p/rejected (ex-info "block or page required" {:code :missing-target})))))

(defn tree->text
  [{:keys [root]}]
  (let [label (fn [node]
                (or (:block/title node) (:block/name node) (str (:block/uuid node))))
        node-id (fn [node]
                  (or (:db/id node) "-"))
        id-padding (fn [node]
                     (apply str (repeat (inc (count (str (node-id node)))) " ")))
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
                         line (str (node-id child) " " prefix branch first-row)]
                     (swap! lines conj line)
                     (doseq [row rest-rows]
                       (swap! lines conj (str (id-padding child) next-prefix row)))
                     (walk child next-prefix)))))]
    (let [rows (split-lines (label root))
          first-row (first rows)
          rest-rows (rest rows)]
      (swap! lines conj (str (node-id root) " " first-row))
      (doseq [row rest-rows]
        (swap! lines conj (str (id-padding root) row))))
    (walk root "")
    (string/join "\n" @lines)))

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
           :data {:message (tree->text tree-data)}}))))
