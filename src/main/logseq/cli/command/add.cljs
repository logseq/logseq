(ns logseq.cli.command.add
  "Add-related CLI commands."
  (:require ["fs" :as fs]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [promesa.core :as p]))

(def ^:private content-add-spec
  {:content {:desc "Block content for add"}
   :blocks {:desc "EDN vector of blocks for add"}
   :blocks-file {:desc "EDN file of blocks for add"}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"}
   :target-page-name {:desc "Target page name"}
   :pos {:desc "Position (first-child, last-child, sibling)"}
   :status {:desc "Task status (todo, doing, done, etc.)"}})

(def ^:private add-page-spec
  {:page {:desc "Page name"}})

(def entries
  [(core/command-entry ["add" "block"] :add-block "Add blocks" content-add-spec)
   (core/command-entry ["add" "page"] :add-page "Create page" add-page-spec)])

(defn- today-page-title
  [config repo]
  (p/let [journal (transport/invoke config :thread-api/pull false
                                    [repo [:logseq.property.journal/title-format] :logseq.class/Journal])
          formatter (or (:logseq.property.journal/title-format journal) "MMM do, yyyy")
          now (tc/from-date (js/Date.))]
    (date-time-util/format now formatter)))

(defn- ensure-page!
  [config repo page-name]
  (p/let [page (transport/invoke config :thread-api/pull false
                                 [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])]
    (if (:db/id page)
      page
      (p/let [_ (transport/invoke config :thread-api/apply-outliner-ops false
                                  [repo [[:create-page [page-name {}]]] {}])]
        (transport/invoke config :thread-api/pull false
                          [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])))))

