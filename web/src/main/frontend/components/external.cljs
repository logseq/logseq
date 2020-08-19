(ns frontend.components.external
  (:require [rum.core :as rum]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.handler.external :as external-handler]))

(rum/defc import-cp < rum/reactive
  []
  [:div#import
   [:h1.title "Import JSON from Roam Research"]
   [:input
    {:id "import-roam"
     :type "file"
     :on-change (fn [e]
                  (let [file (first (array-seq (.-files (.-target e))))
                        file-name (gobj/get file "name")]
                    (if (string/ends-with? file-name ".json")
                      (let [reader (js/FileReader.)]
                        (set! (.-onload reader)
                              (fn [e]
                                (let [text (.. e -target -result)]
                                  (external-handler/import-from-roam-json! text))))
                        (.readAsText reader file))
                      (notification/show! "Please choose a JSON file."
                                          :error))))
     }]

   ;; TODO: import status process
   ])
