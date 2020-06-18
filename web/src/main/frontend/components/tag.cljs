(ns frontend.components.tag
  (:require [frontend.components.reference :as reference]
            [rum.core :as rum]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.graph.vis :as vis]))

(defn- get-tag
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(rum/defcs tag < rum/reactive
  [state]
  (when-let [tag (get-tag state)]
    [:div.tag
     [:h1.title (str "#" tag)]
     (reference/references tag true)]))

(defn render-graph
  [state]
  (let [theme (:ui/theme @state/state)
        dark? (= theme "dark")
        tags (db/get-all-tags)
        nodes (mapv (fn [[tag refs]]
                      (cond->
                          {:id tag
                           :label tag
                           :value refs
                           :font {:size (* (min 4 (max 1 (/ refs 3))) 14)}
                           :shadow {:enabled true}}
                        dark?
                        (assoc-in [:font :color] "#dfdfdf")))
                    tags)
        graph {:nodes nodes}]
    (vis/new-network "tags-graph" graph))
  state)

(rum/defc all-tags < rum/reactive
  {:did-mount render-graph
   :did-update render-graph}
  []
  (let [theme (state/sub :ui/theme)]
    [:div.all-tags
    [:div.flex-1.flex-col
     [:div#tags-graph {:style {:height "100vh"}}]]]))
