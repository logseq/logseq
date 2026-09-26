(ns ^:no-doc frontend.handler.editor.assets
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor]
            [frontend.handler.notification :as notification]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util.ref :as ref]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [medley.core :as medley]
            [promesa.core :as p]))

(defn delete-asset-of-block!
  [{:keys [repo asset-block full-text block-id local? delete-local?] :as _opts}]
  (p/let [block (db-async/<get-block repo block-id {:children? false})
          _ (or block (throw (ex-info (str block-id " not exists")
                                      {:block-id block-id})))
          text (:block/title block)
          content (if asset-block
                    (string/replace text (ref/->page-ref (:block/uuid asset-block)) "")
                    (string/replace text full-text ""))]
    (editor/save-block! repo block content)
    (when (and local? delete-local?)
      (when asset-block
        (editor/delete-block-aux! asset-block)))))

(defn db-based-write-asset!
  [repo file-path file]
  (p/let [buffer (.arrayBuffer file)]
    (fs/write-asset-file! repo file-path buffer)))

(defn copy-pasted-asset-files!
  "A copy-pasted asset block gets a fresh uuid while its :logseq.property.asset/*
  attrs resolve to assets/<new-uuid>.<ext>, so duplicate the source file under
  the new uuid. The pasted uuid is found by source uuid first, then by the
  block's :db/id for sources whose entity no longer exists. (db-test#1155)"
  [repo blocks uuid->new-uuid id->new-uuid]
  (p/let [repo-dir (config/get-repo-dir repo)
          assets-dir (path/path-join repo-dir "assets")
          _ (fs/mkdir-if-not-exists assets-dir)]
    (p/all
     (for [block blocks
           :let [source-uuid (:block/uuid block)
                 ext (:logseq.property.asset/type block)
                 new-uuid (or (get uuid->new-uuid source-uuid)
                              (get id->new-uuid (:db/id block)))]
           :when (and (ldb/asset? block)
                      (uuid? source-uuid)
                      (uuid? new-uuid)
                      (not= source-uuid new-uuid)
                      (string? ext)
                      ;; external-url assets don't have a local file
                      (nil? (:logseq.property.asset/external-url block)))]
       (p/let [source-name (str source-uuid "." ext)
               data (p/catch (fs/read-file-raw assets-dir source-name)
                             (fn [error]
                               (log/error :msg "Failed to read pasted asset file"
                                          :asset-file source-name
                                          :exception error)
                               nil))]
         (if (some? data)
           (fs/write-asset-file! repo (str new-uuid "." ext) data)
           (do
             (log/error :msg "Pasted asset has no backing file"
                        :asset-file source-name)
             (notification/show! (t :asset/paste-file-copy-failed source-name)
                                 :error
                                 false))))))))

