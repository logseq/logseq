(ns frontend.components.block
  (:refer-clojure :exclude [range])
  (:require-macros [hiccups.core])
  (:require ["/frontend/utils" :as utils]
            ["@capacitor/share" :refer [^js Share]]
            [cljs-bean.core :as bean]
            [cljs.core.match :refer [match]]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.components.block.macros :as block-macros]
            [frontend.components.datetime :as datetime-comp]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.macro :as macro]
            [frontend.components.plugins :as plugins]
            [frontend.components.query.builder :as query-builder-component]
            [frontend.components.svg :as svg]
            [frontend.components.query :as query]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db-mixins :as db-mixins]
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
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file-sync :as file-sync]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.repeated :as repeated]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.handler.export.common :as export-common-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.tree :as tree]
            [frontend.security :as security]
            [frontend.shui :refer [get-shui-component-version make-shui-context]]
            [frontend.state :as state]
            [frontend.template :as template]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.util.clock :as clock]
            [frontend.util.drawer :as drawer]
            [frontend.util.property :as property]
            [frontend.util.text :as text-util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [logseq.shui.core :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [shadow.loader :as loader]
            [datascript.impl.entity :as e]
            [logseq.common.path :as path]))



;; local state
(defonce *dragging?
  (atom false))
(defonce *dragging-block
  (atom nil))
(defonce *drag-to-block
  (atom nil))
(def *move-to (atom nil))

;; TODO: dynamic
(defonce max-depth-of-links 5)
(defonce *blocks-container-id (atom 0))

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
  (js/console.error "TODO: buggy path fn")
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

