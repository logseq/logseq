(ns frontend.mobile.footer
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc mobile-bar-command [command-handler icon]
  [:button.bottom-action
   {:on-pointer-down (fn [e]
                       (util/stop e)
                       (command-handler))}
   (ui/icon icon {:size 24})])

(rum/defc footer < rum/reactive
  []
  (when (and (#{:page :home} (state/sub [:route-match :data :name]))
             (not (state/editing?))
             (state/sub :mobile/show-tabbar?)
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
                      (string/lower-case (date/journal-name)))]
         (editor-handler/api-insert-new-block!
          ""
          {:page page
           :edit-block? true
           :replace-empty-target? true}))
      "edit")]))
