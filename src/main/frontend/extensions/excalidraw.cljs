(ns frontend.extensions.excalidraw
  (:require ["@excalidraw/excalidraw" :as Excalidraw]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.draw :as draw]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def excalidraw (r/adapt-class (gobj/get Excalidraw "default")))

(defn from-json
  [text]
  (when-not (string/blank? text)
    (try
      (js/JSON.parse text)
      (catch js/Error e
        (println "from json error:")
        (js/console.dir e)
        (notification/show!
         (util/format "Could not load this invalid excalidraw file")
         :error)))))

(defonce *bounding-width (atom nil))
(defn- get-bounding-width
  [ref]
  (when ref
    (when-let [current (gobj/get ref "current")]
      (-> current
         (.getBoundingClientRect)
         (gobj/get "width")))))

(defn- update-draw-content-width
  [state]
  (let [el ^js (rum/dom-node state)
        el (and el (.querySelector el ".draw-wrap"))
        width (and el (.-clientWidth el))]
    (reset! (::draw-width state) width)
    state))

(rum/defcs draw-inner < rum/reactive
  (rum/local 800 ::draw-width)
  (rum/local true ::zen-mode?)
  (rum/local false ::view-mode?)
  (rum/local nil ::elements)
  {:did-mount update-draw-content-width}
  {:did-update update-draw-content-width}
  [state data option]
  (let [current-repo (state/sub :git/current-repo)
        bounding-width (rum/react *bounding-width)
        *draw-width (get state ::draw-width)
        *zen-mode? (get state ::zen-mode?)
        *view-mode? (get state ::view-mode?)
        wide-mode? (state/sub :ui/wide-mode?)
        *elements (get state ::elements)
        file (:file option)]
    (when data
      [:div.overflow-hidden {:on-mouse-down (fn [e] (util/stop e))}
       [:div.my-1 {:style {:font-size 10}}
        [:a.mr-2 {:on-click ui-handler/toggle-wide-mode!}
         (util/format "Wide Mode (%s)" (if wide-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *zen-mode? not)}
         (util/format "Zen Mode (%s)" (if @*zen-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *view-mode? not)}
         (util/format "View Mode (%s)" (if @*view-mode? "ON" "OFF"))]]
       [:div.draw-wrap
        {:on-mouse-down (fn [e]
                          (util/stop e)
                          (state/set-block-component-editing-mode! true))
         :on-blur #(state/set-block-component-editing-mode! false)}
        (excalidraw
         (merge
          {:on-change (fn [elements state]
                        (let [elements->clj (bean/->clj elements)]
                          (when (and (seq elements->clj)
                                     (not= elements @*elements))
                            (let [state (bean/->clj state)]
                              (draw/save-excalidraw!
                               file
                               (-> {:type "excalidraw"
                                    :version 2
                                    :source config/website
                                    :elements elements
                                    :appState (select-keys state [:gridSize :viewBackgroundColor])}
                                   bean/->js
                                   (js/JSON.stringify)))
                              (reset! *elements elements)))))
           :zen-mode-enabled @*zen-mode?
           :view-mode-enabled @*view-mode?
           :grid-mode-enabled false
           :initial-data data
           :width  @*draw-width}
          (if wide-mode?
            {:height 650}
            {:height 500})))]])))

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
        [:div.ls-center
         (ui/loading "Loading")]

        (false? loading?)
        (draw-inner data option)

        :else                           ; loading
        nil))))

(rum/defc draw < rum/reactive
  [option]
  (let [repo (state/get-current-repo)
        granted? (state/sub [:nfs/user-granted? repo])]
    ;; Web granted
    (when-not (and (config/local-db? repo) (not granted?) (not (util/electron?)))
      (draw-container option))))
