(ns frontend.extensions.handbooks.core
  (:require
   [clojure.string :as string]
   [rum.core :as rum]
   [frontend.ui :as ui]
   [frontend.state :as state]
   [promesa.core :as p]
   [clojure.edn :as edn]))

(def Handbooks_ENDPOINT
  (if-not (state/developer-mode?)
    "http://localhost:1337"
    "https://handbooks.pages.dev"))

(defn resolve-asset-url
  [path]
  (if (string/starts-with? path "http")
    path (str Handbooks_ENDPOINT "/"
              (-> path (string/replace-first "./" "")
                  (string/replace-first #"^/+" "")))))

(rum/defc link-card
  [opts child]

  [:div.link-card
   opts
   child])

(rum/defc pane-category-topics
  [_handbooks-data pane-state nav!]

  [:div.pane.pane-category-topics
   [:div.topics-list
    (let [category (second pane-state)]
      (for [{:keys [title description cover] :as topic} (:children category)]
        [:div.topic-card.flex
         {:key      title
          :on-click #(nav! [:topic-detail topic (:title category)] pane-state)}
         (when cover
           [:div.l.flex.items-center
            [:img {:src (resolve-asset-url cover)}]])
         [:div.r.flex.flex-col
          [:strong title]
          [:span description]]]))]])

(rum/defc pane-topic-detail
  [_handbooks pane-state nav!]

  (let [topic (second pane-state)]
    [:div.pane.pane-topic-detail
     [:h1.text-2xl.pb-3.font-semibold (:title topic)]

     ;; TODO: demo lists
     (when-let [demo (first (:demos topic))]
       [:div.flex.demos
        [:img {:src (resolve-asset-url demo)}]])

     [:div.content-wrap
      [:div.content.markdown-body
       {:dangerouslySetInnerHTML {:__html (:content topic)}}]]]))

(rum/defc pane-dashboard
  [handbooks-data pane-state nav-to-pane!]
  [:div.pane.dashboard-pane
   [:h2 "Popular topics"]
   [:div.topics-list
    (take
     3 (repeat
        [:div.topic-card.flex
         [:div.l ""]
         [:div.r.flex.flex-col
          [:strong "Switching your notetaking process"]
          [:span "What makes Logseq different from your previous tools?"]]]))]

   [:h2 "Help categories"]
   [:div.categories-list
    (let [categories (:children handbooks-data)]
      (for [{:keys [title children color] :as category} categories]
        [:div.category-card
         {:key      title
          :style    {:background-color (or color "#676767")}
          :on-click #(nav-to-pane! [:topics category title] pane-state)}
         [:strong title]
         [:span (str (count children) " articles")]]))]])

(rum/defc pane-settings
  []
  [:div.pane.pane-settings
   [:h1 "Settings content"]])

(rum/defc search-bar
  []
  [:div.search.relative
   [:span.icon.absolute.opacity-90
    {:style {:top 6 :left 7}}
    (ui/icon "search" {:size 12})]
   [:input {:placeholder "Search"
            :auto-focus  true}]])

(rum/defc related-topics
  []
  [:div.related-topics
   (link-card {}
              [:strong.text-md "How to do something?"])
   (link-card {}
              [:strong.text-md "How to do something?"])])

(def panes-mapping
  {:dashboard    [pane-dashboard]
   :topics       [pane-category-topics]
   :topic-detail [pane-topic-detail]
   :settings     [pane-settings]})

(rum/defc content
  []
  (let [[active-pane0, set-active-pane0!]
        (rum/use-state [:dashboard nil "Helps"])

        [handbooks-state, set-handbooks-state!]
        (rum/use-state nil)

        [history-state, set-history-state!]
        (rum/use-state ())

        reset-handbooks!     #(set-handbooks-state! {:status nil :data nil :error nil})
        update-handbooks!    #(set-handbooks-state! (fn [v] (merge v %)))
        load-handbooks!      (fn []
                               (reset-handbooks!)
                               (update-handbooks! {:status :pending})
                               (-> (p/let [^js res (js/fetch (str Handbooks_ENDPOINT "/handbooks.edn"))
                                           data    (.text res)]
                                     (update-handbooks! {:data (edn/read-string data)}))
                                   (p/catch #(update-handbooks! {:error (str %)}))
                                   (p/finally #(update-handbooks! {:status :completed}))))

        active-pane          (first active-pane0)
        pane-render          (first (get panes-mapping active-pane))
        dashboard?           (= :dashboard active-pane)
        force-nav-dashboard! (fn []
                               (set-active-pane0! [:dashboard])
                               (set-history-state! '()))

        handbooks-loaded?    (and (not (empty? (:data handbooks-state)))
                                  (= :completed (:status handbooks-state)))
        handbooks-data       (:data handbooks-state)]

    ;; load handbooks
    (rum/use-effect!
     #(load-handbooks!)
     [])

    [:div.cp__handbooks-content
     [:div.pane-wrap
      [:div.hd.flex.justify-between.select-none.draggable-handle

       [:h1.text-lg.flex.items-center
        (if dashboard?
          [:span (str "Helps" (when handbooks-data
                                (str " (" (:version handbooks-data) ")")))]
          [:span.active:opacity-80.flex.items-center.cursor-pointer
           {:on-click (fn [] (let [prev (first history-state)
                                   prev (cond-> prev
                                          (nil? (seq prev))
                                          [:dashboard])]
                               (set-active-pane0! prev)
                               (set-history-state! (rest history-state))))}
           [:span.pr-2.flex.items-center (ui/icon "chevron-left")]
           [:span (or (last active-pane0) "Handbooks")]])]

       [:div.flex.items-center.space-x-3
        (when (> (count history-state) 1)
          [:a
           {:on-click #(force-nav-dashboard!)}
           (ui/icon "home")])
        [:a (ui/icon "settings")]
        [:a {:on-click #(state/toggle! :ui/handbooks-open?)}
         (ui/icon "x")]]]

      (when-not handbooks-loaded?
        [:div.flex.items-center.justify-center.pt-32
         (if-not (:error handbooks-state)
           (ui/loading "Loading ...")
           [:code (:error handbooks-state)])])

      (when handbooks-loaded?
        [:<>
         ;; search bar
         (when (or dashboard? (= :topics active-pane))
           (search-bar))

         ;; entry pane
         (when pane-render
           (pane-render
            handbooks-data
            active-pane0
            (fn [pane-state prev-state]
              (set-history-state!
               (conj (sequence history-state) prev-state))
              (set-active-pane0! pane-state))))])]

     (when handbooks-loaded?
       ;; footer
       [:div.ft
        [:h2.uppercase.opacity-60 "Related"]
        (related-topics)])]))
