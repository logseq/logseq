(ns frontend.extensions.pdf.assets
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.extensions.pdf.windows :as pdf-windows]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.ref :as ref]
            [logseq.common.config :as common-config]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.publishing.db :as publish-db]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn get-in-repo-assets-full-filename
  [url]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))]
    (if (some-> url (string/trim) (string/includes? repo-dir))
      (some-> (string/split url repo-dir)
              (last)
              (string/replace-first "/assets/" ""))
      url)))

(defn inflate-asset
  [original-path & {:keys [href block]}]
  (let [web-link? (string/starts-with? original-path "http")
        protocol-link? (common-config/protocol-path? href)
        filename (util/node-path.basename original-path)
        ext-name "pdf"
        url (if protocol-link?
              href
              (assets-handler/normalize-asset-resource-url original-path))
        filename' (if protocol-link?
                    filename
                    (some-> url (js/decodeURIComponent)
                            (get-in-repo-assets-full-filename)
                            (string/replace '"/" "_")))
        filekey (gp-exporter/safe-sanitize-file-name
                 (subs filename' 0 (- (count filename') (inc (count ext-name)))))]
    (when-let [key (and (not (string/blank? filekey))
                        (if web-link?
                          (str filekey "__" (hash url))
                          filekey))]
      {:key           key
       :block         block
       :identity      (subs key (- (count key) 15))
       :filename      filename
       :url           url
       :hls-file      (str "assets/" key ".edn")
       :original-path original-path})))

(defn db-based-ensure-ref-block!
  [pdf-current {:keys [id content page properties] :as hl} insert-opts]
  (when-let [pdf-block (:block pdf-current)]
    (let [ref-block (db-model/query-block-by-uuid id)]
      (if (:block/title ref-block)
        (do
          (println "[existed ref block]" ref-block)
          ref-block)
        (let [ref-asset-id (:image content)
              image? (not (nil? ref-asset-id))
              text (if image? (.toLocaleString (js/Date.))
                       (:text content))
              colors (:property/closed-values (db/entity :logseq.property.pdf/hl-color))
              color-id (some (fn [color] (when (= (:block/title color) (:color properties))
                                           (:db/id color))) colors)]
          (when color-id
            (let [properties (cond->
                              {:block/tags #{(:db/id (db/entity :logseq.class/Pdf-annotation))}
                               :block/collapsed? image?
                               :logseq.property/ls-type  :annotation
                               :logseq.property.pdf/hl-color color-id
                               :logseq.property/asset (:db/id pdf-block)
                               :logseq.property.pdf/hl-page  page
                               :logseq.property.pdf/hl-value hl}

                               image?
                               (assoc :logseq.property.pdf/hl-type :area
                                      :logseq.property.pdf/hl-image ref-asset-id))]
              (when (string? text)
                (editor-handler/api-insert-new-block!
                 text (merge {:block-uuid (:block/uuid pdf-block)
                              :sibling? false
                              :custom-uuid id
                              :properties properties}
                             (assoc insert-opts :edit-block? false)))))))))))

(defn ensure-ref-block!
  [pdf-current hl insert-opts]
  (p/let [ref-block (db-based-ensure-ref-block! pdf-current hl insert-opts)
          asset-block (:logseq.property.pdf/hl-image ref-block)]
      ;; try to move the asset block to the ref block
    (p/do!
     (when asset-block
       (editor-handler/move-blocks! [asset-block] ref-block {:sibling? false}))
     ref-block)))

(defn db-based-load-hls-data$
  [{:keys [block]}]
  (p/let [ref-id (:db/id block)
          data (db-async/<q (state/get-current-repo) {:transact-db? false}
                            '[:find (pull ?e [*])
                              :in $ ?ref-id
                              :where [?e :logseq.property/asset ?ref-id]]
                            ref-id)]
    (let [highlights (some->> data (flatten) (map #(:logseq.property.pdf/hl-value %)) (vec))]
      {:highlights highlights})))

(defn area-highlight?
  [hl]
  (and hl (not (nil? (get-in hl [:content :image])))))

(defn- db-based-persist-hl-area-image
  [repo png]
  (let [file (js/File. #js [png] "pdf area highlight.png")]
    (editor-handler/db-based-save-assets! repo [file] {:pdf-area? true})))

(defn- persist-hl-area-image
  [repo-url _repo-dir _current _new-hl _old-hl png]
  (p/let [result (db-based-persist-hl-area-image repo-url png)]
    (first result)))

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

        (js/Promise.
         (fn [resolve reject]
           (.toBlob canvas'
                    (fn [^js png]
                      (p/catch
                       (resolve (persist-hl-area-image repo-url repo-dir current new-hl old-hl png))
                       (fn [err]
                         (reject err)
                         (js/console.error "[write area image Error]" err)))))))))))

