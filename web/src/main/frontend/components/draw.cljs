(ns frontend.components.draw
  (:require [rum.core :as rum]
            [goog.object :as gobj]
            [frontend.rum :as r]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.mixins :as mixins]
            [frontend.storage :as storage]
            [frontend.components.svg :as svg]
            [cljs-bean.core :as bean]
            [dommy.core :as d]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.loader :as loader]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.components.widgets :as widgets]
            [promesa.core :as p]))

;; TODO: delete not working yet
(defn loaded? []
  js/window.Excalidraw)

(defonce *loaded? (atom false))

(defonce draw-state :draw-state)

(defn get-draw-state []
  (storage/get draw-state))
(defn set-draw-state! [value]
  (storage/set draw-state value))
(defn get-k
  ([k]
   (get-k k (state/get-current-repo)))
  ([repo k]
   (when repo
     (get-in (get-draw-state) [repo k]))))

(defn set-k
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [state (get-draw-state)]
      (let [new-state (assoc-in state [repo k] v)]
        (set-draw-state! new-state)))))

(defn get-last-file
  ([]
   (get-k :last-file))
  ([repo]
   (get-k repo :last-file)))

(defn get-last-title
  ([]
   (get-k :last-title))
  ([repo]
   (get-k repo :last-title)))

(defn set-last-file!
  [value]
  (set-k :last-file value))
(defn set-last-title!
  [value]
  (set-k :last-title value))

(defn get-last-elements
  []
  (storage/get-json (str (state/get-current-repo) "-" "last-elements")))
(defn get-last-app-state
  []
  (storage/get-json (str (state/get-current-repo) "-" "last-app-state")))

(defn set-last-elements!
  [value]
  (storage/set-json (str (state/get-current-repo) "-" "last-elements") value))
(defn set-last-app-state!
  [value]
  (storage/set-json (str (state/get-current-repo) "-" "last-app-state") value))

(defonce *files (atom nil))
(defonce *current-file (atom nil))
(defonce *current-title (atom ""))
(defonce *file-loading? (atom nil))
(defonce *elements (atom nil))
(defonce *unsaved? (atom false))
(defonce *search-files (atom []))

;; TODO: lazy loading
(defonce *excalidraw (atom nil))

(defn set-excalidraw-component!
  []
  (reset! *excalidraw (r/adapt-class
                       (gobj/get js/window.Excalidraw "default"))))

(defn serialize-as-json
  [elements app-state]
  (when (loaded?)
    (when-let [f (gobj/get js/window.Excalidraw "serializeAsJSON")]
      (f elements app-state))))

;; api restore

(defn from-json
  [text]
  (when-not (string/blank? text)
    (try
      (when-let [data (js/JSON.parse text)]
        (if (not= "excalidraw" (gobj/get data "type"))
          (handler/show-notification!
           (util/format "Could not load this invalid excalidraw file")
           :error)
          {:elements (gobj/get data "elements")
           :app-state (gobj/get data "appState")}))
      (catch js/Error e
        (prn "from json error:")
        (js/console.dir e)
        (handler/show-notification!
         (util/format "Could not load this invalid excalidraw file")
         :error)))))

(defn title->file-name
  [title]
  (when (not (string/blank? title))
    (let [title (string/lower-case (string/replace title " " "-"))]
      (str (date/get-date-time-string-2) "-" title ".excalidraw"))))

(defn get-file-title
  [file]
  (when file
    (let [s (subs file 20)
          title (string/replace s ".excalidraw" "")]
      (string/replace title "-" " "))))

(defn save-excalidraw!
  [state _event file ok-handler]
  (let [title @*current-title]
    (if (string/blank? title)
      (do
        (handler/show-notification!
         "Please specify a title first!"
         :error)
        ;; TODO: focus the title input
        )
      (when-let [elements (get-last-elements)]
        (let [app-state (get-last-app-state)
              [option] (:rum/args state)
              file (util/trim-safe
                    (or
                     file
                     @*current-file
                     (:file option)
                     (title->file-name title)))
              data (serialize-as-json elements app-state)]
          (when file
            (handler/save-excalidraw! file data
                                      (fn [file]
                                        (reset! *files
                                                (distinct (conj @*files file)))
                                        (reset! *current-file file)
                                        (reset! *unsaved? false)
                                        (set-last-file! file)
                                        (when ok-handler (ok-handler file))))))))))

(defn- clear-canvas!
  []
  (when-let [canvas (d/by-id "canvas")]
    (let [context (.getContext canvas "2d")]
      (.clearRect context 0 0 (gobj/get canvas "width") (gobj/get canvas "height"))
      (set! (.-fillStyle context) "#FFF")
      (.fillRect context 0 0 (gobj/get canvas "width") (gobj/get canvas "height")))))

(defn- new-file!
  []
  ;; TODO: save current firstly
  (clear-canvas!)
  (reset! *current-title "")
  (reset! *current-file nil)
  (reset! *elements nil)
  (set-last-elements! nil)
  (set-last-title! nil)
  (set-last-file! nil)
  (set-last-app-state! nil))

