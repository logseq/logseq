(ns frontend.components.conversion
  (:require [clojure.core.async :as async]
            [cljs.core.async.interop :refer [p->c]]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [logseq.graph-parser.util :as gp-util]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :refer [supported-filename-formats write-filename-format! calc-rename-target]]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [rum.core :as rum]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.fs.sync :as sync]
            [frontend.handler.notification :as notification]))

(defn- ask-for-re-index
  "Multiple-windows? (optional) - if multiple exist on the current graph
   Dont receive param `repo` as `graph/ask-for-re-index` event doesn't accept repo param"
  ([]
   (p/let [repo (state/get-current-repo)
           multiple-windows? (ipc/ipc "graphHasMultipleWindows" repo)]
     (ask-for-re-index multiple-windows?)))
  ([multiple-windows?]
   (state/pub-event! [:graph/ask-for-re-index (atom multiple-windows?)
                      (ui/admonition :tip [:p (t :file-rn/re-index)])])))

(defn- <close-modal-on-done
  "Ask users to re-index when the modal is exited"
  [sync? rename-items]
  (async/go
    (state/close-modal!)
    (async/<! (async/timeout 100)) ;; modal race condition requires investigation
    (let [renamed-paths (keep (fn [{:keys [file file-name target]}]
                                (when (not= file-name target)
                                  (sync/relative-path (:file/path file)))) rename-items)
          graph-txid (second @sync/graphs-txid)]
      (when (and (seq renamed-paths) sync? graph-txid)
        (async/<!
         (sync/<delete-remote-files-control
          sync/remoteapi
          graph-txid
          renamed-paths))))
    (if sync?
      (notification/show!
       [:div "Please re-index this graph after all the changes are synced."]
       :warning
       false)
      (ask-for-re-index))))

(rum/defc legacy-warning
  [repo *target-format *dir-format *solid-format]
  [:div ;; Normal UX stage 1: show the admonition & button for users using legacy format
   (ui/admonition :warning [:p (t :file-rn/format-deprecated)])
   [:p (t :file-rn/instruct-1)]
   [:p (t :file-rn/instruct-2)
    (ui/button (t :file-rn/confirm-proceed) ;; the button is for triple-lowbar only
               :class "text-md p-2 mr-1"
               :on-click #(do (reset! *target-format :triple-lowbar)
                              (reset! *dir-format (state/get-filename-format repo)) ;; assure it's uptodate
                              (write-filename-format! repo :triple-lowbar)
                              (reset! *solid-format :triple-lowbar)))]
   [:p (t :file-rn/instruct-3)]])

(rum/defc filename-format-select
  "A dropdown menu for selecting the target filename format"
  [*target-format disabled?]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5
    (t :file-rn/select-format)
    [:select.form-select.is-small {:disabled disabled?
                                   :value     (name @*target-format)
                                   :on-change (fn [e]
                                                (let [format-str (util/evalue e)]
                                                  (reset! *target-format (keyword format-str))))}
     (for [format supported-filename-formats]
       (let [format-str (name format)]
         [:option {:key format-str :value format-str} format-str]))]]])

