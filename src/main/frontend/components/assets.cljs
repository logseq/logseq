(ns frontend.components.assets
  (:require
   [clojure.set :refer [union]]
   [rum.core :as rum]
   [frontend.state :as state]
   [frontend.context.i18n :refer [t]]
   [electron.ipc :as ipc]
   [promesa.core :as p]
   [medley.core :as medley]
   [frontend.ui :as ui]))

(rum/defc restart-button [active?]
  (when active?
    (ui/button (t :plugin/restart)
               :on-click #(js/logseq.api.relaunch)
               :small? true :intent "logseq")))

(rum/defcs alias-directories
  < rum/reactive
  [_state]

  (let [directories  (into [] (state/sub-app-config :assets/alias-dirs))
        select-a-dir (fn [dir exts]
                       (when dir
                         (state/set-app-config!
                          :assets/alias-dirs
                          (let [exists (and directories (medley/find-first #(= dir (:dir (second %1)))
                                                                           (medley/indexed directories)))]
                            (if exists
                              (let [exts' (:exts (second exists))
                                    exts' (cond-> exts
                                            (some? exts')
                                            (union exts'))]
                                (assoc directories (first exists) {:dir dir :exts (set exts')}))
                              (conj directories {:dir dir :exts (set exts)}))))))]

    [:div.cp__assets-alias-directories
     [:ul
      (for [it directories]
        [:li (prn-str it)])]

     [:p
      (ui/button
       "Add directory"
       :on-click #(p/let [path (ipc/ipc :openDialog)]
                    (when-not (get directories path)
                      (select-a-dir path nil)))
       :small? true)]]))

(rum/defcs settings-content
  < rum/reactive
  (rum/local (state/get-app-config :assets/alias-enabled?) ::alias-enabled?)
  [_state]

  (let [*pre-alias-enabled? (::alias-enabled? _state)
        alias-enabled? (state/sub-app-config :assets/alias-enabled?)
        alias-enabled-changed? (not= @*pre-alias-enabled? alias-enabled?)]

    [:div.cp__assets-settings.panel-wrap
     [:div.it
      [:label.block.text-sm.font-medium.leading-5.opacity-70
       "Alias directories"]
      [:div (ui/toggle
             alias-enabled?
             #(state/set-app-config! :assets/alias-enabled? (not alias-enabled?))
             true)]
      [:span
       (restart-button alias-enabled-changed?)]]

     (when alias-enabled?
       [:div.pt-4
        [:h2.font-bold.opacity-80 "Selected directories:"]
        (alias-directories)])]))
