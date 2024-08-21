(ns frontend.components.property-v2
  (:require [frontend.components.icon :as icon-component]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.db :as db]
            [frontend.handler.route :as route-handler]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [logseq.shui.popup.core :as shui-popup]
            [promesa.core :as p]
            [goog.dom :as gdom]
            [rum.core :as rum]))

(rum/defc name-edit-pane
  [property]
  (let [title (:block/title property)
        icon (:logseq.property/icon property)
        *input-ref (rum/use-ref nil)]

    (rum/use-effect!
      (fn []
        (js/console.log "==>>>> name editor SET-UP!", property)
        #(js/console.log "==>>>> name editor BYE!"))
      [])

    [:div.ls-property-name-edit-pane
     [:div.flex.items-center.input-wrap
      (icon-component/icon-picker icon {:on-chosen (fn [_e icon]
                                                     (db-property-handler/upsert-property!
                                                       (:db/ident property)
                                                       (:block/schema property)
                                                       {:properties {:logseq.property/icon icon}}))
                                        :popup-opts {:align "start"}})

      (shui/input {:ref *input-ref :size "sm" :default-value title})]
     [:div.pt-2 (shui/textarea {:placeholder "description"})]
     [:div.pt-2.flex.justify-end
      (shui/button {:size "sm" :disabled true
                    :variant :secondary} "Save")]]))

(defn restore-root-highlight-item!
  [id]
  (js/setTimeout
    #(some-> (gdom/getElement id) (.focus)) 32))

(rum/defc dropdown-editor-menuitem
  [{:keys [id icon title desc submenu-content item-props sub-content-props disabled? toggle-checked? on-toggle-checked-change]}]

  (let [[sub-open? set-sub-open!] (rum/use-state false)
        toggle? (boolean? toggle-checked?)
        id1 (str (or id icon (random-uuid)))
        id2 (str "d2-" id1)
        or-close-menu-sub! (fn []
                             (when-not (shui-popup/get-popup :ls-icon-picker)
                               (set-sub-open! false)
                               (restore-root-highlight-item! id1)))
        wrap-menuitem (if submenu-content
                        #(shui/dropdown-menu-sub
                           {:open sub-open?
                            :on-open-change (fn [v] (if v (set-sub-open! true) (or-close-menu-sub!)))}
                           (shui/dropdown-menu-sub-trigger (merge {:id id1} item-props) %)
                           (shui/dropdown-menu-portal
                             (shui/dropdown-menu-sub-content
                               (merge {:hideWhenDetached true
                                       :onEscapeKeyDown or-close-menu-sub!} sub-content-props)
                               (if (fn? submenu-content)
                                 (submenu-content {:set-sub-open! set-sub-open! :id id1}) submenu-content))))
                        #(shui/dropdown-menu-item
                           (merge {:on-select (fn []
                                                (when toggle?
                                                  (some-> (gdom/getElement id2) (.click))))
                                   :id id1}
                             item-props) %))]
    (wrap-menuitem
      [:div.inner-wrap
       {:class (util/classnames [{:disabled disabled?}])}
       [:strong
        (some-> icon (name) (shui/tabler-icon))
        [:span title]]
       (if (fn? desc) (desc)
         (if (boolean? toggle-checked?)
           [:span.scale-90.flex.items-center
            (shui/switch {:id id2 :size "sm" :default-checked toggle-checked?
                          :disabled disabled? :on-click #(util/stop-propagation %)
                          :on-checked-change (or on-toggle-checked-change identity)})]
           [:small [:span desc]
            (when disabled? (shui/tabler-icon "forbid-2" {:size 15}))]))])))

(rum/defc choices-sub-pane
  [_property]

  [:div.ls-property-dropdown-editor.ls-property-choices-sub-pane
   [:ul.choices-list
    [:li
     (shui/tabler-icon "grip-vertical" {:size 14})
     (shui/button {:size "sm" :variant :outline} "🔥")
     [:strong "fireworks"]
     [:a.del (shui/tabler-icon "x" {:size 14})]]

    [:li
     (shui/tabler-icon "grip-vertical" {:size 14})
     (shui/button {:size "sm" :variant :outline} "🍄")
     [:strong "mushroom"]
     [:a.del (shui/tabler-icon "x" {:size 14})]]
    ]

   ;; add choice
   (dropdown-editor-menuitem
     {:icon :plus :title "Add choice"
      :item-props {:on-select (fn [] (shui/toast! "+ add choice" :success))}})])

(rum/defc ui-position-sub-pane
  [_property {:keys [id set-sub-open!]}]
  (let [handle-select! (fn [^js e]
                         (shui/toast! (.-innerText (.-target e)))
                         (set-sub-open! false)
                         (restore-root-highlight-item! id))
        item-props {:on-select handle-select!}]
    [:div.ls-property-dropdown-editor.ls-property-ui-position-sub-pane
     (dropdown-editor-menuitem {:icon :layout-distribute-horizontal :title "Block properties" :item-props item-props})
     (dropdown-editor-menuitem {:icon :layout-align-right :title "Beginning of the block" :item-props item-props})
     (dropdown-editor-menuitem {:icon :layout-align-left :title "End of the block" :item-props item-props})
     (dropdown-editor-menuitem {:icon :layout-align-top :title "Below of the block" :item-props item-props})]))

(rum/defc dropdown-editor-impl
  "popup-id: dropdown popup id
   property: block entity"
  [_popup-id property]
  (let [title (:block/title property)
        icon (:logseq.property/icon property)
        icon (when icon [:span.float-left.w-4.h-4.overflow-hidden.leading-4.relative
                         {:class "top-0.5 -right-0.5"}
                         (icon-component/icon icon {:size 15})])]
    [:<>
     (dropdown-editor-menuitem {:icon :edit :title "Property name" :desc [:span.flex.items-center.gap-1 icon title]
                                :submenu-content (fn [] (name-edit-pane property))})
     (dropdown-editor-menuitem {:icon :hash :title "Schema type" :desc "Date" :disabled? true})
     (dropdown-editor-menuitem {:icon :list :title "Available choices" :desc "4 choices"
                                :submenu-content (fn [] (choices-sub-pane property))})
     (dropdown-editor-menuitem {:icon :checks :title "Multiple values" :toggle-checked? true :disabled? true
                                :on-toggle-checked-change (fn [v] (shui/toast! (str title ": " v)))})

     (shui/dropdown-menu-separator)
     (dropdown-editor-menuitem {:icon :float-left :title "UI position" :desc "beginning of the block"
                                :item-props {:class "ui__position-trigger-item"}
                                :submenu-content (fn [ops] (ui-position-sub-pane property ops))})
     (dropdown-editor-menuitem {:icon :eye-off :title "Hide by default" :toggle-checked? false
                                :on-toggle-checked-change (fn [v] (shui/toast! (str title ": " v)))})

     (shui/dropdown-menu-separator)
     (dropdown-editor-menuitem
       {:icon :share-3 :title "Go to the node" :desc ""
        :item-props {:class "opacity-90 focus:opacity-100"
                     :on-select (fn []
                                  (shui/popup-hide-all!)
                                  (route-handler/redirect-to-page! (:block/uuid property)))}})
     (dropdown-editor-menuitem
       {:id :remove-property :icon :square-x :title "Remove property" :desc "" :disabled? false
        :item-props {:class "opacity-60 focus:opacity-100 focus:!text-red-rx-08"
                     :on-select (fn [^js e]
                                  (util/stop e)
                                  (-> (shui/dialog-confirm! "remove?")
                                    (p/then (fn [] (shui/popup-hide-all!)))
                                    (p/catch (fn [] (restore-root-highlight-item! :remove-property)))))}})]))

(rum/defc dropdown-editor < rum/reactive
  [popup-id property]
  (let [property1 (db/sub-block (:db/id property))]
    (dropdown-editor-impl popup-id property1)))
