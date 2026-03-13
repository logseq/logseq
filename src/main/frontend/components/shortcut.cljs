(ns frontend.components.shortcut
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.rum :as r]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.events :as events]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum])
  (:import [goog.events KeyHandler]))

(defonce categories
  (vector :shortcut.category/basics
          :shortcut.category/navigating
          :shortcut.category/block-editing
          :shortcut.category/block-command-editing
          :shortcut.category/block-selection
          :shortcut.category/formatting
          :shortcut.category/toggle
          :shortcut.category/plugins
          :shortcut.category/others))

(def max-key-sequence-length 5)
(defonce *refresh-sentry (atom 0))
(defn refresh-shortcuts-list! [] (reset! *refresh-sentry (inc @*refresh-sentry)))
(defonce *global-listener-refcount (atom 0))

(defn- use-scoped-key-handler
  "Manages KeyHandler lifecycle on a popup element: suppresses global shortcuts
   while mounted, focuses the element, and disposes on unmount. Calls key-handler-fn
   with each key event. Clears any timer refs on unmount.

   Installs a bubble-phase keydown/keyup/keypress blocker on the popup element
   so that key events never bubble to js/window — preventing
   KeyboardShortcutHandler (including the :misc handler excluded from
   unlisten-all!) and setup-active-keystroke! from firing during recording.
   The blocker is registered in bubble phase (not capture) so that
   goog.events.KeyHandler's listener on the same element fires first."
  [*ref-el key-handler-fn timer-refs]
  (hooks/use-effect!
   (fn []
     (let [^js el (rum/deref *ref-el)
           key-handler (KeyHandler. el)
           ;; Bubble-phase blocker: registered AFTER KeyHandler (which uses
           ;; goog.events.listen in bubble phase). On the same element,
           ;; bubble-phase listeners fire in registration order, so KeyHandler
           ;; processes the key first, then this blocker calls stopPropagation
           ;; to prevent the event from reaching js/window.  preventDefault
           ;; is intentionally omitted here — the recording key-handler-fn
           ;; already calls (.preventDefault e) via the KeyHandler KEY event,
           ;; and calling it again on the raw keydown would suppress the
           ;; subsequent keypress that goog.events.KeyHandler may need to
           ;; resolve character keys.
           bubble-blocker (fn [^js e]
                            (.stopPropagation e))
           _ (.addEventListener el "keydown" bubble-blocker false)
           _ (.addEventListener el "keypress" bubble-blocker false)
           _ (.addEventListener el "keyup" bubble-blocker false)
           _ (when (zero? @*global-listener-refcount)
               (shortcut/unlisten-all! true))
           _ (swap! *global-listener-refcount inc)]
       (events/listen key-handler "key" key-handler-fn)
       (let [focus-timer (js/setTimeout #(.focus el) 128)]
         #(do (js/clearTimeout focus-timer)
              (doseq [*t timer-refs]
                (when-let [timer (rum/deref *t)]
                  (js/clearTimeout timer)))
              (.removeEventListener el "keydown" bubble-blocker false)
              (.removeEventListener el "keypress" bubble-blocker false)
              (.removeEventListener el "keyup" bubble-blocker false)
              (when (zero? (swap! *global-listener-refcount (fn [n] (max 0 (dec n)))))
                (shortcut/listen-all!))
              (.dispose key-handler)))))
   []))

(defn- to-vector [v]
  (when-not (nil? v)
    (if (sequential? v) (vec v) [v])))

(defn- editable-binding-vec
  [binding]
  (cond
    (false? binding) []
    (nil? binding) []
    (sequential? binding) (vec (filter string? binding))
    :else [binding]))

(declare customize-shortcut-dialog-inner)

(rum/defc keyboard-filter-record-inner
  [initial-keystroke parent-set-keystroke! close-fn]

  (let [*ref-el (rum/use-ref nil)
        ;; Local keystroke state (popup renders outside parent React tree)
        [keystroke set-local-keystroke!] (rum/use-state initial-keystroke)
        ;; Wrapper that updates both local state and parent filter
        set-keystroke! (fn [ks]
                         (set-local-keystroke! ks)
                         (parent-set-keystroke! ks))
        ;; accumulating? = dashed border while still typing a sequence
        [accumulating? set-accumulating!] (rum/use-state false)
        *commit-timer (rum/use-ref nil)
        ;; committed-ref: after 400ms or modifier combo, next plain key starts fresh
        *committed-ref (rum/use-ref (not (string/blank? keystroke)))
        *keystroke-ref (rum/use-ref keystroke)

        has-keystroke? (not (string/blank? keystroke))

        commit!
        (fn [ks]
          (set-keystroke! ks)
          (set-accumulating! false)
          (rum/set-ref! *committed-ref true))

        clear!
        (fn []
          (when-let [timer (rum/deref *commit-timer)]
            (js/clearTimeout timer))
          (set-keystroke! "")
          (set-accumulating! false)
          (rum/set-ref! *committed-ref false))

        start-commit-timer!
        (fn [ks]
          (when-let [timer (rum/deref *commit-timer)]
            (js/clearTimeout timer))
          (let [timer (js/setTimeout #(commit! ks) 400)]
            (rum/set-ref! *commit-timer timer)))]

    ;; Keep ref in sync
    (rum/set-ref! *keystroke-ref keystroke)

    ;; Scoped key handler on the popup element
    (use-scoped-key-handler
     *ref-el
     (fn [^js e]
       (.preventDefault e)
       (let [key-code (.-keyCode e)
             is-esc? (= key-code 27)
             is-backspace? (= key-code 8)
             has-modifier? (or (.-metaKey e) (.-ctrlKey e) (.-altKey e))]
         (cond
           ;; Esc: close the popup
           is-esc?
           (do (.stopPropagation e)
               (close-fn))

           ;; Backspace during accumulation: remove last key from sequence
           (and is-backspace? (not (rum/deref *committed-ref)))
           (let [ks (rum/deref *keystroke-ref)
                 parts (when-not (string/blank? ks)
                         (string/split ks #" "))
                 remaining (when (seq parts)
                             (string/join " " (butlast parts)))]
             (if (or (string/blank? remaining) (nil? remaining))
               (clear!)
               (do (set-keystroke! remaining)
                   (start-commit-timer! remaining))))

           ;; Backspace after commit: clear the whole chip
           is-backspace?
           (clear!)

           ;; Any other key
           :else
           (when-let [kn (shortcut/keyname e)]
             (let [kn-trimmed (util/trim-safe kn)]
               (if has-modifier?
                 ;; Modifier combo: commit immediately, replace everything
                 (do (when-let [timer (rum/deref *commit-timer)]
                       (js/clearTimeout timer))
                     (commit! kn-trimmed))
                 ;; Plain key: accumulate or start fresh
                 (if (rum/deref *committed-ref)
                   ;; After a committed chip, start fresh
                   (do (rum/set-ref! *committed-ref false)
                       (set-accumulating! true)
                       (set-keystroke! kn-trimmed)
                       (start-commit-timer! kn-trimmed))
                   ;; During accumulation, append
                   (let [cur (rum/deref *keystroke-ref)
                         parts (string/split (string/trim cur) #" ")
                         at-limit? (and (seq (first parts)) (>= (count parts) max-key-sequence-length))]
                     (when-not at-limit?
                       (let [new-ks (util/trim-safe (str cur kn))]
                         (set-accumulating! true)
                         (set-keystroke! new-ks)
                         (start-commit-timer! new-ks)))))))))))
     [*commit-timer])

    [:div.shortcut-filter-popover
     {:tab-index -1
      :ref       *ref-el}

     ;; TITLE
     [:div.shortcut-popover-title (t :keymap/keystroke-filter)]

     ;; INPUT FIELD
     [:div.shortcut-input-field
      ;; Filter chip (pending or committed)
      (when has-keystroke?
        [:div {:class (str "shortcut-input-binding"
                           (when accumulating? " shortcut-input-binding--pending"))}
         (shui/shortcut keystroke)
         [:button.shortcut-binding-remove
          {:on-click (fn [^js e]
                       (.stopPropagation e)
                       (clear!))
           :aria-label "Remove filter"}
          (ui/icon "x" {:size 12})]])
      ;; Placeholder
      (when-not has-keystroke?
        [:span.shortcut-input-placeholder (t :keymap/press-keys-to-filter)])]

     ;; SEPARATOR + TOOLBAR
     (shui/separator)
     [:div.shortcut-toolbar
      [:div
       (when has-keystroke?
         [:button.shortcut-toolbar-action.shortcut-toolbar-reset
          {:on-click clear!}
          (ui/icon "rotate" {:size 12})
          [:span (t :keymap/clear)]])]
      [:div.flex.items-center
       (when has-keystroke?
         [:span.shortcut-toolbar-hint
          (t :keymap/hint-remove) (shui/shortcut "backspace" {:style :compact})])
       [:span.shortcut-toolbar-hint
        (t :keymap/hint-close) (shui/shortcut "escape" {:style :compact})]]]]))

(defn- navigable-items
  "Query all navigable items (category headers + non-disabled rows) from the <ul>, in DOM order."
  [^js ul-el]
  (when ul-el
    (array-seq (.querySelectorAll ul-el "li.th[tabindex], li.shortcut-row:not([aria-disabled])"))))

(defn- scroll-row-into-view!
  "Scroll a row into view, accounting for sticky page header and category headers."
  [^js row-el]
  (when-let [page-el (.closest row-el ".cp__shortcut-page-x")]
    (when-let [scroll-parent (.-parentElement page-el)]
      (let [page-header (.querySelector page-el ":scope > header")
            sticky-h (+ (if page-header (.-offsetHeight page-header) 0) 40)
            row-rect (.getBoundingClientRect row-el)
            container-rect (.getBoundingClientRect scroll-parent)
            above? (< (.-top row-rect) (+ (.-top container-rect) sticky-h))
            below? (> (.-bottom row-rect) (.-bottom container-rect))]
        (cond
          above? (.scrollBy scroll-parent #js {:top (- (.-top row-rect) (.-top container-rect) sticky-h 4)
                                               :behavior "instant"})
          below? (.scrollBy scroll-parent #js {:top (- (.-bottom row-rect) (.-bottom container-rect) -4)
                                               :behavior "instant"}))))))

(rum/defc pane-controls
  [q set-q! filter-key set-filter-key! keystroke set-keystroke! toggle-categories-fn pill-counts *search-ref]
  (let [in-keystroke? (not (string/blank? keystroke))]
    [:div.cp__shortcut-page-x-pane-controls

     ;; Row 1: search + keystroke button
     [:div.shortcut-toolbar-row
      [:span.search-input-wrap
       [:span.search-icon (ui/icon "search" {:size 15})]
       [:input.form-input.is-small
        {:placeholder (t :keymap/search-placeholder)
         :ref         *search-ref
         :value       (or q "")
         :auto-focus  true
         :on-key-down (fn [^js e]
                        (let [kc (.-keyCode e)]
                          (cond
                            (= kc 27) ;; Escape
                            (do (util/stop e)
                                (if (string/blank? q)
                                  (some-> (rum/deref *search-ref) (.blur))
                                  (set-q! "")))

                            (= kc 40) ;; ArrowDown → focus first navigable row
                            (when-let [row (some-> (rum/deref *search-ref)
                                                   (.closest ".cp__shortcut-page-x")
                                                   (.querySelector "ul li.shortcut-row:not([aria-disabled])"))]
                              (.preventDefault e)
                              (.focus row)
                              (scroll-row-into-view! row)))))
         :on-change   #(let [v (util/evalue %)]
                         (when-not (string/blank? v)
                           (set-keystroke! ""))
                         (set-q! v))}]

       (when-not (string/blank? q)
         [:button.x
          {:on-click (fn []
                       (set-q! "")
                       (js/setTimeout #(some-> (rum/deref *search-ref) (.focus)) 50))
           :aria-label "Clear search"}
          (ui/icon "x" {:size 12})])]

      ;; keystroke filter button
      (let [filter-popup-id :shortcut-keystroke-filter
            open-filter! (fn [^js e]
                           (let [anchor-el (.-currentTarget e)]
                             (set-q! "")
                             (shui/popup-show!
                              anchor-el
                              (fn [_]
                                (keyboard-filter-record-inner
                                 keystroke set-keystroke!
                                 #(shui/popup-hide! filter-popup-id)))
                              {:id filter-popup-id
                               :force-popover? true
                               :align "end"
                               :on-after-hide #(when anchor-el (.focus anchor-el))
                               :content-props
                               {:class "shortcut-filter-popover-content p-0 w-auto"
                                :collision-padding 12
                                :onOpenAutoFocus #(.preventDefault %)
                                :onEscapeKeyDown (fn [_] false)
                                :onPointerDownOutside (fn [_] nil)}})))]
        (if in-keystroke?
          [:div.shortcut-keystroke-active
           {:on-click open-filter!}
           [:span.shortcut-keystroke-keys
            (ui/icon "keyboard" {:size 14})
            (shui/shortcut keystroke)]
           [:button.shortcut-keystroke-clear
            {:on-click (fn [^js e]
                         (.stopPropagation e)
                         (set-keystroke! ""))
             :aria-label "Clear keystroke filter"}
            (ui/icon "x" {:size 12})]]
          [:button.shortcut-keystroke-inactive
           {:on-click open-filter!}
           (ui/icon "keyboard" {:size 14})
           [:span (t :keymap/search-by-keys)]]))]

     ;; Row 2: filter pills + fold + refresh
     [:div.shortcut-pills-row
      [:div.shortcut-filter-pills
       (for [k [:All :Custom :Unset :Disabled]
             :let [active? (or (and (= k :All) (nil? filter-key))
                               (= filter-key k))
                   cnt (get pill-counts k 0)
                   title (case k
                           :All (t :keymap/all)
                           :Custom (t :keymap/custom)
                           :Unset (t :keymap/unset)
                           :Disabled (t :keymap/disabled)
                           (name k))]]
         [:button.shortcut-filter-pill
          {:key   (name k)
           :class (when active? "shortcut-filter-pill--active")
           :aria-pressed (str active?)
           :on-click #(set-filter-key! (when-not (or (= k :All) (= filter-key k)) k))}
          [:span.shortcut-filter-pill-title title]
          [:span.shortcut-filter-pill-count (str " \u00B7 " cnt)]])]

      (when (string/blank? q)
        [:div.flex.items-center.gap-2
         [:button.flex.items-center.icon-link
          {:tab-index -1
           :on-click toggle-categories-fn
           :aria-label "Toggle categories pane"}
          (ui/icon "fold")]

         [:button.flex.items-center.icon-link
          {:tab-index -1
           :on-click refresh-shortcuts-list!
           :aria-label "Refresh all"}
          (ui/icon "refresh")]])]]))

(rum/defc shortcut-desc-label
  [id binding-map]
  (when-let [id' (and id binding-map (str id))]
    (let [plugin? (string/starts-with? id' ":plugin.")
          id' (if plugin? (some-> id' (string/replace "plugin." "")) id')
          plugin-id (when plugin? (namespace id))]
      [:span {:title (str id' "#" (some-> (:handler-id binding-map) (name)))}
       [:span.px-1 (dh/get-shortcut-desc (assoc binding-map :id id))]
       (when plugin? [:code plugin-id])])))

(defonce *active-shortcut-id (atom nil))

(defn- open-customize-shortcut-dialog!
  [^js anchor-el id]
  (when-let [{:keys [binding user-binding] :as m} (dh/shortcut-item id)]
    (let [binding (editable-binding-vec binding)
          user-binding (when-not (nil? user-binding)
                         (editable-binding-vec user-binding))
          popup-id (keyword (str "customize-shortcut-" (name id)))
          label (dh/get-shortcut-desc (assoc m :id id))
          close-fn! #(do (reset! *active-shortcut-id nil)
                         (shui/popup-hide! popup-id))
          args [id label binding user-binding
                {:saved-cb (fn [] (js/setTimeout refresh-shortcuts-list! 500))
                 :close-fn close-fn!}]]
      ;; Close any previously open shortcut popover
      (when-let [prev-id @*active-shortcut-id]
        (let [prev-popup-id (keyword (str "customize-shortcut-" (name prev-id)))]
          (shui/popup-hide! prev-popup-id)))
      (reset! *active-shortcut-id id)
      (shui/popup-show!
       anchor-el
       (fn [_] (apply customize-shortcut-dialog-inner args))
       {:id popup-id
        :force-popover? true
        :align "start"
        :focus-trigger? false
        :on-after-hide #(do (reset! *active-shortcut-id nil)
                            (when-let [row (some-> anchor-el (.closest "li.shortcut-row"))]
                              (.focus row #js {:focusVisible true})))
        :content-props
        {:class "p-0 w-auto"
         :collision-padding 12
         :onOpenAutoFocus #(.preventDefault %)
         :onCloseAutoFocus #(.preventDefault %)
         :onEscapeKeyDown (fn [_] false)
         :onPointerDownOutside
         (fn [^js e]
           (when-let [target (some-> e .-detail .-originalEvent .-target)]
             (when (.closest target ".shortcut-row.active")
               (.preventDefault e)
               false)))}}))))

(defn- matches-default-binding?
  "Check if a binding vector matches the default binding for an action.
   Uses canonical comparison to handle platform-dependent modifier aliases."
  [action-id binding-vec]
  (when-let [{:keys [binding]} (dh/shortcut-item action-id)]
    (let [canon-set (fn [bs]
                      (into #{} (map shortcut-utils/canonicalize-binding) (editable-binding-vec bs)))]
      (= (canon-set binding) (canon-set binding-vec)))))

(defn persisted-binding-value
  "Returns the value that should be stored for a shortcut customization."
  [action-id binding-vec]
  (let [binding-vec (editable-binding-vec binding-vec)]
    (if (matches-default-binding? action-id binding-vec)
      nil
      binding-vec)))

(defn customizable-shortcut-row?
  [id _disabled?]
  (boolean id))

(defn- execute-undo!
  "Restore previous bindings for all affected actions."
  [snapshot]
  (shortcut/persist-user-shortcuts-batch!
   (mapv (fn [{:keys [action-id previous-binding]}]
           [action-id (if (and (sequential? previous-binding)
                               (matches-default-binding? action-id previous-binding))
                        nil
                        previous-binding)])
         (:entries snapshot)))
  (js/setTimeout #(do (shortcut/refresh!) (refresh-shortcuts-list!)) 50))

(defn- conflict-action-names
  "Extract human-readable action names from a key-conflicts map."
  [key-conflicts]
  (->> (for [[_g ks] key-conflicts
             v (vals ks)
             :let [conflicts-ids-map (second v)]
             [id' _handler] conflicts-ids-map
             :let [m (dh/shortcut-item id')]
             :when m]
         (dh/get-shortcut-desc m))
       (distinct)
       (map #(str "\u201c" % "\u201d"))
       (string/join ", ")))

(defn- prefix-conflict-details
  "Extract [{:binding display-str :name action-name} ...] from a prefix conflicts map."
  [key-conflicts]
  (->> (for [[_g ks] key-conflicts
             [_k v] ks
             :let [display-binding (first v)
                   conflicts-ids-map (second v)]
             [id' _handler] conflicts-ids-map
             :let [m (dh/shortcut-item id')]
             :when m]
         {:binding display-binding
          :name (dh/get-shortcut-desc m)})
       (distinct)
       (vec)))

(defn- chord-keycap
  "Render a chord binding as compact keycaps with visual stroke grouping."
  [binding-str]
  (let [strokes (string/split binding-str #" ")]
    (if (= (count strokes) 1)
      (shui/shortcut (first strokes) {:style :compact})
      [:div.prefix-chord
       (for [[i stroke] (map-indexed vector strokes)]
         ^{:key (str "stroke-" i)}
         (shui/shortcut stroke {:style :compact}))])))

(defn- prefix-conflict-label
  "Render content for a prefix-conflict amber banner with inline keycaps.
   n=1: keycap + quoted name inline. n=2-3: vertical list with keycap + name.
   n≥4: count only."
  [details]
  (let [n (count details)]
    (cond
      (= n 1)
      (let [{:keys [binding name]} (first details)]
        [:<>
         [:span (t :keymap/deactivates-chord)]
         (chord-keycap binding)
         [:span.shortcut-feedback-name (str \u201c name \u201d)]])

      (<= n 3)
      [:div.prefix-conflict-list
       [:span (t :keymap/deactivates-chord)]
       (for [[i {:keys [binding name]}] (map-indexed vector details)]
         [:div.prefix-conflict-item {:key (str "pc-" i)}
          (chord-keycap binding)
          [:span.shortcut-feedback-name (str \u201c name \u201d)]])]

      :else
      [:span (t :keymap/deactivates-chords (str n))])))

(defn- compute-override-plan
  "Compute the data needed to reassign a conflicting shortcut binding.
   Pure function — reads current bindings via dh but performs no mutations.

   Returns nil if conflicts or keystroke are empty, otherwise a map with:
   :new-binding, :accepted-key, :undo-entries, :conflict-updates, :conflict-names"
  [action-id conflicts keystroke current-binding]
  (when (and (seq conflicts) (not (string/blank? keystroke)))
    (let [accepted-key keystroke
          new-binding (conj current-binding accepted-key)
          canonical-accepted (shortcut-utils/canonicalize-binding accepted-key)
          undo-entries
          (into [{:action-id action-id :previous-binding current-binding}]
                (for [[_g kss] conflicts
                      v (vals kss)
                      :let [conflicts-ids-map (second v)]
                      [conflicting-id _handler] conflicts-ids-map]
                  {:action-id conflicting-id
                   :previous-binding (dh/shortcut-binding conflicting-id)}))
          conflict-updates
          (for [[_g kss] conflicts
                v (vals kss)
                :let [conflicts-ids-map (second v)]
                [conflicting-id _handler] conflicts-ids-map]
            (let [their-binding (dh/shortcut-binding conflicting-id)
                  filtered (vec (remove #(= (shortcut-utils/canonicalize-binding %) canonical-accepted)
                                        their-binding))]
              {:action-id conflicting-id
               :new-binding (cond
                              (empty? filtered) []
                              (matches-default-binding? conflicting-id filtered) nil
                              :else filtered)}))]
      {:new-binding new-binding
       :accepted-key accepted-key
       :undo-entries undo-entries
       :conflict-updates conflict-updates
       :conflict-names (conflict-action-names conflicts)})))

(defn- compute-reset-plan
  "Compute conflict-stripping data needed when resetting a shortcut to default.
   For each key in the default binding, checks if another action currently owns
   that key and plans to strip it.

   Returns nil if no conflicts, otherwise a map with:
   :undo-entries, :conflict-updates"
  [action-id handler-id default-binding current-binding]
  (let [all-conflicts
        (for [b default-binding
              :when (string? b)
              :let [raw-conflicts (dh/get-conflicts-by-keys b handler-id
                                                            {:exclude-ids #{action-id} :group-global? true})
                    conflicts (:exact (dh/partition-conflicts-by-type raw-conflicts b))]
              :when (seq conflicts)
              [_g kss] conflicts
              v (vals kss)
              :let [conflicts-ids-map (second v)]
              [conflicting-id _handler] conflicts-ids-map]
          {:conflicting-id conflicting-id
           :accepted-key b})
        ;; Group by conflicting-id, collect all keys to strip
        conflicts-by-id
        (reduce (fn [acc {:keys [conflicting-id accepted-key]}]
                  (update acc conflicting-id (fnil conj #{}) accepted-key))
                {} all-conflicts)]
    (when (seq conflicts-by-id)
      (let [conflict-updates
            (for [[conflicting-id keys-to-strip] conflicts-by-id]
              (let [their-binding (dh/shortcut-binding conflicting-id)
                    canonical-keys (set (map shortcut-utils/canonicalize-binding keys-to-strip))
                    filtered (vec (remove (fn [b]
                                            (contains? canonical-keys
                                                       (shortcut-utils/canonicalize-binding b)))
                                          their-binding))]
                {:action-id conflicting-id
                 :new-binding (cond
                                (empty? filtered) []
                                (matches-default-binding? conflicting-id filtered) nil
                                :else filtered)}))
            undo-entries
            (into [{:action-id action-id :previous-binding current-binding}]
                  (for [[conflicting-id _] conflicts-by-id]
                    {:action-id conflicting-id
                     :previous-binding (dh/shortcut-binding conflicting-id)}))]
        {:undo-entries undo-entries
         :conflict-updates conflict-updates}))))

(defn- customize-key-handler
  "Key handler for the customize shortcut dialog, extracted for testability.
   ctx is a map of refs, setters, and callbacks — see destructuring below."
  [{:keys [*rec-state-ref *keystroke-ref *current-binding-ref
           set-rec-state! set-keystroke! set-key-conflicts! set-current-binding!
           set-undo-snapshot! persist-binding! cancel-fn! override-fn! close-fn
           action-id]}
   ^js e]
  (.preventDefault e)
  (let [state (rum/deref *rec-state-ref)
        key-code (.-keyCode e)
        is-esc? (= key-code 27)
        is-backspace? (= key-code 8)
        is-cmd-enter? (and (= key-code 13)
                           (or (.-metaKey e) (.-ctrlKey e)))]
    (cond
      ;; Esc: never recordable, always cancel/dismiss
      is-esc?
      (do
        (.stopPropagation e)
        (case state
          :idle           (close-fn)
          :accepted       (close-fn)
          :esc-hint       (close-fn)
          :removed        (close-fn)
          :reset          (close-fn)
          :dismissing     (close-fn)
          :recording      (do (set-keystroke! "")
                              (set-key-conflicts! nil)
                              (set-rec-state! :esc-hint))
          :conflict-cross (close-fn)
          :conflict-same  (close-fn)
          nil))

      ;; Backspace in conflict: remove pending keystroke
      (and is-backspace? (#{:conflict-cross :conflict-same} state))
      (cancel-fn!)

      ;; Backspace in idle/accepted: remove last committed binding
      (and is-backspace?
           (#{:idle :accepted :removed :reset :dismissing} state)
           (string/blank? (rum/deref *keystroke-ref)))
      (let [cur-binding (rum/deref *current-binding-ref)]
        (when (seq (filter string? cur-binding))
          (let [new-binding (vec (butlast cur-binding))
                undo-entries [{:action-id action-id :previous-binding cur-binding}]]
            (set-current-binding! new-binding)
            (persist-binding! new-binding)
            (set-undo-snapshot! {:entries undo-entries})
            (set-rec-state! :removed))))

      ;; Conflict-cross + Cmd+Enter => override
      (and is-cmd-enter? (= state :conflict-cross))
      (override-fn!)

      ;; Conflict-cross + other keys => ignore (dead-end)
      (= state :conflict-cross)
      nil

      ;; Any non-recording, non-conflict-cross state + key => start new recording
      (#{:conflict-same :esc-hint :idle :accepted :removed :reset :dismissing} state)
      (when-let [kn (shortcut/keyname e)]
        (set-rec-state! :recording)
        (set-keystroke! (util/trim-safe kn)))

      ;; Recording + key => accumulate (max 5 keys)
      (= state :recording)
      (when-let [kn (shortcut/keyname e)]
        (let [cur (rum/deref *keystroke-ref)
              parts (string/split (string/trim cur) #" ")
              at-limit? (and (seq (first parts)) (>= (count parts) max-key-sequence-length))]
          (when-not at-limit?
            (set-key-conflicts! nil)
            (set-keystroke! #(util/trim-safe (str % kn)))))))))

(rum/defc ^:large-vars/cleanup-todo customize-shortcut-dialog-inner
  "user-binding: empty vector is for the unset state, nil is for the default binding"
  [k action-name binding user-binding {:keys [saved-cb close-fn]}]
  (let [*ref-el (rum/use-ref nil)
        [keystroke set-keystroke!] (rum/use-state "")
        [current-binding set-current-binding!] (rum/use-state (if (nil? user-binding) binding user-binding))
        [key-conflicts set-key-conflicts!] (rum/use-state nil)
        [rec-state set-rec-state!] (rum/use-state :idle)
        [accepted-info set-accepted-info!] (rum/use-state nil)
        [undo-snapshot set-undo-snapshot!] (rum/use-state nil)
        *auto-accept-timer (rum/use-ref nil)
        *fade-timer (rum/use-ref nil)
        *prev-rec-state (rum/use-ref nil)
        ;; Refs to avoid stale closures in mount-only key handler effect
        *rec-state-ref (rum/use-ref rec-state)
        *keystroke-ref (rum/use-ref keystroke)
        *current-binding-ref (rum/use-ref current-binding)
        *key-conflicts-ref (rum/use-ref key-conflicts)

        handler-id (hooks/use-memo #(dh/get-group k) [])
        ;; For rendering, :dismissing looks like :idle — only the banner needs the real state
        render-state (if (= rec-state :dismissing) :idle rec-state)
        has-bindings? (boolean (seq (filter string? current-binding)))

        persist-binding!
        (fn [new-binding]
          (let [binding' (persisted-binding-value k new-binding)]
            (shortcut/persist-user-shortcut! k binding')
            (js/setTimeout #(do (shortcut/refresh!)
                                ;; refresh! reinstalls global handlers unconditionally.
                                ;; If a scoped key handler is active (popover open),
                                ;; re-suppress to prevent the new handlers from firing.
                                (when (pos? @*global-listener-refcount)
                                  (shortcut/unlisten-all! true))
                                (saved-cb)) 50)))

        cancel-fn!
        (fn []
          (set-keystroke! "")
          (set-key-conflicts! nil)
          (set-rec-state! :idle))

        reset-fn!
        (fn []
          (let [plan (compute-reset-plan k handler-id binding current-binding)
                undo-entries (or (:undo-entries plan)
                                 [{:action-id k :previous-binding current-binding}])
                ;; Batch: conflict stripping + self-reset in one atomic write
                changes (cond-> [[k nil]]
                          (:conflict-updates plan)
                          (into (map (fn [{:keys [action-id new-binding]}]
                                       [action-id new-binding])
                                     (:conflict-updates plan))))]
            (shortcut/persist-user-shortcuts-batch! changes)
            (set-current-binding! binding)
            (js/setTimeout #(do (shortcut/refresh!)
                                (when (pos? @*global-listener-refcount)
                                  (shortcut/unlisten-all! true))
                                (saved-cb)) 50)
            (set-undo-snapshot! {:entries undo-entries})
            (set-rec-state! :reset)
            ;; Auto-close popup after brief visual feedback
            (js/setTimeout close-fn 300)))

        override-fn!
        (fn []
          (let [conflicts (rum/deref *key-conflicts-ref)
                prefix-map (:prefix conflicts)
                exact-map (:exact conflicts)
                ks (rum/deref *keystroke-ref)
                cur-binding (rum/deref *current-binding-ref)]
            (when-let [{:keys [new-binding accepted-key undo-entries conflict-updates conflict-names]}
                       (compute-override-plan k exact-map ks cur-binding)]
              ;; Batch-persist: conflict stripping + own binding in one atomic write
              (let [binding' (persisted-binding-value k new-binding)
                    changes (cond-> [[k binding']]
                              (seq conflict-updates)
                              (into (map (fn [{:keys [action-id new-binding]}]
                                           [action-id new-binding])
                                         conflict-updates)))]
                (shortcut/persist-user-shortcuts-batch! changes))
              (set-current-binding! new-binding)
              (js/setTimeout #(do (shortcut/refresh!)
                                  (when (pos? @*global-listener-refcount)
                                    (shortcut/unlisten-all! true))
                                  (saved-cb)) 50)
              ;; UI state transitions
              (set-undo-snapshot! {:entries undo-entries})
              (let [prefix-details' (when (seq prefix-map) (prefix-conflict-details prefix-map))]
                (set-accepted-info! (cond-> {:key accepted-key :from conflict-names}
                                      (seq prefix-details') (assoc :prefix-details prefix-details'))))
              (set-keystroke! "")
              (set-key-conflicts! nil)
              (set-rec-state! :accepted))))]

    ;; Keep refs in sync for stale-closure safety
    (rum/set-ref! *rec-state-ref rec-state)
    (rum/set-ref! *keystroke-ref keystroke)
    (rum/set-ref! *current-binding-ref current-binding)
    (rum/set-ref! *key-conflicts-ref key-conflicts)

    ;; Auto-evaluate keystroke after 400ms debounce
    (hooks/use-effect!
     (fn []
       (when-not (string/blank? keystroke)
         (let [timer (js/setTimeout
                      (fn []
                        (let [cur-binding (rum/deref *current-binding-ref)]
                          ;; Check same-action conflicts first
                          (if-let [_current-conflicts
                                   (seq (dh/parse-conflicts-from-binding cur-binding keystroke))]
                            (do
                              (set-rec-state! :conflict-same)
                              (set-keystroke! ""))
                            ;; Check cross-action conflicts
                            (let [conflicts-map (dh/get-conflicts-by-keys keystroke handler-id {:exclude-ids #{k} :group-global? true})]
                              (if-not (seq conflicts-map)
                                ;; No same-context conflicts — check cross-context
                                (let [cross-conflicts (dh/get-cross-context-conflicts keystroke handler-id {:exclude-ids #{k}})
                                      accepted-key keystroke
                                      new-binding (conj cur-binding accepted-key)]
                                  ;; Always auto-save (cross-context conflicts are non-blocking)
                                  (set-current-binding! new-binding)
                                  (set-keystroke! "")
                                  (set-key-conflicts! nil)
                                  (persist-binding! new-binding)
                                  (if (seq cross-conflicts)
                                    ;; Amber warning — saved but informational
                                    (set-accepted-info! {:key accepted-key
                                                         :from nil
                                                         :cross-context? true
                                                         :cross-action-name (conflict-action-names cross-conflicts)
                                                         :cross-context-label (dh/conflict-context-label cross-conflicts)})
                                    ;; Clean accept — no conflicts anywhere
                                    (set-accepted-info! {:key accepted-key :from nil}))
                                  (set-rec-state! :accepted))
                                ;; Has conflicts — partition into exact vs prefix
                                (let [{:keys [exact prefix]} (dh/partition-conflicts-by-type conflicts-map keystroke)]
                                  (if (seq exact)
                                    ;; Exact conflicts present — blocking red state (may also have prefix)
                                    (do
                                      (set-key-conflicts! {:exact exact :prefix prefix})
                                      (set-rec-state! :conflict-cross))
                                    ;; Prefix-only — auto-save with amber warning
                                    (let [accepted-key keystroke
                                          new-binding (conj cur-binding accepted-key)
                                          details (prefix-conflict-details prefix)]
                                      (set-undo-snapshot! {:entries [{:action-id k :previous-binding cur-binding}]})
                                      (set-current-binding! new-binding)
                                      (set-keystroke! "")
                                      (set-key-conflicts! nil)
                                      (persist-binding! new-binding)
                                      (set-accepted-info! {:key accepted-key
                                                           :from nil
                                                           :prefix-conflicts? true
                                                           :prefix-details details})
                                      (set-rec-state! :accepted)))))))))
                      400)]
           (rum/set-ref! *auto-accept-timer timer)))
       #(when-let [timer (rum/deref *auto-accept-timer)]
          (js/clearTimeout timer)))
     [keystroke])

    ;; Track previous banner state for dismiss animation
    (hooks/use-effect!
     (fn []
       (when (#{:conflict-cross :conflict-same :esc-hint :accepted :removed :reset} rec-state)
         (rum/set-ref! *prev-rec-state rec-state))
       js/undefined)
     [rec-state])

    ;; Auto-fade for transient states: conflict-same, esc-hint, accepted
    (hooks/use-effect!
     (fn []
       (when (#{:conflict-same :esc-hint :accepted :removed :reset} rec-state)
         (let [ms (case rec-state
                    :esc-hint 2000
                    :accepted (let [prefix-n (count (:prefix-details accepted-info))]
                                (cond
                                  (:cross-context? accepted-info) 6000
                                  (pos? prefix-n) (min 10000 (+ 4000 (* 2000 prefix-n)))
                                  (:from accepted-info) 6000
                                  :else 2500))
                    (:removed :reset) 6000
                    3500)
               timer (js/setTimeout
                      #(set-rec-state! :dismissing)
                      ms)]
           (rum/set-ref! *fade-timer timer)))
       #(when-let [timer (rum/deref *fade-timer)]
          (js/clearTimeout timer)))
     [rec-state])

    ;; Key handler (mount-only, uses refs for current state)
    (use-scoped-key-handler
     *ref-el
     (partial customize-key-handler
              {:*rec-state-ref       *rec-state-ref
               :*keystroke-ref       *keystroke-ref
               :*current-binding-ref *current-binding-ref
               :set-rec-state!       set-rec-state!
               :set-keystroke!       set-keystroke!
               :set-key-conflicts!   set-key-conflicts!
               :set-current-binding! set-current-binding!
               :set-undo-snapshot!   set-undo-snapshot!
               :persist-binding!     persist-binding!
               :cancel-fn!           cancel-fn!
               :override-fn!         override-fn!
               :close-fn             close-fn
               :action-id            k})
     [*auto-accept-timer *fade-timer])

    ;; Re-focus the popover when rec-state changes and focus has drifted outside.
    ;; This handles the case where a focused element (e.g., the Reassign button)
    ;; is removed from the DOM during a state transition, causing focus to fall
    ;; to document.body and making the popover deaf to subsequent keypresses.
    (hooks/use-effect!
     (fn []
       (when-let [el (rum/deref *ref-el)]
         (when-not (.contains el (.-activeElement js/document))
           (js/requestAnimationFrame #(.focus el)))))
     [rec-state])

    ;; === V3 LAYOUT ===
    [:div.shortcut-popover
     {:tab-index -1
      :ref       *ref-el
      :role      "dialog"
      :aria-label action-name}

     ;; TITLE
     [:div.shortcut-popover-title action-name]

     ;; INPUT FIELD
     [:div.shortcut-input-field
      {:class (when (#{:conflict-cross :conflict-same} render-state) "conflict")}
      ;; Existing bindings — each wrapped in a grouping container
      (for [[idx x] (map-indexed vector current-binding)
            :when (string? x)]
        [:div.shortcut-input-binding {:key x}
         (shui/shortcut x {:chord-separator (t :keymap/chord-separator)})
         (when (#{:idle :accepted :esc-hint :removed :reset} render-state)
           [:button.shortcut-binding-remove
            {:aria-label "Remove binding"
             :on-click (fn [^js e]
                         (.stopPropagation e)
                         (let [new-binding (vec (concat (subvec current-binding 0 idx)
                                                        (subvec current-binding (inc idx))))
                               undo-entries [{:action-id k :previous-binding current-binding}]]
                           (set-current-binding! new-binding)
                           (persist-binding! new-binding)
                           (set-undo-snapshot! {:entries undo-entries})
                           (set-rec-state! :removed)))}
            (ui/icon "x" {:size 12})])])
      ;; Recording in progress — dashed keys (uncommitted)
      (when (and (#{:recording :conflict-cross :conflict-same} render-state)
                 (not (string/blank? keystroke)))
        [:div.shortcut-input-binding.shortcut-input-binding--pending
         (shui/shortcut keystroke)
         (when (#{:conflict-cross :conflict-same} render-state)
           [:button.shortcut-binding-remove
            {:aria-label "Remove binding"
             :on-click (fn [^js e]
                         (.stopPropagation e)
                         (cancel-fn!))}
            (ui/icon "x" {:size 12})])])
      ;; Placeholder
      (when (#{:idle :recording :accepted :removed :reset} render-state)
        [:span.shortcut-input-placeholder (t :keymap/press-a-shortcut)])]

     ;; FEEDBACK BANNER (conditional) — wrapped in live region for screen readers
     [:div {:role      (if (#{:conflict-cross :conflict-same} rec-state) "alert" "status")
            :aria-live (if (#{:conflict-cross :conflict-same} rec-state) "assertive" "polite")}
      (let [undo-link
            (when undo-snapshot
              [:button.shortcut-feedback-action
               {:on-click (fn []
                            (execute-undo! undo-snapshot)
                            (when-let [own (some #(when (= (:action-id %) k) %) (:entries undo-snapshot))]
                              (set-current-binding! (:previous-binding own)))
                            (set-undo-snapshot! nil)
                            (set-rec-state! :idle))}
               (t :keymap/undo)])]
        (case rec-state
          :conflict-cross
          [:div.shortcut-feedback.shortcut-feedback--error
           [:span (t :keymap/used-by)
            [:span.shortcut-feedback-name (conflict-action-names (:exact key-conflicts))]]
           (ui/tooltip
            (shui/button {:variant :destructive
                          :size :xs
                          :on-click override-fn!}
                         (t :keymap/reassign))
            (t :keymap/reassign-tooltip))]

          :conflict-same
          [:div.shortcut-feedback.shortcut-feedback--error
           [:span (t :keymap/already-bound)]]

          :accepted
          (cond
            (:cross-context? accepted-info)
            [:div.shortcut-feedback.shortcut-feedback--warning
             [:span (t :keymap/also-used-for)
              [:span.shortcut-feedback-name
               (:cross-action-name accepted-info)]
              (when-let [ctx (:cross-context-label accepted-info)]
                (str (t :keymap/in-context) ctx))]]

            (:prefix-conflicts? accepted-info)
            [:div.shortcut-feedback.shortcut-feedback--warning
             (prefix-conflict-label (:prefix-details accepted-info))
             undo-link]

            (:from accepted-info)
            (if-let [prefix-details' (:prefix-details accepted-info)]
              ;; Post-reassign with prefix info (mixed case)
              [:<>
               [:div.shortcut-feedback.shortcut-feedback--success
                [:span (t :keymap/reassigned-from)
                 [:span.shortcut-feedback-name (:from accepted-info)]]
                undo-link]
               [:div.shortcut-feedback.shortcut-feedback--warning
                (prefix-conflict-label prefix-details')]]
              ;; Pure reassign, no prefix
              [:div.shortcut-feedback.shortcut-feedback--success
               [:span (t :keymap/reassigned-from)
                [:span.shortcut-feedback-name (:from accepted-info)]]
               undo-link])

            :else
            [:div.shortcut-feedback.shortcut-feedback--success
             [:span (t :keymap/shortcut-added)]])

          :removed
          [:div.shortcut-feedback.shortcut-feedback--muted
           [:span (t :keymap/shortcut-removed)]
           undo-link]

          :reset
          [:div.shortcut-feedback.shortcut-feedback--muted
           [:span (t :keymap/reset-to-default)]
           undo-link]

          :esc-hint
          [:div.shortcut-feedback.shortcut-feedback--muted
           [:span (t :keymap/esc-is-reserved)]]

          :dismissing
          (let [prev (rum/deref *prev-rec-state)
                variant (case prev
                          (:conflict-cross :conflict-same) "shortcut-feedback--error"
                          :accepted (cond
                                      (:cross-context? accepted-info) "shortcut-feedback--warning"
                                      (:prefix-conflicts? accepted-info) "shortcut-feedback--warning"
                                      :else "shortcut-feedback--success")
                          "shortcut-feedback--muted")]
            [:div {:class (str "shortcut-feedback " variant " is-dismissing")
                   :on-animation-end #(set-rec-state! :idle)}])

          nil))]

     ;; SEPARATOR + TOOLBAR
     (shui/separator)
     [:div.shortcut-toolbar
      [:div.shortcut-toolbar-left
       ;; Reset (only when changed from default)
       (when (and (#{:idle :accepted :removed} render-state)
                  (some? (persisted-binding-value k current-binding)))
         [:button.shortcut-toolbar-action.shortcut-toolbar-reset
          {:on-click reset-fn!}
          (ui/icon "rotate" {:size 12})
          [:span (t :keymap/reset)]])]
      [:div.shortcut-toolbar-right
       ;; Reassign hint (conflict-cross only)
       (when (= :conflict-cross render-state)
         [:span.shortcut-toolbar-hint
          (t :keymap/hint-reassign)
          (shui/shortcut (if util/mac? "meta+enter" "ctrl+enter") {:style :compact})])
       ;; Remove hint (idle/accepted/removed/reset with bindings, or conflict states)
       (when (or (and (#{:idle :accepted :removed :reset} render-state) has-bindings?)
                 (#{:conflict-cross :conflict-same} render-state))
         [:span.shortcut-toolbar-hint
          (t :keymap/hint-remove)
          (shui/shortcut "backspace" {:style :compact})])
       ;; Close/Cancel hint
       [:span.shortcut-toolbar-hint
        (if (= :recording render-state) (t :keymap/hint-cancel) (t :keymap/hint-close))
        (shui/shortcut "escape" {:style :compact})]]]]))

(defn- classify-shortcut
  "Return a set of category keywords (:Custom, :Disabled, :Unset) for a shortcut."
  [{:keys [binding user-binding]}]
  (let [binding (to-vector binding)
        user-binding (and user-binding (to-vector user-binding))
        custom? (not (nil? user-binding))
        disabled? (or (false? user-binding)
                      (false? (first binding)))
        unset? (and (not disabled?)
                    (or (= user-binding [])
                        (and (nil? binding) (nil? user-binding))
                        (and (= binding [])
                             (nil? user-binding))))]
    (cond-> #{}
      custom? (conj :Custom)
      disabled? (conj :Disabled)
      unset? (conj :Unset))))

(defn- count-shortcuts-by-filter
  "Count shortcuts per filter category in result-list-map.
   Returns {:All n :Custom n :Unset n :Disabled n}."
  [result-list-map]
  (let [all-bindings (mapcat (fn [[_c bm]] (vals bm)) result-list-map)]
    (reduce (fn [acc m]
              (let [cats (classify-shortcut m)]
                (-> acc
                    (update :All inc)
                    (cond->
                     (contains? cats :Custom) (update :Custom inc)
                     (contains? cats :Disabled) (update :Disabled inc)
                     (contains? cats :Unset) (update :Unset inc)))))
            {:All 0 :Custom 0 :Unset 0 :Disabled 0}
            all-bindings)))

(defn- matches-keystroke?
  "Check if any of the shortcut's bindings match the recorded keystroke filter."
  [binding user-binding keystroke]
  (let [binding' (or user-binding binding)
        keystroke' (some-> (shortcut-utils/safe-parse-string-binding keystroke) (bean/->clj))]
    (when (sequential? binding')
      (some #(when-let [s (some-> % (dh/mod-key) (shortcut-utils/safe-parse-string-binding) (bean/->clj))]
               (or (= s keystroke')
                   (and (sequential? s) (sequential? keystroke')
                        (apply = (map first [s keystroke']))))) binding'))))

(defn- count-visible-shortcuts
  "Count shortcuts visible after applying category filter and keystroke filter."
  [result-list-map filter-key in-keystroke? keystroke]
  (->> result-list-map
       (mapcat
        (fn [[_c binding-map]]
          (for [[id m] binding-map
                :let [cats (classify-shortcut m)
                      binding (to-vector (:binding m))
                      user-binding (and (:user-binding m) (to-vector (:user-binding m)))
                      disabled? (contains? cats :Disabled)
                      unset? (contains? cats :Unset)]
                :when (or (= filter-key :All)
                          (nil? filter-key)
                          (contains? cats filter-key))
                :when (or (not in-keystroke?)
                          (and (not disabled?) (not unset?)
                               (matches-keystroke? binding user-binding keystroke)))]
            id)))
       count))

(defn build-categories-map
  []
  (->> categories
       (map #(vector % (into (sorted-map) (dh/binding-by-category %))))))

(rum/defc ^:large-vars/cleanup-todo shortcut-keymap-x
  []
  (let [[active-id] (r/use-atom *active-shortcut-id)
        _ (r/use-atom shortcut-config/*category)
        _ (r/use-atom *refresh-sentry)
        [ready?, set-ready!] (rum/use-state false)
        [filter-key, set-filter-key!] (rum/use-state nil)
        [keystroke, set-keystroke!] (rum/use-state "")
        [q set-q!] (rum/use-state nil)

        categories-list-map (build-categories-map)
        all-categories (into #{} (map first categories-list-map))
        in-filter? (some? filter-key)
        in-query? (not (string/blank? (util/trim-safe q)))
        in-keystroke? (not (string/blank? keystroke))

        [folded-categories set-folded-categories!] (rum/use-state #{})

        matched-list-map
        (when (and in-query? (not in-keystroke?))
          (->> categories-list-map
               (map (fn [[c binding-map]]
                      [c (search/fuzzy-search
                          binding-map q
                          :extract-fn
                          #(let [[id m] %]
                             (str (name id) " " (dh/get-shortcut-desc (assoc m :id id)))))]))))

        result-list-map (or matched-list-map categories-list-map)
        ;; Deduplicated bindings: shortcuts listed in multiple categories
        ;; should only be counted/rendered once when flattened.
        deduped-bindings (into (sorted-map) (mapcat second result-list-map))
        toggle-categories! (fn []
                             (let [folding-all? (not= folded-categories all-categories)
                                   active-el (.-activeElement js/document)
                                   row-focused? (and active-el
                                                     (some-> active-el (.closest "li.shortcut-row")))]
                               (set-folded-categories! (if folding-all? all-categories #{}))
                               ;; If folding all while a row has focus, rescue to search input
                               (when (and folding-all? row-focused?)
                                 (js/requestAnimationFrame
                                  #(when-let [input (.querySelector js/document ".cp__shortcut-page-x .search-input-wrap input")]
                                     (.focus input))))))

        pill-counts (count-shortcuts-by-filter [[:all deduped-bindings]])
        visible-count (if (or in-filter? in-keystroke?)
                        (count-visible-shortcuts [[:all deduped-bindings]] filter-key in-keystroke? keystroke)
                        (count deduped-bindings))
        no-results? (and ready? (zero? visible-count))]

    (hooks/use-effect!
     (fn []
       (let [t (js/setTimeout #(set-ready! true) 100)]
         #(js/clearTimeout t)))
     [])

    ;; Clean up any open shortcut popovers when this component unmounts
    (hooks/use-effect!
     (fn []
       (fn []
         (reset! *active-shortcut-id nil)
         (shui/popup-hide-all!)))
     [])

    (let [*container-ref (rum/use-ref nil)
          *search-ref (rum/use-ref nil)
          *rescue-target-ref (rum/use-ref nil)]
      ;; Track header height for sticky offset
      (hooks/use-effect!
       (fn []
         (when-let [^js el (rum/deref *container-ref)]
           (when-let [header (.querySelector el ":scope > header")]
             (let [update-h! #(let [h (.-offsetHeight header)]
                                (.setProperty (.-style el) "--shortcut-header-h" (str h "px")))
                   observer (js/ResizeObserver. update-h!)]
               (.observe observer header)
               #(.disconnect observer)))))
       [])

      ;; Constrain container to the actual available width inside the settings dialog.
      ;; The article parent has CSS width: 44rem (for dialog intrinsic sizing) but the
      ;; dialog may be narrower when the viewport is small. The inner flex container
      ;; overflows the dialog (which clips via overflow:hidden), so we observe the
      ;; dialog element itself and compute available width from its clientWidth.
      (hooks/use-effect!
       (fn []
         (when-let [^js el (rum/deref *container-ref)]
           (when-let [^js dialog (.closest el ".ui__dialog-content")]
             (let [aside (.querySelector dialog "aside")
                   inner (.closest el ".cp__settings-inner")
                   sync! (fn []
                           (let [row? (and inner
                                           (= "row" (.-flexDirection (js/getComputedStyle inner))))
                                 available (- (.-clientWidth dialog)
                                              (if (and aside row?)
                                                (.-offsetWidth aside) 0))]
                             (when (pos? available)
                               (.setProperty (.-style el) "max-width" (str available "px")))))
                   observer (js/ResizeObserver. (fn [_] (sync!)))]
               (.observe observer dialog)
               (sync!)
               #(do (.disconnect observer)
                    (.removeProperty (.-style el) "max-width"))))))
       [])

      ;; Rescue focus when a fold removes the focused row from DOM
      (hooks/use-effect!
       (fn []
         (when-let [target (rum/deref *rescue-target-ref)]
           (rum/set-ref! *rescue-target-ref nil)
           (when (or (nil? (.-activeElement js/document))
                     (identical? (.-activeElement js/document) (.-body js/document)))
             (.focus target #js {:focusVisible true})
             (scroll-row-into-view! target))))
       [folded-categories])

      [:div.cp__shortcut-page-x
       {:ref *container-ref}
       [:header
        (pane-controls q set-q! filter-key set-filter-key! keystroke set-keystroke! toggle-categories! pill-counts *search-ref)]

       [:article
        (when-not ready?
          [:p.py-8.flex.justify-center (ui/loading "")])

        (when (and ready? no-results?)
          [:div.shortcut-empty-state
           (ui/icon "list-search" {:size 24})
           [:span.text-sm (t :keymap/no-matching-shortcuts)]])

        (when (and ready? (not no-results?))
          [:ul.list-none.m-0.py-3
           {:tab-index 0
            :on-focus
            (fn [^js e]
              (when (identical? (.-target e) (.-currentTarget e))
                (let [ul (.-currentTarget e)
                      from (.-relatedTarget e)]
                  (if (and from (.contains ul from))
                    ;; Shift+Tab from inside: exit list backward to last filter pill
                    (when-let [pill (some-> (.closest ul ".cp__shortcut-page-x")
                                            (.querySelector ":scope > header")
                                            (.querySelectorAll ".shortcut-filter-pill")
                                            array-seq last)]
                      (.focus pill))
                    ;; Forward Tab from outside: enter list at first item
                    (when-let [first-item (first (navigable-items ul))]
                      (.focus first-item #js {:focusVisible true})
                      (scroll-row-into-view! first-item))))))
            :on-key-down
            (fn [^js e]
              (let [key (.-key e)
                    ul-el (.-currentTarget e)
                    active-el (.-activeElement js/document)
                    active-item (or (some-> active-el (.closest "li.shortcut-row"))
                                    (some-> active-el (.closest "li.th")))
                    items (navigable-items ul-el)]
                (when (and (seq items) (contains? #{"ArrowDown" "ArrowUp" "Home" "End"} key))
                  (.preventDefault e)
                  (let [cur-idx (when active-item
                                  (some (fn [[i el]] (when (identical? el active-item) i))
                                        (map-indexed vector items)))
                        next-idx (case key
                                   "ArrowDown" (if cur-idx (min (inc cur-idx) (dec (count items))) 0)
                                   "ArrowUp"   (cond
                                                 (nil? cur-idx) (dec (count items))
                                                 (zero? cur-idx) nil
                                                 :else (dec cur-idx))
                                   "Home"      0
                                   "End"       (dec (count items)))]
                    (if (nil? next-idx)
                      (some-> (rum/deref *search-ref) (.focus))
                      (when-let [target (nth items next-idx nil)]
                        (.focus target #js {:focusVisible true})
                        (scroll-row-into-view! target)))))))}
           (for [[c binding-map] (if (or in-filter? in-keystroke?)
                                   [[:all deduped-bindings]]
                                   result-list-map)
                 :let [folded? (contains? folded-categories c)]]
             ^{:key (str c)}
             [:<>
             ;; category row
              (when (and (not in-query?)
                         (not in-filter?)
                         (not in-keystroke?))
                [:li.flex.justify-between.th
                 {:key       (str c)
                  :role "button"
                  :aria-expanded (str (not folded?))
                  :tab-index -1
                  :on-click  (fn [^js e]
                               (let [header-el (.-currentTarget e)
                                     folding? (not folded?)
                                     active-el (.-activeElement js/document)]
                                 (when (and folding?
                                            active-el
                                            (some-> active-el (.closest "li.shortcut-row")))
                                   (rum/set-ref! *rescue-target-ref header-el))
                                 (set-folded-categories! ((if folded? disj conj) folded-categories c))))
                  :on-key-down (fn [^js e]
                                 (when (contains? #{13 32} (.-keyCode e))
                                   (.preventDefault e)
                                   (set-folded-categories! ((if folded? disj conj) folded-categories c))))}
                 [:strong.font-semibold (t c)]
                 [:i.flex.items-center
                  (ui/icon (if folded? "chevron-left" "chevron-down"))]])

             ;; binding rows
              (when (or in-query? in-filter? (not folded?))
                (for [[id {:keys [binding user-binding] :as m}] binding-map
                      :let [binding (to-vector binding)
                            user-binding (and user-binding (to-vector user-binding))
                            label (shortcut-desc-label id m)
                            cats (classify-shortcut m)
                            disabled? (contains? cats :Disabled)
                            unset? (contains? cats :Unset)]]

                  (when (or (nil? filter-key)
                            (contains? cats filter-key))

                   ;; keystrokes filter
                    (when (or (not in-keystroke?)
                              (and (not disabled?)
                                   (not unset?)
                                   (matches-keystroke? binding user-binding keystroke)))

                      (let [row-action (when (customizable-shortcut-row? id disabled?)
                                         (fn [^js e]
                                           (if (= active-id id)
                                             (let [popup-id (keyword (str "customize-shortcut-" (name id)))]
                                               (reset! *active-shortcut-id nil)
                                               (shui/popup-hide! popup-id))
                                             (let [anchor-el (-> (.-currentTarget e) (.querySelector ".action-wrap"))]
                                               (open-customize-shortcut-dialog! anchor-el id)))))]
                        [:li.shortcut-row.flex.items-start.justify-between.text-sm
                         {:key (str id)
                          :class (when (= active-id id) "active")
                          :tab-index (when (customizable-shortcut-row? id disabled?) -1)
                          :role (when id "button")
                          :aria-disabled (when-not (customizable-shortcut-row? id disabled?) "true")
                          :on-click row-action
                          :on-key-down (when row-action
                                         (fn [^js e]
                                           (when (contains? #{13 32} (.-keyCode e))
                                             (.preventDefault e)
                                             (row-action e))))}
                         [:span.label-wrap label]

                         [:span.action-wrap
                          {:class (util/classnames [{:disabled disabled?}])}

                          (cond
                            unset?
                            [:span.shortcut-status-label (t :keymap/unset)]

                            (or user-binding (false? user-binding))
                            [:<>
                             [:span.shortcut-status-label (str (t :keymap/custom) ":")]
                             (if disabled?
                               [:span.shortcut-status-label (t :keymap/disabled)]
                               (for [b user-binding
                                     :when (string? b)]
                                 [:span {:key b :style {:display "contents"}}
                                  (shui/shortcut b {:chord-separator (t :keymap/chord-separator)})]))]

                            :else
                            (for [b binding
                                  :when (string? b)]
                              [:span {:key b :style {:display "contents"}}
                               (shui/shortcut (dh/binding-for-display id b)
                                              {:raw-binding [b]
                                               :chord-separator (t :keymap/chord-separator)})]))]])))))])])]])))
