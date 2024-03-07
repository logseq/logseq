(ns logseq.shui.select.multi
  (:require [rum.core :as rum]
            [logseq.shui.popup.core :as popup]
            [logseq.shui.form.core :as form]))

(defn get-k [item]
  (when (map? item)
    (some->> ((juxt :id :key :label) item)
      (remove nil?)
      (first))))

(rum/defc x-select
  [items selected-items & {:keys [on-chosen item-render item-props
                                  content-props]}]
  (let [x-content popup/dropdown-menu-content
        x-item popup/dropdown-menu-item]
    (x-content
      (merge {} content-props)
      (for [item items
            :let [selected? (some #(let [k (get-k item)
                                         k' (get-k %)]
                                     (or (= item %)
                                       (and (not (nil? k))
                                         (not (nil? k'))
                                         (= k k'))))
                              selected-items)]]
        (if (fn? item-render)
          (item-render item {:x-item x-item :selected selected?})
          (let [{:keys [title value]} item
                k (get-k item)
                v (or title value)
                on-click' (:on-click item-props)
                on-click (fn [e]
                           ;; TODO: return value
                           (when (fn? on-click') (on-click' e))
                           (when (fn? on-chosen)
                             (on-chosen item {:selected selected?})))]
            (x-item (merge {:data-k k :on-click on-click} item-props)
              [:a.flex.items-center.gap-2.w-full
               (form/checkbox {:checked selected?}) v])))))))
