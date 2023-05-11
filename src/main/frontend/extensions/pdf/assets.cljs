(ns frontend.extensions.pdf.assets
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.property :as editor-property]
            [frontend.handler.page :as page-handler]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.notification :as notification]
            [frontend.ui :as ui]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.util.page-property :as page-property]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.extensions.pdf.windows :as pdf-windows]
            [logseq.common.path :as path]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [fipp.edn :refer [pprint]]))

(defn inflate-asset
  [original-path]
  (let [filename  (util/node-path.basename original-path)
        web-link? (string/starts-with? original-path "http")
        ext-name  (util/get-file-ext filename)
        url       (assets-handler/normalize-asset-resource-url original-path)
        filekey   (util/safe-sanitize-file-name (subs filename 0 (- (count filename) (inc (count ext-name)))))]
    (when-let [key (and (not (string/blank? filekey))
                        (if web-link?
                          (str filekey "__" (hash url)) filekey))]

      {:key           key
       :identity      (subs key (- (count key) 15))
       :filename      filename
       :url           url
       :hls-file      (str "assets/" key ".edn")
       :original-path original-path})))

(defn resolve-area-image-file
  [img-stamp current {:keys [page id] :as _hl}]
  (when-let [key (:key current)]
    (-> (str gp-config/local-assets-dir "/" key "/")
        (str (util/format "%s_%s_%s.png" page id img-stamp)))))

(defn load-hls-data$
  [{:keys [hls-file]}]
  (when hls-file
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)]
      (p/let [_    (fs/create-if-not-exists repo-cur repo-dir hls-file "{:highlights []}")
              res  (fs/read-file repo-dir hls-file)
              data (if res (reader/read-string res) {})]
        data))))

(defn persist-hls-data$
  [{:keys [hls-file]} highlights extra]
  (when hls-file
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          data     (with-out-str (pprint {:highlights highlights :extra extra}))]
      (fs/write-file! repo-cur repo-dir hls-file data {:skip-compare? true}))))

(defn resolve-hls-data-by-key$
  [target-key]
  ;; TODO: fuzzy match
  (when-let [hls-file (and target-key (str gp-config/local-assets-dir "/" target-key ".edn"))]
    (load-hls-data$ {:hls-file hls-file})))

(defn area-highlight?
  [hl]
  (and hl (not (nil? (get-in hl [:content :image])))))

