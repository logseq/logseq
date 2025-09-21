(ns frontend.handler.db-based.page
  "DB graph only page util fns"
  (:require [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.outliner.validate :as outliner-validate]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- valid-tag?
  "Returns a boolean indicating whether the new tag passes all valid checks.
   When returning false, this fn also displays appropriate notifications to the user"
  [repo block tag-entity]
  (try
    (outliner-validate/validate-unique-by-name-and-tags
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

(defn convert-page-to-tag!
  "Converts a Page to a Tag"
  [page-entity]
  (cond (db/page-exists? (:block/title page-entity) #{:logseq.class/Tag})
        (notification/show! (str "A tag with the name \"" (:block/title page-entity) "\" already exists.") :warning false)
        (:block/parent page-entity)
        (notification/show! "Namespaced pages can't be tags" :error false)
        (outliner-validate/uneditable-page? page-entity)
        (notification/show! "Built-in pages can't be edited" :error)
        :else
        (let [txs [(db-class/build-new-class (db/get-db)
                                             {:db/id (:db/id page-entity)
                                              :block/title (:block/title page-entity)
                                              :block/created-at (:block/created-at page-entity)})
                   [:db/retract (:db/id page-entity) :block/tags :logseq.class/Page]]]

          (db/transact! (state/get-current-repo) txs {:outliner-op :save-block}))))

(defn convert-tag-to-page!
  [entity]
  (cond (db/page-exists? (:block/title entity) #{:logseq.class/Page})
        (notification/show! (str "A page with the name \"" (:block/title entity) "\" already exists.") :warning false)
        (outliner-validate/uneditable-page? entity)
        (notification/show! "Built-in tags can't be edited" :error)
        :else
        (if (seq (:logseq.property.class/_extends entity))
          (notification/show! "This tag cannot be converted because it has tag children. All tag children must be removed or converted before converting this tag." :error false)
          (p/let [objects (db-async/<get-tag-objects (state/get-current-repo) (:db/id entity))]
            (let [convert-fn
                  (fn convert-fn []
                    (let [page-txs [[:db/retract (:db/id entity) :db/ident]
                                    [:db/retract (:db/id entity) :block/tags :logseq.class/Tag]
                                    [:db/retract (:db/id entity) :logseq.property.class/extends]
                                    [:db/retract (:db/id entity) :logseq.property.class/properties]
                                    [:db/add (:db/id entity) :block/tags :logseq.class/Page]]
                          obj-txs (mapcat (fn [obj]
                                            (let [tags (map #(db/entity (state/get-current-repo) (:db/id %)) (:block/tags obj))]
                                              [{:db/id (:db/id obj)
                                                :block/title (db-content/replace-tag-refs-with-page-refs (:block/title obj) tags)}
                                               [:db/retract (:db/id obj) :block/tags (:db/id entity)]]))
                                          objects)
                          txs (concat page-txs obj-txs)]
                      (db/transact! (state/get-current-repo) txs {:outliner-op :save-block})))]
              (-> (shui/dialog-confirm!
                   "Converting a tag to page also removes its tag properties and its tag from all nodes tagged with it. Are you ok with that?"
                   {:id :convert-tag-to-page
                    :data-reminder :ok})
                  (p/then convert-fn)))))))

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
        create-opts {:redirect? false}]
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
