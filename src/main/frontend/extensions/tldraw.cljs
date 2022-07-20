(ns frontend.extensions.tldraw
  (:require ["/tldraw-logseq" :as TldrawLogseq]
            [frontend.components.page :refer [page]]
            [frontend.search :as search]
            [frontend.db.model :as model]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def tldraw (r/adapt-class (gobj/get TldrawLogseq "App")))

#_:clj-kondo/ignore
(rum/defcs tldraw-app < rum/reactive
  (rum/local false ::view-mode?)
  [state name]
  (let [data (model/page-name->tldr name)]
    (when name
      [:div.draw.tldraw.relative.w-full.h-full
       {:style {:overscroll-behavior "none"}
        :on-blur #(state/set-block-component-editing-mode! false)
        ;; wheel -> overscroll may cause browser navigation
        :on-wheel util/stop-propagation}

       (tldraw {:PageComponent page
                :searchHandler (comp clj->js vec search/page-search)
                :onPersist (fn [app]
                             (let [document (gobj/get app "serialized")]
                               (model/transact-tldr! name document)))
                :model data
                :onMount (fn [app]
                           (state/set-state! [:ui/whiteboards (::id state)] app)
                           (gobj/set app "pubEvent"
                                     (fn [type & args]
                                       (state/pub-event! (cons (keyword type) args)))))})])))
