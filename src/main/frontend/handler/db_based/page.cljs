(ns frontend.handler.db-based.page
  "DB graph only page util fns"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.outliner.validate :as outliner-validate]
            [logseq.db.frontend.class :as db-class]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.impl.entity :as de]
            [promesa.core :as p]
            [logseq.db]))

(defn- valid-tag?
  "Returns a boolean indicating whether the new tag passes all valid checks.
   When returning false, this fn also displays appropriate notifications to the user"
  [repo block tag-entity]
  (try
    (outliner-validate/validate-unique-by-name-tag-and-block-type
     (db/get-db repo)
     (:block/title block)
     (update block :block/tags (fnil conj #{}) tag-entity))
    true
    (catch :default e
      (if (= :notification (:type (ex-data e)))
        (let [payload (:payload (ex-data e))]
          (notification/show! (:message payload) (:type payload))
          false)
        (throw e)))))

(defn add-tag [repo block-id tag-entity]
  (p/do!
   (editor-handler/save-current-block!)
   ;; Check after save-current-block to get most up to date block content
   (when (valid-tag? repo (db/entity repo [:block/uuid block-id]) tag-entity)
     (db-property-handler/set-block-property! block-id :block/tags (:db/id tag-entity)))))

(defn convert-to-tag!
  [page-entity]
  (if (db/page-exists? (:block/title page-entity) #{:logseq.class/Tag})
    (notification/show! (str "A tag with the name \"" (:block/title page-entity) "\" already exists.") :warning false)
    (let [txs [(db-class/build-new-class (db/get-db)
                                         {:db/id (:db/id page-entity)
                                          :block/title (:block/title page-entity)
                                          :block/created-at (:block/created-at page-entity)})
               [:db/retract (:db/id page-entity) :block/tags :logseq.class/Page]]]

      (db/transact! (state/get-current-repo) txs {:outliner-op :save-block}))))

(defn <create-class!
  "Creates a class page and provides class-specific error handling"
  [title options]
  (-> (page-common-handler/<create! title (assoc options :class? true
                                                 :skip-existing-page-check? false))
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
        create-opts {:redirect? false
                     :create-first-block? false}]
    (when (:block/uuid edit-block)
      (p/let [result (when-not (de/entity? chosen-result) ; page not exists yet
                       (if class?
                         (<create-class! tag create-opts)
                         (page-common-handler/<create! tag create-opts)))]
        (when class?
          (let [tag-entity (or (when (de/entity? chosen-result) chosen-result) result)
                hash-idx (string/last-index-of (subs edit-content 0 current-pos) last-pattern)
                add-tag-to-nearest-node? (= page-ref/right-brackets (common-util/safe-subs edit-content (- hash-idx 2) hash-idx))
                nearest-node (some-> (editor-handler/get-nearest-page) string/trim)]
            (if (and add-tag-to-nearest-node? (not (string/blank? nearest-node)))
              (p/let [node-ent (db/get-case-page nearest-node)
                      ;; Save because nearest node doesn't exist yet
                      _ (when-not node-ent (editor-handler/save-current-block!))
                      node-ent' (or node-ent (db/get-case-page nearest-node))
                      _ (add-tag (state/get-current-repo) (:block/uuid node-ent') tag-entity)]
                ;; Notify as action has been applied to a node off screen
                (notification/show! (str "Added tag " (pr-str (:block/title tag-entity)) " to " (pr-str (:block/title node-ent')))))
              (add-tag (state/get-current-repo) (:block/uuid edit-block) tag-entity))))))))
