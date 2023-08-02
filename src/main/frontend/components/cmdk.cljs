(ns frontend.components.cmdk
  (:require 
    [clojure.string :as string]
    [frontend.components.block :as block]
    [frontend.components.command-palette :as cp]
    [frontend.components.page :as page]
    [frontend.context.i18n :refer [t]]
    [frontend.db :as db]
    [frontend.db.model :as model]
    [frontend.handler.command-palette :as cp-handler]
    [frontend.handler.editor :as editor-handler]
    [frontend.handler.route :as route-handler]
    [frontend.handler.search :as search-handler]
    [frontend.modules.shortcut.core :as shortcut]
    [frontend.modules.shortcut.data-helper :as shortcut-helper]
    [frontend.search :as search]
    [frontend.state :as state]
    [frontend.ui :as ui]
    [frontend.util :as util]
    [goog.functions :as gfun]
    [logseq.shui.context :refer [make-context]]
    [logseq.shui.core :as shui]
    [promesa.core :as p]
    [rum.core :as rum]))

;; When CMDK opens, we have some default search actions we make avaialbe for quick access
(def default-search-actions 
  [{:text "Search only pages"     :info "Add filter to search"}
   {:text "Search only blocks"    :info "Add filter to search"}
   {:text "Create block"          :info "Add a block to today's journal page" :icon "block"         :icon-theme :color}
   {:text "Generate short answer" :info "Ask a language model"                :icon "question-mark" :icon-theme :gradient}
   {:text "Open settings"                                                     :icon "settings"      :icon-theme :gray}])

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results 
  {:search-actions {:status :success :show-more false :items default-search-actions} 
   :commands       {:status :success :show-more false :items nil}
   :history        {:status :success :show-more false :items nil}
   :current-page   {:status :success :show-more false :items nil}
   :pages          {:status :success :show-more false :items nil}
   :blocks         {:status :success :show-more false :items nil} 
   :files          {:status :success :show-more false :items nil}})        
                    
;; Each result gorup has it's own load-results function
(defmulti load-results (fn [group state] group))

;; The search-actions are only loaded when there is no query present. It's like a quick access to filters
(defmethod load-results :search-actions [group state]
  (let [!input (::input state)
        !results (::results state)]
    (if (empty? @!input)
      (swap! !results assoc group {:status :success :items default-search-actions})
      (swap! !results assoc group {:status :success :items nil}))))

;; The commands search uses the command-palette hander
(defmethod load-results :commands [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (->> (vals (cp-handler/get-commands-unique))
         (filter #(string/includes? (string/lower-case (pr-str %)) (string/lower-case @!input)))
         (map #(hash-map :icon "command" 
                         :icon-theme :gray 
                         :text (cp/translate t %)
                         :value-label (pr-str (:id %))
                         ; :info (pr-str (:id %))
                         ; :info (:desc %) 
                         :shortcut (:shortcut %)
                         :source-command %))
         (hash-map :status :success :items)
         (swap! !results assoc group)) 
    (js/console.log "commands" (clj->js (get-in @!results [:commands :items])))))

;; The pages search action uses an existing handler
(defmethod load-results :pages [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [pages (search/page-search @!input)
            items (map #(hash-map :icon "page" 
                                  :icon-theme :gray 
                                  :text % 
                                  :source-page %) pages)]
      (js/console.log "pages" (pr-str pages) (clj->js items))
      (swap! !results assoc group {:status :success :items items}))))

;; The blocks search action uses an existing handler
(defmethod load-results :blocks [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        opts {:limit 100}]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            items (map #(hash-map :icon "block" 
                                  :icon-theme :gray 
                                  :text (:block/content %) 
                                  :header (some-> % :block/page db/entity :block/name)
                                  :source-block %) blocks)]
                              
      ; (js/console.log "blocks" (clj->js items) (map (comp pr-str :block/page) blocks))
      ; (js/console.log "blocks" (clj->js items) 
      ;                 (pr-str (map (comp pr-str :block/page) blocks)) 
      ;                 (pr-str (map (comp :block/name :block/page) blocks)) 
      ;                 (pr-str (map (comp :block/name db/entity :block/page) blocks)))
      (swap! !results assoc group {:status :success :items items}))))

