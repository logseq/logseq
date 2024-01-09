(ns frontend.components.shortcut
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [frontend.context.i18n :refer [t]]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [frontend.rum :as r]
            [goog.events :as events]
            [promesa.core :as p]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.util :as util]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.modules.shortcut.config :as shortcut-config]
            [logseq.shui.core :as shui])
  (:import [goog.events KeyHandler]))

(defonce categories
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

(defonce *refresh-sentry (atom 0))
(defn refresh-shortcuts-list! [] (reset! *refresh-sentry (inc @*refresh-sentry)))
(defonce *global-listener-setup? (atom false))
(defonce *customize-modal-life-sentry (atom 0))

(defn- to-vector [v]
  (when-not (nil? v)
    (if (sequential? v) (vec v) [v])))

(declare customize-shortcut-dialog-inner)

(rum/defc keyboard-filter-record-inner
  [keystroke set-keystroke! close-fn]

  (let [keypressed? (not= "" keystroke)]

    (rum/use-effect!
      (fn []
        (let [key-handler (KeyHandler. js/document)]
          ;; setup
          (util/profile
            "[shortcuts] unlisten*"
            (shortcut/unlisten-all! true))
          (events/listen key-handler "key"
                         (fn [^js e]
                           (.preventDefault e)
                           (set-keystroke! #(util/trim-safe (str % (shortcut/keyname e))))))

          ;; teardown
          #(do
             (util/profile
               "[shortcuts] listen*"
               (shortcut/listen-all!))
             (.dispose key-handler))))
      [])

    [:div.keyboard-filter-record
     [:h2
      [:strong (t :keymap/keystroke-filter)]
      [:span.flex.space-x-2
       (when keypressed?
         [:a.flex.items-center
          {:on-click #(set-keystroke! "")} (ui/icon "zoom-reset" {:size 12})])
       [:a.flex.items-center
        {:on-click #(do (close-fn) (set-keystroke! ""))} (ui/icon "x" {:size 12})]]]
     [:div.wrap.p-2
      (if-not keypressed?
        [:small (t :keymap/keystroke-record-desc)]
        (when-not (string/blank? keystroke)
          (ui/render-keyboard-shortcut [keystroke])))]]))

(rum/defc pane-controls
  [q set-q! filters set-filters! keystroke set-keystroke! toggle-categories-fn]
  (let [*search-ref (rum/use-ref nil)]
    [:div.cp__shortcut-page-x-pane-controls
     [:a.flex.items-center.icon-link
      {:on-click toggle-categories-fn
       :title "Toggle categories pane"}
      (ui/icon "fold")]

     [:a.flex.items-center.icon-link
      {:on-click refresh-shortcuts-list!
       :title "Refresh all"}
      (ui/icon "refresh")]

     [:span.search-input-wrap
      [:input.form-input.is-small
       {:placeholder (t :keymap/search)
        :ref         *search-ref
        :value       (or q "")
        :auto-focus  true
        :on-key-down #(when (= 27 (.-keyCode %))
                        (util/stop %)
                        (if (string/blank? q)
                          (some-> (rum/deref *search-ref) (.blur))
                          (set-q! "")))
        :on-change   #(let [v (util/evalue %)]
                        (set-q! v))}]

      (when-not (string/blank? q)
        [:a.x
         {:on-click (fn []
                      (set-q! "")
                      (js/setTimeout #(some-> (rum/deref *search-ref) (.focus)) 50))}
         (ui/icon "x" {:size 14})])]

     ;; keyboard filter
     (ui/dropdown
       (fn [{:keys [toggle-fn]}]
         [:a.flex.items-center.icon-link
          {:on-click toggle-fn} (ui/icon "keyboard")

          (when-not (string/blank? keystroke)
            (ui/point "bg-red-600.absolute" 4 {:style {:right -2 :top -2}}))])
       (fn [{:keys [close-fn]}]
         (keyboard-filter-record-inner keystroke set-keystroke! close-fn))
       {:outside?      true
        :trigger-class "keyboard-filter"})

     ;; other filter
     (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:a.flex.items-center.icon-link.relative
          {:on-click toggle-fn}
          (ui/icon "filter")

          (when (seq filters)
            (ui/point "bg-red-600.absolute" 4 {:style {:right -2 :top -2}}))])

       (for [k [:All :Disabled :Unset :Custom]
             :let [all? (= k :All)
                   checked? (or (contains? filters k) (and all? (nil? (seq filters))))]]

         {:title   (if all? (t :keymap/all) (t (keyword :keymap (string/lower-case (name k)))))
          :icon    (ui/icon (if checked? "checkbox" "square"))
          :options {:on-click #(set-filters! (if all? #{} (let [f (if checked? disj conj)] (f filters k))))}})

       nil)]))

(rum/defc shortcut-desc-label
  [id binding-map]
  (when-let [id' (and id binding-map (str id))]
    (let [plugin? (string/starts-with? id' ":plugin.")
          id' (if plugin? (some-> id' (string/replace "plugin." "")) id')
          plugin-id (when plugin? (namespace id))]
      [:span {:title (str id' "#" (some-> (:handler-id binding-map) (name)))}
       [:span.px-1 (dh/get-shortcut-desc (assoc binding-map :id id))]
       (when plugin? [:code plugin-id])])))

(defn- open-customize-shortcut-dialog!
  [id]
  (when-let [{:keys [binding user-binding] :as m} (dh/shortcut-item id)]
    (let [binding (to-vector binding)
          user-binding (and user-binding (to-vector user-binding))
          modal-id (str :customize-shortcut id)
          label (shortcut-desc-label id m)
          args [id label binding user-binding
                {:saved-cb (fn [] (-> (p/delay 500) (p/then refresh-shortcuts-list!)))
                 :modal-id modal-id}]]
      (state/set-sub-modal!
        (fn [] (apply customize-shortcut-dialog-inner args))
        {:center? true
         :id      modal-id
         :payload args}))))

(rum/defc shortcut-conflicts-display
  [_k conflicts-map]

  [:div.cp__shortcut-conflicts-list-wrap
   (for [[g ks] conflicts-map]
     [:section.relative
      [:h2 (ui/icon "alert-triangle" {:size 15})
       [:span (t :keymap/conflicts-for-label)]
       [:code (shortcut-utils/decorate-binding g)]]
      [:ul
       (for [v (vals ks)
             :let [k (first v)
                   vs (second v)]]
         (for [[id' handler-id] vs
               :let [m (dh/shortcut-item id')]
               :when (not (nil? m))]
           [:li
            {:key (str id')}
            [:a.select-none.hover:underline
             {:on-click #(open-customize-shortcut-dialog! id')
              :title (str handler-id)}
             [:code.inline-block.mr-1.text-xs
              (shortcut-utils/decorate-binding k)]
             [:span
              (dh/get-shortcut-desc m)
              (ui/icon "external-link" {:size 18})]
             [:code [:small (str id')]]]]))]])])

(rum/defc ^:large-vars/cleanup-todo customize-shortcut-dialog-inner
  [k action-name binding user-binding {:keys [saved-cb modal-id]}]
  (let [*ref-el (rum/use-ref nil)
        [modal-life _] (r/use-atom *customize-modal-life-sentry)
        [keystroke set-keystroke!] (rum/use-state "")
        [current-binding set-current-binding!] (rum/use-state (or user-binding binding))
        [key-conflicts set-key-conflicts!] (rum/use-state nil)

        handler-id (rum/use-memo #(dh/get-group k))
        dirty? (not= (or user-binding binding) current-binding)
        keypressed? (not= "" keystroke)

        save-keystroke-fn!
        (fn []
          ;; parse current binding conflicts
          (if-let [current-conflicts (seq (dh/parse-conflicts-from-binding current-binding keystroke))]
            (notification/show!
             (str "Shortcut conflicts from existing binding: "
                  (pr-str (some->> current-conflicts (map #(shortcut-utils/decorate-binding %)))))
             :error true :shortcut-conflicts/warning 5000)

            ;; get conflicts from the existed bindings map
            (let [conflicts-map (dh/get-conflicts-by-keys keystroke handler-id)]
              (if-not (seq conflicts-map)
                (do (set-current-binding! (conj current-binding keystroke))
                    (set-keystroke! "")
                    (set-key-conflicts! nil))

                ;; show conflicts
                (set-key-conflicts! conflicts-map)))))]

    (rum/use-effect!
     (fn []
       (let [mid (state/sub :modal/id)
             mid' (some-> (state/sub :modal/subsets) (last) (:modal/id))
             el (rum/deref *ref-el)]
         (when (or (and (not mid') (= mid modal-id))
                   (= mid' modal-id))
           (some-> el (.focus))
           (js/setTimeout
            #(some-> (.querySelector el ".shortcut-record-control a.submit")
                     (.click)) 200))))
     [modal-life])

    (rum/use-effect!
     (fn []
       (let [^js el (rum/deref *ref-el)
             key-handler (KeyHandler. el)

             teardown-global!
             (when-not @*global-listener-setup?
               (shortcut/unlisten-all! true)
               (reset! *global-listener-setup? true)
               (fn []
                 (shortcut/listen-all!)
                 (reset! *global-listener-setup? false)))]

          ;; setup
         (events/listen key-handler "key"
                        (fn [^js e]
                          (.preventDefault e)
                          (set-key-conflicts! nil)
                          (set-keystroke! #(util/trim-safe (str % (shortcut/keyname e))))))

          ;; active
         (.focus el)

          ;; teardown
         #(do (some-> teardown-global! (apply nil))
              (.dispose key-handler)
              (swap! *customize-modal-life-sentry inc))))
     [])

    [:div.cp__shortcut-page-x-record-dialog-inner
     {:class     (util/classnames [{:keypressed keypressed? :dirty dirty?}])
      :tab-index -1
      :ref       *ref-el}
     [:div.sm:w-lsm
      [:h1.text-2xl.pb-2
       (t :keymap/customize-for-label)]

      [:p.mb-4.text-md [:b action-name]]

      [:div.shortcuts-keys-wrap
       [:span.keyboard-shortcut.flex.flex-wrap.mr-2.space-x-2
        (for [x current-binding
              :when (string? x)]
          [:code.tracking-wider
           (-> x (string/trim) (string/lower-case) (shortcut-utils/decorate-binding))
           [:a.x {:on-click (fn [] (set-current-binding!
                                    (->> current-binding (remove #(= x %)) (into []))))}
            (ui/icon "x" {:size 12})]])]

       ;; add shortcut
       [:div.shortcut-record-control
        ;; keypressed state
        (if keypressed?
          [:<>
           (when-not (string/blank? keystroke)
             (ui/render-keyboard-shortcut [keystroke]))

           [:a.flex.items-center.active:opacity-90.submit
            {:on-click save-keystroke-fn!}
            (ui/icon "check" {:size 14})]
           [:a.flex.items-center.text-red-600.hover:text-red-700.active:opacity-90.cancel
            {:on-click (fn []
                         (set-keystroke! "")
                         (set-key-conflicts! nil))}
            (ui/icon "x" {:size 14})]]

          [:code.flex.items-center
           [:small.pr-1 (t :keymap/keystroke-record-setup-label)] (ui/icon "keyboard" {:size 14})])]]]

     ;; conflicts results
     (when (seq key-conflicts)
       (shortcut-conflicts-display k key-conflicts))

     [:div.action-btns.text-right.mt-6.flex.justify-between.items-center
      ;; restore default
      (if (and dirty? (or user-binding binding))
        [:a.flex.items-center.space-x-1.text-sm.fade-link
         {:on-click #(set-current-binding! (or user-binding binding))}
         (t :keymap/restore-to-default)
         (for [it (some->> (or binding user-binding) (map #(some->> % (dh/mod-key) (shortcut-utils/decorate-binding))))]
           [:span.keyboard-shortcut.ml-1 [:code it]])]
        [:div])

      [:div.flex.flex-row.items-center.gap-2
       (ui/button
        (t :save)
        :disabled (not dirty?)
        :on-click (fn []
                     ;; TODO: check conflicts for the single same leader key
                    (let [binding' (if (nil? current-binding) [] current-binding)
                          conflicts (dh/get-conflicts-by-keys binding' handler-id {:exclude-ids #{k}})]
                      (if (seq conflicts)
                        (set-key-conflicts! conflicts)
                        (let [binding' (if (= binding binding') nil binding')]
                          (shortcut/persist-user-shortcut! k binding')
                           ;(notification/show! "Saved!" :success)
                          (state/close-modal!)
                          (saved-cb))))))]]]))

(defn build-categories-map
  []
  (->> categories
       (map #(vector % (into (sorted-map) (dh/binding-by-category %))))))

(rum/defc ^:large-vars/cleanup-todo shortcut-keymap-x
  []
  (let [_ (r/use-atom shortcut-config/*category)
        _ (r/use-atom *refresh-sentry)
        [ready?, set-ready!] (rum/use-state false)
        [filters, set-filters!] (rum/use-state #{})
        [keystroke, set-keystroke!] (rum/use-state "")
        [q set-q!] (rum/use-state nil)

        categories-list-map (build-categories-map)
        all-categories (into #{} (map first categories-list-map))
        in-filters? (boolean (seq filters))
        in-query? (not (string/blank? (util/trim-safe q)))
        in-keystroke? (not (string/blank? keystroke))

        [folded-categories set-folded-categories!] (rum/use-state #{})

        matched-list-map
        (when (and in-query? (not in-keystroke?))
          (->> categories-list-map
               (map (fn [[c binding-map]]
                      [c (search/fuzzy-search
                           binding-map q
                           :extract-fn
                           #(let [[id m] %]
                              (str (name id) " " (dh/get-shortcut-desc (assoc m :id id)))))]))))

        result-list-map (or matched-list-map categories-list-map)
        toggle-categories! #(if (= folded-categories all-categories)
                              (set-folded-categories! #{})
                              (set-folded-categories! all-categories))]

    (rum/use-effect!
      (fn []
        (js/setTimeout #(set-ready! true) 100))
      [])

    [:div.cp__shortcut-page-x
     [:header.relative
      [:h2.text-xs.opacity-70
       (str (t :keymap/total)
            " "
            (if ready?
              (apply + (map #(count (second %)) result-list-map))
              " ..."))]

      (pane-controls q set-q! filters set-filters! keystroke set-keystroke! toggle-categories!)]

     [:article
      (when-not ready?
        [:p.py-8.flex.justify-center (ui/loading "")])

      (when ready?
        [:ul.list-none.m-0.py-3
         (for [[c binding-map] result-list-map
               :let [folded? (contains? folded-categories c)]]
           [:<>
            ;; category row
            (when (and (not in-query?)
                       (not in-filters?)
                       (not in-keystroke?))
              [:li.flex.justify-between.th
               {:key      (str c)
                :on-click #(let [f (if folded? disj conj)]
                             (set-folded-categories! (f folded-categories c)))}
               [:strong.font-semibold (t c)]
               [:i.flex.items-center
                (ui/icon (if folded? "chevron-left" "chevron-down"))]])

            ;; binding row
            (when (or in-query? in-filters? (not folded?))
              (for [[id {:keys [binding user-binding] :as m}] binding-map
                    :let [binding (to-vector binding)
                          user-binding (and user-binding (to-vector user-binding))
                          label (shortcut-desc-label id m)
                          custom? (not (nil? user-binding))
                          disabled? (or (false? user-binding)
                                        (false? (first binding)))
                          unset? (and (not disabled?)
                                      (or (= user-binding [])
                                          (and (= binding [])
                                               (nil? user-binding))))]]

                (when (or (nil? (seq filters))
                          (when (contains? filters :Custom) custom?)
                          (when (contains? filters :Disabled) disabled?)
                          (when (contains? filters :Unset) unset?))

                  ;; keystrokes filter
                  (when (or (not in-keystroke?)
                            (and (not disabled?)
                                 (not unset?)
                                 (let [binding' (or user-binding binding)
                                       keystroke' (some-> (shortcut-utils/safe-parse-string-binding keystroke) (bean/->clj))]
                                   (when (sequential? binding')
                                     (some #(when-let [s (some-> % (dh/mod-key) (shortcut-utils/safe-parse-string-binding) (bean/->clj))]
                                              (or (= s keystroke')
                                                  (and (sequential? s) (sequential? keystroke')
                                                       (apply = (map first [s keystroke']))))) binding')))))

                    [:li.flex.items-center.justify-between.text-sm
                     {:key (str id)}
                     [:span.label-wrap label]

                     [:a.action-wrap
                      {:class    (util/classnames [{:disabled disabled?}])
                       :on-click (when (and id (not disabled?))
                                   #(open-customize-shortcut-dialog! id))}

                      (cond
                        (or unset? user-binding (false? user-binding))
                        [:code
                         (if unset?
                           (t :keymap/unset)
                           (str (t :keymap/custom) ": "
                                (if disabled?
                                  (t :keymap/disabled)
                                  (bean/->js
                                    (map #(if (false? %)
                                            (t :keymap/disabled)
                                            (shortcut-utils/decorate-binding %)) user-binding)))))]

                        (not unset?)
                        [:code.flex.items-center.bg-transparent
                         (shui/shortcut
                           (string/join " | " (map #(dh/binding-for-display id %) binding))
                           {:size :md :interactive? true})])]]))))])])]]))
