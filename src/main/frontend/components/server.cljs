(ns frontend.components.server
  (:require
    [clojure.string :as string]
    [rum.core :as rum]
    [electron.ipc :as ipc]
    [medley.core :as medley]
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
       (for [[idx {:keys [value name]}] (medley/indexed @*tokens)]
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
           {:on-click #(reset! *tokens (into [] (medley/remove-nth idx @*tokens)))}
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

(rum/defcs panel-of-configs
  < rum/reactive
    (rum/local nil ::configs)
    {:will-mount
     (fn [s]
       (let [*configs (s ::configs)]
         (reset! *configs (:electron/server @state/state)) s))}
  [_state close-panel]

  (let [server-state (state/sub :electron/server)
        *configs     (::configs _state)
        {:keys [host port autostart]} @*configs
        hp-changed?  (or (not= host (:host server-state))
                         (not= (util/safe-parse-int (or port 0))
                               (util/safe-parse-int (or (:port server-state) 0))))
        changed?     (or hp-changed? (->> [autostart (:autostart server-state)]
                                          (mapv #(cond-> % (nil? %) not))
                                          (apply not=)))]

    [:div.cp__server-configs-panel.-mx-2
     [:h2.text-3xl.-translate-y-4 "Server configurations"]

     [:div.item.flex.items-center.space-x-3
      [:label.basis-96
       [:strong "Host"]
       [:input.form-input
        {:value     host
         :on-change #(let [value (.-value (.-target %))]
                       (swap! *configs assoc :host value))}]]

      [:label
       [:strong "Port (1 ~ 65535)"]
       [:input.form-input
        {:auto-focus true
         :value      port
         :min        "1"
         :max        "65535"
         :type       "number"
         :on-change  #(let [value (.-value (.-target %))]
                        (swap! *configs assoc :port value))}]]]

     [:p.py-3.px-1
      [:label.flex.space-x-2.items-center
       [:input.form-checkbox
        {:type      "checkbox"
         :on-change #(let [checked (.-checked (.-target %))]
                       (swap! *configs assoc :autostart checked))
         :checked   (not (false? autostart))}]

       [:strong.select-none "Auto start server with the app launched"]]]

     [:p.flex.justify-end.pt-6.space-x-3
      (ui/button "Reset" :intent "logseq"
                 :on-click #(reset! *configs (select-keys server-state [:host :port :autostart])))
      (ui/button "Save & Apply"
                 :disabled (not changed?)
                 :on-click (fn []
                             (let [configs (select-keys @*configs [:host :port :autostart])]
                               (-> (ipc/ipc :server/set-config configs)
                                   (p/then #(p/let [_ (close-panel)
                                                    _ (p/delay 1000)]
                                              (when hp-changed?
                                                (ipc/ipc :server/do :restart))))
                                   (p/catch #(notification/show! (str %) :error))))))]]))

(rum/defc server-indicator
  [server-state]

  (rum/use-effect!
    (fn []
      (p/let [_ (p/delay 1000)
              _ (ipc/ipc :server/load-state)]
        (let [t (js/setTimeout #(when (state/sub [:electron/server :autostart])
                                  (ipc/ipc :server/do :restart)) 1000)]
          #(js/clearTimeout t))))
    [])

  (let [{:keys [status error]} server-state
        status   (keyword (util/safe-lower-case status))
        running? (= :running status)
        href     (and running? (str "http://" (:host server-state) ":" (:port server-state)))]

    (rum/use-effect!
      #(when error
         (notification/show! (str "[Server] " error) :error))
      [error])

    [:div.cp__server-indicator
     ;; settings menus
     (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:button.button.icon
          {:on-click #(toggle-fn)}
          (ui/icon (if running? "api" "api-off") {:size 22})])

       ;; items
       (->> [{:hr true}

             (cond
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
              :options {:on-click #(state/set-modal!
                                     (fn [close]
                                       (panel-of-configs close))
                                     {:center? true})}
              :icon    (ui/icon "server-cog")}])
       {:links-header
        [:div.links-header.flex.justify-center.py-2
         [:span.ml-1.text-sm
          (if-not running?
            (string/upper-case (or (:status server-state) "stopped"))
            [:a.hover:underline {:href href} href])]]})]))