;; UI for files that have been breaking changed. Conversion required to revert the change.
;; UI logic:
;;   When dropdown box item switched, activate the `Proceed` button;
;;   When `Proceed` button clicked, write the filename format to config and allow the renaming actions
(rum/defcs files-breaking-changed < rum/reactive
  (rum/local nil ::pages)          ;; pages require renaming, a map of {path -> [page-entity file-entity]}
  (rum/local nil ::dir-format)     ;; format previously (on `proceed `button clicked)
  (rum/local nil ::target-format)  ;; format to be converted to (on `proceed` button clicked)
  (rum/local nil ::solid-format)   ;; format persisted to config
  (rum/local false ::switch-disabled?) ;; disable the dropdown box when proceeded
  [state]
  (let [repo           (state/sub :git/current-repo)
        *dir-format    (::dir-format state)
        *target-format (::target-format state)
        *solid-format  (::solid-format state)
        *pages         (::pages state)
        need-persist?  (not= @*solid-format @*target-format)
        *switch-disabled? (::switch-disabled? state)]
    (when (nil? @*pages) ;; would triggered on initialization
      (let [pages-with-file (db/get-pages-with-file repo)
            the-keys        (map (fn [[_page file]] (:file/path file)) pages-with-file)]
        (reset! *pages (zipmap the-keys pages-with-file))))
    (when (and (nil? @*dir-format) ;; would triggered on initialization
               (nil? @*solid-format)
               (nil? @*target-format))
      (let [config-format (state/get-filename-format repo)]
        (reset! *dir-format config-format)
        (reset! *solid-format config-format)
        (reset! *target-format :triple-lowbar)))
    [:div
     (when (state/developer-mode?)
       [:div
        (filename-format-select *target-format @*switch-disabled?)
        (ui/button (t :file-rn/select-confirm-proceed) ;; the button is for persisting selected format
                   :disabled (not need-persist?)
                   :class "text-sm p-1 mr-1"
                   :on-click #(do (reset! *dir-format (state/get-filename-format repo)) ;; assure it's uptodate
                                  (write-filename-format! repo @*target-format)
                                  (reset! *solid-format @*target-format)
                                  (reset! *switch-disabled? true)))
        [:hr]])
     [:h1.title (t :settings-page/filename-format)]
     [:div.rounded-md.opacity-70
      [:p (t :file-rn/filename-desc-1)]
      [:p (t :file-rn/filename-desc-2)]
      [:p (t :file-rn/filename-desc-3)]
      [:p (t :file-rn/filename-desc-4)]]
     (when (= @*solid-format :legacy)
       (legacy-warning repo *target-format *dir-format *solid-format))
     [:div.cp__settings-files-breaking-changed {:disabled need-persist?} [:hr]
      (let [rename-items  (->> (vals @*pages)
                               (map (fn [[page file]]
                                      (when-let [ret (calc-rename-target page (:file/path file) @*dir-format @*target-format)]
                                        (merge ret {:page page :file file}))))
                               (remove nil?))
            sync? (file-sync-handler/current-graph-sync-on?)
            <rename-all   #(async/go
                             (doseq [{:keys [file target status]} rename-items]
                               (when (not= status :unreachable)
                                 (async/<! (p->c (page-handler/rename-file! file target (constantly nil) true)))))
                             (<close-modal-on-done sync? rename-items))]

        (if (not-empty rename-items)
          [:div ;; Normal UX stage 2: close stage 1 UI, show the action description as admolition
           (if (and (= @*solid-format :triple-lowbar)
                    (= @*dir-format :legacy))
             (ui/admonition :tip [:p (t :file-rn/need-action)])
             [:p (t :file-rn/need-action)])
           [:p
            (ui/button
             (t :file-rn/all-action (count rename-items))
             :on-click <rename-all
             :class "text-md p-2 mr-1")
            (t :file-rn/or-select-actions)
            [:a {:on-click <close-modal-on-done}
             (t :file-rn/close-panel)]
            (t :file-rn/or-select-actions-2)]
           [:p (t :file-rn/legend)]
           [:table.table-auto
            [:tbody
             (for [{:keys [page file status target old-title changed-title]} rename-items]
               (let [path           (:file/path file)
                     src-file-name  (gp-util/path->file-name path)
                     tgt-file-name  (str target "." (gp-util/path->file-ext path))
                     rm-item-fn     #(swap! *pages dissoc path)
                     rename-fn      #(page-handler/rename-file! file target rm-item-fn)
                     rename-but     [:a {:on-click rename-fn
                                         :title (t :file-rn/apply-rename)}
                                     [:span (t :file-rn/rename src-file-name tgt-file-name)]]]
                 [:tr {:key (:block/name page)}
                  [:td [:div [:p "📄 " old-title]]
                   (case status
                     :breaking ;; if property title override the title, it't not breaking change
                     [:div [:p "🟡 " (t :file-rn/suggest-rename) rename-but]
                      [:p (t :file-rn/otherwise-breaking) " \"" changed-title \"]]
                     :unreachable
                     [:div [:p "🔴 " (t :file-rn/unreachable-title changed-title)]]
                     [:div [:p "🟢 " (t :file-rn/optional-rename) rename-but]])]]))]]]
          [:div "🎉 " (t :file-rn/no-action)]))]]))
