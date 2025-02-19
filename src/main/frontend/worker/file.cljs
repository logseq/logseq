(ns frontend.worker.file
  "Save pages to files for file-based graphs"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.core.async :as async]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.async-util :as async-util]
            [frontend.common.file.core :as common-file]
            [frontend.common.file.util :as wfu]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.date :as common-date]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.file-based.entity-util :as file-entity-util]
            [logseq.outliner.tree :as otree]
            [malli.core :as m]))

(defonce *writes (atom {}))
(defonce *request-id (atom 0))

(defn- conj-page-write!
  [page-id]
  (let [request-id (swap! *request-id inc)]
    (swap! *writes assoc request-id page-id)
    request-id))

(defn- dissoc-request!
  [request-id]
  (when-let [page-id (get @*writes request-id)]
    (let [old-page-request-ids (keep (fn [[r p]]
                                       (when (and (= p page-id) (<= r request-id))
                                         r)) @*writes)]
      (when (seq old-page-request-ids)
        (swap! *writes (fn [x] (apply dissoc x old-page-request-ids)))))))

(defonce file-writes-chan
  (let [coercer (m/coercer [:catn
                            [:repo :string]
                            [:page-id :any]
                            [:outliner-op :any]
                            [:epoch :int]
                            [:request-id :int]])]
    (async/chan 10000 (map coercer))))

(def batch-write-interval 1000)

(def whiteboard-blocks-pull-keys-with-persisted-ids
  '[:block/properties
    :block/uuid
    :block/order
    :block/title
    :block/format
    :block/created-at
    :block/updated-at
    :block/collapsed?
    {:block/page      [:block/uuid]}
    {:block/parent    [:block/uuid]}])

(defn- cleanup-whiteboard-block
  [block]
  (if (get-in block [:block/properties :ls-type] false)
    (dissoc block
            :db/id
            :block/uuid ;; shape block uuid is read from properties
            :block/collapsed?
            :block/title
            :block/format
            :block/order
            :block/page
            :block/parent) ;; these are auto-generated for whiteboard shapes
    (dissoc block :db/id :block/page)))

(defn- transact-file-tx-if-not-exists!
  [conn page-block ok-handler context]
  (when (:block/name page-block)
    (let [format (name (get page-block :block/format (:preferred-format context)))
          date-formatter (:date-formatter context)
          title (string/capitalize (:block/name page-block))
          whiteboard-page? (file-entity-util/whiteboard? page-block)
          format (if whiteboard-page? "edn" format)
          journal-page? (common-date/valid-journal-title? title date-formatter)
          journal-title (common-date/normalize-journal-title title date-formatter)
          journal-page? (and journal-page? (not (string/blank? journal-title)))
          filename (if journal-page?
                     (common-date/date->file-name journal-title (:journal-file-name-format context))
                     (-> (or (:block/title page-block) (:block/name page-block))
                         wfu/file-name-sanity))
          sub-dir (cond
                    journal-page?    (:journals-directory context)
                    whiteboard-page? (:whiteboards-directory context)
                    :else            (:pages-directory context))
          ext (if (= format "markdown") "md" format)
          file-rpath (path/path-join sub-dir (str filename "." ext))
          file {:file/path file-rpath}
          tx [{:file/path file-rpath}
              {:block/name (:block/name page-block)
               :block/file file}]]
      (ldb/transact! conn tx)
      (when ok-handler (ok-handler)))))

(defn- remove-transit-ids [block] (dissoc block :db/id :block/file))

