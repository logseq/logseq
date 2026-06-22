(ns frontend.mobile.footer
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc mobile-bar-command [command-handler icon]
  [:button.bottom-action
   {:on-pointer-down (fn [e]
                       (util/stop e)
                       (command-handler))}
   (ui/icon icon {:size 24})])

(hsx/defc footer
  []
  (let [route-name (state/use-sub [:route-match :data :name])
        show-tabbar? (state/use-sub :mobile/show-tabbar?)]
    (when (and (#{:page :home} route-name)
             (not (state/editing?))
             show-tabbar?
             (state/get-current-repo))
    [:div.cp__footer.w-full.bottom-0.justify-between
     (mobile-bar-command
      #(do (when-not (mobile-util/native-ipad?)
             (state/set-left-sidebar-open! false))
           (state/pub-event! [:go/search]))
      "search")
     (mobile-bar-command state/toggle-document-mode! "notes")
     (mobile-bar-command
      #(let [page (or (state/get-current-page)
                      (string/lower-case (db/get-today-journal-title)))]
         (editor-handler/api-insert-new-block!
          ""
          {:page page
           :edit-block? true
           :replace-empty-target? true}))
      "edit")])))
