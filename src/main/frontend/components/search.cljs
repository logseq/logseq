(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.components.block :as block]
            [frontend.components.svg :as svg]
            [frontend.handler.route :as route]
            [frontend.handler.page :as page-handler]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.search :as search-handler]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.config :as config]
            [frontend.search :as search]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [medley.core :as medley]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [reitit.frontend.easy :as rfe]
            [frontend.modules.shortcut.core :as shortcut]))

(defn- partition-between
  "Split `coll` at positions where `pred?` is true."
  [pred? coll]
  (let [switch (reductions not= true (map pred? coll (rest coll)))]
    (map (partial map first) (partition-by second (map list coll switch)))))

(defn highlight-exact-query
  [content q]
  (if (or (string/blank? content) (string/blank? q))
    content
    (let [q-words (string/split q #" ")
          lc-content (string/lower-case content)
          lc-q (string/lower-case q)]
      (if (and (string/includes? lc-content lc-q)
              (not (util/safe-re-find #" " q)))
        (let [i (string/index-of lc-content lc-q)
              [before after] [(subs content 0 i) (subs content (+ i (count q)))]]
          [:div
           (when-not (string/blank? before)
             [:span before])
           [:mark {:class "p-0 rounded-none"} (subs content i (+ i (count q)))]
           (when-not (string/blank? after)
             [:span after])])
        (let [elements (loop [words q-words
                              content content
                              result []]
                         (if (and (seq words) content)
                           (let [word (first words)
                                 lc-word (string/lower-case word)
                                 lc-content (string/lower-case content)]
                             (if-let [i (string/index-of lc-content lc-word)]
                               (recur (rest words)
                                      (subs content (+ i (count word)))
                                      (vec
                                       (concat result
                                               [[:span (subs content 0 i)]
                                                [:mark (subs content i (+ i (count word)))]])))
                               (recur nil
                                      content
                                      result)))
                           (conj result [:span content])))]
          [:p {:class "m-0"} elements])))))

(rum/defc search-result-item
  [type content]
  [:.text-sm.font-medium.flex.items-baseline
   [:.text-xs.rounded.border.mr-2.px-1 {:title type}
    (get type 0)]
   content])

(rum/defc block-search-result-item
  [repo uuid format content q search-mode]
  [:div [
         (when (not= search-mode :page)
           [:div {:class "mb-1" :key "parents"} (block/block-parents {:id "block-search-block-parent"
                                                                      :block? true
                                                                      :search? true}
                                                                     repo
                                                                     (clojure.core/uuid uuid)
                                                                     {:indent? false})])
         [:div {:class "font-medium" :key "content"} (highlight-exact-query content q)]]])

(rum/defc highlight-fuzzy
  [content indexes]
  (let [n (count content)
        max-hightlighted-len 512
        max-surrounding-len 512

        first-index (first indexes)
        last-index (nth indexes (dec (count indexes)))
        last-index (min (+ first-index max-hightlighted-len -1) last-index)
        last-index* (+ last-index max-surrounding-len)
        indexes (take-while #(<= % last-index*) indexes)
        content-begin (max 0 (- first-index max-surrounding-len))
        content-end   (min n (+ last-index 1 max-surrounding-len)) ; exclusive

        ; finds inconsecutive sections
        sections (partition-between #(> (- %2 %) 1) indexes)
        hl-ranges (for [sec sections
                        :let [begin (first sec)
                              end (-> sec last inc)]]
                    [begin end]) ; `end` is exclusive
        hl-ranges* (concat [[content-begin content-begin]]
                           hl-ranges
                           [[content-end content-end]])
        normal-ranges (for [[[_ begin] [end _]] (partition 2 1 hl-ranges*)] [begin end])
        normal-hl-pairs (partition-all 2 (medley/interleave-all normal-ranges hl-ranges))]
    [:p
     (mapcat
      (fn [[normal highlighted]]
        [(when-some [[begin end] normal]
           [:span (subs content begin end)])
         (when-some [[begin end] highlighted]
           [:mark (subs content begin end)])])
      normal-hl-pairs)]))

(rum/defc highlight
  [content q]
  (let [q-pattern (->> q
                       (search/escape-str)
                       (str "(?i)")
                       (re-pattern))
        n (count content)
        [before after] (string/split content q-pattern 2)
        [before after] (if (>= n 64)
                         [(when before (apply str (take-last 48 before)))
                          (when after (apply str (take 48 after)))]
                         [before after])]
    [:p
     (when-not (string/blank? before)
       [:span before])
     [:mark q]
     (when-not (string/blank? after)
       [:span after])]))

(defonce search-timeout (atom nil))

(rum/defc search-auto-complete
  [{:keys [pages files blocks has-more?] :as result} search-q all?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [pages (when-not all? (map (fn [page]
                                      (let [alias (model/get-redirect-page-name page)]
                                        (cond->
                                          {:type :page
                                           :data page}
                                          (not= (string/lower-case page)
                                                (string/lower-case alias))
                                          (assoc :alias alias)))) pages))
          files (when-not all? (map (fn [file] {:type :file :data file}) files))
          blocks (map (fn [block] {:type :block :data block}) blocks)
          search-mode (state/sub :search/mode)
          new-page (if (or
                        (and (seq pages)
                             (= (string/lower-case search-q)
                                (string/lower-case (:data (first pages)))))
                        (nil? result)
                        all?)
                     []
                     [{:type :new-page}])
          result (if config/publishing?
                   (concat pages files blocks)
                   (concat new-page pages files blocks))
          result (if (= search-mode :graph)
                   [{:type :graph-add-filter}]
                   result)
          repo (state/get-current-repo)]
      [:div
       (ui/auto-complete
        result
        {:class "search-results"
         :on-chosen (fn [{:keys [type data alias]}]
                      (search-handler/add-search-to-recent! repo search-q)
                      (search-handler/clear-search!)
                      (case type
                        :graph-add-filter
                        (state/add-graph-search-filter! search-q)

                        :new-page
                        (page-handler/create! search-q)

                        :page
                        (let [data (or alias data)]
                          (route/redirect! {:to :page
                                            :path-params {:name data}}))

                        :file
                        (route/redirect! {:to :file
                                          :path-params {:path data}})

                        :block
                        (let [block-uuid (uuid (:block/uuid data))
                              collapsed? (db/parents-collapsed? (state/get-current-repo) block-uuid)]
                          (if collapsed?
                            (route/redirect! {:to :page
                                              :path-params {:name (str block-uuid)}})
                            (let [page (:block/name (:block/page (db/entity [:block/uuid block-uuid])))]
                              (route/redirect! {:to :page
                                                :path-params {:name page}
                                                :query-params {:anchor (str "ls-block-" (:block/uuid data))}}))))
                        nil)
                      (state/close-modal!))
         :on-shift-chosen (fn [{:keys [type data alias]}]
                            (search-handler/add-search-to-recent! repo search-q)
                            (case type
                              :page
                              (let [data (or alias data)
                                    page (db/entity [:block/name (string/lower-case data)])]
                                (state/sidebar-add-block!
                                 (state/get-current-repo)
                                 (:db/id page)
                                 :page
                                 {:page page}))

                              :block
                              (let [block-uuid (uuid (:block/uuid data))
                                    block (db/entity [:block/uuid block-uuid])]
                                (state/sidebar-add-block!
                                 (state/get-current-repo)
                                 (:db/id block)
                                 :block
                                 block))

                              :new-page
                              (page-handler/create! search-q)

                              :file
                              (route/redirect! {:to :file
                                                :path-params {:path data}})

                              nil)
                            (state/close-modal!))
         :item-render (fn [{:keys [type data alias]}]
                        (let [search-mode (state/get-search-mode)
                              data (if (string? data) (pdf-assets/fix-local-asset-filename data) data)]
                          [:div {:class "py-2"} (case type
                                                  :graph-add-filter
                                                  [:b search-q]

                                                  :new-page
                                                  [:div.text.font-bold (str (t :new-page) ": ")
                                                   [:span.ml-1 (str "\"" search-q "\"")]]

                                                  :page
                                                  [:span
                                                   (when alias
                                                     [:span.mr-2.text-sm.font-medium.mb-2 (str "Alias -> " alias)])
                                                   (search-result-item "Page" (highlight-exact-query data search-q))]

                                                  :file
                                                  (search-result-item "File" (highlight-exact-query data search-q))

                                                  :block
                                                  (let [{:block/keys [page content uuid]} data
                                                        page (or (:block/original-name page)
                                                                 (:block/name page))
                                                        repo (state/sub :git/current-repo)
                                                        format (db/get-page-format page)]
                                                    (search-result-item "Block" (block-search-result-item repo uuid format content search-q search-mode)))

                                                  nil)]))})
       (when (and has-more? (util/electron?) (not all?))
         [:div.px-2.py-4.search-more
          [:a.text-sm.font-medium {:href (rfe/href :search {:q search-q})
                                   :on-click (fn []
                                               (when-not (string/blank? search-q)
                                                 (search-handler/search (state/get-current-repo) search-q {:limit 1000
                                                                                                           :more? true})
                                                 (search-handler/clear-search!)))}
           (t :more)]])])))

(rum/defc recent-search-and-pages
  [in-page-search?]
  [:div.recent-search
   [:div.px-4.py-2.text-sm.opacity-70.flex.flex-row.justify-between.align-items
    [:div "Recent search:"]
    (ui/tippy {:html [:div.text-sm.font-medium
                      "Shortcut: "
                      [:code (util/->platform-shortcut "Ctrl + Shift + k")]]
               :interactive     true
               :arrow true}
              [:div.flex-row.flex.align-items
               [:div.mr-2 "Search in page:"]
               [:div {:style {:margin-top 3}}
                (ui/toggle in-page-search?
                           (fn [_value]
                             (state/set-search-mode! (if in-page-search? :global :page)))
                           true)]
               (ui/tippy {:html [:div
                                 "Tip: " [:code (util/->platform-shortcut "Ctrl+Shift+p")] " to open the commands palette"]
                          :interactive     true
                          :arrow true}
                         [:a.inline-block.fade-link
                          {:style {:margin-left 12}
                           :on-click #(state/toggle! :ui/command-palette-open?)}
                          (ui/icon "command" {:style {:font-size 20}})])])]
   (let [recent-search (mapv (fn [q] {:type :search :data q}) (db/get-key-value :recent/search))
         pages (->> (db/get-key-value :recent/pages)
                    (remove nil?)
                    (remove #(= (string/lower-case %) "contents"))
                    (mapv (fn [page] {:type :page :data page})))
         result (concat (take 5 recent-search) pages)]
     (ui/auto-complete
      result
      {:on-chosen (fn [{:keys [type data]}]
                    (case type
                      :page
                      (route/redirect! {:to :page
                                        :path-params {:name data}})
                      :search
                      (let [q data]
                        (state/set-q! q)
                        (let [search-mode (state/get-search-mode)
                              opts (if (= :page search-mode)
                                     (let [current-page (or (state/get-current-page)
                                                            (date/today))]
                                       {:page-db-id (:db/id (db/entity [:block/name (string/lower-case current-page)]))})
                                     {})]
                          (if (= :page search-mode)
                            (search-handler/search (state/get-current-repo) q opts)
                            (search-handler/search (state/get-current-repo) q))))

                      nil))
       :on-shift-chosen (fn [{:keys [type data]}]
                          (case type
                            :page
                            (let [page data]
                              (when-let [page (db/pull [:block/name (string/lower-case page)])]
                               (state/sidebar-add-block!
                                (state/get-current-repo)
                                (:db/id page)
                                :page
                                {:page page})))

                            nil))
       :item-render (fn [{:keys [type data]}]
                      (case type
                        :search [:div.flex-row.flex.search-item.font-medium
                                 svg/search
                                 [:span.ml-2 data]]
                        :page (search-result-item "Page" data)
                        nil))}))])

(rum/defcs search-modal < rum/reactive
  (shortcut/disable-all-shortcuts)
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (search-handler/clear-search!)))))
  [state]
  (let [search-result (state/sub :search/result)
        search-q (state/sub :search/q)
        blocks-count (or (db/blocks-count) 0)
        search-mode (state/sub :search/mode)
        timeout (cond
                  (> blocks-count 2000)
                  400

                  :else
                  300)
        in-page-search? (= search-mode :page)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (let [input (::input state)]
        [:div.cp__palette.cp__palette-main

         [:div.input-wrap
          [:input.cp__palette-input.w-full
           {:type          "text"
            :auto-focus    true
            :placeholder   (case search-mode
                             :graph
                             (t :graph-search)
                             :page
                             (t :page-search)
                             (t :search))
            :auto-complete (if (util/chrome?) "chrome-off" "off") ; off not working here
            :value         search-q
            :on-change     (fn [e]
                             (when @search-timeout
                               (js/clearTimeout @search-timeout))
                             (let [value (util/evalue e)]
                               (if (string/blank? value)
                                 (search-handler/clear-search! false)
                                 (let [search-mode (state/get-search-mode)
                                       opts (if (= :page search-mode)
                                              (let [current-page (or (state/get-current-page)
                                                                     (date/today))]
                                                {:page-db-id (:db/id (db/entity [:block/name (string/lower-case current-page)]))})
                                              {})]
                                   (state/set-q! value)
                                   (reset! search-timeout
                                           (js/setTimeout
                                            (fn []
                                              (if (= :page search-mode)
                                                (search-handler/search (state/get-current-repo) value opts)
                                                (search-handler/search (state/get-current-repo) value)))
                                            timeout))))))}]]
         [:div.search-results-wrap
          (if (seq search-result)
            (search-auto-complete search-result search-q false)
            (recent-search-and-pages in-page-search?))]]))))

(rum/defc more < rum/reactive
  [route]
  (let [search-q (get-in route [:path-params :q])
        search-result (state/sub :search/more-result)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#search.flex-1.flex
       [:div.inner
        [:h1.title (t :search/result-for) [:i search-q]]
        [:p.font-medium.tx-sm (str (count (:blocks search-result)) " " (t :search/items))]
        [:div#search-wrapper.relative.w-full.text-gray-400.focus-within:text-gray-600
         (when-not (string/blank? search-q)
           (search-auto-complete search-result search-q true))]]])))
