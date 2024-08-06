(ns frontend.worker.handler.page.db-based.rename
  "DB based page rename"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [logseq.db :as ldb]
            [logseq.common.util :as common-util]))

(declare rename-page-aux)

;; FIXME: bring it back, decouple this from page renaming though
(comment
  (defn merge-pages!
    [repo conn config from-page to-page]
    (let [from-page-name (:block/title from-page)
          to-page-name (:block/title to-page)]
      (when (and from-page to-page
                 (not= from-page-name to-page-name))
        (let [db @conn
              to-id (:db/id to-page)
              from-id (:db/id from-page)
              datoms (d/datoms @conn :avet :block/page from-id)
              block-eids (mapv :e datoms)
              blocks (d/pull-many db '[:db/id :block/page :block/refs :block/path-refs :block/parent] block-eids)
              blocks-tx-data (map (fn [block]
                                    (let [id (:db/id block)]
                                      (cond->
                                       {:db/id id
                                        :block/page {:db/id to-id}
                                        :block/refs (rename-update-block-refs! (:block/refs block) from-id to-id)
                                        :block/order (db-order/gen-key nil)}

                                        (= (:block/parent block) {:db/id from-id})
                                        (assoc :block/parent {:db/id to-id})))) blocks)
              replace-ref-tx-data (replace-page-ref from-page to-page)
              tx-data (concat blocks-tx-data replace-ref-tx-data)]

          (rename-page-aux repo conn config from-page-name to-page-name
                           :merge? true
                           :other-tx tx-data)

          (worker-page/delete! repo conn (:block/uuid from-page) {:rename? true}))))))

(defn- rename-page-aux
  "Only accepts unsanitized page names"
  [repo conn page new-name & {:keys [merge? other-tx]}]
  (let [old-page-name       (:block/title page)
        new-page-name       (common-util/page-name-sanity-lc new-name)]
    (when (and repo page)
      (let [page-txs            (when-not merge?
                                  [{:db/id               (:db/id page)
                                    :block/name          new-page-name
                                    :block/title new-name}])
            txs (concat page-txs other-tx)]
        (ldb/transact! conn txs {:outliner-op :rename-page
                                 :data (cond->
                                        {:page-id (:db/id page)
                                         :old-name old-page-name
                                         :new-name new-name})})))))

(defn- rename-page!
  "Original names (unsanitized only)"
  [repo conn page new-name]
  (rename-page-aux repo conn page new-name)
  (println "Renamed " (:block/title page) " to " new-name))

(defn rename!
  [repo conn _config page-uuid new-name & {:keys [persist-op?]
                                           :or {persist-op? true}}]
  (let [db @conn]
    (when-let [page-e (d/entity db [:block/uuid page-uuid])]
      (let [old-name      (:block/title page-e)
            new-name      (string/trim new-name)
            old-page-name (common-util/page-name-sanity-lc old-name)
            new-page-name (common-util/page-name-sanity-lc new-name)
            name-changed? (not= old-name new-name)
            new-page-exists? (and name-changed? (ldb/page-exists? db new-name (:block/type page-e)))]
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
                             :block/title new-name}]
                           {:persist-op? persist-op?
                            :outliner-op :rename-page})
            (rename-page! repo conn page-e new-name)))))))
