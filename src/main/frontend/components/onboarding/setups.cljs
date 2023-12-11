(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.context.i18n :refer [t]]
            [frontend.components.widgets :as widgets]
            [frontend.handler.page :as page-handler]
            [frontend.util :as util]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.mobile.graph-picker :as graph-picker]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.handler.user :as user-handler]
            [clojure.string :as string]))

(def DEVICE (if (util/mobile?) (t :on-boarding/section-phone) (t :on-boarding/section-computer)))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.flex-1
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span (t :on-boarding/main-title)]
         [:span (t :on-boarding/importing-main-title)])]

      [:h2
       (if picker?
         (t :on-boarding/main-desc)
         (t :on-boarding/importing-main-desc))]

      content])])

(rum/defc mobile-intro
  []
  [:div.mobile-intro
   (cond
     (mobile-util/native-android?)
     [:div.px-4
      "You can save them in your local storage, and use Logseq Sync or any third-party sync service to keep your notes sync with other devices. "
      "If you prefer to use Dropbox to sync your notes, you can use "
      [:a {:href "https://play.google.com/store/apps/details?id=com.ttxapps.dropsync"
           :target "_blank"}
       "Dropsync"]
      ". Or you can use "
      [:a {:href "https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.lite"
           :target "_blank"}
       "FolderSync"]
      "."]

     :else
     nil)])

(rum/defcs picker < rum/reactive
  [_state onboarding-and-home?]
  (let [parsing?       (state/sub :repo/parsing-files?)
        _              (state/sub :auth/id-token)
        native-ios?    (mobile-util/native-ios?)
        native-icloud? (not (string/blank? (state/sub [:mobile/container-urls :iCloudContainerUrl])))
        logged?        (user-handler/logged-in?)]

    (setups-container
     :picker
     [:article.flex.w-full
      [:section.a.
       (when (and (mobile-util/native-platform?) (not native-ios?))
         (mobile-intro))

       (if native-ios?
         ;; TODO: open for all native mobile platforms
         (graph-picker/graph-picker-cp {:onboarding-and-home? onboarding-and-home?
                                        :logged? logged?
                                        :native-icloud? native-icloud?})

         (if (or (nfs/supported?) (mobile-util/native-platform?))
           [:div.choose.flex.flex-col.items-center
            {:on-click #(page-handler/ls-dir-files!
                         (fn []
                           (shortcut/refresh!)))}
            [:i]
            [:div.control
             [:label.action-input.flex.items-center.justify-center.flex-col
              {:disabled parsing?}

              (if parsing?
                (ui/loading "")
                [[:strong (t :on-boarding/section-btn-title)]
                 [:small (t :on-boarding/section-btn-desc)]])]]]
           [:div.px-5
            (ui/admonition :warning
                           (widgets/native-fs-api-alert))
            [:div.choose.flex.flex-col.items-center
             (ui/button "Open a DB-based Graph"
                        :on-click #(state/pub-event! [:graph/new-db-graph]))]]))]
      [:section.b.flex.items-center.flex-col
       [:p.flex
        [:i.as-flex-center (ui/icon "zoom-question" {:style {:fontSize "22px"}})]
        [:span.flex-1.flex.flex-col
         [:strong (t :on-boarding/section-title)]
         [:small.opacity-60 (t :on-boarding/section-desc)]]]

       [:p.text-sm.pt-5.tracking-wide
        [:span (str (t :on-boarding/section-tip-1 DEVICE))]
        [:br]
        [:span (t :on-boarding/section-tip-2)]]

       [:ul
        (for [[title label icon]
              [[(t :on-boarding/section-assets) "/assets" "whiteboard"]
               [(t :on-boarding/section-journals) "/journals" "calendar-plus"]
               [(t :on-boarding/section-pages) "/pages" "page"]
               []
               [(t :on-boarding/section-app) "/logseq" "tool"]
               [(t :on-boarding/section-config) "/logseq/config.edn"]]]
          (if-not title
            [:li.hr]
            [:li
             {:key title}
             [:i.as-flex-center
              {:class (when (string/ends-with? label ".edn") "is-file")}
              (when icon (ui/icon icon))]
             [:span
              [:strong.uppercase title]
              [:small.opacity-50 label]]]))]]])))
