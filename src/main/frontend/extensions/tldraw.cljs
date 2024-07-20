(ns frontend.extensions.tldraw
  "Adapters related to tldraw"
  (:require ["/frontend/tldraw-logseq" :as TldrawLogseq]
            [frontend.components.block :as block]
            [frontend.components.export :as export]
            [frontend.components.page :as page]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.handler.history :as history]
            [frontend.handler.notification :as notification]
            [frontend.rum :as r]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.whiteboard :as whiteboard]
            [cljs-bean.core :as bean]
            [frontend.db.async :as db-async]
            [logseq.common.util :as common-util]
            [frontend.util.text :as text-util]))

(def tldraw (r/adapt-class (gobj/get TldrawLogseq "App")))

(def generate-preview (gobj/get TldrawLogseq "generateJSXFromModel"))

(rum/defc page-cp
  [props]
  (page/page {:page-name (gobj/get props "pageName") :whiteboard? true}))

(rum/defc block-cp
  [props]
  (let [block-id (uuid (gobj/get props "blockId"))]
    ((state/get-component :block/single-block)
     {:id (str block-id) :whiteboard? true}
     block-id)))

(rum/defc breadcrumb
  [props]
  (block/breadcrumb {:preview? true}
                    (state/get-current-repo)
                    (uuid (gobj/get props "blockId"))
                    {:end-separator? (gobj/get props "endSeparator")
                     :level-limit (gobj/get props "levelLimit" 3)}))

(rum/defc tweet
  [props]
  (ui/tweet-embed (gobj/get props "tweetId")))

(rum/defc block-reference
  [props]
  (block/block-reference {} (gobj/get props "blockId") nil))

(rum/defc page-name-link
  [props]
  (when-let [page-name (gobj/get props "pageName")]
    (when-let [page (db/get-page page-name)]
      (block/page-cp {:preview? true} page))))

(defn search-handler
  [q filters]
  (let [{:keys [blocks?]} (js->clj filters {:keywordize-keys true})
        repo (state/get-current-repo)
        limit 100]
    (p/let [blocks (when blocks? (search/block-search repo q {:limit limit}))
            blocks (map (fn [b]
                          (-> b
                              (update :block/uuid str)
                              (update :block/title #(->> (text-util/cut-by % "$pfts_2lqh>$" "$<pfts_2lqh$")
                                                           (apply str))))) blocks)]
      (clj->js {:blocks blocks}))))

(defn save-asset-handler
  [file]
  (-> (editor-handler/save-assets! (state/get-current-repo) [(js->clj file)])
      (p/then
       (fn [res]
         (when-let [[asset-file-name _ full-file-path] (and (seq res) (first res))]
           (editor-handler/resolve-relative-path (or full-file-path asset-file-name)))))))

(defn references-count
  [props]
  (apply whiteboard/references-count
         (map (fn [k] (js->clj (gobj/get props k) {:keywordize-keys true})) ["id" "className" "options"])))

