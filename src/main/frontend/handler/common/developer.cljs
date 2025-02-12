(ns frontend.handler.common.developer
  "Common fns for developer related functionality"
  (:require [cljs.pprint :as pprint]
            [datascript.impl.entity :as de]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.notification :as notification]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util.page :as page-util]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]))

;; Fns used between menus and commands
(defn show-entity-data
  [eid]
  (let [result* (db/pull eid)
        entity (db/entity eid)
        result (cond-> result*
                 (and (seq (:block/properties entity)) (config/db-based-graph? (state/get-current-repo)))
                 (assoc :block.debug/properties
                        (->> (:block/properties entity)
                             (map (fn [[k v]]
                                    [k
                                     (cond
                                       (de/entity? v)
                                       (db-property/property-value-content v)
                                       (and (set? v) (every? de/entity? v))
                                       (set (map db-property/property-value-content v))
                                       :else
                                       v)]))
                             (into {})))
                 (seq (:block/refs result*))
                 (assoc :block.debug/refs
                        (mapv #(or (:block/title (db/entity (:db/id %))) %) (:block/refs result*))))
        pull-data (with-out-str (pprint/pprint result))]
    (println pull-data)
    (notification/show!
     [:div.ls-wrap-widen
      [:pre.code pull-data]
      [:br]
      (ui/button "Copy to clipboard"
                 :on-click #(.writeText js/navigator.clipboard pull-data))]
     :success
     false)))

(defn show-content-ast
  [content format]
  (let [ast-data (-> (mldoc/->edn content format)
                     pprint/pprint
                     with-out-str)]
    (println ast-data)
    (notification/show!
     [:div.ls-wrap-widen
      ;; Show clipboard at top since content is really long for pages
      (ui/button "Copy to clipboard"
                 :on-click #(.writeText js/navigator.clipboard ast-data))
      [:br]
      [:pre.code ast-data]]
     :success
     false)))

;; Public Commands
(defn ^:export show-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (show-entity-data [:block/uuid block-uuid])
    (notification/show! "No block found" :warning)))

(defn ^:export show-block-ast []
  (if-let [{:block/keys [title format]} (:block (first (state/get-editor-args)))]
    (show-content-ast title (or format :markdown))
    (notification/show! "No block found" :warning)))

(defn ^:export show-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (show-entity-data page-id)
    (notification/show! "No page found" :warning)))

(defn ^:export show-page-ast []
  (if (config/db-based-graph? (state/get-current-repo))
    (notification/show! "Command not available yet for DB graphs" :warning)
    (let [page-data (db/pull '[:block/format {:block/file [:file/content]}]
                             (page-util/get-current-page-id))]
      (if (get-in page-data [:block/file :file/content])
        (show-content-ast (get-in page-data [:block/file :file/content])
                          (get page-data :block/format :markdown))
        (notification/show! "No page found" :warning)))))

(defn ^:export validate-db []
  (when-let [^Object worker @state/*db-worker]
    (.validate-db worker (state/get-current-repo))))

(defn import-chosen-graph
  [repo]
  (p/let [_ (persist-db/<unsafe-delete repo)]
    (notification/show! (str "Graph updated! Switching to graph ...") :success)
    (state/pub-event! [:graph/switch repo])))

(defn ^:export replace-graph-with-db-file []
  (state/pub-event! [:dialog-select/db-graph-replace]))
