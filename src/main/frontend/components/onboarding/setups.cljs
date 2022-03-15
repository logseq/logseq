(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [goog.object :as gobj]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [clojure.string :as string]))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.items-center.justify-center
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span [:strong (ui/icon "heart")] "Welcome to " [:strong "Logseq!"]]
         [:span [:strong (ui/icon "file-import")] "Import existing notes"])]

      [:h2
       (if picker?
         "First you need to choose a folder where logseq will store your thoughts, ideas, notes."
         "You can also do this later in the app.")]

      content])])

(rum/defcs picker < rum/reactive
  [_state]
  (let [parsing? (state/sub :repo/parsing-files?)]

    (setups-container
      :picker
      [:article.flex
       [:section.a
        [:strong "Let’s get you set up."]
        [:small "Where on your computer do you want to save your work?"]
        [:div.choose.flex.flex-col.items-center
         [:i]
         [:div.control
          [:label.action-input.flex.items-center.justify-center.flex-col
           {:on-click #(page-handler/ls-dir-files!
                         (fn []
                           (shortcut/refresh!)))
            :disabled parsing?}

           (if parsing?
             (ui/loading "")
             [[:strong "Choose a folder"]
              [:small "Open existing directory or Create a new one"]])]]]]
       [:section.b.flex.items-center.flex-col
        [:p.flex
         [:i.as-flex-center (ui/icon "zoom-question" {:style {:fontSize "22px"}})]
         [:span.flex-1.flex.flex-col
          [:strong "How logseq saves your work"]
          [:small.opacity-60 "Inside the directory you choose, logseq will create 4 folders."]]]

        [:p.text-sm.pt-5.tracking-wide
         [:span "Each page is a file stored only on your computer."]
         [:br]
         [:span "You may choose to sync it later."]]

        [:ul
         (for [[title label icon]
               [["Graphics & Documents" "/assets" "artboard"]
                ["Daily notes" "/journals" "calendar-plus"]
                ["PAGES" "/pages" "file-text"]
                []
                ["APP Internal" "/logseq" "tool"]
                ["Configs File" "/logseq/config.edn"]]]
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
(defonce *opml-importing? (atom nil))
(defonce *opml-imported-pages (atom nil))

(rum/defc importer < rum/reactive
  [{:keys [query-params]}]
  (let [roam-importing? (rum/react *roam-importing?)
        opml-importing? (rum/react *opml-importing?)
        finished-cb     (fn []
                          (notification/show! "Finished!" :success)
                          (route-handler/redirect-to-home!))]

    (setups-container
      :importer
      [:article.flex.flex-col.items-center.importer
       [:section.c.text-center
        [:h1 "Do you already have notes that you want to import?"]
        [:h2 "If they are in a JSON or Markdown format logseq can work with them."]]
       [:section.d.flex
        [:label.action-input.flex.items-center
         {:disabled (or roam-importing? opml-importing?)}
         [:span.as-flex-center [:i (svg/roam-research 28)]]
         [:span.flex.flex-col
          (if roam-importing?
            (ui/loading "Importing ...")
            [[:strong "RoamResearch"]
             [:small "Import a JSON Export of your Roam graph"]])]
         [:input.absolute.hidden
          {:id        "import-roam"
           :type      "file"
           :on-change (fn [e]
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
                              :error))))}]]

        [:label.action-input.flex.items-center
         {:disabled (or roam-importing? opml-importing?)}
         [:span.as-flex-center (ui/icon "sitemap" {:style {:fontSize "26px"}})]
         [:span.flex.flex-col
          (if opml-importing?
            (ui/loading "Importing ...")
            [[:strong "OPML"]
             [:small " Import OPML files"]])]

         [:input.absolute.hidden
          {:id        "import-opml"
           :type      "file"
           :on-change (fn [e]
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
                              :error))))}]]]

       (when (= "picker" (:from query-params))
         [:section.e
          [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])])))