(rum/defc keyboard-shortcut
  [^js props]
  (when-let [props (bean/->clj props)]
    (let [{:keys [action shortcut opts]} props
          shortcut (if (string? action) (ui/keyboard-shortcut-from-config (keyword action)) shortcut)
          opts (merge {:interactive? false} opts)]
      (cond
        (string? shortcut) (ui/render-keyboard-shortcut shortcut opts)
        :else (interpose " | " (map #(ui/render-keyboard-shortcut % opts) shortcut))))))

(def tldraw-renderers {:Page page-cp
                       :Block block-cp
                       :Breadcrumb breadcrumb
                       :Tweet tweet
                       :PageName page-name-link
                       :BacklinksCount references-count
                       :BlockReference block-reference
                       :KeyboardShortcut keyboard-shortcut})

(def undo (fn [] (history/undo! nil)))
(def redo (fn [] (history/redo! nil)))
(defn get-tldraw-handlers [current-whiteboard-uuid]
  {:t (fn [key] (t (keyword key)))
   :search search-handler
   :queryBlockByUUID (fn [block-uuid]
                       (clj->js
                        (model/query-block-by-uuid block-uuid)))
   :getBlockPageName #(let [block-id-str %]
                        (if (util/uuid-string? block-id-str)
                          (str (:block/uuid (model/get-block-page (state/get-current-repo) (parse-uuid block-id-str))))
                          (str (:block/uuid (db/get-page block-id-str)))))
   :exportToImage (fn [page-uuid-str options]
                    (assert (common-util/uuid-string? page-uuid-str))
                    (state/set-modal! #(export/export-blocks (uuid page-uuid-str) (merge (js->clj options :keywordize-keys true) {:whiteboard? true}))))
   :isWhiteboardPage (fn [page-name]
                       (when-let [entity (db/get-page page-name)]
                         (model/whiteboard-page? entity)))
   :isMobile util/mobile?
   :saveAsset save-asset-handler
   :makeAssetUrl assets-handler/make-asset-url
   :inflateAsset (fn [src] (clj->js (pdf-assets/inflate-asset src)))
   :setCurrentPdf (fn [src] (state/set-current-pdf! (if src (pdf-assets/inflate-asset src) nil)))
   :copyToClipboard (fn [text, html] (util/copy-to-clipboard! text :html html))
   :getRedirectPageName (fn [page-name-or-uuid] (model/get-redirect-page-name page-name-or-uuid))
   :insertFirstPageBlock (fn [page-name]
                           (editor-handler/insert-first-page-block-if-not-exists! page-name))
   :addNewPage (fn [page-name]
                 (p/let [result (page-handler/<create! page-name {:redirect? false})]
                   (str (:block/uuid result))))
   :addNewWhiteboard (fn [page-name]
                       (p/let [result (whiteboard-handler/<create-new-whiteboard-page! page-name)]
                         (str result)))
   :addNewBlock (fn [content]
                  (p/let [new-block-id (whiteboard-handler/<add-new-block! current-whiteboard-uuid content)]
                    (str new-block-id)))
   :sidebarAddBlock (fn [uuid type]
                      (state/sidebar-add-block! (state/get-current-repo)
                                                (:db/id (model/get-page uuid))
                                                (keyword type)))
   :redirectToPage (fn [page-uuid-str]
                     (when page-uuid-str
                       (p/let [block-id (parse-uuid page-uuid-str)
                               _ (when block-id (db-async/<get-block (state/get-current-repo) block-id))
                               page (or
                                     (when block-id (model/get-block-page (state/get-current-repo) block-id))
                                     (db/get-page page-uuid-str))
                               whiteboard? (model/whiteboard-page? page)]
                         (p/let [new-page (when (nil? page)
                                            (page-handler/<create! page-uuid-str {:redirect? false}))
                                 page' (or new-page page)]
                           (route-handler/redirect-to-page! (if whiteboard?
                                                              (:block/uuid page')
                                                              (model/get-redirect-page-name (:block/uuid page')))
                                                            (when (and block-id (not= block-id (:block/uuid page')))
                                                              {:block-id block-id}))))))})

(defonce *transact-result (atom nil))

(defn- on-persist
  [page-name app info]
  (->
   (p/let [_ @*transact-result
           result (p/do!
                   (state/set-state! [:whiteboard/last-persisted-at (state/get-current-repo)] (util/time-ms))
                   (whiteboard-handler/<transact-tldr-delta! page-name app info))]
     (reset! *transact-result result))
   (p/catch (fn [^js error]
              (js/console.error error)
              (notification/show! [:div
                                   (str "Save whiteboard failed, error:" (.-cause error))])))))

(rum/defc tldraw-inner < rum/static
  {:will-remount (fn [old-state new-state]
                   (let [page-uuid (first (:rum/args old-state))
                         old-data (nth (:rum/args old-state) 1)
                         new-data (nth (:rum/args new-state) 1)
                         old-shapes (let [shapes (some-> (gobj/get old-data "pages")
                                                         first
                                                         (gobj/get "shapes"))]
                                      (zipmap (map #(gobj/get % "id") shapes)
                                              shapes))
                         new-shapes (some-> (gobj/get new-data "pages")
                                            first
                                            (gobj/get "shapes"))
                         updated-shapes (filter (fn [shape]
                                                  (when-let [old (get old-shapes (gobj/get shape "id"))]
                                                    (not= (gobj/get shape "type") (gobj/get old "type"))))
                                                new-shapes)]
                     ;; FIXME: this should be handled by tldraw, any data changes should re-render the updated shapes
                     (when (seq updated-shapes)
                       (whiteboard-handler/update-shapes! updated-shapes))

                     (whiteboard-handler/update-shapes-index! page-uuid))
                   new-state)}
  [page-uuid data populate-onboarding? loaded-app on-mount]
  [:div.draw.tldraw.whiteboard.relative.w-full.h-full
   {:style {:overscroll-behavior "none"}
    :on-blur (fn [e]
               (when (#{"INPUT" "TEXTAREA"} (.-tagName (gobj/get e "target")))
                 (state/clear-edit!)))
        ;; wheel -> overscroll may cause browser navigation
    :on-wheel util/stop-propagation}

   (when
    (and populate-onboarding? (not loaded-app))
     [:div.absolute.inset-0.flex.items-center.justify-center
      {:style {:z-index 200}}
      (ui/loading "Loading onboarding whiteboard ...")])

   (tldraw {:renderers tldraw-renderers
            :handlers (get-tldraw-handlers page-uuid)
            :onMount on-mount
            :readOnly config/publishing?
            ;; :onPersist (debounce #(on-persist page-uuid %1 %2) 200)
            :onPersist #(on-persist page-uuid %1 %2)
            :model data})])

(rum/defc tldraw-app-inner < rum/reactive
  {:init (fn [state]
           (let [page-uuid (first (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) page-uuid)
             state))}
  [page-uuid block-id loaded-app set-loaded-app]
  (when-not (state/sub-async-query-loading (str page-uuid))
    (let [populate-onboarding? (whiteboard-handler/should-populate-onboarding-whiteboard? page-uuid)
          on-mount (fn [^js tln]
                     (when tln
                       (set! (.-appUndo tln) undo)
                       (set! (.-appRedo tln) redo)
                       (when-let [^js api (gobj/get tln "api")]
                         (p/then (when populate-onboarding?
                                   (whiteboard-handler/populate-onboarding-whiteboard api))
                                 #(do (whiteboard-handler/cleanup! (.-currentPage tln))
                                      (state/focus-whiteboard-shape tln block-id)
                                      (set-loaded-app tln))))))
          data (whiteboard-handler/get-page-tldr page-uuid)]
      (when data
        (tldraw-inner page-uuid data populate-onboarding? loaded-app on-mount)))))

(rum/defc tldraw-app
  [page-uuid block-id]
  (let [page-uuid (str page-uuid)
        [loaded-app set-loaded-app] (rum/use-state nil)]
    (rum/use-effect! (fn []
                       (when (and loaded-app block-id)
                         (state/focus-whiteboard-shape loaded-app block-id))
                       #())
                     [block-id loaded-app])
    (tldraw-app-inner page-uuid block-id loaded-app set-loaded-app)))
