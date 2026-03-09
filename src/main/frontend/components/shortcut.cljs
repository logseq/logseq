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
            [promesa.core :as p]
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

(defonce *refresh-sentry (atom 0))
(defn refresh-shortcuts-list! [] (reset! *refresh-sentry (inc @*refresh-sentry)))
(defonce *global-listener-setup? (atom false))

(defn- to-vector [v]
  (when-not (nil? v)
    (if (sequential? v) (vec v) [v])))

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
    (hooks/use-effect!
     (fn []
       (let [^js el (rum/deref *ref-el)
             key-handler (KeyHandler. el)

             teardown-global!
             (when-not @*global-listener-setup?
               (shortcut/unlisten-all! true)
               (reset! *global-listener-setup? true)
               (fn []
                 (shortcut/listen-all!)
                 (reset! *global-listener-setup? false)))]

         (events/listen key-handler "key"
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
                                  (clear!)
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
                                            new-ks (util/trim-safe (str cur kn))]
                                        (set-accumulating! true)
                                        (set-keystroke! new-ks)
                                        (start-commit-timer! new-ks))))))))))

         (js/setTimeout #(.focus el) 128)

         #(do (when-let [timer (rum/deref *commit-timer)]
                (js/clearTimeout timer))
              (some-> teardown-global! (apply nil))
              (.dispose key-handler))))
     [])

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
         [:a.shortcut-binding-remove
          {:on-click (fn [^js e]
                       (.stopPropagation e)
                       (clear!))}
          (ui/icon "x" {:size 12})]])
      ;; Placeholder
      (when-not has-keystroke?
        [:span.shortcut-input-placeholder "Press keys to filter\u2026"])]

     ;; SEPARATOR + TOOLBAR
     (shui/separator)
     [:div.shortcut-toolbar
      [:div
       (when has-keystroke?
         [:a.shortcut-toolbar-action
          {:on-click clear!}
          (ui/icon "rotate" {:size 12})
          [:span "Clear"]])]
      [:div.flex.items-center
       (when has-keystroke?
         [:span.shortcut-toolbar-hint
          "Remove " (shui/shortcut "backspace" {:style :compact})])
       [:span.shortcut-toolbar-hint
        "Close " (shui/shortcut "escape" {:style :compact})]]]]))

