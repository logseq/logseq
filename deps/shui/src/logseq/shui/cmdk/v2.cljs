(ns logseq.shui.cmdk.v2
  (:require 
    [clojure.string :as str]
    [logseq.shui.util :as util]
    [logseq.shui.button.v2 :as button]
    [logseq.shui.icon.v2 :as icon]
    [rum.core :as rum]))

(def state (atom {:current-engine "All"
                  :highlight-index 0 
                  :button {:text "Open" :theme :gray :shortcut ["return"]}
                  :query ""
                  :results {:blocks [] :pages [] :files []}}))

; (let [entity (-> @state :context :entity)
;       block (-> @state :results :blocks first)
;       preview-uuid (-> @state :preview-uuid)
;       {:keys [blocks-container get-block-and-children get-current-repo]} (:context @state)]
;   ; (keys (entity (:block/page block)))
;   ; blockgc)
;   ; (blocks-container
;   ;   (get-block-and-children (get-current-repo) preview-uuid) 
;   ;   {:id preview-uuid :preview? true}))
;   ; puuid)
;   (get-block-and-children (get-current-repo) (keyword preview-uuid)))
;   ; preview-uuid)
;   ; (get-current-repo))

; "6492d9e2-7554-4015-a28b-d6acbb6c1a19"
; "logseq_local_shui-graph"
  

