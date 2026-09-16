(ns frontend.handler.library
  "Library page membership helpers"
  (:require [frontend.context.i18n :refer [t]]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.common.uuid :as common-uuid]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn page-uuid
  "Stable built-in uuid for the Library page."
  []
  (common-uuid/gen-uuid :builtin-block-uuid common-config/library-page-name))

(defn member-ids
  "Direct Library child entity ids."
  [library-page]
  (into #{} (keep :db/id) (:block/_parent library-page)))

(defn member-items
  "Select items for current direct Library children."
  [members]
  (mapv (fn [block]
          {:value (:db/id block)
           :label (:block/title block)})
        members))

(defn unfile-pages-tx
  "Move pages to the unfiled state by clearing Library parent and order."
  [page-ids]
  (into []
        (mapcat (fn [page-id]
                  [[:db/retract page-id :block/parent]
                   [:db/retract page-id :block/order]]))
        page-ids))

(defn <remove-pages!
  [page-ids]
  (when (seq page-ids)
    (state/<invoke-db-worker :thread-api/transact
                             (state/get-current-repo)
                             (unfile-pages-tx page-ids)
                             {:outliner-op :remove-from-library}
                             nil)))

(defn <confirm-remove-page!
  "Confirm, then unfile a Library page. Resolves true when removed."
  [page-id]
  (-> (shui/dialog-confirm!
       (t :library/remove-page-confirm-desc)
       {:id :library-remove-page
        :cancel-label (t :ui/cancel)
        :ok-label (t :ui/confirm)})
      (p/then (fn [_]
                (<remove-pages! [page-id])
                true))
      (p/catch (fn [_] false))))
