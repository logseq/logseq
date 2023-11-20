(ns logseq.shui.toaster.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))

(defonce ^:private toaster-installer (util/lsui-wrap "Toaster"))
(defonce ^:private *toast (atom nil))

(defn use-toast []
  (when-let [^js js-toast (js/window.LSUI.useToast)]
    (let [toast-fn! (.-toast js-toast)
          dismiss!  (.-dismiss js-toast)]
      [(fn [s]
         (let [^js s (bean/->js s)]
           (toast-fn! s)))
       dismiss!])))

(rum/defc install-toaster
  < rum/static
  []
  (let [^js js-toast (js/window.LSUI.useToast)]
    (rum/use-effect!
      #(reset! *toast {:toast   (.-toast js-toast)
                       :dismiss (.-dismiss js-toast)})
      [])
    [:<> (toaster-installer)]))

(defn update-html-props
  [v]
  (update-keys v
    #(case %
       :class :className
       :for :htmlFor
       %)))

(defn interpret-vals
  [config ks]
  (reduce (fn [config k]
            (let [v (get config k)]
              (if (vector? v) (assoc config k (interpret v)) config)))
    config ks))

(defn toast!
  ([content-or-config] (toast! content-or-config :default nil))
  ([content-or-config status] (toast! content-or-config status nil))
  ([content-or-config status opts]
   (if-let [{:keys [toast _dismiss]} @*toast]
     (let [config (if (map? content-or-config)
                    (update-html-props content-or-config)
                    {:description content-or-config
                     :variant     status})
           config (merge config opts)
           config (interpret-vals config [:title :description])]
       (js->clj (toast (clj->js config))))
     :exception)))