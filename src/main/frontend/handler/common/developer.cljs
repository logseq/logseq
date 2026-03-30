(ns frontend.handler.common.developer
  "Common fns for developer related functionality"
  (:require ["/frontend/utils" :as utils]
            [cljs.pprint :as pprint]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.notification :as notification]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]))

;; Fns used between menus and commands
(defn show-entity-data
  [eid]
  (let [result* (db/pull eid)
        entity (db/entity eid)
        result (cond-> result*
                 (seq (:block/properties entity))
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
      [:pre.code (str "ID: " (:db/id result) "\n"
                      pull-data)]
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

(defn ^:export validate-db []
  (state/<invoke-db-worker :thread-api/validate-db (state/get-current-repo)))

(defn- checksum-export-file-name
  [repo]
  (-> (or repo "graph")
      (string/replace #"^/+" "")
      (string/replace #"[\\/]+" "_")
      (str "_checksum_" (quot (util/time-ms) 1000))))

(defn ^:export recompute-checksum-diagnostics
  []
  (if-let [repo (state/get-current-repo)]
    (-> (state/<invoke-db-worker :thread-api/recompute-checksum-diagnostics repo)
        (p/then (fn [{:keys [recomputed-checksum local-checksum remote-checksum blocks checksum-attrs e2ee?]
                      :as result}]
                  (if (map? result)
                    (let [export-edn {:repo repo
                                      :generated-at (.toISOString (js/Date.))
                                      :e2ee? e2ee?
                                      :recomputed-checksum recomputed-checksum
                                      :local-checksum local-checksum
                                      :remote-checksum remote-checksum
                                      :checksum-attrs checksum-attrs
                                      :blocks blocks}
                          content (with-out-str (pprint/pprint export-edn))
                          blob (js/Blob. #js [content] (clj->js {:type "text/edn;charset=utf-8"}))
                          filename (checksum-export-file-name repo)]
                      (utils/saveToFile blob filename "edn")
                      (notification/show!
                       (str "Checksum recomputed. Recomputed: " recomputed-checksum
                            ", local: " (or local-checksum "<nil>")
                            ", remote: " (or remote-checksum "<nil>")
                            ". Downloaded " filename ".edn with " (count blocks)
                            " blocks and checksum attrs " (pr-str checksum-attrs) ".")
                       :success
                       false))
                    (notification/show! "Unable to compute checksum diagnostics for current graph." :warning))))
        (p/catch (fn [error]
                   (js/console.error "recompute-checksum-diagnostics failed:" error)
                   (notification/show! "Failed to compute graph checksum diagnostics." :error))))
    (notification/show! "No graph found" :warning)))

(defn import-chosen-graph
  [repo]
  (p/let [_ (persist-db/<unsafe-delete repo)]
    (notification/show! "Graph updated! Switching to graph ..." :success)
    (state/pub-event! [:graph/switch repo])))

(defn ^:export replace-graph-with-db-file []
  (state/pub-event! [:dialog-select/db-graph-replace]))

(defn ^:export rtc-stop []
  (rtc-handler/<rtc-stop!))

(defn ^:export rtc-start []
  (rtc-handler/<rtc-start! (state/get-current-repo)))
