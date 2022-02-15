(ns frontend.components.search
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.components.block :as block]
            [frontend.components.svg :as svg]
            [frontend.handler.route :as route]
            [frontend.handler.page :as page-handler]
            [frontend.handler.block :as block-handler]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.search :as search-handler]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [reitit.frontend.easy :as rfe]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.mobile.util :as mobile-util]))

(defn highlight-exact-query
  [content q]
  (if (or (string/blank? content) (string/blank? q))
    content
    (when (and content q)
      (let [q-words (string/split q #" ")
            lc-content (util/search-normalize content)
            lc-q (util/search-normalize q)]
        (if (and (string/includes? lc-content lc-q)
                 (not (util/safe-re-find #" " q)))
          (let [i (string/index-of lc-content lc-q)
                [before after] [(subs content 0 i) (subs content (+ i (count q)))]]
            [:div
             (when-not (string/blank? before)
               [:span before])
             [:mark.p-0.rounded-none (subs content i (+ i (count q)))]
             (when-not (string/blank? after)
               [:span after])])
          (let [elements (loop [words q-words
                                content content
                                result []]
                           (if (and (seq words) content)
                             (let [word (first words)
                                   lc-word (util/search-normalize word)
                                   lc-content (util/search-normalize content)]
                               (if-let [i (string/index-of lc-content lc-word)]
                                 (recur (rest words)
                                        (subs content (+ i (count word)))
                                        (vec
                                         (concat result
                                                 [[:span (subs content 0 i)]
                                                  [:mark.p-0.rounded-none (subs content i (+ i (count word)))]])))
                                 (recur nil
                                        content
                                        result)))
                             (conj result [:span content])))]
            [:p {:class "m-0"} elements]))))))

(rum/defc search-result-item
  [type content]
  [:.text-sm.font-medium.flex.items-baseline
   [:.text-xs.rounded.border.mr-2.px-1 {:title type}
    (get type 0)]
   content])

(rum/defc block-search-result-item
  [repo uuid format content q search-mode]
  (let [content (search-handler/sanity-search-content format content)]
    [:div
     (when (not= search-mode :page)
       [:div {:class "mb-1" :key "parents"}
        (block/block-parents {:id "block-search-block-parent"
                              :block? true
                              :search? true}
                             repo
                             (clojure.core/uuid uuid)
                             {:indent? false})])
     [:div {:class "font-medium" :key "content"}
      (highlight-exact-query content q)]]))

(defn- search-has-a-match?
  [pages search-q result]
  (or
   (and (seq pages)
        (= (util/safe-page-name-sanity-lc search-q)
           (util/safe-page-name-sanity-lc (:data (first pages)))))
   (nil? result)))

(defn- transform-pages
  [pages]
  (map (fn [page]
         (let [alias (model/get-redirect-page-name page)]
           (cond->
            {:type :page
             :data page}
            (and alias
                 (not= (util/page-name-sanity-lc page)
                       (util/page-name-sanity-lc alias)))
            (assoc :alias alias))))
       (remove nil? pages)))

(rum/defc ^:large-vars/cleanup-todo search-auto-complete
  [{:keys [pages files blocks has-more?] :as result} search-q all?]
  (let [pages (when-not all? (transform-pages pages))
        files (when-not all? (map (fn [file] {:type :file :data file}) files))
        blocks (map (fn [block] {:type :block :data block}) blocks)
        search-mode (state/sub :search/mode)
        ;; TODO: Remove
        new-page (if (or (search-has-a-match? pages search-q result)
                         all?)
                   []
                   []
                   #_[{:type :new-page}])
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
                        (route/redirect-to-page! data))

                      :file
                      (route/redirect! {:to :file
                                        :path-params {:path data}})

                      :block
                      (let [repo (state/get-current-repo)
                            block-uuid (uuid (:block/uuid data))
                            collapsed? (db/parents-collapsed? repo block-uuid)
                            page (:block/page (db/entity [:block/uuid block-uuid]))
                            long-page? (block-handler/long-page? repo (:db/id page))]
                        (if page
                          (if (or collapsed? long-page?)
                            (route/redirect-to-page! block-uuid)
                            (route/redirect-to-page! (:block/name page) (str "ls-block-" (:block/uuid data))))
                          ;; search indice outdated
                          (println "[Error] Block page missing: "
                                   {:block-id block-uuid
                                    :block (db/pull [:block/uuid block-uuid])})))
                      nil)
                    (state/close-modal!))
       :on-shift-chosen (fn [{:keys [type data alias]}]
                          (search-handler/add-search-to-recent! repo search-q)
                          (case type
                            :page
                            (let [data (or alias data)
                                  page (when data (db/entity [:block/name (util/page-name-sanity-lc data)]))]
                              (when page
                                (state/sidebar-add-block!
                                 (state/get-current-repo)
                                 (:db/id page)
                                 :page
                                 {:page page})))

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
                                                [:span {:data-page-ref data}
                                                 (when alias
                                                   (let [target-original-name (model/get-page-original-name alias)]
                                                     [:span.mr-2.text-sm.font-medium.mb-2 (str "Alias -> " target-original-name)]))
                                                 (search-result-item "Page" (highlight-exact-query data search-q))]

                                                :file
                                                (search-result-item "File" (highlight-exact-query data search-q))

                                                :block
                                                (let [{:block/keys [page uuid]} data  ;; content here is normalized
                                                      page (util/get-page-original-name page)
                                                      repo (state/sub :git/current-repo)
                                                      format (db/get-page-format page)
                                                      block (model/query-block-by-uuid uuid)
                                                      content (:block/content block)]
                                                  [:span {:data-block-ref uuid}
                                                   (search-result-item "Block"
                                                                       (block-search-result-item repo uuid format content search-q search-mode))])

                                                nil)]))})
     (when (and has-more? (util/electron?) (not all?))
       [:div.px-2.py-4.search-more
        [:a.text-sm.font-medium {:href (rfe/href :search {:q search-q})
                                 :on-click (fn []
                                             (when-not (string/blank? search-q)
                                               (search-handler/search (state/get-current-repo) search-q {:limit 1000
                                                                                                         :more? true})
                                               (search-handler/clear-search!)))}
         (t :more)]])]))

