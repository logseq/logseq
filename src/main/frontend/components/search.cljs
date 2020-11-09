(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler.route :as route]
            [frontend.handler.page :as page-handler]
            [frontend.handler.file :as file-handler]
            [frontend.db :as db]
            [frontend.handler.search :as search-handler]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.config :as config]
            [frontend.search :as search]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.context.i18n :as i18n]))

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
  (let [q (search/clean q)
        n (count content)
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
  [{:keys [pages files blocks]} search-q]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [new-page [{:type :new-page}]
          new-file [{:type :new-file}]
          pages (map (fn [page] {:type :page :data page}) pages)
          files (map (fn [file] {:type :file :data file}) files)
          blocks (map (fn [block] {:type :block :data block}) blocks)
          result (if config/publishing?
                   (concat pages files blocks)
                   (concat new-page pages new-file files blocks))]
      [:div.absolute.rounded-md.shadow-lg
       {:style (merge
                {:top 48
                 :left 32
                 :width 500})}
       (ui/auto-complete
        result
        {:on-chosen (fn [{:keys [type data]}]
                      (search-handler/clear-search!)
                      (leave-focus)
                      (case type
                        :new-page
                        (page-handler/create! search-q)

                        :page
                        (route/redirect! {:to :page
                                          :path-params {:name data}})

                        :new-file
                        (file-handler/create! search-q)

                        :file
                        (route/redirect! {:to :file
                                          :path-params {:path data}})

                        :block
                        (let [page (:page/name (:block/page data))
                              path (str "/page/" (util/encode-str page) "#ls-block-" (:block/uuid data))]
                          (route/redirect-with-fragment! path))
                        nil))
         :on-shift-chosen (fn [{:keys [type data]}]
                            (case type
                              :page
                              (let [page (db/entity [:page/name data])]
                                (state/sidebar-add-block!
                                 (state/get-current-repo)
                                 (:db/id page)
                                 :page
                                 {:page page}))

                              :block
                              (let [block (db/entity [:block/uuid (:block/uuid data)])]
                                (state/sidebar-add-block!
                                 (state/get-current-repo)
                                 (:db/id block)
                                 :block
                                 block))

                              nil))
         :item-render (fn [{:keys [type data]}]
                        (case type
                          :new-page
                          [:div.text.font-bold (str (t :new-page) ": ")
                           [:span.ml-1 (str "\"" search-q "\"")]]

                          :new-file
                          [:div.text.font-bold (str (t :new-file) ": ")
                           [:span.ml-1 (str "\"" search-q "\"")]]

                          :page
                          [:div.text-sm.font-medium
                           [:span.text-xs.rounded.border.mr-2.px-1 {:title "Page"}
                            "P"]
                           data]

                          :file
                          [:div.text-sm.font-medium
                           [:span.text-xs.rounded.border.mr-2.px-1 {:title "File"}
                            "F"]
                           data]

                          :block
                          (let [{:block/keys [page content]} data]
                            (let [page (:page/original-name page)]
                              [:div.flex-1
                               [:div.text-sm.font-medium page]
                               (highlight content search-q)]))

                          nil))})])))

(rum/defc search < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (search-handler/clear-search!)
                 (leave-focus)))))
  []
  (let [search-result (state/sub :search/result)
        search-q (state/sub :search/q)
        show-result? (boolean (seq search-result))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#search.flex-1.flex.ml-0.md:ml-12
       [:div.flex.md:ml-0
        [:label.sr-only {:for "search_field"} (t :search)]
        [:div#search-wrapper.relative.w-full.text-gray-400.focus-within:text-gray-600
         [:div.absolute.inset-y-0.flex.items-center.pointer-events-none.left-0
          [:svg.h-5.w-5
           {:view-box "0 0 20 20", :fill "currentColor"}
           [:path
            {:d
             "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
             :clip-rule "evenodd",
             :fill-rule "evenodd"}]]]
         [:input#search_field.block.w-full.h-full.pr-3.py-2.rounded-md.focus:outline-none.placeholder-gray-500.focus:placeholder-gray-400.sm:text-sm.sm:bg-transparent

          {:style {:padding-left "2rem"}
           :placeholder (t :search)
           :auto-complete (if (util/chrome?) "chrome-off" "off") ; off not working here
           :default-value ""
           :on-change (fn [e]
                        (let [value (util/evalue e)]
                          (if (string/blank? value)
                            (search-handler/clear-search!)
                            (do
                              (state/set-q! value)
                              (search-handler/search value)))))}]
         (when-not (string/blank? search-q)
           (ui/css-transition
            {:class-names "fade"
             :timeout {:enter 500
                       :exit 300}}
            (search-auto-complete search-result search-q)))]]])))
