(ns frontend.components.property-v2
  (:require [frontend.components.icon :as icon-component]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))


(rum/defc dropdown-editor-menuitem
  [{:keys [icon title desc submenu-content disabled? item-props]}]

  (let [wrap-menuitem (if submenu-content
                       #(shui/dropdown-menu-sub
                          (shui/dropdown-menu-sub-trigger (merge {} item-props) %)
                          (shui/dropdown-menu-sub-content
                            (if (fn? submenu-content)
                              (submenu-content) submenu-content)))
                       #(shui/dropdown-menu-item (merge {} item-props) %))]
    (wrap-menuitem
      [:div.inner-wrap
       {:class (util/classnames [{:disabled disabled?}])}
       [:strong
        (shui/tabler-icon (name icon))
        [:span title]]
       (if (fn? desc) (desc)
         [:small [:span desc]
          (when disabled? (shui/tabler-icon "forbid-2" {:size 15}))])])))

(rum/defc dropdown-editor
  "popup-id: dropdown popup id
   property: block entity"
  [popup-id property]
  (let [title (:block/title property)
        icon (:logseq.property/icon property)
        icon (when icon (icon-component/icon icon {:size 15}))]
    [:<>
     (dropdown-editor-menuitem {:icon :edit :title "Property name" :desc [:span icon " " title]
                                :submenu-content (fn [] [:p.p-3 [:strong "edit name pane???"]])})
     (dropdown-editor-menuitem {:icon :hash :title "Schema type" :desc "Date" :disabled? true})
     (dropdown-editor-menuitem {:icon :list :title "Available choices" :desc "4 choices"
                                :submenu-content (fn [] [:p.p-3 [:strong "choices pane???"]])})
     (dropdown-editor-menuitem {:icon :checks :title "Multiple values"
                                :desc (fn [] [:span.scale-90.flex.items-center
                                              (shui/switch {:size "sm" :default-checked true})])})
     (shui/dropdown-menu-separator)
     (dropdown-editor-menuitem {:icon :float-left :title "UI position" :desc "beginning of the block"
                                :submenu-content (fn [] [:p.p-3 [:strong "position???"]])})
     (dropdown-editor-menuitem {:icon :eye-off :title "Hide by default"
                                :desc (fn [] [:span.scale-90.flex.items-center
                                              (shui/switch {:size "sm" :default-checked false})])})
     (shui/dropdown-menu-separator)
     (dropdown-editor-menuitem
       {:icon :square-x :title "Remove property" :desc "" :disabled? false
        :item-props {:class "opacity-50 focus:opacity-100 focus:!text-red-rx-08"
                     :on-click #(-> (shui/dialog-confirm! "remove?")
                                  (p/then (fn [] (shui/popup-hide! popup-id))))}})]))