(ns frontend.components.db-based.page
  "Page components only for DB graphs"
  (:require [frontend.components.block :as component-block]
            [frontend.components.editor :as editor]
            [frontend.components.class :as class-component]
            [frontend.components.property :as property-component]
            [frontend.config :as config]
            [frontend.db :as db]
            [logseq.outliner.property :as outliner-property]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [clojure.string :as string]
            [logseq.db.frontend.property :as db-property]
            [logseq.db :as ldb]))

(rum/defc page-properties
  "This component is called by page-inner and within configure/info modal. This should not
   be displaying properties from both components at the same time"
  < rum/reactive
  [page {:keys [mode configure?]}]
  (let [edit-input-id-prefix (str "edit-block-" (:block/uuid page))
        configure-opts {:selected? false
                        :page-configure? configure?}
        has-viewable-properties? (outliner-property/block-has-viewable-properties? page)
        hide-properties? (:logseq.property/hide-properties? page)]
    (when (or configure? (and (not hide-properties?) has-viewable-properties?))
      [:div.ls-page-properties
       {:class (util/classnames [{:no-properties (not has-viewable-properties?)}])}
       (if configure?
         (cond
           (= mode :tag)
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

(rum/defcs page-configure < rum/reactive
  [state page *mode]
  (let [*mode *mode
        mode (rum/react *mode)
        class? (ldb/class? page)
        property? (ldb/property? page)
        page-opts {:configure? true}]
    (when (nil? mode)
      (reset! *mode (cond
                      class? :tag
                      property? :property
                      :else :page)))
    [:div.flex.flex-col.gap-1.pb-4
     (case mode
       :property
       (property-component/property-config page {:inline-text component-block/inline-text})

       :tag
       [:div.mt-2.flex.flex-col.gap-2
        (class-component/configure page {:show-title? false})
        (page-properties page (assoc page-opts :mode mode))]

       (page-properties page (assoc page-opts :mode mode)))]))

(rum/defc mode-switch < rum/reactive
  [type *mode]
  (let [current-mode (rum/react *mode)
        class? (= type "class")
        property? (= type "property")
        modes (->
               (cond
                 property?
                 ["Property"]
                 class?
                 ["Tag"]
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
        type (:block/type page)
        class? (ldb/class? page)
        collapsed? (not @*show-info?)
        has-properties? (or
                         (seq (:block/tags page))
                         (seq (:block/alias page))
                         (seq (remove (set (keys db-property/built-in-properties))
                                      (keys (:block/properties page)))))
        show-info? (or @*show-info? has-properties?)]
    (when (if config/publishing?
            ;; Since publishing is read-only, hide this component if it has no info to show
            ;; as it creates a fair amount of empty vertical space
            (some? type)
            show-info?)
      [:div.page-info
       {:class (util/classnames [{:is-collapsed collapsed?}])}
       [:div {:class (if (or @*hover? (not collapsed?))
                       "border rounded"
                       "border rounded border-transparent")}
        (when-not collapsed?
          [:div.info-title.cursor.p-1
           {:on-mouse-over #(reset! *hover? true)
            :on-mouse-leave #(when-not (state/dropdown-opened?)
                               (reset! *hover? false))
            :on-click (if config/publishing?
                        (fn [_]
                          (when (contains? #{"class" "property"} type)
                            (swap! *show-info? not)))
                        #(do
                           (swap! *show-info? not)
                           (swap! *hover? not)))}
           [:<>
            [:div.flex.flex-row.items-center.gap-1
             (mode-switch type *mode)]
            [:div.absolute.right-1.top-1
             (shui/button
              {:variant :ghost :size :sm
               :class "px-1 py-1 h-6 w-6"}
              (ui/icon "x"))]]])
        (if collapsed?
          (when (or (seq (:block/properties page))
                    (and class? (seq (:class/schema.properties page))))
            (page-properties page {:mode @*mode}))
          [:div.px-3
           (page-configure page *mode)])]])))
