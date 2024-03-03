(ns frontend.extensions.handbooks.core
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [cljs.core.async :as async :refer [<! >!]]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.rum :as r]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [camel-snake-kebab.core :as csk]
            [medley.core :as medley]
            [frontend.util :as util]
            [frontend.storage :as storage]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.context.i18n :refer [t]]
            [clojure.edn :as edn]))

(defonce *config (atom {}))

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

(defn inflate-content-assets-urls
  [content]
  (if-let [matches (and (not (string/blank? content))
                        (re-seq #"src=\"([^\"]+)\"" content))]
    (reduce
      (fn [content matched]
        (if-let [matched (second matched)]
          (string/replace content matched (resolve-asset-url matched)) content))
      content matches)
    content))

(defn parse-key-from-href
  [href base]
  (when (and (string? href)
             (not (string/blank? href)))
    (when-let [href (some-> href (string/trim) (string/replace #".edn$" ""))]
      (some-> (if (string/starts-with? href "@")
                (string/replace href #"^[@\/]+" "")
                (util/node-path.join base href))
              (string/lower-case)
              (csk/->snake_case_string)))))

(defn parse-parent-key
  [s]
  (if (and (string? s) (string/includes? s "/"))
    (subs s 0 (string/last-index-of s "/"))
    s))

(defn bind-parent-key
  [{:keys [key] :as node}]
  (cond-> node
          (and (string? key)
               (string/includes? key "/"))
          (assoc :parent (parse-parent-key key))))

(defn load-glide-assets!
  []
  (p/let [_ (util/css-load$ (str util/JS_ROOT "/glide/glide.core.min.css"))
          _ (util/css-load$ (str util/JS_ROOT "/glide/glide.theme.min.css"))
          _ (when-not (aget js/window "Glide")
              (util/js-load$ (str util/JS_ROOT "/glide/glide.min.js")))]))

(rum/defc topic-card
  [{:keys [key title description cover] :as _topic} nav-fn! opts]
  [:button.w-full.topic-card.flex.text-left
   (merge
     {:key      key
      :on-click nav-fn!} opts)
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
            (topic-card topic #(nav! [:topic-detail topic (:title category)] pane-state) nil)
            (:key topic)))))]])

(rum/defc media-render
  [src]
  (let [src (util/trim-safe src)
        extname (some-> src (util/full-path-extname) (subs 1))
        youtube-id (and (string/includes? src "youtube.com/watch?v=")
                        (subs src (+ 2 (string/last-index-of src "v="))))]
    (cond
      (and extname (contains? config/video-formats (keyword extname)))
      [:video {:src src :controls true}]

      (string? youtube-id)
      (youtube/youtube-video youtube-id {:width "100%" :height 235})

      :else [:img {:src src}])))

(rum/defc chapter-select
  [topic children on-select]
  (let [[open?, set-open?] (rum/use-state false)]
    (rum/use-effect!
      (fn []
        (when-let [^js el (js/document.querySelector "[data-identity=logseq-handbooks]")]
          (let [h #(when-not (some->> (.-target %)
                                      (.contains (js/document.querySelector ".chapters-select")))
                     (set-open? false))]
            (.addEventListener el "click" h)
            #(.removeEventListener el "click" h))))
      [])

    [:div.chapters-select.w-full
     [:a.select-trigger
      {:on-click #(set-open? (not open?))
       :tabIndex "0"}
      [:small "Current chapter"]
      [:strong (:title topic)]
      (if open?
        (ui/icon "chevron-down")
        (ui/icon "chevron-left"))

      (when open?
        [:ul
         (for [c children]
           (when (and (seq c) (not= (:key c) (:key topic)))
             [:li {:key (:key c)}
              [:a.flex {:tabIndex "0" :on-click #(on-select (:key c))}
               (or (:title c) (:key c))]]))])]]))

(rum/defc ^:large-vars/cleanup-todo pane-topic-detail
  [handbook-nodes pane-state nav!]

  (let [[deps-pending?, set-deps-pending?] (rum/use-state false)
        *id-ref (rum/use-ref (str "glide--" (js/Date.now)))]

    ;; load deps assets
    (rum/use-effect!
      (fn []
        (set-deps-pending? true)
        (-> (load-glide-assets!)
            (p/then (fn [] (js/setTimeout
                             #(when (js/document.getElementById (rum/deref *id-ref))
                                (doto (js/window.Glide. (str "#" (rum/deref *id-ref))) (.mount))) 50)))
            (p/finally #(set-deps-pending? false))))
      [])

    (rum/use-effect!
      (fn []
        (js/setTimeout #(some-> (js/document.querySelector ".cp__handbooks-content")
                                (.scrollTo 0 0))))
      [pane-state])

    (when-let [topic-key (:key (second pane-state))]
      (when-let [topic (get handbook-nodes topic-key)]
        (let [chapters (:children topic)
              has-chapters? (seq chapters)
              topic (if has-chapters? (first chapters) topic)
              parent (get handbook-nodes (:parent (bind-parent-key topic)))
              chapters (or chapters (:children parent))
              parent-key (:key parent)
              parent-category? (not (string/includes? parent-key "/"))
              show-chapters? (and (not parent-category?) (seq chapters))

              chapters-len (count chapters)
              chapter-current-idx (when-not (zero? chapters-len)
                                    (util/find-index #(= (:key %) (:key topic)) chapters))]

          (when-not deps-pending?
            [:div.pane.pane-topic-detail
             (when-not show-chapters?
               [:h1.text-2xl.pb-3.font-semibold (:title topic)])

             ;; chapters list
             (when show-chapters?
               [:div.chapters-wrap.py-2
                (chapter-select
                  topic chapters
                  (fn [k]
                    (when-let [chapter (get handbook-nodes k)]
                      (nav! [:topic-detail chapter (:title parent)] pane-state))))])

             ;; demos gallery
             (when-let [demos (:demos topic)]
               (let [demos (cond-> demos
                                   (string? demos) (list))]
                 (if (> (count demos) 1)
                   [:div.flex.demos.glide
                    {:id (rum/deref *id-ref)}

                    [:div.glide__track {:data-glide-el "track"}
                     [:div.glide__slides
                      (for [demo demos]
                        [:div.item.glide__slide
                         (media-render (resolve-asset-url demo))])]]

                    [:div.glide__bullets {:data-glide-el "controls[nav]"}
                     (map-indexed
                       (fn [idx _]
                         [:button.glide__bullet {:data-glide-dir (str "=" idx)}
                          (inc idx)])
                       demos)]]

                   [:div.flex.demos.pt-1
                    (media-render (resolve-asset-url (first demos)))])))

             [:div.content-wrap
              (when-let [content (:content topic)]
                [:<>
                 [:div.content.markdown-body
                  {:dangerouslySetInnerHTML {:__html (inflate-content-assets-urls content)}
                   :on-click                (fn [^js e]
                                              (when-let [target (.-target e)]
                                                (if-let [^js img (.closest target "img")]
                                                  (lightbox/preview-images! [{:src (.-src img)
                                                                              :w   (.-naturalWidth img)
                                                                              :h   (.-naturalHeight img)}])
                                                  (when-let [link (some-> (.closest target "a") (.getAttribute "href"))]
                                                    (when-let [to-k (and (not (string/starts-with? link "http"))
                                                                         (parse-key-from-href link parent-key))]
                                                      (if-let [to (get handbook-nodes to-k)]
                                                        (nav! [:topic-detail to (:title parent)] pane-state)
                                                        (js/console.error "ERROR: handbook link resource not found: " to-k link))
                                                      (util/stop e))))))}]

                 (when-let [idx (and (> chapters-len 1) chapter-current-idx)]
                   (let [prev (when-not (zero? idx) (dec idx))
                         next (when-not (= idx (dec chapters-len)) (inc idx))]

                     [:div.controls.flex.justify-between.pt-4
                      [:div (when prev (ui/button [:span.flex.items-center (ui/icon "arrow-left") "Prev chapter"]
                                                  :small? true :on-click #(nav! [:topic-detail (nth chapters prev) (:title parent)] pane-state)))]
                      [:div (when next (ui/button [:span.flex.items-center "Next chapter" (ui/icon "arrow-right")]
                                                  :small? true :on-click #(nav! [:topic-detail (nth chapters next) (:title parent)] pane-state)))]]))])]]))))))

(rum/defc pane-dashboard
  [handbooks-nodes pane-state nav-to-pane!]
  (when-let [root (get handbooks-nodes "__root")]
    [:div.pane.dashboard-pane
     (when-let [popular-topics (:popular-topics root)]
       [:<>
        [:h2 (t :handbook/popular-topics)]
        [:div.topics-list
         (for [topic-key popular-topics]
           (when-let [topic (and (string? topic-key)
                                 (->> (util/safe-lower-case topic-key)
                                      (csk/->snake_case_string)
                                      (get handbooks-nodes)))]
             (topic-card topic #(nav-to-pane! [:topic-detail topic (t :handbook/title)] [:dashboard]) nil)))]])

     [:h2 (t :handbook/help-categories)]
     [:div.categories-list
      (let [categories (:children root)
            categories (conj (vec categories)
                             {:key      :ls-shortcuts
                              :title    [:span "Keyboard shortcuts"]
                              :children [:span (->> (vals @shortcut-config/*config)
                                                    (map count)
                                                    (apply +))
                                         " shortcuts"]
                              :color    "#2563EB"
                              :icon     "command"})]
        (for [{:keys [key title children color icon] :as category} categories
              :let [total (if counted? (count children) 0)]]
          [:button.category-card.text-left
           {:key      key
            :style    {:border-left-color (or (ui/->block-background-color color) "var(--ls-secondary-background-color)")}
            :data-total total
            :on-click #(if (= key :ls-shortcuts)
                         (do (state/toggle! :ui/handbooks-open?)
                             (state/open-right-sidebar!)
                             (state/sidebar-add-block! (state/get-current-repo) "shortcut-settings" :shortcut-settings))
                         (nav-to-pane! [:topics category title] pane-state))}
           [:div.icon-wrap
            (ui/icon (or icon "chart-bubble") {:size 20})]
           [:div.text-wrap
            [:strong title]
            (cond
              (vector? children)
              children

              :else
              [:span (str total " " (util/safe-lower-case (t :handbook/topics)))])]]))]]))

(rum/defc pane-settings
  [dev-watch? set-dev-watch?]
  [:div.pane.pane-settings
   [:div.item
    [:p.flex.items-center.space-x-3.mb-0
     [:strong "Writing mode (preview in time)"]
     (ui/toggle dev-watch? #(set-dev-watch? (not dev-watch?)) true)]
    [:small.opacity-30 (str "Resources from " (get-handbooks-endpoint "/"))]]])

(rum/defc search-bar
  [pane-state nav! handbooks-nodes search-state set-search-state!]
  (let [*input-ref (rum/use-ref nil)
        [q, set-q!] (rum/use-state "")
        [results, set-results!] (rum/use-state nil)
        [selected, set-selected!] (rum/use-state 0)
        select-fn! #(when-let [ldx (and (seq results) (dec (count results)))]
                      (set-selected!
                        (case %
                          :up (if (zero? selected) ldx (max (dec selected) 0))
                          :down (if (= selected ldx) 0 (min (inc selected) ldx))
                          :dune)))

        q (util/trim-safe q)
        active? (not (string/blank? (util/trim-safe q)))
        reset-q! #(->> "" (set! (.-value (rum/deref *input-ref))) (set-q!))
        focus-q! #(some-> (rum/deref *input-ref) (.focus))]

    (rum/use-effect!
      #(focus-q!)
      [pane-state])

    (rum/use-effect!
      (fn []
        (let [pane-nodes (:children (second pane-state))
              pane-nodes (and (seq pane-nodes)
                              (mapcat #(conj (:children %) %) pane-nodes))]

          (set-search-state!
            (merge search-state {:active? active?}))

          (if (and (seq handbooks-nodes) active?)
            (-> (or pane-nodes
                    ;; global
                    (vals (dissoc handbooks-nodes "__root")))
                (search/fuzzy-search q :limit 30 :extract-fn :title)
                (set-results!))
            (set-results! nil))

          (set-selected! 0)))
      [q])

    [:div.search
     [:div.input-wrap.relative
      [:span.icon.absolute.opacity-90
       {:style {:top 6 :left 7}}
       (ui/icon "search" {:size 12})]

      [:input {:placeholder   (t :handbook/search)
               :auto-focus    true
               :default-value q
               :on-change     #(set-q! (util/evalue %))
               :on-key-down   #(case (.-keyCode %)
                                 ;; ESC
                                 27
                                 (if-not active?
                                   (state/toggle! :ui/handbooks-open?)
                                   (reset-q!))

                                 ;; Up
                                 38
                                 (do
                                   (util/stop %)
                                   (select-fn! :up))

                                 ;; Down
                                 40
                                 (do
                                   (util/stop %)
                                   (select-fn! :down))

                                 ;; Enter
                                 13
                                 (when-let [topic (and active? (nth results selected))]
                                   (util/stop %)
                                   (nav! [:topic-detail topic (:title topic)] pane-state))

                                 :dune)
               :ref           *input-ref}]

      (when active?
        [:button.icon.absolute.opacity-50.hover:opacity-80.select-none
         {:style    {:right 6 :top 7}
          :on-click #(do (reset-q!) (focus-q!))}
         (ui/icon "x" {:size 12})])]

     (when (:active? search-state)
       [:div.search-results-wrap
        [:div.results-wrap
         (for [[idx topic] (medley/indexed results)]
           (rum/with-key
             (topic-card topic #(nav! [:topic-detail topic (:title topic)] pane-state)
                         {:class (util/classnames [{:active (= selected idx)}])})
             (:key topic)))]])]))

(rum/defc link-card
  [opts child]

  (let [{:keys [href]} opts]
    [:div.link-card
     (cond-> opts
             (string? href)
             (assoc :on-click #(util/open-url href)))
     child]))

;(rum/defc related-topics
;  []
;  [:div.related-topics
;   (link-card {} [:strong.text-md "How to do something?"])])

(def panes-mapping
  {:dashboard    [pane-dashboard]
   :topics       [pane-category-topics]
   :topic-detail [pane-topic-detail]
   :settings     [pane-settings]})


(defonce discord-endpoint "https://plugins.logseq.io/ds")

(rum/defc footer-link-cards
  []
  (let [[config _] (r/use-atom *config)
        discord-count (:discord-online config)]

    (rum/use-effect!
      (fn []
        (when (or (nil? discord-count)
                  (> (- (js/Date.now) (:discord-online-created config)) (* 10 60 1000)))
          (-> (js/window.fetch discord-endpoint)
              (p/then #(.json %))
              (p/then #(when-let [count (.-approximate_presence_count ^js %)]
                         (swap! *config assoc
                                :discord-online (.toLocaleString count)
                                :discord-online-created (js/Date.now)))))))
      [discord-count])

    [:<>
     ;; more links
     [:div.flex.space-x-3
      {:style {:padding-top "4px"}}
      (link-card
        {:class "flex-1" :href "https://discord.gg/KpN4eHY"}
        [:div.inner.flex.space-x-1.flex-col
         (ui/icon "brand-discord" {:class "opacity-30" :size 26})
         [:h1.font-medium.py-1 "Chat on Discord"]
         [:h2.text-xs.leading-4.opacity-40 "Ask quick questions, meet fellow users, and learn new workflows."]
         [:small.flex.items-center.pt-1.5
          [:i.block.rounded-full.bg-green-500 {:style {:width "8px" :height "8px"}}]
          [:span.pl-2.opacity-90
           [:strong.opacity-60 (or discord-count "?")]
           [:span.opacity-70.font-light " users online"]]]])

      (link-card
        {:class "flex-1" :href "https://discuss.logseq.com"}
        [:div.inner.flex.space-x-1.flex-col
         (ui/icon "message-dots" {:class "opacity-30" :size 26})
         [:h1.font-medium.py-1 "Visit the forum"]
         [:h2.text-xs.leading-4.opacity-40 "Give feedback, request features, and have in-depth conversations."]
         [:small.flex.items-center.pt-1.5
          [:i.flex.items-center.opacity-50 (ui/icon "bolt" {:size 14})]
          [:span.pl-1.opacity-90
           [:strong.opacity-60 "800+"]
           [:span.opacity-70.font-light " monthly posts"]]]])]]))

(rum/defc ^:large-vars/data-var content
  []
  (let [[active-pane-state, set-active-pane-state!]
        (rum/use-state [:dashboard nil (t :handbook/title)])

        [handbooks-state, set-handbooks-state!]
        (rum/use-state nil)

        [handbooks-nodes, set-handbooks-nodes!]
        (rum/use-state nil)

        [history-state, set-history-state!]
        (rum/use-state ())

        [dev-watch?, set-dev-watch?]
        (rum/use-state (storage/get :handbooks-dev-watch?))

        [search-state, set-search-state!]
        (rum/use-state {:active? false})

        reset-handbooks! #(set-handbooks-state! {:status nil :data nil :error nil})
        update-handbooks! #(set-handbooks-state! (fn [v] (merge v %)))
        load-handbooks! (fn []
                          (when-not (= :pending (:status handbooks-state))
                            (reset-handbooks!)
                            (update-handbooks! {:status :pending})
                            (-> (p/let [^js res (js/fetch (get-handbooks-endpoint "/handbooks.edn"))
                                        data (.text res)]
                                  (update-handbooks! {:data (edn/read-string data)}))
                                (p/catch #(update-handbooks! {:error (str %)}))
                                (p/finally #(update-handbooks! {:status :completed})))))

        active-pane-name (first active-pane-state)
        pane-render (first (get panes-mapping active-pane-name))
        pane-dashboard? (= :dashboard active-pane-name)
        pane-settings? (= :settings active-pane-name)
        pane-topic? (= :topic-detail active-pane-name)
        force-nav-dashboard! (fn []
                               (set-active-pane-state! [:dashboard])
                               (set-history-state! '()))

        handbooks-loaded? (and (seq (:data handbooks-state))
                               (= :completed (:status handbooks-state)))
        handbooks-data (:data handbooks-state)
        nav-to-pane! (fn [next-state prev-state]
                       (let [next-key (:key (second next-state))
                             prev-key (:key (second prev-state))
                             in-chapters? (and prev-key next-key (string/includes? prev-key "/")
                                               (or (string/starts-with? next-key prev-key)
                                                   (apply = (map parse-parent-key [prev-key next-key]))))]
                         (when-not in-chapters?
                           (set-history-state!
                             (conj (sequence history-state) prev-state))))
                       (set-active-pane-state! next-state))

        [scrolled?, set-scrolled!] (rum/use-state false)
        on-scroll (rum/use-memo #(util/debounce 100 (fn [^js e] (set-scrolled! (not (< (.. e -target -scrollTop) 10))))) [])]

    ;; load handbooks
    (rum/use-effect!
      #(load-handbooks!)
      [])

    ;; navigation sentry
    (rum/use-effect!
      (fn []
        (when (seq handbooks-nodes)
          (let [c (:handbook/route-chan @state/state)]
            (async/go-loop []
                           (let [v (<! c)]
                             (when (not= v :return)
                               (when-let [to (get handbooks-nodes v)]
                                 (nav-to-pane! [:topic-detail to (t :handbook/title)] [:dashboard]))
                               (recur))))
            #(async/go (>! c :return)))))
      [handbooks-nodes])

    (rum/use-effect!
      (fn []
        (let [*cnt-len (atom 0)
              check! (fn []
                       (-> (p/let [^js res (js/fetch (get-handbooks-endpoint "/handbooks.edn") #js{:method "HEAD"})]
                             (when-let [cl (.get (.-headers res) "content-length")]
                               (when (not= @*cnt-len cl)
                                 (println "[Handbooks] dev reload!")
                                 (load-handbooks!))
                               (reset! *cnt-len cl)))
                           (p/catch #(println "[Handbooks] dev check Error:" %))))
              timer0 (if dev-watch?
                       (js/setInterval check! 2000) 0)]
          #(js/clearInterval timer0)))
      [dev-watch?])

    (rum/use-effect!
      (fn []
        (when handbooks-data
          (let [nodes (->> (tree-seq map? :children handbooks-data)
                           (reduce #(assoc %1 (or (:key %2) "__root") (bind-parent-key %2)) {}))]
            (set-handbooks-nodes! nodes)
            (set! (.-handbook-nodes js/window) (bean/->js nodes)))))
      [handbooks-data])

    [:div.cp__handbooks-content
     {:class     (util/classnames [{:search-active (:active? search-state)
                                    :scrolled      scrolled?}])
      :on-scroll on-scroll}
     [:div.pane-wrap
      [:div.hd.flex.justify-between.select-none.draggable-handle
       [:h1.text-xl.flex.items-center.font-bold
        (if pane-dashboard?
          [:span (t :handbook/title)]
          [:button.active:opacity-80.flex.items-center.cursor-pointer
           {:on-click (fn [] (let [prev (first history-state)
                                   prev (cond-> prev
                                                (nil? (seq prev))
                                                [:dashboard])]
                               (set-active-pane-state! prev)
                               (set-history-state! (rest history-state))))}
           [:span.pr-2.flex.items-center (ui/icon "chevron-left")]
           (let [title (or (last active-pane-state) (t :handbook/title) "")]
             [:span.truncate.title {:title title} title])])]

       [:div.flex.items-center.space-x-3
        (when (> (count history-state) 1)
          [:a.flex.items-center {:aria-label (t :handbook/home) :tabIndex "0" :on-click #(force-nav-dashboard!)} (ui/icon "home")])
        (when pane-topic?
          [:a.flex.items-center
           {:aria-label "Copy topic link" :tabIndex "0"
            :on-click   (fn []
                          (let [s (str "logseq://handbook/" (:key (second active-pane-state)))]
                            (util/copy-to-clipboard! s)
                            (notification/show!
                              [:div [:strong.block "Handbook link copied!"]
                               [:label.opacity-50 s]] :success)))}
           (ui/icon "copy")])
        (when (state/developer-mode?)
          [:a.flex.items-center {:aria-label (t :handbook/settings)
                                 :tabIndex   "0"
                                 :on-click   #(nav-to-pane! [:settings nil "Settings"] active-pane-state)}
           (ui/icon "settings")])
        [:a.flex.items-center {:aria-label (t :handbook/close) :tabIndex "0" :on-click #(state/toggle! :ui/handbooks-open?)}
         (ui/icon "x")]]]

      (when (and (not pane-settings?) (not handbooks-loaded?))
        [:div.flex.items-center.justify-center.pt-32
         (if-not (:error handbooks-state)
           (ui/loading "Loading ...")
           [:code (:error handbooks-state)])])

      (when (or pane-settings? handbooks-loaded?)
        [:<>
         ;; search bar
         (when (or pane-dashboard? (= :topics active-pane-name))
           (search-bar active-pane-state nav-to-pane!
                       handbooks-nodes search-state set-search-state!))

         ;; entry pane
         (when pane-render
           (apply pane-render
                  (case active-pane-name
                    :settings
                    [dev-watch? #(do (set-dev-watch? %)
                                     (storage/set :handbooks-dev-watch? %))]

                    ;; default inputs
                    [handbooks-nodes active-pane-state nav-to-pane!])))])]

     (when handbooks-loaded?
       ;; footer
       (when pane-dashboard?
         [:div.ft
          (footer-link-cards)

          ;; TODO: how to get related topics?
          ;(when (= :topic-detail active-pane)
          ;  [:<>
          ;   [:h2.uppercase.opacity-60 "Related"]
          ;   (related-topics)])
          ]))]))
