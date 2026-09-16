(ns frontend.components.library
  "Library page"
  (:require [clojure.string :as string]
            [frontend.components.select :as components-select]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.library :as library-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- block->item
  [block]
  {:value (:db/id block)
   :label (:block/title block)})

(defn merge-library-select-items
  "Show current Library members plus unfiled search hits."
  [member-items search-blocks input]
  (let [search-items (map block->item search-blocks)
        query (string/trim (or input ""))
        visible-members (if (string/blank? query)
                          member-items
                          (filter (fn [item]
                                    (string/includes? (string/lower-case (or (:label item) ""))
                                                      (string/lower-case query)))
                                  member-items))
        seen (atom #{})]
    (into []
          (keep (fn [item]
                  (let [value (:value item)]
                    (when-not (contains? @seen value)
                      (swap! seen conj value)
                      item))))
          (concat visible-members search-items))))

(hsx/defc select-pages
  [library-page]
  (let [child-uuids (db-hooks/use-children (:block/uuid library-page))
        [members set-members!] (hooks/use-state [])
        [result set-result!] (hooks/use-state nil)
        [input set-input!] (hooks/use-state "")
        member-items (library-handler/member-items members)
        member-ids (into #{} (map :value) member-items)
        [selected-choices set-selected-choices!] (hooks/use-state member-ids)
        items (merge-library-select-items member-items result input)]
    (hooks/use-effect!
     (fn []
       (set-selected-choices! member-ids))
     [member-ids])
    (hooks/use-effect!
     (fn []
       (if (seq child-uuids)
         (let [cancelled? (atom false)]
           (-> (db-async/<get-block-summaries (state/get-current-repo) child-uuids)
               (p/then (fn [summaries]
                         (when-not @cancelled?
                           (set-members! (or summaries [])))))
               (p/catch (fn [_]
                          (when-not @cancelled?
                            (set-members! [])))))
           #(reset! cancelled? true))
         (do
           (set-members! [])
           nil)))
     [child-uuids])
    (hooks/use-effect!
     (fn []
       (if (string/blank? input)
         (set-result! nil)
         (p/let [result (search/block-search (state/get-current-repo) input {:enable-snippet? false
                                                                             :built-in? false
                                                                             :page-only? true
                                                                             :library-page-search? true})]
           (set-result! result))))
     [(hooks/use-debounced-value input 200)])
    (components-select/select
     {:items items
      :extract-fn :label
      :extract-chosen-fn :value
      :selected-choices selected-choices
      :on-chosen (fn [chosen selected?]
                   (if selected?
                     (let [chosen-block (some #(when (= chosen (:db/id %)) %) result)]
                       (when chosen-block
                         (editor-handler/move-blocks! [chosen-block] library-page {:bottom? true})
                         (set-selected-choices! (conj selected-choices chosen))))
                     (-> (library-handler/<confirm-remove-page! chosen)
                         (p/then (fn [removed?]
                                   (when removed?
                                     (set-selected-choices! (disj selected-choices chosen))))))))
      :multiple-choices? true
      :input-default-placeholder (t :library/add-pages)
      :show-new-when-not-exact-match? false
      :on-input set-input!
      :input-opts {:class "!p-1 !text-sm"}
      :clear-input-on-chosen? false})))

(hsx/defc add-pages
  [library-page]
  [:div.ls-add-pages.px-1.mt-4
   [:p.text-sm.text-muted-foreground.mb-3
    (t :library/tip)]
   (shui/button
    {:variant :secondary
     :size :sm
     :class "text-muted-foreground hover:text-foreground"
     :on-click (fn [e]
                 (shui/popup-show!
                  (.-target e)
                  (fn []
                    [:div {:style {:min-height 120}}
                     (select-pages library-page)])
                  {:align :start}))}
    (ui/icon "plus" {:size 16})
    (t :library/add-existing-pages))])
