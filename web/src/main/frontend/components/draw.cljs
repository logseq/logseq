(ns frontend.components.draw
  (:require [rum.core :as rum]
            [goog.object :as gobj]
            ["excalidraw" :as Excalidraw]
            [frontend.rum :as r]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [frontend.storage :as storage]
            [frontend.components.svg :as svg]
            [cljs-bean.core :as bean]
            [dommy.core :as d]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.handler :as handler]
            [frontend.ui :as ui]))

(defonce draw-title-key :draw/latest-title)
(defonce draw-data-key :draw/latest-data)

(defonce *files (atom nil))
(defonce *current-file (atom nil))
(defonce *current-title (atom (storage/get draw-title-key)))
(defonce *file-loading? (atom nil))
(defonce *data (atom nil))

;; TODO: lazy loading
(defonce excalidraw (r/adapt-class (gobj/get Excalidraw "default")))

(defn save-excalidraw!
  [state event]
  (when-let [data (storage/get-json draw-data-key)]
    (let [[option] (:rum/args state)
          file (get option :file
                    (let [title (storage/get draw-title-key)
                          title (if (not (string/blank? title))
                                  (string/lower-case (string/replace title " " "-"))
                                  "untitled")]
                      (str "excalidraw-" (date/get-date-time-string-2) "-" title "-" (util/rand-str 4) ".json")))]
      (handler/save-excalidraw! file data))))

(defn- clear-canvas!
  []
  (when-let [canvas (d/by-id "canvas")]
    (let [context (.getContext canvas "2d")]
      (.clearRect context 0 0 (gobj/get canvas "width") (gobj/get canvas "height"))
      (set! (.-fillStyle context) "#FFF")
      (.fillRect context 0 0 (gobj/get canvas "width") (gobj/get canvas "height")))))

(rum/defc files < rum/reactive
  {:init (fn [state]
           (handler/get-all-excalidraw-files
            (fn [files]
              (reset! *files files)))
           state)}
  []
  (let [files (rum/react *files)
        current-file (rum/react *current-file)]
    (when (seq files)
      (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:a#file-switch.mr-3 {:on-click toggle-fn}
          [:span.text-sm "Change file"]
          [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]])
       (mapv
        (fn [file]
          {:title (-> file
                      (string/replace-first "excalidraw-" ""))
           :options {:on-click
                     (fn []
                       (reset! *current-file file)
                       (reset! *current-title file))}})
        files)
       (util/hiccup->class
        "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg.whitespace-no-wrap")))))

;; TODO: how to prevent default save action on excalidraw?
(rum/defcs draw-inner < rum/reactive
  (mixins/keyboard-mixin "Ctrl+s" save-excalidraw!)
  {:init (fn [state]
           (let [[option] (:rum/args state)
                 file (or @*current-file (:file option))]
             (when file
               (reset! *current-title file))
             (if file
               (do
                 (reset! *file-loading? true)
                 (handler/load-excalidraw-file
                  file
                  (fn [data]
                    (reset! *data (js/JSON.parse data))
                    (reset! *file-loading? false))))
               (when-let [data (storage/get-json draw-data-key)]
                 ;; TODO: keep this for history undo
                 (reset! *data (remove #(gobj/get % "isDeleted") data))))
             (assoc state
                    ::layout (atom [js/window.innerWidth js/window.innerHeight]))))
   :did-mount (fn [state]
                (when-let [section (first (d/by-tag "section"))]
                  (when (= "canvasActions-title" (d/attr section "aria-labelledby"))
                    (d/set-style! section "margin-top" "48px")))
                state)
   :will-unmount (fn [state]
                   (reset! *data nil)
                   (clear-canvas!)
                   state)}
  [state option]
  (let [data (rum/react *data)
        loading? (rum/react *file-loading?)
        current-title (rum/react *current-title)
        layout (get state ::layout)
        [width height] (rum/react layout)
        options (bean/->js {:zenModeEnabled true
                            :viewBackgroundColor "#FFF"})]
    [:div.draw.relative
     (excalidraw
      (cond->
          {:width (get option :width width)
           :height (get option :height width)
           :on-resize (fn []
                        (reset! layout [js/window.innerWidth js/window.innerHeight]))

           :on-change (get option :on-change
                           (fn [elements _state]
                             (storage/set-json draw-data-key elements)))
           :options options
           :user (bean/->js {:name (get option :user-name (util/unique-id))})
           :on-username-change (fn []
                                 (prn "username changed"))}
        data
        (assoc :initial-data data)))
     [:div.absolute.top-4.left-4.hidden.md:block
      [:div.flex.flex-row.items-center
       [:a.mr-3 {:on-click (fn [] (.back (gobj/get js/window "history")))
                 :title "Back to logseq"}
        (svg/logo)]

       (files)

       [:input#draw-title.focus:outline-none.ml-1.font-medium
        {:style {:border "none"
                 :max-width 300}
         :placeholder "Untitled"
         :auto-complete "off"
         :on-change (fn [e]
                      (when-let [value (util/evalue e)]
                        (storage/set draw-title-key value)
                        (reset! *current-title value)))
         :value (or current-title "")}]

       (when loading?
         [:span.lds-dual-ring.ml-3])]]]))

(rum/defc draw < rum/reactive
  [option]
  (let [current-file (rum/react *current-file)
        key (or (and current-file (str "draw-" current-file))
                "draw-with-no-file")]
    (rum/with-key (draw-inner option) key)))
