(ns mobile.components.popup
  "Mobile popup"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(defonce *last-popup? (atom nil))
(defonce *last-popup-data (atom nil))

(defn- popup-min-height
  [default-height]
  (cond
    (false? default-height) nil
    (number? default-height) default-height
    :else 400))

(defn- present-native-sheet!
  [data]
  (when-let [^js plugin mobile-util/native-bottom-sheet]
    (let [{:keys [opts]} data
          id (:id opts)
          popup-exists? (and id (= id (get-in @*last-popup-data [:opts :id])))]
      (when-not popup-exists?
        (reset! *last-popup-data data)
        (.present
         plugin
         (clj->js
          (let [height (popup-min-height (:default-height opts))]
            (cond-> {:allowFullHeight (not= (:type opts) :action-sheet)}
              (int? height) (assoc :defaultHeight height)))))))))

(defn- dismiss-native-sheet!
  []
  (when-let [^js plugin mobile-util/native-bottom-sheet]
    (mobile-state/set-popup! nil)
    (reset! *last-popup-data nil)
    (.dismiss plugin #js {})))

(defn- handle-native-sheet-state!
  [^js data]
  (let [presenting? (.-presenting data)
        dismissing? (.-dismissing data)]
    (cond
      presenting?
      (when (mobile-state/quick-add-open?)
        (editor-handler/quick-add-open-last-block!))

      dismissing?
      (when (some? @mobile-state/*popup-data)
        (let [quick-add? (mobile-state/quick-add-open?)
              current-tab @mobile-state/*tab]
          (state/pub-event! [:mobile/clear-edit])
          (mobile-state/set-popup! nil)
          (reset! *last-popup-data nil)
          (when (and current-tab quick-add?)
            (mobile-state/set-tab! current-tab))))

      :else
      nil)))

(defonce native-sheet-listener
  (when (mobile-util/native-ios?)
    (when-let [^js plugin mobile-util/native-bottom-sheet]
      (.addListener plugin "state" handle-native-sheet-state!))))

(defn- wrap-calc-commands-popup-side
  [pos opts]
  (let [[side mh] (let [[_x y _ height] pos
                        vh (.-clientHeight js/document.body)
                        [th bh] [(- y 85) (- vh (+ y height) 310)]
                        direction (if (> bh 280) "bottom"
                                      (if (> (- th bh) 100)
                                        "top" "bottom"))]
                    (if (= "top" direction)
                      ["top" th]
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
      (reset! *last-popup? false)
      pid)

    dropdown-menu?
    (let [pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup? false)
      pid)

    :else
    (when content-fn
      (reset! *last-popup? true)
      (when (mobile-util/native-ios?)
        (let [data {:open? true
                    :content-fn content-fn
                    :opts opts}]
          (present-native-sheet! data)
          (mobile-state/set-popup! data))))))

(defn popup-hide!
  [& args]
  (cond
    (= :download-rtc-graph (first args))
    (do
      (dismiss-native-sheet!)
      (mobile-state/set-tab! "home"))

    :else
    (if (and @*last-popup? (not (= (first args) :editor.commands/commands)))
      (dismiss-native-sheet!)
      (apply shui-popup/hide! args))))

(set! shui/popup-show! popup-show!)
(set! shui/popup-hide! popup-hide!)

(rum/defc popup
  [opts content-fn]
  (let [title (or (:title opts) (when (string? content-fn) content-fn))
        content (if (fn? content-fn)
                  (content-fn)
                  (if-let [buttons (:buttons opts)]
                    [:div.-mx-2
                     (for [{:keys [role text]} buttons]
                       (ui/menu-link
                        {:on-click #(some-> (:on-action opts) (apply [{:role role}]))
                         :data-role role}
                        [:span.text-lg.flex.items-center text]))]
                    (when-not (string? content-fn) content-fn)))]
    [:div {:class "flex flex-col items-center p-2 w-full h-full"}
     [:div.app-popup
      (when title [:h2.py-2.opacity-40 title])
      content]]))
