(ns frontend.components.class
  (:require [frontend.config :as config]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]
            [frontend.components.block :as block]
            [logseq.shui.ui :as shui]
            [frontend.db-mixins :as db-mixins]))

(rum/defc class-select
  [page class on-select]
  (let [repo (state/get-current-repo)
        children-pages (model/get-structured-children repo (:db/id page))
        ;; Disallows cyclic hierarchies
        exclude-ids (-> (set (map (fn [id] (:block/uuid (db/entity id))) children-pages))
                        (conj (:block/uuid page))) ; break cycle
        classes (->> (model/get-all-classes repo)
                     (remove (fn [e] (contains? exclude-ids (:block/uuid e)))))
        options (sort-by :label
                         (map (fn [entity] {:label (:block/title entity)
                                            :value (:block/uuid entity)
                                            :selected (= class (:block/uuid entity))})
                              classes))
        options (cons (if class
                        {:label "Choose parent tag"
                         :value "Choose"}
                        {:label "Choose parent tag"
                         :disabled true
                         :selected true
                         :value "Choose"})
                      options)]
    (shui/select
     {:on-value-change on-select
      :default-value (:block/uuid (:logseq.property/parent page))}
     (shui/select-trigger
      {:class "!px-2 !py-0 !h-8 !border-none"}
      (shui/select-value
       {:placeholder "Empty"}))
     (shui/select-content
      (shui/select-group
       (for [{:keys [label value disabled]} options]
         (shui/select-item {:value value :disabled disabled} label)))))))

(rum/defc page-parent
  [page parent]
  (let [repo (state/get-current-repo)
        parent-id (:block/uuid parent)]
    (class-select page parent-id (fn [value]
                                   (if (uuid? value)
                                     (db/transact!
                                      repo
                                      [{:db/id (:db/id page)
                                        :logseq.property/parent [:block/uuid value]}]
                                      {:outliner-op :save-block})
                                     (db/transact!
                                      repo
                                      [[:db.fn/retractAttribute (:db/id page) :logseq.property/parent]]
                                      {:outliner-op :save-block}))))))

(rum/defcs configure < rum/reactive db-mixins/query
  "Configure a class page"
  [state page {:keys [show-title?]
               :or {show-title? true}}]
  (let [page-id (:db/id page)
        page (when page-id (db/sub-block page-id))]
    (when page
      [:div.property-configure.grid.gap-2
       (when show-title? [:h1.title.mb-4 "Configure tag"])

       (comment
         (when-not (= (:db/ident page) :logseq.class/Root)
           [:div.grid.grid-cols-5.gap-1.items-center.class-parent
            [:div.col-span-2 "Parent tag:"]
            (if config/publishing?
              [:div.col-span-3
               (if-let [parent-class (some-> (:db/id (:logseq.property/parent page))
                                             db/entity)]
                 [:a {:on-click #(route-handler/redirect-to-page! (:block/uuid parent-class))}
                  (:block/title parent-class)]
                 "None")]
              [:div.col-span-3
               (let [parent (some-> (:db/id (:logseq.property/parent page))
                                    db/entity)]
                 (page-parent page parent))])]))

       (when (:logseq.property/parent page)
         (let [ancestor-pages (loop [parents [page]]
                                (if-let [parent (:logseq.property/parent (last parents))]
                                  (recur (conj parents parent))
                                  parents))
               class-ancestors (reverse ancestor-pages)]
           (when (> (count class-ancestors) 2)
             [:div.grid.grid-cols-5.gap-1.items-center.class-ancestors
              [:div.col-span-2 "Ancestor tags:"]
              [:div.col-span-3
               (interpose [:span.opacity-50.text-sm " > "]
                          (map (fn [{class-name :block/title :as ancestor}]
                                 (if (= class-name (:block/title page))
                                   [:span class-name]
                                   [:a {:on-click #(route-handler/redirect-to-page! (:block/uuid ancestor))} class-name]))
                               class-ancestors))]])))])))

(defn class-children-aux
  [class {:keys [default-collapsed?] :as opts}]
  (let [children (:logseq.property/_parent class)]
    (when (seq children)
      [:ul
       (for [child (sort-by :block/title children)]
         (let [title [:li.ml-2 (block/page-reference false (:block/title child) {:show-brackets? false} nil)]]
           (if (seq (:logseq.property/_parent child))
             (ui/foldable
              title
              (class-children-aux child opts)
              {:default-collapsed? default-collapsed?})
             title)))])))

(rum/defc class-children
  [class]
  (when (seq (:logseq.property/_parent class))
    (let [children-pages (model/get-structured-children (state/get-current-repo) (:db/id class))
          ;; Expand children if there are about a pageful of total blocks to display
          default-collapsed? (> (count children-pages) 30)]
      [:div.mt-4
       (ui/foldable
        [:h2.font-medium "Children (" (count children-pages) ")"]
        [:div.mt-2.ml-1 (class-children-aux class {:default-collapsed? default-collapsed?})]
        {:default-collapsed? false
         :title-trigger? true})])))
