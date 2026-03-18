(ns frontend.components.recycle
  "Recycle page UI"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.block :as component-block]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
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

(defn- group-title
  [db root]
  (if (ldb/page? root)
    (:block/title root)
    (or (:block/title (resolve-entity db (:logseq.property.recycle/original-page root)))
        "Unknown page")))

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
        deleted-at (:logseq.property/deleted-at root)]
    [:div.flex.items-center.justify-between.gap-4.text-xs.text-muted-foreground
     [:div.flex.items-center.gap-1.min-w-0.flex-1
      (deleted-by-avatar user)
      [:div.min-w-0
       [:div.truncate
        (str (if (ldb/page? root) "Page" "Block")
             " deleted "
             (.toLocaleString (js/Date. deleted-at)))]]]
     (shui/button
      {:variant :ghost
       :size :xs
       :class "!py-0 !px-1 h-4"
       :on-click #(page-handler/restore-recycled! (:block/uuid root))}
      "Restore")]))

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

(rum/defc recycle-page
  [_page]
  (let [db* (db/get-db)
        groups (->> (deleted-roots db*)
                    (group-by #(group-title db* %))
                    (sort-by (fn [[_ roots]]
                               (:logseq.property/deleted-at (first roots)))
                             #(compare %2 %1)))]
    [:div.flex.flex-col.gap-1
     [:div.text-sm.text-muted-foreground.mb-4
      "Deleted pages and blocks stay here until restored or automatically garbage collected after 60 days."]
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
       [:div.text-sm.text-muted-foreground "Recycle is empty."])]))
