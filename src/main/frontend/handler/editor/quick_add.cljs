(ns ^:no-doc frontend.handler.editor.quick-add
  (:require [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn quick-add-ensure-new-block-exists!
  []
  (let [graph (state/get-current-repo)]
    (p/do!
     (db-async/<get-block graph (date/today))
     (p/let [add-page-result (db-async/<get-block-with-children graph common-config/quick-add-page-name)
             add-page (editor/worker-block-with-children add-page-result)
             user-id (when-let [id-str (user-handler/user-uuid)] (uuid id-str))
             user (when user-id (db-async/<get-block graph user-id {:children? false}))
             user-db-id (:db/id user)
             children (editor/worker-children add-page)
             children' (if user-db-id
                         (filter (fn [block]
                                   (let [create-by-id (editor/ref-db-id (:logseq.property/created-by-ref block))]
                                     (= user-db-id create-by-id))) children)
                         children)]
       (when (empty? children')
         (editor/api-insert-new-block! "" {:page (:block/uuid add-page)
                                    :container-id :unknown-container
                                    :replace-empty-target? false}))))))

(defn show-quick-add
  []
  (p/do!
   (quick-add-ensure-new-block-exists!)
   (state/pub-event! [:dialog/quick-add])))

(defn quick-add-blocks!
  []
  (let [graph (state/get-current-repo)]
    (p/do!
     (editor/save-current-block!)
     (p/let [today-result (db-async/<get-block-with-children graph (date/today))
             today (editor/worker-block-with-children today-result)
             add-page-result (db-async/<get-block-with-children graph common-config/quick-add-page-name)
             add-page (editor/worker-block-with-children add-page-result)]
       (when (and today add-page)
         (let [children (editor/worker-children add-page)]
           (p/do!
            (when (seq children)
              (if-let [today-last-child (last (ldb/sort-by-order (editor/worker-children today)))]
                (editor/move-blocks! children today-last-child {:sibling? true})
                (editor/move-blocks! children today {:sibling? false})))
            (state/close-dialog!)
            (shui/popup-hide!)
            (when (seq children)
              (notification/show! (t :journal/add-blocks-to-today-success) :success)))))))))

(defn quick-add
  []
  (if (shui-dialog/get-dialog :ls-dialog-quick-add)
    (quick-add-blocks!)
    (show-quick-add)))

(defn <get-user-quick-add-blocks
  "Get quick add blocks for the current user if logged in"
  []
  (let [repo (state/get-current-repo)
        user-id-str (user-handler/user-uuid)]
    (p/let [page-result (db-async/<get-block-with-children repo common-config/quick-add-page-name)
            page (editor/worker-block-with-children page-result)
            graph-rtc-uuid (state/<invoke-db-worker :thread-api/get-rtc-graph-uuid repo)]
      (if page
        (let [children (editor/worker-children page)]
          (if (and user-id-str graph-rtc-uuid)
            (p/let [user (db-async/<get-block repo (uuid user-id-str) {:children? false})]
              (if-let [user-db-id (:db/id user)]
                (filter (fn [block]
                          (let [create-by-id (editor/ref-db-id (:logseq.property/created-by-ref block))]
                            (or (= user-db-id create-by-id)
                                (nil? create-by-id)))) children)
                children))
            children))
        (throw (ex-info "Quick add page doesn't exists" {}))))))

(defn quick-add-open-last-block!
  []
  (p/let [blocks (<get-user-quick-add-blocks)]
    (when (seq blocks)
      (let [block (last (ldb/sort-by-order blocks))]
        (editor/edit-block! block :max {:container-id :unknown-container})))))