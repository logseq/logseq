(ns logseq.api.file-based
  "File version related fns"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [frontend.db.async :as db-async]
            [frontend.db.file-based.model :as file-model]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [logseq.db.common.property-util :as db-property-util]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

;; file-based templates

(defn get_current_graph_templates
  []
  (when-let [repo (state/get-current-repo)]
    (p/let [templates (db-async/<get-all-templates repo)]
      (some-> templates
              (sdk-utils/normalize-keyword-for-json)
              (bean/->js)))))

(defn get_template
  [name]
  (p/let [block (when name (db-async/<get-template-by-name name))]
    (some-> block
            (sdk-utils/normalize-keyword-for-json)
            (bean/->js))))

(defn insert_template
  [target-uuid template-name]
  (p/let [exists? (page-handler/<template-exists? template-name)]
    (when exists?
      (when-let [target (db-model/get-block-by-uuid target-uuid)]
        (editor-handler/insert-template! nil template-name {:target target}) nil))))

(defn exist_template
  [name]
  (page-handler/<template-exists? name))

(defn create_template
  [target-uuid template-name ^js opts]
  (when (and template-name (db-model/get-block-by-uuid target-uuid))
    (p/let [{:keys [overwrite]} (bean/->clj opts)
            block (db-async/<get-template-by-name template-name)
            repo (state/get-current-repo)]
      (if (or (not block) (true? overwrite))
        (do (when-let [old-target block]
              (let [k (db-property-util/get-pid repo :logseq.property/template)]
                (property-handler/remove-block-property! repo (:block/uuid old-target) k)))
            (property-handler/set-block-property! repo target-uuid :logseq.property/template template-name))
        (throw (js/Error. "Template already exists!"))))))

(defn remove_template
  [name]
  (p/let [block (when name (db-async/<get-template-by-name name))]
    (when block
      (let [repo (state/get-current-repo)
            k (db-property-util/get-pid repo :logseq.property/template)]
        (property-handler/remove-block-property! repo (:block/uuid block) k)))))

(defn get_pages_from_namespace
  [ns]
  (when-let [repo (and ns (state/get-current-repo))]
    (when-let [pages (file-model/get-namespace-pages repo ns)]
      (bean/->js (sdk-utils/normalize-keyword-for-json pages)))))

(defn get_pages_tree_from_namespace
  [ns]
  (when-let [repo (and ns (state/get-current-repo))]
    (when-let [pages (file-model/get-namespace-hierarchy repo ns)]
      (bean/->js (sdk-utils/normalize-keyword-for-json pages)))))

(def set_blocks_id #(editor-handler/set-blocks-id! (map uuid %)))
