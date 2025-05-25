(ns capacitor.components.blocks
  (:require [capacitor.components.common :as cc-common]
            [capacitor.components.editor :as cc-editor]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.page :as cp-page]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as db-conn]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.state :as fstate]
            [frontend.util.cursor :as cursor]
            [promesa.core :as p]
            [rum.core :as rum]))

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

;; handlers
(defn insert-new-block!
  [content opts]
  (let [opts' (merge {:sibling? true}
                     opts {:edit-block? false})]
    (editor-handler/api-insert-new-block! content opts')))

(defn dom-prev-block
  [^js current-block-node]
  (when-let [prev-node (loop [node current-block-node]
                         (when-let [node (some-> node (.-previousSibling))]
                           (when node
                             (if (dom/has-class? node "block-item")
                               node
                               (recur node)))))]
    (let [uuid' (.-blockid (.-dataset prev-node))]
      (db-model/get-block-by-uuid (uuid uuid')))))

(defn dom-next-block
  [^js current-block-node]
  (when-let [next-node (loop [node current-block-node]
                         (when-let [node (some-> node (.-nextSibling))]
                           (when node
                             (if (dom/has-class? node "block-item")
                               node
                               (recur node)))))]
    (let [uuid' (.-blockid (.-dataset next-node))]
      (db-model/get-block-by-uuid (uuid uuid')))))

;; components
(rum/defc block-editor
  [block]
  (let [content (:block/title block)
        block-uuid (:block/uuid block)
        current-repo (fstate/get-current-repo)]

    (cc-editor/editor-aux content
                          {:on-focused!
                           (fn [^js input]
                             (let [cursor-at (some-> (state/get-editing-opts) :cursor-at)]
                               (if (number? cursor-at)
                                 (cursor/move-cursor-to input cursor-at)
                                 (cursor/move-cursor-to-end input))))

                           :on-bounded!
                           (fn [dir ^js input]
                             (case dir
                               :up (when-let [prev-block (dom-prev-block (.closest input ".block-item"))]
                                     (state/edit-block! prev-block {}))
                               :down (when-let [next-block (dom-next-block (.closest input ".block-item"))]
                                       (js/console.log next-block)
                                       (state/edit-block! next-block {}))
                               :dune))

                           :on-outside!
                           (fn [^js e]
                             (let [edit-target? (some-> e (.-target) (cc-common/get-dom-block-uuid))]
                               (when edit-target?
                                 (cc-common/keep-keyboard-open e))
                               (when (and (not edit-target?)
                                          (= block (:editing-block @state/*state)))
                                 (state/exit-editing!))))

                           :on-save!
                           (fn [content {:keys [enter? esc?]}]
         ;; update block content
                             (-> (do (when (or enter? esc?) (state/exit-editing!))
               ;; check block exist?
                                     (when-not (db-utils/entity (:db/id block))
                                       (throw nil))
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
                                                           (js/requestAnimationFrame #(state/edit-block! new-block))))))))

                                 (p/catch #(notification/show! (str %) :error))))

                           :on-delete!
                           (fn [content]
                             (let [prev-block (db-model/get-prev (db-conn/get-db) (:db/id block))
                                   parent-block (:block/parent block)]
                               (cond
                                 (and (nil? prev-block) (nil? parent-block)) nil

                                 :else
                                 (let [has-children? (seq (:block/_parent block))]
                                   (when (and (not has-children?) prev-block)
                                     (p/do!
                                      (when prev-block (cc-common/keep-keyboard-open nil))
                                      (editor-handler/delete-block-aux! block)
                                      (state/set-state! [:modified-blocks (:block/uuid block)] (js/Date.now))
                                      (when (and (false? (some-> content (string/trim) (string/blank?))) prev-block)
                                        (editor-handler/save-block! current-repo prev-block
                                                                    (str (:block/title prev-block) content)))
                                      (state/set-state! [:modified-blocks (:block/uuid prev-block)] (js/Date.now))
                                      (js/requestAnimationFrame #(state/edit-block! prev-block
                                                                                    {:cursor-at (count (:block/title prev-block))}))))))
                               (prn :debug "delete node:" (:db/id block) (:block/title prev-block))))})))

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
         (set-editing! false))
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
  [root-block]
  (let [[block set-block!] (rum/use-state root-block)
        [modified-ts] (state/use-app-state [:modified-blocks (:block/uuid block)])
        page? (db-model/page? block)
        children (:block/_parent block)
        blocks (some-> children (seq) (db-model/sort-by-order))]

    (rum/use-effect!
     (fn []
       (set-block! (db-utils/entity (:db/id root-block)))
       #())
     [modified-ts root-block])

    ;(js/console.log "=>> blocks:" (:block/title root) (count blocks))
    [:div.app-blocks-container
     {:class (when page? "as-page")}
     (blocks-list blocks)]))

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

(rum/defc page-blocks-classic
  [page]
  [:div.app-page-blocks.as-classic
   (cp-page/page-blocks-cp page {})])

(rum/defc page
  [block & {:keys [reload-pages!]}]
  (let [[^js nav] (state/use-nav-root)
        [page set-page!] (rum/use-state (let [eid (or (:db/id block)
                                                      (when-let [id (:block/uuid block)]
                                                        [:block/uuid id]))]
                                          (db-utils/entity eid)))
        title (or (:block/title block) (:block/title page))
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
                                                                                  (when (fn? reload-pages!)
                                                                                    (reload-pages!)))
                                                                                {:error-handler (fn [^js e]
                                                                                                  (js/console.error e))}))}
                                            (ionic/tabler-icon "trash" {:size 26})))

       (ionic/ion-title title)))

     (ionic/ion-content {:class "ion-padding"}
                        (if loading?
                          [:p.text-xl.text-center "Loading ..."]
                          (page-blocks-classic page))))))
