(ns frontend.components.recycle
  "Recycle page UI"
  (:require [frontend.components.avatar :as avatar]
            [frontend.components.block :as component-block]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.entity :as entity]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- group-title
  [root]
  (if (entity/page? root)
    (:block/title root)
    (or (:logseq.property.recycle/original-page-title root)
        (t :page/unknown))))

(defn- deleted-by
  [root]
  (:logseq.property/deleted-by-ref root))

(defn- deleted-by-avatar
  [user]
  (avatar/user-avatar
   {:class "w-4 h-4"
    :name (or (:logseq.property.user/name user)
              (:block/title user)
              "U")
    :avatar-src (:logseq.property.user/avatar user)}))

(defn- deleted-root-header
  [root]
  (let [user (deleted-by root)
        deleted-at (:logseq.property/deleted-at root)
        root-uuid (:block/uuid root)
        delete-message (str "Permanently delete this "
                            (if (entity/page? root) "page" "block")
                            " from Recycle? This cannot be undone.")]
    [:div.flex.items-center.justify-between.gap-4.text-xs.text-muted-foreground
     [:div.flex.items-center.gap-1.min-w-0.flex-1
      (deleted-by-avatar user)
      [:div.min-w-0
       [:div.truncate
        (t (if (entity/page? root)
             :storage.recycle/page-deleted-at
             :storage.recycle/block-deleted-at)
           (i18n/locale-format-date (js/Date. deleted-at)))]]]
     [:div.flex.items-center.gap-1
      (shui/button
       {:variant :ghost
        :size :xs
        :class "!py-0 !px-1 h-4"
        :on-click #(page-handler/restore-recycled! root-uuid)}
       (t :storage.recycle/restore))
      (shui/button
       {:variant :ghost
        :size :xs
        :class "!py-0 !px-1 h-4 hover:text-red-rx-09 dark:hover:text-red-rx-10 hover:bg-red-rx-04-alpha dark:hover:bg-red-rx-06-alpha"
        :on-click #(when (js/confirm delete-message)
                     (page-handler/delete-recycled-permanently! root-uuid))}
       (t :ui/delete))]]))

(defn- deleted-root-outliner
  [root]
  (component-block/block-container
   {:view? true
    :block? true
    :publishing? true
    :stop-events? true
    :default-collapsed? (boolean (editor-handler/collapsable? (:block/uuid root)
                                                              {:semantic? true}))
    :container-id (state/get-container-id [:recycle-root (:block/uuid root)])
    :id (str (:block/uuid root))}
   root))

(hsx/defc recycle-page
  [_page {:keys [class]}]
  (let [repo (state/get-current-repo)
        [roots set-roots!] (hooks/use-state nil)
        groups (->> (or roots [])
                    (group-by group-title)
                    (sort-by (fn [[_ roots]]
                               (:logseq.property/deleted-at (first roots)))
                             #(compare %2 %1)))]
    (hooks/use-effect!
     (fn []
       (p/let [root-ids (db-async/<q repo
                                     {:transact-db? false}
                                     '[:find [?e ...]
                                       :where
                                       [?e :logseq.property/deleted-at]])
               results (db-async/<get-blocks repo root-ids {:children? false})
               roots (->> results
                          (map :block)
                          (sort-by :logseq.property/deleted-at #(compare %2 %1)))]
         (set-roots! roots))
       nil)
     [repo])
       [:div {:class (util/classnames ["flex" "flex-col" "gap-8" "ls-recycle-page-content" class])}
        [:div.text-sm.text-muted-foreground.ls-recycle-page-description.ml-1
         (t :storage.recycle/retention-desc)]
        (if (seq groups)
          (for [[title roots] groups]
            [:section {:key title}
             (when-not (some entity/page? roots)
               [:h2.text-lg.font-medium.mb-3 title])
              [:div.flex.flex-col
               (for [root roots]
                 [:div {:key (str (:block/uuid root))}
                 (deleted-root-header root)
                 (deleted-root-outliner root)])]])
          [:div.text-sm.text-muted-foreground (t :storage.recycle/empty)])]))