;; The default load-results function triggers all the other load-results function
(defmethod load-results :default [_ state]
  (js/console.log "load-results/default" @(::input state))
  (load-results :search-actions state)
  (load-results :commands state)
  (load-results :blocks state)
  (load-results :pages state))

; (def search [query]
;   (load-results :search-actions state))
  ; (let [repo (state/get-current-repo)
  ;       limit 5
  ;       current-page-db-id nil 
  ;       opts {:limit limit}]
  ;   (p/let [blocks (search/block-search repo q opts)
  ;           pages (search/page-search q)
  ;           pages-content (when current-page-db-id (search/page-content-search repo q opts))
  ;           files (search/file-search q)
  ;           commands])))

(defmulti handle-action (fn [action _state _item _event] action))

(defmethod handle-action :cancel [_ state item event]
  (js/console.log :handle-action/cancel)
  (state/close-modal!))

(defmethod handle-action :copy-page-ref [_ state item event]
  (when-let [page-name (:source-page item)]
    (util/copy-to-clipboard! page-name)
    (state/close-modal!)))
    
(defmethod handle-action :copy-block-ref [_ state item event]
  (when-let [block-uuid (some-> item :source-block :block/uuid uuid)]
    (editor-handler/copy-block-ref! block-uuid)
    (state/close-modal!)))

(defmethod handle-action :open-page [_ state item event]
  (when-let [page-name (:source-page item)]
    (route-handler/redirect-to-page! page-name)
    (state/close-modal!)))

(defmethod handle-action :open-block [_ state item event]
  (let [get-block-page (partial model/get-block-page (state/get-current-repo))]
    (when-let [page (some-> item :source-block :block/uuid uuid get-block-page :block/name model/get-redirect-page-name)]
      (route-handler/redirect-to-page! page)
      (state/close-modal!))))

(defmethod handle-action :open-page-right [_ state item event]
  (when-let [page-uuid (some-> item :source-page model/get-page :block/uuid uuid)]
    (js/console.log "oepn-page-right" page-uuid) 
    (editor-handler/open-block-in-sidebar! page-uuid)))

(defmethod handle-action :open-block-right [_ state item event]
  (when-let [block-uuid (some-> item :source-block :block/uuid uuid)]
    (js/console.log "oepn-block-right" block-uuid) 
    (editor-handler/open-block-in-sidebar! block-uuid)))

(defmethod handle-action :trigger [_ state item event])
(defmethod handle-action :return [_ state item event])

