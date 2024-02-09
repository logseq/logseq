(ns logseq.shui.popup.core
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [medley.core :as medley]
            [logseq.shui.util :refer [use-atom]]))

;; {:id :open? false :content nil :position [0 0] :root-props nil :content-props nil}
(defonce ^:private *popups (atom []))
(defonce ^:private *id (atom 0))
(defonce ^:private gen-id #(reset! *id (inc @*id)))

(defn get-popup
  [id]
  (when id
    (some->> (medley/indexed @*popups)
      (filter #(= id (:id (second %)))) (first))))

(defn get-popups [] @*popups)

(defn upsert-popup!
  [config]
  (when-let [id (:id config)]
    (if-let [[index config'] (get-popup id)]
      (swap! *popups assoc index (merge config' config))
      (swap! *popups conj config))))

(defn update-popup!
  [id ks val]
  (when-let [[index config] (get-popup id)]
    (let [ks (if (coll? ks) ks [ks])
          config (if (nil? val)
                   (medley/dissoc-in config ks)
                   (assoc-in config ks val))]
      (swap! *popups assoc index config))))

(defn detach-popup!
  [id]
  (when-let [[index] (get-popup id)]
    (swap! *popups #(->> % (medley/remove-nth index) (vec)))))

(defn show!
  [^js event content & {:keys [id as-menu? root-props content-props] :as opts}]
  (let [position (cond
                   (vector? event) event

                   (instance? js/MouseEvent (or (.-nativeEvent event) event))
                   [(.-clientX event) (.-clientY event)]

                   (instance? js/Element event)
                   (let [^js rect (.getBoundingClientRect event)
                         left (.-left rect)
                         width (.-width rect)
                         bottom (.-bottom rect)]
                     [(+ left (/ width 2)) bottom])
                   :else [0 0])]
    (upsert-popup!
      (merge opts
        {:id       (or id (gen-id))
         :open?    true :content content :position position
         :as-menu? as-menu? :root-props root-props :content-props content-props}))))

(defn hide!
  [id]
  (update-popup! id :open? false))

(defn hide-all!
  []
  (doseq [{:keys [id]} @*popups]
    (hide! id)))

(rum/defc x-popup
  [{:keys [id open? content position as-menu? root-props content-props] :as _props}]
  (rum/use-effect!
    (fn []
      (when (false? open?)
        (js/setTimeout #(detach-popup! id) 128)))
    [open?])

  (when-let [[x y] position]
    (let [popup-root (if as-menu? ui/dropdown-menu ui/popover)
          popup-trigger (if as-menu? ui/dropdown-menu-trigger ui/popover-trigger)
          popup-content (if as-menu? ui/dropdown-menu-content ui/popover-content)]
      (popup-root
        (merge root-props {:open open?})
        (popup-trigger
          {:as-child true}
          (ui/button {:class "w-1 h-1 overflow-hidden fixed p-0 opacity-0"
                      :style {:top y :left x}} ""))
        (popup-content
          (merge {:onEscapeKeyDown      #(hide! id)
                  :onPointerDownOutside #(hide! id)} content-props)
          (if (fn? content) (content {:id id}) content))))))

(rum/defc install-popups
  < rum/static
  []
  (let [[popups _set-popups!] (use-atom *popups)]
    [:<>
     (for [config popups
           :when (and (map? config) (:id config))]
       (x-popup config))]))