(defn- rename-file!
  [file new-title]
  (when-not (string/blank? new-title)
    (let [new-file (title->file-name new-title)]
      (when-not (= (string/trim file) (string/trim new-file))
        (save-excalidraw!
         {} {} new-file
         (fn []
           (set-last-file! new-file)
           (util/p-handle
            (handler/git-remove-file!
             (state/get-current-repo)
             (str config/default-draw-directory "/" file))
            (fn [_]
              (reset! *files (->> (conj @*files new-file)
                                  (remove #(= file %))
                                  distinct
                                  (vec)))
              (reset! *current-file new-file)
              (handler/show-notification!
               "File was renamed successfully!"
               :success))
            (fn [error]
              (println "Rename file failed, reason: ")
              (js/console.dir error)))))))))

(rum/defc draw-title < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (let [old-title @*current-title]
       (mixins/hide-when-esc-or-outside
        state
        :on-hide (fn [state e event]
                   (let [title (and @*current-title (string/trim @*current-title))
                         file @*current-file]
                     (when (or
                            (string/blank? old-title)
                            (not= (string/trim old-title) title))
                       (cond
                         (and file (not (string/blank? title)))
                         (rename-file! file title)

                         (and (not file)
                              (not (string/blank? title))
                              (seq @*elements)) ; new file
                         (save-excalidraw! {} {} nil nil)

                         :else
                         nil))))))
     state))
  []
  (let [current-title (rum/react *current-title)]
    [:input#draw-title.font-medium.w-48.px-2.py-1.ml-2
     {:on-click (fn [e]
                  (util/stop e))
      :placeholder "Untitled"
      :auto-complete "off"
      :on-change (fn [e]
                   (when-let [value (util/evalue e)]
                     (set-last-title! value)
                     (reset! *current-title value)))
      :value (or (and current-title (string/capitalize current-title)) "")}]))

(rum/defc files-search < rum/reactive
  [state]
  [:div#search-wrapper.relative.w-full.text-gray-400.focus-within:text-gray-600
   [:div.absolute.inset-y-0.flex.items-center.pointer-events-none.left-3
    [:svg.h-4.w-4
     {:view-box "0 0 20 20", :fill "currentColor"}
     [:path
      {:d
       "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
       :clip-rule "evenodd",
       :fill-rule "evenodd"}]]]
   [:input.block.w-full.pl-2.sm:text-sm.sm:leading-3.mb-2.mt-2.border-none.outline-none.focus:outline-none
    {:style {:padding-left "2rem"
             :border-radius 0}
     :placeholder "Search"
     :auto-complete "off"
     :on-change (fn [e]
                  (let [value (util/evalue e)
                        files @*files]
                    (reset! *search-files
                            (if (string/blank? value)
                              files
                              (search/fuzzy-search files value :limit 10)))))}]])

