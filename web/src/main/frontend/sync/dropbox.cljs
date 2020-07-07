(ns frontend.sync.dropbox
  (:require ["dropbox" :as dropbox]
            [goog.object :as gobj]
            [frontend.sync.protocol :refer [Sync] :as sync]
            [promesa.core :as p]
            [cljs-bean.core :as bean]))

;; Note: there's also a `DropboxTeam`
(defonce DropboxModule (gobj/get dropbox "Dropbox"))

(defonce *dropbox-client (atom nil))

(defn upload-file
  [client path contents]
  (.filesUpload ^Object client
                (bean/->js {:path path
                            :contents contents
                            :mode {".tag" "overwrite"}
                            :autorename true})))

(defrecord Dropbox [token]
  Sync
  (get-client [this]
    (if-let [client @*dropbox-client]
      client
      (let [client (DropboxModule. #js {:accessToken token})]
        (reset! *dropbox-client client)
        client)))
  (signed? [this]
    true)
  (get-dir [this path]
    (p/let [resp (.filesListFolder ^Object (sync/get-client this) (bean/->js {:path path}))]
      (bean/->clj resp)))
  (get-more-dir [this cursor]
    (p/let [resp (.filesListFolderContinue ^Object (sync/get-client this) (bean/->js {:cursor cursor}))]
      (bean/->clj resp)))
  (create-file [this path contents]
    (upload-file ^Object (sync/get-client this) path contents))
  (update-file [this path contents]
    (upload-file ^Object (sync/get-client this) path contents))
  (get-file-contents-and-metadata [this path]
    (->
     (p/let [resp (.filesDownload ^Object (sync/get-client this) (bean/->js {:path path}))
             file-binary (gobj/get resp "fileBinary")
             contents (.toString file-binary)
             last-modified-at (gobj/get resp "server_modified")]
       {:contents contents
        :last-modified-at last-modified-at})
     (p/catch
         (fn [error]
           ;; TODO:
           (println "Dropbox get file " path " failed:")
           (js/console.dir error))
         )))
  (delete-file [this path]
    (.filesDelete ^Object (sync/get-client this) (bean/->js {:path path}))))
