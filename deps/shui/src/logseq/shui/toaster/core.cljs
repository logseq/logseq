(ns logseq.shui.toaster.core
  (:require [rum.core :as rum]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))

(def ^:private toaster-installer (util/lsui-wrap "Toaster"))
(def ^:private *toast (atom nil))

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

(defn toast!
  [config]
  (if-let [{:keys [toast _dismiss]} @*toast]
    (js->clj (toast (clj->js (update-html-props config))))
    :exception))