(ns frontend.extensions.tldraw
  "Adapters related to tldraw"
  (:require ["/frontend/tldraw-logseq" :as TldrawLogseq]
            [frontend.components.block :as block]
            [frontend.components.page :as page]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.rum :as r]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.ui :as ui]))

(def tldraw (r/adapt-class (gobj/get TldrawLogseq "App")))

(def generate-preview (gobj/get TldrawLogseq "generateJSXFromModel"))

(rum/defc page-cp
  [props]
  (page/page {:page-name (gobj/get props "pageName") :whiteboard? true}))

(rum/defc block-cp
  [props]
  ((state/get-component :block/single-block) (uuid (gobj/get props "blockId"))))

(rum/defc breadcrumb
  [props]
  (block/breadcrumb {:preview? true} (state/get-current-repo) (uuid (gobj/get props "blockId")) {:end-separator? true}))

(rum/defc page-name-link
  [props]
  (block/page-cp {:preview? true} {:block/name (gobj/get props "pageName")}))

(defn search-handler
  [q filters]
  (let [{:keys [pages? blocks? files?]} (js->clj filters {:keywordize-keys true})
        repo (state/get-current-repo)
        limit 100]
    (p/let [blocks (when blocks? (search/block-search repo q {:limit limit}))
            pages (when pages? (search/page-search q))
            files (when files? (search/file-search q limit))]
      (clj->js {:pages pages :blocks blocks :files files}))))

(defn save-asset-handler
  [file]
  (-> (editor-handler/save-assets! nil (state/get-current-repo) [(js->clj file)])
      (p/then
       (fn [res]
         (when-let [[asset-file-name _ full-file-path] (and (seq res) (first res))]
           (editor-handler/resolve-relative-path (or full-file-path asset-file-name)))))))

(def tldraw-renderers {:Page page-cp
                       :Block block-cp
                       :Breadcrumb breadcrumb
                       :PageNameLink page-name-link})

(defn get-tldraw-handlers [name]
  {:search search-handler
   :queryBlockByUUID #(clj->js (model/query-block-by-uuid (parse-uuid %)))
   :isWhiteboardPage model/whiteboard-page?
   :saveAsset save-asset-handler
   :makeAssetUrl editor-handler/make-asset-url
   :addNewWhiteboard (fn [page-name]
                       (whiteboard-handler/create-new-whiteboard-page! page-name))
   :addNewBlock (fn [content]
                  (str (whiteboard-handler/add-new-block! name content)))
   :sidebarAddBlock (fn [uuid type]
                      (state/sidebar-add-block! (state/get-current-repo)
                                                (:db/id (model/get-page uuid))
                                                (keyword type)))
   :redirectToPage (fn [page-name]
                     (if (model/whiteboard-page? page-name)
                       (route-handler/redirect-to-whiteboard! page-name)
                       (route-handler/redirect-to-page! page-name)))})

(rum/defc tldraw-app
  [page-name block-id]
  (let [populate-onboarding?  (whiteboard-handler/should-populate-onboarding-whiteboard? page-name)
        data (whiteboard-handler/page-name->tldr! page-name block-id)
        [loaded? set-loaded?] (rum/use-state false)
        on-mount (fn [tln]
                   (when-let [^js api (gobj/get tln "api")]
                     (p/then (when populate-onboarding?
                               (whiteboard-handler/populate-onboarding-whiteboard api))
                             #(do (when (and block-id (parse-uuid block-id))
                                    (. api selectShapes block-id)
                                    (. api zoomToSelection))
                                  (set-loaded? true)))))]

    (when data
      [:div.draw.tldraw.whiteboard.relative.w-full.h-full
       {:style {:overscroll-behavior "none"}
        :on-blur (fn [e]
                   (when (#{"INPUT" "TEXTAREA"} (.-tagName (gobj/get e "target")))
                     (state/clear-edit!)))
        ;; wheel -> overscroll may cause browser navigation
        :on-wheel util/stop-propagation}

       (when
        (and populate-onboarding? (not loaded?))
         [:div.absolute.inset-0.flex.items-center.justify-center
          {:style {:z-index 200}}
          (ui/loading "Loading onboarding whiteboard ...")])
       (tldraw {:renderers tldraw-renderers
                :handlers (get-tldraw-handlers page-name)
                :onMount on-mount
                :onPersist (fn [app]
                             (let [document (gobj/get app "serialized")]
                               (whiteboard-handler/transact-tldr! page-name document)))
                :model data})])))
