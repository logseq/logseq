(ns frontend.worker.handler.page.rename
  "Page rename"
  (:require [logseq.outliner.core :as outliner-core]
            [logseq.outliner.tree :as otree]
            [frontend.worker.handler.page :as worker-page]
            [datascript.core :as d]
            [medley.core :as medley]
            [clojure.string :as string]
            [logseq.common.util.page-ref :as page-ref]
            [frontend.worker.file.util :as wfu]
            [frontend.worker.file.page-rename :as page-rename]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.text :as text]))

(defn rename-update-namespace!
  "update :block/namespace of the renamed block"
  [repo conn config page old-original-name new-name]
  (let [old-namespace? (text/namespace-page? old-original-name)
        new-namespace? (text/namespace-page? new-name)]
    (cond
      new-namespace?
      ;; update namespace
      (let [namespace (first (common-util/split-last "/" new-name))]
        (when namespace
          (worker-page/create! repo conn config namespace) ;; create parent page if not exist, creation of namespace ref is handled in `create!`
          (let [namespace-block (d/entity @conn [:block/name (common-util/page-name-sanity-lc namespace)])
                page-txs [{:db/id (:db/id page)
                           :block/namespace (:db/id namespace-block)}]]
            (ldb/transact! conn page-txs {:persist-op? true}))))

      old-namespace?
      ;; retract namespace
      (ldb/transact! conn [[:db/retract (:db/id page) :block/namespace]] {:persist-op? true})

      :else
      nil)))

