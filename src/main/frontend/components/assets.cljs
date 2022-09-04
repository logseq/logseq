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
   [frontend.ui :as ui]
   [frontend.handler.notification :as notification]
   [frontend.handler.assets :as assets-handler]))

(rum/defc confirm-dir-with-alias-name
  [dir set-dir!]

  (let [[val set-val!] (rum/use-state "")
        on-submit (fn []
                    (when-not (string/blank? val)
                      (if-not (assets-handler/get-alias-by-name val)
                        (do (set-dir! val dir nil)
                            (state/close-modal!))
                        (notification/show!
                         (util/format "Alias name of [%s] already exists!" val) :warning))))]

    [:div.cp__assets-alias-name-content
     [:h1.text-2xl.opacity-90.mb-6 "What's the alias name of this selected directory?"]
     [:p [:strong "Directory path:"]
      [:a dir]]
     [:p [:strong "Alias name:"]
      [:input.px-1.border.rounded
       {:autoFocus   true
        :value       val
        :placeholder "eg. Books"
        :on-change   (fn [^js e]
                       (set-val! (util/trim-safe (.. e -target -value))))
        :on-key-up   (fn [^js e]
                       (if (and (= 13 (.-which e))
                                (not (string/blank? val)))
                         (on-submit)))}]]

     [:div.pt-6.flex.justify-end
      (ui/button
       "Save"
       :disabled (string/blank? val)
       :on-click on-submit)]]))

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
        directories      (into [] (state/sub :assets/alias-dirs))
        pick-exist       assets-handler/get-alias-by-dir
        set-dir!         (fn [name dir exts]
                           (when (and name dir)
                             (state/set-assets-alias-dirs!
                              (let [exist (pick-exist dir)]
                                (if exist
                                  (assoc directories (first exist) {:name name :dir dir :exts (set exts)})
                                  (conj directories {:dir dir :name name :exts (set exts)}))))))

        rm-dir           (fn [dir]
                           (when-let [exist (pick-exist dir)]
                             (state/set-assets-alias-dirs!
                              (medley/remove-nth (first exist) directories))))

        del-ext          (fn [dir ext]
                           (when-let [exist (and ext (pick-exist dir))]
                             (let [exts (:exts (second exist))
                                   exts (difference exts (hash-set ext))
                                   name (:name (second exist))]
                               (set-dir! name dir exts))))

        add-ext          (fn [dir ext]
                           (when-let [exist (and ext (pick-exist dir))]
                             (let [exts (:exts (second exist))
                                   exts (conj exts (util/safe-lower-case ext))
                                   name (:name (second exist))]
                               (set-dir! name dir exts))))

        confirm-dir      (fn [dir set-dir!]
                           (state/set-modal!
                            #(confirm-dir-with-alias-name dir set-dir!)))]

    [:div.cp__assets-alias-directories
     [:ul
      (for [{:keys [name dir exts]} directories]
        [:li.item.px-2.py-2
         [:div.flex.justify-between.items-center
          [:span.font-semibold
           (str "@" name)]

          [:div.flex.items-center.space-x-2
           [:a.opacity-90.active:opacity-50.text-sm
            {:on-click #(when (util/electron?)
                          (js/apis.openPath dir))}
            (ui/icon "folder") dir]]]

         [:div.flex.justify-between.items-center
          [:div.flex.mt-2.space-x-2.pr-6
           (for [ext exts]
             [:small.ext-label {:key ext} ext])
           (if (= dir @*ext-editing-dir)
             [:input.ext-input
              {:autoFocus   true
               :on-key-down (fn [^js e]
                              (let [^js input (.-target e)]
                                (case (.-which e)
                                  13                        ;; enter
                                  (let [val (util/trim-safe (.-value input))]
                                    (and (not (string/blank? val))
                                         (add-ext dir val))
                                    (reset! *ext-editing-dir nil))

                                  27                        ;; esc
                                  (do (reset! *ext-editing-dir nil)
                                      (util/stop e))

                                  :dune)))
               :on-blur     #(reset! *ext-editing-dir nil)}]
             [:small.ext-label.is-plus
              {:on-click #(reset! *ext-editing-dir dir)}
              (ui/icon "plus") "Acceptable file extensions"])]

          [:span.ctrls.flex.space-x-3.text-xs.opacity-30.hover:opacity-100.whitespace-nowrap.hidden.mt-1
           [:a {:on-click #(rm-dir dir)} (ui/icon "trash-x")]]]

         ])]

     [:p.pt-2
      (ui/button
       "+ Add directory"
       :on-click #(p/let [path (ipc/ipc :openDialog)]
                    (when-not (or (string/blank? path)
                                  (pick-exist path))
                      (confirm-dir path set-dir!)))
       :small? true)]]))

(rum/defcs settings-content
  < rum/reactive
    (rum/local (state/sub :assets/alias-enabled?) ::alias-enabled?)
  [_state]

  (let [*pre-alias-enabled?    (::alias-enabled? _state)
        alias-enabled?         (state/sub :assets/alias-enabled?)
        alias-enabled-changed? (not= @*pre-alias-enabled? alias-enabled?)]

    [:div.cp__assets-settings.panel-wrap
     [:div.it
      [:label.block.text-sm.font-medium.leading-5.opacity-70
       "Alias directories"]
      [:div (ui/toggle
             alias-enabled?
             #(state/set-assets-alias-enabled! (not alias-enabled?))
             true)]
      [:span
       (restart-button alias-enabled-changed?)]]

     (when alias-enabled?
       [:div.pt-4
        [:h2.font-bold.opacity-80 "Selected directories:"]
        (alias-directories)])]))
