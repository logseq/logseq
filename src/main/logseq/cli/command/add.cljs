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
            [promesa.core :as p]))

(def ^:private content-add-spec
  {:content {:desc "Block content for add"}
   :blocks {:desc "EDN vector of blocks for add"}
   :blocks-file {:desc "EDN file of blocks for add"}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"}
   :target-page-name {:desc "Target page name"}
   :pos {:desc "Position (first-child, last-child, sibling)"}})

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
    (let [blocks-result (read-blocks options args)]
      (if-not (:ok? blocks-result)
        blocks-result
        (let [vector-result (ensure-blocks (:value blocks-result))]
          (if-not (:ok? vector-result)
            vector-result
            {:ok? true
             :action {:type :add-block
                      :repo repo
                      :graph (core/repo->graph repo)
                      :target-id (:target-id options)
                      :target-uuid (some-> (:target-uuid options) string/trim)
                      :target-page-name (some-> (:target-page-name options) string/trim)
                      :pos (or (some-> (:pos options) string/trim string/lower-case) "last-child")
                      :blocks (:value vector-result)}}))))))

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
              pos (:pos action)
              opts (case pos
                     "last-child" {:sibling? false :bottom? true}
                     "sibling" {:sibling? true}
                     {:sibling? false})
              ops [[:insert-blocks [(:blocks action)
                                    target-id
                                    (assoc opts :outliner-op :insert-blocks)]]]
              result (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))

(defn execute-add-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              ops [[:create-page [(:page action) {}]]]
              result (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))
