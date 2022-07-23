(ns frontend.extensions.tldraw
  (:require ["/tldraw-logseq" :as TldrawLogseq]
            [frontend.components.page :as page]
            [frontend.components.block :as block]
            [frontend.handler.whiteboard :refer [page-name->tldr
                                                 transact-tldr!]]
            [frontend.rum :as r]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def tldraw (r/adapt-class (gobj/get TldrawLogseq "App")))

(def generate-preview (gobj/get TldrawLogseq "generateJSXFromApp"))

(rum/defc page
  [props]
          ;; (println props)
  (page/page {:page-name (gobj/get props "pageName")}))

(rum/defc breadcrumb
  [props]
  (block/breadcrumb {} (state/get-current-repo) (uuid (gobj/get props "blockId")) nil))

(rum/defcs tldraw-app < rum/reactive
  (rum/local false ::view-mode?)
  [state name block-id]
  (let [data (page-name->tldr name block-id)]
    (when (and name (not-empty (gobj/get data "currentPageId")))
      [:div.draw.tldraw.relative.w-full.h-full
       {:style {:overscroll-behavior "none"}
        :on-blur #(state/set-block-component-editing-mode! false)
        ;; wheel -> overscroll may cause browser navigation
        :on-wheel util/stop-propagation}

       (tldraw {:renderers {:Page page :Breadcrumb breadcrumb}
                :searchHandler (comp clj->js vec search/page-search)
                :onPersist (fn [app]
                             (let [document (gobj/get app "serialized")]
                               (transact-tldr! name document)))
                :model data
                :onMount (fn [app]
                           (state/set-state! [:ui/whiteboards (::id state)] app)
                           (gobj/set app "pubEvent"
                                     (fn [type & args]
                                       (state/pub-event! (cons (keyword type) args)))))})])))
