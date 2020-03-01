(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            ["@material-ui/core/colors" :as colors]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]))

(rum/defc files-list
  [current-repo files]
  [:div
   (if (seq files)
     (let [files-set (set files)
           prefix [(files-set "tasks.org")]
           files (->> (remove (set prefix) files)
                      (concat prefix)
                      (remove nil?))]
       (mui/list
        (for [file files]
          (mui/list-item
           {:button true
            :key file
            :style {:overflow "hidden"}
            :on-click (fn []
                        (handler/load-file current-repo file)
                        (handler/toggle-drawer? false))}
           (mui/list-item-text file)))))
     "Loading...")])

(rum/defc edit < rum/reactive
  []
  (let [state (rum/react state/state)
        {:keys [current-repo current-file contents]} state]
    (mui/container
     {:id "root-container"
      :style {:display "flex"
              :justify-content "center"
              :margin-top 64}}
     [:div.column
      (let [paths [:editing-files current-file]]
        (mui/textarea {:style {:margin-bottom 12
                               :padding 8
                               :min-height 300}
                       :auto-focus true
                       :on-change (fn [event]
                                    (let [v (util/evalue event)]
                                      (swap! state/state assoc-in paths v)))
                       :default-value (get contents current-file)
                       :value (get-in state/state paths)}))
      (let [path [:commit-message current-file]]
        (mui/text-field {:id "standard-basic"
                        :style {:margin-bottom 12}
                        :label "Commit message"
                        :auto-focus true
                        :on-change (fn [event]
                                     (let [v (util/evalue event)]
                                       (when-not (string/blank? v)
                                         (swap! state/state assoc-in path v))))
                        :default-value (str "Update " current-file)
                        :value (get-in state/state path)}))
      (mui/button {:variant "contained"
                   :color "primary"
                   :on-click (fn []
                               (handler/alter-file current-repo current-file))}
        "Submit")])))
