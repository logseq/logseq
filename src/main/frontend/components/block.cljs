(ns frontend.components.block
  (:refer-clojure :exclude [range])
  (:require ["/frontend/utils" :as utils]
            [cljs-bean.core :as bean]
            [cljs.core.match :refer [match]]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as dc]
            [dommy.core :as d]
            [frontend.commands :as commands]
            [frontend.components.datetime :as datetime-comp]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.components.svg :as svg]
            [frontend.components.macro :as macro]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.utils :as db-utils]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.extensions.highlight :as highlight]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.sci :as sci]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.extensions.zotero :as zotero]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.components.plugins :as plugins]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.repeated :as repeated]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.query :as query-handler]
            [frontend.handler.common :as common-handler]
            [frontend.modules.outliner.tree :as tree]
            [frontend.search :as search]
            [frontend.security :as security]
            [frontend.state :as state]
            [frontend.template :as template]
            [frontend.text :as text]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [frontend.util.drawer :as drawer]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [shadow.loader :as loader]
            [frontend.components.query-table :as query-table]))

;; TODO: remove rum/with-context because it'll make reactive queries not working

(defn safe-read-string
  ([s]
   (safe-read-string s true))
  ([s warn?]
   (try
     (reader/read-string s)
     (catch js/Error e
       (println "read-string error:")
       (js/console.error e)
       (when warn?
         [:div.warning {:title "read-string failed"}
          s])))))

;; local state
(defonce *dragging?
  (atom false))
(defonce *dragging-block
  (atom nil))
(defonce *drag-to-block
  (atom nil))
(def *move-to (atom nil))

;; TODO: dynamic
(defonce max-blocks-per-page 200)
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
    (string/replace s "file://" "")

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
            current-dir (string/join "/" (drop-last 1 parts))]
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
            (string/join "/" (reverse parts))))))))

(defonce *resizing-image? (atom false))
(rum/defcs resizable-image <
  (rum/local nil ::size)
  {:will-unmount (fn [state]
                   (reset! *resizing-image? false)
                   state)}
  [state config title src metadata full_text local?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [size (get state ::size)]
      (ui/resize-provider
       (ui/resize-consumer
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
                             (editor-handler/resize-image! block-id metadata full_text size))))
                       (when @*resizing-image?
                          ;; TODO: need a better way to prevent the clicking to edit current block
                         (js/setTimeout #(reset! *resizing-image? false) 200)))
          :onClick (fn [e]
                     (when @*resizing-image? (util/stop e)))}
          (and (:width metadata) (not (util/mobile?)))
          (assoc :style {:width (:width metadata)}))
        [:div.asset-container
         [:img.rounded-sm.shadow-xl.relative
          (merge
           {:loading "lazy"
            :src     src
            :title   title}
           metadata)]
         [:span.ctl
          [:a.delete
           {:title "Delete this image"
            :on-click
            (fn [e]
              (when-let [block-id (:block/uuid config)]
                (let [confirm-fn (ui/make-confirm-modal
                                  {:title         (t :asset/confirm-delete (.toLocaleLowerCase (t :text/image)))
                                   :sub-title     (if local? :asset/physical-delete "")
                                   :sub-checkbox? local?
                                   :on-confirm    (fn [e {:keys [close-fn sub-selected]}]
                                                    (close-fn)
                                                    (editor-handler/delete-asset-of-block!
                                                     {:block-id    block-id
                                                      :local?      local?
                                                      :delete-local? (first sub-selected)
                                                      :repo        (state/get-current-repo)
                                                      :href        src
                                                      :title       title
                                                      :full-text   full_text}))})]
                  (state/set-modal! confirm-fn)
                  (util/stop e))))}
           svg/trash-sm]

          [:a.delete.ml-1
           {:title    "maximize image"
            :on-click (fn [^js e] (let [images (js/document.querySelectorAll ".asset-container img")
                                        images (to-array images)
                                        images (if-not (= (count images) 1)
                                                 (let [^js image (.closest (.-target e) ".asset-container")
                                                       image (js/image.querySelector "img")]
                                                   (cons image (remove #(= image %) images)))
                                                 images)
                                        images (for [^js it images] {:src (.-src it)
                                                                     :w (.-naturalWidth it)
                                                                     :h (.-naturalHeight it)})]

                                    (if (seq images)
                                      (lightbox/preview-images! images))))}

           (svg/maximize)]]])))))

(rum/defcs asset-link < rum/reactive
  (rum/local nil ::src)
  [state config title href label metadata full_text]
  (let [src (::src state)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        href (config/get-local-asset-absolute-path href)]
    (when (or granted? (util/electron?))
      (p/then (editor-handler/make-asset-url href) #(reset! src %)))

    (when @src
      (resizable-image config title @src metadata full_text true))))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [config url href label metadata full_text]
  (let [metadata (if (string/blank? metadata)
                   nil
                   (safe-read-string metadata false))
        title (second (first label))]
    (ui/catch-error
     [:span.warning full_text]
     (if (and (config/local-asset? href)
              (config/local-db? (state/get-current-repo)))
       (asset-link config title href label metadata full_text)
       (let [protocol (and (= "Complex" (first url))
                           (:protocol (second url)))
             href (cond
                    (util/starts-with? href "http")
                    href

                    config/publishing?
                    (subs href 1)

                    (= protocol "data")
                    href

                    :else
                    (get-file-absolute-path config href))]
         (resizable-image config title href metadata full_text false))))))

(defn repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [active date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (when hour (util/zero-pad hour))
        min  (when min (util/zero-pad min))
        time (cond
               (and hour min)
               (util/format " %s:%s" hour min)
               hour
               (util/format " %s" hour)
               :else
               "")]
    (util/format "%s%s-%s-%s %s%s%s%s"
                 open
                 (str year)
                 (util/zero-pad month)
                 (util/zero-pad day)
                 wday
                 time
                 repetition
                 close)))

(defn timestamp [{:keys [active date time repetition wday] :as t} kind]
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
                 nil)]
    (let [class (when (= kind "Closed")
                  "line-through")]
      [:span.timestamp (cond-> {:active (str active)}
                         class
                         (assoc :class class))
       prefix
       (timestamp-to-string t)])))

(defn range [{:keys [start stop]} stopped?]
  [:div {:class "timestamp-range"
         :stopped stopped?}
   (timestamp start "Start")
   (timestamp stop "Stop")])

(declare map-inline)
(declare markup-element-cp)
(declare markup-elements-cp)

(declare page-reference)

(rum/defc page-inner
  [config page-name href redirect-page-name page-entity contents-page? children html-export? label]
  (let [tag? (:tag? config)]
    [:a
     {:class (if tag? "tag" "page-ref")
      :data-ref page-name
      :on-mouse-down
      (fn [e]
        (util/stop e)
        (let [create-first-block! (fn []
                                    (when-not (editor-handler/add-default-title-property-if-needed! redirect-page-name)
                                      (editor-handler/insert-first-page-block-if-not-exists! redirect-page-name)))]
          (if (gobj/get e "shiftKey")
            (do
              (js/setTimeout create-first-block! 310)
              (when-let [page-entity (db/entity [:block/name redirect-page-name])]
                (state/sidebar-add-block!
                 (state/get-current-repo)
                 (:db/id page-entity)
                 :page
                 {:page page-entity})))
            (do
              (create-first-block!)
              (route-handler/redirect! {:to :page
                                        :path-params {:name redirect-page-name}}))))
        (when (and contents-page? (state/get-left-sidebar-open?))
          (ui-handler/close-left-sidebar!)))}

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
         (let [s (get page-entity :block/original-name page-name)]
           (if tag? (str "#" s) s))))]))

