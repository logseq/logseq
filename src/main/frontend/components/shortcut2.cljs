(ns frontend.components.shortcut2
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [frontend.context.i18n :refer [t]]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [goog.events :as events]
            [promesa.core :as p]
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

(rum/defc pane-controls
  [q set-q! refresh-fn]

  [:div.cp__shortcut-page-x-pane-controls
   [:a.flex.items-center.icon-link
    {:on-click #()}
    (ui/icon "fold")]

   [:a.flex.items-center.icon-link
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

   [:a.flex.items-center.icon-link (ui/icon "keyboard")]
   [:a.flex.items-center.icon-link (ui/icon "filter")]])

(rum/defc shortcut-conflicts-display
  [k conflicts-map]

  [:div.py-2.text-red-500.text-xs
   [:h4 (str k)]
   [:pre (pr-str conflicts-map)]])

(rum/defc customize-shortcut-dialog-inner
  [k action-name binding user-binding {:keys [saved-cb]}]
  (let [[keystroke set-keystroke!] (rum/use-state "")
        [current-binding set-current-binding!] (rum/use-state (or user-binding binding))
        [key-conflicts set-key-conflicts!] (rum/use-state nil)

        handler-id (rum/use-memo #(dh/get-group k))
        dirty? (not= (or user-binding binding) current-binding)
        keypressed? (not= "" keystroke)]

    (rum/use-effect!
      (fn []
        (let [key-handler (KeyHandler. js/document)]
          ;; setup
          (shortcut/unlisten-all)
          (events/listen key-handler "key"
                         (fn [^js e]
                           (.preventDefault e)
                           (set-key-conflicts! nil)
                           (set-keystroke! #(util/trim-safe (str % (shortcut/keyname e))))))

          ;; teardown
          #(do (shortcut/listen-all)
               (.dispose key-handler))))
      [])

    [:div.cp__shortcut-page-x-record-dialog-inner
     {:class (util/classnames [{:keypressed keypressed? :dirty dirty?}])}
     [:div.sm:w-lsm
      [:h1 [:code (str handler-id)]]
      [:p.mb-4 "Customize shortcuts for the " [:b action-name] " action."]

      [:div.shortcuts-keys-wrap
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
                         (let [conflicts-map (dh/get-conflicts-by-keys keystroke handler-id)]
                           (if-not (seq conflicts-map)
                             (do (set-current-binding! (conj current-binding keystroke))
                                 (set-keystroke! ""))

                             ;; show conflicts
                             (set-key-conflicts! conflicts-map))))}
            (ui/icon "check" {:size 14})]
           [:a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90
            {:on-click (fn []
                         (set-keystroke! "")
                         (set-key-conflicts! nil))}
            (ui/icon "x" {:size 14})]]

          [:code.flex.items-center
           [:small.pr-1 "Press any sequence of keys to set a shortcut"] (ui/icon "keyboard" {:size 14})])]]]

     ;; conflicts results
     (when (seq key-conflicts)
       (shortcut-conflicts-display k key-conflicts))

     [:div.action-btns.text-right.mt-6.flex.justify-between.items-center
      ;; restore default
      (when binding
        [:a.flex.items-center.space-x-1.text-sm.opacity-70.hover:opacity-100
         {:on-click #(set-current-binding! binding)}
         "Restore to system default"
         [:code (str binding)]])

      [:span
       (ui/button
         "Save"
         :background (when dirty? "red")
         :disabled (not dirty?)
         :on-click (fn []
                     ;; TODO: check conflicts
                     (let [binding' (if (nil? current-binding) [] current-binding)
                           conflicts (dh/get-conflicts-by-keys binding' handler-id #{k})]
                       (if (seq conflicts)
                         (set-key-conflicts! conflicts)
                         (let [binding' (if (= binding binding') nil binding')]
                           (shortcut/persist-user-shortcut! k binding')
                           (notification/show! "Saved!" :success)
                           (state/close-modal!)
                           (saved-cb))))))

       [:a.reset-btn
        {:on-click (fn [] (set-current-binding! (or user-binding binding)))}
        "Reset"]]]]))

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

        in-query? (not (string/blank? (util/trim-safe q)))
        matched-list-map (when in-query?
                           (->> categories-list-map
                                (map (fn [[c binding-map]]
                                       [c (search/fuzzy-search
                                            binding-map q
                                            :extract-fn
                                            #(let [[id {:keys [cmd]}] %]
                                               (str (name id) " " (or (:desc cmd) (-> id (shortcut-utils/decorate-namespace) (t))))))]))))
        result-list-map (or matched-list-map categories-list-map)
        refresh-list! #(refresh! (inc refresh-v))]

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

      (pane-controls q set-q! refresh-list!)]

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
                  :let [binding (to-vector binding)
                        user-binding (and user-binding (to-vector user-binding))
                        label (cond
                                (string? (:desc cmd))
                                [:<>
                                 [:span.pl-1 (:desc cmd)]
                                 [:small [:code.text-xs (some-> (namespace id) (string/replace "plugin." ""))]]]

                                (not plugin?)
                                [:<>
                                 [:span.pl-1 (-> id (shortcut-utils/decorate-namespace) (t))]
                                 [:small [:code.text-xs (str id)]]]

                                :else (str id))
                        disabled? (or (false? user-binding)
                                      (false? (first binding)))
                        unset? (and (not disabled?)
                                    (= user-binding []))]]
              [:li.flex.items-center.justify-between.text-sm
               {:key (str id)}
               [:span.label-wrap label]

               [:a.action-wrap
                {:class    (util/classnames [{:disabled disabled?}])
                 :on-click (when-not disabled?
                             #(state/set-sub-modal!
                                (fn [] (customize-shortcut-dialog-inner
                                         id label binding user-binding
                                         {:saved-cb (fn [] (-> (p/delay 500) (p/then refresh-list!)))}))
                                {:center? true}))}

                (when (or user-binding (false? user-binding))
                  [:code.dark:bg-green-800.bg-green-300
                   (if unset?
                     "Unset"
                     (str "Custom: "
                          (if disabled? "Disabled" (bean/->js (map #(if (false? %) "Disabled" (shortcut-utils/decorate-binding %)) user-binding)))))])

                (when (and (not disabled?)
                           (not unset?))
                  (for [x binding]
                    [:code.tracking-wide
                     {:key (str x)}
                     (dh/binding-for-display id x)]))]])])])]]))
