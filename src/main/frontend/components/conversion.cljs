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
            [rum.core :as rum]))

(defn- ask-for-re-index
  "Multiple-windows? (optional) - if multiple exist on the current graph
   Dont receive param `repo` as `graph/ask-for-re-index` event doesn't accept repo param"
  ([]
   (p/let [repo (state/get-current-repo)
           multiple-windows? (ipc/ipc "graphHasMultipleWindows" repo)]
     (ask-for-re-index multiple-windows?)))
  ([multiple-windows?]
   (state/pub-event! [:graph/ask-for-re-index (atom multiple-windows?)
                      (ui/admonition
                       :tip
                       [:p (t :file-rn/re-index)])])))

(defn- <close-modal-on-done
  "Ask users to re-index when the modal is exited"
  []
  (async/go (state/close-settings!)
            (async/<! (async/timeout 100)) ;; modal race condition requires investigation
            (ask-for-re-index)))

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
    ;; would triggered on initialization
    (when (nil? @*pages)
      (let [pages-with-file (db/get-pages-with-file repo)
            the-keys        (map (fn [[_page file]] (:file/path file)) pages-with-file)]
        (reset! *pages (zipmap the-keys pages-with-file))))
    ;; only triggered on initialization
    (when (and (nil? @*dir-format)
               (nil? @*solid-format)
               (nil? @*target-format))
      (let [config-format (state/get-filename-format repo)]
        (reset! *dir-format config-format)
        (reset! *solid-format config-format)
        (reset! *target-format :triple-lowbar)))
    [:div
     [:h1.title (t :file-rn/filename-format)]
     [:div.rounded-md.opacity-70
      [:p (t :file-rn/filename-desc-1)]
      [:p (t :file-rn/filename-desc-2)]
      [:p (t :file-rn/filename-desc-3)]
      [:p (t :file-rn/filename-desc-4)]]
     ;; Normal UX stage 1: show the admonition & button for users using legacy format
     (when (= @*solid-format :legacy)
       [:div
        (ui/admonition
         :warning
         [:p (t :file-rn/format-deprecated)])
        (ui/button (t :file-rn/confirm-proceed)
                   :class "text-sm p-1 mr-1"
                   :on-click #(do (reset! *target-format :triple-lowbar)
                                  (reset! *dir-format (state/get-filename-format repo)) ;; assure it's uptodate
                                  (write-filename-format! repo :triple-lowbar)
                                  (reset! *solid-format :triple-lowbar)))])
     (when (state/developer-mode?)
       [:div [:hr]
        (filename-format-select *target-format @*switch-disabled?)
        (ui/button (t :file-rn/confirm-proceed)
                   :disabled (not need-persist?)
                   :class "text-sm p-1 mr-1"
                   :on-click #(do (reset! *dir-format (state/get-filename-format repo)) ;; assure it's uptodate
                                  (write-filename-format! repo @*target-format)
                                  (reset! *solid-format @*target-format)
                                  (reset! *switch-disabled? true)))])
     [:hr]
     [:div.cp__settings-files-breaking-changed
      {:disabled need-persist?}
      (let [rename-items  (->> (vals @*pages)
                               (map (fn [[page file]]
                                      (when-let [ret (calc-rename-target page
                                                                         (:file/path file)
                                                                         @*dir-format
                                                                         @*target-format)]
                                        (merge ret
                                               {:page page
                                                :file file}))))
                               (remove nil?))
            <rename-all       (fn []
                                (async/go (doseq [{:keys [file target status]} rename-items]
                                            (when (not= status :unreachable)
                                              ;; TODO error handling
                                              (async/<! (p->c (page-handler/rename-file! file target (constantly nil))))))
                                          (<close-modal-on-done)))]

        (if (not-empty rename-items)
          [:div
           ;; Normal UX stage 2: close stage 1 UI, show the action description as admolition
           (if (and (= @*solid-format :triple-lowbar)
                    (= @*dir-format :legacy))
             (ui/admonition
              :tip
              [:p (t :file-rn/need-action)])
             [:p (t :file-rn/need-action)])
           [:p
            (ui/button
             (str (t :file-rn/all-action) " (" (count rename-items) ")")
             :on-click <rename-all
             :class "text-md p-1 mr-1")
            (t :file-rn/or-select-actions)
            [:a.text-sm
             {:on-click <close-modal-on-done}
             (t :file-rn/close-panel)]]
           [:table.table-auto
            [:tbody
             (for [{:keys [page file status target old-title changed-title]} rename-items]
               (let [path           (:file/path file)
                    ;;  src-file-href  (rfe/href :file {:path path})
                    ;;  page-href      (rfe/href :page {:name (:block/name page)})
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
                     :breaking ;; if properety title override the title, it't not breaking change
                     [:div [:p "🟡 " (t :file-rn/suggest-rename) rename-but]
                      [:p (t :file-rn/otherwise-breaking) " \"" changed-title \"]]
                     :unreachable
                     [:div [:p "🔴 " (t :file-rn/unreachable-title changed-title)]]
                     ;; default
                     [:div [:p "🟢 " (t :file-rn/optional-rename) rename-but
                            (t :file-rn/update-filename)]])]]))]]]
          [:div (t :file-rn/no-action)]))]]))
