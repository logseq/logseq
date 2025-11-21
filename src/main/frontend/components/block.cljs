(ns frontend.components.block
  (:refer-clojure :exclude [range])
  (:require-macros [hiccups.core])
  (:require ["/frontend/utils" :as utils]
            [cljs-bean.core :as bean]
            [cljs.core.match :refer [match]]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as e]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.components.block.macros :as block-macros]
            [frontend.components.file-based.block :as file-block]
            [frontend.components.icon :as icon-component]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.macro :as macro]
            [frontend.components.plugins :as plugins]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as pv]
            [frontend.components.query :as query]
            [frontend.components.query.builder :as query-builder-component]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.file-based.model :as file-model]
            [frontend.db.model :as model]
            [frontend.extensions.highlight :as highlight]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.extensions.sci :as sci]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.extensions.zotero :as zotero]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export.common :as export-common-handler]
            [frontend.handler.file-based.editor :as file-editor-handler]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.handler.file-sync :as file-sync]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.file :as property-file]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.haptics :as haptics]
            [frontend.mobile.intent :as mobile-intent]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.security :as security]
            [frontend.state :as state]
            [frontend.template :as template]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.file-based.clock :as clock]
            [frontend.util.file-based.drawer :as drawer]
            [frontend.util.ref :as ref]
            [frontend.util.text :as text-util]
            [goog.dom :as gdom]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.macro :as macro-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [shadow.loader :as loader]))

;; local state
(defonce *dragging?
  (atom false))
(defonce *dragging-block
  (atom nil))
(defonce *dragging-over-block
  (atom nil))
(defonce *drag-to-block
  (atom nil))
(def *move-to (atom nil))

;; TODO: dynamic
(defonce max-depth-of-links 5)

;; TODO:
;; add `key`

(defn- remove-nils
  [col]
  (remove nil? col))

(defn vec-cat
  [& args]
  (->> (apply concat args)
       remove-nils
       vec))

(defn ->elem
  ([elem items]
   (->elem elem nil items))
  ([elem attrs items]
   (let [elem (keyword elem)]
     (if attrs
       (vec
        (cons elem
              (cons attrs
                    (seq items))))
       (vec
        (cons elem
              (seq items)))))))

(defn- join-lines
  [l]
  (string/trim (apply str l)))

(defn- string-of-url
  [url]
  (match url
         ["File" s]
         (-> (string/replace s "file://" "")
             ;; "file:/Users/ll/Downloads/test.pdf" is a normal org file link
             (string/replace "file:" ""))

         ["Complex" m]
         (let [{:keys [link protocol]} m]
           (if (= protocol "file")
             link
             (str protocol "://" link)))))

