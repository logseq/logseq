(ns frontend.components.recycle
  "Recycle page UI"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.block :as component-block]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- resolve-entity
  [db value]
  (cond
    (and (map? value) (:db/id value)) value
    (integer? value) (d/entity db value)
    (vector? value) (d/entity db value)
    :else nil))

(defn- user-initials
  [user]
  (let [name (or (:logseq.property.user/name user)
                 (:block/title user)
                 "U")
        name (string/trim name)]
    (subs name 0 (min 2 (count name)))))

(defn- deleted-roots
  [db]
  (->> (d/q '[:find [?e ...]
              :where
              [?e :logseq.property/deleted-at]]
            db)
       (map #(d/entity db %))
       (sort-by :logseq.property/deleted-at #(compare %2 %1))))

(defn- sub-deleted-root-ids
  []
  (when-let [repo (state/get-current-repo)]
    (some-> (react/q repo
                     [:frontend.worker.react/recycle-roots]
                     {:query-fn (fn [db _]
                                  (->> (d/q '[:find [?e ...]
                                              :where
                                              [?e :logseq.property/deleted-at]]
                                            db)
                                       vec))}
                     nil)
            util/react)))

(defn- group-title
  [db root]
  (if (ldb/page? root)
    (:block/title root)
    (or (:block/title (resolve-entity db (:logseq.property.recycle/original-page root)))
        (t :page/unknown))))

(defn- deleted-by
  [db root]
  (resolve-entity db (:logseq.property/deleted-by-ref root)))

(defn- deleted-by-avatar
  [user]
  (let [avatar-src (:logseq.property.user/avatar user)]
    (shui/avatar
     {:class "w-4 h-4"}
     (when (seq avatar-src)
       (shui/avatar-image {:src avatar-src}))
     (shui/avatar-fallback (user-initials user)))))

(defn- deleted-root-header
  [db root]
  (let [user (deleted-by db root)
        deleted-at (:logseq.property/deleted-at root)
        root-uuid (:block/uuid root)
        delete-message (str "Permanently delete this "
                            (if (ldb/page? root) "page" "block")
                            " from Recycle? This cannot be undone.")]
    [:div.flex.items-center.justify-between.gap-4.text-xs.text-muted-foreground
     [:div.flex.items-center.gap-1.min-w-0.flex-1
      (deleted-by-avatar user)
      [:div.min-w-0
       [:div.truncate
        (t (if (ldb/page? root)
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

(rum/defc recycle-page < rum/reactive db-mixins/query
  [_page {:keys [class]}]
  (let [db* (db/get-db)
        root-ids (or (sub-deleted-root-ids)
                     [])
        roots (if (seq root-ids)
                (->> root-ids
                     (keep #(d/entity db* %))
                     (sort-by :logseq.property/deleted-at #(compare %2 %1)))
                (deleted-roots db*))
        groups (->> roots
                    (group-by #(group-title db* %))
                    (sort-by (fn [[_ roots]]
                               (:logseq.property/deleted-at (first roots)))
                             #(compare %2 %1)))]
    [:div {:class (util/classnames ["flex" "flex-col" "gap-8" "ls-recycle-page-content" class])}
     [:div.text-sm.text-muted-foreground.ls-recycle-page-description.ml-1
      (t :storage.recycle/retention-desc)]
     (if (seq groups)
       (for [[title roots] groups]
         [:section {:key title}
          (when-not (some ldb/page? roots)
            [:h2.text-lg.font-medium.mb-3 title])
          [:div.flex.flex-col
           (for [root roots]
             [:div {:key (str (:block/uuid root))}
              (deleted-root-header db* root)
              (deleted-root-outliner root)])]])
       [:div.text-sm.text-muted-foreground (t :storage.recycle/empty)])]))
