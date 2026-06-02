(ns logseq.shui.icon.v2
  (:require
   ["@tabler/icons-react" :as tabler-icons]
   [camel-snake-kebab.core :as csk]
   [clojure.string :as string]
   [goog.object :as gobj]
   [goog.string :as gstring]
   [io.factorhouse.hsx.core :as hsx]
   [logseq.shui.util :as shui-utils]))

(defn- custom-svg
  [component-name opts children]
  (let [size (or (:size opts) 18)
        color (or (:color opts) "currentColor")]
    [:svg (merge {:width size
                  :height size
                  :viewBox "0 0 20 20"
                  :fill "none"
                  :stroke color
                  :stroke-linecap "round"
                  :stroke-linejoin "round"
                  :class (str "icon iconTabler iconTablerExt" component-name)
                  :xmlns "http://www.w3.org/2000/svg"}
                 (select-keys opts [:style]))
     children]))

(defn- status-circle
  [component-name opts & children]
  (custom-svg component-name opts
              (into [[:circle {:cx 10 :cy 10 :r 8 :stroke-width 2}]]
                    children)))

(defn- custom-icon
  [component-name opts]
  (case component-name
    "Backlog"
    (custom-svg component-name opts
                [[:circle {:cx 10 :cy 10 :r 8 :stroke-width 2 :stroke-dasharray "4 4"}]])

    "Todo"
    (status-circle component-name opts)

    "InProgress25"
    (status-circle component-name opts
                   [:path {:d "M10 2A8 8 0 0 1 18 10"
                           :stroke-width 3}])

    "InProgress50"
    (status-circle component-name opts
                   [:path {:d "M10 2A8 8 0 0 1 10 18"
                           :stroke-width 3}])

    "InProgress75"
    (status-circle component-name opts
                   [:path {:d "M10 2A8 8 0 1 1 2 10"
                           :stroke-width 3}])

    "InReview"
    (status-circle component-name opts
                   [:path {:d "M6 10H14"
                           :stroke-width 2}])

    "Done"
    (let [color (or (:color opts) "currentColor")]
      (custom-svg component-name opts
                  [[:circle {:cx 10 :cy 10 :r 9 :fill color :stroke "none"}]
                   [:path {:d "M6.5 10L9 12.5L14 7.5"
                           :stroke "white"
                           :stroke-width 1.333}]]))

    "Cancelled"
    (status-circle component-name opts
                   [:path {:d "M13 7L7 13M7 7L13 13"
                           :stroke-width 1.333}])

    "Paused"
    (status-circle component-name opts
                   [:path {:d "M8 7V13M12 7V13"
                           :stroke-width 2}])

    "PriorityLvlLow"
    (custom-svg component-name opts
                [[:path {:d "M6 8H14M6 12H11"
                         :stroke-width 2}]])

    "PriorityLvlMedium"
    (custom-svg component-name opts
                [[:path {:d "M5 8H15M5 12H15"
                         :stroke-width 2}]])

    "PriorityLvlHigh"
    (custom-svg component-name opts
                [[:path {:d "M5 13L10 5L15 13"
                         :stroke-width 2}]])

    "PriorityLvlUrgent"
    (custom-svg component-name opts
                [[:path {:d "M10 4V11"
                         :stroke-width 2}]
                 [:path {:d "M10 15V15.01"
                         :stroke-width 3}]])

    "PriorityLvlNone"
    (custom-svg component-name opts
                [[:path {:d "M5 10H15"
                         :stroke-width 2
                         :stroke-dasharray "3 3"}]])

    nil))

(hsx/defc root
  ([name] (root name nil))
  ([name {:keys [extension? font? class] :as opts}]
   (when (and (string? name)
           (not (string/blank? name)))
     (let [custom-component-name (csk/->PascalCase name)
           icon-component-name (str "Icon" custom-component-name)]
       (if (or extension? font?)
         [:span.ui__icon (merge {:class
                                 (gstring/format
                                   (str "%s-" name
                                     (when (:class opts)
                                       (str " " (string/trim (:class opts)))))
                                   (if extension? "tie tie" "ti ti"))}
                           (dissoc opts :class :extension? :font?))]

         ;; tabler svg react
         (if-let [_klass (gobj/get tabler-icons icon-component-name)]
           (let [f (shui-utils/component-wrap tabler-icons icon-component-name)]
             [:span.ui__icon.ti
              {:class (str "ls-icon-" name " " class)}
              (f (merge {:size 18} (shui-utils/map-keys->camel-case (dissoc opts :class))))])
           (when-let [icon (custom-icon custom-component-name (merge {:size 18} (dissoc opts :class)))]
             [:span.ui__icon.ti
              {:class (str "ls-icon-" name " " class)}
              icon])))))))
