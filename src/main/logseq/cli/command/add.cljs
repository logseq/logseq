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
   :page {:desc "Page name"}
   :parent {:desc "Parent block UUID for add"}})

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

(defn- resolve-add-target
  [config {:keys [repo page parent]}]
  (if (seq parent)
    (if-not (common-util/uuid-string? parent)
      (p/rejected (ex-info "parent must be a uuid" {:code :invalid-parent}))
      (p/let [block (transport/invoke config :thread-api/pull false
                                      [repo [:db/id :block/uuid :block/title] [:block/uuid (uuid parent)]])]
        (if-let [id (:db/id block)]
          id
          (throw (ex-info "parent block not found" {:code :parent-not-found})))))
    (p/let [page-name (if (seq page) page (today-page-title config repo))
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
                      :page (:page options)
                      :parent (:parent options)
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
              ops [[:insert-blocks [(:blocks action)
                                    target-id
                                    {:sibling? false
                                     :bottom? true
                                     :outliner-op :insert-blocks}]]]
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
