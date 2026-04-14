;; src/main/frontend/components/memo/sidebar.cljs
(ns frontend.components.memo.sidebar
  (:require [rum.core :as rum]
            [frontend.modules.memo.index :as index]))

(def setting-types
  [{:type :character :label "📖 人物" :color "red"}
   {:type :world :label "🌍 世界观" :color "green"}
   {:type :timeline :label "📅 时间线" :color "blue"}
   {:type :location :label "🏠 地点" :color "yellow"}
   {:type :custom :label "⚙️ 自定义" :color "purple"}])

(rum/defc setting-item < rum/reactive
  [setting]
  [:div.setting-item
   {:key (:logseq.memo/id setting)}
   [:span {:style {:color (:color setting)}} "●"]
   [:span (:logseq.memo/id setting)]])

(rum/defc memo-sidebar []
  (let [settings (index/get-all-settings)]
    [:div.memo-sidebar
     [:h3 "设定面板"]
     (for [type-info setting-types]
       [:div.type-section {:key (:type type-info)}
        [:div.type-header (:label type-info)]
        (for [setting (filter #(= (:logseq.memo/type %) (:type type-info)) settings)]
          (setting-item setting))])]))
