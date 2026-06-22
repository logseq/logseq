(ns frontend.extensions.latex
  (:require [frontend.config :as config]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key] :as plugin-handler]
            [frontend.loader :as loader]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

;; TODO: extract this loading lifecycle
(defn loaded? []
  js/window.katex)

(defonce *loading? (atom false))

(defn render!
  [id s display?]
  (try
    (when-let [elem (gdom/getElement id)]
      (js/katex.render s elem
                       #js {:displayMode display?
                            :throwOnError false
                            :strict false}))

    (catch :default e
      (js/console.error e))))

(defn- load-and-render!
  [id s display?]
  (if (loaded?)
    (do
      (reset! *loading? false)
      (render! id s display?))
    (when-not @*loading?
      (reset! *loading? true)
      (loader/load "./js/katex.min.js"
                   (fn []
                     (loader/load "./js/mhchem.min.js"
                                  (fn []
                                    (-> (when-let [enhancers (and config/lsp-enabled?
                                                                  (seq (hook-extensions-enhancers-by-key :katex)))]
                                          (for [{f :enhancer} enhancers]
                                            (when (fn? f) (f js/window.katex))))
                                        (p/all)
                                        (p/finally (fn []
                                                     (reset! *loading? false)
                                                     (render! id s display?)))))))))))

(hsx/defc latex
  [s block? display?]
  (let [id (hooks/use-memo #(str (random-uuid)) [])
        loading? (first (hooks/use-atom *loading?))]
    (hooks/use-effect!
     (fn []
       (load-and-render! id s display?))
     [id s display? loading?])
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
