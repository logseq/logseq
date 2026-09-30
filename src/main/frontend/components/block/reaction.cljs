(ns frontend.components.block.reaction
  (:require [clojure.string :as string]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.reaction :as reaction-handler]
            [frontend.handler.user :as user-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc loaded-block-reactions
  [block]
  (let [block-uuid (:block/uuid block)
        current-user-uuid (some-> (user-handler/user-uuid) uuid)
        summary (db-hooks/use-resource
                 [:block-reactions block-uuid current-user-uuid])
        read-only? config/publishing?
        on-pick (fn [popup-id emoji]
                  (reaction-handler/toggle-reaction! (:block/uuid block) (:id emoji))
                  (shui/popup-hide! popup-id))
        open-picker! (fn [^js e]
                       (util/stop e)
                       (shui/popup-show!
                        (.-target e)
                        (fn [{:keys [id]}]
                          (icon-component/icon-search
                           {:on-chosen (fn [_emoji-event emoji _keep-popup?] (on-pick id emoji))
                            :tabs [[:emoji "Emojis"]]
                            :default-tab :emoji
                            :show-used? true
                            :icon-value nil}))
                        {:align :start
                                 :content-props {:class "ls-icon-picker"}}))]
    (when (seq summary)
      [:div.ls-block-reactions.flex.flex-row.flex-wrap.items-center.mt-1
       (for [{:keys [emoji-id count reacted-by-me? usernames]} summary]
         (let [btn-classes (util/classnames
                            ["px-2 py-0 h-6 text-xs rounded-full"
                             (when reacted-by-me? "bg-accent/10 text-foreground")])
               title (string/join ", " usernames)
               btn (shui/button
                    {:variant :ghost
                     :key (str "reaction-" (:block/uuid block) "-" emoji-id)
                     :size :sm
                     :class btn-classes
                     :on-click (fn [e]
                                 (when-not read-only?
                                   (util/stop e)
                                   (reaction-handler/toggle-reaction! (:block/uuid block) emoji-id)))}
                    [:span.text-sm.leading-none
                     [:em-emoji {:id emoji-id
                                 :style {:line-height 1}}]]

                    [:span count])]
           (ui/tooltip btn [:div title])))
       (when-not read-only?
         (shui/button
          {:variant :ghost
           :size :sm
           :class "px-1 py-0 h-6 text-muted-foreground hover:text-foreground"
           :title (t :command.editor/add-reaction)
           :on-click open-picker!
           :on-pointer-down (fn [e]
                              (util/stop e))}
                 (ui/icon "plus" {:size 14})))])))

(defn block-reactions
  [block]
  (when (uuid? (:block/uuid block))
    (loaded-block-reactions block)))
