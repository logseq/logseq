(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.config :as config]
            [clojure.string :as string]
            [goog.crypt.base64 :as b64]
            [goog.object :as gobj]
            [goog.dom :as gdom]))

(rum/defc dropdown-content-wrapper [state content]
  [:div.origin-top-left.absolute.left-0.mt-0.rounded-md.shadow-lg
   {:class (case state
             "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
             "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
             "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
             "exited" "transition ease-in duration-75 transform opacity-0 scale-95")}
   content])

(rum/defc highlight
  [content q]
  (let [n (count content)
        [before after] (string/split content (re-find (re-pattern (str "(?i)" q))
                                                      content))
        [before after] (if (>= n 64)
                         [(if before (apply str (take-last 48 before)))
                          (if after (apply str (take 48 after)))]
                         [before after])]
    [:p
     (when-not (string/blank? before)
       [:span before])
     [:mark q]
     (when-not (string/blank? after)
       [:span after])]))

(defn- leave-focus
  []
  (when-let [input (gdom/getElement "search_field")]
    (.blur input)))

(rum/defc search-auto-complete
  [search-result search-q]
  [:div.absolute.rounded-md.shadow-lg
   {:style (merge
            {:top 48
             :left 32
             :width 500})}
   (ui/auto-complete
    search-result
    {:on-chosen (fn [chosen]
                  (handler/clear-search!)
                  (leave-focus)
                  (let [page (:page/name (:heading/page chosen))
                        path (str "/page/" (util/url-encode page) "#ls-heading-parent-" (:heading/uuid chosen))]
                    (handler/redirect-with-fragment! path)))
     :item-render (fn [{:heading/keys [uuid page content]}]
                    (let [page (:page/name page)]
                      [:div.flex-1
                       [:div.text-sm.font-bold (util/capitalize-all page)]
                       (highlight content search-q)]))})])

(rum/defc search < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (handler/clear-search!)
                 (leave-focus)))))
  []
  (let [search-result (state/sub :search/result)
        search-q (state/sub :search/q)
        show-result? (boolean (seq search-result))]
    [:div#search.flex-1.flex.ml-0.md:ml-12
     [:div.w-full.flex.md:ml-0
      [:label.sr-only {:for "search_field"} "Search"]
      [:div#search-wrapper.relative.w-full.text-gray-400.focus-within:text-gray-600
       [:div.absolute.inset-y-0.flex.items-center.pointer-events-none.left-0
        [:svg.h-5.w-5
         {:view-box "0 0 20 20", :fill "currentColor"}
         [:path
          {:d
           "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
           :clip-rule "evenodd",
           :fill-rule "evenodd"}]]]
       [:input#search_field.block.w-full.h-full.pr-3.py-2.rounded-md.focus:outline-none.placeholder-gray-500.focus:placeholder-gray-400.sm:text-sm.bg-base-3.sm:bg-transparent

        {:style {:padding-left "2rem"}
         :placeholder "Search"
         :auto-complete "off"
         :value search-q
         :on-change (fn [e]
                      (let [value (util/evalue e)]
                        (if (string/blank? value)
                          (handler/clear-search!)
                          (do
                            (state/set-q! value)
                            (handler/search value)))))}]
       (when-not (string/blank? search-q)
         (ui/css-transition
          {:class-names "fade"
           :timeout {:enter 500
                     :exit 300}}
          (search-auto-complete search-result search-q)))]]]))
