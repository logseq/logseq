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
   [promesa.core :as p]))

(defn validate-graph-dirname
  [root dirname]

  ;; TODO: call plugin api
  (p/resolved (util/node-path.join root dirname)))

(rum/defc graph-picker-cp
  []
  (let [[step set-step!] (rum/use-state :init)
        *input-ref  (rum/create-ref)
        native-ios? (mobile-util/native-ios?)

        open-picker #(page-handler/ls-dir-files!
                      (fn []
                        (shortcut/refresh!)))
        on-create   (fn [input-val]
                      (let [graph-name (util/safe-sanitize-file-name input-val)]
                        (if (string/blank? graph-name)
                          (notification/show! "Illegal graph folder name.")

                          ;; create graph directory under Logseq document folder
                          ;; TODO: icloud sync
                          (when-let [root (state/get-local-container-root-url)]
                            (-> (validate-graph-dirname root graph-name)
                                (p/then (fn [graph-path]
                                          (-> (fs/mkdir! graph-path)
                                              (p/then (fn []
                                                        (web-nfs/ls-dir-files-with-path! graph-path)
                                                        (notification/show! (str "Create graph: " graph-name) :success))))))
                                (p/catch (fn [^js e]
                                           (notification/show! (str e) :error)
                                           (js/console.error e)))
                                (p/finally
                                 #()))))))]

    [:div.cp__graph-picker.px-10.py-10.w-full

     (case step
       ;; step 0
       :init
       [:div.flex.flex-col.w-full.space-y-4
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

        (ui/button
         [:span.flex.items-center.justify-between.w-full.py-1
          [:strong "Logseq sync"]
          (ui/icon "toggle-right")]

         :intent "logseq"
         :on-click #())

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
