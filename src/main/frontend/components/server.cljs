(ns frontend.components.server
  (:require
   [clojure.string :as string]
   [rum.core :as rum]
   [electron.ipc :as ipc]
   [medley.core :as m]
   [promesa.core :as p]
   [frontend.state :as state]
   [frontend.util :as util]
   [frontend.handler.notification :as notification]
   [frontend.ui :as ui]))

(rum/defcs panel-of-tokens
  < rum/reactive
    (rum/local nil ::tokens)
    {:will-mount
     (fn [s]
       (let [*tokens (s ::tokens)]
         (reset! *tokens (get-in @state/state [:electron/server :tokens])) s))}
  [_state close-panel]

  (let [server-state (state/sub :electron/server)
        *tokens      (::tokens _state)
        changed?     (not= @*tokens (:tokens server-state))]
    [:div.cp__server-tokens-panel.-mx-2
     [:h2.text-3xl.-translate-y-4 "Authorization tokens"]
     ;; items
     (let [update-value! (fn [idx k v] (swap! *tokens assoc-in [idx k] v))]
       (for [[idx {:keys [value name]}] (m/indexed @*tokens)]
         [:div.item.py-2.flex.space-x-2.items-center
          {:key idx}
          [:input.form-input.basis-36
           {:auto-focus  true
            :placeholder "name"
            :value       name
            :on-change   #(let [value (.-value (.-target %))]
                            (update-value! idx :name value))}]
          [:input.form-input
           {:placeholder "value"
            :value       value
            :on-change   #(let [value (.-value (.-target %))]
                            (update-value! idx :value value))}]

          [:button.px-2.opacity-50.hover:opacity-90.active:opacity-100
           {:on-click #(reset! *tokens (into [] (m/remove-nth idx @*tokens)))}
           [:span.flex.items-center (ui/icon "trash-x")]]]))

     [:p.flex.justify-end.pt-6.space-x-3
      (ui/button "+ Add new token"
                 :on-click #(swap! *tokens conj {})
                 :intent "logseq")
      (ui/button "Save"
                 :on-click (fn [] (-> (ipc/ipc :server/set-config {:tokens @*tokens})
                                      (p/then #(notification/show! "Update tokens successfully!" :success))
                                      (p/catch #(js/console.error %))
                                      (p/finally #(close-panel))))
                 :disabled (not changed?))]]))

(rum/defc server-indicator
  [server-state]

  (rum/use-effect!
   #(ipc/ipc :server/load-state) [])

  (let [{:keys [status]} server-state
        status   (keyword (util/safe-lower-case status))
        running? (= :running status)]
    [:div.cp__server-indicator
     (ui/icon "api" {:size 24})
     [:code.text-sm.ml-1
      (if-not running?
        (string/upper-case (or (:status server-state) "stopped"))
        (str "http://" (:host server-state) ":" (:port server-state)))]

     ;; settings menus
     (ui/dropdown-with-links
      (fn [{:keys [toggle-fn]}]
        [:span.opacity-50.hover:opacity-80.active:opacity-100
         [:button.button.icon.ml-1
          {:on-click #(toggle-fn)}
          (ui/icon "dots-vertical" {:size 16})]])
      ;; items
      (->> [(cond
              running?
              {:title   "Stop server"
               :options {:on-click #(ipc/ipc :server/do :stop)}
               :icon    [:span.text-red-500.flex.items-center (ui/icon "player-stop")]}

              :else
              {:title   "Start server"
               :options {:on-click #(ipc/ipc :server/do :restart)}
               :icon    [:span.text-green-500.flex.items-center (ui/icon "player-play")]})

            {:title   "Authorization tokens"
             :options {:on-click #(state/set-modal!
                                   (fn [close]
                                     (panel-of-tokens close))
                                   {:center? true})}
             :icon    (ui/icon "key")}

            {:title   "Server configurations"
             :options {:on-click #(notification/show! "TODO: manager of server!")}
             :icon    (ui/icon "server-cog")}])
      {})]))

