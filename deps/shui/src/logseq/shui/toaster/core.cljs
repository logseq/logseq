(ns logseq.shui.toaster.core
  (:require [cljs-bean.core :as bean]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.util :as util]))

(defonce ^:private Toaster (util/ui-wrap "Toaster"))
(defonce ^:private *toast (atom nil))
(defonce ^:private *pending-toasts (atom []))

(defn gen-id []
  ((util/ui-get "genToastId")))

(defn use-toast []
  (when-let [use-toast' (util/ui-get "useToast")]
    (let [^js js-toast (use-toast')
          toast-fn! (.-toast js-toast)
          dismiss! (.-dismiss js-toast)]
      [(fn [s]
         (let [^js s (bean/->js s)]
           (toast-fn! s)))
       dismiss!])))

(defn update-html-props
  [v]
  (update-keys v
               #(case %
                  :class :className
                  :for :htmlFor
                  :on-dismiss :onDismiss
                  :on-open-change :onOpenChange
                  %)))

(defn interpret-vals
  [config ks & args]
  (reduce (fn [config k]
            (let [v (get config k)
                  v (if (fn? v) (apply v args) v)]
              (if (vector? v) (assoc config k (hsx/create-element v)) config)))
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
     (let [config (if (map? content-or-config)
                    content-or-config
                    (-> {:description content-or-config}
                        (merge (if (map? status) status {:variant status}))))
           config (update-html-props (merge config opts))
           id (or (:id config) (gen-id))
           config (assoc config :id id)]
       (swap! *pending-toasts conj config)
       {"id" id}))))

(defn dismiss!
  ([] (dismiss! nil))
  ([id]
   (if id
     (swap! *pending-toasts
            (fn [pending-toasts]
              (vec (remove #(= id (:id %)) pending-toasts))))
     (reset! *pending-toasts []))
   (when-let [{:keys [dismiss]} @*toast]
     (dismiss id))))

(hsx/defc install-toaster
  []
  (let [^js js-toast ((util/ui-get "useToast"))]
    (hooks/use-effect!
     (fn []
       (let [toast-api {:toast   (.-toast js-toast)
                        :dismiss (.-dismiss js-toast)
                        :update  (.-update js-toast)}]
         (reset! *toast toast-api)
         (doseq [config @*pending-toasts]
           (let [id (:id config)
                 config (interpret-vals config [:title :description :action :icon]
                                        {:id id
                                         :dismiss! #((:dismiss toast-api) id)
                                         :update! #(toast! (assoc %1 :id id))})]
             ((:toast toast-api) (clj->js config))))
         (reset! *pending-toasts []))
       #())
     [])
    [:<> (Toaster)]))