(rum/defc page-preview-trigger
  [{:keys [children sidebar? tippy-position tippy-distance fixed-position? open? manual?] :as config} page-name]
  (let [redirect-page-name (or (model/get-redirect-page-name page-name (:block/alias? config))
                               page-name)
        page-original-name (model/get-page-original-name redirect-page-name)
        html-template (fn []
                        (when redirect-page-name
                          [:div.tippy-wrapper.overflow-y-auto.p-4
                           {:style {:width          600
                                    :text-align     "left"
                                    :font-weight    500
                                    :max-height     600
                                    :padding-bottom 64}}
                           (if (and (string? page-original-name) (string/includes? page-original-name "/"))
                             [:div.my-2
                              (->>
                               (for [page (string/split page-original-name #"/")]
                                 (when (and (string? page) page)
                                   (page-reference false page {} nil)))
                               (interpose [:span.mx-2.opacity-30 "/"]))]
                             [:h2.font-bold.text-lg (if (= page-name redirect-page-name)
                                                      page-original-name
                                                      [:span
                                                       [:span.text-sm.mr-2 "Alias:"]
                                                       page-original-name])])
                           (let [page (db/entity [:block/name (string/lower-case redirect-page-name)])]
                             (editor-handler/insert-first-page-block-if-not-exists! redirect-page-name)
                             (when-let [f (state/get-page-blocks-cp)]
                               (f (state/get-current-repo) page {:sidebar? sidebar? :preview? true})))]))]
    (if (or (not manual?) open?)
      (ui/tippy {:html            html-template
                 :interactive     true
                 :delay           [1000, 100]
                 :fixed-position? fixed-position?
                 :position        (or tippy-position "top")
                 :distance        (or tippy-distance 10)}
                children)
      children)))

(rum/defc page-cp
  [{:keys [html-export? label children contents-page? sidebar? preview?] :as config} page]
  (when-let [page-name (:block/name page)]
    (let [page-name (-> (string/lower-case page-name)
                        (util/remove-boundary-slashes))
          page-entity (db/entity [:block/name page-name])
          redirect-page-name (model/get-redirect-page-name page-name (:block/alias? config))
          href (if html-export?
                 (util/encode-str page-name)
                 (rfe/href :page {:name redirect-page-name}))
          inner (page-inner config
                            page-name
                            href redirect-page-name page-entity contents-page? children html-export? label)]
      (if (and (not (util/mobile?)) (not preview?))
        (page-preview-trigger (assoc config :children inner) page-name)
        inner))))

(rum/defc asset-reference
  [config title path]
  (let [repo-path (config/get-repo-dir (state/get-current-repo))
        full-path (if (util/absolute-path? path)
                    path
                    (.. util/node-path (join repo-path (config/get-local-asset-absolute-path path))))
        ext-name (util/get-file-ext full-path)
        title-or-path (cond
                        (string? title)
                        title
                        (seq title)
                        (->elem :span (map-inline config title))
                        :else
                        path)]
    [:div.asset-ref-wrap
     {:data-ext ext-name}

     (if (= "pdf" ext-name)
       [:a.asset-ref.is-pdf
        {:on-mouse-down (fn [e]
                          (when-let [current (pdf-assets/inflate-asset full-path)]
                            (util/stop e)
                            (state/set-state! :pdf/current current)))}
        title-or-path]
       [:a.asset-ref {:target "_blank" :href full-path}
        title-or-path])

     (case ext-name
       ;; https://en.wikipedia.org/wiki/HTML5_video
       ("mp4" "ogg" "webm" "mov")
       [:video {:src full-path
                :controls true}]

       nil)]))

(defonce excalidraw-loaded? (atom false))
(rum/defc excalidraw < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :excalidraw)]
             (reset! excalidraw-loaded? true))
           state)}
  [file]
  (let [loaded? (rum/react excalidraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.excalidraw/draw))]
    (when draw-component
      (draw-component {:file file}))))

(rum/defc page-reference < rum/reactive
  [html-export? s config label]
  (let [show-brackets? (state/show-brackets?)
        nested-link? (:nested-link? config)
        contents-page? (= "contents" (string/lower-case (str (:id config))))
        draw? (string/ends-with? s ".excalidraw")]
    (if (string/ends-with? s ".excalidraw")
      [:div.draw {:on-click (fn [e]
                              (.stopPropagation e))}
       (excalidraw s)]
      [:span.page-reference
       {:data-ref s}
       (when (and (or show-brackets? nested-link?)
                  (not html-export?)
                  (not contents-page?))
         [:span.text-gray-500.bracket "[["])
       (let [s (string/trim s)]
         (page-cp (assoc config
                         :label (mldoc/plain->text label)
                         :contents-page? contents-page?)
                  {:block/name s}))
       (when (and (or show-brackets? nested-link?)
                  (not html-export?)
                  (not contents-page?))
         [:span.text-gray-500.bracket "]]"])])))

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
    (editor-handler/edit-block! config :max (:block/format config) (:block/uuid config))))

(rum/defc block-embed < rum/reactive db-mixins/query
  [config id]
  (let [blocks (db/get-block-and-children (state/get-current-repo) id)]
    [:div.color-level.embed-block.bg-base-2
     {:style {:z-index 2}
      :on-double-click #(edit-parent-block % config)
      :on-mouse-down (fn [e] (.stopPropagation e))}
     [:div.px-3.pt-1.pb-2
      (blocks-container blocks (assoc config
                                      :parent (:block config)
                                      :id (str id)
                                      :embed-id id
                                      :embed? true
                                      :ref? false))]]))

(rum/defc page-embed < rum/reactive db-mixins/query
  [config page-name]
  (let [page-name (string/trim (string/lower-case page-name))
        current-page (state/get-current-page)]
    [:div.color-level.embed.embed-page.bg-base-2
     {:class (when (:sidebar? config) "in-sidebar")
      :on-double-click #(edit-parent-block % config)
      :on-mouse-down #(.stopPropagation %)}
     [:section.flex.items-center.p-1.embed-header
      [:div.mr-3 svg/page]
      (page-cp config {:block/name page-name})]
     (when (and
            (not= (string/lower-case (or current-page ""))
                  page-name)
            (not= (string/lower-case (get config :id ""))
                  page-name))
       (let [blocks (db/get-page-blocks (state/get-current-repo) page-name)]
         (blocks-container blocks (assoc config
                                         :id page-name
                                         :embed? true
                                         :page-embed? true
                                         :ref? false))))]))

(defn- get-label-text
  [label]
  (and (= 1 (count label))
       (let [label (first label)]
         (string? (last label))
         (last label))))

(defn- get-page
  [label]
  (when-let [label-text (get-label-text label)]
    (db/entity [:block/name (string/lower-case label-text)])))

(defn- macro->text
  [name arguments]
  (if (and (seq arguments)
           (not= arguments ["null"]))
    (util/format "{{{%s %s}}}" name (string/join ", " arguments))
    (util/format "{{{%s}}}" name)))

(declare block-content)
(declare block-container)
(declare block-parents)

(rum/defc block-reference < rum/reactive
  [config id label]
  (when (and
         (not (string/blank? id))
         (util/uuid-string? id))
    (let [block-id (uuid id)
          block (db/pull-block block-id)
          block-type (keyword (get-in block [:block/properties :ls-type]))
          hl-type (get-in block [:block/properties :hl-type])
          repo (state/get-current-repo)]
      (if block
        (let [title (let [title (:block/title block)
                          block-content (block-content (assoc config :block-ref? true)
                                                       block nil (:block/uuid block)
                                                       (:slide? config))
                          class (if (seq title) "block-ref" "block-ref-no-title")]
                      [:span {:class class}
                       block-content])
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

                  (if (gobj/get e "shiftKey")
                    (state/sidebar-add-block!
                     (state/get-current-repo)
                     (:db/id block)
                     :block-ref
                     {:block block})

                    (match [block-type (util/electron?)]
                      ;; pdf annotation
                      [:annotation true] (pdf-assets/open-block-ref! block)

                      ;; default open block page
                      :else (route-handler/redirect! {:to          :page
                                                      :path-params {:name id}}))))))}

           (if (and (not (util/mobile?)) (not (:preview? config)) (nil? block-type))
             (ui/tippy {:html        (fn []
                                       [:div.tippy-wrapper.overflow-y-auto.p-4
                                        {:style {:width      735
                                                 :text-align "left"
                                                 :max-height 600}}
                                        [(block-parents config repo block-id (:block/format config))
                                         (blocks-container
                                          (db/get-block-and-children repo block-id)
                                          (assoc config :id (str id) :preview? true))]])
                        :interactive true
                        :delay       [1000, 100]} inner)
             inner)])
        [:span.warning.mr-1 {:title "Block ref invalid"}
         (util/format "((%s))" id)]))))

(defn inline-text
  [format v]
  (when (string? v)
    (let [inline-list (mldoc/inline->edn v (mldoc/default-config format))]
      [:div.inline.mr-1 (map-inline {} inline-list)])))

(defn selection-range-in-block? []
  (and (= "Range" (. (js/window.getSelection) -type))
       (-> (js/window.getSelection)
           (.-anchorNode)
           (.-parentNode)
           (.closest ".block-content"))))

(defn- render-macro
  [config name arguments macro-content format]
  (if macro-content
    (let [ast (->> (mldoc/->edn macro-content (mldoc/default-config format))
                   (map first))
          block? (mldoc/block-with-title? (ffirst ast))]
      (if block?
        [:div
         (markup-elements-cp (assoc config :block/format format) ast)]
        (inline-text format macro-content)))
    [:span.warning {:title (str "Unsupported macro name: " name)}
     (macro->text name arguments)]))

(rum/defc nested-link < rum/reactive
  [config html-export? link]
  (let [show-brackets? (state/show-brackets?)
        {:keys [content children]} link]
    [:span.page-reference.nested
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 "[["])
     (let [page-name (subs content 2 (- (count content) 2))]
       (page-cp (assoc config
                       :children children
                       :nested-link? true) {:block/name page-name}))
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 "]]"])]))

(rum/defcs tutorial-video  <
  (rum/local true)
  [state]
  (let [lite-mode? (:rum/local state)]
    [:div.tutorial-video-container.relative
     {:style {:height 367 :width 653}}
     (if @lite-mode?
       [:div
        [:img.w-full.h-full.absolute
         {:src (if (util/electron?)
                 (str (config/get-static-path) "img/tutorial-thumb.jpg")
                 "https://img.youtube.com/vi/Afmqowr0qEQ/maxresdefault.jpg")}]
        [:button
         {:class "absolute bg-red-300 w-16 h-16 -m-8 top-1/2 left-1/2 rounded-full"
          :on-click (fn [_] (swap! lite-mode? not))}
         (svg/play)]]
       [:iframe.w-full.h-full
        {:allow-full-screen "allowfullscreen"
         :allow
         "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
         :frame-border "0"
         :src "https://www.youtube.com/embed/Afmqowr0qEQ?autoplay=1"}])]))

