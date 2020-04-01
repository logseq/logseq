(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.format :as format]
            [goog.crypt.base64 :as b64]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))]
    (->> (get-in route-match [:parameters :path :path])
         (b64/decodeString))))

(rum/defq file <
  {:q (fn [state]
        (db/sub-file (get-path state)))
   :did-mount (fn [state]
                (doseq [block (-> (js/document.querySelectorAll "pre code")
                                  (array-seq))]
                  (js/hljs.highlightBlock block))
                state)}
  [state content]
  (let [path (get-path state)
        content (ffirst content)
        suffix (last (string/split path #"\."))]
    (prn {:path path})
    (sidebar/sidebar
     (if (and suffix (contains? #{"md" "markdown" "org"} suffix))
       [:div.flex.justify-center
        [:div.m-6.flex-1 {:style {:max-width 900}}
         [:a {:style {:float "right"}
              :href "/edit"}
          "edit"]
         (if content
           (util/raw-html (format/to-html content suffix))
           "Loading ...")]]
       [:div "File " suffix " is not supported."]))))

;; (rum/defc edit < rum/reactive
;;   []
;;   (let [state (rum/react state/state)
;;         {:keys [current-repo current-file contents]} state]
;;     (mui/container
;;      {:id "root-container"
;;       :style {:display "flex"
;;               :justify-content "center"
;;               :margin-top 64}}
;;      [:div.column
;;       (let [paths [:editing-files current-file]]
;;         (mui/textarea {:style {:margin-bottom 12
;;                                :padding 8
;;                                :min-height 300}
;;                        :auto-focus true
;;                        :on-change (fn [event]
;;                                     (let [v (util/evalue event)]
;;                                       (swap! state/state assoc-in paths v)))
;;                        :default-value (get contents current-file)
;;                        :value (get-in state/state paths)}))
;;       (let [path [:commit-message current-file]]
;;         (mui/text-field {:id "standard-basic"
;;                         :style {:margin-bottom 12}
;;                         :label "Commit message"
;;                         :auto-focus true
;;                         :on-change (fn [event]
;;                                      (let [v (util/evalue event)]
;;                                        (when-not (string/blank? v)
;;                                          (swap! state/state assoc-in path v))))
;;                         :default-value (str "Update " current-file)
;;                         :value (get-in state/state path)}))
;;       (mui/button {:variant "contained"
;;                    :color "primary"
;;                    :on-click (fn []
;;                                (handler/alter-file current-repo current-file))}
;;         "Submit")])))
