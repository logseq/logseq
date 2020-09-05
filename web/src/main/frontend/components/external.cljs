(ns frontend.components.external
  (:require [rum.core :as rum]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]
            [frontend.ui :as ui]))

(defonce *importing? (atom nil))
(rum/defc import-cp < rum/reactive
  []
  (let [importing? (rum/react *importing?)]
    [:div#import
     [:h1.title "Import JSON from Roam Research (experimental)"]
     [:p.text-sm.mb-8 "Export to Roam Research is coming!"]

     [:input
      {:id "import-roam"
       :type "file"
       :on-change (fn [e]
                    (let [file (first (array-seq (.-files (.-target e))))
                          file-name (gobj/get file "name")]
                      (if (string/ends-with? file-name ".json")
                        (do
                          (reset! *importing? true)
                          (let [reader (js/FileReader.)]
                            (set! (.-onload reader)
                                  (fn [e]
                                    (let [text (.. e -target -result)]
                                      (external-handler/import-from-roam-json! text)
                                      (reset! *importing? false))))
                            (.readAsText reader file)))
                        (notification/show! "Please choose a JSON file."
                                            :error))))}]
     [:div.mt-4
      (case importing?
        true (ui/loading "Loading")
        false [:b "Importing finished!"]
        nil)]]))
