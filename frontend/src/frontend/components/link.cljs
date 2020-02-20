(ns frontend.components.link
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [clojure.string :as string]))

(rum/defc links < rum/reactive
  []
  (let [state (rum/react state/state)
        links (reverse (get state :links))]
    (mui/container
     {:id "root-container"
      :style {:display "flex"
              :justify-content "center"
              ;; TODO: fewer spacing for mobile, 24px
              :margin-top 64}}
     (if (seq links)
       (mui/list
        (for [[idx link] (util/indexed links)]
          (mui/list-item
           {:key (str "link-" idx)}
           (mui/list-item-text
            [:a {:href link
                 :target "_blank"}
             link]))))
       [:div "Loading..."]))))

(rum/defcs dialog < (rum/local "" :link)
  [state open?]
  (let [link (get state :link)]
    (mui/dialog
    {:open open?
     :on-close (fn []
                 (handler/toggle-link-dialog? false))}
    (mui/dialog-title "Add new link")
    (mui/dialog-content
     (mui/text-field
      {:auto-focus true
       :auto-complete "off"
       :margin "dense"
       :id "link"
       :label "Link"
       :full-width true
       :value @link
       :on-change (fn [e] (reset! link (util/evalue e)))}))
    (mui/dialog-actions
     (mui/button {:on-click (fn []
                              (handler/toggle-link-dialog? false))
                  :color "primary"}
       "Cancel")
     (mui/button {:on-click (fn []
                              (when-not (string/blank? @link)
                                (handler/add-new-link @link
                                                      "New link")))
                  :color "primary"}
       "Submit")))))
