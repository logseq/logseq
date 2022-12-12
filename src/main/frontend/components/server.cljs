(ns frontend.components.server
  (:require
   [clojure.string :as string]
   [rum.core :as rum]
   [electron.ipc :as ipc]
   [frontend.util :as util]
   [frontend.handler.notification :as notification]
   [frontend.ui :as ui]))

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
             :options {:on-click #(notification/show! "TODO: manager of trusted api tokens!")}
             :icon    (ui/icon "key")}

            {:title   "Server configurations"
             :options {:on-click #(notification/show! "TODO: manager of server!")}
             :icon    (ui/icon "server-cog")}])
      {})]))

