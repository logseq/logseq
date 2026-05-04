(ns frontend.handler.common.developer
  "Common fns for developer related functionality"
  (:require ["/frontend/utils" :as utils]
            [cljs.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.notification :as notification]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.db :as ldb]
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
      (ui/button (t :ui/copy-to-clipboard)
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
      (ui/button (t :ui/copy-to-clipboard)
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
    (notification/show! (t :block/not-found-warning) :warning)))

(defn ^:export show-block-ast []
  (if-let [{:block/keys [title format]} (:block (first (state/get-editor-args)))]
    (show-content-ast title (or format :markdown))
    (notification/show! (t :block/not-found-warning) :warning)))

(defn ^:export show-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (show-entity-data page-id)
    (notification/show! (t :page/not-found-warning) :warning)))

(defn ^:export validate-db []
  (state/<invoke-db-worker :thread-api/validate-db (state/get-current-repo)))

(defn- checksum-export-file-name
  [repo]
  (-> (or repo "graph")
      (string/replace #"^/+" "")
      (string/replace #"[\\/]+" "_")
      (str "_checksum_" (quot (util/time-ms) 1000))))

(defn- client-ops-export-file-name
  [repo]
  (-> (or repo "graph")
      (string/replace #"^/+" "")
      (string/replace #"[\\/]+" "_")
      (str "_client_ops_" (quot (util/time-ms) 1000))))

(defn- <fetch-server-checksum-diagnostics
  [repo]
  (let [base (rtc-handler/http-base)
        graph-id (some-> (db/get-db repo) ldb/get-graph-rtc-uuid str)]
    (if (and (seq base) (seq graph-id))
      (rtc-handler/fetch-json (str base "/sync/" graph-id "/checksum/diagnostics")
                              {:method "GET"}
                              {:error-schema :error})
      (p/rejected (ex-info "missing sync diagnostics context"
                           {:repo repo
                            :base base
                            :graph-id graph-id})))))

(defn- normalize-diff-block
  [{:keys [block/uuid block/parent block/page] :as block}]
  (cond-> block
    uuid (assoc :block/uuid (str uuid))
    parent (assoc :block/parent (str parent))
    page (assoc :block/page (str page))))

(defn- blocks-by-uuid
  [blocks]
  (into {}
        (keep (fn [block]
                (let [block' (normalize-diff-block block)
                      uuid (:block/uuid block')]
                  (when (seq uuid)
                    [uuid block']))))
        blocks))

(defn- different-blocks
  [local-blocks server-blocks]
  (let [local-by-uuid (blocks-by-uuid local-blocks)
        server-by-uuid (blocks-by-uuid server-blocks)
        block-uuids (sort (set/union (set (keys local-by-uuid))
                                     (set (keys server-by-uuid))))]
    (->> block-uuids
         (keep (fn [uuid]
                 (let [local-block (get local-by-uuid uuid)
                       server-block (get server-by-uuid uuid)]
                   (when (not= local-block server-block)
                     {:block/uuid uuid
                      :local-block local-block
                      :server-block server-block}))))
         vec)))

(defn- <log-checksum-mismatch-diff!
  [repo export-edn]
  (p/let [server-diagnostics (<fetch-server-checksum-diagnostics repo)
          server-blocks (map (fn [b]
                               {:block/uuid (uuid (:uuid b))
                                :block/parent (when-let [id (:parent b)] (uuid id))
                                :block/page (when-let [id (:page b)] (uuid id))
                                :block/order (:order b)})
                             (:blocks server-diagnostics))
          diff-blocks (different-blocks (:blocks export-edn) server-blocks)
          diff-data {:repo repo
                     :local-checksum (:local-checksum export-edn)
                     :remote-checksum (:remote-checksum export-edn)
                     :recomputed-checksum (:recomputed-checksum export-edn)
                     :server-checksum (:checksum server-diagnostics)
                     :different-blocks diff-blocks}]
    (pprint/pprint diff-data)
    (when (seq diff-blocks)
      (js/console.warn "Checksum mismatch between client and server. Diff data:" diff-data))))


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
                      (p/let [_ (-> (<log-checksum-mismatch-diff! repo export-edn)
                                    (p/catch (fn [error]
                                               (js/console.error "checksum mismatch diff fetch failed:" error)
                                               nil)))]
                        (utils/saveToFile blob filename "edn")
                        (notification/show!
                         (t :graph.diagnostics/checksum-recomputed-success
                            recomputed-checksum
                            (or local-checksum "<nil>")
                            (or remote-checksum "<nil>")
                            filename
                            (count blocks)
                            (pr-str checksum-attrs))
                         :success
                         false)))
                    (notification/show! (t :graph.diagnostics/checksum-unavailable-warning) :warning))))
        (p/catch (fn [error]
                   (js/console.error "recompute-checksum-diagnostics failed:" error)
                   (notification/show! (t :graph.diagnostics/checksum-failed-error) :error))))
    (notification/show! (t :graph.diagnostics/no-graph-warning) :warning)))

(defn ^:export export-client-ops-sqlite
  []
  (if-let [repo (state/get-current-repo)]
    (-> (state/<invoke-db-worker :thread-api/export-client-ops-db-base64 repo)
        (p/then (fn [data]
                  (if-let [payload (some-> data util/base64string-to-unit8array)]
                    (let [filename (client-ops-export-file-name repo)
                          blob (js/Blob. #js [payload] (clj->js {:type "application/octet-stream"}))]
                      (utils/saveToFile blob filename "sqlite")
                      (notification/show!
                       (t :graph.diagnostics/client-ops-export-success filename)
                       :success
                       false))
                    (notification/show!
                     (t :graph.diagnostics/client-ops-export-invalid-payload-warning
                        (pr-str (type data)))
                     :warning))))
        (p/catch (fn [error]
                   (js/console.error "export-client-ops-sqlite failed:" error)
                   (notification/show! (t :graph.diagnostics/client-ops-export-failed-error) :error))))
    (notification/show! (t :graph.diagnostics/no-graph-warning) :warning)))

(defn import-chosen-graph
  [repo]
  (p/let [_ (persist-db/<unsafe-delete repo)]
    (notification/show! (t :graph/updated-switching) :success)
    (state/pub-event! [:graph/switch repo])))

(defn ^:export replace-graph-with-db-file []
  (state/pub-event! [:dialog-select/db-graph-replace]))

(defn ^:export rtc-stop []
  (rtc-handler/<rtc-stop!))

(defn ^:export rtc-start []
  (rtc-handler/<rtc-start! (state/get-current-repo)))
