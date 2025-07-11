(ns frontend.handler.events.ui
  "UI events"
  (:require [clojure.core.async :as async]
            [clojure.core.async.interop :refer [p->c]]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.components.file-sync :as file-sync]
            [frontend.components.page :as component-page]
            [frontend.components.plugins :as plugin]
            [frontend.components.property.dialog :as property-dialog]
            [frontend.components.quick-add :as quick-add]
            [frontend.components.repo :as repo]
            [frontend.components.select :as select]
            [frontend.components.selection :as selection]
            [frontend.components.settings :as settings]
            [frontend.components.shell :as shell]
            [frontend.components.user.login :as login]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.extensions.srs :as srs]
            [frontend.fs.sync :as sync]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.events :as events]
            [frontend.handler.file-based.native-fs :as nfs-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.sentry :as sentry-event]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.common.util :as common-util]
            [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

(defmethod events/handle :go/search [_]
  (shui/dialog-open!
   cmdk/cmdk-modal
   {:id :ls-dialog-cmdk
    :align :top
    :content-props {:class "ls-dialog-cmdk"}
    :close-btn? false
    :onEscapeKeyDown (fn [e] (.preventDefault e))}))

(defmethod events/handle :command/run [_]
  (when (util/electron?)
    (shui/dialog-open! shell/shell)))

(defmethod events/handle :notification/show [[_ {:keys [content status clear?]}]]
  (notification/show! content status clear?))

(defmethod events/handle :command/run [_]
  (when (util/electron?)
    (shui/dialog-open! shell/shell)))

(defmethod events/handle :go/plugins [_]
  (plugin/open-plugins-modal!))

(defmethod events/handle :go/plugins-waiting-lists [_]
  (plugin/open-waiting-updates-modal!))

(defmethod events/handle :go/plugins-from-file [[_ plugins]]
  (plugin/open-plugins-from-file-modal! plugins))

(defmethod events/handle :go/install-plugin-from-github [[_]]
  (shui/dialog-open!
   (plugin/install-from-github-release-container)))

(defmethod events/handle :go/plugins-settings [[_ pid nav? title]]
  (when pid
    (state/set-state! :plugin/focused-settings pid)
    (state/set-state! :plugin/navs-settings? (not (false? nav?)))
    (plugin/open-focused-settings-modal! title)))

(defmethod events/handle :go/proxy-settings [[_ agent-opts]]
  (shui/dialog-open!
   (plugin/user-proxy-settings-container agent-opts)
   {:id :https-proxy-panel :center? true :class "lg:max-w-2xl"}))

(defmethod events/handle :redirect-to-home [_]
  (page-handler/create-today-journal!)
  (when (util/capacitor-new?)
    (mobile-state/redirect-to-tab! "home")))

(defmethod events/handle :page/show-delete-dialog [[_ selected-rows ok-handler]]
  (shui/dialog-open!
   (component-page/batch-delete-dialog selected-rows ok-handler)))

(defmethod events/handle :modal/show-cards [[_ cards-id]]
  (let [db-based? (config/db-based-graph? (state/get-current-repo))]
    (shui/dialog-open!
     (if db-based? (fn [] (fsrs/cards-view cards-id)) srs/global-cards)
     {:id :srs
      :label "flashcards__cp"})))

(defmethod events/handle :modal/show-themes-modal [[_ classic?]]
  (if classic?
    (plugin/open-select-theme!)
    (route-handler/go-to-search! :themes)))

(defmethod events/handle :ui/toggle-appearance [_]
  (let [popup-id "appearance_settings"]
    (if (gdom/getElement popup-id)
      (shui/popup-hide! popup-id)
      (shui/popup-show!
       (js/document.querySelector ".toolbar-dots-btn")
       (fn []
         (settings/appearance))
       {:id popup-id
        :align :end}))))

(defmethod events/handle :plugin/consume-updates [[_ id prev-pending? updated?]]
  (let [downloading?   (:plugin/updates-downloading? @state/state)
        auto-checking? (plugin-handler/get-auto-checking?)]
    (when-let [coming (and (not downloading?)
                           (get-in @state/state [:plugin/updates-coming id]))]
      (let [error-code (:error-code coming)
            error-code (if (= error-code (str :no-new-version)) nil error-code)
            title      (:title coming)]
        (when (and prev-pending? (not auto-checking?))
          (if-not error-code
            (plugin/set-updates-sub-content! (str title "...") 0)
            (notification/show!
             (str "[Checked]<" title "> " error-code) :error)))))

    (if (and updated? downloading?)
      ;; try to start consume downloading item
      (if-let [next-coming (state/get-next-selected-coming-update)]
        (plugin-handler/check-or-update-marketplace-plugin!
         (assoc next-coming :only-check false :error-code nil)
         (fn [^js e] (js/console.error "[Download Err]" next-coming e)))
        (plugin-handler/close-updates-downloading))

      ;; try to start consume pending item
      (if-let [next-pending (second (first (:plugin/updates-pending @state/state)))]
        (do
          (println "Updates: take next pending - " (:id next-pending))
          (js/setTimeout
           #(plugin-handler/check-or-update-marketplace-plugin!
             (assoc next-pending :only-check true :auto-check auto-checking? :error-code nil)
             (fn [^js e]
               (notification/show! (.toString e) :error)
               (js/console.error "[Check Err]" next-pending e))) 500))

        ;; try to open waiting updates list
        (do (when (and prev-pending? (not auto-checking?)
                       (seq (state/all-available-coming-updates)))
              (plugin/open-waiting-updates-modal!))
            (plugin-handler/set-auto-checking! false))))))

