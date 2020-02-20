(ns frontend.components.agenda
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.format.org.block :as block]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.format.org-mode :as org]))

(rum/defc timestamps-cp
  [timestamps]
  [:ul
   (for [[type {:keys [date time]}] timestamps]
     (let [{:keys [year month day]} date
           {:keys [hour min]} time]
       [:li {:key type}
        [:span {:style {:margin-right 6}} type]
        [:span (if time
                 (str year "-" month "-" day " " hour ":" min)
                 (str year "-" month "-" day))]]))])

(rum/defc title-cp
  [title]
  (let [title-json (js/JSON.stringify (clj->js title))
        html (org/inline-list->html title-json)]
    (util/raw-html html)))

(rum/defc marker-cp
  [marker]
  [:span {:class (str "marker-" (string/lower-case marker))
          :style {:margin-left 8}}
   (if (contains? #{"DOING" "IN-PROGRESS"} marker)
     (str " (" marker ")"))])

(rum/defc tags-cp
  [tags]
  [:span
   (for [tag tags]
     [:span.tag {:key tag}
      [:span
       tag]])])

(rum/defc agenda
  [tasks]
  [:span "TBD"]
  ;; [:div#agenda
  ;;  (if (seq tasks)
  ;;    (for [[section-name tasks] tasks]
  ;;      [:div.section {:key (str "section-" section-name)}
  ;;       [:h3 section-name]
  ;;       (mui/list
  ;;        (for [[idx {:keys [marker title priority level tags children timestamps meta]}] (util/indexed (block/sort-tasks tasks))]
  ;;          (mui/list-item
  ;;           {:key (str "task-" section-name "-" idx)
  ;;            :style {:padding-left 8
  ;;                    :padding-right 8}}
  ;;           [:div.column
  ;;            [:div.row {:style {:align-items "center"}}
  ;;             (let [marker (case marker
  ;;                            (list "DOING" "IN-PROGRESS" "TODO")
  ;;                            (mui/checkbox {:checked false
  ;;                                           :on-change (fn [_]
  ;;                                                        ;; FIXME: Log timestamp
  ;;                                                        (handler/check marker (:pos meta)))
  ;;                                           :color "primary"
  ;;                                           :style {:padding 0}})

  ;;                            "WAIT"
  ;;                            [:span {:style {:font-weight "bold"}}
  ;;                             "WAIT"]

  ;;                            "DONE"
  ;;                            (mui/checkbox {:checked true
  ;;                                           :on-change (fn [_]
  ;;                                                        ;; FIXME: rollback to the last state if exists.
  ;;                                                        ;; it must not be `TODO`
  ;;                                                        (handler/uncheck (:pos meta)))
  ;;                                           :color "primary"
  ;;                                           :style {:padding 0}})

  ;;                            nil)]
  ;;               (if priority
  ;;                 (mui/badge {:badge-content (string/lower-case priority)
  ;;                             :overlay "circle"}
  ;;                            marker)
  ;;                 marker))

  ;;             [:div.row {:style {:margin-left 8}}
  ;;              (title-cp title)
  ;;              (marker-cp marker)
  ;;              (when (seq tags)
  ;;                (tags-cp tags))]]
  ;;            (when (seq timestamps)
  ;;              (timestamps-cp timestamps))
  ;;            ])))])
  ;;    "Empty")]
  )
