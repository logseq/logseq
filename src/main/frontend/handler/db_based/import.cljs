(ns frontend.handler.db-based.import
  "Handles DB graph imports"
  (:require ["jszip" :as JSZip]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- zip-entries
  [^js zip]
  (->> (js/Object.keys (.-files zip))
       (array-seq)
       (map (fn [name]
              (let [entry (aget (.-files zip) name)]
                {:name name
                 :entry entry
                 :dir? (true? (.-dir entry))})))
       vec))

(defn- sqlite-entry
  [entries]
  (let [candidates (filter (fn [{:keys [name dir?]}]
                             (let [name (-> name
                                            (string/replace #"\+" "/")
                                            string/lower-case)]
                               (and (not dir?)
                                    (string/ends-with? name "db.sqlite"))))
                           entries)]
    (first (sort-by (comp count :name) candidates))))

(defn- asset-entry?
  [name]
  (let [name (-> name
                 (string/replace #"\+" "/")
                 string/lower-case)]
    (or (string/starts-with? name "assets/")
        (string/includes? name "/assets/"))))

(defn- asset-file-name
  [name]
  (let [name (-> name
                 (string/replace #"\+" "/"))
        name (if-let [idx (string/last-index-of name "/assets/")]
               (subs name (+ idx (count "/assets/")))
               (string/replace-first name #"^assets/" ""))]
    (last (string/split name #"/"))))

(defn- <write-asset-file!
  [repo assets-dir file-name data]
  (let [file-path (path/path-join assets-dir file-name)]
    (if (util/electron?)
      (fs/write-file! file-path data)
      (fs/write-plain-text-file! repo assets-dir file-name data {:skip-transact? true
                                                                 :skip-compare? true}))))

(defn- <copy-zip-assets!
  [repo entries {:keys [progress-fn total]}]
  (let [assets (->> entries
                    (filter (fn [{:keys [name dir?]}]
                              (and (not dir?)
                                   (asset-entry? name))))
                    vec)]
    (if (empty? assets)
      (p/resolved {:copied 0 :failed []})
      (p/let [repo-dir (config/get-repo-dir repo)
              assets-dir (path/path-join repo-dir common-config/local-assets-dir)
              _ (fs/mkdir-if-not-exists assets-dir)]
        (p/loop [remaining assets
                 count 0
                 failed []]
          (if (empty? remaining)
            {:copied count :failed failed}
            (let [{:keys [name entry]} (first remaining)
                  file-name (asset-file-name name)]
              (if (string/blank? file-name)
                (p/recur (subvec remaining 1) count failed)
                (p/let [data (.async entry "uint8array")
                        write-result (p/catch (<write-asset-file! repo assets-dir file-name data)
                                              (fn [e]
                                                (js/console.error e)
                                                ::write-failed))]
                  (if (= ::write-failed write-result)
                    (p/recur (subvec remaining 1) count (conj failed file-name))
                    (let [next-count (inc count)]
                      (when progress-fn
                        (progress-fn next-count total))
                      (p/recur (subvec remaining 1) next-count failed))))))))))))

(defn import-from-sqlite-db!
  [buffer bare-graph-name finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)]
    (->
     (p/do!
      (persist-db/<import-db graph buffer)
      (state/add-repo! {:url graph})
      (repo-handler/restore-and-setup-repo! graph {:import-type :sqlite-db})
      (state/set-current-repo! graph)
      (persist-db/<export-db graph {})
      (db/transact! graph (sqlite-util/import-tx :sqlite-db) {:import-db? true})
      (finished-ok-handler))
     (p/catch
      (fn [e]
        (js/console.error e)
        (notification/show!
         (str (.-message e))
         :error))))))

(defn import-from-sqlite-zip!
  [^js file bare-graph-name finished-ok-handler]
  (-> (p/let [zip-buffer (.arrayBuffer file)
              ^js zip (.loadAsync JSZip zip-buffer)
              entries (zip-entries zip)
              entry (sqlite-entry entries)
              asset-total (count (filter (fn [{:keys [name dir?]}]
                                           (and (not dir?)
                                                (asset-entry? name)))
                                         entries))
              _ (when (pos? asset-total)
                  (state/set-state! :graph/importing :sqlite-zip)
                  (state/set-state! :graph/importing-state {:total asset-total
                                                            :current-idx 0
                                                            :current-page "Assets"}))]
        (if-not entry
          (notification/show! "Zip missing db.sqlite. Please check the archive structure." :error)
          (do
            (shui/dialog-close!)
            (p/let [sqlite-buffer (.async ^js (:entry entry) "arraybuffer")]
              (import-from-sqlite-db!
               sqlite-buffer
               bare-graph-name
               (fn []
                 (p/let [repo (state/get-current-repo)
                         {:keys [copied failed]}
                         (<copy-zip-assets!
                          repo
                          entries
                          {:total asset-total
                           :progress-fn (fn [current total]
                                          (when (pos? total)
                                            (state/set-state! :graph/importing-state {:total total
                                                                                      :current-idx current
                                                                                      :current-page "Assets"})))})]
                   (when (pos? copied)
                     (notification/show! (str "Imported " copied " assets.") :success))
                   (when (seq failed)
                     (notification/show!
                      (str "Skipped " (count failed) " assets. See console for details.")
                      :warning false)
                     (js/console.warn "Zip import skipped assets:" (clj->js failed)))
                   (when (and (pos? asset-total)
                              (not= asset-total (+ copied (count failed))))
                     (notification/show!
                      (str "Imported " copied " of " asset-total " assets. See console for details.")
                      :warning false))
                   (state/set-state! :graph/importing nil)
                   (state/set-state! :graph/importing-state nil)
                   (finished-ok-handler))))))))
      (p/catch
       (fn [e]
         (js/console.error e)
         (state/set-state! :graph/importing nil)
         (state/set-state! :graph/importing-state nil)
         (notification/show! (str "Zip import failed: " (.-message e)) :error)))))

(defn import-from-debug-transit!
  [bare-graph-name raw finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)
        db-or-datoms (ldb/read-transit-str raw)
        datoms (if (d/db? db-or-datoms) (vec (d/datoms db-or-datoms :eavt)) db-or-datoms)]
    (p/do!
     (persist-db/<new graph {:import-type :debug-transit
                             :datoms datoms})
     (state/add-repo! {:url graph})
     (repo-handler/restore-and-setup-repo! graph {:import-type :debug-transit})
     (db/transact! graph (sqlite-util/import-tx :debug-transit) {:import-db? true})
     (state/set-current-repo! graph)
     (finished-ok-handler))))

(defn import-from-edn-file!
  "Creates a new DB graph and imports sqlite.build EDN file"
  [bare-graph-name file-body finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)
        finished-error-handler
        #(do
           (state/set-state! :graph/importing nil)
           (shui/dialog-close-all!))
        edn-data (try
                   (edn/read-string file-body)
                   (catch :default e
                     (js/console.error e)
                     (notification/show! "The given EDN file is not valid EDN. Please fix and try again."
                                         :error)
                     (finished-error-handler)
                     nil))]
    (when (some? edn-data)
      (-> (p/let
           [_ (persist-db/<new graph {:import-type :edn})
            _ (state/add-repo! {:url graph})
            _ (repo-handler/restore-and-setup-repo! graph {:import-type :edn})
            _ (state/set-current-repo! graph)
            {:keys [error]} (ui-outliner-tx/transact!
                             {:outliner-op :batch-import-edn}
                             (outliner-op/batch-import-edn! edn-data {:tx-meta {:import-db? true}}))]
            (if error
              (do
                (notification/show! error :error)
                (finished-error-handler))
              (finished-ok-handler)))
          (p/catch
           (fn [e]
             (js/console.error e)
             (notification/show! (str "Unexpected error: " (.-message e))
                                 :error)
             (finished-error-handler)))))))

(defn- import-edn-data-from-form [import-inputs _e]
  (let [export-map (try (edn/read-string (:import-data @import-inputs)) (catch :default _err ::invalid-import))
        import-block? (::sqlite-export/block export-map)
        block (when import-block?
                (if-let [eid (:block-id (first (state/get-editor-args)))]
                  (let [ent (db/entity [:block/uuid eid])]
                    (if-not (:block/page ent)
                      {:error "Can't import block into a non-block entity. Please import block elsewhere."}
                      (merge (select-keys ent [:block/uuid])
                             {:block/page (select-keys (:block/page ent) [:block/uuid])})))
                  (notification/show! "No block found" :warning)))]
    (cond (or (= ::invalid-import export-map) (not (map? export-map)))
          (notification/show! "The submitted EDN data is invalid! Please fix and try again." :warning)
          (:error block)
          (do
            (notification/show! (:error block) :error)
            (shui/dialog-close-all!))
          :else
          (p/let [{:keys [error]}
                  (ui-outliner-tx/transact!
                   {:outliner-op :batch-import-edn}
                   (outliner-op/batch-import-edn! export-map (when block {:current-block block})))]
            ;; Also close cmd-k
            (shui/dialog-close-all!)
            (ui-handler/re-render-root!)
            (if error
              (notification/show! error :error)
              (notification/show! "Import successful!" :success))))))

(defn ^:export import-edn-data-dialog
  "Displays dialog which allows users to paste and import sqlite.build EDN Data"
  []
  (let [import-inputs (atom {:import-data "" :import-block? false})]
    (shui/dialog-open!
     [:div
      [:label.flex.my-2.text-lg "Import EDN Data"]
      #_[:label.block.flex.items-center.py-3
         (shui/checkbox {:on-checked-change #(swap! import-inputs update :import-block? not)})
         [:small.pl-2 (str "Import into current block")]]
      (shui/textarea {:placeholder "{}"
                      :class "overflow-y-auto"
                      :rows 10
                      :auto-focus true
                      :on-change (fn [^js e] (swap! import-inputs assoc :import-data (util/evalue e)))})
      (shui/button {:class "mt-3"
                    :on-click (partial import-edn-data-from-form import-inputs)}
                   "Import")])))
