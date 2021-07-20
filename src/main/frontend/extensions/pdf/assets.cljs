(ns frontend.extensions.pdf.assets
  (:require [rum.core :as rum]
            [frontend.util :as utils]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.components.svg :as svg]
            [promesa.core :as p]
            [clojure.string :as string]
            [cljs-bean.core :as bean]))

(defonce *asset-uploading? (atom false))

(defn inflate-asset
  [filename]
  (when-let [key (and
                   (string/ends-with? filename ".pdf")
                   (string/replace-first filename ".pdf" ""))]
    {:key      key
     :filename filename
     :url      (utils/node-path.join
                 "file://"                                  ;; TODO: bfs
                 (config/get-repo-dir (state/get-current-repo))
                 "assets" filename)

     :hls-file (str "assets/" key ".json")}))

(defn upload-asset!
  [page-block files refresh-file!]
  (let [repo (state/get-current-repo)
        block-uuid (:block/uuid page-block)]

    (when (config/local-db? repo)
      (reset! *asset-uploading? true)
      (-> (editor-handler/save-assets! page-block repo (bean/->clj files))
          (p/then
            (fn [res]
              (when-let [first-item (first res)]
                (let [[file-path file] first-item]
                  (refresh-file! (utils/node-path.basename file-path))))))
          (p/finally
            (fn []
              (reset! *asset-uploading? false))))
      )))

(rum/defc uploader
  [page-name]
  (when-let [page (and page-name (db-model/get-page page-name))]
    (let [page-uuid (:block/uuid page)
          [files, set-files!] (rum/use-state (get-in page [:block/properties :files]))
          files (if (string? files) [files] files)
          refresh-file! (rum/use-callback
                          (fn [file-name]
                            (let [files' (if-not (vector? files)
                                           [file-name]
                                           (conj files file-name))]

                              ;; sync
                              (editor-handler/set-block-property!
                                page-uuid
                                :files files'               ;;(string/join "," files')
                                )

                              (let [props (db-model/get-page-properties page-name)]
                                (set-files! (:files props)))))
                          [files])]

      (let [block-uuid (:block/uuid page)]
        [:div.extensions__pdf-assets-uploader
         (for [file files]
           [:a.ui__button
            {:key file
             :intent   "logseq"
             :on-click (fn []
                         (when-let [current (inflate-asset file)]
                           (state/set-state! :pdf/current current)))}
            svg/external-link
            file])

         [:label.ui__button.is-link
          {:for "upload-page-assets"}

          svg/plus

          [:input.hidden
           {:id     "upload-page-assets"
            :type   "file"
            :accept ".pdf"
            :on-change
                    (fn [e]
                      (let [files (.-files (.-target e))]
                        (upload-asset! page files refresh-file!))
                      )}]]]))))
