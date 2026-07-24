(ns frontend.handler.db-based.editor
  "DB-based graph implementation"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.db.async :as db-async]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [logseq.graph-parser.text :as text]
            [logseq.outliner.op]
            [promesa.core :as p]))

(defn- remove-empty-refs
  [refs]
  (remove nil? refs))

(defn- ref-summary
  [ref]
  (select-keys ref [:db/id :block/uuid :block/title :block/name :db/ident :block/tags]))

(defn- collect-known-refs
  [block]
  (->> (concat (state/get-state :editor/block-refs)
               (map ref-summary (:block/refs block)))
       (util/distinct-by-last-wins :block/uuid)))

(defn- use-cached-refs
  [refs block cached-refs]
  (let [refs (remove #(= (:block/uuid block) (:block/uuid %)) refs)
        title->ref (zipmap (map :block/title cached-refs) cached-refs)]
    (map (fn [x]
           (if-let [ref (and (map? x) (title->ref (:block/title x)))]
             (assoc ref :block.temp/original-page-name
                    (:block.temp/original-page-name x))
             x))
         refs)))

(defn- markdown-heading-level
  [content]
  (when-let [heading (some->> content
                              string/triml
                              (re-find #"^(#{1,6})\s+"))]
    (count (second heading))))

(defn- normalize-markdown-heading?
  [block]
  (not (contains? #{:code :math} (:logseq.property.node/display-type block))))

(defn- markdown-hashtag-link-target
  [target]
  (when (and (string? target)
             (string/starts-with? target "#"))
    (let [page-name (-> target (subs 1) text/page-ref-un-brackets!)]
      (when-not (string/blank? page-name)
        page-name))))

(defn- tag-page?
  [page]
  (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags page)))

(defn- ref-dedupe-key
  [ref]
  (cond
    (and (vector? ref) (= :block/uuid (first ref)))
    [:block/uuid (second ref)]

    (map? ref)
    (if-let [uuid (:block/uuid ref)]
      [:block/uuid uuid]
      ref)

    :else
    ref))

(defn- existing-markdown-hashtag-link-refs
  [ast cached-refs]
  (let [title->ref (zipmap (map :block/title cached-refs) cached-refs)]
    (->> ast
         (tree-seq coll? seq)
         (keep (fn [form]
                 (when (and (vector? form)
                            (= "Link" (first form))
                            (map? (second form)))
                   (let [[url-type target] (:url (second form))]
                     (when (= "Search" url-type)
                       (when-let [page (some-> target markdown-hashtag-link-target title->ref)]
                         (when (tag-page? page)
                           page)))))))
         (map #(select-keys % [:db/id :block/uuid :block/title :block/name :db/ident :block/tags]))
         (util/distinct-by-last-wins :block/uuid))))

(defn wrap-parse-block
  [{:block/keys [title level] :as block}]
  (let [block (if (nil? title)
                block
                (let [heading-level (when (normalize-markdown-heading? block)
                                      (markdown-heading-level title))
                      title (if heading-level
                              (commands/clear-markdown-heading (string/triml title))
                              title)
                      ast (mldoc/->edn (string/trim title) :markdown)
                      first-elem-type (first (ffirst ast))
                      block-with-title? (mldoc/block-with-title? first-elem-type)
                      content' (str common-config/block-pattern (if block-with-title? " " "\n") title)
                      cached-refs (collect-known-refs block)
                      hashtag-link-refs (existing-markdown-hashtag-link-refs ast cached-refs)
                      parsed-block (block/parse-block (assoc block :block/title content'))
                      new-display-block? (and (nil? (:logseq.property.node/display-type block))
                                              (contains? #{:code :math}
                                                         (:logseq.property.node/display-type parsed-block)))
                      block' (-> (merge block
                                        parsed-block
                                        {:block/title (if new-display-block?
                                                        (:block/title parsed-block)
                                                        title)}
                                        (when heading-level
                                          {:logseq.property/heading heading-level}))
                                 (dissoc :block/format))]
                  (update block' :block/refs
                          (fn [refs]
                            (->> (concat (-> refs
                                             remove-empty-refs
                                             (use-cached-refs block cached-refs))
                                         hashtag-link-refs)
                                 (remove nil?)
                                 (util/distinct-by-last-wins ref-dedupe-key))))))
        title' (db-content/title-ref->id-ref (or (get block :block/title) title) (:block/refs block))
        result (-> block
                   (merge (if level {:block/level level} {}))
                   (assoc :block/title title'))]
    result))

(defn save-file!
  "This fn is the db version of file-handler/alter-file"
  [path content]
  (let [file-valid? (if (= path "logseq/config.edn")
                      (do (config-edn-common-handler/detect-deprecations path content)
                          (config-edn-common-handler/validate-config-edn path content repo-config-schema/Config-edn))
                      true)]

    (when file-valid?
      (p/do!
       (state/<invoke-db-worker :thread-api/transact
                                (state/get-current-repo)
                                [{:file/path path
                                  :file/content content
                                  :file/created-at (js/Date.)
                                  :file/last-modified-at (js/Date.)}]
                                nil
                                nil)
      ;; Post save
       (cond (= path "logseq/config.edn")
             (p/let [_ (repo-config-handler/restore-repo-config! (state/get-current-repo) content)]
               (state/pub-event! [:shortcut/refresh]))
             (= path "logseq/custom.css")
             (ui-handler/add-style-if-exists!))))))

(defn batch-set-heading!
  [block-ids heading]
  (let [repo (state/get-current-repo)]
    (p/let [results (db-async/<get-blocks repo block-ids)
            blocks (keep :block results)]
      (ui-outliner-tx/transact!
       {:outliner-op :save-block}
       (doseq [{:block/keys [uuid raw-title]} blocks]
         (let [new-raw-title (commands/clear-markdown-heading raw-title)]
           (when (not= new-raw-title raw-title)
             (property-handler/set-block-property! uuid :block/title new-raw-title))))
       (property-handler/batch-set-block-property! block-ids :logseq.property/heading heading)))))
