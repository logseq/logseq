(ns logseq.shui.dialog.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [medley.core :as medley]
            [logseq.shui.util :as util]
            [clojure.string :as string]))

;; provider
(def dialog (util/lsui-wrap "Dialog"))
(def dialog-portal (util/lsui-wrap "DialogPortal"))

;; ui
(def dialog-overlay (util/lsui-wrap "DialogOverlay"))
(def dialog-close (util/lsui-wrap "DialogClose"))
(def dialog-trigger (util/lsui-wrap "DialogTrigger"))
(def dialog-content (util/lsui-wrap "DialogContent"))
(def dialog-header (util/lsui-wrap "DialogHeader"))
(def dialog-footer (util/lsui-wrap "DialogFooter"))
(def dialog-title (util/lsui-wrap "DialogTitle"))
(def dialog-description (util/lsui-wrap "DialogDescription"))

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
  (let [{:keys [id title description content footer open? _auto-detach?]} config]
    (rum/use-effect!
      (fn []
        (when (false? open?)
          (js/setTimeout #(detach-modal! id) 128)))
      [open?])

    (dialog
      {:key            (str "modal-" id)
       :open           open?
       :on-open-change #(update-modal! id :open? %)}
      (dialog-content
        (dialog-header
          (when title (dialog-title title))
          (when description (dialog-description description)))
        (when content
          [:div.ui__dialog-main-content content])
        (when footer
          (dialog-footer footer))))))

(rum/defc install-modals
  < rum/static
  []
  (let [[modals _set-modals!] (util/use-atom *modals)]
    (for [config modals
          :when (map? config)]
      (let [id (:id config)
            config (interpret-vals config
                     [:title :description :content :footer]
                     {:id id})]
        (modal-inner config)))))

;; apis
(defn open! [config]
  (upsert-modal!
    (merge {:id (gen-id) :open? true} config)))

(defn confirm! []
  ;; FIXME
  )

(defn alert! []
  ;; FIXME
  )

(defn close! [id]
  ;; FIXME
  )

(defn close-all! []
  ;; FIXME
  )