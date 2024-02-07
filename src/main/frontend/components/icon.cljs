(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :refer [SearchIndex]]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [camel-snake-kebab.core :as csk]
            [clojure.string :as string]
            [frontend.search :as search]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.functions :refer [debounce]]
            [frontend.config :as config]
            [frontend.handler.property.util :as pu]))

(defn icon
  [icon & [opts]]
  (cond
    (and (= :emoji (:type icon)) (:id icon))
    [:em-emoji (merge {:id (:id icon)}
                      opts)]

    (and (= :tabler-icon (:type icon)) (:id icon))
    (ui/icon (:id icon) opts)))

(defn get-page-icon
  [page-entity opts]
  (let [default-icon (ui/icon "page" (merge opts {:extension? true}))
        page-icon (pu/get-block-property-value page-entity :icon)]
    (or
     (when-not (string/blank? page-icon)
       (icon page-icon opts))
     default-icon)))

(defn- search-emojis
  [q]
  (p/let [result (.search SearchIndex q)]
    (bean/->clj result)))

(defonce *tabler-icons (atom nil))
(defn- get-tabler-icons
  []
  (if @*tabler-icons
    @*tabler-icons
    (let [result (->> (keys (bean/->clj js/tablerIcons))
                      (map (fn [k]
                             (-> (string/replace (csk/->Camel_Snake_Case (name k)) "_" " ")
                                 (string/replace-first "Icon " ""))))
                      ;; FIXME: somehow those icons don't work
                      (remove #{"Ab" "Ab 2" "Ab Off"}))]
      (reset! *tabler-icons result)
      result)))

(def emojis
  (vals (bean/->clj (gobj/get emoji-data "emojis"))))

(defn- search-tabler-icons
  [q]
  (search/fuzzy-search (get-tabler-icons) q :limit 100))

(defn- search
  [q]
  (p/let [icons (search-tabler-icons q)
          emojis (search-emojis q)]
    {:icons icons
     :emojis emojis}))

(rum/defc emoji-cp < rum/static
  [{:keys [id name] :as emoji} {:keys [on-chosen hover]}]
  [:button.text-2xl.w-9.h-9.transition-opacity
   (cond->
     {:tabIndex "0"
      :title name
      :on-click (fn [e]
                  (on-chosen e {:type :emoji
                                :id id
                                :name name}))}
     (not (nil? hover))
     (assoc :on-mouse-over #(reset! hover emoji)
            :on-mouse-out #(reset! hover nil)))
   [:em-emoji {:id id}]])

(rum/defc emojis-cp < rum/static
  [emojis opts]
  [:div.emojis.flex.flex-1.flex-row.gap-1.flex-wrap
   (for [emoji emojis]
     (rum/with-key (emoji-cp emoji opts) (:id emoji)))])

(rum/defc icon-cp < rum/static
  [icon {:keys [on-chosen hover]}]
  [:button.w-9.h-9.transition-opacity
   {:key icon
    :tabIndex "0"
    :title icon
    :on-click (fn [e]
                (on-chosen e {:type :tabler-icon
                              :id icon
                              :name icon}))
    :on-mouse-over #(reset! hover {:type :tabler-icon
                                   :id icon
                                   :name icon
                                   :icon icon})
    :on-mouse-out #(reset! hover nil)}
   (ui/icon icon {:size 24})])

(rum/defc icons-cp < rum/static
  [icons opts]
  [:div.icons.flex.flex-1.flex-row.gap-1.flex-wrap
   (for [icon icons]
     (icon-cp icon opts))])

(rum/defcs icon-search <
  (rum/local "" ::q)
  (rum/local nil ::result)
  (rum/local :emoji ::tab)
  (rum/local nil ::hover)
  [state opts]
  (let [*q (::q state)
        *result (::result state)
        *tab (::tab state)
        *hover (::hover state)
        result @*result
        emoji-tab? (= @*tab :emoji)
        opts (assoc opts :hover *hover)]
    [:div.icon-search.flex.flex-1.flex-col.gap-2
     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5
      {:auto-focus    true
       :placeholder   "Select icon"
       :default-value ""
       :on-change     (debounce
                       (fn [e]
                         (reset! *q (util/evalue e))
                         (if (string/blank? @*q)
                           (reset! *result {})
                           (p/let [result (search @*q)]
                             (reset! *result result))))
                       200)}]
     [:div.search-result
      (if (seq result)
        [:div.flex.flex-1.flex-col.gap-1
         (when (seq (:emojis result))
           (emojis-cp (:emojis result) opts))
         (when (seq (:icons result))
           (icons-cp (:icons result) opts))]
        [:div.flex.flex-1.flex-col.gap-1
         [:div.flex.flex-1.flex-row.items-center.gap-2
          (ui/button
           "Emojis"
           {:intent "logseq"
            :small? true
            :on-click #(reset! *tab :emoji)})
          (ui/button
           "Icons"
           {:intent "logseq"
            :small? true
            :on-click #(reset! *tab :icon)})]
         (if emoji-tab?
           (emojis-cp emojis opts)
           (icons-cp (get-tabler-icons) opts))])]

     (if @*hover
       [:div.flex.flex-1.flex-row.items-center.gap-2
        [:button.transition-opacity
         {:style {:font-size 32}
          :key (:id @*hover)
          :title (:name @*hover)}
         (if (= :tabler-icon (:type @*hover))
           (ui/icon (:icon @*hover) {:size 32})
           (:native (first (:skins @*hover))))]

        (:name @*hover)]
       [:div {:style {:padding-bottom 32}}])]))

(rum/defc icon-picker
  [icon-value {:keys [disabled? on-chosen]}]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     [:button.flex {:on-click #(when-not disabled? (toggle-fn))}
      (if icon-value
        (icon icon-value)
        [:div.opacity-50.text-sm
         "Empty"])])
   (if config/publishing?
     (constantly [])
     (fn [{:keys [toggle-fn]}]
       [:div.p-4
        (icon-search
         {:on-chosen (fn [e icon-value]
                       (on-chosen e icon-value)
                       (toggle-fn))})]))
   {:modal-class (util/hiccup->class
                  "origin-top-right.absolute.left-0.rounded-md.shadow-lg")}))
