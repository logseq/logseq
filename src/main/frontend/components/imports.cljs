(ns frontend.components.imports
  "Import data into Logseq."
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.context.i18n :refer [t]]
            [frontend.components.svg :as svg]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.import :as import-handler]
            [clojure.string :as string]
            [goog.object :as gobj]
            [frontend.components.onboarding.setups :as setups]
            [frontend.util.text :as text-util]
            [frontend.util :as util]))

;; Can't name this component as `frontend.components.import` since shadow-cljs
;; will complain about it.

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
                    (import-handler/import-from-roam-json!
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a JSON file."
                          :error))))

(defn- lsq-import-handler
  [e & {:keys [sqlite? graph-name]}]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (some-> (gobj/get file "name")
                          (string/lower-case))
        edn? (string/ends-with? file-name ".edn")
        json? (string/ends-with? file-name ".json")]
    (cond
      sqlite?
      (let [graph-name (string/trim graph-name)
            all-graphs (->> (state/get-repos)
                            (map #(text-util/get-graph-name-from-path (:url %)))
                            set)]
        (cond
          (string/blank? graph-name)
          (notification/show! "Empty graph name." :error)

          (contains? all-graphs graph-name)
          (notification/show! "Please specify another name as another graph with this name already exists!" :error)

          :else
          (let [reader (js/FileReader.)]
            (set! (.-onload reader)
                  (fn []
                    (let [buffer (.-result ^js reader)]
                      (import-handler/import-from-sqlite-db! buffer graph-name finished-cb)
                      (state/close-modal!))))
            (set! (.-onerror reader) (fn [e] (js/console.error e)))
            (set! (.-onabort reader) (fn [e]
                                       (prn :debug :aborted)
                                       (js/console.error e)))
            (.readAsArrayBuffer reader file))))

      (or edn? json?)
      (do
        (state/set-state! :graph/importing :logseq)
        (let [reader (js/FileReader.)
              import-f (if edn?
                         import-handler/import-from-edn!
                         import-handler/import-from-json!)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-f
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
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
        (state/set-state! :graph/importing :opml)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-handler/import-from-opml! text
                                                      (fn [pages]
                                                        (reset! *opml-imported-pages pages)
                                                        (state/set-state! :graph/importing nil)
                                                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a OPML file."
                          :error))))

(rum/defcs set-graph-name-dialog
  < rum/reactive
  (rum/local "" ::input)
  [state sqlite-input-e opts]
  (let [*input (::input state)
        on-submit #(lsq-import-handler sqlite-input-e (assoc opts :graph-name @*input))]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "New graph name:"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2.mb-4
      {:auto-focus true
       :on-change (fn [e]
                    (reset! *input (util/evalue e)))
       :on-key-press (fn [e]
                        (when (= "Enter" (util/ekey e))
                          (on-submit)))}]

     [:div.mt-5.sm:mt-4.flex
      (ui/button "Submit"
        {:on-click on-submit})]]))

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
    (setups/setups-container
     :importer
     [:article.flex.flex-col.items-center.importer.py-16.px-8
      [:section.c.text-center
       [:h1 (t :on-boarding/importing-title)]
       [:h2 (t :on-boarding/importing-desc)]]
      [:section.d.md:flex.flex-col
       [:label.action-input.flex.items-center.mx-2.my-2
        [:span.as-flex-center [:i (svg/logo 28)]]
        [:span.flex.flex-col
         [[:strong "SQLite"]
          [:small (t :on-boarding/importing-sqlite-desc)]]]
        [:input.absolute.hidden
         {:id        "import-sqlite-db"
          :type      "file"
          :on-change (fn [e]
                       (state/set-modal!
                        #(set-graph-name-dialog e {:sqlite? true})))}]]

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
        [:span.as-flex-center [:i (svg/roam-research 28)]]
        [:div.flex.flex-col
         [[:strong "RoamResearch"]
          [:small (t :on-boarding/importing-roam-desc)]]]
        [:input.absolute.hidden
         {:id        "import-roam"
          :type      "file"
          :on-change roam-import-handler}]]

       [:label.action-input.flex.items-center.mx-2.my-2
        [:span.as-flex-center.ml-1 (ui/icon "sitemap" {:size 26})]
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