(defn persist-hl-area-image$
  "Save pdf highlight area image"
  [^js viewer current new-hl old-hl {:keys [top left width height]}]
  (when-let [^js canvas (and (:key current) (.-canvas (.getPageView viewer (dec (:page new-hl)))))]
    (let [^js doc     (.-ownerDocument canvas)
          ^js canvas' (.createElement doc "canvas")
          dpr         js/window.devicePixelRatio
          repo-url    (state/get-current-repo)
          repo-dir    (config/get-repo-dir repo-url)
          dw          (* dpr width)
          dh          (* dpr height)]

      (set! (. canvas' -width) dw)
      (set! (. canvas' -height) dh)

      (when-let [^js ctx (.getContext canvas' "2d" #js{:alpha false})]
        (set! (. ctx -imageSmoothingEnabled) false)
        (.drawImage
         ctx canvas
         (* left dpr) (* top dpr) (* width dpr) (* height dpr)
         0 0 dw dh)

        (let [callback (fn [^js png]
                         ;; write image file
                         (p/catch
                          (p/let [_          (js/console.time :write-area-image)
                                  ^js png    (.arrayBuffer png)
                                  {:keys [key]} current
                                  ;; dir
                                  fstamp     (get-in new-hl [:content :image])
                                  old-fstamp (and old-hl (get-in old-hl [:content :image]))
                                  fname      (str (:page new-hl) "_" (:id new-hl))
                                  fdir       (str gp-config/local-assets-dir "/" key)
                                  _          (fs/mkdir-if-not-exists (path/path-join repo-dir fdir))
                                  new-fpath  (str fdir "/" fname "_" fstamp ".png")
                                  old-fpath  (and old-fstamp (str fdir "/" fname "_" old-fstamp ".png"))
                                  _          (and old-fpath (fs/rename! repo-url old-fpath new-fpath))
                                  _          (fs/write-file! repo-url repo-dir new-fpath png {:skip-compare? true})]

                            (js/console.timeEnd :write-area-image))

                          (fn [err]
                            (js/console.error "[write area image Error]" err))))]

          (.toBlob canvas' callback))
        ))))

(defn update-hl-block!
  [highlight]
  (when-let [block (db-model/get-block-by-uuid (:id highlight))]
    (doseq [[k v] {:hl-stamp (if (area-highlight? highlight)
                               (get-in highlight [:content :image])
                               (js/Date.now))
                   :hl-color (get-in highlight [:properties :color])}]
      (editor-property/set-block-property! (:block/uuid block) k v))))

(defn unlink-hl-area-image$
  [^js _viewer current hl]
  (when-let [fkey (and (area-highlight? hl) (:key current))]
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          fstamp   (get-in hl [:content :image])
          fname    (str (:page hl) "_" (:id hl))
          fdir     (str gp-config/local-assets-dir "/" fkey)
          fpath    (util/node-path.join repo-dir (str fdir "/" fname "_" fstamp ".png"))]

      (fs/unlink! repo-cur fpath {}))))

(defn resolve-ref-page
  [pdf-current]
  (let [page-name (:key pdf-current)
        page-name (string/trim page-name)
        page-name (str "hls__" page-name)
        page      (db-model/get-page page-name)
        file-path (:original-path pdf-current)
        format    (state/get-preferred-format)
        repo-dir  (config/get-repo-dir (state/get-current-repo))
        asset-dir (util/node-path.join repo-dir gp-config/local-assets-dir)
        url       (if (string/includes? file-path asset-dir)
                    (str ".." (last (string/split file-path repo-dir)))
                    file-path)]
    (if-not page
      (let [label (:filename pdf-current)]
        (page-handler/create! page-name {:redirect?        false :create-first-block? false
                                         :split-namespace? false
                                         :format           format
                                         :properties       {:file      (case format
                                                                         :markdown
                                                                         (util/format "[%s](%s)" label url)

                                                                         :org
                                                                         (util/format "[[%s][%s]]" url label)

                                                                         url)
                                                            :file-path url}})
        (db-model/get-page page-name))

      ;; try to update file path
      (page-property/add-property! page-name :file-path url))
    page))

(defn ensure-ref-block!
  ([pdf hl] (ensure-ref-block! pdf hl nil))
  ([pdf-current {:keys [id content page properties]} insert-opts]
   (when-let [ref-page (and pdf-current (resolve-ref-page pdf-current))]
     (let [ref-block (db-model/query-block-by-uuid id)]
       (if-not (nil? (:block/content ref-block))
         (do
           (println "[existed ref block]" ref-block)
           ref-block)
         (let [text       (:text content)
               wrap-props #(if-let [stamp (:image content)]
                             (assoc % :hl-type "area" :hl-stamp stamp) %)]

           (when (string? text)
             (editor-handler/api-insert-new-block!
              text (merge {:page        (:block/name ref-page)
                           :custom-uuid id
                           :properties  (wrap-props
                                         {:ls-type  "annotation"
                                          :hl-page  page
                                          :hl-color (:color properties)
                                          ;; force custom uuid
                                          :id       (str id)})}
                          insert-opts)))))))))

(defn del-ref-block!
  [{:keys [id]}]
  #_:clj-kondo/ignore
  (when-let [repo (state/get-current-repo)]
    (when-let [block (db-model/get-block-by-uuid id)]
      (editor-handler/delete-block-aux! block true))))

(defn copy-hl-ref!
  [highlight ^js viewer]
  (when-let [ref-block (ensure-ref-block! (state/get-current-pdf) highlight)]
    (util/copy-to-clipboard!
     (block-ref/->block-ref (:block/uuid ref-block))
     :owner-window (pdf-windows/resolve-own-window viewer))))

(defn open-block-ref!
  [block]
  (let [id        (:block/uuid block)
        page      (db-utils/pull (:db/id (:block/page block)))
        page-name (:block/original-name page)
        file-path (:file-path (:block/properties page))
        hl-page   (:hl-page (:block/properties block))]
    (when-let [target-key (and page-name (subs page-name 5))]
      (p/let [hls (resolve-hls-data-by-key$ target-key)
              hls (and hls (:highlights hls))]
        (let [file-path (or file-path (str "../assets/" target-key ".pdf"))]
          (if-let [matched (or (and hls (medley/find-first #(= id (:id %)) hls))
                               (and hl-page {:page hl-page}))]
            (do
              (state/set-state! :pdf/ref-highlight matched)
              ;; open pdf viewer
              (state/set-current-pdf! (inflate-asset file-path)))
            (js/console.debug "[Unmatched highlight ref]" block)))))))

(defn goto-block-ref!
  [{:keys [id] :as hl}]
  (when id
    (ensure-ref-block!
     (state/get-current-pdf) hl {:edit-block? false})
    (rfe/push-state :page {:name (str id)})))

(defn goto-annotations-page!
  ([current] (goto-annotations-page! current nil))
  ([current id]
   (when-let [name (:key current)]
     (rfe/push-state :page {:name (str "hls__" name)} (if id {:anchor (str "block-content-" + id)} nil)))))

(defn open-lightbox
  [e]
  (let [images (js/document.querySelectorAll ".hl-area img")
        images (to-array images)
        images (if-not (= (count images) 1)
                 (let [^js image (.closest (.-target e) ".hl-area")
                       image     (. image querySelector "img")]
                   (->> images
                        (sort-by (juxt #(.-y %) #(.-x %)))
                        (split-with (complement #{image}))
                        reverse
                        (apply concat)))
                 images)
        images (for [^js it images] {:src (.-src it)
                                     :w   (.-naturalWidth it)
                                     :h   (.-naturalHeight it)})]

    (when (seq images)
      (lightbox/preview-images! images))))

(rum/defc area-display
  [block]
  (when-let [asset-path' (and block (pdf-utils/get-area-block-asset-url
                                     block (db-utils/pull (:db/id (:block/page block)))))]
    (let [asset-path (editor-handler/make-asset-url asset-path')]
      [:span.hl-area
       [:span.actions
        (when-not config/publishing?
          [:button.asset-action-btn.px-1
           {:title         (t :asset/copy)
            :tabIndex      "-1"
            :on-mouse-down util/stop
            :on-click      (fn [e]
                             (util/stop e)
                             (-> (util/copy-image-to-clipboard (gp-config/remove-asset-protocol asset-path))
                                 (p/then #(notification/show! "Copied!" :success))))}
           (ui/icon "copy")])

        [:button.asset-action-btn.px-1
         {:title         (t :asset/maximize)
          :tabIndex      "-1"
          :on-mouse-down util/stop
          :on-click      open-lightbox}

         (ui/icon "maximize")]]
       [:img {:src asset-path}]])))
