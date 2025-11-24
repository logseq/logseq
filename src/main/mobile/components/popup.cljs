(ns mobile.components.popup
  "Mobile popup"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))
(defonce *last-popup-data (atom nil))

(defn- popup-min-height
  [default-height]
  (cond
    (false? default-height) nil
    (number? default-height) default-height
    :else 400))

(defn- present-native-sheet!
  [data]
  (when-let [plugin mobile-util/native-bottom-sheet]
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
  (when-let [plugin mobile-util/native-bottom-sheet]
    (mobile-state/set-popup! nil)
    (reset! *last-popup-data nil)
    (.dismiss plugin #js {})))

(defn- handle-native-sheet-state!
  [^js data]
  (let [presented? (.-presented data)
        presenting? (.-presenting data)]
    (cond
      presenting?
      nil

      presented?
      (when (mobile-state/quick-add-open?)
        (editor-handler/quick-add-open-last-block!))

      :else
      (when (some? @mobile-state/*popup-data)
        (state/pub-event! [:mobile/clear-edit])
        (mobile-state/set-popup! nil)))))

(defonce native-sheet-listener
  (when (mobile-util/native-ios?)
    (when-let [plugin mobile-util/native-bottom-sheet]
      (.addListener plugin "state" handle-native-sheet-state!))))

(defn popup-show!
  [event content-fn {:keys [id] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    (let [pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup-modal? false) pid)

    :else
    (when content-fn
      (reset! *last-popup-modal? true)
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
      (when (mobile-util/native-ios?)
        (dismiss-native-sheet!))
      (mobile-state/set-popup! nil)
      (mobile-state/redirect-to-tab! "home"))

    :else
    (if (and @*last-popup-modal? (not (= (first args) :editor.commands/commands)))
      (if (mobile-util/native-ios?)
        (dismiss-native-sheet!)
        (mobile-state/set-popup! nil))
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