(rum/defc recent-search-and-pages
  [in-page-search?]
  [:div.recent-search
   [:div.px-4.py-2.text-sm.opacity-70.flex.flex-row.justify-between.align-items
    [:div "Recent search:"]
    (ui/with-shortcut :go/search-in-page "bottom"
      [:div.flex-row.flex.align-items
       [:div.mr-2 "Search in page:"]
       [:div {:style {:margin-top 3}}
        (ui/toggle in-page-search?
                   (fn [_value]
                     (state/set-search-mode! (if in-page-search? :global :page)))
                   true)]
       (ui/tippy {:html [:div
                         ;; TODO: fetch from config
                         "Tip: " [:code (util/->platform-shortcut "Ctrl + Shift + p")] " to open the commands palette"]
                  :interactive     true
                  :arrow           true
                  :theme       "monospace"}
                 [:a.inline-block.fade-link
                  {:style {:margin-left 12}
                   :on-click #(state/toggle! :ui/command-palette-open?)}
                  (ui/icon "command" {:style {:font-size 20}})])])]
   (let [recent-search (mapv (fn [q] {:type :search :data q}) (db/get-key-value :recent/search))
         pages (->> (db/get-key-value :recent/pages)
                    (remove nil?)
                    (filter string?)
                    (remove #(= (string/lower-case %) "contents"))
                    (mapv (fn [page] {:type :page :data page})))
         result (concat (take 5 recent-search) pages)]
     (ui/auto-complete
      result
      {:on-chosen (fn [{:keys [type data]}]
                    (case type
                      :page
                      (do (route/redirect-to-page! data)
                          (state/close-modal!))
                      :search
                      (let [q data]
                        (state/set-q! q)
                        (let [search-mode (state/get-search-mode)
                              opts (if (= :page search-mode)
                                     (let [current-page (or (state/get-current-page)
                                                            (date/today))]
                                       {:page-db-id (:db/id (db/entity [:block/name (util/page-name-sanity-lc current-page)]))})
                                     {})]
                          (if (= :page search-mode)
                            (search-handler/search (state/get-current-repo) q opts)
                            (search-handler/search (state/get-current-repo) q))))

                      nil))
       :on-shift-chosen (fn [{:keys [type data]}]
                          (case type
                            :page
                            (let [page data]
                              (when (string? page)
                                (when-let [page (db/pull [:block/name (util/page-name-sanity-lc page)])]
                                 (state/sidebar-add-block!
                                  (state/get-current-repo)
                                  (:db/id page)
                                  :page
                                  {:page page}))))

                            nil))
       :item-render (fn [{:keys [type data]}]
                      (case type
                        :search [:div.flex-row.flex.search-item.font-medium
                                 svg/search
                                 [:span.ml-2 data]]
                        :page (when-let [original-name (model/get-page-original-name data)] ;; might be block reference
                                (search-result-item "Page" original-name))
                        nil))}))])

(defonce search-timeout (atom nil))

(defn- input-on-change
  [e]
  (when @search-timeout
    (js/clearTimeout @search-timeout))
  (let [timeout 300
        value (util/evalue e)
        is-composing? (util/onchange-event-is-composing? e)] ;; #3199
    (if (and (string/blank? value) (not is-composing?))
      (search-handler/clear-search! false)
      (let [search-mode (state/get-search-mode)
            opts (if (= :page search-mode)
                   (when-let [current-page (or (state/get-current-page)
                                               (date/today))]
                     {:page-db-id (:db/id (db/entity [:block/name (util/page-name-sanity-lc current-page)]))})
                   {})]
        (state/set-q! value)
        (reset! search-timeout
                (js/setTimeout
                 (fn []
                   (if (= :page search-mode)
                     (search-handler/search (state/get-current-repo) value opts)
                     (search-handler/search (state/get-current-repo) value)))
                 timeout))))))

(rum/defc create-results
  [search-q]
  [:div.create-wrap
   [:div.px-2.font-medium.opacity-50 {:style {:text-transform "uppercase"}} "Create"]
   [:div.flex.flex-row.justify-around.align-items
    [:div.py-2.px-1.rounded-md.text.font-bold
     {:on-click #(js/alert "TODO: Add block")}
     "Add new block to today's journal"]
    [:div.py-2.px-1.rounded-md.text.font-bold
     {:on-click (fn [_e]
                  ;; TODO: Refactor with search-auto-complete
                  (search-handler/add-search-to-recent! (state/get-current-repo)
                                                        search-q)
                  (search-handler/clear-search!)
                  (page-handler/create! search-q)
                  (state/close-modal!)) }
     (str (t :new-page) ": ")
     [:span.ml-1 (str "\"" search-q "\"")]]]])

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
        search-mode (state/sub :search/mode)
        in-page-search? (= search-mode :page)]
    [:div.cp__palette.cp__palette-main
     (when (mobile-util/is-native-platform?)
       {:style {:min-height "50vh"}})

     [:div.header-wrap]
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
        :on-change     input-on-change}]]
     (when-not (search-has-a-match? (transform-pages (:pages search-result))
                                    search-q
                                    search-result)
       (create-results search-q))
     #_[:div.keyboard-row.py-16 "Keyboard Shortcuts TODO"]
     [:div.search-results-wrap
      [:div.px-2.font-medium.opacity-50 {:style {:text-transform "uppercase"}} "Search"]
      (if (seq search-result)
        (search-auto-complete search-result search-q false)
        (recent-search-and-pages in-page-search?))]]))

(rum/defc more < rum/reactive
  [route]
  (let [search-q (get-in route [:path-params :q])
        search-result (state/sub :search/more-result)]
    [:div#search.flex-1.flex
     [:div.inner
      [:h1.title (t :search/result-for) [:i search-q]]
      [:p.font-medium.tx-sm (str (count (:blocks search-result)) " " (t :search/items))]
      [:div#search-wrapper.relative.w-full.text-gray-400.focus-within:text-gray-600
       (when-not (string/blank? search-q)
         (search-auto-complete search-result search-q true))]]]))