(defmethod events/handle :plugin/loader-perf-tip [[_ {:keys [^js o _s _e]}]]
  (when-let [opts (.-options o)]
    (notification/show!
     (plugin/perf-tip-content (.-id o) (.-name opts) (.-url opts))
     :warning false (.-id o))))

(defn- refresh-cb []
  (page-handler/create-today-journal!)
  (events/file-sync-restart!))

(defmethod events/handle :graph/ask-for-re-fresh [_]
  (shui/dialog-open!
   [:div {:style {:max-width 700}}
    [:p (t :sync-from-local-changes-detected)]
    [:div.flex.justify-end
     (ui/button
      (t :yes)
      :autoFocus "on"
      :class "ui__modal-enter"
      :on-click (fn []
                  (shui/dialog-close!)
                  (nfs-handler/refresh! (state/get-current-repo) refresh-cb)))]]))

(defn- editor-new-property [block target {:keys [selected-blocks] :as opts}]
  (let [editing-block (state/get-edit-block)
        pos (state/get-edit-pos)
        edit-block-or-selected (cond
                                 editing-block
                                 [editing-block]
                                 (seq selected-blocks)
                                 selected-blocks
                                 :else
                                 (seq (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids))))
        current-block (when-let [s (state/get-current-page)]
                        (when (util/uuid-string? s)
                          (db/entity [:block/uuid (uuid s)])))
        blocks (or (when block [block])
                   edit-block-or-selected
                   (when current-block [current-block]))
        opts' (cond-> opts
                editing-block
                (assoc :original-block editing-block
                       :edit-original-block
                       (fn [{:keys [editing-default-property?]}]
                         (when editing-block
                           (let [content (:block/title (db/entity (:db/id editing-block)))
                                 esc? (= "Escape" (state/get-ui-last-key-code))
                                 [content' pos] (cond
                                                  esc?
                                                  [nil pos]
                                                  (and (>= (count content) pos)
                                                       (>= pos 2)
                                                       (= (util/nth-safe content (dec pos))
                                                          (util/nth-safe content (- pos 2))
                                                          ";"))
                                                  [(str (common-util/safe-subs content 0 (- pos 2))
                                                        (common-util/safe-subs content pos))
                                                   (- pos 2)]
                                                  :else
                                                  [nil pos])]
                             (when content'
                               (if editing-default-property?
                                 (editor-handler/save-block! (state/get-current-repo) (:block/uuid editing-block) content')
                                 (editor-handler/edit-block! editing-block (or pos :max)
                                                             (cond-> {}
                                                               content'
                                                               (assoc :custom-content content'))))))))))]
    (when (seq blocks)
      (let [target' (or target
                        (some-> (state/get-edit-input-id)
                                (gdom/getElement))
                        (first (state/get-selection-blocks)))]
        (if target'
          (shui/popup-show! target'
                            #(property-dialog/dialog blocks opts')
                            {:align "start"
                             :auto-focus? true})
          (shui/dialog-open! #(property-dialog/dialog blocks opts')
                             {:id :property-dialog
                              :align "start"}))))))

(defmethod events/handle :editor/new-property [[_ {:keys [block target] :as opts}]]
  (when-not config/publishing?
    (p/do!
     (editor-handler/save-current-block!)
     (editor-new-property block target opts))))

(defmethod events/handle :graph/new-db-graph [[_ _opts]]
  (shui/dialog-open!
   repo/new-db-graph
   {:id :new-db-graph
    :title [:h2 "Create a new graph"]
    :align (if (util/mobile?) :top :center)
    :style {:max-width "500px"}}))

(defmethod events/handle :dialog-select/graph-open []
  (select/dialog-select! :graph-open))

(defmethod events/handle :dialog-select/graph-remove []
  (select/dialog-select! :graph-remove))

(defmethod events/handle :dialog-select/db-graph-replace []
  (select/dialog-select! :db-graph-replace))

(defn- hide-action-bar!
  []
  (when (editor-handler/popup-exists? :selection-action-bar)
    (shui/popup-hide! :selection-action-bar)))

(defmethod events/handle :editor/show-action-bar []
  (let [selection (state/get-selection-blocks)
        first-visible-block (some #(when (util/el-visible-in-viewport? % true) %) selection)]
    (when first-visible-block
      (hide-action-bar!)
      (shui/popup-show!
       first-visible-block
       (fn []
         (selection/action-bar))
       {:id :selection-action-bar
        :root-props {:modal false}
        :content-props {:side "top"
                        :class "!py-0 !px-0 !border-none"
                        :modal? false}
        :auto-side? false
        :align :start}))))

(defmethod events/handle :editor/hide-action-bar []
  (hide-action-bar!)
  (state/set-state! :mobile/show-action-bar? false))

(defmethod events/handle :user/logout [[_]]
  (file-sync-handler/reset-session-graphs)
  (sync/remove-all-pwd!)
  (file-sync-handler/reset-user-state!)
  (login/sign-out!))

(defmethod events/handle :user/login [[_ host-ui?]]
  (if (or host-ui? (not util/electron?))
    (js/window.open config/LOGIN-URL)
    (if (mobile-util/native-platform?)
      (route-handler/redirect! {:to :user-login})
      (login/open-login-modal!))))

(defmethod events/handle :whiteboard/onboarding [[_ opts]]
  (shui/dialog-open!
   (fn [{:keys [close]}] (whiteboard/onboarding-welcome close))
   (merge {:close-btn?      false
           :center?         true
           :close-backdrop? false} opts)))

(defn- enable-beta-features!
  []
  (when-not (false? (state/enable-sync?)) ; user turns it off
    (file-sync-handler/set-sync-enabled! true)))

;; TODO: separate rtc and file-based implementation
(defmethod events/handle :user/fetch-info-and-graphs [[_]]
  (state/set-state! [:ui/loading? :login] false)
  (async/go
    (let [result (async/<! (sync/<user-info sync/remoteapi))]
      (cond
        (instance? ExceptionInfo result)
        nil
        (map? result)
        (do
          (state/set-user-info! result)
          (when-let [uid (user-handler/user-uuid)]
            (sentry-event/set-user! uid))
          (let [status (if (user-handler/alpha-or-beta-user?) :welcome :unavailable)]
            (when (and (= status :welcome) (user-handler/logged-in?))
              (enable-beta-features!)
              (async/<! (p->c (rtc-handler/<get-remote-graphs)))
              (async/<! (file-sync-handler/load-session-graphs))
              (p/let [repos (repo-handler/refresh-repos!)]
                (when-let [repo (state/get-current-repo)]
                  (when (some #(and (= (:url %) repo)
                                    (vector? (:sync-meta %))
                                    (util/uuid-string? (first (:sync-meta %)))
                                    (util/uuid-string? (second (:sync-meta %)))) repos)
                    (sync/<sync-start)))))
            (file-sync/maybe-onboarding-show status)))))))

(defmethod events/handle :file-sync/onboarding-tip [[_ type opts]]
  (let [type (keyword type)]
    (when-not (config/db-based-graph? (state/get-current-repo))
      (shui/dialog-open!
       (file-sync/make-onboarding-panel type)
       (merge {:close-btn? false
               :center? true
               :close-backdrop? (not= type :welcome)} opts)))))

(defmethod events/handle :dialog/show-block [[_ block option]]
  (shui/dialog-open!
   [:div.p-8.w-full.h-full
    (component-page/page-container block option)]
   {:id :ls-dialog-block
    :align :top
    :content-props {:class "ls-dialog-block"}
    :onEscapeKeyDown (fn [e] (.preventDefault e))}))

(defmethod events/handle :dialog/quick-add [_]
  (shui/dialog-open!
   [:div.w-full.h-full
    (quick-add/quick-add)]
   {:id :ls-dialog-quick-add
    :align :top
    :content-props {:class "ls-dialog-quick-add"}
    :onEscapeKeyDown (fn [e] (.preventDefault e))}))
