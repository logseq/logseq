(ns frontend.extensions.handbooks.core
  (:require
   [clojure.string :as string]
   [rum.core :as rum]
   [frontend.ui :as ui]
   [frontend.state :as state]
   [promesa.core :as p]
   [camel-snake-kebab.core :as csk]
   [frontend.util :as util]
   [frontend.storage :as storage]
   [clojure.edn :as edn]))

(defn get-handbooks-endpoint
  [resource]
  (str
   (if (storage/get :handbooks-dev-watch?)
     "http://localhost:1337"
     "https://handbooks.pages.dev")
   resource))

(defn resolve-asset-url
  [path]
  (if (string/starts-with? path "http")
    path (str (get-handbooks-endpoint "/")
              (-> path (string/replace-first "./" "")
                  (string/replace-first #"^/+" "")))))

(defn inflate-assets-urls
  [content]
  (if-let [matches (and (not (string/blank? content))
                        (re-seq #"src=\"([^\"]+)\"" content))]
    (reduce
     (fn [content matched]
       (if-let [matched (second matched)]
         (string/replace content matched (resolve-asset-url matched)) content))
     content matches)
    content))

(rum/defc link-card
  [opts child]

  [:div.link-card
   opts
   child])

(rum/defc topic-card
  [{:keys [key title description cover] :as topic} nav-fn!]
  [:div.topic-card.flex
   {:key      key
    :on-click nav-fn!}
   (when cover
     [:div.l.flex.items-center
      [:img {:src (resolve-asset-url cover)}]])
   [:div.r.flex.flex-col
    [:strong title]
    [:span description]]])

(rum/defc pane-category-topics
  [handbook-nodes pane-state nav!]

  [:div.pane.pane-category-topics
   [:div.topics-list
    (let [category-key (:key (second pane-state))]
      (when-let [category (get handbook-nodes category-key)]
        (for [topic (:children category)]
          (rum/with-key
           (topic-card topic #(nav! [:topic-detail topic (:title category)] pane-state))
           (:key topic)))))]])

(rum/defc pane-topic-detail
  [handbook-nodes pane-state _nav!]

  (when-let [topic-key (:key (second pane-state))]
    (when-let [topic (get handbook-nodes topic-key)]
      [:div.pane.pane-topic-detail
       [:h1.text-2xl.pb-3.font-semibold (:title topic)]

       ;; TODO: demo lists
       (when-let [demo (first (:demos topic))]
         [:div.flex.demos
          [:img {:src (resolve-asset-url demo)}]])

       [:div.content-wrap
        (when-let [content (:content topic)]
          [:div.content.markdown-body
           {:dangerouslySetInnerHTML {:__html (inflate-assets-urls content)}}])]])))

(rum/defc pane-dashboard
  [handbooks-nodes pane-state nav-to-pane!]
  (when-let [root (get handbooks-nodes "__root")]
    [:div.pane.dashboard-pane
     (when-let [popular-topics (:popular-topics root)]
       [:<>
        [:h2 "Popular topics"]
        [:div.topics-list
         (for [topic-key popular-topics]
           (when-let [topic (and (string? topic-key)
                                 (->> (util/safe-lower-case topic-key)
                                      (csk/->snake_case_string)
                                      (get handbooks-nodes)))]
             (topic-card topic #(nav-to-pane! [:topic-detail topic "Helps"] [:dashboard]))))]])

     [:h2 "Help categories"]
     [:div.categories-list
      (let [categories (:children root)]
        (for [{:keys [key title children color] :as category} categories]
          [:div.category-card
           {:key      key
            :style    {:background-color (or color "#676767")}
            :on-click #(nav-to-pane! [:topics category title] pane-state)}
           [:strong title]
           [:span (str (count children) " topics")]]))]]))

(rum/defc pane-settings
  [dev-watch? set-dev-watch?]
  [:div.pane.pane-settings
   [:div.item
    [:p.flex.items-center.space-x-3.mb-0
     [:strong "Development watch"]
     (ui/toggle dev-watch? #(set-dev-watch? (not dev-watch?)) true)]
    [:small.opacity-30 (str "Resources from " (get-handbooks-endpoint "/"))]]])

(rum/defc search-bar
  [active-pane]
  (let [*input-ref (rum/use-ref nil)]

    (rum/use-effect!
     #(some-> (rum/deref *input-ref)
              (.focus))
     [active-pane])

    [:div.search.relative
     [:span.icon.absolute.opacity-90
      {:style {:top 6 :left 7}}
      (ui/icon "search" {:size 12})]
     [:input {:placeholder "Search"
              :auto-focus  true
              :ref         *input-ref}]]))

(rum/defc related-topics
  []
  [:div.related-topics
   (link-card {} [:strong.text-md "How to do something?"])])

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

        [handbooks-nodes, set-handbooks-nodes!]
        (rum/use-state nil)

        [history-state, set-history-state!]
        (rum/use-state ())

        [dev-watch?, set-dev-watch?]
        (rum/use-state (storage/get :handbooks-dev-watch?))

        reset-handbooks!     #(set-handbooks-state! {:status nil :data nil :error nil})
        update-handbooks!    #(set-handbooks-state! (fn [v] (merge v %)))
        load-handbooks!      (fn []
                               (when-not (= :pending (:status handbooks-state))
                                 (reset-handbooks!)
                                 (update-handbooks! {:status :pending})
                                 (-> (p/let [^js res (js/fetch (get-handbooks-endpoint "/handbooks.edn"))
                                             data    (.text res)]
                                       (update-handbooks! {:data (edn/read-string data)}))
                                     (p/catch #(update-handbooks! {:error (str %)}))
                                     (p/finally #(update-handbooks! {:status :completed})))))

        active-pane          (first active-pane0)
        pane-render          (first (get panes-mapping active-pane))
        dashboard?           (= :dashboard active-pane)
        settings?            (= :settings active-pane)
        force-nav-dashboard! (fn []
                               (set-active-pane0! [:dashboard])
                               (set-history-state! '()))

        handbooks-loaded?    (and (not (empty? (:data handbooks-state)))
                                  (= :completed (:status handbooks-state)))
        handbooks-data       (:data handbooks-state)
        nav-to-pane!         (fn [pane-state prev-state]
                               (set-history-state!
                                (conj (sequence history-state) prev-state))
                               (set-active-pane0! pane-state))]

    ;; load handbooks
    (rum/use-effect!
     #(load-handbooks!)
     [])

    (rum/use-effect!
     (fn []
       (let [*cnt-len (atom 0)
             check!   (fn []
                        (-> (p/let [^js res (js/fetch (get-handbooks-endpoint "/handbooks.edn") #js{:method "HEAD"})]
                              (when-let [cl (.get (.-headers res) "content-length")]
                                (when (not= @*cnt-len cl)
                                  (println "[Handbooks] dev reload!")
                                  (load-handbooks!))
                                (reset! *cnt-len cl)))
                            (p/catch #(println "[Handbooks] dev check Error:" %))))
             timer0   (if dev-watch?
                        (js/setInterval check! 2000) 0)]
         #(js/clearInterval timer0)))
     [dev-watch?])

    (rum/use-effect!
     (fn []
       (when handbooks-data
         (set-handbooks-nodes!
          (->> (tree-seq map? :children handbooks-data)
               (reduce #(assoc %1 (or (:key %2) "__root") %2) {})))))
     [handbooks-data])

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
          [:a.flex.items-center {:on-click #(force-nav-dashboard!)} (ui/icon "home")])
        [:a.flex.items-center {:on-click #(nav-to-pane! [:settings nil "Settings"] active-pane0)} (ui/icon "settings")]
        [:a.flex.items-center {:on-click #(state/toggle! :ui/handbooks-open?)}
         (ui/icon "x")]]]

      (when (and (not settings?) (not handbooks-loaded?))
        [:div.flex.items-center.justify-center.pt-32
         (if-not (:error handbooks-state)
           (ui/loading "Loading ...")
           [:code (:error handbooks-state)])])

      (when (or settings? handbooks-loaded?)
        [:<>
         ;; search bar
         (when (or dashboard? (= :topics active-pane))
           (search-bar active-pane))

         ;; entry pane
         (when pane-render
           (apply pane-render
                  (case active-pane
                    :settings
                    [dev-watch? #(do (set-dev-watch? %)
                                     (storage/set :handbooks-dev-watch? %))]

                    ;; default inputs
                    [handbooks-nodes active-pane0 nav-to-pane!])))])]

     (when handbooks-loaded?
       ;; footer
       [:div.ft
        [:p [:span.text-xs.opacity-40 "Join community for more help!"]]
        (when (= :topic-detail active-pane)
          [:<>
           [:h2.uppercase.opacity-60 "Related"]
           (related-topics)])])]))
