(ns frontend.components.shortcut2
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [frontend.context.i18n :refer [t]]
            [cljs-bean.core :as bean]
            [frontend.ui :as ui]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.util :as util]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.modules.shortcut.config :as shortcut-config]))

(def categories
  (vector :shortcut.category/basics
          :shortcut.category/navigating
          :shortcut.category/block-editing
          :shortcut.category/block-command-editing
          :shortcut.category/block-selection
          :shortcut.category/formatting
          :shortcut.category/toggle
          :shortcut.category/whiteboard
          :shortcut.category/plugins
          :shortcut.category/others))

(defn- to-vector [v]
  (when v
    (if (sequential? v) (vec v) [v])))

(rum/defc search-control
  [q set-q! refresh-fn]

  [:div.cp__shortcut-page-x-search-control
   [:a.flex.items-center
    {:on-click refresh-fn}
    (ui/icon "refresh")]
   [:span.pr-1
    [:input.form-input.is-small
     {:placeholder   "Search"
      :default-value q
      :auto-focus    true
      :on-change     #(let [v (util/evalue %)]
                        (set-q! v))}]]
   [:a.flex.items-center (ui/icon "keyboard")]
   [:a.flex.items-center (ui/icon "filter")]])

(defn build-categories-map
  []
  (->> categories
       (map #(vector % (into (sorted-map) (dh/binding-by-category %))))))

(rum/defc shortcut-page-x
  []
  (let [categories-list-map (build-categories-map)
        [ready?, set-ready!] (rum/use-state false)
        [refresh-v, refresh!] (rum/use-state 1)
        [q set-q!] (rum/use-state nil)

        matched-list-map    (when-not (string/blank? q)
                              [])
        result-list-map     (or matched-list-map categories-list-map)]

    (rum/use-effect!
      (fn []
        (js/setTimeout #(set-ready! true) 800))
      [])

    [:div.cp__shortcut-page-x
     [:header.relative
      [:h1.text-4xl "Keymap"]
      [:h2.text-xs.pt-2.opacity-70
       (str "Total shortcuts "
            (if ready?
              (apply + (map #(count (second %)) result-list-map))
              " ..."))]

      (search-control q set-q! #(refresh! (inc refresh-v)))]

     (when-not (string/blank? q)
       [:h3.flex.justify-center.font-bold "Query: " q])

     [:article
      (when-not ready?
        [:p.py-8.flex.justify-center (ui/loading "")])

      (when ready?
        [:ul.list-none.m-0.py-3
         (for [[c binding-map] result-list-map
               :let [plugin? (= c :shortcut.category/plugins)]]
           [:<>
            ;; category row
            [:li.bg-blue-600.text-center.text-md.th
             {:key (str c)}
             (t c)]

            ;; binding row
            (for [[id {:keys [cmd binding user-binding]}] binding-map
                  :let [binding      (to-vector binding)
                        user-binding (to-vector user-binding)
                        label        (cond
                                       (string? (:desc cmd))
                                       [:<>
                                        [:code.text-xs (some-> (namespace id) (string/replace "plugin." ""))]
                                        [:small.pl-1 (:desc cmd)]]

                                       (not plugin?)
                                       [:<>
                                        [:code.text-xs (str id)]
                                        [:span.pl-1 (-> id (shortcut-utils/decorate-namespace) (t))]]

                                       :else (str id))]]
              [:li.flex.items-center.justify-between.text-sm
               {:key (str id)}
               [:span label]
               [:span.flex.space-x-2.items-center
                (when user-binding
                  [:code.dark:bg-green-800.bg-green-300
                   (str "Custom: " (bean/->js (map #(some-> % (shortcut-utils/decorate-binding)) user-binding)))])

                (for [x binding]
                  (when x
                    [:code.tracking-wide (shortcut-utils/decorate-binding (str x))]))]])])])]]))