(defn handle-query-change [e context]
  (let [query (.. e -target -value)]
    (swap! state assoc :query query)
    (when (and (seq query) (seq (str/trim query)))
      (-> ((:search context) query)
          (.then #(swap! state assoc :results %))))))

(defn get-results []
  [])

(defn get-preview []
  nil)

(rum/defc result-heading [text]
  [:div.text-xs.font-bold.pt-4.pb-1.px-6 {:style {:color "var(--lx-gray-11)"}} text])

(rum/defc result-item [{:keys [icon icon-theme text info shortcut value-label value title highlighted on-highlight on-highlight-dep]}]
  (rum/use-effect! 
    (fn [] 
      (when highlighted 
        (on-highlight)))
    [highlighted on-highlight-dep])
  [:div.flex.px-6.gap-3.py-4 {:style {:background (if highlighted "var(--lx-gray-01)" "var(--lx-gray-02)")}}
   [:div.w-5.h-5.rounded.flex.items-center.justify-center 
    {:style {:background (case icon-theme :color "var(--lx-accent-09)" :gray "var(--lx-gray-09)" :gradient "linear-gradient(-65deg, #8AE8FF, #5373E7, #369EFF, #00B1CC)")
             :box-shadow (when (#{:color :gradient} icon-theme) "inset 0 0 0 1px rgba(255,255,255,0.3) ")}}
    (icon/root icon {:size "14"})]
   [:div.flex.flex-1.flex-col
    (when title
      [:div.text-sm.pb-2.font-bold {:style {:color "var(--lx-gray-11)"}} title])
    [:div {:class "text-sm font-medium"} text
     (when info 
       [:span {:style {:color "var(--lx-gray-11)"}} (str " — " info)])]]
   (when (or value-label value)
     [:div {:class "text-xs"}
      [:span {:style {:color "var(--lx-gray-11)"}} (str value-label ": ")]
      [:span {:style {:color "var(--lx-gray-12)"}} value]])
   (when shortcut 
     [:div
      (for [key shortcut]
        [:span (str key)])])])

(rum/defc engines < rum/reactive [context]
  (let [state-value (rum/react state)
        {:keys [current-engine]} state-value
        active-themes {"Quick capture" :color "AI" :gradient}]
    [:div.flex.gap-4.px-6
     (for [engine ["All" "Pages" "Blocks" "Quick capture" "AI"]
           :let [theme (if (= engine current-engine) (get active-themes engine :gray) :gray)
                 muted (if (= engine current-engine) "" " opacity-50")]]
       [:div {:class (str "inline-block text-sm font-medium" muted)}
        (button/root {:text engine :depth 0 :size :sm :theme theme} context)])]))

(defn button-updater [text theme & shortcut]
  (fn []
    (swap! state assoc :button {:text text :theme theme :shortcut (map name shortcut)})))

(defn button-updater-with-preview [preview-uuid text theme & shortcut]
  (fn [] 
    (apply button-updater text theme shortcut)
    (if (string? preview-uuid)
      (swap! state assoc :preview-uuid (uuid preview-uuid))
      (swap! state assoc :preview-uuid preview-uuid))))

(rum/defc results < rum/reactive []
  (let [state-value (rum/react state)
        {:keys [current-engine highlight-index results]} state-value
        filtered-actions (when (#{"All" "Actions"} current-engine) 
                           [{:icon-theme :color :icon "plus" :text "Quick capture" :info "Add a block to todays journal page" :on-highlight (button-updater "Quick capture" :color :return)}
                            {:icon-theme :gradient :icon "question-mark" :text "Generate short answer" :on-highlight (button-updater "Generate" :gradient :return)} 
                            {:icon-theme :gray :icon "toggle-left" :text "Toggle Logseq Sync" :value-label "Current State" :value "On" :on-highlight (button-updater "Toggle" :gray :return)} 
                            {:icon-theme :gray :icon "player-play" :text "Restart Logseq Sync Onboarding" :on-highlight (button-updater "Restart" :gray :return)}])
        filtered-qc-actions (when (#{"Quick capture"} current-engine)
                              [{:icon-theme :color :icon "block" :text "Create block" :info "Add a block to todays journal page" :on-highlight (button-updater "Create" :color :cmd :return)} 
                               {:icon-theme :color :icon "page" :text "Create page" :on-highlight (button-updater "Create" :color :cmd :return)} 
                               {:icon-theme :color :icon "whiteboard" :text "Create whiteboard" :info "Create a whiteboard with this block on it" :on-highlight (button-updater "Create" :color :cmd :return)}]) 
        filtered-ai-actions (when (#{"AI"} current-engine)
                              [{:icon-theme :gradient :icon "page" :text "Ask about the current page" :on-highlight (button-updater "Query" :gradient :return)}
                               {:icon-theme :gradient :icon "graph" :text "Ask about the current graph" :on-highlight (button-updater "Query" :gradient :return)} 
                               {:icon-theme :gradient :icon "messages" :text "Chat" :info "Chat with an AI about any topic" :on-highlight (button-updater "Start chat" :gradient :return)} 
                               {:icon-theme :gradient :icon "question-mark" :text "Generate short answer" :on-highlight (button-updater "Generate" :gradient :return)}])
        filtered-blocks  (when (#{"All" "Blocks"} current-engine) 
                           (->> (:blocks results) 
                                (map #(hash-map :title (:block/content %) :on-highlight (button-updater-with-preview (:block/uuid %) "Open" :gray :return) :icon-theme :gray :icon "block"))))
                           ; [{:icon-theme :gray :icon "block" :title "Not a real document" :on-highlight (button-updater "Open" :gray :return) :text "When working on cmdk, we want to display blocks that appear from search. These can have quite a long body of text, and that body of text should potentially be truncated"} 
                           ;  {:icon-theme :gray :icon "block" :title "Not a real document" :on-highlight (button-updater "Open" :gray :return) :text "Of course, that truncated text should be truncated in a way that makes sense, and doesn't cut off in the middle of a word, and contains the search query if there is one"} 
                           ;  {:icon-theme :gray :icon "block" :title "Not a real document" :on-highlight (button-updater "Open" :gray :return) :text "We should play around with displaying the blocks hierarchy, currently it's very noisy, and I'm not sure if it's adding much value. It's possible that the preview will be a sufficient replacement"}])
        filtered-pages   (when (#{"All" "Pages"} current-engine)
                           (->> (:pages results) 
                                (map #(hash-map :title % :on-highlight (button-updater "Open" :gray :return) :icon-theme :gray :icon "page"))))
                           ; [{:icon-theme :gray :icon "page" :text "Memo/CMDK" :on-highlight (button-updater "Open" :gray :return)} 
                           ;  {:icon-theme :gray :icon "page" :text "Logseq Logo Community Contest" :on-highlight (button-updater "Open" :gray :return)}]) 
        grouped-items    (->> [["Actions" filtered-actions] ["Actions" filtered-qc-actions] ["Actions" filtered-ai-actions] ["Blocks" filtered-blocks] ["Pages" filtered-pages]]
                              (filter #(not-empty (second %))))
        item-count       (count (mapcat second grouped-items))
        highlight-index-normalized (cond 
                                     (zero? item-count)
                                     nil
                                     (<= 0 (mod highlight-index item-count))
                                     (mod highlight-index item-count)
                                     :else
                                     (- item-count (mod highlight-index item-count)))
        highlight-item   (some->> highlight-index-normalized (nth (mapcat second grouped-items)))] 
    [:div.overflow-y-auto {:style {:max-height "50dvh"}}
     (for [[index [group items]] (map-indexed vector grouped-items)] 
       [:<> 
        (when-not (zero? index) 
         [:div.w-full {:style {:background "var(--lx-gray-07)"}
                       :class "h-px"}])
        (result-heading group)
        (for [item items]
          (result-item (assoc item :highlighted (= item highlight-item) :on-highlight-dep current-engine)))])]))

(rum/defc preview < rum/reactive 
  [_ {:keys [blocks-container get-block-and-children get-current-repo entity get-page page-cp get-page-blocks-no-cache get-block-children page] :as context}]
  (let [state-value (rum/react state)
        preview-uuid (:preview-uuid state-value)
        preview-entity (entity [:block/uuid preview-uuid])
        preview-page (:block/page preview-entity)
        preview-page-uuid (:block/uuid preview-page)
        preview-page-name (:block/name preview-page)]
    (-> {:preview-uuid preview-uuid :preview-page-uuid preview-page-uuid :preview-page-name preview-page-name} 
        pr-str 
        js/console.log)
    [:div 
     ;; page 
     (page {:page-name preview-page-name})]))
     ; (page-cp {:preview? true
     ;           :contents-page? (= "contents" (str/lower-case (str preview-page-name))) 
     ;           :children (get-block-children (get-current-repo) preview-page-uuid)}
     ;          preview-page)]))
     ;; block
     ; (blocks-container
     ;   (get-block-and-children (get-current-repo) preview-uuid) 
     ;   ; (get-block-and-children (get-current-repo) preview-page-uuid) 
     ;   ; (get-page preview-page-uuid) 
     ;   {:id preview-uuid :preview? true})]))

; (let [preview-uuid (:preview-uuid @state)
;       entity (-> @state :context :entity)]
;   (keys (:block/page (entity [:block/uuid preview-uuid]))))

(rum/defc actions < rum/reactive []
  (let [state-value (rum/react state)
        button-props (:button state-value)]
    [:div.py-4.px-6.flex.justify-end.gap-6.border-t
     {:style {:background-color "var(--lx-gray-03)"
              :border-color "var(--lx-gray-07)"}}
     (button/root {:text "Cancel" :theme :gray} {})
     (button/root button-props {})]))

(rum/defc quick-capture []
  [:div.px-6
   [:div.flex.items-center
    [:div.w-4.h-4.flex.items-center.justify-center
     [:div.w-2.h-2.bg-white.rounded-full.opacity-25]]
    [:input {:class "w-full border-0 px-6 bg-transparent" 
             :type "text"}]]
   [:div.flex.items-center 
    (icon/root "circle-plus" {:style {:opacity 0.5}})
    [:input {:class "w-full border-0 px-6 bg-transparent"
             :type "text"}]]])

(rum/defc search < rum/reactive [context]
  (let [state-value (rum/react state)
        query (:query state-value)]
    [:input {:class "w-full border-0 px-6"
             :type "text" 
             :placeholder "Search"
             :value query
             :on-change #(handle-query-change % context)}]))

(rum/defc header < rum/reactive 
  [context]
  (let [state-value (rum/react state) 
        current-engine (:current-engine state-value)]
    [:div.relative.border-b.flex.flex-col.gap-4.pt-4.pb-1.rounded 
     {:style {:border-color "var(--lx-gray-07)" 
              :background (when (= current-engine "Quick capture") "var(--lx-accent-02")}
      :class (when (= current-engine "Quick capture") "shui__cmdk-quick-capture-glow")}
     (engines context)
     (if (= current-engine "Quick capture")
       (quick-capture)
       (search context))]))

(defn prev-engine [current-engine]
  (->> ["All" "Pages" "Blocks" "Quick capture" "AI" "All"]
       (reverse)
       (drop-while (complement #{current-engine}))
       (second)))

(defn next-engine [current-engine]
  (->> ["All" "Pages" "Blocks" "Quick capture" "AI" "All"]
       (drop-while (complement #{current-engine}))
       (second)))

(defonce keydown-handler
  (fn [e]
    (case (.-key e)
      ; "Escape" (rum/dispatch! :close)
      "ArrowDown" (swap! state update :highlight-index inc)
      "ArrowUp" (swap! state update :highlight-index dec)
      "j" (when (.-metaKey e) 
            (if (.-shiftKey e)
              (swap! state update :current-engine prev-engine)
              (swap! state update :current-engine next-engine)))
      ; "ArrowUp" (rum/dispatch! :highlight-prev)
      ; "Enter" (rum/dispatch! :select)
      (println (.-key e)))))

(defn use-cmdk-keyboard-bindings! []
  (rum/use-effect! 
    (fn []
      (js/window.addEventListener "keydown" keydown-handler)
      #(js/window.removeEventListener "keydown" keydown-handler))
    []))

(rum/defc body < rum/reactive [context]
  (let [state-value (rum/react state)
        preview-uuid (:preview-uuid state-value)]
    (if preview-uuid
      [:div.grid.grid-cols-2
       (results)
       (preview preview-uuid context)]
      [:div.grid.grid-cols-1 
       (results)])))
  

(rum/defc root < rum/reactive
  {:did-mount (fn [_] 
                (js/window.removeEventListener "keydown" keydown-handler)
                (js/window.addEventListener "keydown" keydown-handler))
   :will-unmount (fn [_] (js/window.removeEventListener "keydown" keydown-handler))}
  [props context]
  (swap! state assoc :context context)
  ; (use-cmdk-keyboard-bindings!)
  [:div.-m-8 {:style {:background-color "var(--lx-gray-02)"
                      :width "75vw" 
                      :max-width 800}}
   (header context)
   (body context)
   [:div
    (actions)]])
   

