(ns frontend.components.icon
  "Facade for the icon picker. Re-exports the public icon API from the
   `frontend.components.icon.*` namespaces (so no caller changes its
   require) and hosts `icon-picker`, the trigger-button + popup entry
   point."
  (:require [frontend.components.icon.core :as icon-core]
            [frontend.components.icon.normalization :as norm]
            [frontend.components.icon.search :as icon-search-ns]
            [frontend.components.icon.utils :as icon-utils]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]))

;; --- Re-exports ------------------------------------------------------------

(def emojis "The emoji-mart dataset (seq of emoji maps)." icon-utils/emojis)

(def icon "Render an icon value. See `frontend.components.icon.core/icon`." icon-core/icon)
(def get-node-icon icon-core/get-node-icon)
(def get-node-icon-cp icon-core/get-node-icon-cp)
(def get-used-items icon-core/get-used-items)
(def add-used-item! icon-core/add-used-item!)

(def normalize-icon norm/normalize-icon)
(def icon-data-for-storage norm/icon-data-for-storage)
(def renderable-icon? norm/renderable-icon?)

(def icon-search icon-search-ns/icon-search)
(def emojis-cp icon-search-ns/emojis-cp)
(def reaction-picker-opts icon-search-ns/reaction-picker-opts)

;; --- Picker trigger ----------------------------------------------------------

(hsx/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts]}]
  (let [*trigger-ref (hooks/use-ref nil)
        ;; Optimistic post-commit override. Holds the just-committed
        ;; icon-value during the ~15ms SharedWorker round-trip between
        ;; the DB write and the entity update propagating back via the
        ;; reactive read chain. Without this, the page-icon trigger
        ;; reader falls back to the (still-old) entity for that window
        ;; and visibly flashes the previous icon.
        ;;
        ;; Cleared automatically by the use-effect below when icon-value
        ;; (passed by parent) catches up — Logseq's hooks/use-effect!
        ;; uses Clojure value equality (logseq.shui.hooks/memo-deps), so
        ;; the dep [icon-value] fires when the map's *content* changes,
        ;; not on every render reference flip.
        [pending-icon set-pending-icon!] (hooks/use-state nil)
        _ (hooks/use-effect!
           (fn [] (set-pending-icon! nil))
           [icon-value])
        effective-icon-value (or pending-icon icon-value)
        normalized-icon-value (normalize-icon effective-icon-value)
        content-fn
        (if config/publishing?
          (constantly [])
          (fn [{:keys [id]}]
            (icon-search
             {:on-chosen (fn [e icon-value & [keep-popup?]]
                           ;; Set the optimistic local mirror BEFORE the
                           ;; async DB write fires. Lives at this outermost
                           ;; wrapper so every commit path benefits — tile
                           ;; picks, search results, color auto-apply and
                           ;; the delete flow all funnel through this
                           ;; on-chosen.
                           (set-pending-icon! icon-value)
                           ;; Forward the third arg as-is — it carries either
                           ;; `keep-popup?` (a bool, for in-picker partial
                           ;; commits like color picks) or an action keyword
                           ;; (the delete flow's :remove). The downstream
                           ;; on-chosen handles both shapes; we just need to
                           ;; NOT drop it.
                           (on-chosen e icon-value keep-popup?)
                           (when-not (true? keep-popup?) (shui/popup-hide! id)))
              :icon-value normalized-icon-value
              :del-btn? del-btn?})))]
    (hooks/use-effect!
     (fn []
       (when initial-open?
         (js/setTimeout #(some-> (hooks/deref *trigger-ref) (.click)) 32)))
     [initial-open?])

    ;; trigger — render from `effective-icon-value` so the just-committed
    ;; icon shows immediately, before the entity reactive read catches up.
    (let [has-icon? (some? effective-icon-value)]
      (shui/button
       (merge
        {:ref *trigger-ref
         :variant :ghost
         :size :sm
         :class (if has-icon? "px-1 leading-none text-muted-foreground hover:text-foreground"
                    "font-normal text-sm px-[0.5px] text-muted-foreground hover:text-foreground")
         :on-click (fn [^js e]
                     (when-not disabled?
                       (shui/popup-show! (.-target e) content-fn
                                         (medley/deep-merge
                                          {:align :start
                                           :id :ls-icon-picker
                                           :content-props {:class "ls-icon-picker"
                                                           :onEscapeKeyDown #(.preventDefault %)}}
                                          popup-opts))))}
        button-opts)
       (if has-icon?
         (if (vector? effective-icon-value) ; hiccup
           effective-icon-value
           (icon effective-icon-value (merge {:color? true} icon-props)))
         (or empty-label (t :ui/empty)))))))