(defn- save-tree-aux!
  [repo db page-block tree blocks-just-deleted? context request-id]
  (let [page-block (d/pull db '[*] (:db/id page-block))
        init-level 1
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (d/entity db file-db-id) :file/path)
        result (if (and (string? file-path) (not-empty file-path))
                 (let [new-content (if (file-entity-util/whiteboard? page-block)
                                     (->
                                      (wfu/ugly-pr-str {:blocks tree
                                                        :pages (list (remove-transit-ids page-block))})
                                      (string/triml))
                                     (common-file/tree->file-content repo db tree {:init-level init-level} context))]
                   (when-not (and (string/blank? new-content) (not blocks-just-deleted?))
                     (let [files [[file-path new-content]]]
                       (when (seq files)
                         (let [page-id (:db/id page-block)]
                           (wfu/post-message :write-files {:request-id request-id
                                                           :page-id page-id
                                                           :repo repo
                                                           :files files})
                           :sent)))))
                 ;; In e2e tests, "card" page in db has no :file/path
                 (js/console.error "File path from page-block is not valid" page-block tree))]
    (when-not (= :sent result)          ; page may not exists now
      (dissoc-request! request-id))))

(defn save-tree!
  [repo conn page-block tree blocks-just-deleted? context request-id]
  {:pre [(map? page-block)]}
  (when repo
    (let [ok-handler #(save-tree-aux! repo @conn page-block tree blocks-just-deleted? context request-id)
          file (or (:block/file page-block)
                   (when-let [page-id (:db/id (:block/page page-block))]
                     (:block/file (d/entity @conn page-id))))]
      (if file
        (ok-handler)
        (transact-file-tx-if-not-exists! conn page-block ok-handler context)))))

(defn do-write-file!
  [repo conn page-db-id outliner-op context request-id]
  (let [page-block (d/pull @conn '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (file-entity-util/whiteboard? page-block)
        blocks-count (ldb/get-page-blocks-count @conn page-db-id)
        blocks-just-deleted? (and (zero? blocks-count)
                                  (contains? #{:delete-blocks :move-blocks} outliner-op))]
    (if (or (>= blocks-count 1) blocks-just-deleted?)
      (if (and (or (> blocks-count 500) whiteboard?)
               (not (worker-state/tx-idle? repo {:diff 3000})))
        (async/put! file-writes-chan [repo page-db-id outliner-op (tc/to-long (t/now)) request-id])
        (let [pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
              blocks (ldb/get-page-blocks @conn (:db/id page-block) {:pull-keys pull-keys})
              blocks (if whiteboard? (map cleanup-whiteboard-block blocks) blocks)]
          (if (and (= 1 (count blocks))
                   (string/blank? (:block/title (first blocks)))
                   (nil? (:block/file page-block))
                   (not whiteboard?))
            (dissoc-request! request-id)
            (let [tree-or-blocks (if whiteboard? blocks
                                     (otree/blocks->vec-tree repo @conn blocks (:db/id page-block)))]
              (if page-block
                (save-tree! repo conn page-block tree-or-blocks blocks-just-deleted? context request-id)
                (do
                  (js/console.error (str "can't find page id: " page-db-id))
                  (dissoc-request! request-id)))))))
      (dissoc-request! request-id))))

(defn write-files!
  [conn pages context]
  (when (seq pages)
    (let [all-request-ids (set (map last pages))
          distincted-pages (common-util/distinct-by #(take 3 %) pages)
          repeated-ids (set/difference all-request-ids (set (map last distincted-pages)))]
      (doseq [id repeated-ids]
        (dissoc-request! id))

      (doseq [[repo page-id outliner-op _time request-id] distincted-pages]
        (try (do-write-file! repo conn page-id outliner-op context request-id)
             (catch :default e
               (worker-util/post-message :notification
                                         [[:div
                                           [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                                           "Error: " (str (gobj/get e "stack"))]
                                          :error])
               (log/error :file/write-file-error {:error e})
               (dissoc-request! request-id)))))))

(defn sync-to-file
  [repo page-id tx-meta]
  (when (and page-id
             (not (:created-from-journal-template? tx-meta))
             (not (:delete-files? tx-meta)))
    (let [request-id (conj-page-write! page-id)]
      (async/put! file-writes-chan [repo page-id (:outliner-op tx-meta) (tc/to-long (t/now)) request-id]))))

(defn <ratelimit-file-writes!
  [flush-fn]
  (async-util/<ratelimit file-writes-chan batch-write-interval
                         :filter-fn (fn [_] true)
                         :flush-fn flush-fn))
