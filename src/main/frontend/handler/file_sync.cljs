(ns frontend.handler.file-sync
  (:require ["path" :as path]
            [cljs-time.coerce :as tc]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.sync :as sync]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]))

(def hiding-login&file-sync false)
(def refresh-file-sync-component (atom false))

(defn graph-txid-exists?
  []
  (let [[graph-uuid _txid] @sync/graphs-txid]
    (some? graph-uuid)))


(defn create-graph
  [name]
  (go
    (let [r* (<! (sync/create-graph sync/remoteapi name))
          r (if (instance? ExceptionInfo r*) r* (:GraphUUID r*))]
      (if (and (not (instance? ExceptionInfo r))
               (string? r))
        (do
          (persist-var/-reset-value! sync/graphs-txid [r 0] (state/get-current-repo))
          (persist-var/persist-save sync/graphs-txid)
          (swap! refresh-file-sync-component not))
        (if (= 404 (get-in (ex-data r) [:err :status]))
          (notification/show! (str "create graph failed: already existed graph: " name) :warning)
          (notification/show! (str "create graph failed: " r) :warning))))))


(defn list-graphs
  []
  (go
    (:Graphs (<! (sync/list-remote-graphs sync/remoteapi)))))


(defn switch-graph [graph-uuid]
  (persist-var/-reset-value! sync/graphs-txid [graph-uuid 0] (state/get-current-repo))
  (persist-var/persist-save sync/graphs-txid)
  (swap! refresh-file-sync-component not))

(defn- download-version-file [graph-uuid file-uuid version-uuid]

  (go
    (let [key (path/join "version-files" file-uuid version-uuid)
          r (<! (sync/update-local-files
                 sync/rsapi graph-uuid (config/get-repo-dir (state/get-current-repo)) [key]))]
      (if (instance? ExceptionInfo r)
        (notification/show! (ex-cause r) :error)
        (notification/show! [:div
                             [:div "Downloaded version file at: "]
                             [:div key]] :success false)))))

(defn list-file-versions [graph-uuid page]
  (let [file-id (:db/id (:block/file page))]
    (when-let [path (:file/path (db/entity file-id))]
      (let [base-path (config/get-repo-dir (state/get-current-repo))
            path* (string/replace-first path base-path "")]
        (go
          (let [version-list (:VersionList
                              (<! (sync/get-remote-file-versions sync/remoteapi graph-uuid path*)))]
            (notification/show! [:div
                                 [:div.font-bold "File history - " path*]
                                 [:hr.my-2]
                                 (for [version version-list]
                                   (let [version-uuid (:VersionUUID version)]
                                     [:div.my-4 {:key version-uuid}
                                      [:div
                                       [:a.text-xs.inline
                                        {:on-click #(download-version-file graph-uuid
                                                                           (:FileUUID version)
                                                                           (:VersionUUID version))}
                                        version-uuid]
                                       [:div.opacity-70 (str "Size: " (:Size version))]]
                                      [:div.opacity-50
                                       (util/time-ago (tc/from-string (:CreateTime version)))]]))]
                                :success false)))))))

(defn get-current-graph-uuid [] (first @sync/graphs-txid))