(rum/defc pane-controls
  [q set-q! filters set-filters! keystroke set-keystroke! toggle-categories-fn]
  (let [*search-ref (rum/use-ref nil)]
    [:div.cp__shortcut-page-x-pane-controls
     [:a.flex.items-center.icon-link
      {:on-click toggle-categories-fn
       :title "Toggle categories pane"}
      (ui/icon "fold")]

     [:a.flex.items-center.icon-link
      {:on-click refresh-shortcuts-list!
       :title "Refresh all"}
      (ui/icon "refresh")]

     [:span.search-input-wrap
      [:input.form-input.is-small
       {:placeholder (t :keymap/search)
        :ref         *search-ref
        :value       (or q "")
        :auto-focus  true
        :on-key-down #(when (= 27 (.-keyCode %))
                        (util/stop %)
                        (if (string/blank? q)
                          (some-> (rum/deref *search-ref) (.blur))
                          (set-q! "")))
        :on-change   #(let [v (util/evalue %)]
                        (set-q! v))}]

      (when-not (string/blank? q)
        [:a.x
         {:on-click (fn []
                      (set-q! "")
                      (js/setTimeout #(some-> (rum/deref *search-ref) (.focus)) 50))}
         (ui/icon "x" {:size 14})])]

     ;; keyboard filter
     (let [filter-popup-id :shortcut-keystroke-filter
           open-filter! (fn [^js e]
                          (shui/popup-show!
                           (.-currentTarget e)
                           (fn [_]
                             (keyboard-filter-record-inner
                              keystroke set-keystroke!
                              #(shui/popup-hide! filter-popup-id)))
                           {:id filter-popup-id
                            :force-popover? true
                            :align "end"
                            :content-props
                            {:class "shortcut-filter-popover-content p-0 w-auto"
                             :collision-padding 12
                             :onOpenAutoFocus #(.preventDefault %)
                             :onCloseAutoFocus #(.preventDefault %)
                             :onEscapeKeyDown (fn [_] false)
                             :onPointerDownOutside (fn [_] nil)}}))]
       [:a.flex.items-center.icon-link
        {:on-click open-filter!}
        (ui/icon "keyboard")
        (when-not (string/blank? keystroke)
          (ui/point "bg-red-600.absolute" 4 {:style {:right -2 :top -2}}))])

     ;; other filter
     (ui/dropdown-with-links
      (fn [{:keys [toggle-fn]}]
        [:a.flex.items-center.icon-link.relative
         {:on-click toggle-fn}
         (ui/icon "filter")

         (when (seq filters)
           (ui/point "bg-red-600.absolute" 4 {:style {:right -2 :top -2}}))])

      (for [k [:All :Disabled :Unset :Custom]
            :let [all? (= k :All)
                  checked? (or (contains? filters k) (and all? (nil? (seq filters))))]]

        {:title   (if all? (t :keymap/all) (t (keyword :keymap (string/lower-case (name k)))))
         :icon    (ui/icon (if checked? "checkbox" "square"))
         :options {:on-click #(set-filters! (if all? #{} (let [f (if checked? disj conj)] (f filters k))))}})

      nil)]))

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
    (let [binding (to-vector binding)
          user-binding (and user-binding (to-vector user-binding))
          popup-id (keyword (str "customize-shortcut-" (name id)))
          label (dh/get-shortcut-desc (assoc m :id id))
          close-fn! #(do (reset! *active-shortcut-id nil)
                         (shui/popup-hide! popup-id))
          args [id label binding user-binding
                {:saved-cb (fn [] (-> (p/delay 500) (p/then refresh-shortcuts-list!)))
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
        :on-after-hide #(reset! *active-shortcut-id nil)
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

(rum/defc shortcut-conflicts-display
  [_k conflicts-map]

  [:div.cp__shortcut-conflicts-list-wrap
   (for [[g ks] conflicts-map]
     [:section.relative
      [:h2 (ui/icon "alert-triangle" {:size 15})
       [:span (t :keymap/conflicts-for-label)]
       [:code (shortcut-utils/decorate-binding g)]]
      [:ul
       (for [v (vals ks)
             :let [k (first v)
                   vs (second v)]]
         (for [[id' handler-id] vs
               :let [m (dh/shortcut-item id')]
               :when (not (nil? m))]
           [:li
            {:key (str id')}
            [:a.select-none.hover:underline
             {:on-click (fn [^js e] (open-customize-shortcut-dialog! e id'))
              :title (str handler-id)}
             [:code.inline-block.mr-1.text-xs
              (shortcut-utils/decorate-binding k)]
             [:span
              (dh/get-shortcut-desc m)
              (ui/icon "external-link" {:size 18})]
             [:code [:small (str id')]]]]))]])])

(defn- execute-undo!
  "Restore previous bindings for all affected actions."
  [snapshot]
  (doseq [{:keys [action-id previous-binding]} (:entries snapshot)]
    (shortcut/persist-user-shortcut! action-id previous-binding))
  (js/setTimeout #(do (shortcut/refresh!) (refresh-shortcuts-list!)) 50))

(defn- show-undo-toast!
  [description snapshot set-current-binding! self-id]
  (shui/toast!
   {:description description
    :action (fn [{:keys [dismiss!]}]
              [:button.font-medium.underline.cursor-pointer
               {:on-click (fn []
                            (execute-undo! snapshot)
                            ;; Update local state if dialog is still open
                            (when-let [own (some #(when (= (:action-id %) self-id) %) (:entries snapshot))]
                              (set-current-binding! (:previous-binding own)))
                            (dismiss!))}
               "Undo"])
    :duration 6000}
   :default))

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
       (string/join ", ")))

(rum/defc ^:large-vars/cleanup-todo customize-shortcut-dialog-inner
  "user-binding: empty vector is for the unset state, nil is for the default binding"
  [k action-name binding user-binding {:keys [saved-cb close-fn]}]
  (let [*ref-el (rum/use-ref nil)
        [keystroke set-keystroke!] (rum/use-state "")
        [current-binding set-current-binding!] (rum/use-state (or user-binding binding))
        [key-conflicts set-key-conflicts!] (rum/use-state nil)
        [rec-state set-rec-state!] (rum/use-state :idle)
        [accepted-info set-accepted-info!] (rum/use-state nil)
        *auto-accept-timer (rum/use-ref nil)
        *fade-timer (rum/use-ref nil)
        ;; Refs to avoid stale closures in mount-only key handler effect
        *rec-state-ref (rum/use-ref rec-state)
        *keystroke-ref (rum/use-ref keystroke)
        *current-binding-ref (rum/use-ref current-binding)
        *key-conflicts-ref (rum/use-ref key-conflicts)

        handler-id (hooks/use-memo #(dh/get-group k) [])
        has-bindings? (boolean (seq (filter string? current-binding)))

        persist-binding!
        (fn [new-binding]
          (let [binding' (if (= binding new-binding) nil new-binding)]
            (shortcut/persist-user-shortcut! k binding')
            (js/setTimeout #(do (shortcut/refresh!) (saved-cb)) 50)))

        cancel-fn!
        (fn []
          (set-keystroke! "")
          (set-key-conflicts! nil)
          (set-rec-state! :idle))

        reset-fn!
        (fn []
          (let [undo-entries [{:action-id k :previous-binding current-binding}]]
            (set-current-binding! binding)
            (shortcut/persist-user-shortcut! k nil)
            (js/setTimeout #(do (shortcut/refresh!) (saved-cb)) 50)
            (show-undo-toast! "Reset to default"
                              {:entries undo-entries}
                              set-current-binding! k)))

        override-fn!
        (fn []
          (let [conflicts (rum/deref *key-conflicts-ref)
                ks (rum/deref *keystroke-ref)
                cur-binding (rum/deref *current-binding-ref)]
            (when (and (seq conflicts) (not (string/blank? ks)))
              ;; Build undo snapshot BEFORE mutations
              (let [undo-entries
                    (into [{:action-id k :previous-binding cur-binding}]
                          (for [[_g kss] conflicts
                                v (vals kss)
                                :let [conflicts-ids-map (second v)]
                                [conflicting-id _handler] conflicts-ids-map]
                            {:action-id conflicting-id
                             :previous-binding (dh/shortcut-binding conflicting-id)}))
                    accepted-key ks
                    new-binding (conj cur-binding accepted-key)]

                ;; Remove binding from all conflicting actions + persist
                (doseq [[_g kss] conflicts
                        v (vals kss)
                        :let [conflicts-ids-map (second v)]
                        [conflicting-id _handler] conflicts-ids-map]
                  (let [their-binding (dh/shortcut-binding conflicting-id)
                        filtered (vec (remove #(= % accepted-key) their-binding))]
                    (shortcut/persist-user-shortcut! conflicting-id
                                                     (if (empty? filtered) [] filtered))))

                ;; Add to current binding + persist
                (set-current-binding! new-binding)
                (persist-binding! new-binding)

                ;; Undo toast
                (show-undo-toast!
                 (str "Reassigned from " (conflict-action-names conflicts))
                 {:entries undo-entries}
                 set-current-binding! k)

                ;; Transition to :accepted with reassign info
                (set-accepted-info! {:key accepted-key :from (conflict-action-names conflicts)})
                (set-keystroke! "")
                (set-key-conflicts! nil)
                (set-rec-state! :accepted)))))]

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
                            (let [conflicts-map (dh/get-conflicts-by-keys keystroke handler-id {:exclude-ids #{k}})]
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
                                ;; Same-context conflicts — blocking red state
                                (do
                                  (set-key-conflicts! conflicts-map)
                                  (set-rec-state! :conflict-cross)))))))
                      400)]
           (rum/set-ref! *auto-accept-timer timer)))
       #(when-let [timer (rum/deref *auto-accept-timer)]
          (js/clearTimeout timer)))
     [keystroke])

    ;; Auto-fade for transient states: conflict-same, esc-hint, accepted
    (hooks/use-effect!
     (fn []
       (when (#{:conflict-same :esc-hint :accepted} rec-state)
         (let [ms (case rec-state
                    :esc-hint 2000
                    :accepted (if (:cross-context? accepted-info) 6000 3000)
                    3000)
               timer (js/setTimeout
                      #(set-rec-state! :idle)
                      ms)]
           (rum/set-ref! *fade-timer timer)))
       #(when-let [timer (rum/deref *fade-timer)]
          (js/clearTimeout timer)))
     [rec-state])

    ;; Key handler (mount-only, uses refs for current state)
    (hooks/use-effect!
     (fn []
       (let [^js el (rum/deref *ref-el)
             key-handler (KeyHandler. el)

             teardown-global!
             (when-not @*global-listener-setup?
               (shortcut/unlisten-all! true)
               (reset! *global-listener-setup? true)
               (fn []
                 (shortcut/listen-all!)
                 (reset! *global-listener-setup? false)))]

         (events/listen key-handler "key"
                        (fn [^js e]
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
                                ;; Always stop propagation so Esc doesn't close the Settings dialog
                                (.stopPropagation e)
                                (case state
                                  :idle           (close-fn)
                                  :accepted       (close-fn)
                                  :esc-hint       (close-fn)
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
                                   (#{:idle :accepted} state)
                                   (string/blank? (rum/deref *keystroke-ref)))
                              (let [cur-binding (rum/deref *current-binding-ref)]
                                (when (seq (filter string? cur-binding))
                                  (let [new-binding (vec (butlast cur-binding))
                                        undo-entries [{:action-id k :previous-binding cur-binding}]]
                                    (set-current-binding! new-binding)
                                    (persist-binding! new-binding)
                                    (set-rec-state! :idle)
                                    (show-undo-toast! "Shortcut removed"
                                                      {:entries undo-entries}
                                                      set-current-binding! k))))

                              ;; Conflict-cross + Cmd+Enter => override
                              (and is-cmd-enter? (= state :conflict-cross))
                              (override-fn!)

                              ;; Conflict-cross + other keys => ignore (dead-end)
                              (= state :conflict-cross)
                              nil

                              ;; Conflict-same / esc-hint + key => start new recording
                              (#{:conflict-same :esc-hint} state)
                              (when-let [kn (shortcut/keyname e)]
                                (set-rec-state! :recording)
                                (set-keystroke! (util/trim-safe kn)))

                              ;; Idle / accepted + key => start recording
                              (#{:idle :accepted} state)
                              (when-let [kn (shortcut/keyname e)]
                                (set-rec-state! :recording)
                                (set-keystroke! (util/trim-safe kn)))

                              ;; Recording + key => accumulate
                              (= state :recording)
                              (when-let [kn (shortcut/keyname e)]
                                (set-key-conflicts! nil)
                                (set-keystroke! #(util/trim-safe (str % kn))))))))

         (js/setTimeout #(.focus el) 128)

         #(do (when-let [timer (rum/deref *auto-accept-timer)]
                (js/clearTimeout timer))
              (when-let [timer (rum/deref *fade-timer)]
                (js/clearTimeout timer))
              (some-> teardown-global! (apply nil))
              (.dispose key-handler))))
     [])

    ;; === V3 LAYOUT ===
    [:div.shortcut-popover
     {:tab-index -1
      :ref       *ref-el}

     ;; TITLE
     [:div.shortcut-popover-title action-name]

     ;; INPUT FIELD
     [:div.shortcut-input-field
      {:class (when (#{:conflict-cross :conflict-same} rec-state) "conflict")}
      ;; Existing bindings — each wrapped in a grouping container
      (for [[idx x] (map-indexed vector current-binding)
            :when (string? x)]
        [:div.shortcut-input-binding {:key x}
         (shui/shortcut x)
         (when (#{:idle :accepted :esc-hint} rec-state)
           [:a.shortcut-binding-remove
            {:on-click (fn [^js e]
                         (.stopPropagation e)
                         (let [new-binding (vec (concat (subvec current-binding 0 idx)
                                                        (subvec current-binding (inc idx))))
                               undo-entries [{:action-id k :previous-binding current-binding}]]
                           (set-current-binding! new-binding)
                           (persist-binding! new-binding)
                           (set-rec-state! :idle)
                           (show-undo-toast! "Shortcut removed"
                                             {:entries undo-entries}
                                             set-current-binding! k)))}
            (ui/icon "x" {:size 12})])])
      ;; Recording in progress — dashed keys (uncommitted)
      (when (and (#{:recording :conflict-cross :conflict-same} rec-state)
                 (not (string/blank? keystroke)))
        [:div.shortcut-input-binding.shortcut-input-binding--pending
         (shui/shortcut keystroke)
         (when (#{:conflict-cross :conflict-same} rec-state)
           [:a.shortcut-binding-remove
            {:on-click (fn [^js e]
                         (.stopPropagation e)
                         (cancel-fn!))}
            (ui/icon "x" {:size 12})])])
      ;; Placeholder
      (when (#{:idle :recording :accepted} rec-state)
        [:span.shortcut-input-placeholder "Press a shortcut\u2026"])]

     ;; FEEDBACK BANNER (conditional)
     (case rec-state
       :conflict-cross
       [:div.shortcut-feedback.shortcut-feedback--error
        [:span "Used by "
         [:span.shortcut-feedback-name (str "\u201c" (conflict-action-names key-conflicts) "\u201d")]]
        (ui/tooltip
         (shui/button {:variant :destructive
                       :size :xs
                       :on-click override-fn!}
                      "Reassign")
         "Remove from the other action and assign here")]

       :conflict-same
       [:div.shortcut-feedback.shortcut-feedback--error
        [:span "Already bound to this action"]]

       :accepted
       (cond
         (:cross-context? accepted-info)
         [:div.shortcut-feedback.shortcut-feedback--warning
          [:span "Also used for "
           [:span.shortcut-feedback-name
            (str "\u201c" (:cross-action-name accepted-info) "\u201d")]
           (when-let [ctx (:cross-context-label accepted-info)]
             (str " in " ctx))]]

         (:from accepted-info)
         [:div.shortcut-feedback.shortcut-feedback--success
          [:span "Reassigned from "
           [:span.shortcut-feedback-name (str "\u201c" (:from accepted-info) "\u201d")]]]

         :else
         [:div.shortcut-feedback.shortcut-feedback--success
          [:span "Shortcut added"]])

       :esc-hint
       [:div.shortcut-feedback.shortcut-feedback--muted
        [:span "Esc is reserved"]]

       nil)

     ;; SEPARATOR + TOOLBAR
     (shui/separator)
     [:div.shortcut-toolbar
      [:div.shortcut-toolbar-left
       ;; Reset (only when changed from default)
       (when (and (#{:idle :accepted} rec-state)
                  (not= current-binding binding))
         [:a.shortcut-toolbar-action
          {:on-click reset-fn!}
          (ui/icon "rotate" {:size 12})
          [:span "Reset"]])]
      [:div.shortcut-toolbar-right
       ;; Reassign hint (conflict-cross only)
       (when (= :conflict-cross rec-state)
         [:span.shortcut-toolbar-hint
          "Reassign "
          (shui/shortcut (if util/mac? "meta+enter" "ctrl+enter") {:style :compact})])
       ;; Remove hint (idle/accepted with bindings, or conflict states)
       (when (or (and (#{:idle :accepted} rec-state) has-bindings?)
                 (#{:conflict-cross :conflict-same} rec-state))
         [:span.shortcut-toolbar-hint
          "Remove "
          (shui/shortcut "backspace" {:style :compact})])
       ;; Close/Cancel hint
       [:span.shortcut-toolbar-hint
        (if (= :recording rec-state) "Cancel " "Close ")
        (shui/shortcut "escape" {:style :compact})]]]]))

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
        [filters, set-filters!] (rum/use-state #{})
        [keystroke, set-keystroke!] (rum/use-state "")
        [q set-q!] (rum/use-state nil)

        categories-list-map (build-categories-map)
        all-categories (into #{} (map first categories-list-map))
        in-filters? (boolean (seq filters))
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
        toggle-categories! #(if (= folded-categories all-categories)
                              (set-folded-categories! #{})
                              (set-folded-categories! all-categories))]

    (hooks/use-effect!
     (fn []
       (js/setTimeout #(set-ready! true) 100))
     [])

    ;; Clean up any open shortcut popovers when this component unmounts
    (hooks/use-effect!
     (fn []
       (fn []
         (reset! *active-shortcut-id nil)
         (shui/popup-hide-all!)))
     [])

    [:div.cp__shortcut-page-x
     [:header.relative
      [:h2.text-xs.opacity-70
       (str (t :keymap/total)
            " "
            (if ready?
              (apply + (map #(count (second %)) result-list-map))
              " ..."))]

      (pane-controls q set-q! filters set-filters! keystroke set-keystroke! toggle-categories!)]

     [:article
      (when-not ready?
        [:p.py-8.flex.justify-center (ui/loading "")])

      (when ready?
        [:ul.list-none.m-0.py-3
         (for [[c binding-map] result-list-map
               :let [folded? (contains? folded-categories c)]]
           [:<>
            ;; category row
            (when (and (not in-query?)
                       (not in-filters?)
                       (not in-keystroke?))
              [:li.flex.justify-between.th
               {:key      (str c)
                :on-click #(let [f (if folded? disj conj)]
                             (set-folded-categories! (f folded-categories c)))}
               [:strong.font-semibold (t c)]
               [:i.flex.items-center
                (ui/icon (if folded? "chevron-left" "chevron-down"))]])

            ;; binding row
            (when (or in-query? in-filters? (not folded?))
              (for [[id {:keys [binding user-binding] :as m}] binding-map
                    :let [binding (to-vector binding)
                          user-binding (and user-binding (to-vector user-binding))
                          label (shortcut-desc-label id m)
                          custom? (not (nil? user-binding))
                          disabled? (or (false? user-binding)
                                        (false? (first binding)))
                          unset? (and (not disabled?)
                                      (or (= user-binding [])
                                          (and (nil? binding) (nil? user-binding))
                                          (and (= binding [])
                                               (nil? user-binding))))]]

                (when (or (nil? (seq filters))
                          (when (contains? filters :Custom) custom?)
                          (when (contains? filters :Disabled) disabled?)
                          (when (contains? filters :Unset) unset?))

                  ;; keystrokes filter
                  (when (or (not in-keystroke?)
                            (and (not disabled?)
                                 (not unset?)
                                 (let [binding' (or user-binding binding)
                                       keystroke' (some-> (shortcut-utils/safe-parse-string-binding keystroke) (bean/->clj))]
                                   (when (sequential? binding')
                                     (some #(when-let [s (some-> % (dh/mod-key) (shortcut-utils/safe-parse-string-binding) (bean/->clj))]
                                              (or (= s keystroke')
                                                  (and (sequential? s) (sequential? keystroke')
                                                       (apply = (map first [s keystroke']))))) binding')))))

                    [:li.shortcut-row.flex.items-start.justify-between.text-sm
                     {:key (str id)
                      :class (when (= active-id id) "active")
                      :on-click (when (and id (not disabled?))
                                  (fn [^js e]
                                    (if (= active-id id)
                                      (let [popup-id (keyword (str "customize-shortcut-" (name id)))]
                                        (reset! *active-shortcut-id nil)
                                        (shui/popup-hide! popup-id))
                                      (let [anchor-el (-> (.-currentTarget e) (.querySelector ".action-wrap"))]
                                        (open-customize-shortcut-dialog! anchor-el id)))))}
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
                             [:span {:key b}
                              (shui/shortcut b)]))]

                        :else
                        (for [b binding
                              :when (string? b)]
                          [:span {:key b}
                           (shui/shortcut (dh/binding-for-display id b)
                                          {:raw-binding [b]})]))]]))))])])]]))
