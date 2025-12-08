(ns frontend.worker.handler.page
  "Page operations"
  (:require [frontend.worker.handler.page.file-based.delete :as file-worker-page-delete]
            [frontend.worker.handler.page.file-based.page :as file-worker-page]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.page :as outliner-page]))

(defn rtc-create-page!
  [conn config title {:keys [uuid old-db-id]}]
  (assert (uuid? uuid) (str "rtc-create-page! `uuid` is not a uuid " uuid))
  (let [date-formatter    (common-config/get-date-formatter config)
        title (outliner-page/sanitize-title title)
        page-name (common-util/page-name-sanity-lc title)
        page              (cond-> (gp-block/page-name->map title @conn true date-formatter
                                                           {:page-uuid uuid
                                                            :skip-existing-page-check? true})
                            old-db-id
                            (assoc :db/id old-db-id))
        result            (ldb/transact! conn [page] {:persist-op? false
                                                      :outliner-op :create-page
                                                      :rtc-op? true})]
    [result page-name (:block/uuid page)]))

(defn create!
  "Create page. Has the following options:

   * :uuid                     - when set, use this uuid instead of generating a new one.
   * :class?                   - when true, adds a :block/tags ':logseq.class/Tag'
   * :whiteboard?              - when true, adds a :block/tags ':logseq.class/Whiteboard'
   * :tags                     - tag uuids that are added to :block/tags
   * :persist-op?              - when true, add an update-page op
   * :properties               - properties to add to the page
  TODO: Add other options"
  [repo conn config title & {:as options}]
  (if (ldb/db-based-graph? @conn)
    (outliner-page/create! conn title options)
    (file-worker-page/create! repo conn config title options)))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [repo conn page-uuid & {:as options}]
  (if (ldb/db-based-graph? @conn)
    (outliner-page/delete! conn page-uuid options)
    (file-worker-page-delete/delete! repo conn page-uuid options)))
