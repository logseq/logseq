(ns logseq.shui.form.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))


;; State
(def form (util/lsui-wrap "Form" {:static? false}))
(def form-field' (util/lsui-wrap "FormField"))

(rum/defc form-field
  [render' & args]
  (let [[props render']
        (if (map? render')
          [render' (first args)]
          [(first args) render'])
        render (fn [^js ctx]
                 ;; TODO: convert field-state?
                 (render' (js->clj (.-field ctx)) ctx))]
    (form-field' (assoc props :render render))))

(def form-control (util/lsui-wrap "FormControl"))

;; Hooks
;; https://react-hook-form.com/docs/useform#resolver
(def use-form (aget js/window.LSUI "useForm"))
(def use-form-context (aget js/window.LSUI "useFormContext"))

;; UI
(def form-item (util/lsui-wrap "FormItem"))
(def form-label (util/lsui-wrap "FormLabel"))
(def form-description (util/lsui-wrap "FormDescription"))
(def form-message (util/lsui-wrap "FormMessage"))