(rum/defcs asset-loader
  < rum/reactive
  (rum/local nil ::exist?)
  (rum/local false ::loading?)
  {:will-mount  (fn [state]
                  (let [src (first (:rum/args state))]
                    (if (and (gp-config/local-protocol-asset? src)
                             (file-sync/current-graph-sync-on?))
                      (let [*exist? (::exist? state)
                            ;; special handling for asset:// protocol
                            ;; Capacitor uses a special URL for assets loading
                            asset-path (gp-config/remove-asset-protocol src)
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
        img? (contains? (gp-config/img-formats) ext)
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

(defn open-lightbox
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

(defonce *resizing-image? (atom false))
(rum/defcs ^:large-vars/cleanup-todo resizable-image <
  (rum/local nil ::size)
  {:will-unmount (fn [state]
                   (reset! *resizing-image? false)
                   state)}
  [state config title src metadata full-text local?]
  (let [size (get state ::size)
        breadcrumb? (:breadcrumb? config)]
    (ui/resize-provider
     (ui/resize-consumer
      (if (and (not (mobile-util/native-platform?))
               (not breadcrumb?))
        (cond->
         {:className "resize image-resize"
          :onSizeChanged (fn [value]
                           (when (and (not @*resizing-image?)
                                      (some? @size)
                                      (not= value @size))
                             (reset! *resizing-image? true))
                           (reset! size value))
          :onMouseUp (fn []
                       (when (and @size @*resizing-image?)
                         (when-let [block-id (:block/uuid config)]
                           (let [size (bean/->clj @size)]
                             (editor-handler/resize-image! block-id metadata full-text size))))
                       (when @*resizing-image?
                            ;; TODO: need a better way to prevent the clicking to edit current block
                         (js/setTimeout #(reset! *resizing-image? false) 200)))
          :onClick (fn [e]
                     (when @*resizing-image? (util/stop e)))}
         (and (:width metadata) (not (util/mobile?)))
         (assoc :style {:width (:width metadata)}))
        {})
      [:div.asset-container {:key "resize-asset-container"}
       [:img.rounded-sm.relative
        (merge
         {:loading "lazy"
          :referrerPolicy "no-referrer"
          :src     src
          :title   title}
         metadata)]
       (when-not breadcrumb?
         [:<>
          [:.asset-overlay]
          (let [image-src (fs/asset-path-normalize src)]
            [:.asset-action-bar {:aria-hidden "true"}
             ;; the image path bar
             (when (util/electron?)
               [:button.asset-action-btn.text-left
                {:title         (t (if local? :asset/show-in-folder :asset/open-in-browser))
                 :tabIndex      "-1"
                 :on-mouse-down util/stop
                 :on-click      (fn [e]
                                  (util/stop e)
                                  (if local?
                                    (js/window.apis.showItemInFolder image-src)
                                    (js/window.apis.openExternal image-src)))}
                image-src])
             [:.flex
              (when-not config/publishing?
                [:button.asset-action-btn
                 {:title         (t :asset/delete)
                  :tabIndex      "-1"
                  :on-mouse-down util/stop
                  :on-click
                  (fn [e]
                    (when-let [block-id (:block/uuid config)]
                      (let [confirm-fn (ui/make-confirm-modal
                                         {:title         (t :asset/confirm-delete (.toLocaleLowerCase (t :text/image)))
                                          :sub-title     (if local? :asset/physical-delete "")
                                          :sub-checkbox? local?
                                          :on-confirm    (fn [_e {:keys [close-fn sub-selected]}]
                                                           (close-fn)
                                                           (editor-handler/delete-asset-of-block!
                                                             {:block-id      block-id
                                                              :local?        local?
                                                              :delete-local? (and sub-selected (first sub-selected))
                                                              :repo          (state/get-current-repo)
                                                              :href          src
                                                              :title         title
                                                              :full-text     full-text}))})]
                        (util/stop e)
                        (state/set-modal! confirm-fn))))}
                 (ui/icon "trash")])

              [:button.asset-action-btn
               {:title         (t :asset/copy)
                :tabIndex      "-1"
                :on-mouse-down util/stop
                :on-click      (fn [e]
                                 (util/stop e)
                                 (-> (util/copy-image-to-clipboard image-src)
                                     (p/then #(notification/show! "Copied!" :success))))}
               (ui/icon "copy")]

              [:button.asset-action-btn
               {:title         (t :asset/maximize)
                :tabIndex      "-1"
                :on-mouse-down util/stop
                :on-click      open-lightbox}

               (ui/icon "maximize")]]])])]))))

(rum/defc audio-cp [src]
  ;; Change protocol to allow media fragment uris to play
  [:audio {:src (string/replace-first src gp-config/asset-protocol "file://")
           :controls true
           :on-touch-start #(util/stop %)}])

(rum/defcs asset-link < rum/reactive
  (rum/local nil ::src)
  [state config title href metadata full_text]
  (let [src (::src state)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        href (config/get-local-asset-absolute-path href)]
    (when (or granted? (util/electron?) (mobile-util/native-platform?))
      (p/then (editor-handler/make-asset-url href) #(reset! src %)))

    (when @src
      ;; NOTE(andelf): Under nfs context, src might be a bare blob:http://..../uuid URI without ext info
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
                           (.share Share (clj->js {:url asset-url
                                                   :title "Open file with your favorite app"})))))]

        (cond
          (contains? config/audio-formats ext)
          (asset-loader @src
                        #(audio-cp @src))

          (contains? (gp-config/img-formats) ext)
          (asset-loader @src
                        #(resizable-image config title @src metadata full_text true))

          (contains? (gp-config/text-formats) ext)
          [:a.asset-ref.is-plaintext {:href (rfe/href :file {:path path})
                                      :on-click (fn [_event]
                                                  (p/let [result (fs/read-file repo-dir path)]
                                                    (db/set-file-content! repo path result)))}
           title]

          (= ext :pdf)
          [:a.asset-ref.is-pdf {:href @src
                                :on-click share-fn}
           title]

          :else
          [:a.asset-ref.is-doc {:href @src
                                :on-click share-fn}
           title])))))

(defn ar-url->http-url
  [href]
  (string/replace href #"^ar://" (str (state/get-arweave-gateway) "/")))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [config url href label metadata full_text]
  (let [metadata (if (string/blank? metadata)
                   nil
                   (gp-util/safe-read-string metadata))
        title (second (first label))]
    (ui/catch-error
     [:span.warning full_text]
     (if (and (gp-config/local-asset? href)
              (config/local-db? (state/get-current-repo)))
       (asset-link config title href metadata full_text)
       (let [href (cond
                    (util/starts-with? href "http")
                    href

                    (util/starts-with? href "ar")
                    (ar-url->http-url href)

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

(defn open-page-ref
  [e page-name redirect-page-name page-name-in-block contents-page? whiteboard-page?]
  (util/stop e)
  (when (not (util/right-click? e))
    (cond
      (gobj/get e "shiftKey")
      (when-let [page-entity (db/entity [:block/name redirect-page-name])]
        (state/sidebar-add-block!
         (state/get-current-repo)
         (:db/id page-entity)
         :page))

      (and (util/meta-key? e) (whiteboard-handler/inside-portal? (.-target e)))
      (whiteboard-handler/add-new-block-portal-shape!
       page-name
       (whiteboard-handler/closest-shape (.-target e)))

      whiteboard-page?
      (route-handler/redirect-to-whiteboard! page-name)

      (not= redirect-page-name page-name)
      (route-handler/redirect-to-page! redirect-page-name)

      :else
      (state/pub-event! [:page/create page-name-in-block])))
  (when (and contents-page?
             (util/mobile?)
             (state/get-left-sidebar-open?))
    (ui-handler/close-left-sidebar!)))

(rum/defcs page-inner <
  (rum/local false ::mouse-down?)
  "The inner div of page reference component

   page-name-in-block is the overridable name of the page (legacy)

   All page-names are sanitized except page-name-in-block"
  [state config page-name-in-block page-name redirect-page-name page-entity contents-page? children html-export? label whiteboard-page?]
  (let [*mouse-down? (::mouse-down? state)
        tag? (:tag? config)
        config (assoc config :whiteboard-page? whiteboard-page?)
        untitled? (model/untitled-page? page-name)]
    [:a
     {:tabIndex "0"
      :class (cond-> (if tag? "tag" "page-ref")
               (:property? config)
               (str " page-property-key block-property")
               untitled? (str " opacity-50"))
      :data-ref page-name
      :draggable true
      :on-drag-start (fn [e] (editor-handler/block->data-transfer! page-name-in-block e))
      :on-mouse-down (fn [_e] (reset! *mouse-down? true))
      :on-mouse-up (fn [e]
                     (when @*mouse-down?
                       (open-page-ref e page-name redirect-page-name page-name-in-block contents-page? whiteboard-page?)
                       (reset! *mouse-down? false)))
      :on-key-up (fn [e] (when (and e (= (.-key e) "Enter"))
                           (open-page-ref e page-name redirect-page-name page-name-in-block contents-page? whiteboard-page?)))}

     (if (and (coll? children) (seq children))
       (for [child children]
         (if (= (first child) "Label")
           (last child)
           (let [{:keys [content children]} (last child)
                 page-name (subs content 2 (- (count content) 2))]
             (rum/with-key (page-reference html-export? page-name (assoc config :children children) nil) page-name))))
       (cond
         (and label
              (string? label)
              (not (string/blank? label))) ; alias
         label

         (coll? label)
         (->elem :span (map-inline config label))

         :else
         (let [original-name (util/get-page-original-name page-entity)
               s (cond untitled?
                       (t :untitled)

                       ;; The page-name-in-block generated by the auto-complete is not page-name-sanitized
                       (pdf-utils/hls-file? page-name)
                       (pdf-utils/fix-local-asset-pagename page-name)

                       (not= (util/safe-page-name-sanity-lc original-name) page-name-in-block)
                       page-name-in-block ;; page-name-in-block might be overridden (legacy))

                       original-name
                       (util/trim-safe original-name)

                       :else
                       (util/trim-safe page-name))
               _ (when-not page-entity (js/console.warn "page-inner's page-entity is nil, given page-name: " page-name
                                                        " page-name-in-block: " page-name-in-block))]
           (if tag? (str "#" s) s))))]))

(rum/defc page-preview-trigger
  [{:keys [children sidebar? tippy-position tippy-distance fixed-position? open? manual?] :as config} page-name]
  (let [*tippy-ref (rum/create-ref)
        page-name (util/page-name-sanity-lc page-name)
        whiteboard-page? (model/whiteboard-page? page-name)
        redirect-page-name (or (model/get-redirect-page-name page-name (:block/alias? config))
                               page-name)
        page-original-name (model/get-page-original-name redirect-page-name)
        _  #_:clj-kondo/ignore (rum/defc html-template []
                                 (let [*el-popup (rum/use-ref nil)]

                                   (rum/use-effect!
                                    (fn []
                                      (let [el-popup (rum/deref *el-popup)
                                            cb (fn [^js e]
                                                 (when-not (:editor/editing? @state/state)
                                           ;; Esc
                                                   (and (= e.which 27)
                                                        (when-let [tp (rum/deref *tippy-ref)]
                                                          (.hideTooltip tp)))))]

                                        (js/setTimeout #(.focus el-popup))
                                        (.addEventListener el-popup "keyup" cb)
                                        #(.removeEventListener el-popup "keyup" cb)))
                                    [])

                                   (when redirect-page-name
                                     [:div.tippy-wrapper.overflow-y-auto.p-4.outline-none
                                      {:ref   *el-popup
                                       :tab-index -1
                                       :style {:width          600
                                               :text-align     "left"
                                               :font-weight    500
                                               :max-height     600
                                               :padding-bottom 64}}
                                      (if (and (string? page-original-name) (text/namespace-page? page-original-name))
                                        [:div.my-2
                                         (->>
                                          (for [namespace-page (gp-util/split-namespace-pages page-original-name)]
                                            (when (and (string? namespace-page) namespace-page)
                                              (let [label (second (gp-util/split-last model/ns-char namespace-page))]
                                                (page-reference false namespace-page {:preview? true} label))))
                                          (interpose [:span.mx-2.opacity-30 model/ns-char]))]
                                        [:h2.font-bold.text-lg (if (= page-name redirect-page-name)
                                                                 page-original-name
                                                                 [:span
                                                                  [:span.text-sm.mr-2 "Alias:"]
                                                                  page-original-name])])
                                      (let [page (db/entity [:block/name (util/page-name-sanity-lc redirect-page-name)])]
                                        (editor-handler/insert-first-page-block-if-not-exists! redirect-page-name {:redirect? false})
                                        (let [page-blocks-cp (state/get-page-blocks-cp)
                                              tldraw-preview (state/get-component :whiteboard/tldraw-preview)]
                                          (if whiteboard-page?
                                            (tldraw-preview page-name)
                                            (page-blocks-cp (state/get-current-repo) page {:sidebar? sidebar? :preview? true}))))])))]

    (if (or (not manual?) open?)
      (ui/tippy {:ref             *tippy-ref
                 :in-editor?      true
                 :html            html-template
                 :interactive     true
                 :delay           [1000, 100]
                 :fixed-position? fixed-position?
                 :position        (or tippy-position "top")
                 :distance        (or tippy-distance 10)
                 :popperOptions   {:modifiers {:preventOverflow
                                               {:enabled           true
                                                :boundariesElement "viewport"}}}}
                children)
      children)))

(rum/defc page-cp
  "Component for a page. `page` argument contains :block/name which can be (un)sanitized page name.
   Keys for `config`:
   - `:preview?`: Is this component under preview mode? (If true, `page-preview-trigger` won't be registered to this `page-cp`)"
  [{:keys [html-export? redirect-page-name label children contents-page? preview?] :as config} page]
  (when-let [page-name-in-block (:block/name page)]
    (let [page-name-in-block (gp-util/remove-boundary-slashes page-name-in-block)
          page-name (util/page-name-sanity-lc page-name-in-block)
          page-entity (db/entity [:block/name page-name])
          whiteboard-page? (model/whiteboard-page? page-name)
          redirect-page-name (or (and (= :org (state/get-preferred-format))
                                      (:org-mode/insert-file-link? (state/get-config))
                                      redirect-page-name)
                                 (model/get-redirect-page-name page-name (:block/alias? config)))
          inner (page-inner config
                            page-name-in-block
                            page-name
                            redirect-page-name page-entity contents-page? children html-export? label whiteboard-page?)]
      (cond
        (:breadcrumb? config)
        (or (:block/original-name page)
            (:block/name page))

        (and (not (util/mobile?))
             (not preview?))
        (page-preview-trigger (assoc config :children inner) page-name)

        :else
        inner))))

(rum/defc asset-reference
  [config title path]
  (let [repo (state/get-current-repo)
        real-path-url (cond
                        (gp-util/url? path)
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

(rum/defc page-reference < rum/reactive
  "Component for page reference"
  [html-export? s {:keys [nested-link? id] :as config} label]
  (let [show-brackets? (state/show-brackets?)
        block-uuid (:block/uuid config)
        contents-page? (= "contents" (string/lower-case (str id)))]
    (if (string/ends-with? s ".excalidraw")
      [:div.draw {:on-click (fn [e]
                              (.stopPropagation e))}
       (excalidraw s block-uuid)]
      [:span.page-reference
       {:data-ref s}
       (when (and (or show-brackets? nested-link?)
                  (not html-export?)
                  (not contents-page?))
         [:span.text-gray-500.bracket page-ref/left-brackets])
       (let [s (string/trim s)]
         (page-cp (assoc config
                         :label (mldoc/plain->text label)
                         :contents-page? contents-page?)
                  {:block/name s}))
       (when (and (or show-brackets? nested-link?)
                  (not html-export?)
                  (not contents-page?))
         [:span.text-gray-500.bracket page-ref/right-brackets])])))

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(declare blocks-container)

(defn- edit-parent-block [e config]
  (when-not (state/editing?)
    (.stopPropagation e)
    (editor-handler/edit-block! config :max (:block/uuid config))))

(rum/defc block-embed < rum/reactive db-mixins/query
  [config uuid]
  (when-let [block (db/entity [:block/uuid uuid])]
    (let [blocks (db/get-paginated-blocks (state/get-current-repo) (:db/id block)
                                          {:scoped-block-id (:db/id block)})]
      [:div.color-level.embed-block.bg-base-2
       {:style {:z-index 2}
        :on-double-click #(edit-parent-block % config)
        :on-mouse-down (fn [e] (.stopPropagation e))}
       [:div.px-3.pt-1.pb-2
        (blocks-container blocks (assoc config
                                        :db/id (:db/id block)
                                        :id (str uuid)
                                        :embed-id uuid
                                        :embed? true
                                        :embed-parent (:block config)
                                        :ref? false))]])))

(rum/defc page-embed < rum/reactive db-mixins/query
  [config page-name]
  (let [page-name (util/page-name-sanity-lc (string/trim page-name))
        current-page (state/get-current-page)
        whiteboard-page? (model/whiteboard-page? page-name)]
    [:div.color-level.embed.embed-page.bg-base-2
     {:class (when (:sidebar? config) "in-sidebar")
      :on-double-click #(edit-parent-block % config)
      :on-mouse-down #(.stopPropagation %)}
     [:section.flex.items-center.p-1.embed-header
      [:div.mr-3 svg/page]
      (page-cp config {:block/name page-name})]
     (when (and
            (not= (util/page-name-sanity-lc (or current-page ""))
                  page-name)
            (not= (util/page-name-sanity-lc (get config :id ""))
                  page-name))
       (if whiteboard-page?
         ((state/get-component :whiteboard/tldraw-preview) page-name)
         (let [page (model/get-page page-name)
               blocks (db/get-paginated-blocks (state/get-current-repo) (:db/id page))]
           (blocks-container blocks (assoc config
                                           :db/id (:db/id page)
                                           :id page-name
                                           :embed? true
                                           :page-embed? true
                                           :ref? false)))))]))

(defn- get-label-text
  [label]
  (when (and (= 1 (count label))
             (string? (last (first label))))
    (gp-util/safe-decode-uri-component (last (first label)))))

(defn- get-page
  [label]
  (when-let [label-text (get-label-text label)]
    (db/entity [:block/name (util/page-name-sanity-lc label-text)])))

(defn- macro->text
  [name arguments]
  (if (and (seq arguments)
           (not= arguments ["null"]))
    (util/format "{{%s %s}}" name (string/join ", " arguments))
    (util/format "{{%s}}" name)))

(declare block-content)
(declare block-container)
(declare breadcrumb)

(rum/defc block-reference < rum/reactive
  db-mixins/query
  [config id label]
  (if-let [block-id (parse-uuid id)]
    (let [db-id (:db/id (db/pull [:block/uuid block-id]))
          block (when db-id (db/sub-block db-id))
          block-type (keyword (get-in block [:block/properties :ls-type]))
          hl-type (get-in block [:block/properties :hl-type])
          repo (state/get-current-repo)
          stop-inner-events? (= block-type :whiteboard-shape)]
      (if (and block (:block/content block))
        (let [title [:span.block-ref
                     (block-content (assoc config :block-ref? true :stop-events? stop-inner-events?)
                                    block nil (:block/uuid block)
                                    (:slide? config)
                                    false)]
              inner (if label
                      (->elem
                       :span.block-ref
                       (map-inline config label))
                      title)]
          [:div.block-ref-wrap.inline
           {:data-type    (name (or block-type :default))
            :data-hl-type hl-type
            :on-mouse-down
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

                      [:whiteboard-shape true] (route-handler/redirect-to-whiteboard!
                                                (get-in block [:block/page :block/name]) {:block-id block-id})

                      ;; default open block page
                      :else (route-handler/redirect-to-page! id))))))}

           (if (and (not (util/mobile?)) (not (:preview? config)) (nil? block-type))
             (ui/tippy {:html        (fn []
                                       [:div.tippy-wrapper.overflow-y-auto.p-4
                                        {:style {:width      735
                                                 :text-align "left"
                                                 :max-height 600}}
                                        [(breadcrumb config repo block-id {:indent? true})
                                         (blocks-container
                                          (db/get-block-and-children repo block-id)
                                          (assoc config :id (str id) :preview? true))]])
                        :interactive true
                        :in-editor?  true
                        :delay       [1000, 100]} inner)
             inner)])
        [:span.warning.mr-1 {:title "Block ref invalid"}
         (block-ref/->block-ref id)]))
    [:span.warning.mr-1 {:title "Block ref invalid"}
      (block-ref/->block-ref id)]))

(defn inline-text
  ([format v]
   (inline-text {} format v))
  ([config format v]
   (when (string? v)
     (let [inline-list (gp-mldoc/inline->edn v (gp-mldoc/default-config format))]
       [:div.inline.mr-1 (map-inline config inline-list)]))))

(defn- render-macro
  [config name arguments macro-content format]
  [:div.macro {:data-macro-name name}

   (if macro-content
     (let [ast (->> (mldoc/->edn macro-content (gp-mldoc/default-config format))
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
        metadata-show (:show (gp-util/safe-read-string metadata))
        format (get-in config [:block :block/format])]
    (or
     (and
      (= :org format)
      (or
       (and
        (nil? metadata-show)
        (or
         (gp-config/local-asset? s)
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
  (if (and (gp-config/local-asset? href)
           (config/local-db? (state/get-current-repo)))
    (asset-link config nil href metadata full_text)
    (let [href (cond
                 (util/starts-with? href "http")
                 href

                 (util/starts-with? href "ar")
                 (ar-url->http-url href)

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

      (= ext :pdf)
      (cond
        (util/electron?)
        [:a.asset-ref.is-pdf
         {:on-click (fn [event]
                      (when-let [current (pdf-assets/inflate-asset s)]
                        (state/set-current-pdf! current)
                        (util/stop event)))
          :draggable true
          :on-drag-start #(.setData (gobj/get % "dataTransfer") "file" s)}
         (or label-text
             (->elem :span (map-inline config label)))]

        (mobile-util/native-platform?)
        (asset-link config label-text s metadata full_text))

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
    (page-reference (:html-export? config) s config label)

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
        {:href      (path/path-join "file://" path)
         :data-href path
         :target    "_blank"}
        title
        (assoc :title title))
       (map-inline config label)))

    :else
    (page-reference (:html-export? config) s config label)))

(defn- link-cp [config html-export? link]
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
      (let [format (get-in config [:block :block/format])]
        (if (and (= format :org)
                 (show-link? config nil page page)
                 (not (contains? #{"pdf" "mp4" "ogg" "webm"} (util/get-file-ext page))))
          (image-link config url page nil metadata full_text)
          (let [label* (if (seq (mldoc/plain->text label)) label nil)]
            (if (and (string? page) (string/blank? page))
              [:span (page-ref/->page-ref page)]
              (page-reference (:html-export? config) page config label*)))))

      ["Embed_data" src]
      (image-link config url src nil metadata full_text)

      ["Search" s]
      (search-link-cp config url s label title metadata full_text)

      :else
      (let [href (string-of-url url)
            [protocol path] (or (and (= "Complex" (first url)) url)
                                (and (= "File" (first url)) ["file" (second url)]))]
        (cond
          (and (= (get-in config [:block :block/format]) :org)
               (= "Complex" protocol)
               (= (string/lower-case (:protocol path)) "id")
               (string? (:link path))
               (util/uuid-string? (:link path))) ; org mode id
          (let [id (uuid (:link path))
                block (db/entity [:block/uuid id])]
            (if (:block/pre-block? block)
              (let [page (:block/page block)]
                (page-reference html-export? (:block/name page) config label))
              (block-reference config (:link path) label)))

          (= protocol "file")
          (if (show-link? config metadata href full_text)
            (media-link config url href label metadata full_text)
            (let [redirect-page-name (when (string? path) (text/get-page-name path))
                  config (assoc config :redirect-page-name redirect-page-name)
                  label-text (get-label-text label)
                  page (if (string/blank? label-text)
                         {:block/name (db/get-file-page (string/replace href "file:" "") false)}
                         (get-page label))
                  show-brackets? (state/show-brackets?)]
              (if (and page
                       (when-let [ext (util/get-file-ext href)]
                         (gp-config/mldoc-support? ext)))
                [:span.page-reference
                 (when show-brackets? [:span.text-gray-500 page-ref/left-brackets])
                 (page-cp config page)
                 (when show-brackets? [:span.text-gray-500 page-ref/right-brackets])]

                (let [href* (if (util/electron?)
                              (relative-assets-path->absolute-path href)
                              href)]
                  (->elem
                   :a
                   (cond-> {:href      (path/path-join "file://" href*)
                            :data-href href*
                            :target    "_blank"}
                     title (assoc :title title))
                   (map-inline config label))))))

          (show-link? config metadata href full_text)
          (media-link config url href label metadata full_text)

          (= protocol "ar")
          (->elem
           :a.external-link
           (cond->
            {:href (ar-url->http-url href)
             :target "_blank"}
            title
            (assoc :title title))
           (map-inline config label))

          :else
          (->elem
           :a.external-link
           (cond->
            {:href href
             :target "_blank"}
            title
            (assoc :title title))
           (map-inline config label)))))))

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
                    (string/trim))]
     (query/custom-query (wrap-query-components (assoc config :dsl-query? true))
                         {:builder (query-builder-component/builder query config)
                          :query query}))])

(defn- macro-function-cp
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
      (nil? a)                      ; empty embed
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

      :else                         ;TODO: maybe collections?
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
    (if (gp-util/url? url)
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
                  (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1"
                       (when-let [page (second query)]
                         (str "&page=" page)))

                  :else
                  url)]
        (if (and (coll? src)
                 (= (first src) "youtube-player"))
          (youtube/youtube-video (last src))
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
          macro-content (or
                         (-> (db/entity [:block/uuid block-uuid])
                             (:block/page)
                             (:db/id)
                             (db/entity)
                             :block/properties
                             :macros
                             (get name))
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
                          (block/macro-subs macro-content arguments)

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
      (let [shorten-name (some-> (or (:block/original-name child) (:block/name child))
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
      (macro-query-cp config arguments)

      (= name "function")
      (macro-function-cp config arguments)

      (= name "namespace")
      (let [namespace (first arguments)]
        (when-not (string/blank? namespace)
          (let [namespace (string/lower-case (page-ref/get-page-name! namespace))
                children (model/get-namespace-hierarchy (state/get-current-repo) namespace)]
            (namespace-hierarchy config namespace children))))

      (= name "youtube")
      (when-let [url (first arguments)]
        (when-let [youtube-id (cond
                                (== 11 (count url)) url
                                :else
                                (nth (util/safe-re-find text-util/youtube-regex url) 5))]
          (when-not (string/blank? youtube-id)
            (youtube/youtube-video youtube-id))))

      (= name "youtube-timestamp")
      (when-let [timestamp (first arguments)]
        (when-let [seconds (youtube/parse-timestamp timestamp)]
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
          (when-let [id (cond
                          (<= (count url) 15) url
                          :else
                          (last (util/safe-re-find id-regex url)))]
            (ui/tweet-embed id))))

      (= name "embed")
      (macro-embed-cp config arguments)

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
  (let [result (gp-util/safe-read-string s)
        result' (if (seq result) result
                    [:div.warning {:title "Invalid hiccup"}
                     s])]
    (-> result'
       (hiccups.core/html)
       (security/sanitize-html))))

(defn inline
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
             (page-cp (assoc config :tag? true) {:block/name s})))

         ["Emphasis" [[kind] data]]
         (emphasis-cp config kind data)

         ["Entity" e]
         [:span {:dangerouslySetInnerHTML
                 {:__html (security/sanitize-html (:html e))}}]

         ["Latex_Fragment" [display s]] ;display can be "Displayed" or "Inline"
         (if html-export?
           (latex/html-export s false true)
           (latex/latex (str (d/squuid)) s false (not= display "Inline")))

         [(:or "Target" "Radio_Target") s]
         [:a {:id s} s]

         ["Email" address]
         (let [{:keys [local_part domain]} address
               address (str local_part "@" domain)]
           [:a {:href (str "mailto:" address)} address])

         ["Nested_link" link]
         (nested-link config html-export? link)

         ["Link" link]
         (link-cp config html-export? link)

         [(:or "Verbatim" "Code") s]
         [:code s]

         ["Inline_Source_Block" x]
         [:code (:code x)]

         ["Export_Snippet" "html" s]
         (when (not html-export?)
           [:span {:dangerouslySetInnerHTML
                   {:__html (security/sanitize-html s)}}])

         ["Inline_Hiccup" s] ;; String to hiccup
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

(defn- bullet-drag-start
  [event block uuid block-id]
  (editor-handler/highlight-block! uuid)
  (editor-handler/block->data-transfer! uuid event)
  (.setData (gobj/get event "dataTransfer")
            "block-dom-id"
            block-id)
  (reset! *dragging? true)
  (reset! *dragging-block block))

(defn- bullet-on-click
  [e block uuid]
  (cond
    (gp-whiteboard/shape-block? block)
    (route-handler/redirect-to-whiteboard! (get-in block [:block/page :block/name]) {:block-id uuid})

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
    (when uuid (route-handler/redirect-to-page! uuid))))

(rum/defc block-children < rum/reactive
  [config block children collapsed?]
  (let [ref?        (:ref? config)
        query?      (:custom-query? config)
        children    (when (coll? children)
                      (remove nil? children))]
    (when (and (coll? children)
               (seq children)
               (not collapsed?))
      [:div.block-children-container.flex
       [:div.block-children-left-border
        {:on-click (fn [_]
                     (editor-handler/toggle-open-block-children! (:block/uuid block)))}]
       [:div.block-children.w-full {:style {:display (if collapsed? "none" "")}}
        (for [child children]
          (when (map? child)
            (let [child  (dissoc child :block/meta)
                  config (cond->
                           (-> config
                               (assoc :block/uuid (:block/uuid child))
                               (dissoc :breadcrumb-show? :embed-parent))
                           (or ref? query?)
                           (assoc :ref-query-child? true))]
              (rum/with-key (block-container config child)
                (str (:blocks-container-id config) "-" (:block/uuid child))))))]])))

(defn- block-content-empty?
  [{:block/keys [properties title body]}]
  (and
   (or
    (empty? properties)
    (property/properties-hidden? properties))

   (empty? title)

   (every? #(= % ["Horizontal_Rule"]) body)))

(rum/defcs block-control < rum/reactive
  [state config block uuid block-id collapsed? *control-show? edit?]
  (let [doc-mode?          (state/sub :document/mode?)
        control-show?      (util/react *control-show?)
        ref?               (:ref? config)
        empty-content?     (block-content-empty? block)
        fold-button-right? (state/enable-fold-button-right?)
        own-number-list?   (:own-order-number-list? config)
        order-list?        (boolean own-number-list?)
        order-list-idx     (:own-order-list-index config)
        collapsable?       (editor-handler/collapsable? uuid {:semantic? true})]
    [:div.block-control-wrap.flex.flex-row.items-center
     {:class (util/classnames [{:is-order-list order-list?
                                :bullet-closed collapsed?}])}
     (when (or (not fold-button-right?) collapsable?)
       [:a.block-control
        {:id       (str "control-" uuid)
         :on-click (fn [event]
                     (util/stop event)
                     (state/clear-edit!)
                     (if ref?
                       (state/toggle-collapsed-block! uuid)
                       (if collapsed?
                         (editor-handler/expand-block! uuid)
                         (editor-handler/collapse-block! uuid))))}
        [:span {:class (if (or (and control-show?
                                    (or collapsed?
                                        (editor-handler/collapsable? uuid {:semantic? true})))
                               (and collapsed? order-list?))
                         "control-show cursor-pointer"
                         "control-hide")}
         (ui/rotating-arrow collapsed?)]])

     (let [bullet [:a.bullet-link-wrap {:on-click #(bullet-on-click % block uuid)}
                   [:span.bullet-container.cursor
                    {:id (str "dot-" uuid)
                     :draggable true
                     :on-drag-start (fn [event]
                                      (bullet-drag-start event block uuid block-id))
                     :blockid (str uuid)
                     :class (str (when collapsed? "bullet-closed")
                                 (when (and (:document/mode? config)
                                            (not collapsed?))
                                   " hide-inner-bullet")
                                 (when order-list? " as-order-list typed-list"))}

                    [:span.bullet {:blockid (str uuid)}
                     (when order-list?
                       [:label (str order-list-idx ".")])]]]]
       (cond
         (and (or (mobile-util/native-platform?)
                  (:ui/show-empty-bullets? (state/get-config))
                  collapsed?
                  collapsable?)
              (not doc-mode?))
         bullet

         (or
           (and empty-content?
                (not edit?)
                (not (:block.temp/top? block))
                (not (:block.temp/bottom? block))
                (not (util/react *control-show?)))
           (and doc-mode?
                (not collapsed?)
                (not (util/react *control-show?))))
         ;; hidden
         [:span.bullet-container]

         :else
         bullet))]))

(rum/defc dnd-separator
  [move-to block-content?]
  [:div.relative
   [:div.dnd-separator.absolute
    {:style {:left (cond-> (if (= move-to :nested) 40 20)
                     block-content?
                     (- 34))
             :top 0
             :width "100%"
             :z-index 3}}]])

(defn block-checkbox
  [block class]
  (let [marker (:block/marker block)
        [class checked?] (cond
                           (nil? marker)
                           nil
                           (contains? #{"NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING"} marker)
                           [class false]
                           (= "DONE" marker)
                           [(str class " checked") true])]
    (when class
      (ui/checkbox {:class class
                    :style {:margin-right 5}
                    :checked checked?
                    :on-mouse-down (fn [e]
                                     (util/stop-propagation e))
                    :on-change (fn [_e]
                                 (if checked?
                                   (editor-handler/uncheck block)
                                   (editor-handler/check block)))}))))

(defn list-checkbox
  [config checked?]
  (ui/checkbox
   {:style {:margin-right 6}
    :checked checked?
    :on-change (fn [event]
                 (let [target (.-target event)
                       block (:block config)
                       item-content (.. target -nextSibling -data)
                       item-full-content (str (if checked? "[X]" "[ ]") " " item-content)
                       new-item-full-content (str (if checked? "[ ]" "[X]") " " item-content)]
                   (editor-handler/toggle-list-checkbox block item-full-content new-item-full-content)))}))

(defn marker-switch
  [{:block/keys [marker] :as block}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    (let [set-marker-fn (fn [new-marker]
                          (fn [e]
                            (util/stop e)
                            (editor-handler/set-marker block new-marker)))
          next-marker (case marker
                        "NOW" "LATER"
                        "LATER" "NOW"
                        "TODO" "DOING"
                        "DOING" "TODO")]
      [:a
       {:class (str "marker-switch block-marker " marker)
        :title (util/format "Change from %s to %s" marker next-marker)
        :on-mouse-down (set-marker-fn next-marker)}
       marker])))

(defn marker-cp
  [{:block/keys [pre-block? marker] :as _block}]
  (when-not pre-block?
    (when (contains? #{"IN-PROGRESS" "WAIT" "WAITING"} marker)
      [:span {:class (str "task-status block-marker " (string/lower-case marker))
              :style {:margin-right 3.5}}
       (string/upper-case marker)])))

(rum/defc set-priority
  [block priority]
  [:div
   (let [priorities (sort (remove #(= priority %) ["A" "B" "C"]))]
     (for [p priorities]
       [:a.mr-2.text-base.tooltip-priority {:key (str (random-uuid))
                                            :priority p
                                            :on-click (fn [] (editor-handler/set-priority block p))}]))])

(rum/defc priority-text
  [priority]
  [:a.opacity-50.hover:opacity-100
   {:class "priority"
    :href (rfe/href :page {:name priority})
    :style {:margin-right 3.5}}
   (util/format "[#%s]" (str priority))])

(defn priority-cp
  [{:block/keys [pre-block? priority] :as block}]
  (when (and (not pre-block?) priority)
    (ui/tippy
     {:interactive true
      :html (set-priority block priority)}
     (priority-text priority))))

(defn block-tags-cp
  [{:block/keys [pre-block? tags] :as _block}]
  (when (and (not pre-block?)
             (seq tags))
    (->elem
     :span
     {:class "block-tags"}
     (mapv (fn [tag]
             (when-let [page (db/entity (:db/id tag))]
               (let [tag (:block/name page)]
                 [:a.tag.mx-1 {:data-ref tag
                               :key (str "tag-" (:db/id tag))
                               :href (rfe/href :page {:name tag})}
                  (str "#" tag)])))
           tags))))

(declare block-content)

(defn build-block-title
  [config {:block/keys [title marker pre-block? properties level]
           :as t}]
  (let [config (assoc config :block t)
        slide? (boolean (:slide? config))
        block-ref? (:block-ref? config)
        block-type (or (keyword (:ls-type properties)) :default)
        html-export? (:html-export? config)
        checkbox (when (and (not pre-block?)
                            (not html-export?))
                   (block-checkbox t (str "mr-1 cursor")))
        marker-switch (when (and (not pre-block?)
                                 (not html-export?))
                        (marker-switch t))
        marker-cp (marker-cp t)
        priority (priority-cp t)
        tags (block-tags-cp t)
        bg-color (:background-color properties)
        ;; `heading-level` is for backward compatibility, will remove it in later releases
        heading-level (:block/heading-level t)
        heading (or
                 (and heading-level
                      (<= heading-level 6)
                      heading-level)
                 (:heading properties))
        heading (if (true? heading) (min (inc level) 6) heading)
        elem (if heading
               (keyword (str "h" heading
                             (when block-ref? ".inline")))
               :span.inline)]
    (->elem
     elem
     (merge
      {:data-hl-type (:hl-type properties)}
      (when (and marker
                 (not (string/blank? marker))
                 (not= "nil" marker))
        {:class (str (string/lower-case marker))})
      (when bg-color
        (let [built-in-color? (ui/built-in-color? bg-color)]
          {:style {:background-color (if built-in-color?
                                       (str "var(--ls-highlight-color-" bg-color ")")
                                       bg-color)
                   :color (when-not built-in-color? "white")}
           :class "px-1 with-bg-color"})))

     ;; children
     (let [area?  (= :area (keyword (:hl-type properties)))
           hl-ref #(when (and (or config/publishing? (util/electron?))
                              (not (#{:default :whiteboard-shape} block-type)))
                     [:div.prefix-link
                      {:on-mouse-down
                       (fn [^js e]
                         (let [^js target (.-target e)]
                           (case block-type
                             ;; pdf annotation
                             :annotation
                             (if (and area? (.contains (.-classList target) "blank"))
                               :actions
                               (do
                                 (pdf-assets/open-block-ref! t)
                                 (util/stop e)))

                             :dune)))}

                      [:span.hl-page
                       [:strong.forbid-edit (str "P" (or (:hl-page properties) "?"))]
                       [:label.blank " "]]

                      (when (and area? (:hl-stamp properties))
                        (pdf-assets/area-display t))])]
       (remove-nils
        (concat
         [(when-not slide? checkbox)
          (when-not slide? marker-switch)
          marker-cp
          priority]

         ;; highlight ref block (inline)
         (when-not area? [(hl-ref)])

         (if title
           (conj
            (map-inline config title)
            (when (= block-type :whiteboard-shape) [:span.mr-1 (ui/icon "whiteboard-element" {:extension? true})]))
           [[:span.opacity-50 "Click here to start writing, type '/' to see all the commands."]])

         [tags]

         ;; highlight ref block (area)
         (when area? [(hl-ref)])))))))

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
       (page-cp (assoc config :property? true) {:block/name (subs (str k) 1)})
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

        (and (string? v) (gp-util/wrapped-by-quotes? v))
        (gp-util/unquote-string v)

        (and property-separated-by-commas? (coll? v))
        (let [v (->> (remove string/blank? v)
                     (filter string?))
              vals (for [v-item v]
                     (page-cp config {:block/name v-item}))
              elems (interpose (span-comma) vals)]
          (for [elem elems]
            (rum/with-key elem (str (random-uuid)))))

        :else
        (inline-text config (:block/format block) (str v)))]]))

(rum/defc properties-cp
  [config {:block/keys [pre-block?] :as block}]
  (let [ordered-properties
        (property/get-visible-ordered-properties (:block/properties block)
                                                 (:block/properties-order block)
                                                 {:pre-block? pre-block?
                                                  :page-id (:db/id (:block/page block))})]
    (cond
      (seq ordered-properties)
      [:div.block-properties
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

(rum/defc invalid-properties-cp
  [invalid-properties]
  (when (seq invalid-properties)
    [:div.invalid-properties.mb-2
     [:div.warning {:title "Invalid properties"}
      "Invalid property names: "
      (for [p invalid-properties]
        [:button.p-1.mr-2 p])]
     [:code "Property name begins with a non-numeric character and can contain alphanumeric characters and . * + ! - _ ? $ % & = < >. If -, + or . are the first character, the second character (if any) must be non-numeric."]]))

(rum/defcs timestamp-cp
  < rum/reactive
  (rum/local false ::show-datepicker?)
  [state block typ ast]
  (let [ts-block-id (state/sub [:editor/set-timestamp-block :block :block/uuid])
        active? (= (get block :block/uuid) ts-block-id)
        *show-datapicker? (get state ::show-datepicker?)]
    [:div.flex.flex-col.gap-4.timestamp
     [:div.text-sm.flex.flex-row
      [:div.opacity-50.font-medium.timestamp-label
       (str typ ": ")]
      [:a.opacity-80.hover:opacity-100
       {:on-mouse-down (fn [e]
                         (util/stop e)
                         (state/clear-editor-action!)
                         (editor-handler/escape-editing false)
                         (if active?
                           (do
                             (reset! *show-datapicker? false)
                             (reset! commands/*current-command nil)
                             (state/set-timestamp-block! nil))
                           (do
                             (reset! *show-datapicker? true)
                             (reset! commands/*current-command typ)
                             (state/set-timestamp-block! {:block block
                                                          :typ typ}))))}
       [:span.time-start "<"] [:time (repeated/timestamp->text ast)] [:span.time-stop ">"]]]
     ;; date-picker in rendering-mode
     (if (and active? @*show-datapicker?)
       (datetime-comp/date-picker nil nil (repeated/timestamp->map ast))
       (reset! *show-datapicker? false))]))

(defn- target-forbidden-edit?
  [target]
  (or
   (dom/has-class? target "forbid-edit")
   (dom/has-class? target "bullet")
   (dom/has-class? target "logbook")
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

(defn- block-content-on-mouse-down
  [e block block-id content edit-input-id]
  (when-not (> (count content) (state/block-content-max-length (state/get-current-repo)))
    (let [target (gobj/get e "target")
          button (gobj/get e "buttons")
          shift? (gobj/get e "shiftKey")
          meta? (util/meta-key? e)
          forbidden-edit? (target-forbidden-edit? target)]
      (when-not forbidden-edit? (.stopPropagation e))
      (if (and meta?
               (not (state/get-edit-input-id))
               (not (dom/has-class? target "page-ref"))
               (not= "A" (gobj/get target "tagName")))
        (do
          (util/stop e)
          (state/conj-selection-block! (gdom/getElement block-id) :down)
          (when block-id
            (state/set-selection-start-block! block-id)))
        (when (contains? #{1 0} button)
          (when-not forbidden-edit?
            (cond
              (and shift? (state/get-selection-start-block-or-first))
              (do
                (util/stop e)
                (util/clear-selection!)
                (editor-handler/highlight-selection-area! block-id))

              shift?
              (util/clear-selection!)

              :else
              (do
                (editor-handler/clear-selection!)
                (editor-handler/unhighlight-blocks!)
                (let [f #(let [block (or (db/pull [:block/uuid (:block/uuid block)]) block)
                               cursor-range (some-> (gdom/getElement block-id)
                                                    (dom/by-class "block-content-wrapper")
                                                    first
                                                    util/caret-range)
                               {:block/keys [content format]} block
                               content (->> content
                                            (property/remove-built-in-properties format)
                                            (drawer/remove-logbook))]
                           ;; save current editing block
                           (let [{:keys [value] :as state} (editor-handler/get-state)]
                             (editor-handler/save-block! state value))
                           (state/set-editing!
                            edit-input-id
                            content
                            block
                            cursor-range
                            false))]
                  ;; wait a while for the value of the caret range
                  (if (util/ios?)
                    (f)
                    (js/setTimeout f 5))

                  (when block-id (state/set-selection-start-block! block-id)))))))))))

(rum/defc dnd-separator-wrapper < rum/reactive
  [block block-id slide? top? block-content?]
  (let [dragging? (rum/react *dragging?)
        drag-to-block (rum/react *drag-to-block)]
    (when (and
           (= block-id drag-to-block)
           dragging?
           (not slide?)
           (not (:block/pre-block? block)))
      (let [move-to (rum/react *move-to)]
        (when-not
         (or (and top? (not= move-to :top))
             (and (not top?) (= move-to :top))
             (and block-content? (not= move-to :nested))
             (and (not block-content?)
                  (seq (:block/children block))
                  (= move-to :nested)))
         (dnd-separator move-to block-content?))))))

(defn clock-summary-cp
  [block body]
  (when (and (state/enable-timetracking?)
             (or (= (:block/marker block) "DONE")
                 (contains? #{"TODO" "LATER"} (:block/marker block))))
    (let [summary (clock/clock-summary body true)]
      (when (and summary
                 (not= summary "0m")
                 (not (string/blank? summary)))
        [:div {:style {:max-width 100}}
         (ui/tippy {:html        (fn []
                                   (when-let [logbook (drawer/get-logbook body)]
                                     (let [clocks (->> (last logbook)
                                                       (filter #(string/starts-with? % "CLOCK:"))
                                                       (remove string/blank?))]
                                       [:div.p-4
                                        [:div.font-bold.mb-2 "LOGBOOK:"]
                                        [:ul
                                         (for [clock (take 10 (reverse clocks))]
                                           [:li clock])]])))
                    :interactive true
                    :in-editor?  true
                    :delay       [1000, 100]}
                   [:div.text-sm.time-spent.ml-1 {:style {:padding-top 3}}
                    [:a.fade-link
                     summary]])]))))

(defn- block-content-inner
  [config block body plugin-slotted? collapsed? block-ref-with-title?]
  (if plugin-slotted?
    [:div.block-slotted-body
     (plugins/hook-block-slot
      :block-content-slotted
      (-> block (dissoc :block/children :block/page)))]

    (let [title-collapse-enabled? (:outliner/block-title-collapse-enabled? (state/get-config))]
      (when (and (not block-ref-with-title?)
                 (seq body)
                 (or (not title-collapse-enabled?)
                     (and title-collapse-enabled?
                          (or (not collapsed?)
                              (some? (mldoc/extract-first-query-from-ast body))))))
        [:div.block-body
         ;; TODO: consistent id instead of the idx (since it could be changed later)
         (let [body (block/trim-break-lines! (:block/body block))]
           (for [[idx child] (medley/indexed body)]
             (when-let [block (markup-element-cp config child)]
               (rum/with-key (block-child block)
                 (str uuid "-" idx)))))]))))

(rum/defc block-content < rum/reactive
  [config {:block/keys [uuid content children properties scheduled deadline format pre-block?] :as block} edit-input-id block-id slide? selected?]
  (let [content (property/remove-built-in-properties format content)
        {:block/keys [title body] :as block} (if (:block/title block) block
                                                 (merge block (block/parse-title-and-body uuid format pre-block? content)))
        collapsed? (util/collapsed? block)
        plugin-slotted? (and config/lsp-enabled? (state/slot-hook-exist? uuid))
        block-ref? (:block-ref? config)
        stop-events? (:stop-events? config)
        block-ref-with-title? (and block-ref? (not (state/show-full-blocks?)) (seq title))
        block-type (or (:ls-type properties) :default)
        content (if (string? content) (string/trim content) "")
        mouse-down-key (if (util/ios?)
                         :on-click
                         :on-mouse-down) ; TODO: it seems that Safari doesn't work well with on-mouse-down

        attrs (cond->
               {:blockid       (str uuid)
                :data-type (name block-type)
                :style {:width "100%" :pointer-events (when stop-events? "none")}}

                (not (string/blank? (:hl-color properties)))
                (assoc :data-hl-color (:hl-color properties))

                (not block-ref?)
                (assoc mouse-down-key (fn [e]
                                        (block-content-on-mouse-down e block block-id content edit-input-id))))]
    [:div.block-content.inline
     (cond-> {:id (str "block-content-" uuid)
              :class (when selected? "select-none")
              :on-mouse-up (fn [e]
                             (when (and
                                    (state/in-selection-mode?)
                                    (not (string/includes? content "```"))
                                    (not (gobj/get e "shiftKey"))
                                    (not (util/meta-key? e)))
                               ;; clear highlighted text
                               (util/clear-selection!)))}
       (not slide?)
       (merge attrs))

     [:<>
      (when (> (count content) (state/block-content-max-length (state/get-current-repo)))
        [:div.warning.text-sm
         "Large block will not be editable or searchable to not slow down the app, please use another editor to edit this block."])
      [:div.flex.flex-row.justify-between.block-content-inner
       (when-not plugin-slotted?
         [:div.flex-1.w-full
          (cond
            (or (seq title) (:block/marker block))
            (build-block-title config block)

            :else
            nil)])

       (clock-summary-cp block body)]

      (when (seq children)
        (dnd-separator-wrapper block block-id slide? false true))

      (when deadline
        (when-let [deadline-ast (block-handler/get-deadline-ast block)]
          (timestamp-cp block "DEADLINE" deadline-ast)))

      (when scheduled
        (when-let [scheduled-ast (block-handler/get-scheduled-ast block)]
          (timestamp-cp block "SCHEDULED" scheduled-ast)))

      (when-let [invalid-properties (:block/invalid-properties block)]
        (invalid-properties-cp invalid-properties))

      (when (and (seq properties)
                 (let [hidden? (property/properties-hidden? properties)]
                   (not hidden?))
                 (not (and block-ref? (or (seq title) (seq body))))
                 (not (:slide? config))
                 (not= block-type :whiteboard-shape))
        (properties-cp config block))

      (block-content-inner config block body plugin-slotted? collapsed? block-ref-with-title?)

      (case (:block/warning block)
        :multiple-blocks
        [:p.warning.text-sm "Full content is not displayed, Logseq doesn't support multiple unordered lists or headings in a block."]
        nil)]]))

(rum/defc block-refs-count < rum/static
  [block *hide-block-refs?]
  (let [block-refs-count (count (:block/_refs block))]
    (when (> block-refs-count 0)
      [:div
       [:a.open-block-ref-link.bg-base-2.text-sm.ml-2.fade-link
        {:title "Open block references"
         :style {:margin-top -1}
         :on-click (fn [e]
                     (if (gobj/get e "shiftKey")
                       (state/sidebar-add-block!
                        (state/get-current-repo)
                        (:db/id block)
                        :block-ref)
                       (swap! *hide-block-refs? not)))}
        block-refs-count]])))

(rum/defc block-left-menu < rum/reactive
  [_config {:block/keys [uuid] :as _block}]
  [:div.block-left-menu.flex.bg-base-2.rounded-r-md.mr-1
   [:div.commands-button.w-0.rounded-r-md
    {:id (str "block-left-menu-" uuid)}
    [:div.indent (ui/icon "indent-increase" {:size 18})]]])

(rum/defc block-right-menu < rum/reactive
  [_config {:block/keys [uuid] :as _block} edit?]
  [:div.block-right-menu.flex.bg-base-2.rounded-md.ml-1
   [:div.commands-button.w-0.rounded-md
    {:id (str "block-right-menu-" uuid)
     :style {:max-width (if edit? 40 80)}}
    [:div.outdent (ui/icon "indent-decrease" {:size 18})]
    (when-not edit?
      [:div.more (ui/icon "dots-circle-horizontal" {:size 18})])]])

(rum/defcs block-content-or-editor < rum/reactive
  {:init (fn [state]
           (let [block (second (:rum/args state))
                 config (first (:rum/args state))
                 current-block-page? (= (str (:block/uuid block)) (state/get-current-page))
                 embed-self? (and (:embed? config)
                                  (= (:block/uuid block) (:block/uuid (:block config))))
                 default-hide? (if (and current-block-page? (not embed-self?) (state/auto-expand-block-refs?)) false true)]
             (assoc state ::hide-block-refs? (atom default-hide?))))}
  [state config {:block/keys [uuid format] :as block} edit-input-id block-id edit? hide-block-refs-count? selected?]
  (let [*hide-block-refs? (get state ::hide-block-refs?)
        hide-block-refs? (rum/react *hide-block-refs?)
        editor-box (get config :editor-box)
        editor-id (str "editor-" edit-input-id)
        slide? (:slide? config)
        block-reference-only? (some->
                               (:block/content block)
                               string/trim
                               block-ref/block-ref?)]
    (if (and edit? editor-box)
      [:div.editor-wrapper
       {:id editor-id}
       (ui/catch-error
        (ui/block-error "Something wrong in the editor" {})
        (editor-box {:block block
                     :block-id uuid
                     :block-parent-id block-id
                     :format format
                     :on-hide (fn [value event]
                                (when (= event :esc)
                                  (editor-handler/save-block! (editor-handler/get-state) value)
                                  (let [select? (not (string/includes? value "```"))]
                                    (editor-handler/escape-editing select?))))}
                    edit-input-id
                    config))]
      (let [refs-count (count (:block/_refs block))]
        [:div.flex.flex-col.block-content-wrapper
         [:div.flex.flex-row
          [:div.flex-1.w-full {:style {:display (if (:slide? config) "block" "flex")}}
           (ui/catch-error
            (ui/block-error "Block Render Error:"
                            {:content (:block/content block)
                             :section-attrs
                             {:on-click #(do
                                           (editor-handler/clear-selection!)
                                           (editor-handler/unhighlight-blocks!)
                                           (state/set-editing! edit-input-id (:block/content block) block ""))}})
            (block-content config block edit-input-id block-id slide? selected?))]

          (when-not hide-block-refs-count?
            [:div.flex.flex-row.items-center
             (when (and (:embed? config)
                        (:embed-parent config))
               [:a.opacity-70.hover:opacity-100.svg-small.inline
                {:on-mouse-down (fn [e]
                                  (util/stop e)
                                  (when-let [block (:embed-parent config)]
                                    (editor-handler/edit-block! block :max (:block/uuid block))))}
                svg/edit])

             (when block-reference-only?
               [:a.opacity-70.hover:opacity-100.svg-small.inline
                {:on-mouse-down (fn [e]
                                  (util/stop e)
                                  (editor-handler/edit-block! block :max (:block/uuid block)))}
                svg/edit])

             (block-refs-count block *hide-block-refs?)])]

         (when (and (not hide-block-refs?) (> refs-count 0))
           (let [refs-cp (state/get-component :block/linked-references)]
             (refs-cp uuid)))]))))

;; FIXME: not updating when block content is updated outbound
(rum/defcs single-block-cp-inner < rum/reactive db-mixins/query
  ;; todo: mixin for init-blocks-container-id?
  {:init (fn [state]
           (assoc state
                  ::init-blocks-container-id (atom nil)))}
  [state block-uuid]
  (let [uuid (if (string? block-uuid) (uuid block-uuid) block-uuid)
        *init-blocks-container-id (::init-blocks-container-id state)
        block-entity (db/entity [:block/uuid uuid])
        block-id (:db/id block-entity)
        block (first (model/get-paginated-blocks (state/get-current-repo) block-id))
        blocks-container-id (if @*init-blocks-container-id
                              @*init-blocks-container-id
                              (let [id' (swap! *blocks-container-id inc)]
                                (reset! *init-blocks-container-id id')
                                id'))
        block-el-id (str "ls-block-" blocks-container-id "-" uuid)
        config {:id (str uuid)
                :db/id (:db/id block-entity)
                :block/uuid uuid
                :block? true
                :editor-box (state/get-component :editor/box)}
        edit-input-id (str "edit-block-" blocks-container-id "-" uuid)
        edit? (state/sub [:editor/editing? edit-input-id])
        block (block/parse-title-and-body block)]
    (when (:block/content block)
      [:div.single-block.ls-block
       {:class (str block-uuid)
        :id (str "ls-block-" blocks-container-id "-" block-uuid)}
       (block-content-or-editor config block edit-input-id block-el-id edit? true false)])))

(rum/defc single-block-cp
  [block-uuid]
  (single-block-cp-inner block-uuid))

(defn non-dragging?
  [e]
  (and (= (gobj/get e "buttons") 1)
       (not (dom/has-class? (gobj/get e "target") "bullet-container"))
       (not (dom/has-class? (gobj/get e "target") "bullet"))
       (not @*dragging?)))

(rum/defc breadcrumb-fragment
  [config block label opts]
  [:a {:on-mouse-up
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
           (do
             (util/stop e)
             (state/sidebar-replace-block!
              (:sidebar-key config)
              [(state/get-current-repo)
               (:db/id block)
               (if (:block/name block) :page :block)]))

           :else
           (route-handler/redirect-to-page! (:block/uuid block))))}
   label])

(rum/defc breadcrumb-separator
  []
  (ui/icon "chevron-right" {:style {:font-size 20}
                            :class "opacity-50 mx-1"}))

(defn breadcrumb
  "block-id - uuid of the target block of breadcrumb. page uuid is also acceptable"
  [config repo block-id {:keys [show-page? indent? end-separator? level-limit _navigating-block]
                         :or {show-page? true
                              level-limit 3}
                         :as opts}]
  (when block-id
    (let [parents (db/get-block-parents repo block-id (inc level-limit))
          page (or (db/get-block-page repo block-id) ;; only return for block uuid
                   (model/query-block-by-uuid block-id)) ;; return page entity when received page uuid
          page-name (:block/name page)
          page-original-name (:block/original-name page)
          show? (or (seq parents) show-page? page-name)
          parents (if (= page-name (:block/name (first parents)))
                    (rest parents)
                    parents)
          more? (> (count parents) level-limit)
          parents (if more? (take-last level-limit parents) parents)
          config (assoc config :breadcrumb? true)]
      (when show?
        (let [page-name-props (when show-page?
                                [page
                                 (page-cp (dissoc config :breadcrumb? true) page)
                                 {:block/name (or page-original-name page-name)}])
              parents-props (doall
                             (for [{:block/keys [uuid name content] :as block} parents]
                               (when-not name ; not page
                                 (let [{:block/keys [title body]} (block/parse-title-and-body
                                                                   uuid
                                                                   (:block/format block)
                                                                   (:block/pre-block? block)
                                                                   content)
                                       config (assoc config :block/uuid uuid)]
                                   [block
                                    (when title
                                      (if (seq title)
                                        (->elem :span.inline-wrap (map-inline config title))
                                        (->elem :div (markup-elements-cp config body))))]))))
              breadcrumb (->> (into [] parents-props)
                              (concat [page-name-props] (when more? [:more]))
                              (filterv identity)
                              (map (fn [x] (if (and (vector? x) (second x))
                                             (let [[block label] x]
                                               (rum/with-key (breadcrumb-fragment config block label opts) (:block/uuid block)))
                                             [:span.opacity-70 "⋯"])))
                              (interpose (breadcrumb-separator)))]
          (when (seq breadcrumb)
            [:div.breadcrumb.block-parents
             {:class (when (seq breadcrumb)
                       (str (when-not (:search? config)
                              " my-2")
                            (when indent?
                              " ml-4")))}
             (when (and (false? (:top-level? config))
                        (seq parents))
               (breadcrumb-separator))
             breadcrumb
             (when end-separator? (breadcrumb-separator))]))))))

(defn- block-drag-over
  [event uuid top? block-id *move-to]
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

                          (> x-offset 50)
                          :nested

                          :else
                          :sibling)]
      (reset! *drag-to-block block-id)
      (reset! *move-to move-to-value))))

(defn- block-drag-leave
  [*move-to]
  (reset! *move-to nil))

(defn block-drag-end
  ([_event]
   (block-drag-end _event *move-to))
  ([_event *move-to]
   (reset! *dragging? false)
   (reset! *dragging-block nil)
   (reset! *drag-to-block nil)
   (reset! *move-to nil)
   (editor-handler/unhighlight-blocks!)))

(defn- block-drop
  [^js event uuid target-block *move-to]
  (util/stop event)
  (when-not (dnd-same-block? uuid)
    (let [block-uuids (state/get-selection-block-ids)
          lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
          selected (db/pull-many (state/get-current-repo) '[*] lookup-refs)
          blocks (if (seq selected) selected [@*dragging-block])
          blocks (remove-nils blocks)]
      (if-not (seq blocks)
        (when-let [text (.getData (.-dataTransfer event) "text/plain")]
          (editor-handler/api-insert-new-block!
           text
           {:block-uuid  uuid
            :edit-block? false
            :sibling?    (= @*move-to :sibling)
            :before?     (= @*move-to :top)}))
        (dnd/move-blocks event blocks target-block @*move-to))))
  (block-drag-end event *move-to))

(defn- block-mouse-over
  [e *control-show? block-id doc-mode?]
  (when-not @*dragging?
    (util/stop e)
    (reset! *control-show? true)
    (when-let [parent (gdom/getElement block-id)]
      (let [node (.querySelector parent ".bullet-container")]
        (when doc-mode?
          (dom/remove-class! node "hide-inner-bullet"))))
    (when (and
           (state/in-selection-mode?)
           (non-dragging? e))
      (editor-handler/highlight-selection-area! block-id))))

(defn- block-mouse-leave
  [e *control-show? block-id doc-mode?]
  (util/stop e)
  (reset! *control-show? false)
  (when doc-mode?
    (when-let [parent (gdom/getElement block-id)]
      (when-let [node (.querySelector parent ".bullet-container")]
        (dom/add-class! node "hide-inner-bullet"))))
  (when (and (non-dragging? e)
             (not @*resizing-image?))
    (state/into-selection-mode!)))

(defn- on-drag-and-mouse-attrs
  [block uuid top? block-id *move-to]
  {:on-drag-over (fn [event]
                   (block-drag-over event uuid top? block-id *move-to))
   :on-drag-leave (fn [_event]
                    (block-drag-leave *move-to))
   :on-drop (fn [event]
              (block-drop event uuid block *move-to))
   :on-drag-end (fn [event]
                  (block-drag-end event *move-to))})

(defn- build-refs-data-value
  [refs]
  (let [refs (model/get-page-names-by-ids
              (->> (map :db/id refs)
                   (remove nil?)))]
    (text-util/build-data-value refs)))

(defn- get-children-refs
  [children]
  (let [refs (atom [])]
    (walk/postwalk
     (fn [m]
       (when (and (map? m) (:block/refs m))
         (swap! refs concat (:block/refs m)))
       m)
     children)
    (distinct @refs)))

(defn- root-block?
  [config block]
  (and (:block? config)
       (util/collapsed? block)
       (= (:id config)
          (str (:block/uuid block)))))

(defn- build-config [config block {:keys [navigating-block navigated?]}]
  (cond-> config
    navigated?
    (assoc :id (str navigating-block))

    true
    (update :block merge block)

    ;; Each block might have multiple queries, but we store only the first query's result.
    ;; This :query-result atom is used by the query function feature to share results between
    ;; the parent's query block and the children blocks. This works because config is shared
    ;; between parent and children blocks
    (nil? (:query-result config))
    (assoc :query-result (atom nil))

    (:ref? config)
    (block-handler/attach-order-list-state block)))

(defn- build-block [repo config block* {:keys [navigating-block navigated?]}]
  (let [block (if (or (and (:custom-query? config)
                           (empty? (:block/children block*))
                           (not (and (:dsl-query? config)
                                     (string/includes? (:query config) "not"))))
                      navigated?)
                (let [block (db/pull [:block/uuid navigating-block])
                      blocks (db/get-paginated-blocks repo (:db/id block)
                                                      {:scoped-block-id (:db/id block)})
                      tree (tree/blocks->vec-tree blocks (:block/uuid (first blocks)))]
                  (first tree))
                block*)
        {:block/keys [pre-block? format content] :as block'}
        (if (:ref? config)
          (merge block (db/sub-block (:db/id block)))
          block)]
    (merge block' (block/parse-title-and-body uuid format pre-block? content))))

(rum/defc ^:large-vars/cleanup-todo block-container-inner < rum/reactive db-mixins/query
  [state repo config* block*]
  (let [ref? (:ref? config*)
        custom-query? (boolean (:custom-query? config*))
        ref-or-custom-query? (or ref? custom-query?)
        *navigating-block (get state ::navigating-block)
        navigating-block (rum/react *navigating-block)
        navigated? (and (not= (:block/uuid block*) navigating-block) navigating-block)
        block (build-block repo config* block* {:navigating-block navigating-block :navigated? navigated?})
        {:block/keys [uuid children pre-block? refs level content properties]} block
        {:block.temp/keys [top?]} block
        config (build-config config* block {:navigated? navigated? :navigating-block navigating-block})
        blocks-container-id (:blocks-container-id config)
        heading? (:heading properties)
        *control-show? (get state ::control-show?)
        db-collapsed? (util/collapsed? block)
        collapsed? (cond
                     (or ref-or-custom-query? (root-block? config block))
                     (state/sub-collapsed uuid)

                     :else
                     db-collapsed?)
        breadcrumb-show? (:breadcrumb-show? config)
        *show-left-menu? (::show-block-left-menu? state)
        *show-right-menu? (::show-block-right-menu? state)
        slide? (boolean (:slide? config))
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        reference? (:reference? config)
        whiteboard-block? (gp-whiteboard/shape-block? block)
        block-id (str "ls-block-" blocks-container-id "-" uuid)
        has-child? (first (:block/_parent (db/entity (:db/id block))))
        attrs (on-drag-and-mouse-attrs block uuid top? block-id *move-to)
        children-refs (get-children-refs children)
        data-refs (build-refs-data-value children-refs)
        data-refs-self (build-refs-data-value refs)
        edit-input-id (str "edit-block-" blocks-container-id "-" uuid)
        edit? (state/sub [:editor/editing? edit-input-id])
        card? (string/includes? data-refs-self "\"card\"")
        review-cards? (:review-cards? config)
        own-number-list? (:own-order-number-list? config)
        order-list? (boolean own-number-list?)
        selected? (when-not slide?
                    (state/sub-block-selected? blocks-container-id uuid))]
    [:div.ls-block
     (cond->
      {:id block-id
       :data-refs data-refs
       :data-refs-self data-refs-self
       :data-collapsed (and collapsed? has-child?)
       :class (str uuid
                   (when pre-block? " pre-block")
                   (when (and card? (not review-cards?)) " shadow-md")
                   (when selected? " selected")
                   (when order-list? " is-order-list")
                   (when (string/blank? content) " is-blank"))
       :blockid (str uuid)
       :haschild (str (boolean has-child?))}

       level
       (assoc :level level)

       (not slide?)
       (merge attrs)

       (or reference? embed?)
       (assoc :data-transclude true)

       embed?
       (assoc :data-embed true)

       custom-query?
       (assoc :data-query true))

     (when (and ref? breadcrumb-show?)
       (breadcrumb config repo uuid {:show-page? false
                                     :indent? true
                                     :navigating-block *navigating-block}))

     ;; only render this for the first block in each container
     (when top?
       (dnd-separator-wrapper block block-id slide? true false))

     [:div.block-main-container.flex.flex-row.pr-2
      {:class (if (and heading? (seq (:block/title block))) "items-baseline" "")
       :on-touch-start (fn [event uuid] (block-handler/on-touch-start event uuid))
       :on-touch-move (fn [event]
                        (block-handler/on-touch-move event block uuid edit? *show-left-menu? *show-right-menu?))
       :on-touch-end (fn [event]
                       (block-handler/on-touch-end event block uuid *show-left-menu? *show-right-menu?))
       :on-touch-cancel (fn [_e]
                          (block-handler/on-touch-cancel *show-left-menu? *show-right-menu?))
       :on-mouse-over (fn [e]
                        (block-mouse-over e *control-show? block-id doc-mode?))
       :on-mouse-leave (fn [e]
                         (block-mouse-leave e *control-show? block-id doc-mode?))}
      (when (not slide?)
        (block-control config block uuid block-id collapsed? *control-show? edit?))

      (when @*show-left-menu?
        (block-left-menu config block))

      (if whiteboard-block?
        (block-reference {} (str uuid) nil)
        ;; Not embed self
        (let [hide-block-refs-count? (and (:embed? config)
                                          (= (:block/uuid block) (:embed-id config)))]
          (block-content-or-editor config block edit-input-id block-id edit? hide-block-refs-count? selected?)))

      (when @*show-right-menu?
        (block-right-menu config block edit?))]

     (block-children config block children collapsed?)

     (dnd-separator-wrapper block block-id slide? false false)]))

(defn- attach-order-list-state!
  [cp-state]
  (let [args (:rum/args cp-state)]
    (assoc cp-state
      :rum/args (assoc (vec args) 0 (block-handler/attach-order-list-state (first args) (second args))))))

(rum/defcs block-container < rum/reactive
  (rum/local false ::show-block-left-menu?)
  (rum/local false ::show-block-right-menu?)
  {:init (fn [state]
           (let [[config block] (:rum/args state)
                 block-id (:block/uuid block)]
             (cond
               (root-block? config block)
               (state/set-collapsed-block! block-id false)

               (or (:ref? config) (:custom-query? config))
               (state/set-collapsed-block! block-id
                                           (boolean (editor-handler/block-default-collapsed? block config)))

               :else
               nil)
             (-> (assoc state
                   ::control-show? (atom false)
                   ::navigating-block (atom (:block/uuid block)))
                 (attach-order-list-state!))))

   :will-remount (fn [_old-state new-state]
                   (-> new-state
                       (attach-order-list-state!)))

   :should-update (fn [old-state new-state]
                    (let [compare-keys        [:block/uuid :block/content :block/parent :block/collapsed?
                                               :block/properties :block/left :block/children :block/_refs :block.temp/bottom? :block.temp/top?]
                          config-compare-keys [:show-cloze? :own-order-list-type :own-order-list-index]
                          b1                  (second (:rum/args old-state))
                          b2                  (second (:rum/args new-state))
                          result              (or
                                                (not= (select-keys b1 compare-keys)
                                                      (select-keys b2 compare-keys))
                                                (not= (select-keys (first (:rum/args old-state)) config-compare-keys)
                                                      (select-keys (first (:rum/args new-state)) config-compare-keys)))]
                      (boolean result)))
   :will-unmount (fn [state]
                   ;; restore root block's collapsed state
                   (let [[config block] (:rum/args state)
                         block-id (:block/uuid block)]
                     (when (root-block? config block)
                       (state/set-collapsed-block! block-id nil)))
                   state)}
  [state config block]
  (let [repo          (state/get-current-repo)
        ref?          (:ref? config)
        custom-query? (boolean (:custom-query? config))]
    (if (and (or ref? custom-query?) (not (:ref-query-child? config)))
      (ui/lazy-visible
       (fn [] (block-container-inner state repo config block))
       {:debug-id (str "block-container-ref " (:db/id block))})
      (block-container-inner state repo config block))))

(defn divide-lists
  [[f & l]]
  (loop [l        l
         ordered? (:ordered f)
         result   [[f]]]
    (if (seq l)
      (let [cur          (first l)
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
                    [["Paragraph" i] & rest]
                    (vec-cat
                     (map-inline config i)
                     (markup-elements-cp config rest))
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
  (case (get-shui-component-version :table config)
    2 (shui/table-v2 {:data (concat [[header]] groups)}
                     (make-shui-context config inline))
    1 (let [tr (fn [elm cols]
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
        [:div.table-wrapper
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
           (cons head groups)))])))

(defn logbook-cp
  [log]
  (let [clocks (filter #(string/starts-with? % "CLOCK:") log)
        clocks (reverse (sort-by str clocks))]
        ;; TODO: display states change log
        ; states (filter #(not (string/starts-with? % "CLOCK:")) log)

    (when (seq clocks)
      (let [tr (fn [elm cols] (->elem :tr
                                      (mapv (fn [col] (->elem elm col)) cols)))
            head  [:thead.overflow-x-scroll (tr :th.py-0 ["Type" "Start" "End" "Span"])]
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

(declare ->hiccup)

(rum/defc src-cp < rum/static
  [config options html-export?]
  (when options
    (let [{:keys [lines language]} options
          attr (when language
                 {:data-lang language})
          code (apply str lines)
          [inside-portal? set-inside-portal?] (rum/use-state nil)]
      (cond
        html-export?
        (highlight/html-export attr code)

        :else
        (let [language (if (contains? #{"edn" "clj" "cljc" "cljs"} language) "clojure" language)]
          [:div.ui-fenced-code-editor
           {:ref (fn [el]
                   (set-inside-portal? (and el (whiteboard-handler/inside-portal? el))))}
           (cond
             (nil? inside-portal?) nil

             (or (:slide? config) inside-portal?)
             (highlight/highlight (str (random-uuid))
                                  {:class     (str "language-" language)
                                   :data-lang language}
                                  code)

             :else
             [:<>
              (lazy-editor/editor config (str (d/squuid)) attr code options)
              (let [options (:options options) block (:block config)]
                (when (and (= language "clojure") (contains? (set options) ":results"))
                  (sci/eval-result code block)))])])))))

(defn ^:large-vars/cleanup-todo markup-element-cp
  [{:keys [html-export?] :as config} item]
  (try
    (match item
      ["Drawer" name lines]
      (when (or (not= name "logbook")
                (and
                 (= name "logbook")
                 (state/enable-timetracking?)
                 (or  (get-in (state/get-config) [:logbook/settings :enabled-in-all-blocks])
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
      (when-not (:slide? config)
        [:hr])
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
        (latex/latex (str (d/squuid)) s true true))
      ["Example" l]
      [:pre.pre-wrap-white-space
       (join-lines l)]
      ["Quote" l]
      (->elem
       :blockquote
       (markup-elements-cp config l))
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
        (latex/latex (str (d/squuid)) content true false))

      ["Custom" "query" _options _result content]
      (try
        (let [query (reader/read-string content)]
          (query/custom-query (wrap-query-components config) query))
        (catch :default e
          (log/error :read-string-error e)
          (ui/block-error "Invalid query:" {:content content})))

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
          (latex/latex (str (d/squuid)) content true true)))

      ["Displayed_Math" content]
      (if html-export?
        (latex/html-export content true true)
        (latex/latex (str (d/squuid)) content true true))

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
         (if-let [opts (plugin-handler/hook-fenced-code-by-type lang)]
           [:div.ui-fenced-code-wrap
            (src-cp config options html-export?)
            (plugins/hook-ui-fenced-code (:block config) (string/join "" (:lines options)) opts)]
           (src-cp config options html-export?))])

      :else
      "")
    (catch :default e
      (println "Convert to html failed, error: " e)
      "")))

(defn markup-elements-cp
  [config col]
  (map #(markup-element-cp config %) col))

(defn- block-item
  [config blocks idx item]
  (let [item (->
              (dissoc item :block/meta)
              (assoc :block.temp/top? (zero? idx)
                     :block.temp/bottom? (= (count blocks) (inc idx))))
        config (assoc config :block/uuid (:block/uuid item))]
    (rum/with-key (block-container config item)
      (str (:blocks-container-id config) "-" (:block/uuid item)))))

(defn- block-list
  [config blocks]
  (for [[idx item] (medley/indexed blocks)]
    (block-item config blocks idx item)))

(defn- custom-query-or-ref?
  [config]
  (let [ref? (:ref? config)
        custom-query? (:custom-query? config)]
    (or custom-query? ref?)))

(defn- load-more-blocks!
  [config flat-blocks]
  (when-let [db-id (:db/id config)]
    (let [last-block-id (:db/id (last flat-blocks))]
      (block-handler/load-more! db-id last-block-id))))

(defn- loading-more-data!
  [config *loading? flat-blocks initial?]
  ;; To prevent scrolling after inserting new blocks
  (when (or initial?
            (and (not initial?) (> (- (util/time-ms) (:start-time config)) 100)))
    (reset! *loading? true)
    (load-more-blocks! config flat-blocks)
    (reset! *loading? false)))

(rum/defcs lazy-blocks < rum/reactive
  (rum/local nil ::loading?)
  {:init (fn [state]
           (assoc state ::id (str (random-uuid))))
   :did-mount (fn [state]
                (let [[config _ flat-blocks] (:rum/args state)]
                  (loading-more-data! config (::loading? state) flat-blocks true))
                state)}
  [state config blocks flat-blocks]
  (let [db-id (:db/id config)
        *loading? (::loading? state)]
    (if-not db-id
      (block-list config blocks)
      (let [has-more? (and
                       (>= (count flat-blocks) model/initial-blocks-length)
                       (some? (model/get-next-open-block (db/get-db) (last flat-blocks) db-id)))
            dom-id (str "lazy-blocks-" (::id state))]
        [:div {:id dom-id}
         (ui/infinite-list
          "main-content-container"
          (block-list config blocks)
          {:on-load #(loading-more-data! config *loading? flat-blocks false)
           :bottom-reached (fn []
                             (when-let [node (gdom/getElement dom-id)]
                               (ui/bottom-reached? node 300)))
           :has-more has-more?
           :more (cond
                   (or (:preview? config) (:sidebar? config))
                   "More"

                   @*loading?
                   (ui/lazy-loading-placeholder 88)

                   :else
                   "")})]))))

(rum/defcs blocks-container <
  {:init (fn [state] (assoc state ::init-blocks-container-id (atom nil)))}
  [state blocks config]
  (let [*init-blocks-container-id (::init-blocks-container-id state)
        blocks-container-id (if @*init-blocks-container-id
                              @*init-blocks-container-id
                              (let [id' (swap! *blocks-container-id inc)]
                                (reset! *init-blocks-container-id id')
                                id'))
        config (assoc config :blocks-container-id blocks-container-id)
        doc-mode? (:document/mode? config)]
    (when (seq blocks)
      (let [flat-blocks (vec blocks)
            query-or-ref? (custom-query-or-ref? config)
            id (if (:navigated? config) @(:navigating-block config) (:id config))
            blocks' (if (or (and query-or-ref? (:navigated? config))
                            (not query-or-ref?))
                      (tree/blocks->vec-tree flat-blocks id)
                      flat-blocks)
            config (assoc config :start-time (util/time-ms))]
        [:div.blocks-container.flex-1
         {:class (when doc-mode? "document-mode")}
         (lazy-blocks config blocks' flat-blocks)]))))

(rum/defcs breadcrumb-with-container < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [first-block (ffirst (:rum/args state))]
             (assoc state
                    ::initial-block    first-block
                    ::navigating-block (atom (:block/uuid first-block)))))}
  [state blocks config]
  (let [repo (state/get-current-repo)
        *navigating-block (::navigating-block state)
        navigating-block (rum/react *navigating-block)
        navigating-block-entity (db/entity [:block/uuid navigating-block])
        navigated? (and
                    navigating-block
                    (not= (:db/id (:block/parent (::initial-block state)))
                          (:db/id (:block/parent navigating-block-entity))))
        blocks (if navigated?
                 (let [block navigating-block-entity]
                   (db/get-paginated-blocks repo (:db/id block)
                                            {:scoped-block-id (:db/id block)}))
                 blocks)]
    [:div
     (when (:breadcrumb-show? config)
       (breadcrumb config (state/get-current-repo) (or navigating-block (:block/uuid (first blocks)))
                   {:show-page? false
                    :navigating-block *navigating-block}))
     (blocks-container blocks (assoc config
                                     :breadcrumb-show? false
                                     :navigating-block *navigating-block
                                     :navigated? navigated?))]))

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
          (ui/lazy-visible
           (fn []
             (let [alias? (:block/alias? page)
                   page (db/entity (:db/id page))
                   blocks (tree/non-consecutive-blocks->vec-tree blocks)
                   parent-blocks (group-by :block/parent blocks)]
               [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                            (:ref? config)
                            (assoc :class "color-level px-2 sm:px-7 py-2 rounded"))
                (ui/foldable
                 [:div
                  (page-cp config page)
                  (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
                 (let [{top-level-blocks true others false} (group-by
                                                             (fn [b] (= (:db/id page) (:db/id (first b))))
                                                             parent-blocks)
                       sorted-parent-blocks (concat top-level-blocks others)]
                   (for [[parent blocks] sorted-parent-blocks]
                     (let [top-level? (= (:db/id parent) (:db/id page))]
                       (rum/with-key
                         (breadcrumb-with-container blocks (assoc config :top-level? top-level?))
                         (:db/id parent)))))
                 {:debug-id page})])))))]

     (and (:ref? config) (:group-by-page? config))
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)]
        (for [[page page-blocks] blocks]
          (ui/lazy-visible
           (fn []
             (let [alias? (:block/alias? page)
                   page (db/entity (:db/id page))
                   ;; FIXME: parents need to be sorted
                   parent-blocks (group-by :block/parent page-blocks)]
               [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                            (:ref? config)
                            (assoc :class "color-level px-2 sm:px-7 py-2 rounded"))
                (ui/foldable
                 [:div
                  (page-cp config page)
                  (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
                 (for [[parent blocks] parent-blocks]
                   (let [blocks' (map (fn [b]
                                        ;; Block might be a datascript entity
                                        (if (e/entity? b)
                                          (db/pull (:db/id b))
                                          (update b :block/children
                                                  (fn [col]
                                                    (tree/non-consecutive-blocks->vec-tree col))))) blocks)]
                     (rum/with-key
                       (breadcrumb-with-container blocks' config)
                       (:db/id parent))))
                 {:debug-id page})])))))]

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
                [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                             (:ref? config)
                             (assoc :class "color-level px-2 sm:px-7 py-2 rounded"))
                 (ui/foldable
                  [:div
                   (page-cp config page)
                   (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
                  (when-not whiteboard? (blocks-container blocks config))
                  {})])))))]

     :else
     (blocks-container blocks config))])
