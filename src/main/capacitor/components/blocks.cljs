(ns capacitor.components.blocks
  (:require [capacitor.state :as state]
            [frontend.db.model :as db-model]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as fstate]
            [frontend.handler.notification :as notification]
            [capacitor.components.editor :as cc-editor]
            [capacitor.components.common :as cc-common]
            [capacitor.ionic :as ionic]))

(rum/defc edit-block-modal
  [block {:keys [reload-page!]}]
  (let [[^js nav] (state/use-nav-root)
        title (:block/title block)
        *input (rum/use-ref nil)
        close! #(.pop nav)]

    (rum/use-effect!
      (fn []
        (js/setTimeout
          (fn []
            (when-let [^js input (some-> (rum/deref *input)
                                   (.querySelector "textarea"))]
              (.focus input)
              (let [len (.-length (.-value input))]
                (.setSelectionRange input len len))))
          500)
        #())
      [])

    (ionic/ion-page
      (ionic/ion-header
        (ionic/ion-toolbar
          (ionic/ion-buttons {:slot "end"}
            (when (not (nil? (:db/id block)))
              (ionic/ion-button {:fill "clear"
                                 :class "opacity-80 text-red-500"
                                 :on-click (fn []
                                             (-> (editor-handler/delete-block-aux! block)
                                               (p/then (fn []
                                                         (close!)
                                                         (reload-page!)))))}
                (ionic/tabler-icon "trash" {:size 26}))))
          (ionic/ion-title (or title "Untitled"))))

      (ionic/ion-content {:class "ion-padding"}
        [:div.py-2
         (ionic/ion-textarea {:placeholder "block content"
                              :ref *input
                              :class "bg-gray-100"
                              :auto-grow true
                              :autofocus true
                              :value (:block/title block)})]
        [:div.flex.py-2.justify-between
         (ionic/ion-button
           {:on-click #(close!)
            :fill "clear"}
           "Cancel")
         (ionic/ion-button
           {:on-click (fn []
                        (let [new? (nil? (:db/id block))
                              val (.-value (.querySelector (rum/deref *input) "textarea"))]
                          (if-let [page (and new? (:block/page block))]
                            (-> (editor-handler/api-insert-new-block! val {:page (:db/id page)
                                                                           :sibling? true})
                              (p/then (fn []
                                        (close!)
                                        (reload-page!))))
                            (-> (editor-handler/save-block! (fstate/get-current-repo)
                                  (:block/uuid block) val)
                              (p/then (fn []
                                        (close!)
                                        (reload-page!)))))))
            :class ""} "Save")]))))

(defn nav-to-edit-block!
  [block opts]
  (some-> @state/*nav-root
    (.push #(edit-block-modal block opts))))

;; handlers
(defn insert-new-block!
  [content opts]
  (let [opts' (merge {:sibling? true}
                opts {:edit-block? false})]
    (editor-handler/api-insert-new-block! content opts')))

;; components
(rum/defc block-editor
  [block]
  (let [content (:block/title block)
        exit! #(state/set-state! :editing-block nil)]
    (cc-editor/editor-aux content
      {:on-outside!
       (fn [^js e]
         (let [edit-target? (some-> e (.-target) (cc-common/get-dom-block-uuid))]
           (when edit-target?
             (cc-common/keep-keyboard-open e))
           (when (and (not edit-target?)
                   (= block (:editing-block @state/*state)))
             (exit!))))
       :on-save!
       (fn [content {:keys [enter?]}]
         (let [block-uuid (:block/uuid block)
               current-repo (fstate/get-current-repo)]

           ;; update block content
           (-> (do (when enter? (exit!))
                 (editor-handler/save-block! current-repo block-uuid content))
             (p/then (fn []
                       (state/set-state! [:modified-blocks block-uuid] (js/Date.now))
                       (when enter?
                         ;; create new block
                         (cc-common/keep-keyboard-open nil)
                         (-> (insert-new-block! "" {:block-uuid block-uuid})
                           (p/then (fn [new-block]
                                     (prn :debug "new block:" new-block)
                                     (when-let [parent-block (:block/parent new-block)]
                                       (state/set-state! [:modified-pages (:block/uuid parent-block)] (js/Date.now)))
                                     ;; edit the new block
                                     (js/requestAnimationFrame #(state/set-editing-block! new-block))
                                     )))
                         )))
             (p/catch #(notification/show! (str %) :error)))))
       })))

(rum/defc block-content
  [block]
  (let [content (:block/title block)]
    (cc-editor/content-aux content {})))

(rum/defc block-item
  [block']
  (let [[block set-block!] (rum/use-state block')
        block-uuid (:block/uuid block)
        [editing-block set-editing-block!] (state/use-app-state :editing-block)
        [modified-ts] (state/use-app-state [:modified-blocks block-uuid])
        [editing? set-editing!] (rum/use-state false)]

    (rum/use-effect!
      (fn []
        ;; rerender modified block
        (-> (db-utils/entity (:db/id block)) (set-block!))
        #())
      [modified-ts block'])

    (rum/use-effect!
      (fn []
        (if (and editing-block
              (= block-uuid (:block/uuid editing-block)))
          (set-editing! true)
          (set-editing! false
            ;(fn [editing?]
            ;  (if editing?
            ;    () false))
            ))
        #())
      [editing-block])

    (when block
      [:li.block-item.normalize-text-style
       {:on-click (fn []
                    (when-not editing?
                      (set-editing-block! block)))
        :data-blockid (:block/uuid block)}
       [:div.block-bullet-marker
        [:strong "·"]]
       [:div.block-content-or-editor
        {:class (when editing? "is-editing")}
        (if editing?
          (block-editor block)
          (block-content block))]])))

(rum/defc blocks-list
  [blocks]
  (when (seq blocks)
    [:ul.app-blocks-list
     (for [block blocks]
       (rum/with-key (block-item block) (str (:block/uuid block))))]))

(rum/defc blocks-container
  [root]
  [:div.app-blocks-container
   (let [block? (not (db-model/page? root))
         children (:block/_parent root)
         blocks (if block? [root] (db-model/sort-by-order children))]
     ;(js/console.log "==>> blocks:" (:block/title root) (count blocks))
     (blocks-list blocks))])

(rum/defc page-blocks
  [page-name-or-entity]
  (let [[page set-page!] (rum/use-state
                           (if (:db/id page-name-or-entity) page-name-or-entity
                             (db-model/get-page page-name-or-entity)))
        [modified-page] (state/use-app-state [:modified-pages (:block/uuid page)])
        [_loading? set-loading!] (rum/use-state false)]

    (rum/use-effect!
      ;; sync page blocks
      (fn []
        (-> (db-async/<get-block (fstate/get-current-repo) (:block/uuid page))
          (p/then (fn [page]
                    (prn :debug "re-render page:" (:block/title page))
                    (set-page! (db-utils/entity (:db/id page)))))
          (p/finally #()))
        #())
      [modified-page])

    (when page
      [:div.app-page-blocks.mb-4
       (blocks-container page)])))

(rum/defc page [block {:keys [reload-pages!]}]
  (let [[^js nav] (state/use-nav-root)
        [page set-page!] (rum/use-state (db-utils/entity (:db/id block)))
        title (or (:block/title block) (:block.temp/cached-title block))
        [loading? set-loading!] (rum/use-state true)
        rerender! (fn []
                    (set-page! (db-utils/entity (:db/id block)))
                    (state/set-state! [:modified-pages (:block/uuid block)] (js/Date.now)))]

    (rum/use-effect!
      ;; sync page blocks
      (fn []
        (-> (db-async/<get-block (fstate/get-current-repo) (:block/uuid block))
          (p/then #(set-page! (db-utils/entity (:db/id %))))
          (p/finally #(set-loading! false)))
        #())
      [])

    (ionic/ion-page
      (ionic/ion-header
        (ionic/ion-toolbar
          (ionic/ion-buttons {:slot "start"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "arrow-left" {:size 26})))

          (ionic/ion-buttons {:slot "end"}
            (ionic/ion-button {:fill "clear"
                               :class "opacity-80"
                               :on-click rerender!}
              (ionic/tabler-icon "refresh" {:size 26}))
            (ionic/ion-button {:fill "clear"
                               :class "opacity-80 text-red-500"
                               :on-click (fn []
                                           (page-handler/<delete! (:block/uuid block)
                                             (fn []
                                               (.pop nav)
                                               (reload-pages!))
                                             {:error-handler (fn [^js e]
                                                               (js/console.error e))}))}
              (ionic/tabler-icon "trash" {:size 26})))

          (ionic/ion-title title)))

      (ionic/ion-content {:class "ion-padding"}
        (if loading?
          [:p.text-xl.text-center "Loading ..."]
          (let [edit-opts {:reload-page! rerender!}]
            [:<>
             (when-let [children (:block/_parent page)]
               [:ul.mt-2
                {:class "min-h-[80px]"}
                (for [block children]
                  [:li.text-xl {:on-click #(nav-to-edit-block! block edit-opts)} (:block/title block)])])
             [:p.pt-3.flex
              (ionic/ion-button
                {:fill "outline"
                 :on-click #(nav-to-edit-block! {:block/page page} edit-opts)
                 :class "w-full"}
                "+ Add")]]))
        ))))