(rum/defc result-group < rum/reactive 
  [state title group visible-items highlighted-result]
  (let [{:keys [show-more items]} (some-> state ::results deref group)] 
    [:div {:class ""}
     [:div {:class "text-xs py-1.5 px-6 flex justify-between items-center gap-2" 
            :style {:color "var(--lx-gray-11)" 
                    :background "var(--lx-gray-02)"}} 
      [:div {:class "font-bold" 
             :style {:color "var(--lx-gray-11)"}} title]
      [:div {:class "bg-white/20 px-1.5 py-px text-white rounded-full"
             :style {:font-size "0.6rem"}}
       (if (<= 100 (count items))
         (str "99+")
         (count items))]
      [:div {:class "flex-1"}]
      (if show-more
        [:div {:on-click #(swap! (::results state) update-in [group :show-more] not)} "Show less"]
        [:div {:on-click #(swap! (::results state) update-in [group :show-more] not)} "Show more"])]

     [:div {:class ""}
      (for [result visible-items
            :let [highlighted? (= result highlighted-result)]]
       (shui/list-item (assoc result 
                              :highlighted highlighted?
                              :on-highlight (fn [ref]  
                                              (.. ref -current (scrollIntoView #js {:block "center" 
                                                                                    :inline "nearest"
                                                                                    :behavior "smooth"})) 
                                              (case group 
                                                :search-actions (reset! (::actions state) [:cancel :return])
                                                :commands       (reset! (::actions state) [:cancel :trigger])
                                                :pages          (reset! (::actions state) [:cancel :copy-page-ref :open-page-right :open-page])
                                                :blocks         (reset! (::actions state) [:cancel :copy-block-ref :open-block-right :open-block])
                                                nil)))))]]))
                                                
                                                  

(defonce keydown-handler
  (fn [state e]
    (when (#{"ArrowDown" "ArrowUp"} (.-key e))
      (.preventDefault e))
    (case (.-key e)
      ; "Escape" (rum/dispatch! :close)
      "ArrowDown" (swap! (::highlight-index state) inc)
      "ArrowUp"   (swap! (::highlight-index state) dec)
      ; "j" (when (.-metaKey e) 
      ;       (if (.-shiftKey e)
      ;         (swap! state update :current-engine prev-engine)
      ;         (swap! state update :current-engine next-engine)))
      ; "ArrowUp" (rum/dispatch! :highlight-prev)
      ; "Enter" (rum/dispatch! :select)
      (println (.-key e)))))

(defn handle-input-change [state e]
  (let [input (.. e -target -value)
        !input (::input state)
        !load-results-throttled (::load-results-throttled state)]
    ;; update the input value in the UI
    (reset! !input input) 

    ;; ensure that there is a throttled version of the load-results function
    (when-not @!load-results-throttled
      (reset! !load-results-throttled (gfun/throttle load-results 1000)))

    ;; retreive the laod-results function and update all the results
    (when-let [load-results-throttled @!load-results-throttled]
      (load-results-throttled :all state))))

(rum/defc page-preview [state highlighted]
  (let [page-name (:source-page highlighted)]
    (page/page {:page-name (model/get-redirect-page-name page-name) :whiteboard? true})))

(rum/defc block-preview [state highlighted]
  (let [block (:source-block highlighted)
        block-uuid-str (str (:block/uuid block))]
    ; ((state/get-component :block/single-block) (uuid (:block/uuid block)))))
    ; ((state/get-component :block/container) block)
    ; ((state/get-component :block/embed) (uuid (:block/uuid block)))))
    ; (block/block-container {} block)))
    (page/page {:parameters {:path {:name block-uuid-str}} 
                :sidebar? true 
                :repo (state/get-current-repo)})))

