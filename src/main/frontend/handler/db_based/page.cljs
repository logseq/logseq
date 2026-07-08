(ns frontend.handler.db-based.page
  "DB graph only page util fns"
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- <valid-tag?
  "Returns a boolean indicating whether the new tag passes all valid checks.
   When returning false, this fn also displays appropriate notifications to the user"
  [repo block-id tag-id]
  (p/let [result (state/<invoke-db-worker :thread-api/validate-block-tag repo block-id tag-id)]
    (if (:valid? result)
      true
      (let [payload (:payload result)]
        (notification/show! (:message payload) (:type payload))
        false))))

(defn add-tag [repo block-id tag-entity]
  ;; Check after save-current-block to get most up to date block content.
  (-> (editor-handler/save-current-block!)
      (p/then (fn [_]
                (<valid-tag? repo block-id (:db/id tag-entity))))
      (p/then (fn [valid?]
                (when valid?
                  (db-property-handler/set-block-property! block-id :block/tags (:db/id tag-entity)))))))

(defn convert-page-to-tag!
  "Converts a Page to a Tag"
  [page-entity]
  (let [repo (state/get-current-repo)]
    (p/let [tag-exists? (db-async/<page-exists? repo (:block/title page-entity) #{:logseq.class/Tag})]
      (cond tag-exists?
            (notification/show! (t :page.convert/page-to-tag-duplicate (:block/title page-entity)) :warning false)
            (:block/parent page-entity)
            (notification/show! (t :page.convert/page-to-tag-namespaced) :error false)
            (ldb/built-in? page-entity)
            (notification/show! (t :page.convert/page-to-tag-built-in) :error)
            :else
            (-> (state/<invoke-db-worker :thread-api/build-convert-page-to-tag-tx repo (:db/id page-entity))
                (p/then
                 (fn [txs]
                   (state/<invoke-db-worker :thread-api/transact
                                            repo
                                            txs
                                            {:outliner-op :save-block}
                                            nil))))))))

(defn convert-tag-to-page!
  [entity]
  (let [repo (state/get-current-repo)]
    (p/let [page-exists? (db-async/<page-exists? repo (:block/title entity) #{:logseq.class/Page})
            class-children (db-async/<get-structured-children repo (:db/id entity))]
      (cond page-exists?
            (notification/show! (t :page.convert/tag-to-page-duplicate (:block/title entity)) :warning false)
            (ldb/built-in? entity)
            (notification/show! (t :page.convert/tag-to-page-built-in) :error)
            :else
            (if (seq class-children)
              (notification/show! (t :page.convert/tag-to-page-has-children) :error false)
              (let [convert-fn
                    (fn convert-fn [_]
                  (p/let [txs (state/<invoke-db-worker :thread-api/build-convert-tag-to-page-tx repo (:db/id entity))]
                    (state/<invoke-db-worker :thread-api/transact
                                             repo
                                             txs
                                             {:outliner-op :save-block}
                                             nil)))]
                (-> (shui/dialog-confirm!
                     (t :page.convert/tag-to-page-confirm-desc)
                     {:id :convert-tag-to-page
                      :data-reminder :ok
                      :data-reminder-label (t :ui/dont-remind-me-again)
                      :cancel-label (t :ui/cancel)
                      :ok-label (t :ui/confirm)})
                    (p/then convert-fn))))))))

(defn <create-class!
  "Creates a class page and provides class-specific error handling"
  [title options]
  (-> (page-common-handler/<create! title (assoc options :class? true))
      (p/catch (fn [e]
                 (when (= :notification (:type (ex-data e)))
                   (notification/show! (get-in (ex-data e) [:payload :message])
                                       (get-in (ex-data e) [:payload :type])))
                 ;; Re-throw as we don't want to proceed with a nonexistent class
                 (throw e)))))

(defn tag-on-chosen-handler
  [chosen chosen-result class? edit-content current-pos last-pattern]
  (let [tag (string/trim chosen)
        edit-block (state/get-edit-block)
        create-opts {:redirect? false}
        existing-result? (:db/id chosen-result)]
    (when (:block/uuid edit-block)
      (p/let [result (when-not existing-result? ; page not exists yet
                       (if class?
                         (<create-class! tag create-opts)
                         (page-common-handler/<create! tag create-opts)))]
        (when class?
          (let [tag-entity (or (when existing-result? chosen-result) result)
                hash-idx (string/last-index-of (subs edit-content 0 current-pos) last-pattern)
                add-tag-to-nearest-node? (= page-ref/right-brackets (common-util/safe-subs edit-content (- hash-idx 2) hash-idx))
                nearest-node (some-> (editor-handler/get-nearest-page) string/trim)]
            (if (and add-tag-to-nearest-node? (not (string/blank? nearest-node)))
              (p/let [node-ent (db-async/<get-case-page (state/get-current-repo) nearest-node)
                      ;; Save because nearest node doesn't exist yet
                      _ (when-not node-ent (editor-handler/save-current-block!))
                      node-ent' (or node-ent (db-async/<get-case-page (state/get-current-repo) nearest-node))
                      _ (add-tag (state/get-current-repo) (:block/uuid node-ent') tag-entity)]
                ;; Notify as action has been applied to a node off screen
                (notification/show! (t :page/added-tag-to-node (:block/title tag-entity) (:block/title node-ent'))))
              (add-tag (state/get-current-repo) (:block/uuid edit-block) tag-entity))))))))
