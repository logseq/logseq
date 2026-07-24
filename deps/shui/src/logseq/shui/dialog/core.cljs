(ns logseq.shui.dialog.core
  (:require [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.base.core :as base]
            [logseq.shui.form.core :as form]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.util :as util]
            [medley.core :as medley]
            [promesa.core :as p]))

;; provider
(def dialog (util/ui-wrap "Dialog"))
(def dialog-portal (util/ui-wrap "DialogPortal"))
(def alert-dialog (util/ui-wrap "AlertDialog"))
(def alert-dialog-portal (util/ui-wrap "AlertDialogPortal"))

;; ui
(def dialog-overlay (util/ui-wrap "DialogOverlay"))
(def dialog-close (util/ui-wrap "DialogClose"))
(def dialog-trigger (util/ui-wrap "DialogTrigger"))
(def dialog-content (util/ui-wrap "DialogContent"))
(def dialog-header (util/ui-wrap "DialogHeader"))
(def dialog-footer (util/ui-wrap "DialogFooter"))
(def dialog-title (util/ui-wrap "DialogTitle"))
(def dialog-description (util/ui-wrap "DialogDescription"))
(def alert-dialog-overlay (util/ui-wrap "AlertDialogOverlay"))
(def alert-dialog-trigger (util/ui-wrap "AlertDialogTrigger"))
(def alert-dialog-content (util/ui-wrap "AlertDialogContent"))
(def alert-dialog-header (util/ui-wrap "AlertDialogHeader"))
(def alert-dialog-title (util/ui-wrap "AlertDialogTitle"))
(def alert-dialog-description (util/ui-wrap "AlertDialogDescription"))
(def alert-dialog-footer (util/ui-wrap "AlertDialogFooter"))
(def alert-dialog-action (util/ui-wrap "AlertDialogAction"))
(def alert-dialog-cancel (util/ui-wrap "AlertDialogCancel"))

(defn interpret-vals
  [config ks & args]
  (reduce (fn [config k]
            (let [v (get config k)
                  v (if (fn? v) (apply v args) v)]
              (if (vector? v) (assoc config k (hsx/create-element v)) config)))
          config ks))

