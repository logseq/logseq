(ns frontend.components.lazy-graph
  (:require [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [shadow.loader :as loader]))

(defonce ^:private renderer (atom nil))
(defonce ^:private load-promise (atom nil))

(defn register-renderer! [component]
  (reset! renderer {:component component}))

(defn load-graph! []
  (or @load-promise
      (let [result (p/let [_ (p/create
                                (fn [resolve reject]
                                  (let [deferred (loader/load :graph-view #(resolve nil))]
                                    (.addErrback deferred reject))))]
                     (when-not @renderer
                       (throw (js/Error. "Graph module did not register its renderer"))))]
        (reset! load-promise result)
        result)))

(hsx/defc graph-2d [opts]
  (let [[api] (hooks/use-atom renderer)
        [error set-error!] (hooks/use-state nil)
        component (:component api)]
    (hooks/use-effect!
     (fn []
       (-> (load-graph!) (p/catch set-error!))
       nil)
     [])
    (when error (throw error))
    (if component
      [component opts]
      [:div.graph-canvas {:style {:width "100%" :height "100%"}}])))
