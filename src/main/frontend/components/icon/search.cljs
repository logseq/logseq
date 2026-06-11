(ns frontend.components.icon.search
  "The icon picker's orchestrating component (`icon-search`): search across
   emojis + tabler icons, the tab bar, the All/Emojis/Icons panes, and the
   reaction-picker variant."
  (:require ["emoji-mart" :refer [SearchIndex]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.colors :as colors]
            [frontend.components.icon.color-picker :as color-picker]
            [frontend.components.icon.core :as icon-core]
            [frontend.components.icon.keyboard-nav :as kbd-nav]
            [frontend.components.icon.normalization :as norm]
            [frontend.components.icon.tiles :as tiles]
            [frontend.components.icon.utils :as icon-utils]
            [frontend.context.i18n :refer [t]]
            [frontend.search :as search]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- search-emojis
  [q]
  (p/let [result (.search SearchIndex q)]
    (->> (bean/->clj result)
         (map (fn [emoji]
                {:type :emoji
                 :id (:id emoji)
                 :label (or (:name emoji) (:id emoji))
                 :data {:value (:id emoji)}})))))

(defn- search-tabler-icons
  [q]
  (->> (search/fuzzy-search (icon-core/get-tabler-icons) q :limit 100)
       (map (fn [icon-name]
              {:type :icon
               :id (str "icon-" icon-name)
               :label icon-name
               :data {:value icon-name}}))))

(defn- search*
  "Search emojis and/or tabler icons for `q`, scoped by the active tab."
  [q tab]
  (p/let [icons (when (not= tab :emoji) (search-tabler-icons q))
          emojis' (when (not= tab :icon) (search-emojis q))]
    {:icons icons
     :emojis emojis'}))

(def reaction-picker-opts
  "Standard opts for the minimal emoji-only reaction picker. Callers
   `merge` their own `:on-chosen` (and any additional opts) onto this."
  {:allowed-tabs [:emoji]
   :hide-topbar? true
   :show-used? true
   :icon-value nil})

(hsx/defc emojis-cp
  [emojis* {:keys [show-used?] :as opts}]
  (let [used-emojis (when show-used?
                      (->> (icon-core/get-used-items)
                           (filterv #(= :emoji (:type %)))))
        has-recents? (seq used-emojis)
        icon-items (map (fn [emoji]
                          {:type :emoji
                           :id (:id emoji)
                           :label (or (:name emoji) (:id emoji))
                           :data {:value (:id emoji)}})
                        emojis*)]
    ;; Recents render as a sibling pane-section above the full grid.
    ;; Single scroll surface (.bd) means a sibling no longer triggers
    ;; a second scrollbar — same compositional pattern as `all-pane`.
    ;; The Emojis header doubles as the visual divider between the two
    ;; sections; suppress it when there are no recents (full picker
    ;; Emojis tab) to keep the picker minimal there.
    [:<>
     (when has-recents?
       (tiles/pane-section "Recently used" used-emojis
                           (assoc opts
                                  :title (t :icon.section-header/recently-used)
                                  :virtual-list? false)))
     (tiles/pane-section "Emojis" icon-items
                         (assoc opts
                                :title (t :icon/tab-emojis)
                                :show-header? has-recents?))]))

(hsx/defc icons-cp
  [icons opts]
  (let [icon-items (map (fn [icon-name]
                          {:type :icon
                           :id (str "icon-" icon-name)
                           :label icon-name
                           :data {:value icon-name}})
                        icons)]
    (tiles/pane-section "Icons" icon-items (assoc opts :show-header? false))))

(hsx/defc all-cp
  [opts]
  (let [used-items (icon-core/get-used-items)
        emoji-items (->> (take 32 icon-utils/emojis)
                         (map (fn [emoji]
                                {:type :emoji
                                 :id (:id emoji)
                                 :label (or (:name emoji) (:id emoji))
                                 :data {:value (:id emoji)}})))
        icon-items (->> (take 48 (icon-core/get-tabler-icons))
                        (map (fn [icon-name]
                               {:type :icon
                                :id (str "icon-" icon-name)
                                :label icon-name
                                :data {:value icon-name}})))
        opts (assoc opts :virtual-list? false)
        ;; Read section states reactively
        section-states (first (hooks/use-atom icon-core/*section-states))
        ;; Scope highlights to only the active section (prevents duplicate highlighting)
        scope-opts (fn [section-label o]
                     (cond-> o
                       (not= section-label (:highlighted-section o))
                       (dissoc :highlighted-id)
                       (not= section-label (:ghost-highlighted-section o))
                       (dissoc :ghost-highlighted-id)))]
    [:div.all-pane.pb-2
     ;; Recently used - collapsible
     (when (seq used-items)
       (tiles/pane-section "Recently used" used-items
                           (assoc (scope-opts "Recently used" opts)
                                  :title (t :icon.section-header/recently-used)
                                  :collapsible? true
                                  :keyboard-hint "alt mod 1"
                                  :expanded? (get section-states "Recently used" true))))

     ;; Emojis - collapsible
     (tiles/pane-section "Emojis"
                         emoji-items
                         (assoc (scope-opts "Emojis" opts)
                                :title (t :icon/tab-emojis)
                                :collapsible? true
                                :keyboard-hint "alt mod 2"
                                :total-count (count icon-utils/emojis)
                                :expanded? (get section-states "Emojis" true)))

     ;; Icons - collapsible
     (tiles/pane-section "Icons"
                         icon-items
                         (assoc (scope-opts "Icons" opts)
                                :title (t :icon/tab-icons)
                                :collapsible? true
                                :keyboard-hint "alt mod 3"
                                :total-count (count (icon-core/get-tabler-icons))
                                :expanded? (get section-states "Icons" true)))]))

(hsx/defc tab-observer
  "Re-runs the search when tab changes (if there's a query), preserving the search text."
  [tab {:keys [q *result]}]
  (hooks/use-effect!
   (fn []
     ;; Re-run search with existing query for new tab context
     (when-not (string/blank? q)
       (p/let [result (search* q tab)]
         (reset! *result result))))
   [tab q])
  nil)

(hsx/defc ^:large-vars/cleanup-todo icon-search
  [{:keys [on-chosen del-btn? icon-value allowed-tabs hide-topbar?]
    :as opts}]
  (let [*q (hooks/use-memo #(atom "") [])
        *result (hooks/use-memo #(atom nil) [])
        *focus-region (hooks/use-memo #(atom :search) [])
        *highlighted-index (hooks/use-memo #(atom nil) [])
        *virtuoso-ref (hooks/use-memo #(atom nil) [])
        ;; Seed view/tab/color synchronously (use-memo runs during first
        ;; render) so the picker paints in the right surface/color without
        ;; a flash.
        *tab (hooks/use-memo
              #(atom (let [allowed (some-> allowed-tabs set)]
                       (if (and allowed (not (allowed :all))) (first allowed) :all)))
              [])
        ;; `*view` + the `case` below are the picker's view-switch seam:
        ;; richer builds add level-2 views (and their seed logic) here.
        ;; PR scope: only the :icon-picker view exists.
        *view (hooks/use-memo #(atom :icon-picker) [])
        *color (hooks/use-memo
                #(atom (let [denull (fn [x] (when (and x (not= x "inherit")) x))
                             normalized (norm/normalize-icon icon-value)
                             icon-color (denull (get-in normalized [:data :color]))
                             stored (let [raw (denull (storage/get :ls-icon-color-preset))]
                                      (when (and (string? raw)
                                                 (or (re-matches #"#[0-9a-fA-F]{6}" raw)
                                                     (re-matches #"var\(--rx-[A-Za-z0-9_-]+\)" raw)))
                                        raw))]
                         (or icon-color stored)))
                [])
        *input-ref (hooks/use-ref nil)
        *result-ref (hooks/use-ref nil)
        ;; Mount effect: kick off the lazy color-name dictionary, focus the
        ;; search input, hold a brief focus-grab window against Radix's
        ;; MenuSubContent refocus, and apply the initial color tint to the
        ;; picker root.
        _ (hooks/use-effect!
           (fn []
             (colors/load-named-dict!)
             (let [focus-input! (fn []
                                  (when-let [^js input (hooks/deref *input-ref)]
                                    (when (not= js/document.activeElement input)
                                      (.focus input))))]
               (js/setTimeout focus-input! 0)
               (let [done? (atom false)
                     handler (fn [^js e]
                               (when-not @done?
                                 (when-let [^js input (hooks/deref *input-ref)]
                                   (when-let [^js picker (.closest input ".cp__emoji-icon-picker")]
                                     (let [^js tgt (.-target e)
                                           ;; A focus move onto a menu item is the user
                                           ;; navigating the parent menu — Radix detects
                                           ;; sibling-submenu closes through exactly that
                                           ;; focusin, so bouncing it back would suppress
                                           ;; the close and leave two submenus open side
                                           ;; by side. The grab only needs to counter
                                           ;; Radix's content-container refocus
                                           ;; (role="menu"), which no [role=menuitem]
                                           ;; ancestor matches.
                                           menuitem? (and (instance? js/Element tgt)
                                                          (some? (.closest ^js tgt "[role='menuitem']")))]
                                       (when (and (not= tgt input)
                                                  (not (.contains picker tgt))
                                                  (not menuitem?))
                                         (.focus input)))))))]
                 (.addEventListener js/document "focusin" handler true)
                 (js/setTimeout
                  (fn []
                    (reset! done? true)
                    (.removeEventListener js/document "focusin" handler true))
                  300)))
             (let [c @*color]
               (when (and c (not (string/blank? c)) (not= c "inherit"))
                 (js/setTimeout
                  (fn []
                    (when-let [^js input (hooks/deref *input-ref)]
                      (when-let [^js picker (.closest input ".cp__emoji-icon-picker")]
                        (.setProperty (.-style picker) "--ls-color-icon-preset" c)
                        (.add (.-classList picker) "icon-colored"))))
                  0)))
             js/undefined)
           [])
        result @*result
        delete-mode (if del-btn? :remove :hidden)
        normalized-icon-value (norm/normalize-icon icon-value)
        opts (assoc opts
                    :*virtuoso-ref *virtuoso-ref
                    :on-chosen (fn [e m & [keep-popup?]]
                                 (let [icon-item (norm/normalize-icon m)
                                       ;; Apply the picker's active color to tabler
                                       ;; picks: top-level `:color` (block.cljs
                                       ;; persists via select-keys) AND nested
                                       ;; `[:data :color]` (tile/`icon` render path).
                                       m' (if (and (= :icon (:type icon-item))
                                                   (not (string/blank? @*color)))
                                            (-> m
                                                (assoc :color @*color)
                                                (assoc-in [:data :color] @*color))
                                            m)]
                                   (and on-chosen (on-chosen e m' keep-popup?))
                                   (when (:type icon-item) (icon-core/add-used-item! icon-item)))))
        ;; Subscribe via `use-atom` (not bare deref) so changes to
        ;; `*highlighted-index` from `keyboard-nav-controller` arrow-key
        ;; handlers re-render icon-search. Without this, `highlighted-id`
        ;; below was computed once at popup-show and never refreshed, so
        ;; keyboard nav silently no-op'd while mouse hover worked. One
        ;; subscription is enough; the other reads can stay as bare derefs
        ;; once the component is hooked up.
        highlighted-idx (first (hooks/use-atom *highlighted-index))
        ;; Subscribe at top level (Rules of Hooks); the nested read inside the
        ;; results branch then just derefs the value this subscription tracks.
        section-states (first (hooks/use-atom icon-core/*section-states))
        ;; Restore the auto-rerender the old component-local state gave for
        ;; free: an HSX use-memo atom only re-renders the component when read
        ;; through use-atom, so these subscriptions are what make tab
        ;; switches, search filtering and focus state actually repaint. The
        ;; bare @derefs in the render below then read the fresh value each
        ;; render. (Regression class from the framework port — these were
        ;; previously auto-subscribed component-local state.)
        _ (hooks/use-atom *tab)
        _ (hooks/use-atom *q)
        _ (hooks/use-atom *result)
        _ (hooks/use-atom *view)
        _ (hooks/use-atom *focus-region)
        {flat-items :items sections :sections} (kbd-nav/compute-flat-items @*tab result section-states
                                                                           {:show-used? (:show-used? opts)})
        highlighted-id (when-let [idx highlighted-idx]
                         (when (< idx (count flat-items))
                           (:id (nth flat-items idx))))
        highlighted-section (when-let [idx highlighted-idx]
                              (when-let [si (kbd-nav/section-for-index idx sections)]
                                (:label (nth sections si))))
        ghost-highlighted-id (when (and (= @*focus-region :search)
                                        (nil? highlighted-idx)
                                        (pos? (count flat-items)))
                               (:id (first flat-items)))
        ghost-highlighted-section (when ghost-highlighted-id
                                    (:label (first sections)))
        opts (assoc opts
                    :highlighted-id highlighted-id
                    :highlighted-section highlighted-section
                    :ghost-highlighted-id ghost-highlighted-id
                    :ghost-highlighted-section ghost-highlighted-section
                    :focus-region @*focus-region)
        reset-q! #(when-let [^js input (hooks/deref *input-ref)]
                    (reset! *q "")
                    (reset! *result {})
                    (reset! *focus-region :search)
                    (reset! *highlighted-index nil)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (hooks/deref *result-ref) 0 false))))]
    (case @*view
      ;; Level 1: Icon Picker view (the only view in this build; richer
      ;; builds add their level-2 views as additional case branches)
      [:div.cp__emoji-icon-picker
       {:data-keep-selection true}

       ;; Always-mount invisible controllers. Lifted out of `.tabs-section`
       ;; so they keep working when the topbar is hidden via `:hide-topbar?`
       ;; (reaction pickers). They render nil; mounting them anywhere in
       ;; the picker tree gives keyboard-nav + tab-change side-effects.
       (tab-observer @*tab {:q @*q :*result *result})
       (kbd-nav/keyboard-nav-controller
        {:*focus-region      *focus-region
         :*highlighted-index *highlighted-index
         :*tab               *tab
         :*input-ref         *input-ref
         :flat-items         flat-items
         :sections           sections
         :*virtuoso-ref      *virtuoso-ref
         :section-shortcuts  {49 "Recently used" 50 "Emojis" 51 "Icons"}
         :topbar-selector    ".cp__emoji-icon-picker .tabs-section [data-topbar-stop]"})

       ;; Topbar: tabs + separator + search. Whole topbar collapses to
       ;; just the search input when `:hide-topbar?` is true (reactions:
       ;; emoji-only, no tabs, no color picker).
       [:div.icon-picker-topbar
        (when-not hide-topbar?
          [:div.tabs-section {:role "tablist"}
           (ui/tab-items
            {:tabs (let [all-tabs [[:all (t :icon/tab-all)] [:emoji (t :icon/tab-emojis)]
                                   [:icon (t :icon/tab-icons)]]]
                     (if-let [allowed (some-> allowed-tabs set)]
                       (filterv (fn [[id _]] (allowed id)) all-tabs)
                       all-tabs))
             :active @*tab
             :on-change (fn [id ^js e]
                          (reset! *tab id)
                          (reset! *highlighted-index nil)
                        ;; Only return focus to search for genuine mouse
                        ;; clicks. Programmatic .click() from keyboard
                        ;; arrow-rove (handle-topbar-keys auto-activate)
                        ;; has e.detail = 0; real clicks are >= 1. Keeps
                        ;; arrow nav inside the topbar region.
                        ;;
                        ;; Move DOM focus to the input alongside the
                        ;; region reset — otherwise the keyboard-nav-
                        ;; controller routes the next keypress to the
                        ;; :search branch (which is no-op) while the
                        ;; input itself can't fire its own on-key-down
                        ;; because it isn't focused.
                          (when (and e (pos? (.-detail e)))
                            (reset! *focus-region :search)
                            (some-> (hooks/deref *input-ref) (.focus))))
             :button-attrs {:data-topbar-stop "tab"}
             :tab-id-prefix "icon-picker"
             :panel-id "icon-picker-panel"})
           [:div.tab-actions
            (color-picker/color-picker
             *color
             (fn [c]
               ;; Synchronously update *color before calling on-chosen. The
               ;; on-chosen wrapper above re-applies @*color over `m`, so
               ;; without this it would overwrite the freshly-picked color
               ;; with the previous one (color-picker's React state hasn't
               ;; propagated to the *color atom yet — its useEffect runs
               ;; after this synchronous callback).
               (reset! *color c)
               ;; Auto-apply the new color to the current tabler icon —
               ;; unless the caller opted out via `:color-auto-chosen? false`
               ;; (e.g. the block context-menu's set-icon flow, where the
               ;; pick should only store the preference).
               (when (and (= :icon (:type normalized-icon-value))
                          (not (false? (:color-auto-chosen? opts))))
                 (on-chosen nil (-> normalized-icon-value
                                    (assoc :color c)
                                    (assoc-in [:data :color] c)) true)))
             ;; After Radix's FocusScope unmounts (the popover close),
             ;; restore focus to the highlighted tile so activeElement
             ;; matches `.is-highlighted`. Running in :after-close! (not
             ;; on-select!) bypasses Radix's FocusScope trap which would
             ;; otherwise undo the focus while the popover is mounted.
             {:after-close! (fn []
                              (let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))
                                    idx @*highlighted-index
                                    btn (when (and idx cnt)
                                          (.querySelector cnt "button.is-highlighted"))]
                                (cond
                                  ;; Highlighted icon present — restore focus to
                                  ;; the tile so the user resumes where they left
                                  ;; off in the grid.
                                  btn
                                  (do (reset! *focus-region :grid)
                                      (.focus btn))

                                  ;; No highlight to return to (e.g. user opened
                                  ;; the color picker without first navigating to
                                  ;; an icon). Fall back to the search input so
                                  ;; focus stays *inside* the picker container —
                                  ;; the capture-phase keydown listener only fires
                                  ;; for keys whose target is in the subtree, so
                                  ;; without this fallback the picker would appear
                                  ;; visually open but reject all keys.
                                  cnt
                                  (do (reset! *focus-region :search)
                                      (some-> (hooks/deref *input-ref) (.focus))))))
              ;; Stable popover id — the block context-menu's set-icon
              ;; submenu recognizes it to stay open while the popover is up.
              :popup-id :icons-color-picker
              :button-attrs {:data-topbar-stop "color"}})
            ;; Delete button.
            ;; NOTE: use `cond` (not `case`) — CLJS `case` with keyword tests
            ;; + a nil branch + Radix dropdown-menu children somehow leaks a
            ;; keyword into the React child tree. Reproduced specifically on
            ;; icon-free pages (delete-mode = :hidden → case returns nil →
            ;; still throws "Objects are not valid as a React child"). `cond`
            ;; avoids the bug.
            (cond
              (= delete-mode :hidden) nil

              (= delete-mode :remove)
              (shui/button {:variant :outline :size :sm :data-action "del"
                            :data-topbar-stop "trash"
                            :title (t :icon/remove-icon)
                            :aria-label (t :icon/remove-icon)
                            :on-click #(on-chosen nil nil :remove)}
                           (shui/tabler-icon "trash" {:size 17})))]])

        (when-not hide-topbar?
          (shui/separator {:class "my-0 icon-picker-separator"}))

        [:div.search-section
         [:div.search-input
          (shui/tabler-icon "search" {:size 16})
          [(shui/input
            {:auto-focus true
             :class "icon-search-input"
             :ref *input-ref
             :type "search"
             :aria-label (if hide-topbar?
                           (t :icon/search-emojis)
                           (t :icon/search-all-aria-label))
             :placeholder (if hide-topbar?
                            (t :icon/search-emojis)
                            (t :icon/search-all-placeholder))
             :default-value ""
             :on-focus #(reset! *focus-region :search)
             :on-key-down (fn [^js e]
                            (let [code (.-keyCode e)]
                              (cond
                                ;; Escape: clear search or close picker
                                (= code 27)
                                (do (util/stop e)
                                    (if (string/blank? @*q)
                                      (shui/popup-hide!)
                                      (reset-q!)))

                                ;; Up Arrow / Shift+Tab: move to topbar at the active tab
                                (or (= code 38)
                                    (and (= code 9) (.-shiftKey e)))
                                (do (util/stop e)
                                    (reset! *focus-region :topbar)
                                    (reset! *highlighted-index nil)
                                    (when-let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
                                      (when-let [active-tab (.querySelector cnt "[data-active='true'].tab-item")]
                                        (.focus active-tab))))

                                ;; Tab / Down Arrow: enter grid at first item
                                (or (and (= code 9) (not (.-shiftKey e)))
                                    (= code 40))
                                (do (util/stop e)
                                    (when (pos? (count flat-items))
                                      (reset! *focus-region :grid)
                                      (reset! *highlighted-index 0)))

                                ;; Enter: select ghost-highlighted item (first result)
                                (= code 13)
                                (when (and (nil? @*highlighted-index)
                                           (pos? (count flat-items)))
                                  (let [item (first flat-items)
                                        item-id (:id item)]
                                    (when-let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
                                      (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                        (.click btn)
                                        (util/stop e))))))))
             :on-change (debounce
                         (fn [e]
                           (reset! *q (util/evalue e))
                           (reset! *focus-region :search)
                           (reset! *highlighted-index nil)
                           (if (string/blank? @*q)
                             (reset! *result {})
                             (p/let [result (search* @*q @*tab)]
                               (reset! *result result))))
                         200)})]
          (when-not (string/blank? @*q)
            [:a.x {:on-click reset-q!} (shui/tabler-icon "x" {:size 14})])]]]

       ;; Body
       [:div.bd.bd-scroll
        {:ref *result-ref
         :class (or (some-> @*tab (name)) "other")}
        [:div.content-pane
         (cond-> {:id "icon-picker-panel"}
           ;; Pane semantics depend on whether a tablist is rendered.
           ;; When the topbar is hidden (reactions), there's no tab to
           ;; label this panel, so we drop the tabpanel role + linkage —
           ;; the content is just an emoji grid inside the popover.
           (not hide-topbar?)
           (assoc :role "tabpanel"
                  :aria-labelledby (str "icon-picker-tab-" (name @*tab))))
         ;; Show search results if present, else show tab content.
         ;; Tabs scope the search results by content type — :all shows both,
         ;; :emoji only emojis, :icon only icons. Mirrors the same gate in
         ;; compute-flat-items so the visible grid and the keyboard-nav
         ;; flat-items list stay in sync.
         (if (seq result)
           (let [tab-allows-emojis? (contains? #{:all :emoji} @*tab)
                 tab-allows-icons?  (contains? #{:all :icon} @*tab)
                 has-emojis? (and tab-allows-emojis? (seq (:emojis result)))
                 has-icons?  (and tab-allows-icons?  (seq (:icons result)))
                 sections-visible (count (filter true? [has-emojis? has-icons?]))
                 collapsible? (> sections-visible 1)]
             (if (or has-emojis? has-icons?)
               [:div.flex.flex-1.flex-col.search-result
                ;; Emojis section
                (when has-emojis?
                  (tiles/pane-section
                   "Emojis"
                   (:emojis result)
                   (assoc opts
                          :title (t :icon/tab-emojis)
                          :collapsible? collapsible?
                          :keyboard-hint (when collapsible? "alt mod 2")
                          :total-count (count (:emojis result))
                          :virtual-list? false
                          :expanded? (get section-states "Emojis" true))))

                ;; Icons section
                (when has-icons?
                  (tiles/pane-section
                   "Icons"
                   (:icons result)
                   (assoc opts
                          :title (t :icon/tab-icons)
                          :collapsible? collapsible?
                          :keyboard-hint (when collapsible? "alt mod 3")
                          :total-count (count (:icons result))
                          :virtual-list? false
                          :expanded? (get section-states "Icons" true))))]
               ;; Search returned no results
               [:div.search-empty-state
                (shui/tabler-icon "search-off" {:size 36})
                [:span.title (t :icon/search-empty-title)]
                [:span.subtitle (t :icon/search-empty-desc)]]))
           [:div.flex.flex-1.flex-col.gap-1
            (case @*tab
              :emoji (emojis-cp icon-utils/emojis opts)
              :icon (icons-cp (icon-core/get-tabler-icons) opts)
              (all-cp opts))])]]])))
