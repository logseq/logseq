(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.editor :as editor]
            [frontend.components.class :as class-component]
            [frontend.components.property :as property-component]
            [frontend.components.property.value :as pv]
            [frontend.config :as config]
            [frontend.db :as db]
            [logseq.outliner.property :as outliner-property]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [clojure.set :as set]
            [clojure.string :as string]
            [logseq.db.frontend.property :as db-property]))

(rum/defc page-properties
  "This component is called by page-inner and within configure/info modal. This should not
   be displaying properties from both components at the same time"
  < rum/reactive
  [page {:keys [mode configure?]}]
  (let [class? (= mode :class)
        edit-input-id-prefix (str "edit-block-" (:block/uuid page))
        configure-opts {:selected? false
                        :page-configure? configure?}
        has-viewable-properties? (outliner-property/block-has-viewable-properties? page)
        has-class-properties? (seq (:class/schema.properties page))
        hide-properties? (:logseq.property/hide-properties? page)]
    (when (or configure?
              (and
               (not hide-properties?)
               (or has-viewable-properties?
                   has-class-properties?)))
      [:div.ls-page-properties
       {:class (util/classnames [{:no-properties (if class?
                                                   (not has-class-properties?)
                                                   (not has-viewable-properties?))}])}
       (if configure?
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
                                             (assoc configure-opts :class-schema? false :page? true)))
         ;; default view for page-inner
         (component-block/db-properties-cp {:editor-box editor/box}
                                           page
                                           (str edit-input-id-prefix "-page")
                                           (assoc configure-opts :class-schema? false :page? true)))])))

(rum/defc tags
  [page]
  (let [tags-property (db/entity :block/tags)]
    (pv/property-value page tags-property
                       (:block/tags page)
                       {:page-cp (fn [config page]
                                   (component-block/page-cp (assoc config :tag? true) page))
                        :inline-text component-block/inline-text})))

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
                      class? :class
                      property? :property
                      :else :page)))
    [:div.flex.flex-col.gap-1.pb-4
     (case mode
       :property
       (property-component/property-config page {:inline-text component-block/inline-text})

       :class
       [:div.mt-2.flex.flex-col.gap-2
        (class-component/configure page {:show-title? false})
        (page-properties page (assoc page-opts :mode mode))]

       (page-properties page (assoc page-opts :mode mode)))]))

(rum/defc page-properties-react < rum/reactive
  [page* page-opts]
  (let [page (db/sub-block (:db/id page*))]
    (when (or (outliner-property/block-has-viewable-properties? page)
              ;; Allow class and property pages to add new property
              (some #{"class" "property"} (:block/type page)))
      (page-properties page page-opts))))

(rum/defc mode-switch < rum/reactive
  [types *mode]
  (let [current-mode (rum/react *mode)
        class? (contains? types "class")
        property? (contains? types "property")
        modes (->
               (cond
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
             selected? (and (= mode' current-mode) (> (count modes) 1))]
         (shui/button {:class (when-not selected? "opacity-70")
                       :variant (if selected? :outline :ghost)
                       :size :sm
                       :on-click (fn [e]
                                   (util/stop-propagation e)
                                   (reset! *mode mode'))}
                      mode)))]))

(rum/defcs page-info < rum/reactive
  (rum/local false ::hover?)
  (rum/local nil ::mode)
  [state page *show-info?]
  (let [page (db/sub-block (:db/id page))
        *hover? (::hover? state)
        *mode (::mode state)
        types (:block/type page)
        class? (contains? types "class")
        collapsed? (not @*show-info?)
        has-properties? (seq (remove (set (keys db-property/built-in-properties))
                                     (keys (:block/properties page))))
        show-info? (or @*show-info? has-properties?)]
    (when (if config/publishing?
            ;; Since publishing is read-only, hide this component if it has no info to show
            ;; as it creates a fair amount of empty vertical space
            (some? types)
            show-info?)
      [:div.page-info
       {:class (util/classnames [{:is-collapsed collapsed?}])}
       [:div {:class (if (or @*hover? (not collapsed?))
                       "border rounded"
                       "border rounded border-transparent")}
        (when-not collapsed?
          [:div.info-title.cursor.py-1
           {:on-mouse-over #(reset! *hover? true)
            :on-mouse-leave #(when-not (state/dropdown-opened?)
                               (reset! *hover? false))
            :on-click (if config/publishing?
                        (fn [_]
                          (when (seq (set/intersection #{"class" "property"} types))
                            (swap! *show-info? not)))
                        #(do
                           (swap! *show-info? not)
                           (swap! *hover? not)))}
           [:<>
            [:div.flex.flex-row.items-center.gap-1
             [:a.flex.fade-link.ml-3 (ui/icon "info-circle")]
             (mode-switch types *mode)]
            [:div.px-1.absolute.right-0.top-0
             (shui/button
              {:variant :ghost :size :sm}
              (ui/icon "x"))]]])
        (if collapsed?
          (when (or (seq (:block/properties page))
                    (and class? (seq (:class/schema.properties page))))
            [:div.px-2 {:style {:margin-left 2}}
             (page-properties page {:mode @*mode})])
          [:div.px-3
           (page-configure page *mode)])]])))
