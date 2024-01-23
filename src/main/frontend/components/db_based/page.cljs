(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.editor :as editor]
            [frontend.components.class :as class-component]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as pv]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [rum.core :as rum]
            [logseq.shui.ui :as shui-ui]
            [frontend.util :as util]
            [clojure.set :as set]
            [clojure.string :as string]))

(rum/defc page-properties < rum/reactive
  [page {:keys [mode configure?]}]
  (let [types (:block/type page)
        property? (contains? types "property")
        edit-input-id-prefix (str "edit-block-" (:block/uuid page))
        configure-opts {:selected? false
                        :page-configure? true}
        has-viewable-properties? (db-property-handler/block-has-viewable-properties? page)
        has-class-properties? (seq (:properties (:block/schema page)))]
    (when (or configure? has-viewable-properties? has-class-properties? property?)
      [:div.ls-page-properties.mb-4
       (if config/publishing?
         [:div.flex.flex-col.gap-4
          (when has-viewable-properties?
            [:div
             (when has-class-properties?
               [:div.mb-1.opacity-70.font-medium.text-sm "Page properties:"])
             (component-block/db-properties-cp {:editor-box editor/box}
                                               page
                                               (str edit-input-id-prefix "-page")
                                               {:selected? false
                                                :page-configure? false
                                                :class-schema? false})])
          (when has-class-properties?
            [:div
             (when has-viewable-properties?
               [:div.mb-1.opacity-70.font-medium.text-sm "Class properties:"])
             (component-block/db-properties-cp {:editor-box editor/box}
                                               page
                                               (str edit-input-id-prefix "-schema")
                                               (assoc configure-opts :class-schema? true))])]
         (cond
           (= mode :class)
           (component-block/db-properties-cp {:editor-box editor/box}
                                             page
                                             (str edit-input-id-prefix "-schema")
                                             (assoc configure-opts :class-schema? true))

           (= mode :page)
           (component-block/db-properties-cp {:editor-box editor/box}
                                             page
                                             (str edit-input-id-prefix "-page")
                                             (assoc configure-opts :class-schema? false))))])))

(rum/defc icon-row < rum/reactive
  [page]
  [:div.grid.grid-cols-5.gap-1.items-center
   [:label.col-span-2 "Icon:"]
   (let [icon-value (pu/get-block-property-value page :icon)]
     [:div.col-span-3.flex.flex-row.items-center.gap-2
      (icon-component/icon-picker icon-value
                                  {:disabled? config/publishing?
                                   :on-chosen (fn [_e icon]
                                                (let [icon-property-id (db-pu/get-built-in-property-uuid :icon)]
                                                  (db-property-handler/update-property!
                                                   (state/get-current-repo)
                                                   (:block/uuid page)
                                                   {:properties {icon-property-id icon}})))})
      (when (and icon-value (not config/publishing?))
        [:a.fade-link.flex {:on-click (fn [_e]
                                        (db-property-handler/remove-block-property!
                                         (state/get-current-repo)
                                         (:block/uuid page)
                                         (db-pu/get-built-in-property-uuid :icon)))
                            :title "Delete this icon"}
        (ui/icon "X")])])])

(rum/defc tags
  [page]
  (let [tags-property (pu/get-property :tags)]
    (pv/property-value page tags-property
                       (map :block/uuid (:block/tags page))
                       {:page-cp (fn [config page]
                                   (component-block/page-cp (assoc config :tag? true) page))
                        :inline-text component-block/inline-text})))

(rum/defc tags-row < rum/reactive
  [page]
  [:div.grid.grid-cols-5.gap-1.items-center
   [:label.col-span-2 "Tags:"]
   [:div.col-span-3.flex.flex-row.items-center.gap-2
    (tags page)]])

(rum/defcs page-configure < rum/reactive
  [state page *mode]
  (let [*mode *mode
        mode (rum/react *mode)
        types (:block/type page)
        class? (contains? types "class")
        property? (contains? types "property")
        page-opts {:configure? true}]
    (when (nil? mode)
      (reset! *mode (cond
                      property? :property
                      class? :class
                      :else :page)))
    [:div.flex.flex-col.gap-1
     (if (= mode :property)
       (property-component/property-config page page {:inline-text component-block/inline-text})
       [:<>
        (when (= mode :class)
          (class-component/configure page {:show-title? false}))
        (when-not config/publishing? (tags-row page))
        (when-not config/publishing? (icon-row page))
        [:h2 "Properties: "]
        (page-properties page (assoc page-opts :mode mode))])]))

