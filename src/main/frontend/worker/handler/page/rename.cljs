(ns frontend.worker.handler.page.rename
  "Page rename"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [frontend.worker.file.util :as wfu]
            [frontend.worker.file.page-rename :as page-rename]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]
            [logseq.common.util :as common-util]))

(declare rename-page-aux)

;; FIXME: bring it back, decouple this from page renaming though
(comment
  (defn merge-pages!
   [repo conn config from-page to-page]
   (let [from-page-name (:block/original-name from-page)
         to-page-name (:block/original-name to-page)]
     (when (and from-page to-page
                (not= from-page-name to-page-name))
       (let [db @conn
             to-id (:db/id to-page)
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
                                   (page-rename/replace-page-ref db config from-page to-page-name))
             tx-data (concat blocks-tx-data replace-ref-tx-data)]

         (rename-page-aux repo conn config from-page-name to-page-name
                          :merge? true
                          :other-tx tx-data)

         (worker-page/delete! repo conn (:block/uuid from-page) {:rename? true}))))))

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
  [page new-page-name]
  (let [file (:block/file page)]
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
  [repo conn config page new-name & {:keys [merge? other-tx]}]
  (let [db                  @conn
        old-page-name       (:block/original-name page)
        new-page-name       (common-util/page-name-sanity-lc new-name)
        db-based?           (sqlite-util/db-based-graph? repo)]
    (when (and repo page)
      (let [page-txs            (when-not merge?
                                  [{:db/id               (:db/id page)
                                    :block/name          new-page-name
                                    :block/original-name new-name}])
            {:keys [old-path new-path tx-data]} (update-file-tx page new-name)
            txs (concat page-txs
                        other-tx
                        (when-not db-based?
                          (->>
                           (concat
                            ;;  update page refes in block content when ref name changes
                            (page-rename/replace-page-ref db config page new-name)
                            ;; update file path
                            tx-data)

                           (remove nil?))))]

        (ldb/transact! conn txs {:outliner-op :rename-page
                                 :data (cond->
                                        {:old-name old-page-name
                                         :new-name new-name}
                                         (and old-path new-path)
                                         (merge {:old-path old-path
                                                 :new-path new-path}))})))))

(defn- rename-page!
  "Original names (unsanitized only)"
  [repo conn config page new-name]
  (rename-page-aux repo conn config page new-name)
  (println "Renamed " (:block/original-name page) " to " new-name))

(defn rename!
  [repo conn config page-uuid new-name & {:keys [persist-op?]
                                          :or {persist-op? true}}]
  (let [db @conn
        page-e        (d/entity db [:block/uuid page-uuid])
        old-name      (:block/original-name page-e)
        new-name      (string/trim new-name)
        old-page-name (common-util/page-name-sanity-lc old-name)
        new-page-name (common-util/page-name-sanity-lc new-name)
        new-page-exists? (some? (ldb/get-first-page-by-name db new-name))
        name-changed? (not= old-name new-name)]
    (cond
      (string/blank? new-name)
      :invalid-empty-name

      new-page-exists?
      :rename-page-exists

      (ldb/built-in? page-e)
      :built-in-page

      (and old-name new-name name-changed?)
      (if (= old-page-name new-page-name) ; case changed
        (ldb/transact! conn
                       [{:db/id (:db/id page-e)
                         :block/original-name new-name}]
                       {:persist-op? persist-op?
                        :outliner-op :rename-page})
        (rename-page! repo conn config page-e new-name)))))
