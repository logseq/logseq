(ns logseq.shui.demo2
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [medley.core :as medley]
            [logseq.shui.util :refer [use-atom]]
            [frontend.components.icon :refer [emojis-cp emojis]]))

;; {:id "" :open? false :content nil :position [0 0] :root-props nil :content-props nil}
(defonce ^:private *popups (atom []))
(defonce ^:private *id (atom 0))
(defonce ^:private gen-id #(reset! *id (inc @*id)))

(defn get-popup
  [id]
  (when id
    (some->> (medley/indexed @*popups)
      (filter #(= id (:id (second %)))) (first))))

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

(defn show-x-popup!
  [^js event content & {:keys [id as-menu? root-props content-props] :as opts}]
  (let [position (cond
                   (vector? event) event
                   (instance? js/MouseEvent (or (.-nativeEvent event) event)) [(.-clientX event) (.-clientY event)]
                   :else [0 0])]
    (js/console.log event)
    (upsert-popup!
      (merge opts
        {:id       (or id (gen-id))
         :open?    true :content content :position position
         :as-menu? as-menu? :root-props root-props :content-props content-props}))))

(defn hide-x-popup!
  [id]
  (update-popup! id :open? false))

(defn hide-x-popup-all!
  []
  (doseq [{:keys [id]} @*popups]
    (hide-x-popup! id)))

(rum/defc x-popup [{:keys [id open? content position as-menu? root-props content-props] :as _props}]
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
          (merge {:onEscapeKeyDown      #(hide-x-popup! id)
                  :onPointerDownOutside #(hide-x-popup! id)} content-props)
          (if (fn? content) (content {:id id}) content))))))

(rum/defc install-popups
  < rum/static
  []
  (let [[popups _set-popups!] (use-atom *popups)]
    [:<>
     (for [config popups
           :when (and (map? config) (:id config))]
       (x-popup config))]))

(rum/defc page []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4 "UI X Popup"]

   (rum/portal
     (install-popups)
     js/document.body)

   (let [[emoji set-emoji!] (rum/use-state nil)
         [q set-q!] (rum/use-state "")
         emoji-picker (fn [_nested?]
                        [:p.py-4
                         "Choose a inline "
                         [:a.underline
                          {:on-click #(show-x-popup! %
                                        [:div.max-h-72.overflow-auto.p-1
                                         (emojis-cp (take 80 emojis)
                                           {:on-chosen
                                            (fn [_ t]
                                              (set-emoji! t)
                                              (hide-x-popup-all!))})]
                                        {:content-props {:class "w-72 p-0"}
                                         :as-menu?      true})}
                          (if emoji [:strong.px-1.text-6xl [:em-emoji emoji]] "emoji :O")] "."])]
     [:<>
      (emoji-picker nil)

      [:p.py-4
       (ui/button
         {:variant  :secondary
          :on-click #(show-x-popup! %
                       (fn []
                         [:p.p-4
                          (emoji-picker true)]))}
         "Play a nested x popup.")]

      [:p.py-4
       (ui/input
         {:placeholder "Select a fruit."
          :value       q
          :on-change   #(set-q! (.-value (.-target %)))
          :class       "w-1/5"
          :on-focus    #(js/console.log (.getBoundingClientRect (.-target %)))
          :on-blur     #(js/console.log %)
          })]

      [:div.w-full.p-4.border.rounded.dotted.h-48.mt-8.bg-gray-02
       {:on-click        #(show-x-popup! %
                            (->> (range 8)
                              (map (fn [it]
                                     (ui/dropdown-menu-item
                                       {:on-select (fn []
                                                     (ui/toast! it)
                                                     (hide-x-popup-all!))}
                                       [:strong it]))))
                            {:as-menu?      true
                             :content-props {:class "w-48"}})
        :on-context-menu #(show-x-popup! %
                            [:h1.text-3xl.font-bold "hi x popup for custom context menu!"])}]])])