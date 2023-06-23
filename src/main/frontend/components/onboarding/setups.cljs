(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.context.i18n :refer [t]]
            [frontend.components.svg :as svg]
            [frontend.components.widgets :as widgets]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.util :as util]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.mobile.graph-picker :as graph-picker]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.handler.user :as user-handler]
            [clojure.string :as string]
            [goog.object :as gobj]))

(def DEVICE (if (util/mobile?) (t :on-boarding/section-phone) (t :on-boarding/section-computer)))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.flex-1
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span [:strong (ui/icon "heart")] (t :on-boarding/main-title)]
         [:span [:strong (ui/icon "file-import")] (t :on-boarding/importing-main-title)])]

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
                           (widgets/native-fs-api-alert))]))]
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

(defonce *opml-imported-pages (atom nil))

(defn- finished-cb
  []
  (route-handler/redirect-to-home!)
  (notification/show! "Import finished!" :success)
  (ui-handler/re-render-root!))

(defn- roam-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".json")
      (do
        (state/set-state! :graph/importing :roam-json)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (external-handler/import-from-roam-json!
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a JSON file."
                          :error))))

(defn- lsq-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (some-> (gobj/get file "name")
                          (string/lower-case))
        edn? (string/ends-with? file-name ".edn")
        json? (string/ends-with? file-name ".json")]
    (if (or edn? json?)
      (do
        (state/set-state! :graph/importing :logseq)
        (let [reader (js/FileReader.)
              import-f (if edn?
                         external-handler/import-from-edn!
                         external-handler/import-from-json!)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-f
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose an EDN or a JSON file."
                          :error))))

(defn- opml-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".opml")
      (do
        (state/set-state! :graph/importing :opml)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (external-handler/import-from-opml! text
                                                        (fn [pages]
                                                          (reset! *opml-imported-pages pages)
                                                          (state/set-state! :graph/importing nil)
                                                          (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a OPML file."
                          :error))))

(rum/defc importer < rum/reactive
  [{:keys [query-params]}]
  (if (state/sub :graph/importing)
    (let [{:keys [total current-idx current-page]} (state/sub :graph/importing-state)
          left-label [:div.flex.flex-row.font-bold
                      (t :importing)
                      [:div.hidden.md:flex.flex-row
                       [:span.mr-1 ": "]
                       [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                        current-page]]]
          width (js/Math.round (* (.toFixed (/ current-idx total) 2) 100))
          process (when (and total current-idx)
                    (str current-idx "/" total))]
      (ui/progress-bar-with-label width left-label process))
    (setups-container
     :importer
     [:article.flex.flex-col.items-center.importer.py-16.px-8
      [:section.c.text-center
       [:h1 (t :on-boarding/importing-title)]
       [:h2 (t :on-boarding/importing-desc)]]
      [:section.d.md:flex
       [:label.action-input.flex.items-center.mx-2.my-2
        [:span.as-flex-center [:i (svg/roam-research 28)]]
        [:div.flex.flex-col
         [[:strong "RoamResearch"]
          [:small (t :on-boarding/importing-roam-desc)]]]
        [:input.absolute.hidden
         {:id        "import-roam"
          :type      "file"
          :on-change roam-import-handler}]]

       [:label.action-input.flex.items-center.mx-2.my-2
        [:span.as-flex-center [:i (svg/logo 28)]]
        [:span.flex.flex-col
         [[:strong "EDN / JSON"]
          [:small (t :on-boarding/importing-lsq-desc)]]]
        [:input.absolute.hidden
         {:id        "import-lsq"
          :type      "file"
          :on-change lsq-import-handler}]]

       [:label.action-input.flex.items-center.mx-2.my-2
        [:span.as-flex-center (ui/icon "sitemap" {:style {:fontSize "26px"}})]
        [:span.flex.flex-col
         [[:strong "OPML"]
          [:small (t :on-boarding/importing-opml-desc)]]]

        [:input.absolute.hidden
         {:id        "import-opml"
          :type      "file"
          :on-change opml-import-handler}]]]

      (when (= "picker" (:from query-params))
        [:section.e
         [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])])))
