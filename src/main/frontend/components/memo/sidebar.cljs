;; src/main/frontend/components/memo/sidebar.cljs
(ns frontend.components.memo.sidebar
  (:require [rum.core :as rum]
            [frontend.modules.memo.index :as index]))

(def type->icon
  {:character "📖"
   :world "🌍"
   :timeline "📅"
   :location "🏠"
   :custom "⚙️"})

(def type->color
  {:character "red"
   :world "green"
   :timeline "blue"
   :location "yellow"
   :custom "purple"})

(def setting-types
  [{:type :character :label "📖 人物" :color "red"}
   {:type :world :label "🌍 世界观" :color "green"}
   {:type :timeline :label "📅 时间线" :color "blue"}
   {:type :location :label "🏠 地点" :color "yellow"}
   {:type :custom :label "⚙️ 自定义" :color "purple"}])

(rum/defc setting-item < rum/reactive
  [setting]
  (let [type (:logseq.memo/type setting)
        importance (:logseq.memo/importance setting)
        title (or (:title (:frontmatter setting))
                  (:logseq.memo/id setting))]
    [:div.setting-item
     {:key (:db/id setting)}
     [:span.type-icon {:style {:color (type->color type)}}
      (type->icon type)]
     [:span.setting-title title]
     (when (= importance :high)
       [:span.importance "⭐"])]))

(rum/defc memo-sidebar []
  (let [settings (index/get-all-settings)]
    [:div.memo-sidebar
     [:h3 "设定面板"]
     (if (empty? settings)
       [:div.empty-state "暂无设定"]

       (for [type-info setting-types
             :let [type-settings (filter #(= (:logseq.memo/type %) (:type type-info)) settings)
                   count (count type-settings)]
             :when (pos? count)]
         [:div.type-section {:key (:type type-info)}
          [:div.type-header
           [:span.type-icon {:style {:color (:color type-info)}}
            (type->icon (:type type-info))]
           [:span.type-label (:label type-info)]
           [:span.type-count (str "(" count ")")]]
          (for [setting type-settings]
            (setting-item setting))]))]))
