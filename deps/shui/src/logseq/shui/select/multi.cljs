(ns logseq.shui.select.multi
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [logseq.shui.popup.core :as popup]
            [logseq.shui.form.core :as form]))

(defn- get-k [item]
  (when (map? item)
    (some->> ((juxt :id :key :label) item)
      (remove nil?)
      (first))))

(defn- get-v
  [item]
  (if (string? item)
    item (or (:title item) (:value item))))

(rum/defc search-input
  [input-props]
  (let [*el (rum/use-ref nil)
        [down set-down!] (rum/use-state 0)]

    (rum/use-effect!
      (fn []
        (when (> down 0)
          (some-> (rum/deref *el)
            (.closest ".head")
            (.-nextSibling)
            (.focus))))
      [down])

    [:div.search-input.p-2
     {:ref *el}
     (form/input
       (merge {:placeholder "search"
               :class "!h-8"
               :on-key-up #(case (.-key %)
                             "ArrowDown" (set-down! (inc down))
                             "ArrowUp" nil
                             :dune)
               :auto-focus true}
         input-props))]))

(defn- simple-search-fn
  [items q]
  (let [q (some-> q (string/trim) (string/lower-case))]
    (if (string/blank? q)
      items
      (filter #(some-> (get-v %)
                 (string/lower-case)
                 (string/starts-with? q)) items))))

(rum/defc x-select
  [items selected-items & {:keys [on-chosen item-render value-render
                                  head-render foot-render open? close!
                                  search-enabled? search-key search-fn
                                  item-props content-props]}]
  (let [x-content popup/dropdown-menu-content
        x-item popup/dropdown-menu-item
        [search-key1 set-search-key!] (rum/use-state search-key)
        items (if search-enabled?
                (if (fn? search-fn)
                  (search-fn items search-key1)
                  (simple-search-fn items search-key1))
                items)
        close1! #(when (fn? close!) (close!))]

    (rum/use-effect!
      (fn []
        (when (and search-enabled? (false? open?))
          (js/setTimeout #(set-search-key! "") 500)))
      [open?])

    [:div.flex.flex-1.flex-col
     (x-content
       (merge
         {:onCloseAutoFocus false
          :onInteractOutside close1!
          :onEscapeKeyDown close1!}
         content-props)
       ;; header
       (when (or search-enabled? (fn? head-render))
         [:div.head
          (when search-enabled?
            (search-input
              {:value search-key1
               :on-key-down (fn [^js e]
                              (.stopPropagation e)
                              (case (.-key e)
                                "Escape" (if (string/blank? search-key1)
                                           (some-> (.-target e) (.blur))
                                           (set-search-key! ""))
                                :dune))
               :on-change #(set-search-key! (.-value (.-target %)))}))
          (when head-render (head-render))])
       ;; items
       (for [item items
             :let [selected? (some #(let [k (get-k item)
                                          k' (get-k %)]
                                      (or (= item %)
                                        (and (not (nil? k))
                                          (not (nil? k'))
                                          (= k k'))))
                               selected-items)]]
         (if (fn? item-render)
           (item-render item {:x-item x-item :selected? selected?})
           (let [k (get-k item)
                 v (get-v item)]
             (when k
               (let [opts {:selected? selected?}
                     on-click' (:on-click item-props)
                     on-click (fn [e]
                                ;; TODO: return value
                                (when (fn? on-click') (on-click' e))
                                (when (fn? on-chosen)
                                  (on-chosen item opts)))]
                 (x-item (merge {:data-k k :on-click on-click} item-props)
                   [:span.flex.items-center.gap-2.w-full
                    (form/checkbox {:checked selected?})
                    (let [v' (if (fn? v) (v item opts) v)]
                      (if (fn? value-render)
                        (value-render v' (assoc opts :item item)) v'))]))))))
       ;; footer
       (when (fn? foot-render)
         [:div.foot
          (foot-render)]))]))