(defn update-hl-block!
  [highlight]
  (when-let [block (db-model/get-block-by-uuid (:id highlight))]
    (when-let [color (get-in highlight [:properties :color])]
      (let [k (pu/get-pid :logseq.property.pdf/hl-color)
            color' (let [colors (:property/closed-values (db/entity :logseq.property.pdf/hl-color))]
                     (some (fn [color-block] (when (= (:block/title color-block) color)
                                               (:db/id color-block))) colors))]
        (property-handler/set-block-property! (:block/uuid block) k color')))))

(defn unlink-hl-area-image$
  [^js _viewer current hl]
  (when-let [fkey (and (area-highlight? hl) (:key current))]
    (let [repo-cur (state/get-current-repo)
          repo-dir (config/get-repo-dir repo-cur)
          fstamp   (get-in hl [:content :image])
          fname    (str (:page hl) "_" (:id hl))
          fdir     (str common-config/local-assets-dir "/" fkey)
          fpath    (util/node-path.join repo-dir (str fdir "/" fname "_" fstamp ".png"))]

      (fs/unlink! repo-cur fpath {}))))

(defn del-ref-block!
  [{:keys [id]}]
  (when-let [block (db-model/get-block-by-uuid id)]
    (editor-handler/delete-block-aux! block)))

(defn copy-hl-ref!
  [highlight ^js viewer]
  (p/let [ref-block (ensure-ref-block! (state/get-current-pdf) highlight nil)]
    (when ref-block
      (util/copy-to-clipboard!
       (ref/->block-ref (:block/uuid ref-block))
       :owner-window (pdf-windows/resolve-own-window viewer)))))

(defn- get-zotero-local-pdf-path
  [{:keys [zotero-linked-file zotero-imported-file]}]
  (let [zotero-config (get-in (state/sub-config) [:zotero/settings-v2 "default"])
        zotero-data-directory (:zotero-data-directory zotero-config)
        zotero-linked-attachment-base-directory (:zotero-linked-attachment-base-directory zotero-config)]
    (if zotero-linked-file
      (str zotero-linked-attachment-base-directory "/" zotero-linked-file)
      (str zotero-data-directory "/storage/" zotero-imported-file))))

(defn db-based-open-block-ref!
  [block]
  (let [hl-value (:logseq.property.pdf/hl-value block)
        asset (:logseq.property/asset block)
        external-url (:logseq.property.asset/external-url asset)
        file-path (or external-url (str "../assets/" (:block/uuid asset) ".pdf"))
        file-path (if (string/starts-with? file-path "zotero://")
                    (get-zotero-local-pdf-path (:logseq.property.asset/external-props asset))
                    file-path)]
    (if asset
      (->
       (p/let [href (assets-handler/<make-asset-url file-path)]
         (state/set-state! :pdf/ref-highlight hl-value)
         ;; open pdf viewer
         (state/set-current-pdf! (inflate-asset file-path {:href href :block asset})))
       (p/catch (fn [error]
                  (js/console.error error))))
      (js/console.error "Pdf asset no longer exists"))))

(defn open-block-ref!
  [block]
  (db-based-open-block-ref! block))

(defn goto-block-ref!
  [{:keys [id] :as hl}]
  (when id
    (p/do!
     (ensure-ref-block!
      (state/get-current-pdf) hl {:edit-block? false})
     (rfe/push-state :page {:name (str id)}))))

(defn goto-annotations-page!
  ([current] (goto-annotations-page! current nil))
  ([current id]
   (when current
     (rfe/push-state :page {:name (:block/uuid (:block current))} (if id {:anchor (str "block-content-" + id)} nil)))))

(defn open-lightbox!
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

(rum/defcs area-display <
  (rum/local nil ::src)
  [state block]
  (let [*src (::src state)]
    (when-let [asset-path' (and block (publish-db/get-area-block-asset-url
                                       (conn/get-db (state/get-current-repo))
                                       block
                                       (db-utils/pull (:db/id (:block/page block)))))]
      (when (nil? @*src)
        (p/let [asset-path (assets-handler/<make-asset-url asset-path')]
          (reset! *src asset-path)))
      (when @*src
        (let [asset-block (some-> block (:logseq.property.pdf/hl-image))
              resize-metadata (some-> asset-block :logseq.property.asset/resize-metadata)
              style (when-let [w (:width resize-metadata)] {:style {:width w}})]
          [:div.hl-area style
           [:div.asset-container
            {:style {:width (if style "100%" "auto")}}
            [:span.asset-action-bar
             (when-let [asset-uuid (some-> asset-block (:block/uuid))]
               [:button.asset-action-btn
                {:title (t :asset/ref-block)
                 :tabIndex "-1"
                 :on-pointer-down util/stop
                 :on-click (fn [] (route-handler/redirect-to-page! asset-uuid))}
                (ui/icon "file-symlink")])

             (when-not config/publishing?
               [:button.asset-action-btn
                {:title (t :asset/copy)
                 :tabIndex "-1"
                 :on-pointer-down util/stop
                 :on-click (fn [e]
                             (util/stop e)
                             (-> (util/copy-image-to-clipboard (common-config/remove-asset-protocol @*src))
                                 (p/then #(notification/show! "Copied!" :success))))}
                (ui/icon "copy")])

             [:button.asset-action-btn
              {:title (t :asset/maximize)
               :tabIndex "-1"
               :on-pointer-down util/stop
               :on-click open-lightbox!}

              (ui/icon "maximize")]]
            [:img.w-full {:src @*src}]]])))))
