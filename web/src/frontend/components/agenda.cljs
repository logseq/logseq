(ns frontend.components.agenda
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.format.org.block :as block]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.format.org-mode :as org]
            [frontend.components.sidebar :as sidebar]
            [frontend.db :as db]
            [frontend.ui :as ui]))

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

(rum/defc children-cp
  [children]
  (let [children-json (js/JSON.stringify (clj->js children))
        html (org/json->html children-json)]
    (util/raw-html html)))

(rum/defc marker-cp
  [marker]
  (if marker
    [:span {:class (str "marker-" (string/lower-case marker))
            :style {:margin-left 8}}
     (if (contains? #{"DOING" "IN-PROGRESS"} marker)
       (str " (" marker ")"))]))

(rum/defc tags-cp
  [tags]
  [:span
   (for [{:keys [tag/name]} tags]
     [:span.tag {:key name}
      [:span
       name]])])

(rum/defq agenda <
  {:q (fn [state] (db/sub-agenda))}
  [state tasks]
  (sidebar/sidebar
   [:div#agenda
    [:h2.mb-3 "Agenda"]
    (if (seq tasks)
      [:div.ml-1
       (let [parent-tasks (block/group-by-parent (block/sort-tasks tasks))]
         (for [[parent tasks] parent-tasks]
           (let [parent (cond
                          (string? parent)
                          parent

                          (and (map? parent)
                               (:label parent))
                          (title-cp (:label parent))

                          :else
                          "uncategorized")]
             [:div.mt-10
              [:h4.mb-3.text-gray-500 parent]
              (for [{:heading/keys [uuid marker title priority level tags children timestamps meta repo file] :as task} tasks]
                [:div.mb-2
                 {:key (str "task-" uuid)
                  :style {:padding-left 8
                          :padding-right 8}}
                 [:div.column
                  [:div.row {:style {:align-items "center"}}
                   (case marker
                     (list "DOING" "IN-PROGRESS" "TODO")
                     (ui/checkbox {:on-change (fn [_]
                                                ;; FIXME: Log timestamp
                                                (handler/check repo file marker (:pos meta)))})

                     "WAIT"
                     [:span {:style {:font-weight "bold"}}
                      "WAIT"]

                     "DONE"
                     (ui/checkbox {:checked true
                                   :on-change (fn [_]
                                                ;; FIXME: Log timestamp
                                                (handler/uncheck repo file (:pos meta))
                                                )})

                     nil)
                   [:div.row.ml-2
                    (if priority
                      [:span.priority.mr-1
                       (str "#[" priority "]")])
                    (title-cp title)
                    (marker-cp marker)
                    (when (seq tags)
                      (tags-cp tags))]]
                  (when (seq timestamps)
                    (timestamps-cp timestamps))

                  ;; FIXME: parse error
                  ;; (when (seq children)
                  ;;   (children-cp children))

                  ]]
                )])))]
      "Empty")]))
