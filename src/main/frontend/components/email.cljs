(ns frontend.components.email
  (:require [frontend.context.i18n :refer [t]]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util.email :as email-util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(defn- stop-event!
  [^js e]
  (.preventDefault e)
  (.stopPropagation e))

(defn- with-tooltip
  [trigger tooltip-content tooltip?]
  (if tooltip?
    (ui/tooltip trigger tooltip-content)
    trigger))

(hsx/defc email-address
  [{:keys [email class text-class icon-class tooltip?]
    :or {tooltip? (not (state/mobile?))}}]
  (let [config (state/use-sub-config)
        mask-email? (email-util/mask-email? config)
        [revealed? set-revealed!] (hooks/use-state false)
        masked? (and mask-email? (not revealed?))
        text (if masked? (email-util/mask-email email) email)
        tooltip-content (t (if masked?
                             :account/show-email-address
                             :account/hide-email-address))
        button [:button.ls-email-visibility-toggle
                {:type "button"
                 :class (or icon-class
                            "ml-1 inline-flex items-center border-0 bg-transparent p-0 text-current opacity-70 hover:opacity-100")
                 :aria-label tooltip-content
                 :on-pointer-down stop-event!
                 :on-key-down (fn [^js e]
                                (when (contains? #{"Enter" " "} (.-key e))
                                  (.stopPropagation e)))
                 :on-click (fn [e]
                             (stop-event! e)
                             (set-revealed! (not revealed?)))}
                (shui/tabler-icon (if masked? "eye" "eye-off") {:size 14})]]
    (when (some? email)
      [:span.ls-email-address.inline-flex.items-center
       (cond-> {:class class}
         mask-email? (assoc :data-masked (str masked?)))
       [:span {:class text-class} text]
       (when mask-email?
         (with-tooltip button tooltip-content tooltip?))])))
