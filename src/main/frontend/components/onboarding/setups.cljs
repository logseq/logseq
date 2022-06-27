(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.util :as util]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [clojure.string :as string]
            [goog.object :as gobj]))

(defonce DEVICE (if (util/mobile?) "phone" "computer"))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.flex-1
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span [:strong (ui/icon "heart")] "Welcome to " [:strong "Logseq!"]]
         [:span [:strong (ui/icon "file-import")] "Import existing notes"])]

      [:h2
       (if picker?
         "First you need to choose a folder where Logseq will store your thoughts, ideas, notes."
         "You can also do this later in the app.")]

      content])])

(rum/defc mobile-intro
  []
  [:div.mobile-intro
   (cond
     (mobile-util/native-ios?)
     [:div
      [:ul
       [:li "Save them in " [:span.font-bold "iCloud Drive's Logseq directory"] ", and sync them across devices using iCloud."]
       [:li "Save them in Logseq's directory of your device's local storage."]]]

     (mobile-util/native-android?)
     [:div
      "You can save them in your local storage, and use any third-party sync service to keep your notes sync with other devices. "
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
  [_state]
  (let [parsing? (state/sub :repo/parsing-files?)]

    (setups-container
     :picker
     [:article.flex
      [:section.a
       [:strong "Let’s get you set up."]
       [:small (str "Where on your " DEVICE " do you want to save your work?")
        (when (mobile-util/native-platform?)
          (mobile-intro))]

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
              [[:strong "Choose a folder"]
               [:small "Open existing directory or Create a new one"]])]]]
         [:div.px-5
          (ui/admonition :warning
                         [:p "It seems that your browser doesn't support the "
                          [:a {:href   "https://web.dev/file-system-access/"
                               :target "_blank"}
                           "new native filesystem API"]
                          [:span ", please use any Chromium 86+ based browser like Chrome, Vivaldi, Edge, etc. Notice that the API doesn't support mobile browsers at the moment."]])])]
      [:section.b.flex.items-center.flex-col
       [:p.flex
        [:i.as-flex-center (ui/icon "zoom-question" {:style {:fontSize "22px"}})]
        [:span.flex-1.flex.flex-col
         [:strong "How Logseq saves your work"]
         [:small.opacity-60 "Inside the directory you choose, Logseq will create 4 folders."]]]

       [:p.text-sm.pt-5.tracking-wide
        [:span (str "Each page is a file stored only on your " DEVICE ".")]
        [:br]
        [:span "You may choose to sync it later."]]

       [:ul
        (for [[title label icon]
              [["Graphics & Documents" "/assets" "artboard"]
               ["Daily notes" "/journals" "calendar-plus"]
               ["PAGES" "/pages" "file-text"]
               []
               ["APP Internal" "/logseq" "tool"]
               ["Config File" "/logseq/config.edn"]]]
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

(defonce *roam-importing? (atom nil))
(defonce *lsq-importing? (atom nil))
(defonce *opml-importing? (atom nil))
(defonce *opml-imported-pages (atom nil))

(defn- finished-cb
  []
  (notification/show! "Import finished!" :success)
  (route-handler/redirect-to-home!))

(defn- roam-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".json")
      (do
        (reset! *roam-importing? true)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (external-handler/import-from-roam-json! text
                                                             #(do (reset! *roam-importing? false) (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a JSON file."
                          :error))))

(defn- lsq-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (some-> (gobj/get file "name")
                          (string/lower-case))]
    (cond (string/ends-with? file-name ".edn")
          (do
            (reset! *lsq-importing? true)
            (let [reader (js/FileReader.)]
              (set! (.-onload reader)
                    (fn [e]
                      (let [text (.. e -target -result)]
                        (external-handler/import-from-edn! text
                                                           #(do (reset! *lsq-importing? false) (finished-cb))))))
              (.readAsText reader file)))

          (string/ends-with? file-name ".json")
          (do
            (reset! *lsq-importing? true)
            (let [reader (js/FileReader.)]
              (set! (.-onload reader)
                    (fn [e]
                      (let [text (.. e -target -result)]
                        (external-handler/import-from-json! text
                                                            #(do (reset! *lsq-importing? false) (finished-cb))))))
              (.readAsText reader file)))

          :else
          (notification/show! "Please choose an EDN or a JSON file."
                              :error))))

(defn- opml-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".opml")
      (do
        (reset! *opml-importing? true)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (external-handler/import-from-opml! text
                                                        (fn [pages]
                                                          (reset! *opml-imported-pages pages)
                                                          (reset! *opml-importing? false)
                                                          (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a OPML file."
                          :error))))

(rum/defc importer < rum/reactive
  [{:keys [query-params]}]
  (let [roam-importing? (rum/react *roam-importing?)
        lsq-importing?  (rum/react *lsq-importing?)
        opml-importing? (rum/react *opml-importing?)
        importing?      (or roam-importing? lsq-importing? opml-importing?)]

    (setups-container
     :importer
     [:article.flex.flex-col.items-center.importer.py-16.px-8
      [:section.c.text-center
       [:h1 "Do you already have notes that you want to import?"]
       [:h2 "If they are in a JSON, EDN or Markdown format Logseq can work with them."]]
      [:section.d.md:flex
       [:label.action-input.flex.items-center.mx-2.my-2
        {:disabled importing?}
        [:span.as-flex-center [:i (svg/roam-research 28)]]
        [:div.flex.flex-col
         (if roam-importing?
           (ui/loading "Importing ...")
           [[:strong "RoamResearch"]
            [:small "Import a JSON Export of your Roam graph"]])]
        [:input.absolute.hidden
         {:id        "import-roam"
          :type      "file"
          :on-change roam-import-handler}]]

       [:label.action-input.flex.items-center.mx-2.my-2
        {:disabled importing?}
        [:span.as-flex-center [:i (svg/logo 28)]]
        [:span.flex.flex-col
         (if lsq-importing?
           (ui/loading "Importing ...")
           [[:strong "EDN / JSON"]
            [:small "Import an EDN or a JSON Export of your Logseq graph"]])]
        [:input.absolute.hidden
         {:id        "import-lsq"
          :type      "file"
          :on-change lsq-import-handler}]]

       [:label.action-input.flex.items-center.mx-2.my-2
        {:disabled importing?}
        [:span.as-flex-center (ui/icon "sitemap" {:style {:fontSize "26px"}})]
        [:span.flex.flex-col
         (if opml-importing?
           (ui/loading "Importing ...")
           [[:strong "OPML"]
            [:small " Import OPML files"]])]

        [:input.absolute.hidden
         {:id        "import-opml"
          :type      "file"
          :on-change opml-import-handler}]]]

      (when (= "picker" (:from query-params))
        [:section.e
         [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])])))
