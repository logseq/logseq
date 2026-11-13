(ns frontend.handler.db-based.import
  "Handles DB graph imports"
  (:require ["jszip" :as JSZip]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.common.path :as path]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- <transact-import-marker!
  [graph import-type]
  (state/<invoke-db-worker :thread-api/transact
                           graph
                           (sqlite-util/import-tx import-type)
                           {:import-db? true}
                           nil))

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
                        write-result (p/catch (fs/write-asset-file! repo file-name data)
                                              (fn [e]
                                                (js/console.error e)
                                                ::write-failed))]
                  (if (= ::write-failed write-result)
                    (p/recur (subvec remaining 1) count (conj failed file-name))
                    (let [next-count (inc count)]
                      (when progress-fn
                        (progress-fn next-count total))
                      (p/recur (subvec remaining 1) next-count failed))))))))))))

(defn- notify-copied-assets!
  [{:keys [copied failed]} asset-total]
  (when (pos? copied)
    (notification/show! (t :import/assets-imported copied) :success))
  (when (seq failed)
    (notification/show!
     (t :import/assets-skipped (count failed))
     :warning false)
    (log/warn :import/assets-skipped {:failed failed}))
  (when (and (pos? (or asset-total 0))
             (not= asset-total (+ copied (count failed))))
    (notification/show!
     (t :import/assets-import-partial copied asset-total)
     :warning false)))

(defn- clear-importing-state!
  []
  (state/set-state! :graph/importing nil)
  (state/set-state! :graph/importing-state nil))

(defn classify-existing-graph-path
  "Classify a user-picked path as a DB graph source."
  [path]
  (when (and (string? path) (not (string/blank? path)))
    (let [normalized (path/path-normalize path)
          lower (string/lower-case normalized)]
      (cond
        (string/ends-with? lower ".zip") :sqlite-zip
        (string/ends-with? lower ".sqlite") :sqlite-file
        :else :graph-dir))))

(defn suggested-graph-name
  "Infer a DB graph name from a folder, db.sqlite, or ZIP path."
  [path]
  (when (and (string? path) (not (string/blank? path)))
    (let [normalized (path/path-normalize path)
          kind (classify-existing-graph-path normalized)
          raw (case kind
                :sqlite-zip (path/file-stem normalized)
                :sqlite-file (or (some-> (path/parent normalized) path/basename)
                                 (path/file-stem normalized))
                (path/basename normalized))]
      (or (graph-dir/decode-canonical-graph-dir-key raw)
          (some-> (graph-dir/decode-graph-dir-name raw)
                  common-config/strip-leading-db-version-prefix
                  not-empty)
          (not-empty (common-config/strip-leading-db-version-prefix raw))))))

(defn- sqlite-source
  [path kind]
  (let [normalized (path/path-normalize path)]
    (case kind
      :sqlite-file
      {:sqlite-path normalized
       :assets-dir (path/path-join (path/parent normalized) common-config/local-assets-dir)}

      :graph-dir
      {:sqlite-path (path/path-join normalized "db.sqlite")
       :assets-dir (path/path-join normalized common-config/local-assets-dir)}

      nil)))

(defn- <copy-dir-assets!
  [repo assets-dir]
  (p/let [exists? (fs/file-exists? assets-dir)]
    (if-not exists?
      (p/resolved {:copied 0 :failed []})
      (p/let [files (fs/readdir assets-dir {:path-only? true})
              assets (->> files
                          (keep (fn [file-path]
                                  (let [prefix (str (string/replace (path/path-normalize assets-dir) #"/+$" "") "/")
                                        file-name (subs (path/path-normalize file-path) (count prefix))]
                                    (when-not (string/blank? file-name)
                                      {:path file-path :file-name file-name}))))
                          vec)
              total (count assets)
              _ (when (pos? total)
                  (state/set-state! :graph/importing :sqlite-dir)
                  (state/set-state! :graph/importing-state {:total total
                                                            :current-idx 0
                                                            :step :assets}))]
        (p/loop [remaining assets
                 copied 0
                 failed []]
          (if (empty? remaining)
            {:copied copied :failed failed :total total}
            (let [{:keys [path file-name]} (first remaining)]
              (p/let [data (p/catch (fs/read-file-raw nil path)
                                    (fn [e]
                                      (log/error :import/read-asset-failed {:path path :error e})
                                      ::read-failed))
                      write-result (if (= ::read-failed data)
                                     ::write-failed
                                     (p/catch (fs/write-asset-file! repo file-name data)
                                              (fn [e]
                                                (log/error :import/write-asset-failed {:file-name file-name :error e})
                                                ::write-failed)))]
                (if (= ::write-failed write-result)
                  (p/recur (subvec remaining 1) copied (conj failed file-name))
                  (let [next-copied (inc copied)]
                    (when (pos? total)
                      (state/set-state! :graph/importing-state {:total total
                                                                :current-idx next-copied
                                                                :step :assets}))
                    (p/recur (subvec remaining 1) next-copied failed)))))))))))

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
      (<transact-import-marker! graph :sqlite-db)
      (finished-ok-handler))
     (p/catch
      (fn [e]
        (js/console.error e)
        (notification/show!
         (str (.-message e))
         :error))))))

(defn- handle-zip-import-error!
  [e]
  (log/error :import/zip-import-failed e)
  (clear-importing-state!)
  (notification/show! (t :import/zip-import-error (.-message e)) :error))

