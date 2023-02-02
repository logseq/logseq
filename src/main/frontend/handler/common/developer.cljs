(ns frontend.handler.common.developer
  "Common fns for developer related functionality"
  (:require [frontend.db :as db]
            [cljs.pprint :as pprint]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]
            [frontend.ui :as ui]
            [frontend.util.page :as page-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

;; Fns used between menus and commands
(defn show-entity-data
  [& pull-args]
  (let [pull-data (with-out-str (pprint/pprint (apply db/pull pull-args)))]
    (println pull-data)
    (notification/show!
     [:div
      [:pre.code pull-data]
      [:br]
      (ui/button "Copy to clipboard"
                 :on-click #(.writeText js/navigator.clipboard pull-data))]
     :success
     false)))

(defn show-content-ast
  [content format]
  (let [ast-data (-> (gp-mldoc/->edn content (gp-mldoc/default-config format))
                     pprint/pprint
                     with-out-str)]
    (println ast-data)
    (notification/show!
     [:div
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
  (if-let [{:block/keys [content format]} (:block (first (state/get-editor-args)))]
    (show-content-ast content format)
    (notification/show! "No block found" :warning)))

(defn ^:export show-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (show-entity-data page-id)
    (notification/show! "No page found" :warning)))

(defn ^:export show-page-ast []
  (let [page-data (db/pull '[:block/format {:block/file [:file/content]}]
                           (page-util/get-current-page-id))]
    (if (get-in page-data [:block/file :file/content])
      (show-content-ast (get-in page-data [:block/file :file/content]) (:block/format page-data))
      (notification/show! "No page found" :warning))))
