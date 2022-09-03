(ns frontend.components.assets
  (:require
   [clojure.set :refer [difference]]
   [clojure.string :as string]
   [rum.core :as rum]
   [frontend.state :as state]
   [frontend.context.i18n :refer [t]]
   [frontend.util :as util]
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
    (rum/local nil ::ext-editing-dir)
  [_state]
  (let [*ext-editing-dir (::ext-editing-dir _state)
        directories   (into [] (state/sub-app-config :assets/alias-dirs))
        pick-exist    (fn [dir]
                        (when directories
                          (medley/find-first #(= dir (:dir (second %1)))
                                             (medley/indexed directories))))
        set-dir       (fn [dir exts]
                        (when dir
                          (state/set-app-config!
                           :assets/alias-dirs
                           (let [exist (pick-exist dir)]
                             (if exist
                               (assoc directories (first exist) {:dir dir :exts (set exts)})
                               (conj directories {:dir dir :exts (set exts)}))))))

        rm-dir        (fn [dir]
                        (when-let [exist (pick-exist dir)]
                          (state/set-app-config!
                           :assets/alias-dirs
                           (medley/remove-nth (first exist) directories))))

        del-ext       (fn [dir ext]
                        (when-let [exist (and ext (pick-exist dir))]
                          (let [exts (:exts (second exist))
                                exts (difference exts (hash-set ext))]
                            (set-dir dir exts))))

        add-ext       (fn [dir ext]
                        (when-let [exist (and ext (pick-exist dir))]
                          (let [exts (:exts (second exist))
                                exts (conj exts (util/safe-lower-case ext))]
                            (set-dir dir exts))))]

    [:div.cp__assets-alias-directories
     [:ul
      (for [{:keys [dir exts]} directories]
        [:li.item.px-2.py-2
         [:div.flex.justify-between.items-center
          [:a.opacity-90.active:opacity-50
           (ui/icon "folder") dir]

          [:span.flex.space-x-3.text-xs.opacity-30.hover:opacity-100.whitespace-nowrap
           [:a {:on-click #(rm-dir dir)} (ui/icon "trash-x")]]]

         [:div.flex.mt-2.space-x-2
          (for [ext exts]
            [:small.ext-label {:key ext} ext])
          (if (= dir @*ext-editing-dir)
            [:input.ext-input.px-1
             {:autoFocus   true
              :on-key-down (fn [^js e]
                             (let [^js input (.-target e)]
                               (case (.-which e)
                                 13                         ;; enter
                                 (let [val (util/trim-safe (.-value input))]
                                   (and (not (string/blank? val))
                                        (add-ext dir val))
                                   (reset! *ext-editing-dir nil))

                                 27                         ;; esc
                                 (reset! *ext-editing-dir nil)

                                 :dune)))
              :on-blur     #(reset! *ext-editing-dir nil)}]
            [:small.ext-label.is-plus
             {:on-click #(reset! *ext-editing-dir dir)}
             (ui/icon "plus") "Acceptable file extensions"])]])]

     [:p.pt-2
      (ui/button
       "+ Add directory"
       :on-click #(p/let [path (ipc/ipc :openDialog)]
                    (when-not (get directories path)
                      (set-dir path nil)))
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
