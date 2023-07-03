(ns frontend.components.shortcut2
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [frontend.context.i18n :refer [t]]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [goog.events :as events]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.util :as util]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.modules.shortcut.config :as shortcut-config])
  (:import [goog.events KeyCodes KeyHandler KeyNames]
           [goog.ui KeyboardShortcutHandler]))

(def categories
  (vector :shortcut.category/basics
          :shortcut.category/navigating
          :shortcut.category/block-editing
          :shortcut.category/block-command-editing
          :shortcut.category/block-selection
          :shortcut.category/formatting
          :shortcut.category/toggle
          :shortcut.category/whiteboard
          :shortcut.category/plugins
          :shortcut.category/others))

(defn- to-vector [v]
  (when-not (nil? v)
    (if (sequential? v) (vec v) [v])))

(rum/defc search-control
  [q set-q! refresh-fn]

  [:div.cp__shortcut-page-x-search-control
   [:a.flex.items-center
    {:on-click refresh-fn}
    (ui/icon "refresh")]
   [:span.pr-1
    [:input.form-input.is-small
     {:placeholder "Search"
      :value       (or q "")
      :auto-focus  true
      :on-key-down #(when (= 27 (.-keyCode %))
                      (util/stop %)
                      (set-q! ""))
      :on-change   #(let [v (util/evalue %)]
                      (set-q! v))}]]
   [:a.flex.items-center (ui/icon "keyboard")]
   [:a.flex.items-center (ui/icon "filter")]])

(rum/defc customize-shortcut-dialog-inner
  [k action-name current-binding]
  (let [[keystroke set-keystroke!] (rum/use-state "")
        keypressed? (not= "" keystroke)
        [current-binding set-current-binding!] (rum/use-state (to-vector current-binding))]

    (rum/use-effect!
      (fn []
        (let [key-handler (KeyHandler. js/document)]
          ;; setup
          (shortcut/unlisten-all)
          (events/listen key-handler "key"
                         (fn [^js e]
                           (.preventDefault e)
                           (js/console.log "====>>>" (shortcut/keyname e))
                           (set-keystroke! #(str % (shortcut/keyname e)))))

          ;; teardown
          #(do (shortcut/listen-all)
               (.dispose key-handler))))
      [])

    [:div.cp__shortcut-page-x-record-dialog-inner
     [:div.sm:w-lsm
      [:p.mb-4 "Press any sequence of keys to set the shortcut for the " [:b action-name] " action."]

      [:div.shortcuts-keys-wrap
       {:class (util/classnames [{:keypressed keypressed?}])}

       [:span.keyboard-shortcut.flex.flex-wrap.mr-2.space-x-2
        (for [x current-binding]
          [:code.tracking-wider
           (-> x (string/trim) (string/lower-case) (shortcut-utils/decorate-binding))])]

       ;; add shortcut
       [:div.shortcut-record-control

        ;; keypressed state
        (if keypressed?
          [:<>
           (when-not (string/blank? keystroke)
             (ui/render-keyboard-shortcut keystroke))

           [:a.flex.items-center.active:opacity-90
            {:on-click (fn []
                         ;; TODO: check conflicts
                         (notification/show! (str keystroke))
                         (set-current-binding! (conj current-binding keystroke)))}
            (ui/icon "check" {:size 14})]
           [:a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90
            {:on-click #(set-keystroke! "")}
            (ui/icon "x" {:size 14})]]

          [:code.flex.items-center
           [:small.pr-1 "Press any key to add custom shortcut"] (ui/icon "keyboard" {:size 14})])]]]

     [:div.cancel-save-buttons.text-right.mt-6.flex.justify-between.items-center

      [:a.flex.items-center.space-x-1.text-sm.opacity-70.hover:opacity-100
       "Restore to system default"]

      [:span
       (ui/button "Save" :on-click (fn [] (state/close-modal!)))

       [:a.ml-4
        {:on-click (fn []
                     ;(reset! *keypress (dh/binding-for-storage current-binding))
                     (state/close-modal!))} "Cancel"]]]]))

(defn build-categories-map
  []
  (->> categories
       (map #(vector % (into (sorted-map) (dh/binding-by-category %))))))

(rum/defc shortcut-page-x
  []
  (let [categories-list-map (build-categories-map)
        [ready?, set-ready!] (rum/use-state false)
        [refresh-v, refresh!] (rum/use-state 1)
        [q set-q!] (rum/use-state nil)

        in-query?           (not (string/blank? (util/trim-safe q)))
        matched-list-map    (when in-query?
                              (->> categories-list-map
                                   (map (fn [[c binding-map]]
                                          [c (search/fuzzy-search
                                               binding-map q
                                               :extract-fn
                                               #(let [[id {:keys [cmd]}] %]
                                                  (str (name id) " " (or (:desc cmd) (-> id (shortcut-utils/decorate-namespace) (t))))))]))))
        result-list-map     (or matched-list-map categories-list-map)]

    (rum/use-effect!
      (fn []
        (js/setTimeout #(set-ready! true) 800))
      [])

    [:div.cp__shortcut-page-x
     [:header.relative
      [:h1.text-4xl "Keymap"]
      [:h2.text-xs.pt-2.opacity-70
       (str "Total shortcuts "
            (if ready?
              (apply + (map #(count (second %)) result-list-map))
              " ..."))]

      (search-control q set-q! #(refresh! (inc refresh-v)))]

     (when-not (string/blank? q)
       [:h3.flex.justify-center.font-bold "Query: " q])

     [:article
      (when-not ready?
        [:p.py-8.flex.justify-center (ui/loading "")])

      (when ready?
        [:ul.list-none.m-0.py-3
         (for [[c binding-map] result-list-map
               :let [plugin? (= c :shortcut.category/plugins)]]
           [:<>
            ;; category row
            (when-not in-query?
              [:li.bg-green-600.text-center.text-md.th.text-white
               {:key (str c)}
               (t c)])

            ;; binding row
            (for [[id {:keys [cmd binding user-binding]}] binding-map
                  :let [binding      (to-vector binding)
                        user-binding (to-vector user-binding)
                        label        (cond
                                       (string? (:desc cmd))
                                       [:<>
                                        [:span.pl-1 (:desc cmd)]
                                        [:small [:code.text-xs (some-> (namespace id) (string/replace "plugin." ""))]]]

                                       (not plugin?)
                                       [:<>
                                        [:span.pl-1 (-> id (shortcut-utils/decorate-namespace) (t))]
                                        [:small [:code.text-xs (str id)]]]

                                       :else (str id))
                        disabled?    (false? (first binding))]]
              [:li.flex.items-center.justify-between.text-sm
               {:key (str id)}
               [:span.label-wrap label]
               [:a.action-wrap
                {:class    (util/classnames [{:disabled disabled?}])
                 :on-click (when-not disabled?
                             #(state/set-sub-modal!
                                (fn [] (customize-shortcut-dialog-inner
                                         id label (or user-binding binding)))
                                {:center? true}))}
                (when user-binding
                  [:code.dark:bg-green-800.bg-green-300
                   (str "Custom: " (bean/->js (map #(some-> % (shortcut-utils/decorate-binding)) user-binding)))])

                (when-not user-binding
                  (for [x binding]
                    [:code.tracking-wide
                     {:key (str x)}
                     (dh/binding-for-display id x)]))]])])])]]))
