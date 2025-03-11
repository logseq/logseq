(ns logseq.shui.toaster.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))

(defonce ^:private Toaster (util/lsui-wrap "Toaster"))
(defonce ^:private *toast (atom nil))

(defn gen-id []
  (js/window.LSUI.genToastId))

(defn use-toast []
  (when-let [^js js-toast (js/window.LSUI.useToast)]
    (let [toast-fn! (.-toast js-toast)
          dismiss! (.-dismiss js-toast)]
      [(fn [s]
         (let [^js s (bean/->js s)]
           (toast-fn! s)))
       dismiss!])))

(rum/defc install-toaster
  < rum/static
  []
  (let [^js js-toast (js/window.LSUI.useToast)]
    (rum/use-effect!
      (fn []
        (reset! *toast {:toast   (.-toast js-toast)
                        :dismiss (.-dismiss js-toast)
                        :update  (.-update js-toast)})
        #())
      [])
    [:<> (Toaster)]))

(defn update-html-props
  [v]
  (update-keys v
    #(case %
       :class :className
       :for :htmlFor
       %)))

(defn interpret-vals
  [config ks & args]
  (reduce (fn [config k]
            (let [v (get config k)
                  v (if (fn? v) (apply v args) v)]
              (if (vector? v) (assoc config k (interpret v)) config)))
    config ks))

(defn toast!
  ([content-or-config] (toast! content-or-config :default nil))
  ([content-or-config status] (toast! content-or-config status nil))
  ([content-or-config status opts]
   (if-let [{:keys [toast dismiss]} @*toast]
     (let [config (if (map? content-or-config)
                    content-or-config
                    (-> {:description content-or-config}
                      (merge (if (map? status) status {:variant status}))))
           config (update-html-props (merge config opts))
           id (or (:id config) (gen-id))
           config (assoc config :id id)
           config (interpret-vals config [:title :description :action :icon]
                    {:id id :dismiss! #(dismiss id) :update! #(toast! (assoc %1 :id id))})]
       (js->clj (toast (clj->js config))))
     :exception)))

(defn dismiss!
  ([] (dismiss! nil))
  ([id]
   (when-let [{:keys [dismiss]} @*toast]
     (dismiss id))))