(rum/defcs cmdk < 
  shortcut/disable-all-shortcuts 
  (rum/local "" ::input)
  (rum/local 0 ::highlight-index)
  (rum/local nil ::keydown-handler)
  (rum/local default-results ::results)
  (rum/local nil ::load-results-throttled)
  (rum/local [:cancel :return] ::actions)
  {:did-mount (fn [state] 
                (let [next-keydown-handler (partial keydown-handler state)]
                  (when-let [prev-keydown-handler @(::keydown-handler state)]
                    (js/window.removeEventListener "keydown" prev-keydown-handler))
                  (js/window.addEventListener "keydown" next-keydown-handler)
                  (reset! (::keydown-handler state) next-keydown-handler))
                state)
   :will-unmount (fn [state] 
                   (when-let [current-keydown-handler (some-> state ::keydown-handler deref)] 
                     (js/window.removeEventListener "keydown" current-keydown-handler))
                   (reset! (::keydown-handler state) nil)
                   state)}
  [state {:keys []}]
  (let [input @(::input state)
        actions @(::actions state)
        highlight-index @(::highlight-index state)
        results @(::results state)
        visible-items-for-group (fn [group] 
                                  (let [{:keys [items show-more]} (get results group)]
                                    (if show-more items (take 5 items))))
        results-ordered [["Search actions" :search-actions (visible-items-for-group :search-actions)]
                         ["Commands"       :commands       (visible-items-for-group :commands)]
                         ["Pages"          :pages          (visible-items-for-group :pages)]
                         ["Blocks"         :blocks         (visible-items-for-group :blocks)]]
        results (mapcat last results-ordered)
        result-count (count results)
        highlighted-result-index (cond 
                                   (zero? result-count) nil 
                                   (<= 0 (mod highlight-index result-count)) (mod highlight-index result-count) 
                                   :else (- result-count (mod highlight-index result-count)))
        highlighted-result (when highlighted-result-index 
                             (nth results highlighted-result-index nil))
        preview? (or (:source-page highlighted-result) (:source-block highlighted-result))]
    [:div.cp__cmdk {:class "-m-8 max-w-[90dvw] max-h-[90dvh] w-[60rem] h-[30.7rem] "}
     [:div {:class ""
            :style {:background "var(--lx-gray-02)"
                    :border-bottom "1px solid var(--lx-gray-07)"}}
      [:input {:class "text-xl bg-transparent border-none w-full outline-none px-4 py-3" 
               :placeholder "What are you looking for?"
               :ref #(when % (.focus %))
               :on-change (partial handle-input-change state)
               :value input}]]

     [:div {:class (str "grid" (if preview? " grid-cols-2" " grid-cols-1"))}
      [:div {:class "pt-1 overflow-y-auto h-96"
             :style {:background "var(--lx-gray-02)"}}
       (for [[group-name group-key group-items] results-ordered
             :when (not-empty group-items)]
         (result-group state group-name group-key group-items highlighted-result))]
      (when preview?
       [:div {:class "h-96 overflow-y-auto"} 
        (cond 
         (:source-page highlighted-result)
         (page-preview state highlighted-result)
         (:source-block highlighted-result)
         (block-preview state highlighted-result))])]

     [:div {:class "flex justify-between w-full px-4"
            :style {:background "var(--lx-gray-03)"
                    :border-top "1px solid var(--lx-gray-07)"}}
      [:div {:class "flex items-stretch gap-2"}
       (for [[tab-name tab-icon] [["Search" "search"] 
                                  ["Capture" "square-plus"]]
             :let [active? (= tab-name "Search")]]
        [:div {:class "flex items-center px-1.5 gap-1 relative"}
         (when active? 
           [:div {:class "absolute inset-x-0 top-0 h-0.5 bg-gray-500"}])
         (when active?
          (shui/icon tab-icon {:size "16"}))
         [:div {:class ""} tab-name]])]
      [:div {:class "flex items-center py-3 gap-4"}
       (for [action actions
             :let [on-click (partial handle-action action state highlighted-result)]]
         (case action
           :cancel           (shui/button {:text "Cancel"           :theme :gray  :on-click on-click :shortcut ["esc"]}) 
           :copy-page-ref    (shui/button {:text "Copy"             :theme :gray  :on-click on-click :shortcut ["cmd" "c"]}) 
           :copy-block-ref   (shui/button {:text "Copy"             :theme :gray  :on-click on-click :shortcut ["cmd" "c"]}) 
           :open-page-right  (shui/button {:text "Open in sidebar"  :theme :gray  :on-click on-click :shortcut ["shift" "return"]})
           :open-page        (shui/button {:text "Open"             :theme :color :on-click on-click :shortcut ["return"]})  
           :open-block-right (shui/button {:text "Open in sidebar"  :theme :gray  :on-click on-click :shortcut ["shift" "return"]})
           :open-block       (shui/button {:text "Open page"        :theme :color :on-click on-click :shortcut ["return"]})  
           :trigger          (shui/button {:text "Trigger"          :theme :color :on-click on-click :shortcut ["return"]})  
           :return           (shui/button {:text "Return"           :theme :color :on-click on-click :shortcut ["return"]})))]]]))  
       ; (shui/button {:text "AI" :theme :gradient} (make-context {}))]]]))

(->> (cp-handler/get-commands-unique)
     vals
     (map (juxt :shortcut :id)))
