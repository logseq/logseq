(ns frontend.components.conversion
  (:require [clojure.core.async :as async]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.handler.page :as page-handler]
            [frontend.handler.conversion :refer [supported-filename-formats write-filename-format! calc-rename-target]]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

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
         [:option {:key format-str :value format-str} format-str]))]]
   [:div.rounded-md.text-sm.opacity-70
    "TODO Junyi: description"]])

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
    ;; would triggered on initialization or refreshed
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
        (reset! *target-format config-format)))
    [:div
     (filename-format-select *target-format @*switch-disabled?)
     (ui/button
      (t :file-rn/confirm-proceed)
      :disabled (not need-persist?)
      :class "text-sm p-1 mr-1"
      :on-click #(do (reset! *dir-format (state/get-filename-format repo)) ;; assure it's uptodate
                     (write-filename-format! repo @*target-format)
                     (reset! *solid-format @*target-format)
                     (reset! *switch-disabled? true)))
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
            promise-fns      (for [[_page file _path tgt] rename-items]
                               #(page-handler/rename-file! file tgt (fn [] nil)))
            promise-fns      (conj promise-fns #(reset! *pages {}))
            rename-all-fn    (fn [] (apply p/chain
                                           (p/resolved nil)
                                           promise-fns))]
        (if (not-empty rename-items)
          [:div
           [:p (t :file-rn/need-action)
            [:a.text-sm
             {:on-click #(state/close-modal!)}
             (t :file-rn/close-panel)]]
           [:table.table-auto
            [:thead
             [:tr [:th (t :file-rn/affected-pages)]
              [:th [:a.text-sm
                    {:on-click rename-all-fn}
                    [:div (t :file-rn/all-action) "(" (count rename-items) ")"]]]]]
            [:tbody
             (for [{:keys [page file status target old-title changed-title]} rename-items]
               (let [path           (:file/path file)
                    ;;  src-file-href  (rfe/href :file {:path path})
                    ;;  page-href      (rfe/href :page {:name (:block/name page)})
                     src-file-name  (gp-util/path->file-name path)
                     tgt-file-name  (str target "." (gp-util/path->file-ext path))
                     rm-item-fn     #(swap! *pages dissoc path)
                     rename-fn      #(page-handler/rename-file! file target rm-item-fn)]
                 [:tr {:key (:block/name page)}
                  [:td [:div [:p "📄 Page: " old-title]]
                   (case status
                     :breaking ;; if properety title override the title, it't not breaking change
                     [:div [:p (t :file-rn/suggest-rename src-file-name) " \"" tgt-file-name \"]
                      [:p (t :file-rn/otherwise-breaking) " \"" changed-title \"]]
                     :unreachable
                     [:div (t :file-rn/unreachable-title changed-title)]
                     ;; default
                     [:div [:p (t :file-rn/optional-rename src-file-name) " \"" tgt-file-name "\" "
                            (t :file-rn/update-filename changed-title)]])]
                  [:td (when (not= status :unreachable)
                         [:a.text-sm
                          {:on-click rename-fn}
                          [:span (t :file-rn/rename)]])]]))]]]
          [:div (t :file-rn/no-action)]))]]))