(rum/defc page-properties-react < rum/reactive
  [page* page-opts]
  (let [page (db/sub-block (:db/id page*))]
    (when (or (db-property-handler/block-has-viewable-properties? page)
              ;; Allow class and property pages to add new property
              (some #{"class" "property"} (:block/type page)))
      (page-properties page page-opts))))

(rum/defc mode-switch < rum/reactive
  [types *mode]
  (let [current-mode (rum/react *mode)
        property? (contains? types "property")
        class? (contains? types "class")
        modes (->
               (cond
                 (and property? class?)
                 ["Property" "Class"]
                 property?
                 ["Property"]
                 class?
                 ["Class"]
                 :else
                 [])
               (conj "Page"))]
    [:div.flex.flex-row.items-center.gap-1
     (for [mode modes]
       (let [mode' (keyword (string/lower-case mode))
             selected? (= mode' current-mode)]
         (shui-ui/button {:class (when-not selected? "opacity-70")
                          :variant (if selected? :outline :ghost) :size :sm
                          :on-click (if config/publishing?
                                      util/stop-propagation
                                      (fn [e]
                                        (util/stop-propagation e)
                                        (reset! *mode mode')))}
                         mode)))]))

(rum/defcs page-info < rum/reactive
  (rum/local false ::hover?)
  (rum/local nil ::mode)
  {:init (if config/publishing?
           (fn [state]
             (let [page* (first (:rum/args state))
                   page (db/sub-block (:db/id page*))]
               (assoc state
                      ::collapsed?
                      (atom (not (seq (set/intersection #{"class" "property"} (:block/type page))))))))
           (fn [state]
             (assoc state ::collapsed? (atom true))))}
  [state page *hover-title?]
  (let [page (db/sub-block (:db/id page))
        *collapsed? (::collapsed? state)
        *hover? (::hover? state)
        *mode (::mode state)
        types (:block/type page)
        class? (contains? types "class")
        hover-title? (rum/react *hover-title?)
        collapsed? (rum/react *collapsed?)
        has-tags? (seq (:block/tags page))
        has-properties? (seq (:block/properties page))
        hover-or-expanded? (or @*hover? hover-title? (not collapsed?))]
    (when (if config/publishing?
            ;; Since publishing is read-only, hide this component if it has no info to show
            ;; as it creates a fair amount of empty vertical space
            (or has-tags? (some? types))
            true)
      [:div.page-info {:on-mouse-over #(reset! *hover? true)
                       :on-mouse-leave #(reset! *hover? false)}
       (when (or hover-or-expanded? has-tags? has-properties?)
         [:div.fade-in.p-2 {:class (if (or @*hover? (not collapsed?))
                                     "border rounded"
                                     "border rounded border-transparent")}
          [:div.info-title.cursor {:on-click
                                   (if config/publishing?
                                     (fn [_]
                                       (when (seq (set/intersection #{"class" "empty"} types))
                                         (swap! *collapsed? not)))
                                     #(swap! *collapsed? not))}
           [:div.flex.flex-row.items-center.gap-2.justify-between.pl-1
            [:div.flex.flex-row.items-center.gap-2
             (if collapsed?
               (if (or has-tags? @*hover?)
                 [:<>
                  (shui-ui/button {:variant :ghost :size :sm :class "fade-link"}
                                  (ui/icon "tags"))
                  [:div {:on-click util/stop-propagation}
                   (tags page)]]
                 [:div.page-info-title-placeholder])
               [:div.flex.flex-row.items-center.gap-1
                (shui-ui/button {:variant :ghost :size :sm :class "fade-link"}
                                (ui/icon "info-circle"))
                [:a.text-sm.font-medium.fade-link
                 "Configure:"]
                (mode-switch types *mode)])]
            (when (or @*hover? (not collapsed?))
              (shui-ui/button
               {:variant :ghost :size :sm :class "fade-link"}
               (ui/icon (if collapsed?
                          "chevron-down"
                          "chevron-up"))))]]
          (if collapsed?
            (when (or (seq (:block/properties page))
                      (and class? (seq (:properties (:block/schema page)))))
              [:div.py-2.px-4
               (page-properties page {:mode (if class? :class :page)})])
            [:div.py-2.px-4
             (page-configure page *mode)])])])))