(rum/defc files < rum/reactive
  []
  (let [all-files (rum/react *files)
        search-files (rum/react *search-files)
        files (if (seq search-files) search-files all-files)
        _ (prn "files: " files)
        current-file (rum/react *current-file)
        unsaved? (rum/react *unsaved?)]
    [:div.flex-row.flex.items-center
     [:a.ml-2 {:title "New file"
               :on-click new-file!}
      [:div.ToolIcon__icon {:style {:width "2rem"
                                    :height "2rem"
                                    :background "var(--button-gray-1)"}}
       svg/plus]]

     (ui/dropdown-with-links
      (fn [{:keys [toggle-fn]}]
        [:div.ToolIcon__icon.ml-2.cursor {:title "List files"
                                          :on-click toggle-fn
                                          :style {:width "2rem"
                                                  :height "2rem"
                                                  :background "var(--button-gray-1)"}}
         svg/folder])
      (mapv
       (fn [file]
         {:title (get-file-title file)
          :options {:title file
                    :on-click
                    (fn [e]
                      (util/stop e)
                      (set-last-file! file)
                      (reset! *current-file file)
                      (reset! *current-title (get-file-title file))
                      (reset! *search-files []))}})
       files)
      {:modal-class (util/hiccup->class
                     "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg.whitespace-no-wrap.bg-white.w-48.dropdown-overflow-auto")
       :links-header (when (>= (count all-files) 5)
                       (files-search))})
     (let [links (->> [(when @*current-file
                         {:title "Delete"
                          :options {:style {:color "#db1111"}
                                    :on-click (fn [e]
                                                (util/stop e)
                                                (when-let [current-file @*current-file]
                                                  (p/let [_ (handler/git-remove-file! (state/get-current-repo)
                                                                                      (str config/default-draw-directory "/" current-file))]
                                                    (reset! *files (remove #(= current-file %) @*files))
                                                    (new-file!))))}})]
                      (remove nil?))]
       (when (seq links)
         (ui/dropdown-with-links
          (fn [{:keys [toggle-fn]}]
            [:div.ToolIcon__icon.ml-2.cursor {:title "More options"
                                              :on-click toggle-fn
                                              :style {:width "2rem"
                                                      :height "2rem"
                                                      :background "var(--button-gray-1)"}}
             svg/vertical-dots])
          links
          {:modal-class (util/hiccup->class
                         "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg.whitespace-no-wrap.bg-white.w-48.dropdown-overflow-auto")})))

     (draw-title)]))

(defn- set-canvas-actions-style!
  [state]
  (when-let [section (first (d/by-tag "section"))]
    (when (= "canvasActions-title" (d/attr section "aria-labelledby"))
      (d/set-style! section "margin-top" "48px")))
  state)

(rum/defcs draw-inner < rum/reactive
  (mixins/keyboard-mixin "Ctrl+s" (fn [state e]
                                    (save-excalidraw! state e nil nil)))
  (mixins/keyboard-mixin "Alt+z" set-canvas-actions-style!)
  {:init (fn [state]
           (reset! *elements nil)
           (let [[option] (:rum/args state)
                 file (or @*current-file
                          (:file option))]
             (do
               (reset! *current-title (get-file-title file))
               (set-last-file! file))
             (cond
               file
               (do
                 (reset! *file-loading? true)
                 (handler/load-excalidraw-file
                  file
                  (fn [data]
                    (let [{:keys [elements app-state]} (from-json data)]
                      (reset! *elements elements)
                      (reset! *file-loading? false)))))

               :else
               (when-let [elements (get-last-elements)]
                 ;; TODO: keep this for history undo
                 (reset! *elements (remove #(gobj/get % "isDeleted") elements))))
             (assoc state
                    ::layout (atom [js/window.innerWidth js/window.innerHeight]))))
   :did-mount set-canvas-actions-style!
   :did-update set-canvas-actions-style!}
  [state option]
  (let [current-repo (state/sub :git/current-repo)
        elements (rum/react *elements)
        loading? (rum/react *file-loading?)
        file (rum/react *current-file)
        layout (get state ::layout)
        [width height] (rum/react layout)
        options (bean/->js {:zenModeEnabled true
                            :viewBackgroundColor "#FFF"})
        excalidraw-component @*excalidraw]
    [:div.draw {:style {:background "#FFF"}}
     (when (or (and file elements)
               (nil? file))
       (excalidraw-component
        (cond->
            {:width (get option :width width)
             :height (get option :height height)
             :on-resize (fn []
                          (reset! layout [js/window.innerWidth js/window.innerHeight]))

             :on-change (or (:on-change option)
                            (fn [elements state]
                              (set-last-elements! elements)
                              (set-last-app-state! state)
                              (reset! *elements elements)))
             :options options
             :user (bean/->js {:name (or (:user-name option)
                                         (:name (state/get-me))
                                         (util/unique-id))})
             :on-username-change (fn [])}
          (seq elements)
          (assoc :initial-data elements))))
     [:div.absolute.top-4.left-4.hidden.md:block
      [:div.flex.flex-row.items-center
       [:a.mr-3 {:on-click (fn [] (.back (gobj/get js/window "history")))
                 :title "Back to logseq"}
        (svg/logo)]
       (files)
       (when loading?
         [:span.lds-dual-ring.ml-3])]]
     (ui/notification)

     (when current-repo
       [:div.absolute.top-4.right-4.hidden.md:block
        [:div.flex.flex-row.items-center
         (widgets/sync-status current-repo)
         (widgets/repos true
                        (fn [repo]
                          (reset! *current-file (get-last-file repo))))]])]))

(rum/defc draw < rum/reactive
  {:init (fn [state]
           (let [repo (storage/get :git/current-repo)]
             (when-let [last-title (get-last-title repo)]
               (reset! *current-title last-title))
             (when-let [last-file (get-last-file repo)]
               (reset! *current-file last-file)
               (reset! *current-title (get-file-title last-file))))

           (if (loaded?)
             (set-excalidraw-component!)
             (do
               (loader/load
                (config/asset-uri "/static/js/excalidraw.min.js")
                (fn []
                  (reset! *loaded? true)
                  (set-excalidraw-component!)))))

           (handler/get-all-excalidraw-files
            (fn [files]
              (prn "files: " files)
              (reset! *files (distinct files))))
           state)}
  [option]
  (let [loaded? (or (loaded?)
                    (rum/react *loaded?))
        current-repo (state/sub :git/current-repo)]
    (if (and loaded? current-repo)
      (let [current-file (rum/react *current-file)
            current-file (or current-file
                             (get-last-file current-repo))]
        (let [key (str current-repo "-"
                       (or (and current-file (str "draw-" current-file))
                           "draw-with-no-file"))]
          (rum/with-key (draw-inner option) key)))
      [:div.center
       [:span.lds-dual-ring.ml-3]])))