(defn <import-from-sqlite-zip-buffer
  [zip-buffer bare-graph-name finished-ok-handler]
  (p/let [^js zip (.loadAsync JSZip zip-buffer)
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
                                                        :step :assets}))]
    (if-not entry
      (do
        (clear-importing-state!)
        (notification/show! (t :import/zip-missing-db-sqlite) :error))
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
                                                                                  :step :assets})))})]
               (notify-copied-assets! {:copied copied :failed failed} asset-total)
               (clear-importing-state!)
               (finished-ok-handler)))))))))

(defn import-from-sqlite-zip!
  [^js file bare-graph-name finished-ok-handler]
  (-> (p/let [zip-buffer (.arrayBuffer file)]
        (<import-from-sqlite-zip-buffer zip-buffer bare-graph-name finished-ok-handler))
      (p/catch handle-zip-import-error!)))

(defn- <import-from-sqlite-and-assets!
  [{:keys [sqlite-path assets-dir]} bare-graph-name finished-ok-handler]
  (-> (p/let [exists? (fs/file-exists? sqlite-path)]
        (if-not exists?
          (notification/show! (t :graph.add-existing/missing-db-error) :error)
          (p/let [buffer (ipc/ipc :readGraphImportSnapshot sqlite-path)]
            (import-from-sqlite-db!
             buffer
             bare-graph-name
             (fn []
               (p/let [repo (state/get-current-repo)
                       result (<copy-dir-assets! repo assets-dir)]
                 (notify-copied-assets! result (:total result))
                 (clear-importing-state!)
                 (finished-ok-handler)))))))
      (p/catch
       (fn [e]
         (log/error :import/existing-graph-failed {:path sqlite-path :error e})
         (clear-importing-state!)
         (notification/show!
          (t :import/unexpected-error (or (.-message e) (str e)))
          :error)))))

(defn <import-existing-local-graph!
  "Import a local DB graph folder, db.sqlite, or official SQLite+assets ZIP."
  [path bare-graph-name finished-ok-handler]
  (let [kind (classify-existing-graph-path path)]
    (case kind
      :sqlite-zip
      (-> (p/let [buffer (fs/read-file-raw nil path)]
            (<import-from-sqlite-zip-buffer buffer bare-graph-name finished-ok-handler))
          (p/catch handle-zip-import-error!))

      (:sqlite-file :graph-dir)
      (<import-from-sqlite-and-assets! (sqlite-source path kind)
                                       bare-graph-name
                                       finished-ok-handler)

      (notification/show! (t :graph.add-existing/unsupported-error) :error))))

(defn import-from-debug-transit!
  [bare-graph-name raw finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)]
    (p/do!
     (persist-db/<new graph {:import-type :debug-transit
                             :debug-transit-raw raw})
     (state/add-repo! {:url graph})
     (repo-handler/restore-and-setup-repo! graph {:import-type :debug-transit})
     (<transact-import-marker! graph :debug-transit)
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
                     (notification/show! (t :import/invalid-edn-file)
                                         :error)
                     (finished-error-handler)
                     nil))]
    (when (some? edn-data)
      (if-let [error (:error (sqlite-export/validate-export edn-data))]
        (do
          (notification/show! error :error)
          (finished-error-handler))
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
               (notification/show! (t :import/unexpected-error (.-message e))
                                   :error)
               (finished-error-handler))))))))

(defn- <current-import-block
  []
  (if-let [eid (:block-id (first (state/get-editor-args)))]
    (p/let [ent (state/<invoke-db-worker :thread-api/pull
                                         (state/get-current-repo)
                                         [:block/uuid {:block/page [:block/uuid]}]
                                         [:block/uuid eid])]
      (if-not (:block/page ent)
        {:error (t :import/cannot-import-block-into-non-block-entity)}
        (merge (select-keys ent [:block/uuid])
               {:block/page (select-keys (:block/page ent) [:block/uuid])})))
    (do
      (notification/show! (t :block/not-found-warning) :warning)
      (p/resolved nil))))

(defn- import-edn-data-from-form [import-inputs _e]
  (let [export-map (try (edn/read-string (:import-data @import-inputs)) (catch :default _err ::invalid-import))]
    (if (or (= ::invalid-import export-map) (not (map? export-map)))
      (notification/show! (t :import/submitted-edn-invalid) :warning)
      (p/let [block (when (::sqlite-export/block export-map)
                      (<current-import-block))]
        (if (:error block)
          (do
            (notification/show! (:error block) :error)
            (shui/dialog-close-all!))
          (p/let [{:keys [error]}
                  (ui-outliner-tx/transact!
                   {:outliner-op :batch-import-edn}
                   (outliner-op/batch-import-edn! export-map (when block {:current-block block})))]
            ;; Also close cmd-k
            (shui/dialog-close-all!)
            (ui-handler/re-render-root!)
            (if error
              (notification/show! error :error)
              (notification/show! (t :import/successful) :success))))))))

(defn ^:export import-edn-data-dialog
  "Displays dialog which allows users to paste and import sqlite.build EDN Data"
  []
  (let [import-inputs (atom {:import-data "" :import-block? false})]
    (shui/dialog-open!
     [:div
      [:label.flex.my-2.text-lg (t :command.misc/import-edn-data)]
      #_[:label.block.flex.items-center.py-3
         (shui/checkbox {:on-checked-change #(swap! import-inputs update :import-block? not)})
         [:small.pl-2 (str "Import into current block")]]
      (shui/textarea {:placeholder "{}"
                      :class "overflow-y-auto"
                      :rows 10
                      :auto-focus true
                      :ref (fn [element]
                             (when element
                               (js/requestAnimationFrame
                                (fn [_] (.focus element)))))
                      :on-change (fn [^js e] (swap! import-inputs assoc :import-data (util/evalue e)))})
      (shui/button {:class "mt-3"
                    :on-click (partial import-edn-data-from-form import-inputs)}
                   (t :import/title))])))
