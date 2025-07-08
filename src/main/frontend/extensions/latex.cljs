(ns frontend.extensions.latex
  (:require [frontend.config :as config]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key] :as plugin-handler]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [rum.core :as rum]))

;; TODO: extracted to a rum mixin
(defn loaded? []
  js/window.katex)

(defonce *loading? (atom false))

(defn render!
  [state]
  (let [[s _ display?] (:rum/args state)
        id (:id state)]
    (try
      (when-let [elem (gdom/getElement id)]
        (js/katex.render s elem
                         #js {:displayMode display?
                              :throwOnError false
                              :strict false}))

      (catch :default e
        (js/console.error e)))))

(defn- load-and-render!
  [state]
  (if (loaded?)
    (do
      (reset! *loading? false)
      (render! state))
    (when-not @*loading?
      (reset! *loading? true)
      (loader/load
       (config/asset-uri "/js/katex.min.js")
       (fn []
         (loader/load
          (config/asset-uri "/js/mhchem.min.js")
          (fn []
            (-> (when-let [enhancers (and config/lsp-enabled?
                                          (seq (hook-extensions-enhancers-by-key :katex)))]
                  (for [{f :enhancer} enhancers]
                    (when (fn? f) (f js/window.katex))))
                (p/all)
                (p/finally (fn []
                             (reset! *loading? false)
                             (render! state)))))))
       state))))

(defn- state-&-load-and-render!
  [state]
  (load-and-render! state)
  state)

(rum/defcs latex < rum/reactive
  {:init (fn [state]
           (assoc state :id (str (random-uuid))))
   :did-mount  state-&-load-and-render!
   :did-update state-&-load-and-render!}
  [state s block? _display?]
  (let [id (:id state)
        loading? (rum/react *loading?)]
    (if loading?
      (ui/loading)
      (let [element (if block?
                      :div.latex
                      :span.latex-inline)]
        [element {:id    id
                  :class "initial"}
         [:span.opacity-0 s]]))))

(defn html-export
  [s block? display?]
  (let [element (if block?
                  :div.latex
                  :span.latex-inline)]
    [element (if (or block? display?)
               (util/format "$$%s$$" s)
               ;; inline
               (util/format "$%s$" s))]))
