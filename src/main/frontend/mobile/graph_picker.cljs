(ns frontend.mobile.graph-picker
  (:require
   [clojure.string :as string]
   [rum.core :as rum]
   [frontend.ui :as ui]
   [frontend.handler.notification :as notification]
   [frontend.handler.web.nfs :as web-nfs]
   [frontend.handler.page :as page-handler]
   [frontend.util :as util]
   [frontend.modules.shortcut.core :as shortcut]
   [frontend.state :as state]
   [frontend.mobile.util :as mobile-util]
   [frontend.fs :as fs]
   [frontend.components.svg :as svg]
   [promesa.core :as p]))

(defn validate-graph-dirname
  [root dirname]

  ;; TODO: how to handle existing graph name directory?
  ;; TODO: temporarily just load the existing folder
  (p/resolved (util/node-path.join root dirname)))

(rum/defc toggle-item
  [{:keys [on? disabled? title on-toggle]}]
  (ui/button
   [:span.flex.items-center.justify-between.w-full.py-1
    [:strong title]
    (ui/icon (if on? "toggle-right" "toggle-left"))]

   :class (str "toggle-item " (when on? "is-on"))
   :intent "logseq"
   :on-mouse-down #(util/stop %)
   :on-click #(when (fn? on-toggle)
                (on-toggle (not on?)))))

(rum/defc graph-picker-cp
  [{:keys [onboarding-and-home? logged? native-icloud?] :as opts}]
  (let [[step set-step!] (rum/use-state :init)
        [sync-mode set-sync-mode!] (rum/use-state
                                    (cond
                                      logged? :logseq-sync
                                      native-icloud? :icloud-sync))
        icloud-sync-on? (= sync-mode :icloud-sync)
        logseq-sync-on? (= sync-mode :logseq-sync)
        *input-ref      (rum/create-ref)
        native-ios?     (mobile-util/native-ios?)

        open-picker     #(page-handler/ls-dir-files! shortcut/refresh! opts)
        on-create       (fn [input-val]
                          (let [graph-name (util/safe-sanitize-file-name input-val)]
                            (if (string/blank? graph-name)
                              (notification/show! "Illegal graph folder name.")

                              ;; create graph directory under Logseq document folder
                              ;; TODO: icloud sync
                              (when-let [root (if icloud-sync-on? (state/get-icloud-container-root-url)
                                                                  (state/get-local-container-root-url))]
                                (-> (validate-graph-dirname root graph-name)
                                    (p/then (fn [graph-path]
                                              (-> (fs/mkdir! graph-path)
                                                  (p/then (fn []
                                                            (web-nfs/ls-dir-files-with-path! graph-path opts)
                                                            (notification/show! (str "Create graph: " graph-name) :success))))))
                                    (p/catch (fn [^js e]
                                               (notification/show! (str e) :error)
                                               (js/console.error e)))
                                    (p/finally
                                     #()))))))]

    (rum/use-effect!
     (fn []
       (when-let [^js input (and onboarding-and-home?
                                 (rum/deref *input-ref))]
         (let [handle (fn [] (js/setTimeout
                              #(.scrollIntoView
                                input #js {:behavior "smooth", :block "center", :inline "nearest"}) 100))]
           (.addEventListener input "focus" handle)
           (handle))))
     [step])

    [:div.cp__graph-picker.w-full
     {:class (when onboarding-and-home? (util/hiccup->class "px-10.py-10"))}

     (when-not onboarding-and-home?
       [:h1.flex.items-center
        [:span.scale-75 (svg/logo false)]
        [:span.pl-1 "Set up a graph"]])

     (case step
       ;; step 0
       :init
       [:div.flex.flex-col.w-full.space-y-3
        (ui/button
         [:span.flex.items-center.justify-between.w-full.py-1
          [:strong "Create a new graph"]
          (ui/icon "chevron-right")]

         :on-click #(if (and native-ios?
                             (some (fn [s] (not (string/blank? s)))
                                   (vals (:mobile/container-urls @state/state))))
                      (set-step! :new-graph)
                      (open-picker)))

        (ui/button
         [:span.flex.items-center.justify-between.w-full.py-1
          [:strong "Select an existing graph"]
          (ui/icon "folder-plus")]

         :intent "logseq"
         :on-click open-picker)]

       ;; step 1
       :new-graph
       [:div.flex.flex-col.w-full.space-y-4.faster-fade-in
        [:input.form-input.block
         {:auto-focus  true
          :ref         *input-ref
          :placeholder "What's the graph name?"}]

        (when logged?
          (toggle-item {:title "Logseq sync"
                        :on?   logseq-sync-on?}))

        (when (and native-icloud? (not logseq-sync-on?))
          (toggle-item {:title     "iCloud sync"
                        :on?       icloud-sync-on?
                        :on-toggle #(set-sync-mode! (if % :icloud-sync nil))}))

        [:div.flex.justify-between.items-center.pt-2
         (ui/button [:span.flex.items-center
                     (ui/icon "chevron-left" {:size 18}) "Back"]
                    :intent "logseq"
                    :on-click #(set-step! :init))

         (ui/button "Create"
                    :on-click
                    #(let [val (util/trim-safe (.-value (rum/deref *input-ref)))]
                       (if (string/blank? val)
                         (.focus (rum/deref *input-ref))
                         (on-create val))))]])]))