(defn- replace-page-ref
  "Replace from-page refs with to-page"
  [from-page to-page]
  (let [refs (:block/_refs from-page)
        from-uuid (:block/uuid from-page)
        to-uuid (:block/uuid to-page)
        replace-ref (fn [content] (string/replace content (str from-uuid) (str to-uuid)))]
    (when (seq refs)
      (let [tx-data (mapcat
                     (fn [{:block/keys [raw-content properties] :as ref}]
                         ;; block content or properties
                       (let [content' (replace-ref raw-content)
                             content-tx (when (not= raw-content content')
                                          {:db/id (:db/id ref)
                                           :block/content content'})
                             properties' (-> (medley/map-vals (fn [v]
                                                                (cond
                                                                  (and (coll? v) (uuid? (first v)))
                                                                  (mapv (fn [id] (if (= id from-uuid) to-uuid id)) v)

                                                                  (and (uuid? v) (= v from-uuid))
                                                                  to-uuid

                                                                  (and (coll? v) (string? (first v)))
                                                                  (mapv replace-ref v)

                                                                  (string? v)
                                                                  (replace-ref v)

                                                                  :else
                                                                  v)) properties)
                                             (common-util/remove-nils-non-nested))
                             tx (merge
                                 content-tx
                                 (when (not= (seq properties) (seq properties'))
                                   {:db/id (:db/id ref)
                                    :block/properties properties'}))]
                         (concat
                          [[:db/add (:db/id ref) :block/refs (:db/id to-page)]
                           [:db/retract (:db/id ref) :block/refs (:db/id from-page)]]
                          (when tx [tx]))))
                     refs)]
        tx-data))))

(defn- rename-update-block-refs!
  [refs from-id to-id]
  (->> refs
       (remove #{{:db/id from-id}})
       (cons {:db/id to-id})
       (distinct)
       (vec)))

(declare rename-page-aux)

(defn- based-merge-pages!
  [repo conn config from-page-name to-page-name {:keys [old-name new-name persist-op?]}]
  (when (and (ldb/page-exists? @conn from-page-name)
             (ldb/page-exists? @conn to-page-name)
             (not= from-page-name to-page-name))
    (let [db @conn
          to-page (d/entity db [:block/name to-page-name])
          to-id (:db/id to-page)
          from-page (d/entity db [:block/name from-page-name])
          from-id (:db/id from-page)
          from-first-child (some->> (d/pull db '[*] from-id)
                                    (outliner-core/block @conn)
                                    (#(otree/-get-down % conn))
                                    (outliner-core/get-data))
          to-last-direct-child-id (ldb/get-block-last-direct-child-id db to-id)
          db-based? (sqlite-util/db-based-graph? repo)
          datoms (d/datoms @conn :avet :block/page from-id)
          block-eids (mapv :e datoms)
          blocks (d/pull-many db '[:db/id :block/page :block/refs :block/path-refs :block/left :block/parent] block-eids)
          blocks-tx-data (map (fn [block]
                                (let [id (:db/id block)]
                                  (cond->
                                   {:db/id id
                                    :block/page {:db/id to-id}
                                    :block/refs (rename-update-block-refs! (:block/refs block) from-id to-id)}

                                    (and from-first-child (= id (:db/id from-first-child)))
                                    (assoc :block/left {:db/id (or to-last-direct-child-id to-id)})

                                    (= (:block/parent block) {:db/id from-id})
                                    (assoc :block/parent {:db/id to-id})))) blocks)
          replace-ref-tx-data (if db-based?
                                (replace-page-ref from-page to-page)
                                (page-rename/replace-page-ref db config from-page-name to-page-name))
          tx-data (concat blocks-tx-data replace-ref-tx-data)]

      (rename-page-aux repo conn config old-name new-name
                       :merge? true
                       :other-tx tx-data))

    (worker-page/delete! repo conn from-page-name (fn [_]) {:rename? true})))

(defn- compute-new-file-path
  "Construct the full path given old full path and the file sanitized body.
   Ext. included in the `old-path`."
  [old-path new-file-name-body]
  (let [result (string/split old-path "/")
        ext (last (string/split (last result) "."))
        new-file (str new-file-name-body "." ext)
        parts (concat (butlast result) [new-file])]
    (common-util/string-join-path parts)))

(defn- update-file-tx
  [db old-page-name new-page-name]
  (let [page (d/entity db [:block/name old-page-name])
        file (:block/file page)]
    (when (and file (not (:block/journal? page)))
      (let [old-path (:file/path file)
            new-file-name (wfu/file-name-sanity new-page-name) ;; w/o file extension
            new-path (compute-new-file-path old-path new-file-name)]
        {:old-path old-path
         :new-path new-path
         :tx-data [{:db/id (:db/id file)
                    :file/path new-path}]}))))

(defn- rename-page-aux
  "Only accepts unsanitized page names"
  [repo conn config old-name new-name & {:keys [merge? other-tx]}]
  (let [db                  @conn
        old-page-name       (common-util/page-name-sanity-lc old-name)
        new-page-name       (common-util/page-name-sanity-lc new-name)
        db-based?           (sqlite-util/db-based-graph? repo)
        page                (d/pull @conn '[*] [:block/name old-page-name])]
    (when (and repo page)
      (let [old-original-name   (:block/original-name page)
            page-txs            (when-not merge?
                                  [{:db/id               (:db/id page)
                                    :block/uuid          (:block/uuid page)
                                    :block/name          new-page-name
                                    :block/original-name new-name}])
            {:keys [old-path new-path tx-data]} (update-file-tx db old-page-name new-name)
            txs (concat page-txs
                        other-tx
                        (when-not db-based?
                          (->>
                           (concat
                            ;;  update page refes in block content when ref name changes
                            (page-rename/replace-page-ref db config old-name new-name)
                            ;; update file path
                            tx-data)

                           (remove nil?))))]

        (ldb/transact! conn txs {:outliner-op :rename-page
                                 :data (cond->
                                        {:old-name old-name
                                         :new-name new-name}
                                         (and old-path new-path)
                                         (merge {:old-path old-path
                                                 :new-path new-path}))})

        (rename-update-namespace! repo conn config page old-original-name new-name)))))

(defn- rename-namespace-pages!
  "Original names (unsanitized only)"
  [repo conn config old-name new-name]
  (let [pages (ldb/get-namespace-pages @conn old-name {:db-graph? (sqlite-util/db-based-graph? repo)})
        page (d/pull @conn '[*] [:block/name (common-util/page-name-sanity-lc old-name)])
        pages (cons page pages)]
    (doseq [{:block/keys [name original-name]} pages]
      (let [old-page-title (or original-name name)
            ;; only replace one time, for the case that the namespace is a sub-string of the sub-namespace page name
            ;; Example: has pages [[work]] [[work/worklog]],
            ;; we want to rename [[work/worklog]] to [[work1/worklog]] when rename [[work]] to [[work1]],
            ;; but don't rename [[work/worklog]] to [[work1/work1log]]
            new-page-title (common-util/replace-first-ignore-case old-page-title old-name new-name)]
        (when (and old-page-title new-page-title)
          (rename-page-aux repo conn config old-page-title new-page-title)
          (println "Renamed " old-page-title " to " new-page-title))))))

(defn- rename-nested-pages
  "Unsanitized names only"
  [repo conn config old-ns-name new-ns-name]
  (let [nested-page-str (page-ref/->page-ref (common-util/page-name-sanity-lc old-ns-name))
        ns-prefix-format-str (str page-ref/left-brackets "%s/")
        ns-prefix       (common-util/format ns-prefix-format-str (common-util/page-name-sanity-lc old-ns-name))
        nested-pages    (ldb/get-pages-by-name-partition @conn nested-page-str)
        nested-pages-ns (ldb/get-pages-by-name-partition @conn ns-prefix)]
    (when nested-pages
      ;; rename page "[[obsidian]] is a tool" to "[[logseq]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (page-ref/->page-ref old-ns-name)
                              (page-ref/->page-ref new-ns-name))]
          (when (and old-page-title new-page-title)
            (rename-page-aux repo conn config old-page-title new-page-title)
            (println "Renamed " old-page-title " to " new-page-title)))))
    (when nested-pages-ns
      ;; rename page "[[obsidian/page1]] is a tool" to "[[logseq/page1]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages-ns]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (common-util/format ns-prefix-format-str old-ns-name)
                              (common-util/format ns-prefix-format-str new-ns-name))]
          (when (and old-page-title new-page-title)
            (rename-page-aux repo conn config old-page-title new-page-title)
            (println "Renamed " old-page-title " to " new-page-title)))))))

(defn rename!
  [repo conn config old-name new-name & {:keys [persist-op?]
                                         :or {persist-op? true}}]
  (let [db @conn
        old-name      (string/trim old-name)
        new-name      (string/trim new-name)
        old-page-name (common-util/page-name-sanity-lc old-name)
        page-e (d/entity db [:block/name old-page-name])
        new-page-name (common-util/page-name-sanity-lc new-name)
        new-page-e (d/entity db [:block/name new-page-name])
        name-changed? (not= old-name new-name)]
    (cond
      (string/blank? new-name)
      :invalid-empty-name

      (and page-e new-page-e
           (or (contains? (:block/type page-e) "whiteboard")
               (contains? (:block/type new-page-e) "whiteboard")))
      :merge-whiteboard-pages

      (and old-name new-name name-changed?)
      (do
        (cond
          (= old-page-name new-page-name) ; case changed
          (ldb/transact! conn
                         [{:db/id (:db/id page-e)
                           :block/original-name new-name}]
                         {:persist-op? persist-op?
                          :outliner-op :rename-page})

          (and (not= old-page-name new-page-name)
               (d/entity @conn [:block/name new-page-name])) ; merge page
          (based-merge-pages! repo conn config old-page-name new-page-name {:old-name old-name
                                                                            :new-name new-name
                                                                            :persist-op? persist-op?})

          :else                          ; rename
          (rename-namespace-pages! repo conn config old-name new-name))
        (rename-nested-pages repo conn config old-name new-name)))))
