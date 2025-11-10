(ns mobile.components.popup
  "Mobile popup"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [goog.object :as gobj]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.ui :as shui]
            [mobile.bottom-tabs :as bottom-tabs]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))

(defn wrap-calc-commands-popup-side
  [pos opts]
  (let [[side mh] (let [[_x y _ height] pos
                        vh (.-clientHeight js/document.body)
                        [th bh] [y (- vh (+ y height) 310)]]
                    (case (if (> bh 280) "bottom"
                              (if (> (- th bh) 100)
                                "top" "bottom"))
                      "top" ["top" th]
                      ["bottom" bh]))]
    (-> (assoc opts :auto-side? false)
        (assoc :max-popup-height mh)
        (assoc-in [:content-props :side] side))))

(defn popup-show!
  [event content-fn {:keys [id dropdown-menu?] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    (let [opts (wrap-calc-commands-popup-side event opts)
          side (some-> opts :content-props :side)
          max-h (some-> opts :max-popup-height (js/parseInt) (- 48))
          _ (when max-h (js/document.documentElement.style.setProperty
                         (str "--" side "-popup-content-max-height") (str max-h "px")))
          pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup-modal? false) pid)

    dropdown-menu?
    (let [pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup-modal? false) pid)

    :else
    (when content-fn
      (mobile-state/set-popup! {:open? true
                                :content-fn content-fn
                                :opts opts})
      (reset! *last-popup-modal? true))))

(defn popup-hide!
  [& args]
  (cond
    (= :download-rtc-graph (first args))
    (do
      (mobile-state/set-popup! nil)
      (mobile-state/redirect-to-tab! "home"))

    :else
    (if (and @*last-popup-modal? (not (= (first args) :editor.commands/commands)))
      (mobile-state/set-popup! nil)
      (apply shui-popup/hide! args))))

(set! shui/popup-show! popup-show!)
(set! shui/popup-hide! popup-hide!)

(rum/defc popup < rum/reactive
  []
  (let [{:keys [open? content-fn opts]} (rum/react mobile-state/*popup-data)
        quick-add? (= :ls-quick-add (:id opts))
        audio-record? (= :ls-audio-record (:id opts))
        action-sheet? (= :action-sheet (:type opts))
        default-height (:default-height opts)]

    (when open?
      (bottom-tabs/hide!)
      (silkhq/bottom-sheet
       (merge
        {:presented (boolean open?)
         :onPresentedChange (fn [v?]
                              (when (false? v?)
                                (state/pub-event! [:mobile/clear-edit])
                                ;; allows closing animation
                                (js/setTimeout #(do
                                                  (mobile-state/set-popup! nil)
                                                  (bottom-tabs/show!)) 150)))}
        (:modal-props opts))
       (silkhq/bottom-sheet-portal
        (silkhq/bottom-sheet-view
         {:class (str "app-silk-popup-sheet-view as-" (name (or (:type opts) "default")))
          :inertOutside false
          :onTravelStatusChange (fn [status]
                                  (when (and quick-add? (= status "entering"))
                                    (editor-handler/quick-add-open-last-block!)))
          :onPresentAutoFocus #js {:focus false}}
         (silkhq/bottom-sheet-backdrop
          (when (or quick-add? audio-record?)
            {:travelAnimation {:opacity (fn [data]
                                          (let [progress (gobj/get data "progress")]
                                            (js/Math.min (* progress 0.9) 0.9)))}}))
         (silkhq/bottom-sheet-content
          {:class "flex flex-col items-center p-2"}
          (silkhq/bottom-sheet-handle)
          (silkhq/scroll
           {:as-child true}
           (silkhq/scroll-view
            {:class "app-silk-scroll-view overflow-y-scroll"
             :scrollGestureTrap {:yEnd true}
             :style {:min-height (cond
                                   (false? default-height)
                                   nil
                                   (number? default-height)
                                   default-height
                                   :else
                                   400)
                     :max-height "80vh"}}
            (silkhq/scroll-content
             (let [title (or (:title opts) (when (string? content-fn) content-fn))
                   content (if (fn? content-fn)
                             (content-fn)
                             (if-let [buttons (and action-sheet? (:buttons opts))]
                               [:div.-mx-2
                                (for [{:keys [role text]} buttons]
                                  (ui/menu-link {:on-click #(some-> (:on-action opts) (apply [{:role role}]))
                                                 :data-role role}
                                                [:span.text-lg.flex.items-center text]))]
                               (when-not (string? content-fn) content-fn)))]
               [:div.w-full.app-silk-popup-content-inner.p-2
                (when title [:h2.py-2.opacity-40 title])
                content])))))))))))
