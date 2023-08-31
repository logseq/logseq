(ns frontend.extensions.excalidraw
  (:require [clojure.string :as string]
            ;; NOTE: Always use production build of excalidraw
            ;; See-also: https://github.com/excalidraw/excalidraw/pull/3330
            ["@excalidraw/excalidraw/dist/excalidraw.production.min" :refer [Excalidraw serializeAsJSON]]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.draw :as draw]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.functions :refer [debounce]]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]))

(def excalidraw (r/adapt-class Excalidraw))

(defn from-json
  [text]
  (when-not (string/blank? text)
    (try
      (js/JSON.parse text)
      (catch :default e
        (println "from json error:")
        (js/console.dir e)
        (notification/show!
         (util/format "Could not load this invalid excalidraw file")
         :error)))))

(defn- update-draw-content-width
  [state]
  (when-let [el ^js (rum/dom-node state)]
    (loop [el (.querySelector el ".draw-wrap")]
      (cond
        (or (nil? el) (undefined? el) (undefined? (.-classList el)))
        nil

        (..  el -classList (contains "block-content"))
        (let [client-width (.-clientWidth el)
              width (if (zero? client-width)
                      (.-width (.-getBoundingClientRect el))
                      client-width)]
          (reset! (::draw-width state) width))

        :else
        (recur (.-parentNode el))))
    state))

(defn excalidraw-theme [ui-theme]
  ;; One of these constants are meant to be used as a 'theme' argument for escalidraw:
  ;; https://github.com/excalidraw/excalidraw/blob/master/src/constants.ts#L75
  ;; But they are missing from the prod build of excalidraw we're using.
  ;; They map to "light" and "dark", happens that :ui/theme uses same values, so we are safe to pass it directly, for now.
  ;; Escalidraw may migrate to different values for these constants in future versions,
  ;; so, in order to not watch out for it every time we bump a new version we better migrate to constants as soon as they appear in a prod build.
  ui-theme)

(rum/defcs draw-inner < rum/reactive
  (rum/local 800 ::draw-width)
  (rum/local true ::zen-mode?)
  (rum/local false ::view-mode?)
  (rum/local false ::grid-mode?)
  (rum/local nil ::elements)
  (rum/local nil ::resize-observer)
  {:did-mount (fn [state]
                (reset! (::resize-observer state) (js/ResizeObserver. (debounce #(reset! (::draw-width state) 0) 300)))
                (.observe @(::resize-observer state) (ui/main-node))
                (update-draw-content-width state))
   :did-update update-draw-content-width
   :will-unmount (fn [state] (.disconnect @(::resize-observer state)))}
  [state data option]
  (let [ref (rum/create-ref)
        *draw-width (get state ::draw-width)
        *zen-mode? (get state ::zen-mode?)
        *view-mode? (get state ::view-mode?)
        *grid-mode? (get state ::grid-mode?)
        wide-mode? (state/sub :ui/wide-mode?)
        *elements (get state ::elements)
        {:keys [file block-uuid]} option]
    (when data
      [:div.overflow-hidden {:on-mouse-down (fn [e] (util/stop e))}
       [:div.my-1 {:style {:font-size 10}}
        [:a.mr-2 {:on-click ui-handler/toggle-wide-mode!}
         (util/format "Wide Mode (%s)" (if wide-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *zen-mode? not)}
         (util/format "Zen Mode (%s)" (if @*zen-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *view-mode? not)}
         (util/format "View Mode (%s)" (if @*view-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *grid-mode? not)}
         (util/format "Grid Mode (%s)" (if @*grid-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(when-let [block (db/pull [:block/uuid block-uuid])]
                               (editor-handler/edit-block! block :max block-uuid))}
         "Edit Block"]]
       [:div.draw-wrap
        {:ref ref
         :on-mouse-down (fn [e]
                          (util/stop e)
                          (state/set-block-component-editing-mode! true))
         :on-blur #(state/set-block-component-editing-mode! false)
         :style {:width  @*draw-width
                 :height (if wide-mode? 650 500)}}
        (excalidraw
         (merge
          {:on-change (fn [elements app-state]
                        (when-not (or (= "down" (gobj/get app-state "cursorButton"))
                                      (gobj/get app-state "draggingElement")
                                      (gobj/get app-state "editingElement")
                                      (gobj/get app-state "editingGroupId")
                                      (gobj/get app-state "editingLinearElement"))
                          (let [elements->clj (js->clj elements {:keywordize-keys true})]
                            (when (and (seq elements->clj)
                                       (not= elements->clj @*elements)) ;; not= requires clj collections
                              (reset! *elements elements->clj)
                              (draw/save-excalidraw!
                               file
                               (serializeAsJSON elements app-state))))))

           :zen-mode-enabled @*zen-mode?
           :view-mode-enabled @*view-mode?
           :grid-mode-enabled @*grid-mode?
           :on-pointer-down #(.. (rum/deref ref) -firstChild focus)
           :initial-data data
           :theme (excalidraw-theme (state/sub :ui/theme))}))]])))

(rum/defcs draw-container < rum/reactive
  {:init (fn [state]
           (let [[option] (:rum/args state)
                 file (:file option)
                 *data (atom nil)
                 *loading? (atom true)]
             (when file
               (draw/load-excalidraw-file
                file
                (fn [data]
                  (let [data (from-json data)]
                    (reset! *data data)
                    (reset! *loading? false)))))
             (assoc state
                    ::data *data
                    ::loading? *loading?)))}
  [state option]
  (let [*data (get state ::data)
        *loading? (get state ::loading?)
        loading? (rum/react *loading?)
        data (rum/react *data)
        db-restoring? (state/sub :db/restoring?)]
    (when (:file option)
      (cond
        db-restoring?
        [:div.ls-center (ui/loading)]

        (false? loading?)
        (draw-inner data option)

        :else
        nil))))

(rum/defc draw < rum/reactive
  [option]
  (let [repo (state/get-current-repo)
        granted? (state/sub [:nfs/user-granted? repo])]
    ;; Web granted
    (when-not (and (config/local-db? repo)
                   (not granted?)
                   (not (util/electron?))
                   (not (mobile-util/native-platform?)))
      (draw-container option))))
