(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [clojure.string :as string]
            [goog.crypt.base64 :as b64]
            [goog.object :as gobj]))

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
;; TODO: support down/up keycode
(rum/defc search < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (handler/clear-search!)))
     (mixins/on-enter state
                      :on-enter (fn []
                                  (when-let [first-match (first (:search/result @state/state))]
                                    (handler/clear-search!)
                                    (let [page (util/url-encode (:page/name (:heading/page first-match)))
                                          uuid (:heading/uuid first-match)
                                          path (str "/page/" page "#ls-heading-parent-" uuid)]
                                      (handler/redirect-with-fragment! path)))))))
  []
  (let [search-result (state/sub :search/result)
        search-q (state/sub :search/q)
        show-result? (boolean (seq search-result))]
    [:div.flex-1.flex
     [:div.w-full.flex.md:ml-0
      [:label.sr-only {:for "search_field"} "Search"]
      [:div.relative.w-full.text-gray-400.focus-within:text-gray-600
       [:div.absolute.inset-y-0.left-0.flex.items-center.pointer-events-none
        [:svg.h-5.w-5
         {:viewBox "0 0 20 20", :fill "currentColor"}
         [:path
          {:d
           "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
           :clip-rule "evenodd",
           :fill-rule "evenodd"}]]]
       [:input#search_field.block.w-full.h-full.pl-8.pr-3.py-2.rounded-md.text-gray-900.placeholder-gray-500.focus:outline-none.focus:placeholder-gray-400.sm:text-sm
        {:placeholder "Search"
         :auto-complete "off"
         :value search-q
         :on-change (fn [e]
                      (let [value (util/evalue e)]
                        (if (string/blank? value)
                          (handler/clear-search!)
                          (do
                            (state/set-q! value)
                            (handler/search value)))))}]
       (ui/css-transition
        {:in show-result? :timeout 0}
        (fn [state]
          (if show-result?
            (dropdown-content-wrapper
             state
             [:div {:class "py-1 rounded-md bg-white shadow-xs"}
              (for [{:heading/keys [uuid page content]} search-result]
                (let [page (:page/name page)]
                  (ui/menu-link
                   {:key (str "search-" uuid)
                    :href (str "/page/" (util/url-encode page) "#ls-heading-parent-" uuid)
                    :on-click handler/clear-search!}
                   [:div.flex-1
                    [:div.text-sm.font-bold page]
                    (highlight content search-q)])))]))))]]]))