(def ^:private add-positions
  #{"first-child" "last-child" "sibling"})

(def ^:private status-aliases
  {"todo" :logseq.property/status.todo
   "doing" :logseq.property/status.doing
   "done" :logseq.property/status.done
   "now" :logseq.property/status.doing
   "later" :logseq.property/status.todo
   "wait" :logseq.property/status.backlog
   "waiting" :logseq.property/status.backlog
   "backlog" :logseq.property/status.backlog
   "canceled" :logseq.property/status.canceled
   "cancelled" :logseq.property/status.canceled
   "in-review" :logseq.property/status.in-review
   "in_review" :logseq.property/status.in-review
   "inreview" :logseq.property/status.in-review
   "in-progress" :logseq.property/status.doing
   "in progress" :logseq.property/status.doing
   "inprogress" :logseq.property/status.doing})

(defn- normalize-status
  [value]
  (let [text (some-> value string/trim)
        parsed (when (and (seq text) (string/starts-with? text ":"))
                 (common-util/safe-read-string {:log-error? false} text))
        normalized (cond
                     (qualified-keyword? parsed)
                     parsed

                     (keyword? parsed)
                     (get status-aliases (name parsed))

                     (seq text)
                     (get status-aliases (string/lower-case text))

                     :else nil)]
    normalized))

(defn- ensure-block-uuids
  [blocks]
  (mapv (fn [block]
          (let [current (:block/uuid block)]
            (cond
              (some? current)
              (update block :block/uuid (fn [value]
                                          (if (and (string? value) (common-util/uuid-string? value))
                                            (uuid value)
                                            value)))

              :else
              (assoc block :block/uuid (common-uuid/gen-uuid)))))
        blocks))

(defn invalid-options?
  [opts]
  (let [pos (some-> (:pos opts) string/trim string/lower-case)
        target-id (:target-id opts)
        target-uuid (some-> (:target-uuid opts) string/trim)
        target-page (some-> (:target-page-name opts) string/trim)
        target-selectors (filter some? [target-id target-uuid target-page])]
    (cond
      (and (seq pos) (not (contains? add-positions pos)))
      (str "invalid pos: " (:pos opts))

      (> (count target-selectors) 1)
      "only one of --target-id, --target-uuid, or --target-page-name is allowed"

      (and (= pos "sibling") (or (seq target-page) (empty? target-selectors)))
      "--pos sibling is only valid for block targets"

      :else
      nil)))

(defn- resolve-add-target
  [config {:keys [repo target-id target-uuid target-page-name]}]
  (cond
    (some? target-id)
    (p/let [block (transport/invoke config :thread-api/pull false
                                    [repo [:db/id :block/uuid :block/title] target-id])]
      (if-let [id (:db/id block)]
        id
        (throw (ex-info "target block not found" {:code :target-not-found}))))

    (seq target-uuid)
    (if-not (common-util/uuid-string? target-uuid)
      (p/rejected (ex-info "target must be a uuid" {:code :invalid-target}))
      (p/let [block (transport/invoke config :thread-api/pull false
                                      [repo [:db/id :block/uuid :block/title] [:block/uuid (uuid target-uuid)]])]
        (if-let [id (:db/id block)]
          id
          (throw (ex-info "target block not found" {:code :target-not-found})))))

    :else
    (p/let [page-name (if (seq target-page-name) target-page-name (today-page-title config repo))
            page-entity (ensure-page! config repo page-name)]
      (or (:db/id page-entity)
          (throw (ex-info "page not found" {:code :page-not-found}))))))

(defn- read-blocks
  [options command-args]
  (cond
    (seq (:blocks options))
    {:ok? true :value (reader/read-string (:blocks options))}

    (seq (:blocks-file options))
    (let [contents (.toString (fs/readFileSync (:blocks-file options)) "utf8")]
      {:ok? true :value (reader/read-string contents)})

    (seq (:content options))
    {:ok? true :value [{:block/title (:content options)}]}

    (seq command-args)
    {:ok? true :value [{:block/title (string/join " " command-args)}]}

    :else
    {:ok? false
     :error {:code :missing-content
             :message "content is required"}}))

(defn- ensure-blocks
  [value]
  (if (vector? value)
    {:ok? true :value value}
    {:ok? false
     :error {:code :invalid-blocks
             :message "blocks must be a vector"}}))

(defn build-add-block-action
  [options args repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for add"}}
    (let [blocks-result (read-blocks options args)
          status-text (some-> (:status options) string/trim)
          status (when (seq status-text) (normalize-status status-text))]
      (cond
        (and (seq status-text) (nil? status))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid status: " status-text)}}

        :else
      (if-not (:ok? blocks-result)
        blocks-result
        (let [vector-result (ensure-blocks (:value blocks-result))]
          (if-not (:ok? vector-result)
            vector-result
            (let [blocks (cond-> (:value vector-result)
                           status
                           ensure-block-uuids)]
              {:ok? true
               :action {:type :add-block
                        :repo repo
                        :graph (core/repo->graph repo)
                        :target-id (:target-id options)
                        :target-uuid (some-> (:target-uuid options) string/trim)
                        :target-page-name (some-> (:target-page-name options) string/trim)
                        :pos (or (some-> (:pos options) string/trim string/lower-case) "last-child")
                        :status status
                        :blocks blocks}}))))))))

(defn build-add-page-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for add"}}
    (let [page (some-> (:page options) string/trim)]
      (if (seq page)
        {:ok? true
         :action {:type :add-page
                  :repo repo
                  :graph (core/repo->graph repo)
                  :page page}}
        {:ok? false
         :error {:code :missing-page-name
                 :message "page name is required"}}))))

(defn execute-add-block
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              target-id (resolve-add-target cfg action)
              status (:status action)
              pos (:pos action)
              opts (case pos
                     "last-child" {:sibling? false :bottom? true}
                     "sibling" {:sibling? true}
                     {:sibling? false})
              opts (cond-> opts
                     status
                     (assoc :keep-uuid? true))
              ops [[:insert-blocks [(:blocks action)
                                    target-id
                                    (assoc opts :outliner-op :insert-blocks)]]]
              _ (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])
              _ (when status
                  (let [block-ids (->> (:blocks action)
                                       (map :block/uuid)
                                       (remove nil?)
                                       vec)]
                    (when (seq block-ids)
                      (transport/invoke cfg :thread-api/apply-outliner-ops false
                                        [(:repo action)
                                         [[:batch-set-property [block-ids :logseq.property/status status {}]]]
                                         {}]))))]
        {:status :ok
         :data {:result nil}})))

(defn execute-add-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              ops [[:create-page [(:page action) {}]]]
              result (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))