(defn- new-asset-block
  [repo ^js file {:keys [external-url] :as opts}]
  ;; WARN file name maybe fully qualified path when paste file
  (p/let [[file title] (if (map? file) [(:src file) (:title file)] [file nil])
          [file external-url] (if (string? file) [nil file] [file external-url])
          file-name (node-path/basename (or (some-> file (.-name)) (str external-url)))
          file-name-without-ext* (db-asset/asset-name->title file-name)
          file-name-without-ext (if (= file-name-without-ext* "image")
                                  (date/get-date-time-string-2)
                                  file-name-without-ext*)
          checksum (some-> (or file external-url) (assets-handler/get-file-checksum))
          size (or (some-> file (.-size)) 0)
          existing-asset (some->> checksum (db-async/<get-asset-with-checksum repo))]
    (if existing-asset
      (do
        (notification/show! (t :asset/already-exists (:block/title existing-asset) (:block/uuid existing-asset))
                            :warning
                            false)
        nil)
      ;; new asset block
      (let [block-id (or (:block/uuid opts) (ldb/new-block-id))
            ext (when file-name (db-asset/asset-path->type file-name))
            _ (when (string/blank? ext)
                (throw (ex-info "File doesn't have a valid ext."
                                {:file-name file-name})))
            _ (when (some-> file (assets-handler/exceed-limit-size?))
                (notification/show! [:div (t :asset/size-too-large)]
                                    :warning
                                    false)
                (throw (ex-info "Asset size shouldn't be larger than 100M" {:file-name file-name})))]
        (p/do!
         (when file
           (let [file-path (str block-id "." ext)]
             (db-based-write-asset! repo file-path file)))
         {:block/title (or title file-name-without-ext)
          :block/uuid block-id
          :logseq.property.asset/type ext
          :logseq.property.asset/external-url external-url
          :logseq.property.asset/size size
          :logseq.property.asset/checksum checksum
          ;; Use stable class ident in tx payload to avoid leaking numeric eids
          ;; into outliner history ops shared with the worker sync pipeline.
          :block/tags #{:logseq.class/Asset}})))))

(defn db-based-save-assets!
  "Save incoming(pasted) assets to assets directory.

   Returns: asset entities"
  [repo files & {:keys [pdf-area? last-edit-block save-to-page target-block]}]
  (let [state-edit-block (when-not target-block
                           (state/get-edit-block))
        edit-content (when state-edit-block
                       (state/get-edit-content))
        edit-block (when-not target-block
                     (if state-edit-block
                       (assoc state-edit-block :block/title edit-content)
                       last-edit-block))
        has-unsaved-edit? (and state-edit-block
                               (not= (:block/title state-edit-block) edit-content))
        empty-target? (cond
                        target-block false
                        state-edit-block (string/blank? edit-content)
                        last-edit-block (string/blank? (:block/title last-edit-block))
                        :else false)]
    (p/let [[repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
            today-page-name (db-async/<get-today-journal-title repo)
            today-page-e (db-async/<get-journal-page-by-day repo (date/today-journal-day))
            today-page (if (nil? today-page-e)
                         (state/pub-event! [:page/create today-page-name])
                         today-page-e)
            _ (when has-unsaved-edit?
                (editor/save-block-aux! state-edit-block edit-content nil))
            blocks* (p/all
                     (for [^js [idx file] (medley/indexed files)]
                       (new-asset-block repo file
                                        {:repo-dir repo-dir
                                         :asset-dir-rpath asset-dir-rpath
                                         :block/uuid (when (and (zero? idx) empty-target?)
                                                       (:block/uuid edit-block))})))
            blocks (remove nil? blocks*)
            insert-to-current-block-page? (boolean (and (not target-block) (:block/uuid edit-block) (not pdf-area?)))
            target (cond
                     target-block
                     target-block

                     insert-to-current-block-page?
                     edit-block

                     save-to-page
                     save-to-page

                     :else
                     today-page)]
      (when-not target
        (throw (ex-info "invalid target" {:files files
                                          :today-page today-page
                                          :edit-block edit-block})))
      (when (seq blocks)
        (p/do!
         (ui-outliner-tx/transact!
          {:outliner-op :insert-blocks}
          (outliner-op/insert-blocks! blocks target {:keep-uuid? true
                                                     :bottom? true
                                                     :sibling? (boolean (and edit-block (= edit-block target)))
                                                     :replace-empty-target? insert-to-current-block-page?}))
         (p/let [results (db-async/<get-blocks repo (map :block/uuid blocks) {:children? false})
                 blocks (editor/unwrap-block-results results)]
           (when-let [block (some (fn [block] (when (= (:block/uuid block) (:block/uuid edit-block)) block)) blocks)]
             (editor/edit-block! block :max))
           blocks))))))


(defn db-upload-assets!
  "Paste asset for db graph and insert link to current editing block"
  [repo id ^js files format uploading? drop-or-paste?]
  (editor/insert-command!
   id
   ""
   format
   {:last-pattern (if drop-or-paste? "" commands/command-trigger)
    :restore?     true
    :command      :insert-asset})
  (-> (db-based-save-assets! repo (js->clj files))
      (p/catch (fn [e]
                 (js/console.error e)))
      (p/finally
        (fn []
          (reset! uploading? false)
          (reset! editor/*asset-uploading? false)
          (reset! editor/*asset-uploading-process 0)))))

(defn upload-asset!
  "Paste asset and insert link to current editing block"
  [id ^js files format uploading? drop-or-paste?]
  (let [repo (state/get-current-repo)]
    (db-upload-assets! repo id ^js files format uploading? drop-or-paste?)))