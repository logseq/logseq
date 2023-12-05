(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.editor :as editor]
            [frontend.components.class :as class-component]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as pv]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc page-properties < rum/reactive
  [page {:keys [configure? show-page-properties?]}]
  (let [types (:block/type page)
        class? (contains? types "class")
        edit-input-id-prefix (str "edit-block-" (:block/uuid page))
        configure-opts {:selected? false
                        :page-configure? true}
        has-viewable-properties? (db-property-handler/block-has-viewable-properties? page)
        has-class-properties? (seq (:properties (:block/schema page)))]
    (when (or configure? has-viewable-properties? has-class-properties?)
      [:div.ls-page-properties.mb-4 {:style {:padding 2}}
       (if configure?
         (cond
           (and class? (not show-page-properties?) (not has-class-properties?))
           [:div
            [:div.mb-1 "Class properties:"]
            (component-block/db-properties-cp {:editor-box editor/box}
                                              page
                                              (str edit-input-id-prefix "-schema")
                                              (assoc configure-opts :class-schema? true))]

           (not (db-property-handler/block-has-viewable-properties? page))
           [:div
            [:div.mb-1 "Page properties:"]
            (component-block/db-properties-cp {:editor-box editor/box}
                                              page
                                              (str edit-input-id-prefix "-page")
                                              (assoc configure-opts :class-schema? false))])
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

           [:div.flex.flex-col.gap-4
            (when has-class-properties?
              [:div
               (when has-viewable-properties?
                 [:div.mb-1.opacity-70.font-medium.text-sm "Class properties:"])
               (component-block/db-properties-cp {:editor-box editor/box}
                                                 page
                                                 (str edit-input-id-prefix "-schema")
                                                 (assoc configure-opts :class-schema? true))])

            (when has-viewable-properties?
              [:div
               (when has-class-properties?
                 [:div.mb-1.opacity-70.font-medium.text-sm "Page properties:"])
               (component-block/db-properties-cp {:editor-box editor/box}
                                                 page
                                                 (str edit-input-id-prefix "-page")
                                                 {:selected? false
                                                  :page-configure? false
                                                  :class-schema? false})])]))])))

(rum/defcs page-configure-inner <
  (rum/local false ::show-page-properties?)
  {:will-unmount (fn [state]
                   (let [on-unmount (nth (:rum/args state) 1)]
                     (on-unmount)))}
  [state page _on-unmount opts]
  (let [*show-page-properties? (::show-page-properties? state)
        types (:block/type page)
        class? (contains? types "class")
        property? (contains? types "property")
        class-or-property? (or class? property?)
        page-opts {:configure? true
                   :show-page-properties? @*show-page-properties?}]
    [:div.flex.flex-col.justify-between.p-4 {:style {:min-width 700
                                                     :min-height 400}}
     [:div.flex.flex-col.gap-2
      (cond
        (not class-or-property?)
        (when (and (not class?)
                   (not property?)
                   (not (db-property-handler/block-has-viewable-properties? page)))
          (page-properties page page-opts))

        @*show-page-properties?
        (page-properties page page-opts)

        :else
        [:<>
         (when class?
           (class-component/configure page))
         (when class?
           (page-properties page page-opts))
         (when (and property? (not class?))
           [:h2.title "Configure property"])
         (when property?
           (property-component/property-config page page (assoc opts
                                                                :inline-text component-block/inline-text)))])]

     (when (and class-or-property?
                (not (db-property-handler/block-has-viewable-properties? page))
                (not config/publishing?)
                (empty? (:properties (:block/schema page))))
       [:a.fade-link.flex.flex-row.items-center.gap-1.text-sm
        {:on-click #(swap! *show-page-properties? not)}
        (ui/icon (if @*show-page-properties?
                   "arrow-narrow-left"
                   "arrow-narrow-right"))
        (if @*show-page-properties?
          "Back"
          "Edit page properties")])]))

(rum/defc page-configure
  [page *hover? *configuring?]
  (when (or @*hover? (and config/publishing? (some #{"class" "property"} (:block/type page))))
    (let [toggle-fn' (fn [toggle-fn]
                       (fn []
                         (toggle-fn)
                         (reset! *configuring? true)))]
      (ui/dropdown
       (fn [{:keys [toggle-fn]}]
         [:a.fade-link.flex.flex-row.items-center
          {:on-click (toggle-fn' toggle-fn)}
          [:div.mr-1.text-sm (if-let [block-type (and config/publishing?
                                                      (some #{"class" "property"} (:block/type page)))]
                               (str "More info on this " block-type)
                               "Configure")]])
       (fn [{:keys [toggle-fn]}]
         (page-configure-inner
          page
          (fn []
            (reset! *configuring? false)
            (reset! *hover? false))
          {:toggle-fn toggle-fn}))

       {:modal-class (util/hiccup->class
                      "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg")}))))

(rum/defc page-properties-react < rum/reactive
  [page* page-opts]
  (let [page (db/sub-block (:db/id page*))]
    (when (or (db-property-handler/block-has-viewable-properties? page)
              ;; Allow class and property pages to add new property
              (some #{"class" "property"} (:block/type page)))
      (page-properties page page-opts))))

(rum/defc page-tags <
  [page tags-property *hover? *configuring?]
  (let [toggle-fn' (fn [toggle-fn]
                     (fn []
                       (toggle-fn)
                       (swap! *configuring? not)))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       [:a.fade-link.flex.flex-row.items-center
        {:on-click (toggle-fn' toggle-fn)}
        [:div.ml-1.text-sm "Set tags"]])
     (fn [{:keys [toggle-fn]}]
       (pv/property-value page tags-property nil {:on-chosen (toggle-fn' toggle-fn)
                                                  :dropdown? false}))
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg")
      :on-toggle (fn [value]
                   (when (false? value)
                     (reset! *configuring? false)
                     (reset! *hover? false)))})))