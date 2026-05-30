(ns frontend.components.shell
  (:require [io.factorhouse.hsx.core :as hsx]
            [frontend.context.i18n :refer [t]]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.shell :as shell-handler]
            [clojure.string :as string]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(defonce *command (atom ""))
(defonce *loading? (atom nil))

(defn- run-command
  []
  (reset! *loading? true)
  (->
   (p/let [_ (when-not (string/blank? @*command)
               (shell-handler/run-command! @*command))]
     (reset! *loading? false))
   (p/finally (fn [] (reset! *loading? false)))))

(hsx/defc shell
  []
  (let [[loading?] (hooks/use-atom *loading?)]
    [:div.flex.flex-col
     {:on-key-up (fn [^js e]
                   (when (= 13 (.-keyCode e))
                     (run-command)))}
     [:div
      [:div
       [:div
        [:h1.title
         (t :shell/input-command-title)]
        [:div.mt-4.mb-4.relative.rounded-md.shadow-sm
         [:input#run-command.form-input.font-mono.block.w-full.sm:text-sm.sm:leading-5
          {:autoFocus true
           :on-key-down util/stop-propagation
           :placeholder "git commit -m ..."
           :on-change (fn [e]
                        (reset! *command (util/evalue e)))}]]]]
      [:div.flex.flex-row.items-center
       (ui/button (t :ui/run) :on-click run-command)
       [:div.ml-4
        (when loading?
          (ui/loading ""))]]]]))
