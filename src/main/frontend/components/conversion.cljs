(ns frontend.components.conversion
  (:require [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.conversion :as conversion-handler]
            [frontend.handler.notification :as notification]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [frontend.version :refer [dir-version]]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn- get-ver-change-string
  [repo]
  (str " (" (str :repo/dir-version) " " (state/get-dir-version repo) "->" dir-version ")"))

(defn ask-for-re-index
  "Multiple-windows? (optional) - if multiple exist on the current graph
   Dont receive param `repo` as `graph/ask-for-re-index` event doesn't accept repo param"
  ([]
   (p/let [repo (state/get-current-repo)
           multiple-windows? (ipc/ipc "graphHasMultipleWindows" repo)]
     (ask-for-re-index multiple-windows?)))
  ([multiple-windows?]
   (state/pub-event! [:graph/ask-for-re-index (atom multiple-windows?)
                      "Re-indexing is strongly recommended upon this version update."])))

;; UI for files that have been breaking changed. Conversion required to revert the change.
(rum/defcs files-breaking-changed < rum/reactive
  (rum/local nil ::pages)
  (rum/local nil ::stale?)
  [state]
  (let [repo     (state/sub :git/current-repo)
        *stale?  (::stale? state)
        *pages   (::pages state)
        refresh-pages! #(reset! *pages nil)]
    (when (nil? @*pages)
      (reset! *pages (db/get-pages-with-file repo)))
    (when (nil? @*stale?)
      (reset! *stale? (conversion-handler/dir-stale? repo)))
    (when @*stale?
      (let [rename-items  (->> @*pages
                               (map (fn [[page file]]
                                      (let [path (:file/path file)
                                            tgt  (conversion-handler/calc-rename-target repo page path)]
                                        (when tgt [page file path tgt]))))
                               (remove nil?))
            ;; Call when user is happy with the current filenames and no more rename required
            consolidate! #(p/let [_ (conversion-handler/write-dir-version! repo)]
                            (reset! *stale? nil)
                            (ask-for-re-index))
            promise-fns      (for [[_page file _path tgt] rename-items]
                               #(page-handler/rename-file! file tgt (fn [] nil)))
            promise-fns      (conj promise-fns consolidate! refresh-pages!)
            rename-all-fn    (fn [] (apply p/chain
                                           (p/resolved nil)
                                           promise-fns))]
        (if (not-empty rename-items)
          [:div
           [:table.table-auto
            [:thead
             [:tr
              [:th (str (t :file/need-action)
                        (get-ver-change-string repo))
               [:a.text-sm
                {:on-click refresh-pages!}
                [:div "Refresh list"]]
               [:a.text-sm
                {:on-click consolidate!}
                [:div "Write :repo/dir-version"]]]
              [:th
               [:a.text-sm
                {:on-click rename-all-fn}
                [:div "Apply all actions! (" (count rename-items) ")"]]]]]
            [:tbody
             (for [[page file path tgt] rename-items]
               [:tr {:key (:block/name page)}
                (let [src-file-href  (rfe/href :file {:path path})
                      page-href      (rfe/href :page {:name (:block/name page)})
                      prop-title     (get-in page [:block/properties :title])
                      src-file-name  (gp-util/path->file-name path)
                      tgt-file-name  (str tgt "." (gp-util/path->file-ext path))
                      ;; this is the only reliable way, because the :block/name would be changed after re-index
                      original-title (gp-util/title-parsing tgt)
                      changed-title  (-> path
                                         gp-util/path->file-body
                                         gp-util/title-parsing)]
                  [:td
                   [:div "File " [:a {:href src-file-href} src-file-name]
                    " should be renamed to " tgt-file-name]
                   (if (or (= original-title changed-title) (string? prop-title)) ;; if properety title override the title, it't not breaking change
                     [:div "to match up with the latest file naming rule"]
                     [:div "or the title of page " [:a {:href page-href} original-title]
                      " will becomes " changed-title " under the latest file naming rule."])])
                [:td [:a.text-sm
                      {:on-click #(page-handler/rename-file! file tgt refresh-pages!)}
                      [:span "Rename"]]]])]]]
          [:div "No actions required! "
           [:a.text-sm
            {:on-click consolidate!}
            [:div "Write :repo/dir-version"]]])))))

(rum/defc conversion-require-inner < rum/reactive
  [repo close-fn]
  [:div
   [:div.sm:flex.sm:items-start
    [:div.mt-3.text-center.sm:mt-0.sm:text-left
     [:h3#modal-headline.text-lg.leading-6.font-medium
      (get-ver-change-string repo)]]]

   [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
    [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
     [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
      {:type "button"
       :on-click (fn []
                   (route-handler/redirect-to-all-files!)
                   (close-fn))}
      "Click me to redirect to the conversion UI"]]]

   [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
    [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
     [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
      {:type "button"
       :on-click (fn []
                   (conversion-handler/write-dir-version! repo)
                   (close-fn))}
      "Click me to write :repo/dir-version"]]]])

(defn conversion-require-dialog
  [repo]
  (fn [close-fn]
    (conversion-require-inner repo close-fn)))

(defn check-for-conversion!
  "Do the conversion checks after the graph is restored from .transit file or newly setup."
  [repo]
  (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" repo)]
    (cond
      ;; Do version updates. Only on the single graph instance on Electron (Desktop)
      ;; Short-circuit the checks.
      (and (conversion-handler/dir-stale? repo)
           (util/electron?)
           (not multiple-windows?))
      (state/set-modal! (conversion-require-dialog repo))

      (and (conversion-handler/dir-stale? repo)
           (util/electron?))
      (notification/show! "Staled filenames detected, and multiple windows are open on this graph. Please close
                               all windows and restart the app to update filenames. Re-index is required
                               after the update."
                          :error)

      (conversion-handler/dir-stale? repo)
      (notification/show! "Staled filenames detected. Please convert the files on the Desktop version of Logseq
                               to avoid potential data-loss. Re-index is required after the update."
                          :error)

      :else
      (p/let [index-stale? (conversion-handler/index-stale? repo)]
        (when index-stale?
          (ask-for-re-index))))))
