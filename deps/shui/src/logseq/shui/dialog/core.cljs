(ns logseq.shui.dialog.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [medley.core :as medley]
            [logseq.shui.util :as util]
            [promesa.core :as p]
            [clojure.string :as string]))

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

;; {:id :title :description :content :footer :open? ...}
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
      (swap! *modals assoc index config))))

(defn upsert-modal!
  [config]
  (when-let [_id (:id config)]
    (swap! *modals conj config)))

(defn detach-modal!
  [id]
  (when-let [[index] (get-modal id)]
    (swap! *modals #(->> % (medley/remove-nth index) (vec)))))

(rum/defc modal-inner
  [config]
  (let [{:keys [id title description content footer on-open-change open?]} config
        props (dissoc config :id :title :description :content :footer :on-open-change :open?)]

    (rum/use-effect!
      (fn []
        (when (false? open?)
          (js/setTimeout #(detach-modal! id) 128)))
      [open?])

    (dialog
      {:key            (str "modal-" id)
       :open           open?
       :on-open-change (fn [v]
                         (let [set-open! #(update-modal! id :open? %)]
                           (if (fn? on-open-change)
                             (on-open-change {:value v :set-open! set-open!})
                             (set-open! v))))}
      (dialog-content props
        (dialog-header
          (when title (dialog-title title))
          (when description (dialog-description description)))
        (when content
          [:div.ui__dialog-main-content content])
        (when footer
          (dialog-footer footer))))))

(rum/defc alert-inner
  [config]
  (let [{:keys [id title description content footer deferred open?]} config
        props (dissoc config :id :title :description :content :footer :deferred :open? :alert?)]

    (rum/use-effect!
      (fn []
        (when (false? open?)
          (js/setTimeout #(detach-modal! id) 128)))
      [open?])

    (alert-dialog
      {:key            (str "alert-" id)
       :open           open?
       :on-open-change #(update-modal! id :open? %)}
      (alert-dialog-content props
        (alert-dialog-header
          (when title (alert-dialog-title title))
          (when description (alert-dialog-description description)))
        (when content
          [:div.ui__alert-dialog-main-content content])
        (alert-dialog-footer
          (if footer
            footer
            [:<> (alert-dialog-action {:key "ok" :on-click #(p/resolve! deferred true)} "OK")]))))))

(rum/defc confirm-inner
  [config]
  (let [{:keys [deferred]} config]
    (alert-inner
      (assoc config :footer
             [:<>
              (alert-dialog-cancel {:key "cancel" :on-click #(p/reject! deferred false)} "Cancel")
              (alert-dialog-action {:key "ok" :on-click #(p/resolve! deferred true)} "OK")]))))

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

;; apis
(defn open!
  [content-or-config & config']
  (let [config (if (map? content-or-config)
                 content-or-config
                 {:content content-or-config})
        config (merge config (first config'))]
    (upsert-modal!
      (merge {:id (gen-id) :open? true} config))))

(defn alert!
  [content-or-config & config']
  (let [deferred (p/deferred)]
    (open! content-or-config
      (merge {:alert? :default :deferred deferred} (first config')))
    (p/promise deferred)))

(defn confirm!
  [content-or-config & config']
  (alert! content-or-config (assoc (first config') :alert? :confirm)))

(defn close! [id]
  (update-modal! id :open? false))

(defn close-all! []
  (doseq [{:keys [id]} @*modals]
    (close! id)))