;; {:id :title :description :content :footer :open? :on-close ...}
(def ^:private *dialogs (atom []))
(def ^:private *id (atom 0))
(def ^:private gen-id #(reset! *id (inc @*id)))

(defn get-dialog
  [id]
  (when id
    (some->> (medley/indexed @*dialogs)
             (filter #(= id (:id (second %)))) (first))))

(defn- open-dialogs
  []
  (filter :open? @*dialogs))

(defn update-dialog!
  [id ks val & {:keys [closing?]}]
  (when-let [[index config] (get-dialog id)]
    (let [ks (if (coll? ks) ks [ks])
          config (if (nil? val)
                   (medley/dissoc-in config ks)
                   (assoc-in config ks val))]
      (swap! *dialogs assoc index config)
      (when (and (false? (:open? config))
                 (fn? (:on-close config))
                 (not closing?))
        ((:on-close config) id)))))

(defn upsert-dialog!
  [config]
  (when-let [_id (:id config)]
    (swap! *dialogs conj config)))

(defn detach-dialog!
  [id]
  (when-let [[index] (get-dialog id)]
    (swap! *dialogs #(->> % (medley/remove-nth index) (vec)))))

(defn has-dialog?
  []
  (boolean (some :open? @*dialogs)))

(defn- close-prevented?
  [handler-result ^js event-details ^js native-event]
  (when (or (false? handler-result)
            (some-> native-event (.-defaultPrevented))
            (some-> event-details (.-isCanceled)))
    (some-> event-details (.cancel))
    true))

(defn- call-close-handler!
  [handler ^js event-details]
  (let [native-event (some-> event-details (.-event))
        result (when (fn? handler) (handler native-event))]
    (close-prevented? result event-details native-event)))

;; apis
(declare close!)

(defn open!
  [content-or-config & config']
  (let [config (if (map? content-or-config)
                 content-or-config
                 {:content content-or-config})
        content (:content config)
        generated-id (gen-id)
        config (merge {:id generated-id :open? true} config (first config'))
        id (:id config)
        config (cond-> config
                 (nil? (:close config))
                 (assoc :close #(close! id)))
        config (cond-> config
                 (fn? content)
                 (assoc :content (content config)))]
    (upsert-dialog! (update config :content-props
                            (fn [content-props]
                              (merge {:onCloseAutoFocus #(.preventDefault %)}
                                     content-props))))))

(defn alert!
  [content-or-config & config']
  (let [deferred (p/deferred)]
    (open! content-or-config
           (merge {:alert? :default :deferred deferred} (first config')))
    (p/promise deferred)))

(defn confirm!
  [content-or-config & config']
  (alert! content-or-config (assoc (first config') :alert? :confirm)))

(defn get-last-dialog-id
  []
  (some-> (last (open-dialogs)) (:id)))

(defn get-first-dialog-id
  []
  (some-> (first (open-dialogs)) (:id)))

(defn- top-dialog?
  [id]
  (= id (get-last-dialog-id)))

(defn- prevent-dismiss!
  [^js event-details]
  (some-> event-details (.-event) (.preventDefault))
  (some-> event-details (.cancel))
  true)

(defn close!
  ([] (close! (get-last-dialog-id)))
  ([id] (update-dialog! id :open? false {:closing? true})))

(defn close-all! []
  (doseq [{:keys [id]} @*dialogs]
    (close! id)))

;; components
(hsx/defc dialog-inner
  [config]
  (let [{:keys [id title description content footer on-open-change align open?
                auto-width? close-btn? root-props content-props
                onEscapeKeyDown onPointerDownOutside]} config
        props (dissoc config
                      :id :title :description :content :footer :auto-width? :close-btn?
                      :close :align :on-open-change :open? :root-props :content-props
                      :onEscapeKeyDown :onPointerDownOutside)
        props (assoc-in props [:overlay-props :data-align] (name (or align :center)))]

    (hooks/use-effect!
     (fn []
       (when (false? open?)
         (detach-dialog! id)))
     [open?])

    (dialog
     (merge root-props
            {:key (str "dialog-" id)
             :open open?
             :on-open-change (fn [v e]
                               (let [set-open! #(update-dialog! id :open? %)
                                     reason (some-> e (.-reason))
                                     escape-handler (or (:onEscapeKeyDown content-props)
                                                        onEscapeKeyDown)
                                     pointer-handler (or (:onPointerDownOutside content-props)
                                                         onPointerDownOutside)
                                     prevented? (when (false? v)
                                                  (cond
                                                     (and (contains? #{"escape-key" "outside-press"} reason)
                                                         (not (top-dialog? id)))
                                                    (prevent-dismiss! e)

                                                    (= reason "escape-key")
                                                    (call-close-handler! escape-handler e)

                                                    (= reason "outside-press")
                                                    (call-close-handler! pointer-handler e)

                                                    :else false))]
                                 (when-not prevented?
                                   (if (fn? on-open-change)
                                     (on-open-change {:value v :set-open! set-open!})
                                     (set-open! v)))))})
     (let [onPointerDownOutside (:onPointerDownOutside content-props)
           onEscapeKeyDown (:onEscapeKeyDown content-props)
           handle-key-escape! (fn [^js e]
                                (if (top-dialog? id)
                                  (if (fn? onEscapeKeyDown)
                                    (onEscapeKeyDown e)
                                    (do
                                      (.preventDefault e)
                                      (close! id)))
                                  (.preventDefault e)))
           handle-pointer-down-outside! (fn [^js e]
                                          (if (top-dialog? id)
                                            (when (fn? onPointerDownOutside)
                                              (onPointerDownOutside e))
                                            (.preventDefault e)))
           content-props (-> content-props
                             (dissoc :onEscapeKeyDown :onPointerDownOutside)
                             (assoc :onEscapeKeyDown handle-key-escape!
                                    :onPointerDownOutside handle-pointer-down-outside!))]
       (dialog-content
        (cond-> (merge props content-props)
          auto-width? (assoc :data-auto-width true)
          (false? close-btn?) (assoc :data-close-btn false))

        ;; Title component is required for accessible dialog content.
        (dialog-title {:class (when (nil? title) "hidden")} title)
        (when description (dialog-description description))

        (when content
          [:div.ui__dialog-main-content content])

        (when footer
          (dialog-footer footer)))))))

(hsx/defc alert-inner
  [config]
  (let [{:keys [id title description content footer deferred open? ok-label
                root-props content-props]} config
        props (dissoc config
                      :id :title :description :content :footer :deferred :open? :alert? :ok-label
                      :close :on-close :root-props :content-props
                      :outside-cancel? :cancel-label :data-reminder :data-reminder-label)
        ok-label (or ok-label "OK")]

    (hooks/use-effect!
     (fn []
       (when (false? open?)
         (detach-dialog! id)))
     [open?])

    (alert-dialog
     (merge root-props
            {:key (str "alert-" id)
             :open open?
             :on-open-change (fn [v e]
                               (let [reason (some-> e (.-reason))]
                                 (if (and (false? v)
                                          (= reason "escape-key")
                                          (not (top-dialog? id)))
                                   (prevent-dismiss! e)
                                   (update-dialog! id :open? v))))})
     (alert-dialog-content (merge props content-props)
                           (when (or title description)
                             (alert-dialog-header
                              {:class "ui__alert-dialog-header"}
                              (when title (alert-dialog-title title))
                              (when description (alert-dialog-description description))))

                           (when content
                             [:div.ui__alert-dialog-main-content content])

                           (alert-dialog-footer
                            {:class "ui__alert-dialog-footer"}
                            (if footer
                              footer
                              [:<>
                               (base/button
                                {:key "ok"
                                 :on-click #(do (close!) (p/resolve! deferred true))
                                 :size :sm} ok-label)])))
     )))

(hsx/defc confirm-inner
  [config]
  (let [{:keys [id deferred outside-cancel? data-reminder data-reminder-label
                cancel-label ok-label]} config
        reminder? (boolean (and id data-reminder))
        [ready?, set-ready!] (hooks/use-state (not reminder?))
        *ok-ref (hooks/use-ref nil)
        *reminder-ref (hooks/use-ref nil)
        cancel-label (or cancel-label "Cancel")
        ok-label (or ok-label "OK")
        footer [:<>
                [:span.flex.items-center.pt-1
                 (when (and id data-reminder data-reminder-label)
                   [:label.flex.items-center.gap-1.text-sm
                    (form/checkbox {:ref *reminder-ref})
                    [:span.opacity-50 data-reminder-label]])]
                [:span.flex.gap-2
                 (base/button
                  {:key "cancel"
                   :on-click #(do (close!) (p/reject! deferred false))
                   :variant :outline
                   :size :sm} cancel-label)
                 (base/button
                  {:key "ok"
                   :ref *ok-ref
                   :on-click (fn []
                               (when-let [^js reminder (and id data-reminder (hooks/deref *reminder-ref))]
                                 (when (= "checked" (.-state (.-dataset reminder)))
                                   (js/localStorage.setItem (str id) (js/Date.now))))
                               (close!)
                               (p/resolve! deferred true))
                   :size :sm} ok-label)]]]

    (hooks/use-effect!
     (fn []
       (when ready?
         (let [timeout (js/setTimeout
                        #(some-> (hooks/deref *ok-ref) (.focus)) 128)]
           #(js/clearTimeout timeout))))
     [ready?])

    (hooks/use-effect!
     (fn []
       (try
         (if-let [reminder-v (and reminder? (js/localStorage.getItem (str id)))]
           (if (< (- (js/Date.now) reminder-v) (* 1000 60 10))
             (do (detach-dialog! id) (p/resolve! deferred true))
             (set-ready! true))
           (set-ready! true))
         (catch js/Error _e
           (set-ready! true))))
     [])

    (when ready?
      (alert-inner
       (assoc config
              :data-mode :confirm
              :overlay-props
              {:on-click #(when outside-cancel? (close!) (p/reject! deferred nil))}
              :footer footer)))))

(defn- render-dialog
  [config]
  (let [id (:id config)
        alert? (:alert? config)
        config (interpret-vals config
                               [:title :description :content :footer]
                               {:id id})]
    (case alert?
      :default
      (alert-inner config)

      :confirm
      (confirm-inner config)

      (dialog-inner config))))

(defn- render-dialogs
  [configs]
  (when-let [configs (seq (filter map? configs))]
    (into [:<>] (map render-dialog configs))))

(hsx/defc install-dialogs
  []
  (let [[dialogs _set-dialogs!] (util/use-atom *dialogs)]
    (render-dialogs dialogs)))