(declare custom-query)

(defn- show-link?
  [config metadata s full-text]
  (let [img-formats (set (map name (config/img-formats)))
        metadata-show (:show (safe-read-string metadata))
        format (get-in config [:block :block/format])]
    (or
     (and
      (= :org format)
      (or
       (and
        (nil? metadata-show)
        (or
         (config/local-asset? s)
         (text/image-link? img-formats s)))
       (true? (boolean metadata-show))))

     ;; markdown
     (string/starts-with? (string/triml full-text) "!")

     ;; image http link
     (and (or (string/starts-with? full-text "http://")
              (string/starts-with? full-text "https://"))
          (text/image-link? img-formats s)))))

(defn- relative-assets-path->absolute-path
  [path]
  (if (util/absolute-path? path)
    path
    (.. util/node-path
        (join (config/get-repo-dir (state/get-current-repo))
              (config/get-local-asset-absolute-path path)))))

(defn inline
  [{:keys [html-export?] :as config} item]
  (match item
    ["Plain" s]
    s
    ["Spaces" s]
    s
    ["Superscript" l]
    (->elem :sup (map-inline config l))
    ["Subscript" l]
    (->elem :sub (map-inline config l))
    ["Tag" s]
    (when-let [s (block/get-tag item)]
      (let [s (text/page-ref-un-brackets! s)]
        (page-cp (assoc config :tag? true) {:block/name s})))

    ["Emphasis" [[kind] data]]
    (let [elem (case kind
                 "Bold" :b
                 "Italic" :i
                 "Underline" :ins
                 "Strike_through" :del
                 "Highlight" :mark)]
      (->elem elem (map-inline config data)))
    ["Entity" e]
    [:span {:dangerouslySetInnerHTML
            {:__html (:html e)}}]

    ["Latex_Fragment" ["Displayed" s]]
    (if html-export?
      (latex/html-export s false true)
      (latex/latex (str (dc/squuid)) s false true))

    ["Latex_Fragment" ["Inline" s]]
    (if html-export?
      (latex/html-export s false true)
      (latex/latex (str (dc/squuid)) s false false))

    ["Target" s]
    [:a {:id s} s]

    ["Radio_Target" s]
    [:a {:id s} s]

    ["Email" address]
    (let [{:keys [local_part domain]} address
          address (str local_part "@" domain)]
      [:a {:href (str "mainto:" address)}
       address])

    ["Nested_link" link]
    (nested-link config html-export? link)

    ["Link" link]
    (let [{:keys [url label title metadata full_text]} link]
      (match url
        ["Block_ref" id]
        (let [label* (if (seq (mldoc/plain->text label)) label nil)]
          (block-reference (assoc config :reference? true) id label*))

        ["Page_ref" page]
        (let [format (get-in config [:block :block/format])]
          (if (and (= format :org)
                   (show-link? config nil page page)
                   (not (contains? #{"pdf" "mp4" "ogg" "webm"} (util/get-file-ext page))))
            (image-link config url page nil metadata full_text)
            (let [label* (if (seq (mldoc/plain->text label)) label nil)]
              (if (and (string? page) (string/blank? page))
                [:span (util/format "[[%s]]" page)]
                (page-reference (:html-export? config) page config label*)))))

        ["Search" s]
        (cond
          (string/blank? s)
          [:span.warning {:title "Invalid link"} full_text]

          (= \# (first s))
          (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

          ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
          (and (= \* (first s))
               (not= \* (last s)))
          (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

          (not (string/includes? s "."))
          (page-reference (:html-export? config) s config label)

          (util/safe-re-find #"(?i)^http[s]?://" s)
          (->elem :a {:href s
                      :data-href s
                      :target "_blank"}
                  (map-inline config label))

          ;; image
          (and (show-link? config metadata s full_text)
               (not (contains? #{"pdf" "mp4" "ogg" "webm" "mov"} (util/get-file-ext s))))
          (image-link config url s label metadata full_text)

          (and (util/electron?)
               (show-link? config metadata s full_text))
          (asset-reference config label s)

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
              {:href      (str "file://" path)
               :data-href path
               :target    "_blank"}
               title
               (assoc :title title))
             (map-inline config label)))

          :else
          (page-reference (:html-export? config) s config label))

        :else
        (let [href (string-of-url url)
              protocol (or
                        (and (= "Complex" (first url))
                             (:protocol (second url)))
                        (and (= "File" (first url))
                             "file"))]
          (cond
            (and (= (get-in config [:block :block/format]) :org)
                 (= "Complex" (first url))
                 (= (string/lower-case protocol) "id")
                 (string? (:link (second url)))
                 (util/uuid-string? (:link (second url)))) ; org mode id
            (let [id (uuid (:link (second url)))
                  block (db/entity [:block/uuid id])]
              (if (:block/pre-block? block)
                (let [page (:block/page block)]
                  (page-reference html-export? (:block/name page) config label))
                (block-reference config (:link (second url)) label)))

            (= protocol "file")
            (cond
              (and (show-link? config metadata href full_text)
                   (not (contains? #{"pdf" "mp4" "ogg" "webm" "mov"} (util/get-file-ext href))))
              (image-link config url href label metadata full_text)

              (and (util/electron?)
                   (show-link? config metadata href full_text))
              (asset-reference config label href)

              :else
              (let [label-text (get-label-text label)
                    page (if (string/blank? label-text)
                           {:block/name (db/get-file-page (string/replace href "file:" ""))}
                           (get-page label))]
                (if (and page
                         (when-let [ext (util/get-file-ext href)]
                           (config/mldoc-support? ext)))
                  [:span.page-reference
                   [:span.text-gray-500 "[["]
                   (page-cp config page)
                   [:span.text-gray-500 "]]"]]

                  (let [href*
                        (if (util/electron?)
                          (relative-assets-path->absolute-path href)
                          href)]
                    (->elem
                     :a
                     (cond->
                      {:href      (str "file://" href*)
                       :data-href href*
                       :target    "_blank"}
                       title
                       (assoc :title title))
                     (map-inline config label))))))

            ;; image
            (and (show-link? config metadata href full_text)
                 (not (contains? #{"pdf"} (util/get-file-ext href))))
            (image-link config url href label metadata full_text)

            ;; pdf link
            (and
             (util/electron?)
             (= (util/get-file-ext href) "pdf")
             (show-link? config metadata href full_text))
            [:a.asset-ref.is-pdf
             {:href "javascript:void(0);"
              :on-mouse-down (fn [e]
                               (when-let [current (pdf-assets/inflate-asset href)]
                                 (state/set-state! :pdf/current current)))}
             (get-label-text label)]

            :else
            (->elem
             :a.external-link
             (cond->
              {:href href
               :target "_blank"}
               title
               (assoc :title title))
             (map-inline config label))))))

    ["Verbatim" s]
    [:code s]

    ["Code" s]
    [:code s]

    ["Inline_Source_Block" x]
    [:code (:code x)]

    ["Export_Snippet" "html" s]
    (when (not html-export?)
      [:span {:dangerouslySetInnerHTML
              {:__html s}}])

    ;; String to hiccup
    ["Inline_Hiccup" s]
    (ui/catch-error
     [:div.warning {:title "Invalid hiccup"} s]
     (-> (safe-read-string s)
         (security/remove-javascript-links-in-href)))

    ["Inline_Html" s]
    (when (not html-export?)
      ;; TODO: how to remove span and only export the content of `s`?
      [:span {:dangerouslySetInnerHTML
              {:__html s}}])

    ["Break_Line"]
    [:br]
    ["Hard_Break_Line"]
    [:br]

    ["Timestamp" ["Scheduled" t]]
    nil
    ["Timestamp" ["Deadline" t]]
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
     (util/format "[d%%]" n)]

    ["Cookie" ["Absolute" current total]]
    [:span {:class "cookie-absolute"}
     (util/format "[%d/%d]" current total)]

    ["Footnote_Reference" options]
    (let [{:keys [id name]} options
          encode-name (util/url-encode name)]
      [:sup.fn
       [:a {:id (str "fnr." encode-name)
            :class "footref"
            :on-click #(route-handler/jump-to-anchor! (str "fn." encode-name))}
        name]])

    ["Macro" options]
    (let [{:keys [name arguments]} options
          arguments (if (and
                         (>= (count arguments) 2)
                         (and (string/starts-with? (first arguments) "[[")
                              (string/ends-with? (last arguments) "]]"))) ; page reference
                      (let [title (string/join ", " arguments)]
                        [title])
                      arguments)]
      (cond
        (= name "query")
        [:div.dsl-query
         (let [query (string/join ", " arguments)]
           (custom-query (assoc config :dsl-query? true)
                         {:title (ui/tippy {:html commands/query-doc
                                            :interactive true}
                                  [:span.font-medium.px-2.py-1.query-title.text-sm.rounded-md.shadow-xs
                                   (str "Query: " query)])
                          :query query}))]

        (= name "function")
        (or
         (when (:query-result config)
           (when-let [query-result (rum/react (:query-result config))]
             (let [fn-string (-> (util/format "(fn [result] %s)" (first arguments))
                                 (common-handler/safe-read-string "failed to parse function")
                                 (query-handler/normalize-query-function query-result)
                                 (str))
                   f (sci/eval-string fn-string)]
               (when (fn? f)
                 (try (f query-result)
                      (catch js/Error e
                        (js/console.error e)))))))
         [:span.warning
          (util/format "{{function %s}}" (first arguments))])

        (= name "youtube")
        (when-let [url (first arguments)]
          (let [YouTube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be))(/(?:[\w-]+\?v=|embed/|v/)?)([\w-]+)(\S+)?$"]
            (when-let [youtube-id (cond
                                    (== 11 (count url)) url
                                    :else
                                    (nth (util/safe-re-find YouTube-regex url) 5))]
              (when-not (string/blank? youtube-id)
                (youtube/youtube-video youtube-id)))))

        (= name "youtube-timestamp")
        (when-let [timestamp (first arguments)]
          (when-let [seconds (youtube/parse-timestamp timestamp)]
            (youtube/timestamp seconds)))

        (= name "tutorial-video")
        (tutorial-video)

        (= name "zotero-imported-file")
        (let [[item-key filename] arguments]
          (when (and item-key filename)
            [:span.ml-1 (zotero/zotero-imported-file item-key filename)]))

        (= name "zotero-linked-file")
        (when-let [path (first arguments)]
          [:span.ml-1 (zotero/zotero-linked-file path)])

        (= name "vimeo")
        (when-let [url (first arguments)]
          (let [Vimeo-regex #"^((?:https?:)?//)?((?:www).)?((?:player.vimeo.com|vimeo.com)?)((?:/video/)?)([\w-]+)(\S+)?$"]
            (when-let [vimeo-id (nth (util/safe-re-find Vimeo-regex url) 5)]
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

        ;; TODO: support fullscreen mode, maybe we need a fullscreen dialog?
        (= name "bilibili")
        (when-let [url (first arguments)]
          (let [id-regex #"https?://www\.bilibili\.com/video/([^? ]+)"]
            (when-let [id (cond
                            (<= (count url) 15) url
                            :else
                            (last (util/safe-re-find id-regex url)))]
              (when-not (string/blank? id)
                (let [width (min (- (util/get-width) 96)
                                 560)
                      height (int (* width (/ 315 560)))]
                  [:iframe
                   {:allowfullscreen true
                    :framespacing "0"
                    :frameborder "no"
                    :border "0"
                    :scrolling "no"
                    :src (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1")
                    :width width
                    :height (max 500 height)}])))))


        (contains? #{"tweet" "twitter"} name)
        (when-let [url (first arguments)]
          (let [id-regex #"/status/(\d+)"]
            (when-let [id (cond
                            (<= (count url) 15) url
                            :else
                            (last (util/safe-re-find id-regex url)))]
              (ui/tweet-embed id))))

        (= name "embed")
        (let [a (first arguments)]
          (cond
            (nil? a) ; empty embed
            nil

            (and (string/starts-with? a "[[")
                 (string/ends-with? a "]]"))
            (let [page-name (text/extract-page-name-from-ref a)]
              (when-not (string/blank? page-name)
                (page-embed config page-name)))

            (and (string/starts-with? a "((")
                 (string/ends-with? a "))"))
            (when-let [s (-> (string/replace a "((" "")
                             (string/replace "))" "")
                             string/trim)]
              (when-let [id (and s
                                 (let [s (string/trim s)]
                                   (and (util/uuid-string? s)
                                        (uuid s))))]
                (block-embed config id)))

            :else                       ;TODO: maybe collections?
            nil))

        (and plugin-handler/lsp-enabled? (= name "renderer"))
        (when-let [block-uuid (str (:block/uuid config))]
          (plugins/hook-ui-slot :macro-renderer-slotted (assoc options :uuid block-uuid)))

        (get @macro/macros name)
        ((get @macro/macros name) config options)

        :else
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
                                    (and (util/safe-parse-int (nth arguments 1)))
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
            (render-macro config name arguments macro-content format)))))

    :else
    ""))

(declare blocks-cp)

(rum/defc block-child
  [block]
  block)

(defn- dnd-same-block?
  [uuid]
  (= (:block/uuid @*dragging-block) uuid))

(defn- get-data-transfer-attr
  [event attr]
  (.getData (gobj/get event "dataTransfer") attr))

(defn- bullet-drag-start
  [event block uuid block-id]
  (editor-handler/highlight-block! uuid)
  (.setData (gobj/get event "dataTransfer")
            "block-uuid"
            uuid)
  (.setData (gobj/get event "dataTransfer")
            "block-dom-id"
            block-id)
  (state/clear-selection!)
  (reset! *dragging? true)
  (reset! *dragging-block block))

(defn- bullet-on-click
  [e block config uuid]
  (if (gobj/get e "shiftKey")
    (do
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id block)
       :block
       block)
      (util/stop e))
    (route-handler/redirect! {:to :page
                              :path-params {:name (str uuid)}})))

(rum/defc block-children < rum/reactive
  [config children collapsed? *ref-collapsed?]
  (let [ref? (:ref? config)
        collapsed? (if ref? (rum/react *ref-collapsed?) collapsed?)
        children (and (coll? children) (filter map? children))]
    (when (and (coll? children)
               (seq children)
               (not collapsed?))
      (let [doc-mode? (state/sub :document/mode?)]
        [:div.block-children {:style {:margin-left (if doc-mode? 12 21)
                                      :display (if collapsed? "none" "")}}
         (for [child children]
           (when (map? child)
             (let [child (dissoc child :block/meta)
                   config (cond->
                           (-> config
                               (assoc :block/uuid (:block/uuid child))
                               (dissoc :breadcrumb-show?))
                            ref?
                            (assoc :ref-child? true))]
               (rum/with-key (block-container config child)
                 (:block/uuid child)))))]))))

(defn block-content-empty?
  [{:block/keys [properties title body]}]
  (and
   (or
    (empty? properties)
    (property/properties-built-in? properties))

   (empty? title)

   (every? #(= % ["Horizontal_Rule"]) body)))

(rum/defcs block-control < rum/reactive
  [state config block uuid block-id body children collapsed? *ref-collapsed? *control-show? edit-input-id edit? doc-mode?]
  (let [doc-mode? (state/sub :document/mode?)
        has-children-blocks? (and (coll? children) (seq children))
        has-child? (and
                    (not (:pre-block? block))
                    (or has-children-blocks? (seq body)))
        control-show? (and
                       (or (and (seq (:block/title block))
                                (seq body))
                           has-children-blocks?)
                       (util/react *control-show?))
        ref-collapsed? (util/react *ref-collapsed?)
        dark? (= "dark" (state/sub :ui/theme))
        ref? (:ref? config)
        collapsed? (if ref? ref-collapsed? collapsed?)
        empty-content? (block-content-empty? block)]
    [:div.mr-2.flex.flex-row.items-center
     {:style {:height 24
              :margin-top 0
              :float "left"}}

     [:a.block-control.opacity-50.hover:opacity-100
      {:id (str "control-" uuid)
       :style {:width 14
               :height 16
               :margin-right 2}
       :on-click (fn [e]
                   (util/stop e)
                   (when-not (and (not collapsed?) (not has-child?))
                     (if ref?
                       (swap! *ref-collapsed? not)
                       (if collapsed?
                         (editor-handler/expand-block! uuid)
                         (editor-handler/collapse-block! uuid)))))}
      [:span {:class (if control-show? "control-show" "control-hide")}
       (ui/rotating-arrow collapsed?)]]
     (let [bullet [:a {:on-click (fn [e]
                                   (bullet-on-click e block config uuid))}
                   [:span.bullet-container.cursor
                    {:id (str "dot-" uuid)
                     :draggable true
                     :on-drag-start (fn [event]
                                      (bullet-drag-start event block uuid block-id))
                     :blockid (str uuid)
                     :class (str (when collapsed? "bullet-closed")
                                 " "
                                 (when (and (:document/mode? config)
                                            (not collapsed?))
                                   "hide-inner-bullet"))}
                    [:span.bullet {:blockid (str uuid)}]]]]
       (cond
         (and (:ui/show-empty-bullets? (state/get-config)) (not doc-mode?))
         bullet

         (or
          (and empty-content? (not edit?)
               (not (:block/top? block))
               (not (:block/bottom? block))
               (not (util/react *control-show?)))
          (and doc-mode?
               (not collapsed?)
               (not (util/react *control-show?))))
         ;; hidden
         [:span.bullet-container]

         :else
         bullet))]))

(rum/defc dnd-separator
  [block move-to block-content?]
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
                    :style {:margin-top -2
                            :margin-right 5}
                    :checked checked?
                    :on-change (fn [_e]
                                 ;; FIXME: Log timestamp
                                 (if checked?
                                   (editor-handler/uncheck block)
                                   (editor-handler/check block)))}))))

(defn list-checkbox
  [checked?]
  (ui/checkbox {:style {:margin-right 6}
                :checked checked?}))

(defn marker-switch
  [{:block/keys [marker] :as block}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    (let [set-marker-fn (fn [marker]
                          (fn [e]
                            (util/stop e)
                            (editor-handler/set-marker block marker)))
          next-marker (case marker
                        "NOW" "LATER"
                        "LATER" "NOW"
                        "TODO" "DOING"
                        "DOING" "TODO")]
      [:a
       {:class (str "marker-switch block-marker " marker)
        :title (util/format "Change from %s to %s" marker next-marker)
        :on-click (set-marker-fn next-marker)}
       marker])))

(defn marker-cp
  [{:block/keys [pre-block? marker] :as block}]
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
  [{:block/keys [pre-block? tags] :as block}]
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
  [{:keys [slide?] :as config} {:block/keys [uuid title tags marker priority anchor meta format content pre-block? page properties unordered level heading-level]
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
        heading-level (or (and heading-level
                               (<= heading-level 6)
                               heading-level)
                          (and (get properties :heading)
                               (<= level 6)
                               level))
        elem (if heading-level
               (keyword (str "h" heading-level
                             (when block-ref? ".inline")))
               :span.inline)]
    (->elem
     elem
     (merge
      {:id anchor
       :data-hl-type (:hl-type properties)}
      (when (and marker
                 (not (string/blank? marker))
                 (not= "nil" marker))
        {:class (str (string/lower-case marker))})
      (when bg-color
        {:style {:background-color bg-color
                 :padding-left 6
                 :padding-right 6
                 :color "#FFFFFF"}
         :class "with-bg-color"}))
     (remove-nils
      (concat
       [(when-not slide? checkbox)
        (when-not slide? marker-switch)
        marker-cp
        priority]
       (if title
         (conj
          (map-inline config title)
          (when (and (util/electron?) (not= block-type :default))
            [:a.prefix-link
             {:on-click #(case block-type
                            ;; pdf annotation
                           :annotation (pdf-assets/open-block-ref! t)
                           (.preventDefault %))}

             [:span.hl-page
              [:strong.forbid-edit (str "P" (or (:hl-page properties) "?"))]
              [:label.blank " "]]

             (when-let [st (and (= :area (keyword (:hl-type properties)))
                                (:hl-stamp properties))]
               (pdf-assets/area-display t st))]))

         [[:span.opacity-50 "Click here to start writing, type '/' to see all the commands."]])
       [tags])))))

(rum/defc span-comma
  []
  [:span ", "])

(rum/defc property-cp
  [config block k v]
  (let [pre-block? (:block/pre-block? block)
        date (and (= k :date) (date/get-locale-string (str v)))]
    [:div
     [:span.page-property-key.font-medium (name k)]
     [:span.mr-1 ":"]
     (cond
       (int? v)
       v

       date
       date

       (coll? v)
       (let [v (->> (remove string/blank? v)
                    (filter string?))
             vals (for [v-item v]
                    (page-cp config {:block/name v-item}))
             elems (interpose (span-comma) vals)]
         (for [elem elems]
           (rum/with-key elem (str (random-uuid)))))

       :else
       (inline-text (:block/format block) (str v)))]))

(rum/defc properties-cp
  [config block]
  (let [properties (walk/keywordize-keys (:block/properties block))
        properties-order (:block/properties-order block)
        properties (apply dissoc properties (property/built-in-properties))
        properties-order (remove (property/built-in-properties) properties-order)
        pre-block? (:block/pre-block? block)
        properties (if pre-block?
                     (let [repo (state/get-current-repo)
                           properties (dissoc properties :title :filters)
                           aliases (db/get-page-alias-names repo
                                                            (:block/name (db/pull (:db/id (:block/page block)))))]
                       (if (seq aliases)
                         (if (:alias properties)
                           (update properties :alias (fn [c]
                                                       (util/distinct-by string/lower-case (concat c aliases))))
                           (assoc properties :alias aliases))
                         properties))
                     properties)
        properties-order (if pre-block?
                           (remove #{:title :filters} properties-order)
                           properties-order)
        properties (if (seq properties-order)
                     (map (fn [k] [k (get properties k)]) properties-order)
                     properties)]
    (cond
      (seq properties)
      [:div.block-properties
       {:class (when pre-block? "page-properties")
        :title (if pre-block?
                 "Click to edit this page's properties"
                 "Click to edit this block's properties")}
       (for [[k v] properties]
         (rum/with-key (property-cp config block k v)
           (str (:block/uuid block) "-" k)))]

      (and pre-block? properties)
      [:span.opacity-50 "Properties"]

      :else
      nil)))

(rum/defcs timestamp-cp < rum/reactive
  (rum/local false ::show?)
  (rum/local {} ::pos)
  {:will-unmount (fn [state]
                   (when-let [show? (::show? state)]
                     (reset! show? false))
                   state)}
  [state block typ ast]
  (let [show? (get state ::show?)]
    [:div.flex.flex-col
     [:div.text-sm.mt-1.flex.flex-row
      [:div.opacity-50.font-medium
       (str typ ": ")]
      [:a.opacity-80.hover:opacity-100
       {:on-click (fn []
                    (if @show?
                      (do
                        (reset! show? false)
                        (reset! commands/*current-command nil)
                        (state/set-editor-show-date-picker! false)
                        (state/set-timestamp-block! nil))
                      (do
                        (reset! show? true)
                        (reset! commands/*current-command typ)
                        (state/set-editor-show-date-picker! true)
                        (state/set-timestamp-block! {:block block
                                                     :typ typ
                                                     :show? show?}))))}
       (repeated/timestamp->text ast)]]
     (when (true? @show?)
       (let [ts (repeated/timestamp->map ast)]
         [:div.my-4
          (datetime-comp/date-picker nil nil ts)]))]))

(defn- block-content-on-mouse-down
  [e block block-id properties content format edit-input-id]
  (.stopPropagation e)
  (let [target (gobj/get e "target")
        button (gobj/get e "buttons")]
    (when (contains? #{1 0} button)
      (when-not (or
                 (d/has-class? target "forbid-edit")
                 (d/has-class? target "bullet")
                 (util/link? target)
                 (util/input? target)
                 (util/details-or-summary? target)
                 (and (util/sup? target)
                      (d/has-class? target "fn"))
                 (d/has-class? target "image-resize"))
        (editor-handler/clear-selection!)
        (editor-handler/unhighlight-blocks!)
        (let [block (or (db/pull [:block/uuid (:block/uuid block)]) block)
              f #(let [cursor-range (util/caret-range (gdom/getElement block-id))
                       content (-> (property/remove-built-in-properties (:block/format block)
                                                                        content)
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
            (js/setTimeout f 5)))

        (when block-id (state/set-selection-start-block! block-id))))))

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
          (dnd-separator block move-to block-content?))))))

(rum/defc block-content < rum/reactive
  [config {:block/keys [uuid title body meta content marker page format repo children pre-block? properties idx container block-refs-count scheduled deadline repeated?] :as block} edit-input-id block-id slide?]
  (let [collapsed? (get properties :collapsed)
        block-ref? (:block-ref? config)
        block-ref-with-title? (and block-ref? (seq title))
        block-type (or (:ls-type properties) :default)
        dragging? (rum/react *dragging?)
        content (if (string? content) (string/trim content) "")
        mouse-down-key (if (util/ios?)
                         :on-click
                         :on-mouse-down ; TODO: it seems that Safari doesn't work well with on-mouse-down
)
        attrs (cond->
               {:blockid       (str uuid)
                :data-type (name block-type)
                :style {:width "100%"}}
                (not block-ref?)
                (assoc mouse-down-key (fn [e]
                                        (block-content-on-mouse-down e block block-id properties content format edit-input-id))))]
    [:div.block-content.inline
     (cond-> {:id (str "block-content-" uuid)
              :on-mouse-up (fn [_e]
                             (when-not (string/includes? content "```")
                               (util/clear-selection!)))}
       (not slide?)
       (merge attrs))

     [:span
      ;; .flex.relative {:style {:width "100%"}}
      [:span
       ;; .flex-1.flex-col.relative.block-content
       (cond
         (seq title)
         (build-block-title config block)

         :else
         nil)

       (when (seq children)
         (dnd-separator-wrapper block block-id slide? false true))

       (when deadline
         (when-let [deadline-ast (block-handler/get-deadline-ast block)]
           (timestamp-cp block "DEADLINE" deadline-ast)))

       (when scheduled
         (when-let [scheduled-ast (block-handler/get-scheduled-ast block)]
           (timestamp-cp block "SCHEDULED" scheduled-ast)))

       (when (and (seq properties)
                  (let [hidden? (property/properties-built-in? properties)]
                    (not hidden?))
                  (not block-ref?)
                  (not (:slide? config)))
         (properties-cp config block))

       (when (and (not block-ref-with-title?) (seq body))
         [:div.block-body {:style {:display (if (and collapsed? (seq title)) "none" "")}}
          ;; TODO: consistent id instead of the idx (since it could be changed later)
          (let [body (block/trim-break-lines! (:block/body block))]
            (for [[idx child] (medley/indexed body)]
              (when-let [block (markup-element-cp config child)]
                (rum/with-key (block-child block)
                  (str uuid "-" idx)))))])]]]))

(rum/defc block-content-or-editor < rum/reactive
  [config {:block/keys [uuid title body meta content page format repo children marker properties pre-block? idx] :as block} edit-input-id block-id slide? heading-level edit?]
  (let [editor-box (get config :editor-box)
        editor-id (str "editor-" edit-input-id)
        slide? (:slide? config)]
    (if (and edit? editor-box)
      [:div.editor-wrapper {:id editor-id}
       (editor-box {:block block
                    :block-id uuid
                    :block-parent-id block-id
                    :format format
                    :heading-level heading-level
                    :on-hide (fn [value event]
                               (when (= event :esc)
                                 (editor-handler/escape-editing)))}
                   edit-input-id
                   config)]
      [:div.flex.flex-row.block-content-wrapper
       [:div.flex-1.w-full {:style {:display (if (:slide? config) "block" "flex")}}
        (block-content config block edit-input-id block-id slide?)]
       [:div.flex.flex-row
        (when (and (:embed? config)
                   (not (:page-embed? config))
                   (:parent config))
          [:a.opacity-30.hover:opacity-100.svg-small.inline
           {:on-mouse-down (fn [e]
                             (util/stop e)
                             (when-let [block (:parent config)]
                               (editor-handler/edit-block! block :max (:block/format block) (:block/uuid block))))}
           svg/edit])

        (when (and (state/enable-timetracking?)
                   (or (= (:block/marker block) "DONE")
                       (and (:block/repeated? block)
                            (= (:block/marker block) "TODO"))))
          (let [summary (clock/clock-summary body true)]
            (when (and summary
                       (not= summary "0m")
                       (not (string/blank? summary)))
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
                         :delay       [1000, 100]}
                        [:div.text-sm.time-spent.ml-1 {:style {:padding-top 3}}
                         [:a.fade-link
                          summary]]))))

        (let [block-refs-count (count (:block/_refs (db/entity (:db/id block))))]
          (when (and block-refs-count (> block-refs-count 0))
            [:div
             [:a.open-block-ref-link.bg-base-2.text-sm.ml-2
              {:title "Open block references"
               :style {:margin-top -1}
               :on-click (fn []
                           (state/sidebar-add-block!
                            (state/get-current-repo)
                            (:db/id block)
                            :block-ref
                            {:block block}))}
              block-refs-count]]))]])))

(defn non-dragging?
  [e]
  (and (= (gobj/get e "buttons") 1)
       (not (d/has-class? (gobj/get e "target") "bullet-container"))
       (not (d/has-class? (gobj/get e "target") "bullet"))
       (not @*dragging?)))

(rum/defc breadcrumb-fragment
  [config block href label]
  (if (= block :page)                   ; page
    (when label
      (let [page (db/entity [:block/name (string/lower-case label)])]
        (page-cp config page)))
    [:a {:on-mouse-down
         (fn [e]
           (if (gobj/get e "shiftKey")
             (do
               (util/stop e)
               (state/sidebar-add-block!
                (state/get-current-repo)
                (:db/id block)
                :block-ref
                {:block block}))
             (route-handler/redirect! {:to :page
                                       :path-params {:name (str (:block/uuid block))}})))}
     label]))

(rum/defc breadcrumb-separator [] [:span.mx-2.opacity-50 "➤"])

(defn block-parents
  ([config repo block-id format]
   (block-parents config repo block-id format true))
  ([config repo block-id format show-page?]
   (let [parents (db/get-block-parents repo block-id 3)
         page (db/get-block-page repo block-id)
         page-name (:block/name page)
         page-original-name (:block/original-name page)
         show? (or (seq parents) show-page? page-name)]
     (when show?
       (let [page-name-props (when show-page?
                               [:page
                                (rfe/href :page {:name page-name})
                                (or page-original-name page-name)])
             parents-props (doall
                            (for [{:block/keys [uuid title name] :as block} parents]
                              (when-not name ; not page
                                [block
                                 (rfe/href :page {:name uuid})
                                 (->elem :span (map-inline config title))])))
             breadcrumb (->> (into [] parents-props)
                             (concat [page-name-props])
                             (filterv identity)
                             (map (fn [[block href label]] (breadcrumb-fragment config block href label)))
                             (interpose (breadcrumb-separator)))]
         [:div.block-parents.flex-row.flex-1 breadcrumb])))))

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

(defn- block-drop
  [event uuid block *move-to]
  (when-not (dnd-same-block? uuid)
    (dnd/move-block event @*dragging-block
                    block
                    @*move-to))
  (reset! *dragging? false)
  (reset! *dragging-block nil)
  (reset! *drag-to-block nil)
  (reset! *move-to nil)
  (editor-handler/unhighlight-blocks!))

(defn- block-mouse-over
  [e has-child? *control-show? block-id doc-mode?]
  (util/stop e)
  (reset! *control-show? true)
  (when-let [parent (gdom/getElement block-id)]
    (let [node (.querySelector parent ".bullet-container")]
      (when doc-mode?
        (d/remove-class! node "hide-inner-bullet"))))
  (when (and
         (state/in-selection-mode?)
         (non-dragging? e))
    (util/stop e)
    (editor-handler/highlight-selection-area! block-id)))

(defn- block-mouse-leave
  [e has-child? *control-show? block-id doc-mode?]
  (util/stop e)
  (reset! *control-show? false)
  (when doc-mode?
    (when-let [parent (gdom/getElement block-id)]
      (when-let [node (.querySelector parent ".bullet-container")]
        (d/add-class! node "hide-inner-bullet"))))
  (when (and (non-dragging? e)
             (not @*resizing-image?))
    (state/into-selection-mode!)))

(defn- on-drag-and-mouse-attrs
  [block uuid top? block-id *move-to has-child? *control-show? doc-mode?]
  {:on-drag-over (fn [event]
                   (block-drag-over event uuid top? block-id *move-to))
   :on-drag-leave (fn [event]
                    (block-drag-leave *move-to))
   :on-drop (fn [event]
              (block-drop event uuid block *move-to))})

(defn- build-refs-data-value
  [block refs]
  (let [refs (model/get-page-names-by-ids
              (->> (map :db/id refs)
                   (remove nil?)))]
    (text/build-data-value refs)))

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

;; (rum/defc block-immediate-children < rum/reactive
;;   [repo config uuid ref? collapsed?]
;;   (when (and ref? (not collapsed?))
;;     (let [children (db/get-block-immediate-children repo uuid)
;;           children (block-handler/filter-blocks repo children (:filters config) false)]
;;       (when (seq children)
;;         [:div.ref-children {:style {:margin-left "1.8rem"}}
;;          (blocks-container children (assoc config
;;                                            :breadcrumb-show? false
;;                                            :ref? true
;;                                            :ref-child? true))]))))

(rum/defcs block-container < rum/reactive
  {:init (fn [state]
           (let [[config block] (:rum/args state)
                 ref-collpased? (boolean
                                 (and
                                  (seq (:block/children block))
                                  (or (:custom-query? config)
                                      (and (:ref? config)
                                           (>= (:ref/level block)
                                               (state/get-ref-open-blocks-level))))))]
             (assoc state
                    ::control-show? (atom false)
                    ::ref-collapsed? (atom ref-collpased?))))
   :should-update (fn [old-state new-state]
                    (let [compare-keys [:block/uuid :block/properties
                                        :block/parent :block/left
                                        :block/children :block/content]]
                      (not= (select-keys (second (:rum/args old-state)) compare-keys)
                            (select-keys (second (:rum/args new-state)) compare-keys))))}
  [state config {:block/keys [uuid title body meta content page format repo children pre-block? top? properties refs path-refs heading-level level type idx] :as block}]
  (let [blocks-container-id (:blocks-container-id config)
        config (update config :block merge block)
        ;; Each block might have multiple queries, but we store only the first query's result
        config (if (nil? (:query-result config))
                 (assoc config :query-result (atom nil))
                 config)
        heading? (and (= type :heading) heading-level (<= heading-level 6))
        *control-show? (get state ::control-show?)
        *ref-collapsed? (get state ::ref-collapsed?)
        collapsed? (or @*ref-collapsed?
                       (get properties :collapsed))
        ref? (boolean (:ref? config))
        breadcrumb-show? (:breadcrumb-show? config)
        sidebar? (boolean (:sidebar? config))
        slide? (boolean (:slide? config))
        custom-query? (boolean (:custom-query? config))
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        reference? (:reference? config)
        block-id (str "ls-block-" blocks-container-id "-" uuid)
        has-child? (boolean
                    (and
                     (not pre-block?)
                     (or (and (coll? children) (seq children))
                         (seq body))))
        attrs (on-drag-and-mouse-attrs block uuid top? block-id *move-to has-child? *control-show? doc-mode?)
        children-refs (get-children-refs children)
        data-refs (build-refs-data-value block children-refs)
        data-refs-self (build-refs-data-value block refs)
        edit-input-id (str "edit-block-" blocks-container-id "-" uuid)
        edit? (state/sub [:editor/editing? edit-input-id])]
    [:div.ls-block.flex.flex-col.rounded-sm
     (cond->
      {:id block-id
       :data-refs data-refs
       :data-refs-self data-refs-self
       :style {:position "relative"}
       :class (str uuid
                   (when (and collapsed? has-child?) " collapsed")
                   (when pre-block? " pre-block"))
       :blockid (str uuid)
       :repo repo
       :haschild (str has-child?)}

       level
       (assoc :level level)

       (not slide?)
       (merge attrs)

       (or reference? embed?)
       (assoc :data-transclude true)

       custom-query?
       (assoc :data-query true))

     (when (and ref? breadcrumb-show?)
       (when-let [comp (block-parents config repo uuid format false)]
         [:div.my-2.opacity-70.ml-4.hover:opacity-100 comp]))

     ;; only render this for the first block in each container
     (when top?
       (dnd-separator-wrapper block block-id slide? true false))

     [:div.flex.flex-row.pr-2
      {:class (if heading? "items-baseline" "")
       :on-mouse-over (fn [e]
                        (block-mouse-over e has-child? *control-show? block-id doc-mode?))
       :on-mouse-leave (fn [e]
                         (block-mouse-leave e has-child? *control-show? block-id doc-mode?))}
      (when (not slide?)
        (block-control config block uuid block-id body children collapsed? *ref-collapsed? *control-show? edit-input-id edit? doc-mode?))

      (block-content-or-editor config block edit-input-id block-id slide? heading-level edit?)]

     (block-children config children collapsed? *ref-collapsed?)

     (dnd-separator-wrapper block block-id slide? false false)]))

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
    [l1 & tl]
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
  [config {:keys [name content checkbox items number] :as l}]
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
            (list-checkbox checkbox)
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
                        (catch js/Error e
                          []))
        head (when header
               [:thead (tr :th header)])
        groups (mapv (fn [group]
                       (->elem
                        :tbody
                        (mapv #(tr :td %) group)))
                     groups)]
    [:div.table-wrapper {:style {:max-width (min 700
                                                 (gobj/get js/window "innerWidth"))}}
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

(defn map-inline
  [config col]
  (map #(inline config %) col))

(declare ->hiccup)

(defn built-in-custom-query?
  [title]
  (let [repo (state/get-current-repo)]
    (let [queries (state/sub [:config repo :default-queries :journals])]
      (when (seq queries)
        (boolean (some #(= % title) (map :title queries)))))))

(defn- trigger-custom-query!
  [state]
  (let [[config query] (:rum/args state)
        repo (state/get-current-repo)
        result-atom (atom nil)
        query-atom (if (:dsl-query? config)
                     (let [result (query-dsl/query (state/get-current-repo) (:query query))]
                       (cond
                         (and (util/electron?) (string? result)) ; full-text search
                         (if (string/blank? result)
                           (atom [])
                           (p/let [blocks (search/block-search repo (string/trim result) {:limit 30})]
                             (when (seq blocks)
                               (let [result (db/pull-many (state/get-current-repo) '[*] (map (fn [b] [:block/uuid (uuid (:block/uuid b))]) blocks))]
                                 (reset! result-atom result)))))

                         (string? result)
                         (atom nil)

                         :else
                         result))
                     (db/custom-query query))
        query-atom (if (instance? Atom query-atom)
                     query-atom
                     result-atom)]
    (assoc state :query-atom query-atom)))

(rum/defcs custom-query < rum/reactive
  {:will-mount trigger-custom-query!
   :did-mount (fn [state]
                (when-let [query (last (:rum/args state))]
                  (state/add-custom-query-component! query (:rum/react-component state)))
                state)
   :did-remount (fn [_old_state state]
                  (trigger-custom-query! state))
   :will-unmount (fn [state]
                   (when-let [query (last (:rum/args state))]
                     (state/remove-custom-query-component! query)
                     (db/remove-custom-query! (state/get-current-repo) query))
                   state)}
  [state config {:keys [title query inputs view collapsed? children? breadcrumb-show?] :as q}]
  (ui/catch-error
   [:div.warning
    [:p "Query failed: "]
    [:pre (str q)]]
   (let [dsl-query? (:dsl-query? config)
         query-atom (:query-atom state)]
     (let [current-block-uuid (or (:block/uuid (:block config))
                                  (:block/uuid config))
           current-block (db/entity [:block/uuid current-block-uuid])
           ;; exclude the current one, otherwise it'll loop forever
           remove-blocks (if current-block-uuid [current-block-uuid] nil)
           query-result (and query-atom (rum/react query-atom))
           table? (or (get-in current-block [:block/properties :query-table])
                      (and (string? query) (string/ends-with? (string/trim query) "table")))
           transformed-query-result (when query-result
                                      (db/custom-query-result-transform query-result remove-blocks q))
           not-grouped-by-page? (or table?
                                    (boolean (:result-transform q))
                                    (and (string? query) (string/includes? query "(by-page false)")))
           result (if (and (:block/uuid (first transformed-query-result)) (not not-grouped-by-page?))
                    (db-utils/group-by-page transformed-query-result)
                    transformed-query-result)
           _ (when-let [query-result (:query-result config)]
               (let [result (remove (fn [b] (some? (get-in b [:block/properties :template]))) result)]
                 (reset! query-result result)))
           view-f (and view (sci/eval-string (pr-str view)))
           only-blocks? (:block/uuid (first result))
           blocks-grouped-by-page? (and (seq result)
                                        (not not-grouped-by-page?)
                                        (coll? (first result))
                                        (:block/name (ffirst result))
                                        (:block/uuid (first (second (first result))))
                                        true)
           built-in? (built-in-custom-query? title)
           page-list? (and (seq result)
                           (:block/name (first result)))]
       [:div.custom-query.mt-4 (get config :attr {})
        (when-not (and built-in? (empty? result))
          (ui/foldable
           [:div.custom-query-title
            title
            [:span.opacity-60.text-sm.ml-2
             (str (count transformed-query-result) " results")]]
           [:div
            (when current-block
              [:div.flex.flex-row.align-items.mt-2 {:on-mouse-down (fn [e] (util/stop e))}
               (when-not page-list?
                 [:div.flex.flex-row
                  [:div.mx-2 [:span.text-sm "Table view"]]
                  [:div {:style {:margin-top 5}}
                   (ui/toggle table?
                              (fn []
                                (editor-handler/set-block-property! current-block-uuid
                                                                    "query-table"
                                                                    (not table?)))
                              true)]])

               [:a.mx-2.block.fade-link
                {:on-click (fn []
                             (let [all-keys (query-table/get-keys result page-list?)]
                               (state/pub-event! [:modal/set-query-properties current-block all-keys])))}
                [:span.table-query-properties
                 [:span.text-sm.mr-1 "Set properties"]
                 svg/settings-sm]]])
            (cond
              (and (seq result) view-f)
              (let [result (try
                             (sci/call-fn view-f result)
                             (catch js/Error error
                               (log/error :custom-view-failed {:error error
                                                               :result result})
                               [:div "Custom view failed: "
                                (str error)]))]
                (util/hiccup-keywordize result))

              page-list?
              (query-table/result-table config current-block result {:page? true} map-inline page-cp ->elem inline-text)

              table?
              (query-table/result-table config current-block result {:page? false} map-inline page-cp ->elem inline-text)

              (and (seq result) (or only-blocks? blocks-grouped-by-page?))
              (->hiccup result (cond-> (assoc config
                                              :custom-query? true
                                              :breadcrumb-show? (if (some? breadcrumb-show?)
                                                                  breadcrumb-show?
                                                                  true)
                                              :group-by-page? blocks-grouped-by-page?
                                              :ref? true)
                                 children?
                                 (assoc :ref? true))
                        {:style {:margin-top "0.25rem"
                                 :margin-left "0.25rem"}})

              (seq result)
              (let [result (->>
                            (for [record result]
                              (if (map? record)
                                (str (util/pp-str record) "\n")
                                record))
                            (remove nil?))]
                [:pre result])

              :else
              [:div.text-sm.mt-2.ml-2.font-medium.opacity-50 "Empty"])]
           {:default-collapsed? collapsed?}))]))))

(defn admonition
  [config type options result]
  (when-let [icon (case (string/lower-case (name type))
                    "note" svg/note
                    "tip" svg/tip
                    "important" svg/important
                    "caution" svg/caution
                    "warning" svg/warning
                    "pinned" svg/pinned
                    nil)]
    [:div.flex.flex-row.admonitionblock.align-items {:class type}
     [:div.pr-4.admonition-icon.flex.flex-col.justify-center
      {:title (string/upper-case type)} (icon)]
     [:div.ml-4.text-lg
      (markup-elements-cp config result)]]))

;; TODO: move to mldoc
;; (defn- convert-md-src-to-custom-block
;;   [item]
;;   (let [{:keys [language options lines] :as options} (second item)
;;         lang (string/lower-case (or language ""))]
;;     (cond
;;       (= lang "quote")
;;       (let [content (string/trim (string/join "\n" lines))]
;;         ["Quote" (first (mldoc/->edn content (mldoc/default-config :markdown)))])

;;       (contains? #{"query" "note" "tip" "important" "caution" "warning" "pinned"} lang)
;;       (let [content (string/trim (string/join "\n" lines))]
;;         ["Custom" lang nil (first (mldoc/->edn content (mldoc/default-config :markdown))) content])

;;       :else
;;       ["Src" options])))

(rum/defc src-cp < rum/static
  [config options html-export?]
  (when options
    (let [{:keys [lines language]} options
          attr (when language
                 {:data-lang language})
          code (join-lines lines)]
      (cond
        html-export?
        (highlight/html-export attr code)

        :else
        (let [language (if (contains? #{"edn" "clj" "cljc" "cljs" "clojure"} language) "text/x-clojure" language)]
          (if (:slide? config)
            (highlight/highlight (str (medley/random-uuid)) {:data-lang language} code)
            [:div
             (lazy-editor/editor config (str (dc/squuid)) attr code options)
             (let [options (:options options)]
               (when (and (= language "text/x-clojure") (contains? (set options) ":results"))
                 (sci/eval-result code)))]))))))

(defn markup-element-cp
  [{:keys [html-export?] :as config} item]
  (let [format (or (:block/format config)
                   :markdown)]
    (try
      (match item
        ["Drawer" name lines]
        (when (or (not= name "logbook")
                  (and
                   (= name "logbook")
                   (:block/scheduled (:block config))))
          [:div.flex.flex-col
           [:div.text-sm.mt-1.flex.flex-row
            [:div.drawer {:data-drawer-name name}
             (ui/foldable
              [:div.opacity-50.font-medium
               (util/format ":%s:" (string/upper-case name))]
              [:div (apply str lines)
               [:div.opacity-50.font-medium {:style {:width 95}}
                ":END:"]]
              {:default-collapsed? true
               :title-trigger? true})]]])

        ["Properties" m]
        [:div.properties
         (for [[k v] (dissoc m :roam_alias :roam_tags)]
           (when (and (not (and (= k :macros) (empty? v))) ; empty macros
                      (not (= k :title))
                      (not (= k :filters)))
             [:div.property
              [:span.font-medium.mr-1 (str (name k) ": ")]
              (if (coll? v)
                (let [vals (for [item v]
                             (if (coll? v)
                               (let [config (when (= k :alias)
                                              (assoc config :block/alias? true))]
                                 (page-cp config {:block/name item}))
                               (inline-text format item)))]
                  (interpose [:span ", "] vals))
                (inline-text format v))]))]

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
          (latex/latex (str (dc/squuid)) s true true))
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
                          {:__html content}}])
        ["Export" "html" options content]
        (when (not html-export?)
          [:div.export_html {:dangerouslySetInnerHTML
                             {:__html content}}])
        ["Hiccup" content]
        (ui/catch-error
         [:div.warning {:title "Invalid hiccup"}
          content]
         (-> (safe-read-string content)
             (security/remove-javascript-links-in-href)))

        ["Export" "latex" options content]
        (if html-export?
          (latex/html-export content true false)
          (latex/latex (str (dc/squuid)) content true false))

        ["Custom" "query" _options result content]
        (try
          (let [query (reader/read-string content)]
            (custom-query config query))
          (catch js/Error e
            (println "read-string error:")
            (js/console.error e)
            [:div.warning {:title "Invalid query"}
             content]))

        ["Custom" "note" options result content]
        (admonition config "note" options result)

        ["Custom" "tip" options result content]
        (admonition config "tip" options result)

        ["Custom" "important" options result content]
        (admonition config "important" options result)

        ["Custom" "caution" options result content]
        (admonition config "caution" options result)

        ["Custom" "warning" options result content]
        (admonition config "warning" options result)

        ["Custom" "pinned" options result content]
        (admonition config "pinned" options result)

        ["Custom" "center" options l content]
        (->elem
         :div.text-center
         (markup-elements-cp config l))

        ["Custom" name options l content]
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
            (latex/latex (str (dc/squuid)) content true true)))

        ["Displayed_Math" content]
        (if html-export?
          (latex/html-export content true true)
          (latex/latex (str (dc/squuid)) content true true))

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
        (src-cp config options html-export?)

        :else
        "")
      (catch js/Error e
        (println "Convert to html failed, error: " e)
        ""))))

(defn markup-elements-cp
  [config col]
  (map #(markup-element-cp config %) col))

(defn build-slide-sections
  ([blocks config]
   (build-slide-sections blocks config nil))
  ([blocks config build-block-fn]
   (when (seq blocks)
     (let [blocks (map #(dissoc % :block/children) blocks)
           first-block-level (:block/level (first blocks))
           sections (reduce
                     (fn [acc block]
                       (let [block (dissoc block :block/meta)
                             level (:block/level block)
                             config (assoc config :block/uuid (:block/uuid block))
                             block-cp (if build-block-fn
                                        (build-block-fn config block)
                                        (rum/with-key
                                          (block-container config block)
                                          (str "slide-" (:block/uuid block))))]
                         (if (= first-block-level level)
                           ;; new slide
                           (conj acc [[block block-cp]])
                           (update acc (dec (count acc))
                                   (fn [sections]
                                     (conj sections [block block-cp]))))))
                     []
                     blocks)]
       sections))))

(defn- block-list
  [config blocks]
  (for [[idx item] (medley/indexed blocks)]
    (let [item (->
                (dissoc item :block/meta)
                (assoc :block/top? (zero? idx)
                       :block/bottom? (= (count blocks) (inc idx))))
          config (assoc config :block/uuid (:block/uuid item))]
      (rum/with-key (block-container config item)
        (str (:block/uuid item))))))

(defonce ignore-scroll? (atom false))
(rum/defcs lazy-blocks <
  (rum/local 1 ::page)
  [state config blocks]
  (let [*page (get state ::page)
        segment (->> blocks
                     (drop (* (dec @*page) max-blocks-per-page))
                     (take max-blocks-per-page))
        bottom-reached (fn []
                         (when (and (= (count segment) max-blocks-per-page)
                                    (> (count blocks) (* @*page max-blocks-per-page))
                                    (not @ignore-scroll?))
                           (swap! *page inc)
                           (util/scroll-to-top))
                         (reset! ignore-scroll? false))
        top-reached (fn []
                      (when (> @*page 1)
                        (swap! *page dec)
                        (reset! ignore-scroll? true)
                        (js/setTimeout #(util/scroll-to
                                         (.-scrollHeight (js/document.getElementById "lazy-blocks"))) 100)))]
    [:div#lazy-blocks
     (when (> @*page 1)
       [:div.ml-4.mb-4 [:a#prev.opacity-60.opacity-100.text-sm.font-medium {:on-click top-reached}
                        "Prev"]])
     (ui/infinite-list
      "main-container"
      (block-list config segment)
      {:on-load bottom-reached})
     (when (> (count blocks) (* @*page max-blocks-per-page))
       [:div.ml-4.mt-4 [:a#more.opacity-60.opacity-100.text-sm.font-medium {:on-click bottom-reached}
                        "More"]])]))

(rum/defcs blocks-container <
  {:init (fn [state]
           (assoc state ::init-blocks-container-id (atom nil)))}
  [state blocks config]
  (let [*init-blocks-container-id (::init-blocks-container-id state)
        blocks-container-id (if @*init-blocks-container-id
                              @*init-blocks-container-id
                              (let [id' (swap! *blocks-container-id inc)]
                                (reset! *init-blocks-container-id id')
                                id'))
        sidebar? (:sidebar? config)
        ref? (:ref? config)
        custom-query? (:custom-query? config)
        blocks->vec-tree #(if (or custom-query? ref?) % (tree/blocks->vec-tree % (:id config)))
        blocks' (blocks->vec-tree blocks)
        blocks (if (seq blocks') blocks' blocks)
        config (assoc config :blocks-container-id blocks-container-id)
        doc-mode? (:document/mode? config)]
    (when (seq blocks)
      [:div.blocks-container.flex-1
       {:class (when doc-mode? "document-mode")
        :style {:margin-left (cond
                               sidebar?
                               0
                               :else
                               -10)}}
       (lazy-blocks config blocks)])))

;; headers to hiccup
(defn ->hiccup
  [blocks config option]
  [:div.content
   (cond-> option
     (:document/mode? config) (assoc :class "doc-mode"))
   (cond
     (and (:custom-query? config)
          (:group-by-page? config))
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)]
        (for [[page blocks] blocks]
          (let [alias? (:block/alias? page)
                page (db/entity (:db/id page))
                parent-blocks (group-by :block/parent blocks)]
            [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                         (:ref? config)
                         (assoc :class "color-level px-7 py-2 rounded"))
             (ui/foldable
              [:div
               (page-cp config page)
               (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
              (for [[parent blocks] parent-blocks]
                (let [block (first blocks)]
                  [:div
                   (when (:breadcrumb-show? config)
                     [:div.my-2.opacity-70.ml-4.hover:opacity-100
                      (block-parents config (state/get-current-repo) (:block/uuid block)
                                     (:block/format block)
                                     false)])
                   (blocks-container blocks (assoc config :breadcrumb-show? false))]))
              {})])))]

     (and (:group-by-page? config)
          (vector? (first blocks)))
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :block/journal-day first) > blocks)]
        (for [[page blocks] blocks]
          (let [alias? (:block/alias? page)
                page (db/entity (:db/id page))]
            [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                         (:ref? config)
                         (assoc :class "color-level px-7 py-2 rounded"))
             (ui/foldable
              [:div
               (page-cp config page)
               (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
              (blocks-container blocks config)
              {})])))]

     :else
     (blocks-container blocks config))])
