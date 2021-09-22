(ns frontend.components.external
  (:require [rum.core :as rum]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]
            [frontend.ui :as ui]
            [reitit.frontend.easy :as rfe]))

(defonce *roam-importing? (atom nil))
(defonce *opml-importing? (atom nil))
(defonce *opml-imported-pages (atom nil))
(rum/defc import-cp < rum/reactive
  []
  (let [roam-importing? (rum/react *roam-importing?)
        opml-importing? (rum/react *opml-importing?)]
    [:div#import
     [:h1.title "Import JSON from Roam Research"]

     [:input
      {:id "import-roam"
       :type "file"
       :on-change (fn [e]
                    (let [file (first (array-seq (.-files (.-target e))))
                          file-name (gobj/get file "name")]
                      (if (string/ends-with? file-name ".json")
                        (do
                          (reset! *roam-importing? true)
                          (let [reader (js/FileReader.)]
                            (set! (.-onload reader)
                                  (fn [e]
                                    (let [text (.. e -target -result)]
                                      (external-handler/import-from-roam-json! text
                                                                               #(reset! *roam-importing? false)))))
                            (.readAsText reader file)))
                        (notification/show! "Please choose a JSON file."
                                            :error))))}]
     [:div.mt-4
      (case roam-importing?
        true (ui/loading "Loading")
        false [:b "Importing finished!"]
        nil)]
     ;;
     [:h1.title "Import OPML"]

     [:input
      {:id "import-opml"
       :type "file"
       :on-change (fn [e]
                    (let [file (first (array-seq (.-files (.-target e))))
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
                                                                            (reset! *opml-importing? false))))))
                            (.readAsText reader file)))
                        (notification/show! "Please choose a OPML file."
                                            :error))))}]
     [:div.mt-4
      (case opml-importing?
        true (ui/loading "Loading")
        false [:div
               [:b "Importing finished!"]
               [:tr
                (mapv (fn [page-name] [:tb
                                       [:a {:href (rfe/href :page {:name page-name})} page-name]])
                      @*opml-imported-pages)]]
        nil)]]))