(defn- get-file-absolute-path
  [config path]
  (let [path (string/replace path "file:" "")
        block-id (:block/uuid config)
        current-file (and block-id
                          (:file/path (:block/file (:block/page (db/entity [:block/uuid block-id])))))]
    (when current-file
      (let [parts (string/split current-file #"/")
            parts-2 (string/split path #"/")
            current-dir (util/string-join-path (drop-last 1 parts))]
        (cond
          (if util/win32? (utils/win32 path) (util/starts-with? path "/"))
          path

          (and (not (util/starts-with? path ".."))
               (not (util/starts-with? path ".")))
          (str current-dir "/" path)

          :else
          (let [parts (loop [acc []
                             parts (reverse parts)
                             col (reverse parts-2)]
                        (if (empty? col)
                          acc
                          (let [[part parts] (case (first col)
                                               ".."
                                               [(first parts) (rest parts)]
                                               "."
                                               ["" parts]
                                               [(first col) (rest parts)])]
                            (recur (conj acc part)
                                   parts
                                   (rest col)))))
                parts (remove #(string/blank? %) parts)]
            (util/string-join-path (reverse parts))))))))

(rum/defcs file-based-asset-loader
  < rum/reactive
    (rum/local nil ::exist?)
    (rum/local false ::loading?)
    {:will-mount (fn [state]
                   (let [src (first (:rum/args state))]
                     (if (and (common-config/local-protocol-asset? src)
                              (file-sync/current-graph-sync-on?))
                       (let [*exist? (::exist? state)
                             ;; special handling for asset:// protocol
                             ;; Capacitor uses a special URL for assets loading
                             asset-path (common-config/remove-asset-protocol src)
                             asset-path (fs/asset-path-normalize asset-path)]
                         (if (string/blank? asset-path)
                           (reset! *exist? false)
                           ;; FIXME(andelf): possible bug here
                           (p/let [exist? (fs/asset-href-exists? asset-path)]
                             (reset! *exist? (boolean exist?))))
                         (assoc state ::asset-path asset-path ::asset-file? true))
                       state)))
     :will-update (fn [state]
                    (let [src (first (:rum/args state))
                          asset-file? (boolean (::asset-file? state))
                          sync-on? (file-sync/current-graph-sync-on?)
                          *loading? (::loading? state)
                          *exist? (::exist? state)]
                      (when (and sync-on? asset-file? (false? @*exist?))
                        (let [sync-state (state/get-file-sync-state (state/get-current-file-sync-graph-uuid))
                              downloading-files (:current-remote->local-files sync-state)
                              contain-url? (and (seq downloading-files)
                                                (some #(string/ends-with? src %) downloading-files))]
                          (cond
                            (and (not @*loading?) contain-url?)
                            (reset! *loading? true)

                            (and @*loading? (not contain-url?))
                            (do
                              (reset! *exist? true)
                              (reset! *loading? false))))))
                    state)}
  [state src content-fn]
  (let [_ (state/sub-file-sync-state (state/get-current-file-sync-graph-uuid))
        exist? @(::exist? state)
        loading? @(::loading? state)
        asset-file? (::asset-file? state)
        sync-enabled? (boolean (file-sync/current-graph-sync-on?))
        ext (keyword (util/get-file-ext src))
        img? (contains? (common-config/img-formats) ext)
        audio? (contains? config/audio-formats ext)
        type (cond img? "image"
                   audio? "audio"
                   :else "asset")]
    (if (not sync-enabled?)
      (content-fn)
      (if (and asset-file? (or loading? (nil? exist?)))
        [:p.text-sm.opacity-50 (ui/loading (util/format "Syncing %s ..." type))]
        (if (or (not asset-file?)
                (and exist? (not loading?)))
          (content-fn)
          [:p.text-error.text-xs [:small.opacity-80
                                  (util/format "%s not found!" (string/capitalize type))]])))))

(defn open-lightbox!
  [e]
  (let [images (js/document.querySelectorAll ".asset-container img")
        images (to-array images)
        images (if-not (= (count images) 1)
                 (let [^js image (.closest (.-target e) ".asset-container")
                       image (. image querySelector "img")]
                   (->> images
                        (sort-by (juxt #(.-y %) #(.-x %)))
                        (split-with (complement #{image}))
                        reverse
                        (apply concat)))
                 images)
        images (for [^js it images] {:src (.-src it)
                                     :w (.-naturalWidth it)
                                     :h (.-naturalHeight it)})]

    (when (seq images)
      (lightbox/preview-images! images))))

(rum/defc resize-image-handles
  [dx-fn]
  (let [handle-props {}
        add-resizing-class! #(dom/add-class! js/document.documentElement "is-resizing-buf")
        remove-resizing-class! #(dom/remove-class! js/document.documentElement "is-resizing-buf")
        *handle-left (hooks/use-ref nil)
        *handle-right (hooks/use-ref nil)]

    (hooks/use-effect!
     (fn []
       (doseq [el [(hooks/deref *handle-left)
                   (hooks/deref *handle-right)]]
         (-> (js/interact el)
             (.draggable
              (bean/->js
               {:listeners
                {:start (fn [e] (dx-fn :start e))
                 :move (fn [e] (dx-fn :move e))
                 :end (fn [e] (dx-fn :end e))}}))
             (.styleCursor false)
             (.on "dragstart" add-resizing-class!)
             (.on "dragend" remove-resizing-class!))))
     [])

    [:<>
     [:span.handle-left.image-resize (assoc handle-props :ref *handle-left)]
     [:span.handle-right.image-resize (assoc handle-props :ref *handle-right)]]))

(defn measure-image! [url on-dimensions]
  (let [img (js/Image.)]
    (set! (.-onload img)
          (fn []
            (on-dimensions (.-naturalWidth img) (.-naturalHeight img))))
    (set! (.-src img) url)))

(defonce *resizing-image? (atom false))
(rum/defc ^:large-vars/cleanup-todo asset-container
  [asset-block src title metadata {:keys [breadcrumb? positioned? local? full-text]}]
  (let [asset-width (:logseq.property.asset/width asset-block)
        asset-height (:logseq.property.asset/height asset-block)]
    (hooks/use-effect!
     (fn []
       (when-not (or asset-width asset-height)
         (measure-image!
          src
          (fn [width height]
            (when (nil? (:logseq.property.asset/width asset-block))
              (property-handler/set-block-properties! (state/get-current-repo)
                                                      (:block/uuid asset-block)
                                                      {:logseq.property.asset/width width
                                                       :logseq.property.asset/height height})))))
       (fn []))
     [])
    (let [*el-ref (rum/use-ref nil)
          image-src (fs/asset-path-normalize src)
          src' (if (or (string/starts-with? src "/")
                       (string/starts-with? src "~"))
                 (str "file://" src)
                 src)
          get-blockid #(some-> (rum/deref *el-ref) (.closest "[blockid]") (.getAttribute "blockid") (uuid))]
      [:div.asset-container
       {:key "resize-asset-container"
        :on-pointer-down util/stop
        :on-click (fn [e]
                    (util/stop e)
                    (when (= "IMG" (some-> (.-target e) (.-nodeName)))
                      (open-lightbox! e)))
        :ref *el-ref}
       [:img.rounded-sm.relative.fade-in.fade-in-faster
        (merge
         {:loading "lazy"
          :referrerPolicy "no-referrer"
          :src src'
          :title title}
         metadata)]
       (when (and (not breadcrumb?)
                  (not positioned?))
         [:<>
          (let [handle-copy!
                (fn [_e]
                  (-> (util/copy-image-to-clipboard image-src)
                      (p/then #(notification/show! "Copied!" :success))))
                handle-delete!
                (fn [_e]
                  (when-let [block-id (get-blockid)]
                    (let [*local-selected? (atom local?)]
                      (-> (shui/dialog-confirm!
                           [:div.text-xs.opacity-60.-my-2
                            (when (and local? (not= (:block/uuid asset-block) block-id))
                              [:label.flex.gap-1.items-center
                               (shui/checkbox
                                {:default-checked @*local-selected?
                                 :on-checked-change #(reset! *local-selected? %)})
                               (t :asset/physical-delete)])]
                           {:title (t :asset/confirm-delete (.toLocaleLowerCase (t :text/image)))
                            :outside-cancel? true})
                          (p/then (fn []
                                    (shui/dialog-close!)
                                    (editor-handler/delete-asset-of-block!
                                     {:block-id block-id
                                      :asset-block asset-block
                                      :local? local?
                                      :delete-local? @*local-selected?
                                      :repo (state/get-current-repo)
                                      :href src
                                      :title title
                                      :full-text full-text})))))))]
            [:.asset-action-bar {:aria-hidden "true"}
             (shui/button-group
              (shui/button
               {:variant :outline
                :size :icon
                :class "h-7 w-7"
                :on-pointer-down util/stop
                :on-click (fn [e]
                            (shui/popup-show! (.closest (.-target e) ".asset-action-bar")
                                              (fn []
                                                [:div
                                                 {:on-click #(shui/popup-hide!)}
                                                 (shui/dropdown-menu-item
                                                  {:on-click #(some-> (db/entity [:block/uuid (get-blockid)])
                                                                      (editor-handler/edit-block! :max {:container-id :unknown-container}))}
                                                  [:span.flex.items-center.gap-1
                                                   (ui/icon "edit") (t :asset/edit-block)])
                                                 (shui/dropdown-menu-item
                                                  {:on-click handle-copy!}
                                                  [:span.flex.items-center.gap-1
                                                   (ui/icon "copy") (t :asset/copy)])
                                                 (when (util/electron?)
                                                   (shui/dropdown-menu-item
                                                    {:on-click (fn [e]
                                                                 (util/stop e)
                                                                 (if local?
                                                                   (ipc/ipc "openFileInFolder" image-src)
                                                                   (js/window.apis.openExternal image-src)))}
                                                    [:span.flex.items-center.gap-1
                                                     (ui/icon "folder-pin") (t (if local? :asset/show-in-folder :asset/open-in-browser))]))

                                                 (when-not config/publishing?
                                                   [:<>
                                                    (shui/dropdown-menu-separator)
                                                    (shui/dropdown-menu-item
                                                     {:on-click handle-delete!}
                                                     [:span.flex.items-center.gap-1.text-red-700
                                                      (ui/icon "trash") (t :asset/delete)])])])
                                              {:align :start
                                               :dropdown-menu? true}))}
               (shui/tabler-icon "dots-vertical")))])])])))

(rum/defcs ^:large-vars/cleanup-todo resizable-image <
  (rum/local nil ::size)
  {:will-unmount (fn [state]
                   (reset! *resizing-image? false)
                   state)}
  [state config title src metadata full-text local?]
  (let [breadcrumb? (:breadcrumb? config)
        positioned? (:property-position config)
        asset-block (:asset-block config)
        width (:width metadata)
        *width (get state ::size)
        width (or @*width width)
        metadata' (assoc metadata :width width)
        resizable? (and (not (mobile-util/native-platform?))
                        (not breadcrumb?)
                        (not positioned?))
        asset-container-cp (asset-container asset-block src title metadata'
                                            {:breadcrumb? breadcrumb?
                                             :positioned? positioned?
                                             :local? local?
                                             :full-text full-text})]
    (if (or (:disable-resize? config)
            (:table-view? config)
            (not resizable?))
      asset-container-cp
      [:div.ls-resize-image.rounded-md
       asset-container-cp
       (resize-image-handles
        (fn [k ^js event]
          (let [dx (.-dx event)
                ^js target (.-target event)]

            (case k
              :start
              (let [c (.closest target ".ls-resize-image")]
                (reset! *width (.-offsetWidth c))
                (reset! *resizing-image? true))
              :move
              (let [width' (+ @*width dx)]
                (when (or (> width' 60)
                          (not (neg? dx)))
                  (reset! *width width')))
              :end
              (let [width' @*width]
                (when (and width' @*resizing-image?)
                  (when-let [block-id (or (:block/uuid config)
                                          (some-> config :block (:block/uuid)))]
                    (editor-handler/resize-image! config block-id metadata full-text {:width width'})))
                (reset! *resizing-image? false))))))])))

(rum/defc audio-cp
  ([src] (audio-cp src nil))
  ([src ext]
   ;; Change protocol to allow media fragment uris to play
   (let [src (string/replace-first src common-config/asset-protocol "file://")
         opts {:controls true
               :on-touch-start #(util/stop %)}]
     (case ext
       :m4a [:audio opts [:source {:src src :type "audio/mp4"}]]
       [:audio (assoc opts :src src)]))))

(defn- open-pdf-file
  [e block href]
  (when-let [s (or href (some-> (.-target e) (.-dataset) (.-href)))]
    (let [load$ (fn []
                  (p/let [href (or href
                                   (if (or (mobile-util/native-platform?) (util/electron?))
                                     s
                                     (assets-handler/<make-asset-url s)))]
                    (when-let [current (pdf-assets/inflate-asset s {:block block
                                                                    :href href})]
                      (state/set-current-pdf! current)
                      (util/stop e))))]
      (-> (load$)
          (p/catch
           (fn [^js _e]
             ;; load pdf asset to indexed db
             (p/let [[handle] (js/window.showOpenFilePicker
                               (bean/->js {:multiple false :startIn "documents" :types [{:accept {"application/pdf" [".pdf"]}}]}))
                     file (.getFile handle)
                     buffer (.arrayBuffer file)]
               (when-let [content (some-> buffer (js/Uint8Array.))]
                 (let [repo (state/get-current-repo)
                       file-rpath (string/replace s #"^[.\/\\]*assets[\/\\]+" "assets/")
                       dir (config/get-repo-dir repo)]
                   (-> (fs/write-plain-text-file! repo dir file-rpath content nil)
                       (p/then load$)))))
             (js/console.error _e)))))))

(rum/defcs asset-link < rum/reactive
                        (rum/local nil ::src)
  [state config title href metadata full_text]
  (let [src (::src state)
        ^js js-url (:link-js-url config)
        repo (state/get-current-repo)
        href (cond-> href
                     (nil? js-url)
                     (config/get-local-asset-absolute-path))
        db-based? (config/db-based-graph? repo)]

    (when (nil? @src)
      (p/then (assets-handler/<make-asset-url href js-url)
              #(reset! src (common-util/safe-decode-uri-component %))))
    (:image-placeholder config)
    (if-not @src
      (:image-placeholder config)
      (let [ext (keyword (or (util/get-file-ext @src)
                             (util/get-file-ext href)))
            repo (state/get-current-repo)
            repo-dir (config/get-repo-dir repo)
            path (str repo-dir href)
            share-fn (fn [event]
                       (util/stop event)
                       (when (mobile-util/native-platform?)
                         ;; File URL must be legal, so filename muse be URI-encoded
                         ;; incoming href format: "/assets/whatever.ext"
                         (let [[rel-dir basename] (util/get-dir-and-basename href)
                               rel-dir (string/replace rel-dir #"^/+" "")
                               asset-url (path/path-join repo-dir rel-dir basename)]
                           (mobile-intent/open-or-share-file asset-url))))]

        (cond
          (or (contains? config/audio-formats ext)
              (and (= ext :webm) (string/starts-with? title "Audio-")))
          (if db-based?
            (audio-cp @src ext)
            (file-based-asset-loader @src #(audio-cp @src)))

          (contains? config/video-formats ext)
          [:video {:src @src
                   :controls true}]

          (contains? (common-config/img-formats) ext)
          (if db-based?
            (resizable-image config title @src metadata full_text true)
            (file-based-asset-loader @src
                                     #(resizable-image config title @src metadata full_text true)))

          (and (not db-based?) (contains? (common-config/text-formats) ext))
          [:a.asset-ref.is-plaintext {:href (rfe/href :file {:path path})
                                      :on-click (fn [_event]
                                                  (p/let [result (fs/read-file repo-dir path)]
                                                    (db/set-file-content! repo path result)))}
           title]

          (= ext :pdf)
          [:a.asset-ref.is-pdf
           {:data-href href
            :data-url @src
            :draggable true
            :on-drag-start #(.setData (gobj/get % "dataTransfer") "file" href)
            :on-click (fn [e]
                        (util/stop e)
                        (open-pdf-file e (:asset-block config) @src))}
           (if db-based?
             title
             [:span [:span.opacity-70 "[[📚"] title [:span.opacity-70 "]]"]])]

          (util/mobile?)
          [:a.asset-ref {:href @src
                         :on-click share-fn}
           title]

          (and db-based? util/web-platform?)
          (let [file-name (str (:block/title (:asset-block config)) "." (name ext))]
            [:a.asset-ref
             {:href @src
              :download file-name}
             file-name])

          (and (util/electron?) (:asset-block config))
          (let [asset-block (:asset-block config)
                file-name (if db-based?
                            (str (:block/title asset-block) "." (name ext))
                            href)]
            [:a.asset-ref
             {:on-click (fn [e]
                          (util/stop e)
                          (let [repo-dir (config/get-repo-dir repo)
                                file-fpath (path/path-join repo-dir (str "assets/" (:block/uuid asset-block) "." (name ext)))]
                            (js/window.apis.openPath file-fpath)))}
             file-name])

          :else
          title)))))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [config url href label metadata full_text]
  (let [metadata (if (string/blank? metadata)
                   nil
                   (common-util/safe-read-map-string metadata))
        title (second (first label))
        repo (state/get-current-repo)]
    (ui/catch-error
     [:span.warning full_text]
     (if (and (common-config/local-relative-asset? href)
              (or (config/local-file-based-graph? repo)
                  (config/db-based-graph? repo)))
       (asset-link config title href metadata full_text)
       (let [href (cond
                    (util/starts-with? href "http")
                    href

                    (or (util/starts-with? href "/") (util/starts-with? href "~"))
                    href

                    config/publishing?
                    (subs href 1)

                    (= "Embed_data" (first url))
                    href

                    :else
                    (if (assets-handler/check-alias-path? href)
                      (assets-handler/normalize-asset-resource-url href)
                      (get-file-absolute-path config href)))]
         (resizable-image config title href metadata full_text false))))))

(def timestamp-to-string export-common-handler/timestamp-to-string)

(defn timestamp [{:keys [active _date _time _repetition _wday] :as t} kind]
  (let [prefix (case kind
                 "Scheduled"
                 [:i {:class "fa fa-calendar"
                      :style {:margin-right 3.5}}]
                 "Deadline"
                 [:i {:class "fa fa-calendar-times-o"
                      :style {:margin-right 3.5}}]
                 "Date"
                 nil
                 "Closed"
                 nil
                 "Started"
                 [:i {:class "fa fa-clock-o"
                      :style {:margin-right 3.5}}]
                 "Start"
                 "From: "
                 "Stop"
                 "To: "
                 nil)
        class (when (= kind "Closed")
                "line-through")]
    [:span.timestamp (cond-> {:active (str active)}
                             class
                             (assoc :class class))
     prefix (timestamp-to-string t)]))

(defn range [{:keys [start stop]} stopped?]
  [:div {:class "timestamp-range"
         :stopped stopped?}
   (timestamp start "Start")
   (timestamp stop "Stop")])

(declare map-inline)
(declare markup-element-cp)
(declare markup-elements-cp)

(declare page-reference)

(defn <open-page-ref
  [config page-entity e page-name contents-page?]
  (when (not (util/right-click? e))
    (p/let [ignore-alias? (:ignore-alias? config)
            source-page (and (not ignore-alias?)
                             (or (first (:block/_alias page-entity))
                                 (db-async/<get-block-source (state/get-current-repo) (:db/id page-entity))))
            page (or source-page page-entity)]
      (cond
        (gobj/get e "shiftKey")
        (when page
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :page))

        (and (util/meta-key? e) (whiteboard-handler/inside-portal? (.-target e)))
        (whiteboard-handler/add-new-block-portal-shape!
         page-name
         (whiteboard-handler/closest-shape (.-target e)))

        (nil? page)
        (state/pub-event! [:page/create page-name])

        (and (fn? (:on-pointer-down config))
             (not (or (= (.-button e) 1) (.-metaKey e) (.-ctrlKey e))))
        ((:on-pointer-down config) e)

        :else
        (let [f (or (:on-redirect-to-page config) route-handler/redirect-to-page!)]
          (when-not (and (util/mobile?) @block-handler/*swiped?)
            (f (or (:block/uuid page) (:block/name page))
               {:ignore-alias? ignore-alias?}))))))
  (when (and contents-page?
             (util/mobile?)
             (state/get-left-sidebar-open?))
    (ui-handler/close-left-sidebar!)))

(declare block-title)

(rum/defcs ^:large-vars/cleanup-todo page-inner <
  (rum/local false ::mouse-down?)
  "The inner div of page reference component

   page-name-in-block is the overridable name of the page (legacy)

   All page-names are sanitized except page-name-in-block"
  [state
   {:keys [contents-page? whiteboard-page? other-position?
           on-context-menu stop-event-propagation? with-tags? show-unique-title?]
    :or {with-tags? true
         show-unique-title? true}
    :as config}
   page-entity children label]
  (let [*mouse-down? (::mouse-down? state)
        tag? (:tag? config)
        page-name (when (:block/title page-entity)
                    (util/page-name-sanity-lc (:block/title page-entity)))
        config (assoc config :whiteboard-page? whiteboard-page?)
        untitled? (when page-name
                    (or (model/untitled-page? (:block/title page-entity))
                        (and (ldb/page? page-entity) (string/blank? (:block/title page-entity)))))
        show-icon? (:show-icon? config)]
    [:a.relative
     (cond->
      {:tabIndex "0"
       :class (cond->
               (if tag? "tag" "page-ref")
               (:property? config) (str " page-property-key block-property")
               untitled? (str " opacity-50"))
       :data-ref page-name
       :draggable true
       :on-drag-start (fn [e]
                        (editor-handler/block->data-transfer! page-name e true))
       :on-pointer-down (fn [^js e]
                          (when stop-event-propagation?
                            (util/stop-propagation e))
                          (cond
                            (util/link? (.-target e))
                            nil

                            (and on-context-menu (= 2 (.-button e)))
                            nil

                            (and other-position? (util/meta-key? e))
                            (reset! *mouse-down? true)

                            (and other-position? (not (util/shift-key? e)))
                            (some-> (.-target e) (.closest ".jtrigger") (.click))

                            :else
                            (do
                              (.preventDefault e)
                              (reset! *mouse-down? true))))
       :on-pointer-up (fn [e]
                        (when @*mouse-down?
                          (state/clear-edit!)
                          (when-not (:disable-click? config)
                            (<open-page-ref config page-entity e page-name contents-page?))
                          (reset! *mouse-down? false)))
       :on-key-up (fn [e] (when (and e (= (.-key e) "Enter") (not other-position?))
                            (util/stop e)
                            (state/clear-edit!)
                            (<open-page-ref config page-entity e page-name contents-page?)))}
      on-context-menu
      (assoc :on-context-menu on-context-menu))
     (when (and show-icon? (not tag?))
       (let [own-icon (get page-entity (pu/get-pid :logseq.property/icon))
             emoji? (and (map? own-icon) (= (:type own-icon) :emoji))]
         (when-let [icon (icon-component/get-node-icon-cp page-entity {:color? true
                                                                       :not-text-or-page? true})]
           [:span {:class (str "icon-emoji-wrap " (when emoji? "as-emoji"))}
            icon])))

     [:span
      (if (and (coll? children) (seq children))
        (for [child children]
          (if (= (first child) "Label")
            (last child)
            (let [{:keys [content children]} (last child)
                  page-name (subs content 2 (- (count content) 2))]
              (rum/with-key (page-reference (assoc config :children children) page-name nil) page-name))))
        (cond
          (and label
               (string? label)
               (not (string/blank? label)))                 ; alias
          label

          (coll? label)
          (->elem :span (map-inline config label))

          (ldb/page? page-entity)
          (if untitled?
            (t :untitled)
            (let [s (util/trim-safe (if show-unique-title?
                                      (block-handler/block-unique-title page-entity {:with-tags? with-tags?})
                                      (:block/title page-entity)))]
              (if (and tag? (not (:hide-tag-symbol? config)))
                (str "#" s)
                s)))

          :else
          (block-title (assoc config :page-ref? true) page-entity {})))]]))

(rum/defc popup-preview-impl
  [children {:keys [*timer *timer1 visible? set-visible! render *el-popup]}]
  (let [*el-trigger (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (when (true? visible?)
         (shui/popup-show!
          (hooks/deref *el-trigger) render
          {:root-props {:onOpenChange (fn [v] (set-visible! v))
                        :modal false}
           :content-props {:class "ls-preview-popup"
                           :onInteractOutside (fn [^js e] (.preventDefault e))
                           :onEscapeKeyDown (fn [^js e]
                                              (when (state/editing?)
                                                (.preventDefault e)
                                                (some-> (hooks/deref *el-popup) (.focus))))}
           :as-dropdown? false}))

       ;; teardown
       (fn []
         (when visible?
           (shui/popup-hide!))))
     [visible?])

    [:span.preview-ref-link
     {:ref *el-trigger
      :on-mouse-move (fn [^js e]
                       (when (= (some-> (.-target e) (.closest ".preview-ref-link"))
                                (hooks/deref *el-trigger))
                         (let [timer (hooks/deref *timer)
                               timer1 (hooks/deref *timer1)]
                           (when-not timer
                             (hooks/set-ref! *timer
                                             (js/setTimeout #(set-visible! true) 1000)))
                           (when timer1
                             (js/clearTimeout timer1)
                             (hooks/set-ref! *timer1 nil)))))
      :on-mouse-leave (fn []
                        (let [timer (hooks/deref *timer)
                              timer1 (hooks/deref *timer1)]
                          (when (or (number? timer) (number? timer1))
                            (when timer
                              (js/clearTimeout timer)
                              (hooks/set-ref! *timer nil))
                            (when-not timer1
                              (hooks/set-ref! *timer1
                                              (js/setTimeout #(set-visible! false) 300))))))}
     children]))

(rum/defc page-preview-trigger
  [{:keys [children sidebar? open? manual?] :as config} page-entity]
  (let [*timer (hooks/use-ref nil)                          ;; show
        *timer1 (hooks/use-ref nil)                         ;; hide
        *el-popup (hooks/use-ref nil)
        *el-wrap (hooks/use-ref nil)
        [in-popup? set-in-popup!] (rum/use-state nil)
        [visible? set-visible!] (rum/use-state nil)
        ;; set-visible! (fn debug-visible [v] (js/console.warn "debug: visible" v) (set-visible! v))
        _  #_:clj-kondo/ignore (rum/defc preview-render []
                                 (let [[ready? set-ready!] (rum/use-state false)]

                                   (hooks/use-effect!
                                    (fn []
                                      (let [el-popup (hooks/deref *el-popup)
                                            focus! #(js/setTimeout (fn [] (.focus el-popup)))]
                                        (set-ready! true)
                                        (focus!)
                                        (fn [] (set-visible! false))))
                                    [])

                                   (when-let [source (or (db/get-alias-source-page (state/get-current-repo) (:db/id page-entity))
                                                         page-entity)]
                                     [:div.tippy-wrapper.as-page
                                      {:ref *el-popup
                                       :tab-index -1
                                       :style {:width 600
                                               :text-align "left"
                                               :font-weight 500
                                               :padding-bottom 64}
                                       :on-mouse-enter (fn []
                                                         (when-let [timer1 (hooks/deref *timer1)]
                                                           (js/clearTimeout timer1)))
                                       :on-mouse-leave (fn []
                                                         ;; check the top popup whether is the preview popup
                                                         (when (ui/last-shui-preview-popup?)
                                                           (hooks/set-ref! *timer1
                                                                           (js/setTimeout #(set-visible! false) 500))))}
                                      (when-let [page-cp (and ready? (state/get-page-blocks-cp))]
                                        (page-cp {:repo (state/get-current-repo)
                                                  :page-name (str (:block/uuid source))
                                                  :sidebar? sidebar?
                                                  :scroll-container (some-> (hooks/deref *el-popup) (.closest ".ls-preview-popup"))
                                                  :preview? true}))])))]

    (hooks/use-effect!
     (fn []
       (if (some-> (hooks/deref *el-wrap) (.closest "[data-radix-popper-content-wrapper]"))
         (set-in-popup! true)
         (set-in-popup! false)))
     [])

    [:span {:ref *el-wrap}
     (if (boolean? in-popup?)
       (if (and (not (:preview? config))
                (not in-popup?)
                (or (not manual?) open?))
         (popup-preview-impl children
                             {:visible? visible? :set-visible! set-visible!
                              :*timer *timer :*timer1 *timer1
                              :render preview-render :*el-popup *el-popup})
         children)
       children)]))

(declare block-reference)
(declare block-reference-preview)

(rum/defc invalid-node-ref
  [id]
  [:span.warning.mr-1 {:title "Node ref invalid"}
   (ref/->block-ref (str id))])

(defn inline-text
  ([format v]
   (inline-text {} format v))
  ([config format v]
   (when (string? v)
     (let [inline-list (gp-mldoc/inline->edn v (mldoc/get-default-config format))]
       [:div.inline.mr-1 (map-inline config inline-list)]))))

(defn- <get-block
  [block-id]
  (db-async/<get-block (state/get-current-repo) block-id
                       {:children? false
                        :skip-refresh? true}))

(rum/defcs page-cp-inner < db-mixins/query rum/reactive
                           {:init (fn [state]
                                    (let [args (:rum/args state)
                                          [config page] args
                                          *result (atom nil)
                                          page-id-or-name (or (:db/id page)
                                                              (:block/uuid page)
                                                              (when-let [s (:block/name page)]
                                                                (string/trim s)))
                                          page-entity (if (e/entity? page) page (db/get-page page-id-or-name))]
                                      (cond
                                        page-entity
                                        (reset! *result page-entity)
                                        (or (:skip-async-load? config) (:table-view? config))
                                        (reset! *result page)
                                        :else
                                        (p/let [result (<get-block page-id-or-name)]
                                          (reset! *result result)))

                                      (assoc state :*entity *result)))}
                           "Component for a page. `page` argument contains :block/name which can be (un)sanitized page name.
                            Keys for `config`:
                            - `:preview?`: Is this component under preview mode? (If true, `page-preview-trigger` won't be registered to this `page-cp`)"
  [state {:keys [label children preview? disable-preview? show-non-exists-page? tag? _skip-async-load?] :as config} page]
  (let [entity' (rum/react (:*entity state))
        entity (or (db/sub-block (:db/id entity')) entity')
        config (assoc config :block entity)]
    (cond
      entity
      (let [page-name (some-> (:block/title entity) util/page-name-sanity-lc)
            whiteboard-page? (model/whiteboard-page? entity)
            inner (page-inner (assoc config :whiteboard-page? whiteboard-page?) entity children label)
            modal? (shui-dialog/has-modal?)]
        (if (and (not (util/mobile?))
                 (not= page-name (:id config))
                 (not (false? preview?))
                 (not disable-preview?)
                 (not modal?))
          (page-preview-trigger (assoc config :children inner) entity)
          inner))

      (and (:block/name page) show-non-exists-page?)
      (page-inner config (merge
                          {:block/title (or (:block/title page)
                                            (:block/name page))
                           :block/name (:block/name page)}
                          page) children label)

      (:block/name page)
      [:span
       (when tag? "#")
       (when-not tag?
         [:span.text-gray-500.bracket page-ref/left-brackets])
       (or label (:block/name page))
       (when-not tag?
         [:span.text-gray-500.bracket page-ref/right-brackets])]

      :else
      nil)))

(rum/defc page-cp
  [config page]
  (let [id (or (:db/id page) (:block/uuid page) (:block/name page))]
    (rum/with-key (page-cp-inner config page)
                  (str id))))

(rum/defc asset-reference
  [config title path]
  (let [repo (state/get-current-repo)
        real-path-url (cond
                        (common-util/url? path)
                        path

                        (path/absolute? path)
                        path

                        :else
                        (assets-handler/resolve-asset-real-path-url repo path))
        ext-name (util/get-file-ext path)
        title-or-path (cond
                        (string? title)
                        title
                        (seq title)
                        (->elem :span (map-inline config title))
                        :else
                        path)]
    [:div.asset-ref-wrap
     {:data-ext ext-name}

     (cond
       ;; https://en.wikipedia.org/wiki/HTML5_video
       (contains? config/video-formats (keyword ext-name))
       [:video {:src real-path-url
                :controls true}]

       :else
       [:a.asset-ref {:target "_blank" :href real-path-url}
        title-or-path])]))

(defonce excalidraw-loaded? (atom false))
(rum/defc excalidraw < rum/reactive
                       {:init (fn [state]
                                (p/let [_ (loader/load :excalidraw)]
                                  (reset! excalidraw-loaded? true))
                                state)}
  [file block-uuid]
  (let [loaded? (rum/react excalidraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.excalidraw/draw))]
    (when draw-component
      (draw-component {:file file :block-uuid block-uuid}))))

(rum/defcs asset-cp < rum/reactive
                      (rum/local nil ::file-exists?)
                      {:will-mount (fn [state]
                                     (let [block (last (:rum/args state))
                                           asset-type (:logseq.property.asset/type block)
                                           path (path/path-join common-config/local-assets-dir (str (:block/uuid block) "." asset-type))]
                                       (p/let [result (if config/publishing?
                                                        ;; publishing doesn't have window.pfs defined
                                                        true
                                                        (fs/file-exists? (config/get-repo-dir (state/get-current-repo)) path))]
                                         (reset! (::file-exists? state) result))
                                       state))}
  [state config block]
  (let [asset-type (:logseq.property.asset/type block)
        file (str (:block/uuid block) "." asset-type)
        file-exists? @(::file-exists? state)
        repo (state/get-current-repo)
        asset-file-write-finished? (state/sub :assets/asset-file-write-finish
                                              {:path-in-sub-atom [repo (str (:block/uuid block))]})
        asset-type (:logseq.property.asset/type block)
        image? (contains? (common-config/img-formats) (keyword asset-type))
        width (get-in block [:logseq.property.asset/resize-metadata :width])
        asset-width (:logseq.property.asset/width block)
        asset-height (:logseq.property.asset/height block)
        img-metadata (when image?
                       (let [width (or width 250 asset-width)
                             aspect-ratio (when (and asset-width asset-height)
                                            (/ asset-width asset-height))]
                         (merge
                          (when width
                            {:width width})
                          (when (and width aspect-ratio)
                            {:height (/ width aspect-ratio)}))))
        img-placeholder (when image?
                          [:div.img-placeholder.asset-container
                           {:style img-metadata}])]
    (cond
      (or file-exists? asset-file-write-finished?)
      (asset-link (assoc config
                    :asset-block block
                    :image-placeholder img-placeholder)
                  (:block/title block)
                  (path/path-join (str "../" common-config/local-assets-dir) file)
                  img-metadata
                  nil)
      image?
      img-placeholder)))

(defn- img-audio-video?
  [block]
  (let [asset-type (some-> (:logseq.property.asset/type block) keyword)]
    (or (contains? (common-config/img-formats) asset-type)
        (contains? config/audio-formats asset-type)
        (contains? config/video-formats asset-type))))

(declare block-positioned-properties)

(rum/defc page-reference < rum/reactive db-mixins/query
                           "Component for page reference"
  [{:keys [html-export? nested-link? show-brackets? id] :as config*} uuid-or-title* label]
  (when uuid-or-title*
    (let [uuid-or-title (if (string? uuid-or-title*)
                          (let [str-id (string/trim uuid-or-title*)]
                            (if (util/uuid-string? str-id)
                              (parse-uuid str-id)
                              str-id))
                          uuid-or-title*)
          self-reference? (when (set? (:ref-set config*))
                            (contains? (:ref-set config*) uuid-or-title))]
      (when-not self-reference?
        (let [config (update config* :ref-set (fn [s]
                                                (let [bid (:block/uuid (:block config*))]
                                                  (if (nil? s)
                                                    #{bid}
                                                    (conj s bid uuid-or-title)))))
              show-brackets? (if (some? show-brackets?) show-brackets? (state/show-brackets?))
              contents-page? (= "contents" (string/lower-case (str id)))
              block* (db/get-page uuid-or-title)
              block (or (some-> (:db/id block*) db/sub-block) block*)
              config' (assoc config
                        :label (mldoc/plain->text label)
                        :contents-page? contents-page?
                        :show-icon? true?
                        :with-tags? false)
              asset? (some? (:logseq.property.asset/type block))
              brackets? (and (or show-brackets? nested-link?)
                             (not html-export?)
                             (not contents-page?))]
          (when-not (and (:db/id block) (= (:db/id block) (:db/id (:block config))))
            (cond
              (and asset? (img-audio-video? block))
              (asset-cp config block)

              (and (string? uuid-or-title) (string/ends-with? uuid-or-title ".excalidraw"))
              [:div.draw {:on-click (fn [e]
                                      (.stopPropagation e))}
               (excalidraw uuid-or-title (:block/uuid config))]

              :else
              (let [blank-title? (string/blank? (:block/title block))]
                [:span.page-reference
                 {:data-ref (str uuid-or-title)}
                 (when (and brackets? (not blank-title?))
                   [:span.text-gray-500.bracket page-ref/left-brackets])
                 (when (and (config/db-based-graph?)
                            (or (ldb/class-instance? (db/entity :logseq.class/Task) block)
                                (:logseq.property/status block)
                                (:logseq.property/priority block)))
                   [:div.inline-block
                    {:style {:margin-right 1
                             :margin-top -2
                             :vertical-align "middle"}
                     :on-pointer-down (fn [e]
                                        (util/stop e))}
                    (block-positioned-properties config block :block-left)])
                 (page-cp config' (if (uuid? uuid-or-title)
                                    {:block/uuid uuid-or-title}
                                    {:block/name uuid-or-title}))
                 (when (and brackets? (not blank-title?))
                   [:span.text-gray-500.bracket page-ref/right-brackets])]))))))))

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(declare blocks-container)

(declare block-container)

(rum/defc block-embed
  [config block-uuid]
  (let [[block set-block!] (hooks/use-state (db/entity [:block/uuid block-uuid]))]
    (hooks/use-effect!
     (fn []
       (p/let [block (db-async/<get-block (state/get-current-repo)
                                          block-uuid
                                          {:children? false
                                           :skip-refresh? true})]
         (set-block! block)))
     [])
    (when block
      [:div.color-level.embed-block.bg-base-2
       {:style {:z-index 2}
        :on-pointer-down (fn [e] (.stopPropagation e))}
       [:div.px-3.pt-1.pb-2
        (let [config' (assoc config
                        :db/id (:db/id block)
                        :id (str block-uuid)
                        :embed-id block-uuid
                        :embed? true
                        :embed-parent (:block config)
                        :ref? false)]
          (block-container config' block))]])))

(rum/defc page-embed-aux < rum/reactive db-mixins/query
  [config block]
  (let [current-page (state/get-current-page)
        block (db/sub-block (:db/id block))
        whiteboard-page? (model/whiteboard-page? block)
        page-name (:block/name block)]
    [:div.color-level.embed.embed-page.bg-base-2
     {:class (when (:sidebar? config) "in-sidebar")
      :on-pointer-down #(.stopPropagation %)}
     [:section.flex.items-center.p-1.embed-header
      [:div.mr-3 svg/page]
      (page-cp config block)]
     (when (and
            (not= (util/page-name-sanity-lc (or current-page ""))
                  page-name)
            (not= (util/page-name-sanity-lc (get config :id ""))
                  page-name))
       (if whiteboard-page?
         ((state/get-component :whiteboard/tldraw-preview) (:block/uuid block))
         (let [blocks (ldb/get-children block)
               config' (assoc config
                         :db/id (:db/id block)
                         :id page-name
                         :embed? true
                         :page-embed? true
                         :ref? false)]
           (blocks-container config' blocks))))]))

(rum/defc page-embed
  [config page-name]
  (let [page-name (util/page-name-sanity-lc (string/trim page-name))]
    (let [[block set-block!] (hooks/use-state nil)]
      (hooks/use-effect!
       (fn []
         (p/let [block (db-async/<get-block (state/get-current-repo)
                                            page-name
                                            {:children? true
                                             :skip-refresh? true})]
           (set-block! block)))
       [])
      (when block
        (page-embed-aux config block)))))

(defn- get-label-text
  [label]
  (when (and (= 1 (count label))
             (string? (last (first label))))
    (common-util/safe-decode-uri-component (last (first label)))))

(defn- macro->text
  [name arguments]
  (if (and (seq arguments)
           (not= arguments ["null"]))
    (util/format "{{%s %s}}" name (string/join ", " arguments))
    (util/format "{{%s}}" name)))

(declare block-content)
(declare breadcrumb)

(rum/defc block-reference-preview
  [children {:keys [repo config id]}]
  (let [*timer (hooks/use-ref nil)                          ;; show
        *timer1 (hooks/use-ref nil)                         ;; hide
        [visible? set-visible!] (rum/use-state nil)
        _ #_:clj-kondo/ignore (rum/defc render []
                                [:div.tippy-wrapper.as-block
                                 {:style {:width 600
                                          :font-weight 500
                                          :text-align "left"}
                                  :on-mouse-enter (fn []
                                                    (when-let [timer1 (hooks/deref *timer1)]
                                                      (js/clearTimeout timer1)))

                                  :on-mouse-leave (fn []
                                                    (when (ui/last-shui-preview-popup?)
                                                      (hooks/set-ref! *timer1
                                                                      (js/setTimeout #(set-visible! false) 500))))}
                                 [(breadcrumb config repo id {:indent? true})
                                  (blocks-container
                                   (assoc config :id (str id) :preview? true)
                                   [(db/entity [:block/uuid id])])]])]
    (popup-preview-impl children
                        {:visible? visible? :set-visible! set-visible!
                         :*timer *timer :*timer1 *timer1
                         :render render})))

(rum/defc block-reference-aux < rum/reactive db-mixins/query
  [config block label]
  (let [db-id (:db/id block)
        block-id (:block/uuid block)
        block (when db-id (db/sub-block db-id))
        block-type (keyword (pu/lookup block :logseq.property/ls-type))
        hl-type (pu/lookup block :logseq.property.pdf/hl-type)
        repo (state/get-current-repo)
        stop-inner-events? (= block-type :whiteboard-shape)
        config' (assoc config
                  :block-ref? true
                  :stop-events? stop-inner-events?)]
    (if (and block (:block/title block))
      (let [content-cp (block-content config'
                                      block nil (:block/uuid block)
                                      nil)
            display-type (:logseq.property.node/display-type block)]
        (if (and display-type (not (contains? #{:quote :math} display-type)))
          content-cp
          (let [title [:span.block-ref content-cp]
                inner (cond
                        (seq label)
                        (->elem
                         :span.block-ref
                         (map-inline config label))
                        :else
                        title)]
            [:div.block-ref-wrap.inline
             {:data-type (name (or block-type :default))
              :data-hl-type hl-type
              :on-pointer-down
              (fn [^js/MouseEvent e]
                (if (util/right-click? e)
                  (state/set-state! :block-ref/context {:block (:block config)
                                                        :block-ref block-id})
                  (when (and
                         (or (gobj/get e "shiftKey")
                             (not (.. e -target (closest ".blank"))))
                         (not (util/right-click? e)))
                    (util/stop e)

                    (cond
                      (gobj/get e "shiftKey")
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       (:db/id block)
                       :block-ref)

                      (and (util/meta-key? e) (whiteboard-handler/inside-portal? (.-target e)))
                      (whiteboard-handler/add-new-block-portal-shape!
                       (:block/uuid block)
                       (whiteboard-handler/closest-shape (.-target e)))

                      :else
                      (match [block-type (util/electron?)]
                             ;; pdf annotation
                             [:annotation true] (pdf-assets/open-block-ref! block)

                             [:whiteboard-shape true] (route-handler/redirect-to-page!
                                                       (get-in block [:block/page :block/uuid]) {:block-id block-id})

                             ;; default open block page
                             :else (route-handler/redirect-to-page! block-id))))))}

             (if (and (not (util/mobile?))
                      (not (:preview? config))
                      (not (shui-dialog/has-modal?))
                      (nil? block-type))
               (block-reference-preview inner
                                        {:repo repo :config config :id block-id})
               inner)])))
      (do
        (log/warn :invalid-node block)
        (invalid-node-ref block-id)))))

(rum/defc block-reference
  [config id label]
  (let [block-id (and id (if (uuid? id) id (parse-uuid id)))
        [block set-block!] (hooks/use-state (db/entity [:block/uuid block-id]))
        self-reference? (when (set? (:ref-set config))
                          (contains? (:ref-set config) block-id))]
    (hooks/use-effect!
     (fn []
       (p/let [block (db-async/<get-block (state/get-current-repo)
                                          block-id
                                          {:children? false
                                           :skip-refresh? true})]
         (set-block! block)))
     [])
    (when-not self-reference?
      (cond
        (config/db-based-graph?)
        (page-reference config block-id label)

        block
        (let [config' (update config :ref-set (fn [s]
                                                (let [bid (:block/uuid (:block config))]
                                                  (if (nil? s)
                                                    #{bid}
                                                    (conj s bid block-id)))))]
          (block-reference-aux config' block label))
        :else
        (invalid-node-ref block-id)))))

(defn- render-macro
  [config name arguments macro-content format]
  [:div.macro {:data-macro-name name}

   (if macro-content
     (let [ast (->> (mldoc/->edn macro-content format)
                    (map first))
           paragraph? (and (= 1 (count ast))
                           (= "Paragraph" (ffirst ast)))]
       (if (and (not paragraph?)
                (mldoc/block-with-title? (ffirst ast)))
         (markup-elements-cp (assoc config :block/format format) ast)
         (inline-text config format macro-content)))
     [:span.warning {:title (str "Unsupported macro name: " name)}
      (macro->text name arguments)])])

(rum/defc nested-link < rum/reactive
  [config html-export? link]
  (let [show-brackets? (state/show-brackets?)
        {:keys [content children]} link]
    [:span.page-reference.nested
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 page-ref/left-brackets])
     (let [page-name (subs content 2 (- (count content) 2))]
       (page-cp (assoc config
                  :children children
                  :nested-link? true) {:block/name page-name}))
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 page-ref/right-brackets])]))

(defn- show-link?
  [config metadata s full-text]
  (let [media-formats (set (map name config/media-formats))
        metadata-show (:show (common-util/safe-read-map-string metadata))
        format (get-in config [:block :block/format] :markdown)]
    (or
     (and
      (= :org format)
      (or
       (and
        (nil? metadata-show)
        (or
         (common-config/local-relative-asset? s)
         (text-util/media-link? media-formats s)))
       (true? (boolean metadata-show))))

     ;; markdown
     (string/starts-with? (string/triml full-text) "!")

     ;; image http link
     (and (or (string/starts-with? full-text "http://")
              (string/starts-with? full-text "https://"))
          (text-util/media-link? media-formats s)))))

(defn- relative-assets-path->absolute-path
  [path]
  (when (path/protocol-url? path)
    (js/console.error "BUG: relative-assets-path->absolute-path called with protocol url" path))
  (if (or (path/absolute? path) (path/protocol-url? path))
    path
    (.. util/node-path
        (join (config/get-repo-dir (state/get-current-repo))
              (config/get-local-asset-absolute-path path)))))

(rum/defc audio-link
  [config url href _label metadata full_text]
  (if (and (common-config/local-relative-asset? href)
           (or (config/local-file-based-graph? (state/get-current-repo))
               (config/db-based-graph? (state/get-current-repo))))
    (asset-link config nil href metadata full_text)
    (let [href (cond
                 (util/starts-with? href "http")
                 href

                 config/publishing?
                 (subs href 1)

                 (= "Embed_data" (first url))
                 href

                 :else
                 (if (assets-handler/check-alias-path? href)
                   (assets-handler/resolve-asset-real-path-url (state/get-current-repo) href)
                   (get-file-absolute-path config href)))]
      (audio-cp href))))

(defn- media-link
  [config url s label metadata full_text]
  (let [ext (keyword (util/get-file-ext s))
        label-text (get-label-text label)]
    (cond
      (contains? config/audio-formats ext)
      (audio-link config url s label metadata full_text)

      (contains? config/doc-formats ext)
      (asset-link config label-text s metadata full_text)

      (not (contains? #{:mp4 :webm :mov} ext))
      (image-link config url s label metadata full_text)

      :else
      (asset-reference config label s))))

(defn- search-link-cp
  [config url s label title metadata full_text]
  (cond
    (string/blank? s)
    [:span.warning {:title "Invalid link"} full_text]

    (= \# (first s))
    (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

    ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
    (and (= \* (first s))
         (not= \* (last s)))
    (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

    (block-ref/block-ref? s)
    (let [id (block-ref/get-block-ref-id s)]
      (block-reference config id label))

    (not (string/includes? s "."))
    (page-reference config s label)

    (path/protocol-url? s)
    (->elem :a {:href s
                :data-href s
                :target "_blank"}
            (map-inline config label))

    (show-link? config metadata s full_text)
    (media-link config url s label metadata full_text)

    (util/electron?)
    (let [path (cond
                 (string/starts-with? s "file://")
                 (string/replace s "file://" "")

                 (string/starts-with? s "/")
                 s

                 :else
                 (relative-assets-path->absolute-path s))]
      (->elem
       :a
       (cond->
        {:on-click (fn [e]
                     (util/stop e)
                     (js/window.apis.openPath path))
         :data-href path}
        title
        (assoc :title title))
       (map-inline config label)))

    :else
    (page-reference config s label)))

(defn- link-cp [config link]
  (let [{:keys [url label title metadata full_text]} link]
    (match url
           ["Block_ref" id]
           (let [label* (if (seq (mldoc/plain->text label)) label nil)
                 {:keys [link-depth]} config
                 link-depth (or link-depth 0)]
             (if (> link-depth max-depth-of-links)
               [:p.warning.text-sm "Block ref nesting is too deep"]
               (block-reference (assoc config
                                  :reference? true
                                  :link-depth (inc link-depth)
                                  :block/uuid id)
                                id label*)))

           ["Page_ref" page]
           (let [format (get-in config [:block :block/format] :markdown)]
             (if (and (= format :org)
                      (show-link? config nil page page)
                      (not (contains? #{"pdf" "mp4" "ogg" "webm"} (util/get-file-ext page))))
               (image-link config url page nil metadata full_text)
               (let [label* (if (seq (mldoc/plain->text label)) label nil)]
                 (if (and (string? page) (string/blank? page))
                   [:span (ref/->page-ref page)]
                   (page-reference config page label*)))))

           ["Embed_data" src]
           (image-link config url src nil metadata full_text)

           ["Search" s]
           (search-link-cp config url s label title metadata full_text)

           :else
           (let [href (string-of-url url)
                 [protocol path] (or (and (= "Complex" (first url)) [(:protocol (second url)) (:link (second url))])
                                     (and (= "File" (first url)) ["file" (second url)]))
                 config (cond-> config
                                (not (string/blank? protocol))
                                (assoc :link-js-url (try (js/URL. href)
                                                         (catch :default _ nil))))]
             (cond
               (and (= (get-in config [:block :block/format] :markdown) :org)
                    (= "Complex" protocol)
                    (= (string/lower-case (:protocol path)) "id")
                    (string? (:link path))
                    (util/uuid-string? (:link path)))       ; org mode id
               (let [id (uuid (:link path))
                     block (db/entity [:block/uuid id])]
                 (if (:block/pre-block? block)
                   (let [page (:block/page block)]
                     (page-reference config (:block/name page) label))
                   (block-reference config (:link path) label)))

               (= protocol "file")
               (if (show-link? config metadata href full_text)
                 (media-link config url href label metadata full_text)
                 (let [href* (if (util/electron?)
                               (relative-assets-path->absolute-path href)
                               href)]
                   [:div.flex.flex-row.items-center
                    (ui/icon "file" {:class "opacity-50"})
                    (->elem
                     :a
                     (cond-> (if (util/electron?)
                               {:on-click (fn [e]
                                            (util/stop e)
                                            (js/window.apis.openPath path))
                                :data-href href*}
                               {:href (path/path-join "file://" href*)
                                :data-href href*
                                :target "_blank"})
                             title (assoc :title title))
                     (map-inline config label))]))

               (show-link? config metadata href full_text)
               (media-link config url href label metadata full_text)

               :else
               (if (:node-ref-link-only? config)
                 [:span
                  (map-inline config label)]
                 (->elem
                  :a.external-link
                  (cond->
                   {:target "_blank"
                    :href href}
                   title
                   (assoc :title title))
                  (map-inline config label))))))))

(declare ->hiccup inline)

(defn wrap-query-components
  [config]
  (merge config
         {:->hiccup ->hiccup
          :->elem ->elem
          :page-cp page-cp
          :inline-text inline-text
          :map-inline map-inline
          :inline inline}))

;;;; Macro component render functions
(defn- macro-query-cp
  [config arguments]
  [:div.dsl-query.pr-3.sm:pr-0
   (let [query (->> (string/join ", " arguments)
                    (string/trim))
         build-option (assoc (:block config) :file-version/query-macro-title query)]
     (query/custom-query (wrap-query-components (assoc config :dsl-query? true))
                         {:builder (query-builder-component/builder build-option {})
                          :query query}))])

(rum/defc macro-function-cp < rum/reactive
  [config arguments]
  (or
   (some-> (:query-result config) rum/react (block-macros/function-macro arguments))
   [:span.warning
    (util/format "{{function %s}}" (first arguments))]))

(defn- macro-embed-cp
  [config arguments]
  (let [a (first arguments)
        {:keys [link-depth]} config
        link-depth (or link-depth 0)]
    (cond
      (nil? a)                                              ; empty embed
      nil

      (> link-depth max-depth-of-links)
      [:p.warning.text-sm "Embed depth is too deep"]

      (page-ref/page-ref? a)
      (let [page-name (text/get-page-name a)]
        (when-not (string/blank? page-name)
          (page-embed (assoc config :link-depth (inc link-depth)) page-name)))

      (block-ref/string-block-ref? a)
      (when-let [s (-> a block-ref/get-string-block-ref-id string/trim)]
        (when-let [id (some-> s parse-uuid)]
          (block-embed (assoc config :link-depth (inc link-depth)) id)))

      :else                                                 ;TODO: maybe collections?
      nil)))

(defn- macro-vimeo-cp
  [_config arguments]
  (when-let [url (first arguments)]
    (when-let [vimeo-id (nth (util/safe-re-find text-util/vimeo-regex url) 5)]
      (when-not (string/blank? vimeo-id)
        (let [width (min (- (util/get-width) 96)
                         560)
              height (int (* width (/ 315 560)))]
          [:iframe
           {:allow-full-screen "allowfullscreen"
            :allow
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            :frame-border "0"
            :src (str "https://player.vimeo.com/video/" vimeo-id)
            :height height
            :width width}])))))

(defn- macro-bilibili-cp
  [_config arguments]
  (when-let [url (first arguments)]
    (when-let [id (cond
                    (<= (count url) 15) url
                    :else
                    (nth (util/safe-re-find text-util/bilibili-regex url) 5))]
      (when-not (string/blank? id)
        (let [width (min (- (util/get-width) 96)
                         560)
              height (int (* width (/ 360 560)))]
          [:iframe
           {:allowfullscreen true
            :framespacing "0"
            :frameborder "no"
            :border "0"
            :scrolling "no"
            :src (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1")
            :width width
            :height (max 500 height)}])))))

(defn- macro-video-cp
  [_config arguments]
  (if-let [url (first arguments)]
    (if (common-util/url? url)
      (let [results (text-util/get-matched-video url)
            src (match results
                       [_ _ _ (:or "youtube.com" "youtu.be" "y2u.be") _ id _]
                       (if (= (count id) 11) ["youtube-player" id] url)

                       [_ _ _ "youtube-nocookie.com" _ id _]
                       (str "https://www.youtube-nocookie.com/embed/" id)

                       [_ _ _ "loom.com" _ id _]
                       (str "https://www.loom.com/embed/" id)

                       [_ _ _ (_ :guard #(string/ends-with? % "vimeo.com")) _ id _]
                       (str "https://player.vimeo.com/video/" id)

                       [_ _ _ "bilibili.com" _ id & query]
                       (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1&autoplay=0"
                            (when-let [page (second query)]
                              (str "&page=" page)))

                       :else
                       url)]
        (if (and (coll? src)
                 (= (first src) "youtube-player"))
          (let [t (re-find #"&t=(\d+)" url)
                opts (when (seq t)
                       {:start (nth t 1)})]
            (youtube/youtube-video (last src) opts))
          (when src
            (let [width (min (- (util/get-width) 96) 560)
                  height (int (* width (/ (if (string/includes? src "player.bilibili.com")
                                            360 315)
                                          560)))]
              [:iframe
               {:allow-full-screen true
                :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                :framespacing "0"
                :frame-border "no"
                :border "0"
                :scrolling "no"
                :src src
                :width width
                :height height}]))))
      [:span.warning.mr-1 {:title "Invalid URL"}
       (macro->text "video" arguments)])
    [:span.warning.mr-1 {:title "Empty URL"}
     (macro->text "video" arguments)]))

(defn- macro-else-cp
  [name config arguments]
  (if-let [block-uuid (:block/uuid config)]
    (let [format (get-in config [:block :block/format] :markdown)
          ;; :macros is deprecated for db graphs
          macros-from-property (when (config/local-file-based-graph? (state/get-current-repo))
                                 (-> (db/entity [:block/uuid block-uuid])
                                     (:block/page)
                                     (:db/id)
                                     (db/entity)
                                     :block/properties
                                     :macros
                                     (get name)))
          macro-content (or macros-from-property
                            (get (state/get-macros) name)
                            (get (state/get-macros) (keyword name)))
          macro-content (cond
                          (= (str name) "img")
                          (case (count arguments)
                            1
                            (util/format "[:img {:src \"%s\"}]" (first arguments))
                            4
                            (when (and (util/safe-parse-int (nth arguments 1))
                                       (util/safe-parse-int (nth arguments 2)))
                              (util/format "[:img.%s {:src \"%s\" :style {:width %s :height %s}}]"
                                           (nth arguments 3)
                                           (first arguments)
                                           (util/safe-parse-int (nth arguments 1))
                                           (util/safe-parse-int (nth arguments 2))))
                            3
                            (when (and (util/safe-parse-int (nth arguments 1))
                                       (util/safe-parse-int (nth arguments 2)))
                              (util/format "[:img {:src \"%s\" :style {:width %s :height %s}}]"
                                           (first arguments)
                                           (util/safe-parse-int (nth arguments 1))
                                           (util/safe-parse-int (nth arguments 2))))

                            2
                            (cond
                              (util/safe-parse-int (nth arguments 1))
                              (util/format "[:img {:src \"%s\" :style {:width %s}}]"
                                           (first arguments)
                                           (util/safe-parse-int (nth arguments 1)))
                              (contains? #{"left" "right" "center"} (string/lower-case (nth arguments 1)))
                              (util/format "[:img.%s {:src \"%s\"}]"
                                           (string/lower-case (nth arguments 1))
                                           (first arguments))
                              :else
                              macro-content)

                            macro-content)

                          (and (seq arguments) macro-content)
                          (macro-util/macro-subs macro-content arguments)

                          :else
                          macro-content)
          macro-content (when macro-content
                          (template/resolve-dynamic-template! macro-content))]
      (render-macro config name arguments macro-content format))
    (let [macro-content (or
                         (get (state/get-macros) name)
                         (get (state/get-macros) (keyword name)))
          format (get-in config [:block :block/format] :markdown)]
      (render-macro config name arguments macro-content format))))

(rum/defc namespace-hierarchy-aux
  [config namespace children]
  [:ul
   (for [child children]
     [:li {:key (str "namespace-" namespace "-" (:db/id child))}
      (let [shorten-name (some-> (or (:block/title child) (:block/name child))
                                 (string/split "/")
                                 last)]
        (page-cp {:label shorten-name} child))
      (when (seq (:namespace/children child))
        (namespace-hierarchy-aux config (:block/name child)
                                 (:namespace/children child)))])])

(rum/defc namespace-hierarchy
  [config namespace children]
  [:div.namespace
   [:div.font-medium.flex.flex-row.items-center.pb-2
    [:span.text-sm.mr-1 "Namespace "]
    (page-cp config {:block/name namespace})]
   (namespace-hierarchy-aux config namespace children)])

(defn- macro-cp
  [config options]
  (let [{:keys [name arguments]} options
        arguments (if (and
                       (>= (count arguments) 2)
                       (and (string/starts-with? (first arguments) page-ref/left-brackets)
                            (string/ends-with? (last arguments) page-ref/right-brackets))) ; page reference
                    (let [title (string/join ", " arguments)]
                      [title])
                    arguments)]
    (cond
      (= name "query")
      (if (config/db-based-graph? (state/get-current-repo))
        [:div.warning "{{query}} is deprecated. Use '/Query' command instead."]
        (macro-query-cp config arguments))

      (= name "function")
      (macro-function-cp config arguments)

      (= name "namespace")
      (if (config/db-based-graph? (state/get-current-repo))
        [:div.warning (str "{{namespace}} is deprecated. Use the " common-config/library-page-name " feature instead.")]
        (let [namespace (first arguments)]
          (when-not (string/blank? namespace)
            (let [namespace (string/lower-case (page-ref/get-page-name! namespace))
                  children (file-model/get-namespace-hierarchy (state/get-current-repo) namespace)]
              (namespace-hierarchy config namespace children)))))

      (= name "youtube")
      (when-let [url (first arguments)]
        (when-let [youtube-id (cond
                                (== 11 (count url)) url
                                :else
                                (nth (util/safe-re-find text-util/youtube-regex url) 5))]
          (when-not (string/blank? youtube-id)
            (youtube/youtube-video youtube-id nil))))

      (= name "youtube-timestamp")
      (when-let [timestamp' (first arguments)]
        (when-let [seconds (youtube/parse-timestamp timestamp')]
          (youtube/timestamp seconds)))

      (= name "zotero-imported-file")
      (let [[item-key filename] arguments]
        (when (and item-key filename)
          [:span.ml-1 (zotero/zotero-imported-file item-key filename)]))

      (= name "zotero-linked-file")
      (when-let [path (first arguments)]
        [:span.ml-1 (zotero/zotero-linked-file path)])

      (= name "vimeo")
      (macro-vimeo-cp config arguments)

      ;; TODO: support fullscreen mode, maybe we need a fullscreen dialog?
      (= name "bilibili")
      (macro-bilibili-cp config arguments)

      (= name "video")
      (macro-video-cp config arguments)

      (contains? #{"tweet" "twitter"} name)
      (when-let [url (first arguments)]
        (let [id-regex #"/status/(\d+)"]
          (if (:table? config)
            (util/format "{{twitter %s}}" url)
            (when-let [id (cond
                            (<= (count url) 15) url
                            :else
                            (last (util/safe-re-find id-regex url)))]
              (ui/tweet-embed id)))))

      (= name "embed")
      (if (config/db-based-graph? (state/get-current-repo))
        [:div.warning "{{embed}} is deprecated. Use '/Node embed' command instead."]
        (macro-embed-cp config arguments))

      (= name "renderer")
      (when config/lsp-enabled?
        (when-let [block-uuid (str (:block/uuid config))]
          (plugins/hook-ui-slot :macro-renderer-slotted (assoc options :uuid block-uuid))))

      (get @macro/macros name)
      ((get @macro/macros name) config options)

      :else
      (macro-else-cp name config arguments))))

(defn- emphasis-cp
  [config kind data]
  (let [elem (case kind
               "Bold" :b
               "Italic" :i
               "Underline" :ins
               "Strike_through" :del
               "Highlight" :mark)]
    (->elem elem (map-inline config data))))

(defn hiccup->html
  [s]
  (let [result (common-util/safe-read-string s)
        result' (if (seq result) result
                                 [:div.warning {:title "Invalid hiccup"}
                                  s])]
    (-> result'
        (hiccups.core/html)
        (security/sanitize-html))))

(defn ^:large-vars/cleanup-todo inline
  [{:keys [html-export?] :as config} item]
  (match item
         [(:or "Plain" "Spaces") s]
         s

         ["Superscript" l]
         (->elem :sup (map-inline config l))
         ["Subscript" l]
         (->elem :sub (map-inline config l))

         ["Tag" _]
         (when-let [s (gp-block/get-tag item)]
           (let [s (text/page-ref-un-brackets! s)]
             (if (config/db-based-graph?)
               (if (common-util/uuid-string? s)
                 (page-cp (assoc config :tag? true) {:block/name s})
                 [:span (str "#" s)])
               (page-cp (assoc config :tag? true) {:block/name s}))))

         ["Emphasis" [[kind] data]]
         (emphasis-cp config kind data)

         ["Entity" e]
         [:span {:dangerouslySetInnerHTML
                 {:__html (security/sanitize-html (:html e))}}]

         ["Latex_Fragment" [display s]]                     ;display can be "Displayed" or "Inline"
         (if html-export?
           (latex/html-export s false true)
           (latex/latex s false (not= display "Inline")))

         [(:or "Target" "Radio_Target") s]
         [:a {:id s} s]

         ["Email" address]
         (let [{:keys [local_part domain]} address
               address (str local_part "@" domain)]
           [:a {:href (str "mailto:" address)} address])

         ["Nested_link" link]
         (nested-link config html-export? link)

         ["Link" link]
         (link-cp config link)

         [(:or "Verbatim" "Code") s]
         [:code s]

         ["Inline_Source_Block" x]
         [:code (:code x)]

         ["Export_Snippet" "html" s]
         (when (not html-export?)
           [:span {:dangerouslySetInnerHTML
                   {:__html (security/sanitize-html s)}}])

         ["Inline_Hiccup" s]                                ;; String to hiccup
         (ui/catch-error
          [:div.warning {:title "Invalid hiccup"} s]
          [:span {:dangerouslySetInnerHTML
                  {:__html (hiccup->html s)}}])

         ["Inline_Html" s]
         (when (not html-export?)
           ;; TODO: how to remove span and only export the content of `s`?
           [:span {:dangerouslySetInnerHTML {:__html (security/sanitize-html s)}}])

         [(:or "Break_Line" "Hard_Break_Line")]
         [:br]

         ["Timestamp" [(:or "Scheduled" "Deadline") _timestamp]]
         nil
         ["Timestamp" ["Date" t]]
         (timestamp t "Date")
         ["Timestamp" ["Closed" t]]
         (timestamp t "Closed")
         ["Timestamp" ["Range" t]]
         (range t false)
         ["Timestamp" ["Clock" ["Stopped" t]]]
         (range t true)
         ["Timestamp" ["Clock" ["Started" t]]]
         (timestamp t "Started")

         ["Cookie" ["Percent" n]]
         [:span {:class "cookie-percent"}
          (util/format "[%d%%]" n)]
         ["Cookie" ["Absolute" current total]]
         [:span {:class "cookie-absolute"}
          (util/format "[%d/%d]" current total)]

         ["Footnote_Reference" options]
         (let [{:keys [name]} options
               encode-name (util/url-encode name)]
           [:sup.fn
            [:a {:id (str "fnr." encode-name)
                 :class "footref"
                 :on-click #(route-handler/jump-to-anchor! (str "fn." encode-name))}
             name]])

         ["Macro" options]
         (macro-cp config options)

         :else ""))

(rum/defc block-child
  [block]
  block)

(defn- dnd-same-block?
  [uuid]
  (= (:block/uuid @*dragging-block) uuid))

(defn- on-drag-start
  [event block block-id]
  (let [selected (set (map #(.-id %) (state/get-selection-blocks)))
        selected? (contains? selected block-id)
        block-uuid (:db/id block)]
    (when-not selected?
      (util/clear-selection!)
      (editor-handler/highlight-block! block-uuid))
    (editor-handler/block->data-transfer! block-uuid event false)

    (.setData (gobj/get event "dataTransfer")
              "block-dom-id"
              block-id)
    (reset! *dragging? true)
    (reset! *dragging-block block)))

(defn- bullet-on-click
  [e block uuid {:keys [on-redirect-to-page]}]
  (cond
    (pu/shape-block? block)
    (route-handler/redirect-to-page! (get-in block [:block/page :block/uuid]) {:block-id uuid})

    (gobj/get e "shiftKey")
    (do
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id block)
       :block)
      (util/stop e))

    (and (util/meta-key? e) (whiteboard-handler/inside-portal? (.-target e)))
    (do (whiteboard-handler/add-new-block-portal-shape!
         uuid
         (whiteboard-handler/closest-shape (.-target e)))
        (util/stop e))

    :else
    (when uuid
      (-> (or on-redirect-to-page route-handler/redirect-to-page!)
          (apply [(str uuid)])))))

(declare block-list)
(rum/defc block-children < rum/reactive
  [config block children collapsed?]
  (let [ref? (:ref? config)
        query? (:custom-query? config)
        library? (:library? config)
        children (when (coll? children)
                   (let [ref-matched-children-ids (:ref-matched-children-ids config)]
                     (cond->> (remove nil? children)
                              ref-matched-children-ids
                              ;; Block children will not be rendered if the filters do not match them
                              (filter (fn [b] (ref-matched-children-ids (:db/id b))))
                              library?
                              (filter (fn [b] (and (ldb/page? b) (not (or (ldb/class? b) (ldb/property? b)))))))))]
    (when (and (coll? children)
               (seq children)
               (not collapsed?))
      [:div.block-children-container.flex
       [:div.block-children-left-border
        {:on-click (fn [_]
                     (editor-handler/toggle-open-block-children! (:block/uuid block)))}]
       [:div.block-children.w-full {:style {:display (if collapsed? "none" "")}}
        (let [config' (cond-> (dissoc config :breadcrumb-show? :embed-parent)
                              (or ref? query?)
                              (assoc :ref-query-child? true)
                              true
                              (assoc :block-children? true)
                              (integer? (:block-level config))
                              (update :block-level inc))]
          (block-list config' children))]])))

(defn- block-content-empty?
  [block]
  (string/blank? (:block/title block)))

(rum/defcs ^:large-vars/cleanup-todo block-control < rum/reactive
                                                     (rum/local false ::dragging?)
  [state config block {:keys [uuid block-id collapsed? *control-show? edit? selected? top? bottom?]}]
  (let [*bullet-dragging? (::dragging? state)
        doc-mode? (state/sub :document/mode?)
        control-show? (util/react *control-show?)
        ref? (:ref? config)
        empty-content? (block-content-empty? block)
        fold-button-right? (state/enable-fold-button-right?)
        own-number-list? (:own-order-number-list? config)
        order-list? (boolean own-number-list?)
        order-list-idx (:own-order-list-index config)
        page-title? (:page-title? config)
        collapsable? (editor-handler/collapsable? uuid {:semantic? true
                                                        :ignore-children? page-title?})
        link? (boolean (:original-block config))
        icon-size (if collapsed? 12 14)
        icon (icon-component/get-node-icon-cp block {:size icon-size :color? true :link? link?})
        with-icon? (and (some? icon)
                        (or (and (db/page? block)
                                 (not (:library? config)))
                            (:logseq.property/icon block)
                            link?
                            (some :logseq.property/icon (:block/tags block))
                            (contains? #{"pdf"} (:logseq.property.asset/type block))))]
    [:div.block-control-wrap.flex.flex-row.items-center.h-6
     {:class (util/classnames [{:is-order-list order-list?
                                :is-with-icon with-icon?
                                :bullet-closed collapsed?
                                :bullet-hidden (:hide-bullet? config)}])}
     (when (and (or (not fold-button-right?) collapsable? collapsed?)
                (not (:table? config)))
       [:a.block-control
        {:id (str "control-" uuid)
         :on-click (fn [event]
                     (util/stop event)
                     (state/clear-edit!)
                     (p/do!
                      (if ref?
                        (state/toggle-collapsed-block! uuid)
                        (if collapsed?
                          (editor-handler/expand-block! uuid)
                          (editor-handler/collapse-block! uuid)))
                      (haptics/haptics))
                     ;; debug config context
                     (when (and (state/developer-mode?) (.-metaKey event))
                       (js/console.debug "[block config]==" config)))}
        [:span {:class (if (or (and control-show? (or collapsed? collapsable?))
                               (and collapsed? (or page-title? order-list? config/publishing? (util/mobile?))))
                         "control-show cursor-pointer"
                         "control-hide")}
         (ui/rotating-arrow collapsed?)]])

     (when-not (:hide-bullet? config)
       (let [bullet [:a.bullet-link-wrap {:on-click #(bullet-on-click % block uuid config)}
                     [:span.bullet-container.cursor
                      (cond->
                       {:id (str "dot-" uuid)

                        :blockid (str uuid)
                        :class (str (when collapsed? "bullet-closed")
                                    (when (and (:document/mode? config)
                                               (not collapsed?))
                                      " hide-inner-bullet")
                                    (when order-list? " as-order-list typed-list"))}
                       (not (util/mobile?))
                       (assoc
                         :draggable true
                         :on-drag-start (fn [event]
                                          (reset! *bullet-dragging? true)
                                          (util/stop-propagation event)
                                          (on-drag-start event block block-id))
                         :on-drag-end (fn [_e]
                                        (reset! *bullet-dragging? false))))

                      (if with-icon?
                        icon
                        [:span.bullet (cond->
                                       {:blockid (str uuid)}
                                       selected?
                                       (assoc :class "selected"))
                         (when
                          order-list?
                           [:label (str order-list-idx ".")])])]]
             bullet' (cond
                       (and (or (mobile-util/native-platform?)
                                (:ui/show-empty-bullets? (state/get-config))
                                collapsed?
                                collapsable?
                                (< (- (util/time-ms) (:block/created-at block)) 500))
                            (not doc-mode?))
                       bullet

                       (or
                        (and empty-content?
                             (not edit?)
                             (not top?)
                             (not bottom?)
                             (not (util/react *control-show?))
                             (not (:logseq.property/created-from-property block)))
                        (and doc-mode?
                             (not collapsed?)
                             (not (util/react *control-show?))))
                       [:span.bullet-container]

                       :else
                       bullet)]
         (if (and (config/db-based-graph?) (not @*bullet-dragging?))
           (ui/tooltip
            bullet'
            [:div.flex.flex-col.gap-1.p-2
             (when-let [created-by (and (ldb/get-graph-rtc-uuid (db/get-db))
                                        (:logseq.property/created-by-ref block))]
               [:div (:block/title created-by)])
             [:div "Created: " (date/int->local-time-2 (:block/created-at block))]
             [:div "Last edited: " (date/int->local-time-2 (:block/updated-at block))]])
           bullet')))]))

(rum/defc dnd-separator
  [move-to]
  [:div.relative
   [:div.dnd-separator.absolute
    {:style {:left (cond-> (if (= move-to :nested) 48 20)
                           (util/capacitor?)
                           (- 20))
             :top 0
             :width "100%"
             :z-index 3}}]])

(defn list-checkbox
  [config checked?]
  (ui/checkbox
   {:style {:margin-right 6}
    :value checked?
    :checked checked?
    :on-change (fn [event]
                 (let [target (.-target event)
                       block (:block config)
                       item-content (.. target -nextSibling -data)]
                   (editor-handler/toggle-list-checkbox block item-content)))}))

(declare block-content)

(declare src-cp)

(rum/defc ^:large-vars/cleanup-todo text-block-title
  [config block]
  (let [db-based? (config/db-based-graph? (state/get-current-repo))
        format (if db-based? :markdown (or (:block/format block) :markdown))
        pre-block? (if db-based? false (:block/pre-block? block))
        marker (when-not db-based? (:block/marker block))
        block (if-not (:block.temp/ast-title block)
                (merge block (block/parse-title-and-body uuid format pre-block?
                                                         (:block/title block)))
                block)
        block-ast-title (:block.temp/ast-title block)
        config (assoc config :block block)
        level (:level config)
        block-ref? (:block-ref? config)
        block-type (or (keyword (pu/lookup block :logseq.property/ls-type)) :default)
        html-export? (:html-export? config)
        ;; `heading-level` is for backward compatibility, will remove it in later releases
        heading-level (:block/heading-level block)
        heading (or
                 (and heading-level
                      (<= heading-level 6)
                      heading-level)
                 (pu/lookup block :logseq.property/heading))
        heading (if (true? heading) (min (inc level) 6) heading)
        elem (if heading
               (keyword (str "h" heading ".block-title-wrap.as-heading"
                             (when block-ref? ".as-inline")))
               :span.block-title-wrap)]
    (when (seq block-ast-title)
      (->elem
       elem
       (merge
        {:data-hl-type (pu/lookup block :logseq.property.pdf/hl-type)}
        (when (and marker
                   (not (string/blank? marker))
                   (not= "nil" marker))
          {:data-marker (str (string/lower-case marker))}))

       ;; children
       (let [area? (= :area (keyword (pu/lookup block :logseq.property.pdf/hl-type)))
             hl-ref #(when (not (#{:default :whiteboard-shape} block-type))
                       [:div.prefix-link
                        {:on-pointer-down
                         (fn [^js e]
                           (let [^js target (.-target e)]
                             (case block-type
                               ;; pdf annotation
                               :annotation
                               (if (and area? (.contains (.-classList target) "blank"))
                                 :actions
                                 (do
                                   (pdf-assets/open-block-ref! block)
                                   (util/stop e)))

                               :dune)))}

                        [:span.hl-page
                         [:strong.forbid-edit
                          (str "P"
                               (or (pu/lookup block :logseq.property.pdf/hl-page)
                                   "?"))]]

                        (when (and area?
                                   (or
                                    ;; db graphs
                                    (:logseq.property.pdf/hl-image block)
                                    ;; file graphs
                                    (get-in block [:block/properties :hl-stamp])))
                          (pdf-assets/area-display block))])]
         (remove-nils
          (concat
           (when (config/local-file-based-graph? (state/get-current-repo))
             [(when (and (not pre-block?)
                         (not html-export?))
                (file-block/block-checkbox block (str "mr-1 cursor")))
              (when (and (not pre-block?)
                         (not html-export?))
                (file-block/marker-switch block))
              (file-block/marker-cp block)
              (file-block/priority-cp block)])

           ;; highlight ref block (inline)
           (when-not area? [(hl-ref)])

           (let [config' (cond-> config
                                 (and (:page-ref? config)
                                      (= 1 (count block-ast-title))
                                      (= "Link" (ffirst block-ast-title)))
                                 (assoc :node-ref-link-only? true))]
             (conj
              (map-inline config' block-ast-title)
              (when (= block-type :whiteboard-shape) [:span.mr-1 (ui/icon "whiteboard-element" {:extension? true})])))

           ;; highlight ref block (area)
           (when area? [(hl-ref)])

           (when (and (seq block-ast-title) (ldb/class-instance?
                                             (entity-plus/entity-memoized (db/get-db) :logseq.class/Cards)
                                             block))
             [(ui/tooltip
               (shui/button
                {:variant :ghost
                 :size :sm
                 :class "ml-2 !px-1 !h-5 text-xs text-muted-foreground"
                 :on-click (fn [e]
                             (util/stop e)
                             (state/pub-event! [:modal/show-cards (:db/id block)]))}
                "Practice")
               [:div "Practice cards"])]))))))))

(rum/defc block-title-aux
  [config block {:keys [query? *show-query?]}]
  (let [[hover? set-hover?] (rum/use-state false)
        blank? (string/blank? (:block/title block))
        opacity (if hover? "opacity-100" "opacity-0")
        query (:logseq.property/query block)
        advanced-query? (and query? (= :code (:logseq.property.node/display-type query)))
        show-query? (and *show-query? @*show-query?)
        query-setting (when query?
                        (ui/tooltip
                         (shui/button
                          {:size :sm
                           :variant :ghost
                           :class (str "ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6 transition-opacity ease-in duration-300 " opacity)
                           :on-pointer-down (fn [e]
                                              (util/stop e)
                                              (when *show-query? (swap! *show-query? not)))}
                          (ui/icon "settings"))
                         [:div.opacity-75 (if show-query?
                                            "Hide query"
                                            "Set query")]))]
    [:div
     {:class (if query?
               "inline-flex"
               "w-full inline")
      :on-mouse-over #(set-hover? true)
      :on-mouse-out #(set-hover? false)}
     (cond
       (and query? (and blank? (or advanced-query? show-query?)))
       [:span.opacity-75.hover:opacity-100 "Untitled query"]
       (and query? blank?)
       (query-builder-component/builder query {})
       :else
       (text-block-title config block))
     query-setting
     (when-let [property (:logseq.property/created-from-property block)]
       (when-let [message (when (= :url (:logseq.property/type property))
                            (first (outliner-property/validate-property-value (db/get-db) property (:db/id block))))]
         (ui/tooltip
          (shui/button
           {:size :sm
            :variant :ghost
            :class "ls-type-warning ls-small-icon px-1 !py-0 h-4 ml-1"}
           (ui/icon "alert-triangle"))
          [:div.opacity-75 message])))]))

(rum/defc block-title < rum/reactive db-mixins/query
  [config block {:keys [*show-query?]}]
  (let [block' (db/entity (:db/id block))
        node-display-type (:logseq.property.node/display-type block')
        db (db/get-db)
        query? (ldb/class-instance? (entity-plus/entity-memoized db :logseq.class/Query) block')]
    (cond
      (and (:page-title? config) (ldb/page? block) (string/blank? (:block/title block)))
      [:div.opacity-75 "Untitled"]

      (and (ldb/asset? block)
           (= :pdf (some-> (:logseq.property.asset/type block) string/lower-case keyword)))
      (asset-cp config block)

      (:raw-title? config)
      (text-block-title (dissoc config :raw-title?) block)

      (= :code node-display-type)
      [:div.flex.flex-1.w-full
       (src-cp (assoc config :code-block block) {:language (:logseq.property.code/lang block)})]

      ;; TODO: switched to https://cortexjs.io/mathlive/ for editing
      (= :math node-display-type)
      [:div.math-block
       (latex/latex (:block/title block) true true)]

      (seq (:logseq.property/_query block'))
      (query-builder-component/builder block' {})

      :else
      (block-title-aux config block {:query? query?
                                     :*show-query? *show-query?}))))

(rum/defc span-comma
  []
  [:span ", "])

(rum/defc property-cp
  [config block k value]
  (let [date (and (= k :date) (date/get-locale-string (str value)))
        user-config (state/get-config)
        ;; When value is a set of refs, display full property text
        ;; because :block/properties value only contains refs but user wants to see text
        property-separated-by-commas? (text/separated-by-commas? (state/get-config) k)
        v (or
           (when (and (coll? value) (seq value)
                      (not property-separated-by-commas?))
             (get (:block/properties-text-values block) k))
           value)
        property-pages-enabled? (contains? #{true nil} (:property-pages/enabled? user-config))]
    [:div
     (if property-pages-enabled?
       (if (and (not (config/db-based-graph? (state/get-current-repo)))
                (nil? (db/get-page (name k))))
         [:span.page-property-key.font-medium (name k)]
         (page-cp (assoc config :property? true) {:block/name (subs (str k) 1)}))
       [:span.page-property-key.font-medium (name k)])
     [:span.mr-1 ":"]
     [:div.page-property-value.inline
      (cond
        (int? v)
        v

        (= k :file-path)
        v

        date
        date

        (and (string? v) (common-util/wrapped-by-quotes? v))
        (common-util/unquote-string v)

        (and property-separated-by-commas? (coll? v))
        (let [v (->> (remove string/blank? v)
                     (filter string?))
              vals (for [v-item v]
                     (page-cp config {:block/name v-item}))
              elems (interpose (span-comma) vals)]
          (for [elem elems]
            (rum/with-key elem (str (random-uuid)))))

        :else
        (inline-text config (get block :block/format :markdown) (str v)))]]))

(rum/defc properties-cp
  [config {:block/keys [pre-block?] :as block}]
  (let [ordered-properties
        (property-util/get-visible-ordered-properties (:block/properties block)
                                                      (:block/properties-order block)
                                                      {:pre-block? pre-block?
                                                       :page-id (:db/id (:block/page block))})]
    (cond
      (seq ordered-properties)
      [:div.block-properties.rounded
       {:class (when pre-block? "page-properties")
        :title (if pre-block?
                 "Click to edit this page's properties"
                 "Click to edit this block's properties")}
       (for [[k v] ordered-properties]
         (rum/with-key (property-cp config block k v)
                       (str (:block/uuid block) "-" k)))]

      (and pre-block? ordered-properties)
      [:span.opacity-50 "Properties"]

      :else
      nil)))

(rum/defcs db-properties-cp < rum/static
                              {:init (fn [state]
                                       (let [container-id (or (:container-id (first (:rum/args state)))
                                                              (state/get-next-container-id))]
                                         (assoc state ::initial-container-id container-id)))}
  [state config block opts]
  (property-component/properties-area block
                                      (merge
                                       config
                                       {:inline-text inline-text
                                        :page-cp page-cp
                                        :block-cp blocks-container
                                        :editor-box (state/get-component :editor/box)
                                        :container-id (or (:container-id config)
                                                          (::initial-container-id state))}
                                       opts)))

(rum/defc invalid-properties-cp
  [invalid-properties]
  (when (seq invalid-properties)
    [:div.invalid-properties.mb-2
     [:div.warning {:title "Invalid properties"}
      "Invalid property names: "
      (for [p invalid-properties]
        [:button.p-1.mr-2 p])]
     [:code "Property name begins with a non-numeric character and can contain alphanumeric characters and . * + ! - _ ? $ % & = < >. If -, + or . are the first character, the second character (if any) must be non-numeric."]]))

(defn- target-forbidden-edit?
  [target]
  (or
   (dom/has-class? target "forbid-edit")
   (dom/has-class? target "bullet")
   (dom/has-class? target "logbook")
   (dom/has-class? target "markdown-table")
   (util/link? target)
   (util/time? target)
   (util/input? target)
   (util/audio? target)
   (util/video? target)
   (util/details-or-summary? target)
   (and (util/sup? target)
        (dom/has-class? target "fn"))
   (dom/has-class? target "image-resize")
   (dom/closest target "a")
   (dom/closest target ".query-table")))

(defn- block-content-on-pointer-down
  [e block block-id edit-input-id content config]
  (when-not @(:ui/scrolling? @state/state)
    (let [target (.-target e)
          selection-blocks (state/get-selection-blocks)
          starting-block (state/get-selection-start-block-or-first)
          mobile? (util/mobile?)
          mobile-selection? (and mobile? (seq selection-blocks))
          block-dom-element (util/rec-get-node target "ls-block")]
      (if mobile-selection?
        (let [ids (set (state/get-selection-block-ids))]
          (if (contains? ids (:block/uuid block))
            (do
              (state/drop-selection-block! block-dom-element)
              (when (= 1 (count ids))
                (state/set-state! :mobile/show-action-bar? false)))
            (state/conj-selection-block! block-dom-element)))
        (when-not (or
                   (:closed-values? config)
                   (> (count content) (state/block-content-max-length (state/get-current-repo))))
          (let [target (gobj/get e "target")
                button (gobj/get e "buttons")
                shift? (gobj/get e "shiftKey")
                meta? (util/meta-key? e)
                forbidden-edit? (target-forbidden-edit? target)
                get-cursor-range #(some-> block-dom-element
                                          (dom/by-class "block-content-inner")
                                          first
                                          util/caret-range)
                mobile-range (when mobile? (get-cursor-range))]
            (when-not forbidden-edit?
              (util/mobile-keep-keyboard-open false))
            (when (and (not forbidden-edit?) (contains? #{1 0} button))
              (cond
                (and meta? shift?)
                (when-not (empty? selection-blocks)
                  (util/stop e)
                  (editor-handler/highlight-selection-area! block-id block-dom-element {:append? true}))

                meta?
                (do
                  (util/stop e)
                  (if (some #(= block-dom-element %) selection-blocks)
                    (state/drop-selection-block! block-dom-element)
                    (state/conj-selection-block! block-dom-element :down))
                  (if (empty? (state/get-selection-blocks))
                    (state/clear-selection!)
                    (state/set-selection-start-block! block-dom-element)))

                (and shift? starting-block)
                (do
                  (util/stop e)
                  (util/clear-selection!)
                  (editor-handler/highlight-selection-area! block-id block-dom-element))

                shift?
                (do
                  (util/clear-selection!)
                  (state/set-selection-start-block! block-dom-element))

                :else
                (let [block (or (db/entity [:block/uuid (:block/uuid block)]) block)]
                  (editor-handler/clear-selection!)
                  (editor-handler/unhighlight-blocks!)
                  (p/do!
                   (state/pub-event! [:editor/save-code-editor])

                   (when-not (:block.temp/load-status (db/entity (:db/id block)))
                     (db-async/<get-block (state/get-current-repo) (:db/id block) {:children? false}))

                   (let [cursor-range (if mobile? mobile-range (get-cursor-range))
                         block (db/entity (:db/id block))
                         {:block/keys [title format]} block
                         content (if (config/db-based-graph? (state/get-current-repo))
                                   (:block/title block)
                                   (->> title
                                        (property-file/remove-built-in-properties-when-file-based
                                         (state/get-current-repo) format)
                                        (drawer/remove-logbook)))]

                     (state/set-editing!
                      edit-input-id
                      content
                      block
                      cursor-range
                      {:db (db/get-db)
                       :move-cursor? false
                       :container-id (:container-id config)}))

                   (state/set-selection-start-block! block-dom-element)))))))))))

(rum/defc dnd-separator-wrapper < rum/reactive
  [block block-id top?]
  (let [dragging? (rum/react *dragging?)
        drag-to-block (rum/react *drag-to-block)
        move-to (rum/react *move-to)]
    (when (and
           dragging?
           (= block-id drag-to-block)
           (not (:block/pre-block? block))
           move-to)
      (when-not (or (and top? (not= move-to :top))
                    (and (not top?) (= move-to :top)))
        (dnd-separator move-to)))))

(defn- block-content-inner
  [config block body plugin-slotted? collapsed? block-ref-with-title?]
  (if plugin-slotted?
    [:div.block-slotted-body
     (plugins/hook-block-slot
      :block-content-slotted
      (-> block (dissoc :block/children :block/page)))]

    (when-not (contains? #{:code :math} (:logseq.property.node/display-type block))
      (let [title-collapse-enabled? (:outliner/block-title-collapse-enabled? (state/get-config))]
        (when (and (not block-ref-with-title?)
                   (seq body)
                   (or (not title-collapse-enabled?)
                       (and title-collapse-enabled?
                            (or (not collapsed?)
                                (some? (mldoc/extract-first-query-from-ast body))))))
          [:div.block-body
           (let [body (block/trim-break-lines! (:block.temp/ast-body block))
                 uuid (:block/uuid block)]
             (for [[idx child] (medley/indexed body)]
               (when-let [block (markup-element-cp config child)]
                 (rum/with-key (block-child block)
                               (str uuid "-" idx)))))])))))

(rum/defcs block-tag <
  (rum/local false ::hover?)
  (rum/local false ::hover-container?)
  [state block tag config popup-opts]
  (let [*hover? (::hover? state)
        *hover-container? (::hover-container? state)
        private-tag? (ldb/private-tags (:db/ident tag))]
    [:div.block-tag
     {:key (str "tag-" (:db/id tag))
      :class (str (when private-tag? "private-tag ")
                  (when @*hover?
                    (if private-tag? "!px-1" "!pl-0")))
      :on-mouse-over #(reset! *hover-container? true)
      :on-mouse-out #(reset! *hover-container? false)}
     [:div.flex.items-center
      {:on-mouse-over #(reset! *hover? true)
       :on-mouse-out #(reset! *hover? false)
       :on-context-menu
       (fn [e]
         (util/stop e)
         (shui/popup-show! e
                           (fn []
                             [:<>
                              (shui/dropdown-menu-item
                               {:key "Go to tag"
                                :on-click #(route-handler/redirect-to-page! (:block/uuid tag))}
                               (str "Go to #" (:block/title tag))
                               (shui/dropdown-menu-shortcut (shortcut-utils/decorate-binding "mod+click")))
                              (shui/dropdown-menu-item
                               {:key "Open tag in sidebar"
                                :on-click #(state/sidebar-add-block! (state/get-current-repo) (:db/id tag) :page)}
                               "Open in sidebar"
                               (shui/dropdown-menu-shortcut (shortcut-utils/decorate-binding "shift+click")))
                              (when-not (ldb/private-tags (:db/ident tag))
                                (shui/dropdown-menu-item
                                 {:key "Remove tag"
                                  :on-click #(db-property-handler/delete-property-value! (:db/id block) :block/tags (:db/id tag))}
                                 "Remove tag"))])
                           popup-opts))}
      (if (and @*hover? (not private-tag?) (not config/publishing?))
        [:a.inline-flex.text-muted-foreground
         {:title "Remove this tag"
          :style {:margin-top 1
                  :padding-left 2
                  :margin-right 2}
          :on-pointer-down
          (fn [e]
            (util/stop e)
            (db-property-handler/delete-property-value! (:db/id block) :block/tags (:db/id tag)))}
         (ui/icon "x" {:size 13})]
        [:a.hash-symbol.select-none.flex
         "#"])
      (page-cp (assoc config
                 :disable-preview? true
                 :tag? true
                 :hide-tag-symbol? true)
               tag)]]))

(rum/defc tags-cp
  "Tags without inline or hidden tags"
  [config block]
  (when (:block/raw-title block)
    (let [hidden-internal-tags (cond-> ldb/internal-tags
                                       (:show-tag-and-property-classes? config)
                                       (set/difference #{:logseq.class/Tag :logseq.class/Property}))
          block-tags (->>
                      (:block/tags block)
                      (remove (fn [t]
                                (or (ldb/inline-tag? (:block/raw-title block) t)
                                    (:logseq.property.class/hide-from-node t)
                                    (contains? hidden-internal-tags (:db/ident t))
                                    (and (util/mobile?) (contains? #{:logseq.class/Task :logseq.class/Journal} (:db/ident t)))))))
          popup-opts {:align :end
                      :content-props {:on-click (fn [] (shui/popup-hide!))
                                      :class "w-60"}}
          tags-count (count block-tags)]
      (when (seq block-tags)
        (if (< tags-count 3)
          [:div.block-tags.gap-1
           (for [tag block-tags]
             (rum/with-key
              (block-tag block tag config popup-opts)
              (str "tag-" (:db/id tag))))]
          [:div.block-tags.cursor-pointer
           {:on-pointer-down (fn [e]
                               (shui/popup-show! e
                                                 (fn []
                                                   (for [tag block-tags]
                                                     [:div.flex.flex-row.items-center.gap-1
                                                      (when-not (ldb/private-tags (:db/ident tag))
                                                        (shui/button
                                                         {:title "Remove tag"
                                                          :variant :ghost
                                                          :class "!p-1 text-muted-foreground"
                                                          :size :sm
                                                          :on-click #(db-property-handler/delete-property-value! (:db/id block) :block/tags (:db/id tag))}
                                                         (ui/icon "X" {:size 14})))
                                                      (page-cp (assoc config
                                                                 :tag? true
                                                                 :disable-preview? true) tag)]))
                                                 popup-opts))}
           (for [tag (take 2 block-tags)]
             [:div.block-tag.pl-2
              {:key (str "tag-" (:db/id tag))}
              (page-cp (assoc config
                         :tag? true
                         :disable-preview? true
                         :disable-click? true) tag)])
           [:div.text-sm.opacity-50.ml-1
            (str "+" (- tags-count 2))]])))))

(rum/defc block-positioned-properties
  [config block position]
  (let [properties (outliner-property/get-block-positioned-properties (db/get-db) (:db/id block) position)
        opts (merge config
                    {:icon? true
                     :page-cp page-cp
                     :block-cp blocks-container
                     :inline-text inline-text
                     :other-position? true
                     :property-position position})]
    (when (seq properties)
      (case position
        :block-below
        [:div.positioned-properties.block-below.flex.flex-row.gap-2.item-center.flex-wrap.text-sm.overflow-x-hidden
         (for [property properties]
           [:div.flex.flex-row.items-center.gap-1
            {:key (str (:db/id block) "-" (:db/id property))}
            [:div.flex.flex-row.items-center
             (property-component/property-key-cp block property opts)
             [:div.select-none ":"]]
            [:div.ls-block.property-value-container
             {:style {:min-height 20}}
             (pv/property-value block property opts)]])]
        [:div.positioned-properties.flex.flex-row.gap-1.select-none.h-6.self-start
         {:class (name position)}
         (for [property properties]
           (rum/with-key
            (pv/property-value block property (assoc opts :show-tooltip? true))
            (str (:db/id block) "-" (:db/id property))))]))))

(rum/defc status-history-cp
  [status-history]
  (let [[sort-desc? set-sort-desc!] (rum/use-state true)]
    [:div.p-2.text-muted-foreground.text-sm.max-h-96
     [:div.font-medium.mb-2.flex.flex-row.gap-2.items-center
      [:div "Status history"]
      (shui/button-ghost-icon (if sort-desc? :arrow-down :arrow-up)
                              {:title "Sort order"
                               :class "text-muted-foreground !h-4 !w-4"
                               :icon-props {:size 14}
                               :on-click #(set-sort-desc! (not sort-desc?))})]
     [:div.flex.flex-col.gap-1
      (for [item (if sort-desc? (reverse status-history) status-history)]
        (let [status (:logseq.property.history/ref-value item)]
          [:div.flex.flex-row.gap-1.items-center.text-sm.justify-between
           [:div.flex.flex-row.gap-1.items-center
            (icon-component/get-node-icon-cp status {:size 14 :color? true})
            [:div (:block/title status)]]
           [:div (date/int->local-time-2 (:block/created-at item))]]))]]))

(rum/defc task-spent-time-cp
  [block]
  (when (and (state/enable-timetracking?) (ldb/class-instance? (db/entity :logseq.class/Task) block))
    (let [[result set-result!] (rum/use-state nil)
          repo (state/get-current-repo)
          [status-history time-spent] result]
      (hooks/use-effect!
       (fn []
         (p/let [result (db-async/<task-spent-time repo (:db/id block))]
           (set-result! result)))
       [(:logseq.property/status block)])
      (when (and time-spent (> time-spent 0))
        [:div.text-sm.time-spent.ml-1
         (shui/button
          {:variant :ghost
           :size :sm
           :class "text-muted-foreground !py-0 !px-1 h-6 font-normal"
           :on-click (fn [e]
                       (shui/popup-show! (.-target e)
                                         (fn [] (status-history-cp status-history))
                                         {:align :end}))}
          (clock/seconds->days:hours:minutes:seconds time-spent))]))))

(rum/defc ^:large-vars/cleanup-todo block-content < rum/reactive
  [config {:block/keys [uuid] :as block} edit-input-id block-id *show-query?]
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph? (state/get-current-repo))
        scheduled (when-not db-based? (:block/scheduled block))
        deadline (when-not db-based? (:block/deadline block))
        format (if db-based? :markdown (or (:block/format block) :markdown))
        pre-block? (when-not db-based? (:block/pre-block? block))
        collapsed? (:collapsed? config)
        content (if db-based?
                  (:block/raw-title block)
                  (property-util/remove-built-in-properties format (:block/raw-title block)))
        content (if (string? content) (string/trim content) "")
        block-ref? (:block-ref? config)
        block (merge block (block/parse-title-and-body uuid format pre-block? content))
        ast-body (:block.temp/ast-body block)
        ast-title (:block.temp/ast-title block)
        block (assoc block :block/title content)
        plugin-slotted? (and config/lsp-enabled? (state/slot-hook-exist? uuid))
        stop-events? (:stop-events? config)
        block-ref-with-title? (and block-ref? (not (state/show-full-blocks?)) (seq ast-title))
        block-type (or
                    (pu/lookup block :logseq.property/ls-type)
                    :default)
        mouse-down-key (if (util/mobile?)
                         :on-click
                         :on-pointer-down)                  ; TODO: it seems that Safari doesn't work well with on-pointer-down
        attrs (cond->
               {:blockid (str uuid)
                :class (util/classnames [{:jtrigger (:property-block? config)
                                          :!cursor-pointer (or (:property? config) (:page-title? config))}])
                :containerid (:container-id config)
                :data-type (name block-type)
                :style {:width "100%"
                        :pointer-events (when stop-events? "none")}}

               (not (string/blank?
                     (pu/lookup block :logseq.property.pdf/hl-color)))
               (assoc :data-hl-color
                      (pu/lookup block :logseq.property.pdf/hl-color))

               (not block-ref?)
               (assoc mouse-down-key (fn [e]
                                       (let [journal-title? (:journal-page? config)]
                                         (cond
                                           (util/right-click? e)
                                           nil

                                           (and journal-title? (gobj/get e "shiftKey"))
                                           (do
                                             (.preventDefault e)
                                             (state/sidebar-add-block! repo (:db/id block) :page))

                                           journal-title?
                                           (do
                                             (.preventDefault e)
                                             (when-not (util/capacitor?)
                                               (route-handler/redirect-to-page! (:block/uuid block))))

                                           (ldb/journal? block)
                                           (.preventDefault e)

                                           :else
                                           (let [f (:on-block-content-pointer-down config)]
                                             (if (fn? f)
                                               (f e)
                                               (block-content-on-pointer-down e block block-id edit-input-id content config))))))))]
    [:div.block-content.inline
     (cond-> {:id (str "block-content-" uuid)
              :key (str "block-content-" uuid)}
             true
             (merge attrs))

     [:<>
      (when (and (> (count content) (state/block-content-max-length (state/get-current-repo)))
                 (not (contains? #{:code} (:logseq.property.node/display-type block))))
        [:div.warning.text-sm
         "Large block will not be editable or searchable to not slow down the app, please use another editor to edit this block."])
      [:div.flex.flex-row.justify-between.block-content-inner
       (when-not plugin-slotted?
         [:div.block-head-wrap
          (block-title config block {:*show-query? *show-query?})])

       (if db-based?
         (task-spent-time-cp block)
         (file-block/clock-summary-cp block ast-body))]

      (when deadline
        (when-let [deadline-ast (block-handler/get-deadline-ast block)]
          (file-block/timestamp-cp block "DEADLINE" deadline-ast)))

      (when scheduled
        (when-let [scheduled-ast (block-handler/get-scheduled-ast block)]
          (file-block/timestamp-cp block "SCHEDULED" scheduled-ast)))

      (when-not (config/db-based-graph? repo)
        (when-let [invalid-properties (:block/invalid-properties block)]
          (invalid-properties-cp invalid-properties)))

      (when (and (not (config/db-based-graph? repo))
                 (seq (:block/properties block))
                 (let [hidden? (property-file/properties-hidden? (:block/properties block))]
                   (not hidden?))
                 (not (and block-ref? (or (seq ast-title) (seq ast-body))))
                 (not= block-type :whiteboard-shape)
                 (not (:table-block-title? config)))
        (properties-cp config block))

      (block-content-inner config block ast-body plugin-slotted? collapsed? block-ref-with-title?)

      (case (:block/warning block)
        :multiple-blocks
        [:p.warning.text-sm "Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]
        nil)]]))

(rum/defc block-refs-count < rum/static
  [block block-refs-count' *hide-block-refs?]
  (when (> block-refs-count' 0)
    [:div.h-6
     (shui/button {:variant :ghost
                   :title "Open block references"
                   :class (str "px-1 py-0 w-5 h-5 opacity-70 hover:opacity-100" (when (and (util/mobile?)
                                                                                           (seq (:block/_parent block)))
                                                                                  " !pr-4"))
                   :size :sm
                   :on-click (fn [e]
                               (if (gobj/get e "shiftKey")
                                 (state/sidebar-add-block!
                                  (state/get-current-repo)
                                  (:db/id block)
                                  :block-ref)
                                 (swap! *hide-block-refs? not)))}
                  [:span.text-sm block-refs-count'])]))

(defn- edit-block-content
  [config block edit-input-id]
  (let [content (:block/title block)]
    (editor-handler/clear-selection!)
    (editor-handler/unhighlight-blocks!)
    (state/set-editing! edit-input-id content block content {:db (db/get-db)
                                                             :container-id (:container-id config)})))

(rum/defc block-content-with-error
  [config block edit-input-id block-id *show-query? editor-box custom-block-content]
  (let [[editing? set-editing!] (hooks/use-state false)
        query (:logseq.property/query block)]
    (ui/catch-error
     (if query
       (if editing?
         (editor-box {:block query
                      :block-id (:block/uuid query)
                      :block-parent-id uuid
                      :format (get block :block/format :markdown)}
                     (str "edit-block-" (:block/uuid query))
                     (assoc config :editor-opts {:on-blur #(set-editing! false)}))
         [:a.text-sm
          {:on-click (fn []
                       (set-editing! true)
                       (editor-handler/edit-block! query :max {:container-id (:container-id config)}))}
          "Click to fix query: "
          (:block/title query)])
       [:div.flex.flex-1.flex-col.w-full.gap-2
        (ui/block-error "Block Render Error:"
                        {:content (or (:block/title query)
                                      (:block/title block))
                         :section-attrs
                         {:on-click #(edit-block-content config block edit-input-id)}})])
     (or custom-block-content (block-content config block edit-input-id block-id *show-query?)))))

(rum/defcs ^:large-vars/cleanup-todo block-content-or-editor < rum/reactive
  [state config {:block/keys [uuid] :as block} {:keys [edit-input-id block-id edit? hide-block-refs-count? refs-count *hide-block-refs? *show-query?]}]
  (let [format (if (config/db-based-graph? (state/get-current-repo))
                 :markdown
                 (or (:block/format block) :markdown))
        editor-box (state/get-component :editor/box)
        editor-id (str "editor-" edit-input-id)
        block-reference-only? (some->
                               (:block/title block)
                               string/trim
                               block-ref/block-ref?)
        named? (some? (:block/name block))
        repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)
        table? (:table? config)
        raw-mode-block (state/sub :editor/raw-mode-block)
        type-block-editor? (and (contains? #{:code} (:logseq.property.node/display-type block))
                                (not= (:db/id block) (:db/id raw-mode-block)))
        config (assoc config :block-parent-id block-id)
        bg-color (pu/lookup block :logseq.property/background-color)]
    [:div.block-content-or-editor-wrap
     (merge
      {:class (util/classnames [{"ls-page-title-container" (:page-title? config)
                                 "px-1 with-bg-color" bg-color}])
       :data-node-type (some-> (:logseq.property.node/display-type block) name)}
      (when bg-color
        (let [built-in-color? (ui/built-in-color? bg-color)]
          {:style {:background-color (if built-in-color?
                                       (str "var(--ls-highlight-color-" bg-color ")")
                                       bg-color)
                   :color (when-not built-in-color? "white")}})))

     (when (and db-based? (not table?)) (block-positioned-properties config block :block-left))
     [:div.block-content-or-editor-inner
      [:div.block-row.flex.flex-1.flex-row.gap-1.items-center
       (let [block-content-f (fn block-content-f
                               [{:keys [custom-block-content]}]
                               [:div.flex.flex-1.w-full.block-content-wrapper
                                {:style {:display "flex"}}
                                (when-let [actions-cp (:page-title-actions-cp config)]
                                  (actions-cp block))
                                (block-content-with-error config block edit-input-id block-id *show-query? editor-box custom-block-content)

                                (when (and (not hide-block-refs-count?)
                                           (not named?)
                                           (not (:table-block-title? config)))
                                  [:div.flex.flex-row.items-center
                                   (when (and (:embed? config)
                                              (:embed-parent config))
                                     [:a.opacity-70.hover:opacity-100.svg-small.inline
                                      {:on-pointer-down (fn [e]
                                                          (util/stop e)
                                                          (when-let [block (:embed-parent config)]
                                                            (editor-handler/edit-block! block :max)))}
                                      svg/edit])

                                   (when block-reference-only?
                                     [:a.opacity-70.hover:opacity-100.svg-small.inline
                                      {:on-pointer-down (fn [e]
                                                          (util/stop e)
                                                          (editor-handler/edit-block! block :max))}
                                      svg/edit])])

                                (when-not (or (:table? config) (:property? config) (:page-title? config))
                                  (block-refs-count block refs-count *hide-block-refs?))])
             editor-cp [:div.editor-wrapper.flex.flex-1.w-full
                        {:id editor-id
                         :class (util/classnames [{:opacity-50 (boolean (or (ldb/built-in? block) (ldb/journal? block)))}])}
                        (ui/catch-error
                         (ui/block-error "Something wrong in the editor" {})
                         (editor-box {:block block
                                      :block-id uuid
                                      :block-parent-id block-id
                                      :format format}
                                     edit-input-id
                                     config))]
             show-editor? (and editor-box edit? (not type-block-editor?))]
         (cond
           (and (ldb/asset? block) (img-audio-video? block))
           [:div.flex.flex-col.asset-block-wrap.w-full
            (block-content-f {:custom-block-content
                              [:div.flex.flex-1
                               (asset-cp config block)]})
            (if show-editor?
              [:div.mt-1 editor-cp]
              [:div.text-xs.opacity-60.mt-1.cursor-text
               {:on-click #(edit-block-content config block edit-input-id)}
               (text-block-title (dissoc config :raw-title?) block)])]

           show-editor?
           editor-cp

           :else
           (block-content-f {})))

       (when-not (:table-block-title? config)
         [:div.ls-block-right.flex.flex-row.items-center.self-start.gap-1
          (when (and db-based? (not table?))
            [:div.opacity-70.hover:opacity-100
             (block-positioned-properties config block :block-right)])

          (when-not (or (:block-ref? config) (:table? config) (:gallery-view? config)
                        (:property? config))
            (when (and db-based? (seq (:block/tags block)))
              (tags-cp (assoc config :block/uuid (:block/uuid block)) block)))])]]]))

(rum/defcs single-block-cp < mixins/container-id
  [state _config block-uuid]
  (let [uuid (if (string? block-uuid) (uuid block-uuid) block-uuid)
        block (db/entity [:block/uuid uuid])
        config {:id (str uuid)
                :container-id (:container-id state)
                :db/id (:db/id block)
                :block/uuid uuid
                :block? true
                :editor-box (state/get-component :editor/box)
                :in-whiteboard? true}]
    (when (:block/title block)
      [:div.single-block
       (block-container config block)])))

(defn non-dragging?
  [e]
  (and (= (gobj/get e "buttons") 1)
       (not (dom/has-class? (gobj/get e "target") "bullet-container"))
       (not (dom/has-class? (gobj/get e "target") "bullet"))
       (not @*dragging?)))

(rum/defc breadcrumb-fragment
  [config block label opts]
  [:a {:on-pointer-down (fn [e]
                          (when (some? (:sidebar-key config)) (util/stop e)))
       :on-pointer-up
       (fn [e]
         (cond
           (gobj/get e "shiftKey")
           (do
             (util/stop e)
             (state/sidebar-add-block!
              (state/get-current-repo)
              (:db/id block)
              :block-ref))

           (util/atom? (:navigating-block opts))
           (do
             (util/stop e)
             (reset! (:navigating-block opts) (:block/uuid block)))

           (some? (:sidebar-key config))
           nil

           :else
           (when-let [uuid (:block/uuid block)]
             (-> (or (:on-redirect-to-page config) route-handler/redirect-to-page!)
                 (apply [(str uuid)])))))}
   label])

(rum/defc breadcrumb-separator
  []
  [:span.opacity-50.px-1
   "/"])

;; "block-id - uuid of the target block of breadcrumb. page uuid is also acceptable"
(rum/defc breadcrumb-aux < rum/reactive
  [config repo block-id {:keys [show-page? indent? end-separator? _navigating-block disabled?]
                         :or {show-page? true}
                         :as opts}]
  (let [from-property (when (and block-id (config/db-based-graph? repo))
                        (:logseq.property/created-from-property (db/entity [:block/uuid block-id])))
        parents (db/get-block-parents repo block-id {:depth 1000})
        parents (cond-> (remove nil? (concat parents [from-property]))
                        (not show-page?)
                        rest)
        config (assoc config
                 :breadcrumb? true
                 :disable-preview? true)]
    (when (seq parents)
      (let [parents-props (doall
                           (for [{:block/keys [uuid name title] :as block} parents]
                             (if name
                               [block (page-cp (cond-> {:disable-preview? true}
                                                       disabled?
                                                       (assoc :disable-click? true))
                                               block) true]
                               (let [result (block/parse-title-and-body
                                             uuid
                                             (get block :block/format :markdown)
                                             (:block/pre-block? block)
                                             title)
                                     ast-body (:block.temp/ast-body result)
                                     ast-title (:block.temp/ast-title result)
                                     config (assoc config :block/uuid uuid)]
                                 [block
                                  (when ast-title
                                    (if (seq ast-title)
                                      (->elem :span (map-inline config ast-title))
                                      (->elem :div (markup-elements-cp config ast-body))))
                                  false]))))
            breadcrumbs (->> parents-props
                             (map (fn [x]
                                    (let [[block label page?] x
                                          label' (if page?
                                                   label
                                                   (breadcrumb-fragment config block label opts))]
                                      (if (:disabled? opts)
                                        label
                                        (rum/with-key label' (str (:block/uuid block)))))))
                             (interpose (breadcrumb-separator)))]
        (when (seq breadcrumbs)
          [:div.breadcrumb.block-parents
           {:class (when (seq breadcrumbs)
                     (str (when-not (or (:search? config) (:list-view? config))
                            " my-2")
                          (when indent?
                            " ml-4")))}
           (when (and (false? (:top-level? config))
                      (seq parents))
             (breadcrumb-separator))
           breadcrumbs
           (when end-separator? (breadcrumb-separator))])))))

(rum/defc breadcrumb
  [config repo block-id {:keys [_show-page? _indent? _end-separator? _navigating-block _disabled?]
                         :as opts}]
  (let [[block set-block!] (hooks/use-state (when (uuid? block-id)
                                              (db/entity [:block/uuid block-id])))]
    (hooks/use-effect!
     (fn []
       (p/let [block (db-async/<get-block (state/get-current-repo)
                                          block-id
                                          {:children? false
                                           :skip-refresh? true})
               _ (when-let [id (:db/id block)]
                   (db-async/<get-block-parents (state/get-current-repo) id 9))]
         (set-block! block)))
     [])
    (when block
      (breadcrumb-aux config repo block-id opts))))

(defn- block-drag-over
  [event uuid top? block-id *move-to']
  (util/stop event)
  (when-not (dnd-same-block? uuid)
    (let [over-block (gdom/getElement block-id)
          rect (utils/getOffsetRect over-block)
          element-top (gobj/get rect "top")
          element-left (gobj/get rect "left")
          x-offset (- (.. event -pageX) element-left)
          cursor-top (gobj/get event "clientY")
          move-to-value (cond
                          (and top? (<= (js/Math.abs (- cursor-top element-top)) 16))
                          :top

                          (> x-offset (if (util/capacitor?) 100 50))
                          :nested

                          :else
                          :sibling)]
      (when-not (= uuid @*dragging-over-block)
        (haptics/haptics))
      (reset! *dragging-over-block uuid)
      (reset! *drag-to-block block-id)
      (reset! *move-to' move-to-value))))

(defn block-drag-end
  ([_event]
   (block-drag-end _event *move-to))
  ([_event *move-to']
   (util/schedule
    (fn []
      (reset! *dragging? false)
      (reset! *dragging-block nil)
      (reset! *dragging-over-block nil)
      (reset! *drag-to-block nil)
      (reset! *move-to' nil)
      (editor-handler/unhighlight-blocks!)))))

(defn- block-drag-leave
  [_event *move-to']
  (reset! *move-to' nil))

(defn- block-drop
  "Block on-drop handler"
  [^js event uuid target-block original-block *move-to']
  (when-not (dnd-same-block? uuid)
    (util/stop-propagation event)
    (haptics/haptics)
    (let [block-uuids (state/get-selection-block-ids)
          lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
          selected (db/pull-many (state/get-current-repo) '[*] lookup-refs)
          blocks (if (seq selected) selected [@*dragging-block])
          blocks (remove-nils blocks)]
      (if (seq blocks)
        ;; dnd block moving in current Logseq instance
        (do
          (dnd/move-blocks event blocks target-block original-block @*move-to')
          (when (util/capacitor?)
            (state/set-state! :mobile/show-action-bar? false)
            (state/clear-selection!)))
        ;; handle DataTransfer
        (let [repo (state/get-current-repo)
              data-transfer (.-dataTransfer event)
              transfer-types (set (js->clj (.-types data-transfer)))]
          (cond
            (contains? transfer-types "text/plain")
            (let [text (.getData data-transfer "text/plain")]
              (editor-handler/api-insert-new-block!
               text
               {:block-uuid uuid
                :edit-block? false
                :sibling? (= @*move-to' :sibling)
                :before? (= @*move-to' :top)}))

            (contains? transfer-types "Files")
            (let [files (.-files data-transfer)
                  format (get target-block :block/format :markdown)]
              ;; When editing, this event will be handled by editor-handler/upload-asset(editor-on-paste)
              (when (and (config/local-file-based-graph? repo) (not (state/editing?)))
                ;; Basically the same logic as editor-handler/upload-asset,
                ;; does not require edting
                (-> (file-editor-handler/file-based-save-assets! repo (js->clj files))
                    (p/then
                     (fn [res]
                       (when-let [[asset-file-name file-obj asset-file-fpath matched-alias] (first res)]
                         (let [image? (config/ext-of-image? asset-file-name)
                               link-content (assets-handler/get-asset-file-link format
                                                                                (if matched-alias
                                                                                  (str
                                                                                   (if image? "../assets/" "")
                                                                                   "@" (:name matched-alias) "/" asset-file-name)
                                                                                  (file-editor-handler/resolve-relative-path (or asset-file-fpath asset-file-name)))
                                                                                (if file-obj (.-name file-obj) (if image? "image" "asset"))
                                                                                image?)]
                           (editor-handler/api-insert-new-block!
                            link-content
                            {:block-uuid uuid
                             :edit-block? false
                             :replace-empty-target? true
                             :sibling? true
                             :before? false}))
                         (recur (rest res))))))))

            :else
            (prn ::unhandled-drop-data-transfer-type transfer-types)))))
    (block-drag-end event *move-to')))

(defonce *block-last-mouse-event (atom nil))

(defn- block-mouse-over
  [^js e block *control-show? block-id doc-mode?]
  (let [mouse-moving? (not= (some-> @*block-last-mouse-event (.-clientY)) (.-clientY e))
        block-dom-node (util/rec-get-node (.-target e) "ls-block")]
    (reset! *control-show? true)
    (when (and mouse-moving?
               (not @*dragging?)
               (not= (:block/uuid block) (:block/uuid (state/get-edit-block))))
      (.preventDefault e)
      (when-let [parent (gdom/getElement block-id)]
        (let [node (.querySelector parent ".bullet-container")]
          (when doc-mode?
            (dom/remove-class! node "hide-inner-bullet"))))
      (when (non-dragging? e)
        (when-let [container (gdom/getElement "app-container-wrapper")]
          (dom/add-class! container "blocks-selection-mode"))
        (editor-handler/highlight-selection-area! block-id block-dom-node {:append? true})))))

(defn- block-mouse-leave
  [*control-show? block-id doc-mode?]
  (reset! *control-show? false)
  (when doc-mode?
    (when-let [parent (gdom/getElement block-id)]
      (when-let [node (.querySelector parent ".bullet-container")]
        (dom/add-class! node "hide-inner-bullet")))))

(defn- on-drag-and-mouse-attrs
  [block original-block uuid top? block-id *move-to']
  (when-not (ldb/journal? block)
    {:on-drag-enter (fn [event]
                      (.preventDefault event))
     :on-drag-over (fn [event]
                     (block-drag-over event uuid top? block-id *move-to'))
     :on-drag-leave (fn [event]
                      (block-drag-leave event *move-to'))
     :on-drop (fn [event]
                (block-drop event uuid block original-block *move-to'))
     :on-drag-end (fn [event]
                    (doseq [block (or (seq (state/get-selection-blocks)) [(.-target event)])]
                      (dom/remove-class! block "dragging"))
                    (dom/remove! js/document.body (dom/sel1 "#dragging-ghost-element"))
                    (block-drag-end event *move-to'))}))

(defn- root-block?
  [config block]
  (and (:block? config)
       (util/collapsed? block)
       (= (:id config)
          (str (:block/uuid block)))))

(defn- build-config
  [config block {:keys [navigating-block navigated?]}]
  (cond-> config
          navigated?
          (assoc :id (str navigating-block))

          true
          (assoc :block block)

          ;; Each block might have multiple queries, but we store only the first query's result.
          ;; This :query-result atom is used by the query function feature to share results between
          ;; the parent's query block and the children blocks. This works because config is shared
          ;; between parent and children blocks
          (nil? (:query-result config))
          (assoc :query-result (atom nil))

          true
          (block-handler/attach-order-list-state block)

          (nil? (:level config))
          (assoc :level 0)))

(defn- build-block
  [config block* {:keys [navigating-block navigated?]}]
  (let [linked-block (:block/link (db/entity (:db/id block*)))
        block (cond
                (or (and (:custom-query? config)
                         (nil? (first (:block/_parent block*)))
                         (not (and (:dsl-query? config)
                                   (string/includes? (:query config) "not"))))
                    navigated?)
                (db/entity [:block/uuid navigating-block])

                (:loop-linked? config)
                block*

                linked-block
                linked-block

                :else
                block*)
        result (or (db/sub-block (:db/id block)) block*)]
    (if linked-block
      [block* result]
      [nil result])))

(rum/defcs ^:large-vars/cleanup-todo block-container-inner-aux < rum/reactive db-mixins/query
                                                                 {:init (fn [state]
                                                                          (let [*ref (atom nil)
                                                                                [_container-state _repo config block] (:rum/args state)
                                                                                current-block-page? (= (str (:block/uuid block)) (state/get-current-page))
                                                                                embed-self? (and (:embed? config)
                                                                                                 (= (:block/uuid block) (:block/uuid (:block config))))
                                                                                default-hide? (or (not (and current-block-page? (not embed-self?) (state/auto-expand-block-refs?)))
                                                                                                  (= (str (:id config)) (str (:block/uuid block))))
                                                                                *refs-count (atom nil)]
                                                                            (when-not (or (:view? config) (ldb/page? block))
                                                                              (when-let [id (:db/id block)]
                                                                                (p/let [count (db-async/<get-block-refs-count (state/get-current-repo) id)]
                                                                                  (reset! *refs-count count))))
                                                                            (assoc state
                                                                              ::ref *ref
                                                                              ::hide-block-refs? (atom default-hide?)
                                                                              ::show-query? (atom false)
                                                                              ::refs-count *refs-count)))}
                                                                 (mixins/event-mixin
                                                                  (fn [state]
                                                                    (let [*ref (::ref state)]
                                                                      ;; React doesn't let us directly control passive via onTouchMove
                                                                      ;; So here we listen `touchmove` on the block node
                                                                      (mixins/listen state @*ref "touchmove" block-handler/on-touch-move))))
  [state container-state repo config* block {:keys [navigating-block navigated? editing? selected?] :as opts}]
  (let [*ref (::ref state)
        *hide-block-refs? (get state ::hide-block-refs?)
        *show-query? (get state ::show-query?)
        show-query? (rum/react *show-query?)
        *refs-count (get state ::refs-count)
        hide-block-refs? (rum/react *hide-block-refs?)
        refs-count (rum/react *refs-count)
        [original-block block] (build-block config* block {:navigating-block navigating-block :navigated? navigated?})
        config* (if original-block
                  (assoc config* :original-block original-block)
                  config*)
        ref? (:ref? config*)
        ;; whiteboard block shape
        in-whiteboard? (and (:in-whiteboard? config*)
                            (= (:id config*)
                               (str (:block/uuid block))))
        edit-input-id (str "edit-block-" (:block/uuid block))
        container-id (:container-id config*)
        table? (:table? config*)
        property? (:property? config*)
        custom-query? (boolean (:custom-query? config*))
        ref-or-custom-query? (or ref? custom-query?)
        *navigating-block (get container-state ::navigating-block)
        {:block/keys [uuid pre-block? title]} block
        config (build-config config* block {:navigated? navigated? :navigating-block navigating-block})
        level (:level config)
        *control-show? (get container-state ::control-show?)
        db-collapsed? (util/collapsed? block)
        collapsed? (cond
                     (or ref-or-custom-query?
                         (:view? config)
                         (root-block? config block)
                         (and (or (ldb/class? block) (ldb/property? block)) (:page-title? config)))
                     (state/sub-block-collapsed uuid)

                     :else
                     db-collapsed?)
        config (assoc config :collapsed? collapsed?)
        breadcrumb-show? (:breadcrumb-show? config)
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        page-embed? (:page-embed? config)
        reference? (:reference? config)
        whiteboard-block? (pu/shape-block? block)
        block-id (str "ls-block-" uuid)
        has-child? (first (:block/_parent (db/entity (:db/id block))))
        top? (:top? config)
        original-block (:original-block config)
        attrs (on-drag-and-mouse-attrs block original-block uuid top? block-id *move-to)
        own-number-list? (:own-order-number-list? config)
        order-list? (boolean own-number-list?)
        children (ldb/get-children block)
        db-based? (config/db-based-graph? repo)
        page-icon (when (:page-title? config)
                    (let [icon' (get block (pu/get-pid :logseq.property/icon))]
                      (when-let [icon (and (ldb/page? block)
                                           (or icon'
                                               (some :logseq.property/icon (:block/tags block))
                                               (when (ldb/class? block)
                                                 {:type :tabler-icon
                                                  :id "hash"})
                                               (when (ldb/property? block)
                                                 {:type :tabler-icon
                                                  :id "letter-p"})))]
                        [:div.ls-page-icon.flex.self-start
                         (icon-component/icon-picker icon
                                                     {:on-chosen (fn [_e icon]
                                                                   (if icon
                                                                     (db-property-handler/set-block-property!
                                                                      (:db/id block)
                                                                      (pu/get-pid :logseq.property/icon)
                                                                      (select-keys icon [:id :type :color]))
                                                                     ;; del
                                                                     (db-property-handler/remove-block-property!
                                                                      (:db/id block)
                                                                      (pu/get-pid :logseq.property/icon))))
                                                      :del-btn? (boolean icon')
                                                      :icon-props {:style {:width "1lh"
                                                                           :height "1lh"
                                                                           :font-size (cond
                                                                                        (and (util/mobile?) (:page-title? config)) 24
                                                                                        (:page-title? config) 38
                                                                                        :else 18)}}})])))]
    [:div.ls-block.swipe-item
     (cond->
      {:id (str "ls-block-"
                ;; container-id "-"
                uuid)
       :blockid (str uuid)
       :containerid container-id
       :data-is-property (ldb/property? block)
       :ref #(when (nil? @*ref) (reset! *ref %))
       :data-collapsed (and collapsed? has-child?)
       :class (str (when selected? "selected")
                   (when pre-block? " pre-block")
                   (when order-list? " is-order-list")
                   (when (string/blank? title) " is-blank")
                   (when original-block " embed-block"))
       :haschild (str (boolean has-child?))
       :on-touch-start (fn [event uuid]
                         (when-not (or @*dragging? (state/editing?))
                           (block-handler/on-touch-start event uuid)))
       :on-touch-end (fn [event]
                       (when-not @*dragging?
                         (block-handler/on-touch-end event))
                       (reset! *dragging? false))
       :on-touch-cancel (fn [e]
                          (block-handler/on-touch-cancel e))}

      (and (util/capacitor?) (not (ldb/page? block)))
      (assoc
        :draggable true
        :on-drag-start
        (fn [event]
          (when-not (state/editing?)
            (util/stop-propagation event)
            (let [target ^js (.-target event)
                  blocks (or (seq (state/get-selection-blocks)) [target])
                  multiple? (> (count blocks) 1)
                  element (when multiple?
                            (let [element (dom/create-element "div")]
                              (-> element
                                  (dom/set-attr! "id" "dragging-ghost-element")
                                  (dom/set-text! (str "Moving " (count blocks) " blocks"))
                                  (dom/set-class! "p-2 rounded text-sm"))
                              element))]
              (doseq [block blocks]
                (dom/add-class! block "dragging"))
              (on-drag-start event block block-id)
              (when element
                (dom/append! js/document.body element)
                (dnd/set-drag-image! event element (/ (.-offsetWidth target) 2) (/ (.-offsetHeight target) 2)))))))

      (:property-default-value? config)
      (assoc :data-is-property-default-value (:property-default-value? config))

      original-block
      (assoc :originalblockid (str (:block/uuid original-block)))

      level
      (assoc :level level)

      true
      (merge attrs)

      (or reference? (and embed? (not page-embed?)))
      (assoc :data-transclude true)

      embed?
      (assoc :data-embed true)

      custom-query?
      (assoc :data-query true))

     (when (and ref? breadcrumb-show? (not (or table? property?)))
       (breadcrumb config repo uuid {:show-page? false
                                     :indent? true
                                     :navigating-block *navigating-block}))

     ;; only render this for the first block in each container
     (when (and top? (not (or table? property?)))
       (dnd-separator-wrapper block block-id true))

     (when-not (:hide-title? config)
       [:div.block-main-container.flex.flex-row.gap-1
        {:style (when (and db-based? (:page-title? config))
                  {:margin-left (cond
                                  (util/mobile?) 0
                                  page-icon -36
                                  :else -30)})
         :data-has-heading (some-> block (pu/lookup :logseq.property/heading))
         :on-mouse-enter (fn [e]
                           (block-mouse-over e block *control-show? block-id doc-mode?))
         :on-mouse-move (fn [e]
                          (reset! *block-last-mouse-event e))
         :on-mouse-leave (fn [_e]
                           (block-mouse-leave *control-show? block-id doc-mode?))}

        (when (and (not in-whiteboard?) (not property?) (not (:table-block-title? config)))
          (let [edit? (or editing?
                          (= uuid (:block/uuid (state/get-edit-block))))]
            (block-control (assoc config :hide-bullet? (:page-title? config))
                           block
                           (merge opts
                                  {:uuid uuid
                                   :block-id block-id
                                   :collapsed? collapsed?
                                   :*control-show? *control-show?
                                   :edit? edit?}))))

        [:div.flex.flex-col.w-full
         [:div.block-main-content.flex.flex-row.gap-2
          (when page-icon
            page-icon)

          (if whiteboard-block?
            (block-reference {} (str uuid) nil)
            ;; Not embed self
            [:div.flex.flex-col.w-full
             (let [block (merge block (block/parse-title-and-body uuid (get block :block/format :markdown) pre-block? title))
                   hide-block-refs-count? (or (and (:embed? config)
                                                   (= (:block/uuid block) (:embed-id config)))
                                              table?)]
               (block-content-or-editor config
                                        block
                                        {:edit-input-id edit-input-id
                                         :block-id block-id
                                         :edit? editing?
                                         :refs-count refs-count
                                         :*hide-block-refs? *hide-block-refs?
                                         :hide-block-refs-count? hide-block-refs-count?
                                         :*show-query? *show-query?}))])]

         (when (and db-based? (not collapsed?) (not (or table? property?)))
           (block-positioned-properties config block :block-below))]])

     (when (and db-based?
                (not (:library? config))
                (or (:tag-dialog? config)
                    (and
                     (not collapsed?)
                     (not (or table? property?)))))
       [:div (when-not (:page-title? config) {:style {:padding-left (if (util/mobile?) 12 45)}})
        (db-properties-cp config block {:in-block-container? true})])

     (when (and db-based? show-query? (not (:table? config)))
       (let [query? (ldb/class-instance? (entity-plus/entity-memoized (db/get-db) :logseq.class/Query) block)
             query (:logseq.property/query block)
             advanced-query? (and query? (= :code (:logseq.property.node/display-type query)))]
         [:div.ml-6.my-1
          (if advanced-query?
            (src-cp (assoc config :code-block query) {:language "clojure"})
            [:div
             [:div.opacity-75.ml-5.text-sm.mb-1 "Set query:"]
             (block-container config query)])]))

     (when (and (not (or (:table? config) (:property? config)))
                (not hide-block-refs?)
                (> refs-count 0)
                (not (:page-title? config)))
       (when-let [refs-cp (state/get-component :block/linked-references)]
         [:div.px-4.py-2.border.rounded.my-2.shadow-xs {:style {:margin-left 42}}
          (refs-cp block {})]))

     (when (and db-based? (not collapsed?) (not (or table? property?))
                (ldb/class-instance? (entity-plus/entity-memoized (db/get-db) :logseq.class/Query) block))
       (let [query-block (:logseq.property/query (db/entity (:db/id block)))
             query-block (if query-block (db/sub-block (:db/id query-block)) query-block)
             query (:block/title query-block)
             result (common-util/safe-read-string {:log-error? false} query)
             advanced-query? (map? result)]
         (when query-block
           [:div {:style {:padding-left 42}}
            (query/custom-query (wrap-query-components (assoc config
                                                         :dsl-query? (not advanced-query?)
                                                         :cards? (ldb/class-instance? (entity-plus/entity-memoized
                                                                                       (db/get-db)
                                                                                       :logseq.class/Cards) block)))
                                (if advanced-query? result {:builder nil
                                                            :query (query-builder-component/sanitize-q query)}))])))

     (when-not (or (:hide-children? config) in-whiteboard? (or table? property?))
       (let [config' (-> (update config :level inc)
                         (dissoc :original-block :data))]
         (block-children config' block children collapsed?)))

     (when-not (or in-whiteboard? table? property?)
       (dnd-separator-wrapper block block-id false))]))

(rum/defc block-container-inner
  [container-state repo config* block opts]
  (let [container-id (:container-id config*)
        block-id (:block/uuid block)
        v1 (state/sub-editing? [container-id block-id])
        v2 (state/sub-editing? [:unknown-container block-id])
        selected? (state/sub-block-selected? block-id)
        editing? (or v1 v2)]
    (block-container-inner-aux container-state repo config* block (assoc opts
                                                                    :editing? editing?
                                                                    :selected? selected?))))

(defn- block-changed?
  [old-block new-block]
  (not= (:block/tx-id old-block) (:block/tx-id new-block)))

(defn- config-block-should-update?
  [old-state new-state]
  (let [config-compare-keys [:show-cloze? :hide-children? :own-order-list-type :own-order-list-index :original-block :edit? :hide-bullet? :ref-matched-children-ids]
        b1 (second (:rum/args old-state))
        b2 (second (:rum/args new-state))
        result (or
                (block-changed? b1 b2)
                ;; config changed
                (not= (select-keys (first (:rum/args old-state)) config-compare-keys)
                      (select-keys (first (:rum/args new-state)) config-compare-keys)))]
    (boolean result)))

(defn- set-collapsed-block!
  [block-id v]
  (if (false? v)
    (editor-handler/expand-block! block-id {:skip-db-collpsing? true})
    (state/set-collapsed-block! block-id v)))

(rum/defcs loaded-block-container < rum/reactive db-mixins/query
                                    (rum/local false ::show-block-left-menu?)
                                    (rum/local false ::show-block-right-menu?)
                                    {:should-update config-block-should-update?}
                                    {:init (fn [state]
                                             (let [[config block] (:rum/args state)
                                                   block-id (:block/uuid block)
                                                   linked-block? (or (:block/link block)
                                                                     (:original-block config))]
                                               (when-not (:property-block? config)
                                                 (cond
                                                   (and (:page-title? config) (or (ldb/class? block) (ldb/property? block)) (not config/publishing?))
                                                   (let [collapsed? (state/get-block-collapsed block-id)]
                                                     (set-collapsed-block! block-id (if (some? collapsed?) collapsed? true)))

                                                   (root-block? config block)
                                                   (set-collapsed-block! block-id false)

                                                   (or (:view? config) (:ref? config) (:custom-query? config))
                                                   (set-collapsed-block! block-id
                                                                         (boolean (editor-handler/block-default-collapsed? block config)))

                                                   :else
                                                   nil))
                                               (cond->
                                                (assoc state
                                                  ::control-show? (atom false)
                                                  ::navigating-block (atom (:block/uuid block)))
                                                (or linked-block? (nil? (:container-id config)))
                                                (assoc ::container-id (state/get-next-container-id)))))
                                     :will-unmount (fn [state]
                                                     ;; restore root block's collapsed state
                                                     (let [[config block] (:rum/args state)
                                                           block-id (:block/uuid block)]
                                                       (when (root-block? config block)
                                                         (set-collapsed-block! block-id nil)))
                                                     state)}
  [state config block & {:as opts}]
  (let [repo (state/get-current-repo)
        *navigating-block (get state ::navigating-block)
        navigating-block (rum/react *navigating-block)
        navigated? (and (not= (:block/uuid block) navigating-block) navigating-block)
        config' (->
                 (if-let [container-id (::container-id state)]
                   (assoc config :container-id container-id)
                   config)
                 (assoc :block/uuid (:block/uuid block)))]
    (when (:block/uuid block)
      (rum/with-key
       (block-container-inner state repo config' block
                              (merge
                               opts
                               {:navigating-block navigating-block :navigated? navigated?}))
       (str "block-inner-"
            (:container-id config)
            "-"
            (:block/uuid block))))))

(rum/defc block-container
  [config block* & {:as opts}]
  (let [[block set-block!] (hooks/use-state block*)
        id (or (:db/id block*) (:block/uuid block*))]
    (when-not (or (:page-title? config)
                  (:view? config))
      (hooks/use-effect!
       (fn []
         (p/let [block (db-async/<get-block (state/get-current-repo)
                                            id
                                            {:children? (not
                                                         (if-some [result (state/get-block-collapsed (:block/uuid block))]
                                                           result
                                                           (:block/collapsed? block)))
                                             :skip-refresh? false})]
           (set-block! block)))
       []))
    (when (or (:view? config) (:block/title block))
      (loaded-block-container config block opts))))

(defn divide-lists
  [[f & l]]
  (loop [l l
         ordered? (:ordered f)
         result [[f]]]
    (if (seq l)
      (let [cur (first l)
            cur-ordered? (:ordered cur)]
        (if (= ordered? cur-ordered?)
          (recur
           (rest l)
           cur-ordered?
           (update result (dec (count result)) conj cur))
          (recur
           (rest l)
           cur-ordered?
           (conj result [cur]))))
      result)))

(defn list-element
  [l]
  (match l
         [l1 & _tl]
         (let [{:keys [ordered name]} l1]
           (cond
             (seq name)
             :dl
             ordered
             :ol
             :else
             :ul))

         :else
         :ul))

(defn list-item
  [config {:keys [name content checkbox items number] :as _list}]
  (let [content (when-not (empty? content)
                  (match content
                         [["Paragraph" i] & rest']
                         (vec-cat
                          (map-inline config i)
                          (markup-elements-cp config rest'))
                         :else
                         (markup-elements-cp config content)))
        checked? (some? checkbox)
        items (when (seq items)
                (->elem
                 (list-element items)
                 (for [item items]
                   (list-item config item))))]
    (cond
      (seq name)
      [:dl {:checked checked?}
       [:dt (map-inline config name)]
       (->elem :dd
               (vec-cat content [items]))]

      :else
      (if (nil? checkbox)
        (->elem
         :li
         (cond->
          {:checked checked?}
          number
          (assoc :value number))
         (vec-cat
          [(->elem
            :p
            content)]
          [items]))
        (->elem
         :li
         {:checked checked?}
         (vec-cat
          [(->elem
            :p
            (list-checkbox config checkbox)
            content)]
          [items]))))))

(defn table
  [config {:keys [header groups col_groups]}]

  (let [tr (fn [elm cols]
             (->elem
              :tr
              (mapv (fn [col]
                      (->elem
                       elm
                       {:scope "col"
                        :class "org-left"}
                       (map-inline config col)))
                    cols)))
        tb-col-groups (try
                        (mapv (fn [number]
                                (let [col-elem [:col {:class "org-left"}]]
                                  (->elem
                                   :colgroup
                                   (repeat number col-elem))))
                              col_groups)
                        (catch :default _e
                          []))
        head (when header
               [:thead (tr :th header)])
        groups (mapv (fn [group]
                       (->elem
                        :tbody
                        (mapv #(tr :td %) group)))
                     groups)]
    [:div.table-wrapper.classic-table.force-visible-scrollbar.markdown-table
     (->elem
      :table
      {:class "table-auto"
       :border 2
       :cell-spacing 0
       :cell-padding 6
       :rules "groups"
       :frame "hsides"}
      (vec-cat
       tb-col-groups
       (cons head groups)))]))

(defn logbook-cp
  [log]
  (let [clocks (filter #(string/starts-with? % "CLOCK:") log)
        clocks (reverse (sort-by str clocks))]
    ;; TODO: display states change log
    ; states (filter #(not (string/starts-with? % "CLOCK:")) log)

    (when (seq clocks)
      (let [tr (fn [elm cols] (->elem :tr
                                      (mapv (fn [col] (->elem elm col)) cols)))
            head [:thead.overflow-x-scroll (tr :th.py-0 ["Type" "Start" "End" "Span"])]
            clock-tbody (->elem
                         :tbody.overflow-scroll.sm:overflow-auto
                         (mapv (fn [clock]
                                 (let [cols (->> (string/split clock #": |--|=>")
                                                 (map string/trim))]
                                   (mapv #(tr :td.py-0 %) [cols])))
                               clocks))]
        [:div.overflow-x-scroll.sm:overflow-auto
         (->elem
          :table.m-0
          {:class "logbook-table"
           :border 0
           :style {:width "max-content"}
           :cell-spacing 15}
          (cons head [clock-tbody]))]))))

(defn map-inline
  [config col]
  (map #(inline config %) col))

(rum/defc inline-title
  [config title]
  (map-inline config
              (gp-mldoc/inline->edn title
                                    (mldoc/get-default-config :markdown))))

(declare ->hiccup)

(defn- get-code-mode-by-lang
  [lang]
  (some (fn [m] (when (= (.-name m) lang) (.-mode m))) js/window.CodeMirror.modeInfo))

(rum/defc src-lang-picker
  [block on-select!]
  (when-let [langs (map (fn [m] (.-name m)) js/window.CodeMirror.modeInfo)]
    (let [options (map (fn [lang] {:label lang :value lang}) langs)]
      (select/select {:items options
                      :input-default-placeholder "Choose language"
                      :on-chosen
                      (fn [chosen _ _ e]
                        (let [lang (:value chosen)]
                          (when (and (= :code (:logseq.property.node/display-type block))
                                     (not= lang (:logseq.property.code/lang block)))
                            (on-select! lang e)))
                        (shui/popup-hide!))}))))

(rum/defc src-cp < rum/static
  [config options]
  (let [block (or (:code-block config) (:block config))
        container-id (:container-id config)
        *mode-ref (hooks/use-ref nil)
        *actions-ref (hooks/use-ref nil)]

    (when options
      (let [html-export? (:html-export? config)
            {:keys [lines language]} options
            attr (when language
                   {:data-lang language})
            code (if lines (apply str lines) (:block/title block))
            [inside-portal? set-inside-portal?] (rum/use-state nil)]
        (cond
          html-export?
          (highlight/html-export attr code)

          :else
          (let [language (if (contains? #{"edn" "clj" "cljc" "cljs" "clojurescript"} language) "clojure" language)]
            [:div.ui-fenced-code-editor.flex.w-full
             {:ref (fn [el]
                     (set-inside-portal? (and el (whiteboard-handler/inside-portal? el))))
              :on-mouse-over #(dom/add-class! (hooks/deref *actions-ref) "!opacity-100")
              :on-mouse-leave (fn [e]
                                (when (dom/has-class? (.-target e) "code-editor")
                                  (dom/remove-class! (hooks/deref *actions-ref) "!opacity-100")))}
             (cond
               (nil? inside-portal?) nil

               inside-portal?
               (highlight/highlight (str (random-uuid))
                                    {:class (str "language-" language)
                                     :data-lang language}
                                    code)

               :else
               [:div.ls-code-editor-wrap
                [:div.code-block-actions
                 {:ref *actions-ref}
                 (shui/button
                  {:variant :text
                   :size :sm
                   :class "select-language"
                   :ref *mode-ref
                   :containerid (str container-id)
                   :blockid (str (:block/uuid block))
                   :on-click (fn [^js e]
                               (util/stop-propagation e)
                               (let [target (.-target e)]
                                 (shui/popup-show! target
                                                   #(src-lang-picker block
                                                                     (fn [lang ^js _e]
                                                                       (when-let [^js cm (util/get-cm-instance (util/rec-get-node target "ls-block"))]
                                                                         (if-let [mode (get-code-mode-by-lang lang)]
                                                                           (.setOption cm "mode" mode)
                                                                           (throw (ex-info "code mode not found"
                                                                                           {:lang lang})))
                                                                         (db/transact! [(ldb/kv :logseq.kv/latest-code-lang lang)])
                                                                         (db-property-handler/set-block-property!
                                                                          (:db/id block) :logseq.property.code/lang lang))))
                                                   {:align :end})))}
                  (or language "Choose language")
                  (ui/icon "chevron-down"))
                 (shui/button
                  {:variant :text
                   :size :sm
                   :on-click (fn [^js e]
                               (util/stop-propagation e)
                               (when-let [^js cm (util/get-cm-instance (util/rec-get-node (.-target e) "ls-block"))]
                                 (util/copy-to-clipboard! (.getValue cm))
                                 (notification/show! "Copied!" :success)))}
                  (ui/icon "copy")
                  "Copy")]
                (lazy-editor/editor config (str (d/squuid)) attr code options)
                (let [options (:options options) block (:block config)]
                  (when (and (= language "clojure") (contains? (set options) ":results"))
                    (sci/eval-result code block)))])]))))))

(defn ^:large-vars/cleanup-todo markup-element-cp
  [{:keys [html-export?] :as config} item]
  (try
    (match item
           ["Drawer" name lines]
           (when (or (not= name "logbook")
                     (and
                      (= name "logbook")
                      (state/enable-timetracking?)
                      (or (get-in (state/get-config) [:logbook/settings :enabled-in-all-blocks])
                          (when (get-in (state/get-config)
                                        [:logbook/settings :enabled-in-timestamped-blocks] true)
                            (or (:block/scheduled (:block config))
                                (:block/deadline (:block config)))))))
             [:div
              [:div.text-sm
               [:div.drawer {:data-drawer-name name}
                (ui/foldable
                 [:div.opacity-50.font-medium.logbook
                  (util/format ":%s:" (string/upper-case name))]
                 [:div.opacity-50.font-medium
                  (if (= name "logbook")
                    (logbook-cp lines)
                    (apply str lines))
                  [:div ":END:"]]
                 {:default-collapsed? true
                  :title-trigger? true})]]])

           ;; for file-level property in orgmode: #+key: value
           ;; only display caption. https://orgmode.org/manual/Captions.html.
           ["Directive" key value]
           [:div.file-level-property
            (when (contains? #{"caption"} (string/lower-case key))
              [:span.font-medium
               [:span.font-bold (string/upper-case key)]
               (str ": " value)])]

           ["Paragraph" l]
           ;; TODO: speedup
           (if (util/safe-re-find #"\"Export_Snippet\" \"embed\"" (str l))
             (->elem :div (map-inline config l))
             (->elem :div.is-paragraph (map-inline config l)))

           ["Horizontal_Rule"]
           [:hr]
           ["Heading" h]
           (block-container config h)
           ["List" l]
           (let [lists (divide-lists l)]
             (if (= 1 (count lists))
               (let [l (first lists)]
                 (->elem
                  (list-element l)
                  (map #(list-item config %) l)))
               [:div.list-group
                (for [l lists]
                  (->elem
                   (list-element l)
                   (map #(list-item config %) l)))]))
           ["Table" t]
           (table config t)
           ["Math" s]
           (if html-export?
             (latex/html-export s true true)
             (latex/latex s true true))
           ["Example" l]
           [:pre.pre-wrap-white-space
            (join-lines l)]
           ["Quote" l]
           (if (config/db-based-graph? (state/get-current-repo))
             [:div.warning "#+BEGIN_QUOTE is deprecated. Use '/Quote' command instead."]
             (->elem
              :blockquote
              (markup-elements-cp config l)))
           ["Raw_Html" content]
           (when (not html-export?)
             [:div.raw_html {:dangerouslySetInnerHTML
                             {:__html (security/sanitize-html content)}}])
           ["Export" "html" _options content]
           (when (not html-export?)
             [:div.export_html {:dangerouslySetInnerHTML
                                {:__html (security/sanitize-html content)}}])
           ["Hiccup" content]
           (ui/catch-error
            [:div.warning {:title "Invalid hiccup"}
             content]
            [:div.hiccup_html {:dangerouslySetInnerHTML
                               {:__html (hiccup->html content)}}])

           ["Export" "latex" _options content]
           (if html-export?
             (latex/html-export content true false)
             (if (config/db-based-graph? (state/get-current-repo))
               [:div.warning "'#+BEGIN_EXPORT latex' is deprecated. Use '/Math block' command instead."]
               (latex/latex content true false)))

           ["Custom" "query" _options _result content]
           (if (config/db-based-graph? (state/get-current-repo))
             [:div.warning "#+BEGIN_QUERY is deprecated. Use '/Advanced Query' command instead."]
             (try
               (let [query (common-util/safe-read-map-string content)]
                 (query/custom-query (wrap-query-components config) query))
               (catch :default e
                 (log/error :read-string-error e)
                 (ui/block-error "Invalid query:" {:content content}))))

           ["Custom" "note" _options result _content]
           (ui/admonition "note" (markup-elements-cp config result))

           ["Custom" "tip" _options result _content]
           (ui/admonition "tip" (markup-elements-cp config result))

           ["Custom" "important" _options result _content]
           (ui/admonition "important" (markup-elements-cp config result))

           ["Custom" "caution" _options result _content]
           (ui/admonition "caution" (markup-elements-cp config result))

           ["Custom" "warning" _options result _content]
           (ui/admonition "warning" (markup-elements-cp config result))

           ["Custom" "pinned" _options result _content]
           (ui/admonition "pinned" (markup-elements-cp config result))

           ["Custom" "center" _options l _content]
           (->elem
            :div.text-center
            (markup-elements-cp config l))

           ["Custom" name _options l _content]
           (->elem
            :div
            {:class name}
            (markup-elements-cp config l))

           ["Latex_Fragment" l]
           [:p.latex-fragment
            (inline config ["Latex_Fragment" l])]

           ["Latex_Environment" name option content]
           (let [content (latex-environment-content name option content)]
             (if html-export?
               (latex/html-export content true true)
               (latex/latex content true true)))

           ["Displayed_Math" content]
           (if html-export?
             (latex/html-export content true true)
             (latex/latex content true true))

           ["Footnote_Definition" name definition]
           (let [id (util/url-encode name)]
             [:div.footdef
              [:div.footpara
               (conj
                (markup-element-cp config ["Paragraph" definition])
                [:a.ml-1 {:id (str "fn." id)
                          :style {:font-size 14}
                          :class "footnum"
                          :on-click #(route-handler/jump-to-anchor! (str "fnr." id))}
                 [:sup.fn (str name "↩︎")]])]])

           ["Src" options]
           (let [lang (util/safe-lower-case (:language options))]
             [:div.cp__fenced-code-block
              {:data-lang lang}
              (if-let [opts (plugin-handler/hook-fenced-code-by-lang lang)]
                [:div.ui-fenced-code-wrap
                 (src-cp config options)
                 (plugins/hook-ui-fenced-code (:block config) (string/join "" (:lines options)) opts)]
                (src-cp config options))])

           :else
           "")
    (catch :default e
      (println "Convert to html failed, error: " e)
      "")))

(defn markup-elements-cp
  [config col]
  (map #(markup-element-cp config %) col))

(rum/defc block-item <
  {:should-update config-block-should-update?}
  [config item {:keys [top? bottom?]}]
  (let [original-block item
        linked-block (:block/link item)
        loop-linked? (and linked-block (contains? (:links config) (:db/id linked-block)))
        config (if linked-block
                 (-> (assoc config :original-block original-block)
                     (update :links (fn [ids] (conj (or ids #{}) (:db/id linked-block)))))
                 config)
        item (or (if loop-linked? item linked-block) item)
        item (dissoc item :block/meta)
        config' (assoc config
                  :loop-linked? loop-linked?)]
    (when-not (and loop-linked? (:block/name linked-block))
      (rum/with-key (block-container config' item
                                     (when (not (:block-children? config))
                                       {:top? top?
                                        :bottom? bottom?}))
                    (str
                     (:container-id config)
                     "-"
                     (:block/uuid item)
                     (when linked-block
                       (str "-" (:block/uuid original-block))))))))

(rum/defc block-list
  [config blocks]
  (let [mobile? (util/mobile?)
        [ready? set-ready?] (hooks/use-state
                             (not (and mobile? (not (:journals? config)))))
        [virtualized? _] (hooks/use-state (not (or (util/rtc-test?)
                                                   (if (:journals? config)
                                                     (< (count blocks) 50)
                                                     (< (count blocks) 10))
                                                   (and (:block-children? config)
                                                        ;; zoom-in block's children
                                                        (not (and (:id config) (= (:id config) (str (:block/uuid (:block/parent (first blocks)))))))))))
        render-item (fn [idx]
                      (let [top? (zero? idx)
                            bottom? (= (dec (count blocks)) idx)
                            block (nth blocks idx)]
                        (block-item (assoc config :top? top?)
                                    block
                                    {:top? top?
                                     :bottom? bottom?})))
        virtualized? (and virtualized? (seq blocks))
        *virtualized-ref (hooks/use-ref nil)
        virtual-opts (when virtualized?
                       {:ref *virtualized-ref
                        :custom-scroll-parent (or (:scroll-container config)
                                                  (if-let [node (js/document.getElementById (:blocks-node-id config))]
                                                    (util/app-scroll-container-node node)
                                                    (util/app-scroll-container-node)))
                        :compute-item-key (fn [idx]
                                            (let [block (nth blocks idx)]
                                              (str (:container-id config) "-" (:db/id block))))
                        ;; Leave some space for the new inserted block
                        :increase-viewport-by 254
                        :overscan 254
                        :total-count (count blocks)
                        :item-content (fn [idx]
                                        (let [top? (zero? idx)
                                              bottom? (= (dec (count blocks)) idx)
                                              block (nth blocks idx)]
                                          (block-item (assoc config :top? top?)
                                                      block
                                                      {:top? top?
                                                       :bottom? bottom?})))})
        *wrap-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (when mobile? (util/schedule #(set-ready? true)))
       (when virtualized?
         (when (:current-page? config)
           (let [ref (.-current *virtualized-ref)]
             (ui-handler/scroll-to-anchor-block ref blocks false)
             (state/set-state! :editor/virtualized-scroll-fn
                               #(ui-handler/scroll-to-anchor-block ref blocks false))))
         ;; Try to fix virtuoso scrollable container blink for the block insertion at bottom
         (let [^js *ob (volatile! nil)]
           (js/setTimeout
            (fn []
              (when-let [_inst (hooks/deref *virtualized-ref)]
                (when-let [^js target (.-firstElementChild (hooks/deref *wrap-ref))]
                  (let [set-wrap-h! #(when-let [ref (hooks/deref *wrap-ref)] (set! (.-height (.-style ref)) %))
                        set-wrap-h! (debounce set-wrap-h! 16)
                        ob (js/ResizeObserver.
                            (fn []
                              (when-let [h (and (hooks/deref *wrap-ref)
                                                (.-height (.-style target)))]
                                ;(prn "==>> debug: " h)
                                (set-wrap-h! h))))]
                    (.observe ob target)
                    (vreset! *ob ob))))))
           #(some-> @*ob (.disconnect)))))
     [])

    [:div.blocks-list-wrap
     {:data-level (or (:level config) 0)
      :ref *wrap-ref}
     (when ready?
       (cond
         virtualized?
         (ui/virtualized-list virtual-opts)
         :else
         (map-indexed (fn [idx block]
                        (rum/with-key (render-item idx) (str (:container-id config) "-" (:db/id block))))
                      blocks)))]))

(rum/defcs blocks-container < mixins/container-id rum/static
                              {:init (fn [state]
                                       (assoc state ::id (str (random-uuid))))}
  [state config blocks]
  (let [doc-mode? (:document/mode? config)
        id (::id state)]
    (when (seq blocks)
      [:div.blocks-container.flex-1
       {:id id
        :class (when doc-mode? "document-mode")
        :containerid (:container-id state)}
       (block-list (assoc config
                     :blocks-node-id id
                     :container-id (:container-id state))
                   blocks)])))

(rum/defcs breadcrumb-with-container < rum/reactive db-mixins/query
                                       {:init (fn [state]
                                                (let [first-block (ffirst (:rum/args state))]
                                                  (assoc state
                                                    ::initial-block first-block
                                                    ::navigating-block (atom (:block/uuid first-block)))))}
  [state blocks config]
  (let [*navigating-block (::navigating-block state)
        navigating-block (rum/react *navigating-block)
        navigating-block-entity (db/entity [:block/uuid navigating-block])
        navigated? (and
                    navigating-block
                    (not= (:db/id (:block/parent (::initial-block state)))
                          (:db/id (:block/parent navigating-block-entity))))
        blocks (if navigated?
                 (let [block navigating-block-entity]
                   [(model/sub-block (:db/id block))])
                 blocks)]
    [:div
     (when (:breadcrumb-show? config)
       (breadcrumb config (state/get-current-repo) (or navigating-block (:block/uuid (first blocks)))
                   {:show-page? false
                    :navigating-block *navigating-block
                    :indent? true}))
     (let [config' (assoc config
                     :breadcrumb-show? false
                     :navigating-block *navigating-block
                     :navigated? navigated?)]
       (blocks-container config' blocks))]))

(rum/defc ref-block-container
  [config [page page-blocks]]
  (let [alias? (:block/alias? page)
        page (db/entity (:db/id page))
        ;; FIXME: parents need to be sorted
        parent-blocks (group-by :block/parent page-blocks)]
    [:div.my-2.references-blocks-item {:key (str "page-" (:db/id page))}
     (let [items (for [[parent blocks] parent-blocks]
                   (let [blocks' (map (fn [b]
                                        (if (e/entity? b)
                                          b
                                          (update b :block/children
                                                  (fn [col]
                                                    (tree/non-consecutive-blocks->vec-tree col))))) blocks)]
                     (rum/with-key
                      (breadcrumb-with-container blocks' config)
                      (:db/id parent))))]
       (if page
         (ui/foldable
          [:div.with-foldable-page
           (page-cp config page)
           (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
          items
          {:debug-id page})
         [:div.only-page-blocks items]))]))

;; headers to hiccup
(defn ->hiccup
  [blocks config option]
  [:div.content
   (cond-> option
           (:document/mode? config) (assoc :class "doc-mode"))
   (cond
     (and (:custom-query? config) (:group-by-page? config))
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)]
        (for [[page blocks] blocks]
          (let [alias? (:block/alias? page)
                page (db/entity (:db/id page))
                blocks (tree/non-consecutive-blocks->vec-tree blocks)
                parent-blocks (group-by :block/parent blocks)]
            [:div.custom-query-page-result {:key (str "page-" (:db/id page))}
             (ui/foldable
              [:div
               (page-cp config page)
               (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
              (fn []
                (let [{top-level-blocks true others false} (group-by
                                                            (fn [b] (= (:db/id page) (:db/id (first b))))
                                                            parent-blocks)
                      sorted-parent-blocks (concat top-level-blocks others)]
                  (for [[parent blocks] sorted-parent-blocks]
                    (let [top-level? (= (:db/id parent) (:db/id page))]
                      (rum/with-key
                       (breadcrumb-with-container blocks (assoc config :top-level? top-level?))
                       (:db/id parent))))))
              {:debug-id page})])))]

     (and (:ref? config) (:group-by-page? config) (vector? (first blocks)))
     [:div.flex.flex-col.references-blocks-wrap
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)
            scroll-container (or (:scroll-container config)
                                 (util/app-scroll-container-node))
            scroll-container (if (fn? scroll-container)
                               (scroll-container) scroll-container)]
        (when (seq blocks)
          (if (:sidebar? config)
            (for [block blocks]
              (rum/with-key
               (ref-block-container config block)
               (str "ref-" (:container-id config) "-" (:db/id (first block)))))
            (ui/virtualized-list
             {:custom-scroll-parent scroll-container
              :compute-item-key (fn [idx]
                                  (let [block (nth blocks idx)]
                                    (str "ref-" (:container-id config) "-" (:db/id (first block)))))
              :total-count (count blocks)
              :item-content (fn [idx]
                              (let [block (nth blocks idx)]
                                (ref-block-container config block)))}))))]

     (and (:group-by-page? config)
          (vector? (first blocks)))
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)]
        (for [[page blocks] blocks]
          (let [blocks (remove nil? blocks)]
            (when (seq blocks)
              (let [alias? (:block/alias? page)
                    page (db/entity (:db/id page))
                    whiteboard? (model/whiteboard-page? page)]
                [:div.my-2 {:key (str "page-" (:db/id page))}
                 (ui/foldable
                  [:div
                   (page-cp config page)
                   (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
                  (fn []
                    (when-not whiteboard? (blocks-container config blocks)))
                  {})])))))]

     :else
     (blocks-container config blocks))])
