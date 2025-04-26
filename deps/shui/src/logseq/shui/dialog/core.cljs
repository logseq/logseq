(ns logseq.shui.dialog.core
  (:require [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.base.core :as base]
            [logseq.shui.form.core :as form]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.util :as util]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

;; provider
(def dialog (util/lsui-wrap "Dialog"))
(def dialog-portal (util/lsui-wrap "DialogPortal"))
(def alert-dialog (util/lsui-wrap "AlertDialog"))
(def alert-dialog-portal (util/lsui-wrap "AlertDialogPortal"))

;; ui
(def dialog-overlay (util/lsui-wrap "DialogOverlay"))
(def dialog-close (util/lsui-wrap "DialogClose"))
(def dialog-trigger (util/lsui-wrap "DialogTrigger"))
(def dialog-content (util/lsui-wrap "DialogContent"))
(def dialog-header (util/lsui-wrap "DialogHeader"))
(def dialog-footer (util/lsui-wrap "DialogFooter"))
(def dialog-title (util/lsui-wrap "DialogTitle"))
(def dialog-description (util/lsui-wrap "DialogDescription"))
(def alert-dialog-overlay (util/lsui-wrap "AlertDialogOverlay"))
(def alert-dialog-trigger (util/lsui-wrap "AlertDialogTrigger"))
(def alert-dialog-content (util/lsui-wrap "AlertDialogContent"))
(def alert-dialog-header (util/lsui-wrap "AlertDialogHeader"))
(def alert-dialog-title (util/lsui-wrap "AlertDialogTitle"))
(def alert-dialog-description (util/lsui-wrap "AlertDialogDescription"))
(def alert-dialog-footer (util/lsui-wrap "AlertDialogFooter"))
(def alert-dialog-action (util/lsui-wrap "AlertDialogAction"))
(def alert-dialog-cancel (util/lsui-wrap "AlertDialogCancel"))

(defn interpret-vals
  [config ks & args]
  (reduce (fn [config k]
            (let [v (get config k)
                  v (if (fn? v) (apply v args) v)]
              (if (vector? v) (assoc config k (interpret v)) config)))
          config ks))

;; {:id :title :description :content :footer :open? :on-close ...}
(def ^:private *modals (atom []))
(def ^:private *id (atom 0))
(def ^:private gen-id #(reset! *id (inc @*id)))

(defn get-modal
  [id]
  (when id
    (some->> (medley/indexed @*modals)
             (filter #(= id (:id (second %)))) (first))))

(defn update-modal!
  [id ks val]
  (when-let [[index config] (get-modal id)]
    (let [ks (if (coll? ks) ks [ks])
          config (if (nil? val)
                   (medley/dissoc-in config ks)
                   (assoc-in config ks val))]
      (swap! *modals assoc index config)
      (when (and (false? (:open? config)) (fn? (:on-close config)))
        ((:on-close config) id)))))

(defn upsert-modal!
  [config]
  (when-let [_id (:id config)]
    (swap! *modals conj config)))

(defn detach-modal!
  [id]
  (when-let [[index] (get-modal id)]
    (swap! *modals #(->> % (medley/remove-nth index) (vec)))))

(defn has-modal?
  []
  (some-> @*modals (last) :open?))

;; apis
(declare close!)

(defn open!
  [content-or-config & config']
  (let [config (if (map? content-or-config)
                 content-or-config
                 {:content content-or-config})
        content (:content config)
        id (gen-id)
        config (merge {:id id :open? true :close #(close! id)} config (first config'))
        config (cond-> config
                 (fn? content)
                 (assoc :content (content config)))]
    (upsert-modal! (assoc-in config [:content-props :onOpenAutoFocus]
                             #(.preventDefault %)))))

(defn alert!
  [content-or-config & config']
  (let [deferred (p/deferred)]
    (open! content-or-config
           (merge {:alert? :default :deferred deferred} (first config')))
    (p/promise deferred)))

(defn confirm!
  [content-or-config & config']
  (alert! content-or-config (assoc (first config') :alert? :confirm)))

(defn get-last-modal-id
  []
  (some-> (last @*modals) (:id)))

(defn get-first-modal-id
  []
  (some-> (first @*modals) (:id)))

(defn close!
  ([] (close! (get-last-modal-id)))
  ([id] (update-modal! id :open? false)))

(defn close-all! []
  (doseq [{:keys [id]} @*modals]
    (close! id)))

;; components
(rum/defc modal-inner
  [config]
  (let [{:keys [id title description content footer on-open-change align open?
                auto-width? close-btn? root-props content-props]} config
        props (dissoc config
                      :id :title :description :content :footer :auto-width? :close-btn?
                      :close :align :on-open-change :open? :root-props :content-props)
        props (assoc-in props [:overlay-props :data-align] (name (or align :center)))]

    (hooks/use-effect!
     (fn []
       (when (false? open?)
         (detach-modal! id)))
     [open?])

    (dialog
     (merge root-props
            {:key (str "modal-" id)
             :open open?
             :on-open-change (fn [v]
                               (let [set-open! #(update-modal! id :open? %)]
                                 (if (fn? on-open-change)
                                   (on-open-change {:value v :set-open! set-open!})
                                   (set-open! v))))})
     (let [onPointerDownOutside (:onPointerDownOutside content-props)
           content-props (assoc content-props
                                :onPointerDownOutside
                                (fn [^js e]
                                  (when (fn? onPointerDownOutside)
                                    (onPointerDownOutside e))
                                  (when-not (some-> (.-target e) (.closest ".ui__dialog-overlay"))
                                    (.preventDefault e))))]
       (dialog-content
        (cond-> (merge props content-props)
          auto-width? (assoc :data-auto-width true)
          (false? close-btn?) (assoc :data-close-btn false))

        ;; nested title component is required for radix dialog content
        (dialog-title {:class (when (nil? title) "hidden")} title)
        (when description (dialog-description description))

        (when content
          [:div.ui__dialog-main-content content])

        (when footer
          (dialog-footer footer)))))))

(rum/defc alert-inner
  [config]
  (let [{:keys [id title description content footer deferred open?]} config
        props (dissoc config :id :title :description :content :footer :deferred :open? :alert?)]

    (hooks/use-effect!
     (fn []
       (when (false? open?)
         (let [timeout (js/setTimeout #(detach-modal! id) 128)]
           #(js/clearTimeout timeout))))
     [open?])

    (alert-dialog
     {:key (str "alert-" id)
      :open open?
      :on-open-change #(update-modal! id :open? %)}
     (alert-dialog-content props
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
                                 :size :sm} "OK")]))))))

(rum/defc confirm-inner
  [config]
  (let [{:keys [id deferred outside-cancel? data-reminder]} config
        reminder? (boolean (and id data-reminder))
        [ready?, set-ready!] (rum/use-state (not reminder?))
        *ok-ref (rum/use-ref nil)
        *reminder-ref (rum/use-ref nil)]

    (hooks/use-effect!
     (fn []
       (when ready?
         (let [timeout (js/setTimeout
                        #(some-> (rum/deref *ok-ref) (.focus)) 128)]
           #(js/clearTimeout timeout))))
     [ready?])

    (hooks/use-effect!
     (fn []
       (try
         (if-let [reminder-v (and reminder? (js/localStorage.getItem (str id)))]
           (if (< (- (js/Date.now) reminder-v) (* 1000 60 10))
             (do (detach-modal! id) (p/resolve! deferred true))
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

              :footer
              [:<>
               [:span.flex.items-center.pt-1
                (when (and id data-reminder)
                  [:label.flex.items-center.gap-1.text-sm
                   (form/checkbox {:ref *reminder-ref})
                   [:span.opacity-50 "Don't remind me again"]])]
               [:span.flex.gap-2
                (base/button
                 {:key "cancel"
                  :on-click #(do (close!) (p/reject! deferred false))
                  :variant :outline
                  :size :sm}
                 "Cancel")
                (base/button
                 {:key "ok"
                  :ref *ok-ref
                  :on-click (fn []
                              (when-let [^js reminder (and id data-reminder (rum/deref *reminder-ref))]
                                (when (= "checked" (.-state (.-dataset reminder)))
                                  (js/localStorage.setItem (str id) (js/Date.now))))
                              (close!)
                              (p/resolve! deferred true))
                  :size :sm} "OK")]])))))

(rum/defc install-modals
  < rum/static
  []
  (let [[modals _set-modals!] (util/use-atom *modals)]
    (for [config modals
          :when (map? config)]
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
          ;; modal
          (modal-inner config))))))
