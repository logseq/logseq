(ns logseq.shui.form.core
  (:require [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))


;; State
(def form-provider (util/ui-wrap "Form" {:static? false}))
(def form-field' (util/ui-wrap "FormField" {:static? false}))

(hsx/defc form-field
  [render' & args]
  (let [[props render']
        (if (map? render')
          [render' (first args)]
          [(first args) render'])
        _ (assert (contains? props :name) ":name is required for <ui/form-field>")
        render (fn [^js ctx]
                 ;; TODO: convert field-state?
                 (render'
                   (bean/bean (.-field ctx))
                   (some-> (.-fieldState ctx) (.-error) (bean/bean))
                   (bean/bean (.-fieldState ctx))
                   ctx))]
    (form-field' (assoc props :render render))))

(def form-control (util/ui-wrap "FormControl" {:static? false}))

(def ^js yup (util/ui-get "yup"))
(def yup-resolver (util/ui-get "yupResolver"))

;; Hooks
;; https://react-hook-form.com/docs/useform#resolver
(def use-form' (util/ui-get "useForm"))
(def use-form-context (util/ui-get "useFormContext"))

(defn use-form
  ([] (use-form {}))
  ([opts]
   (let [yup-schema (:yupSchema opts)
         ^js form-methods (use-form' (bean/->js
                                       (cond-> opts
                                         (not (nil? yup-schema))
                                         (assoc :resolver (yup-resolver yup-schema)))))]
     ;; NOTE: just shallow convert return object!
     (bean/bean form-methods))))

;; UI
(def form-item (util/ui-wrap "FormItem"))
(def form-label (util/ui-wrap "FormLabel"))
(def form-description (util/ui-wrap "FormDescription"))
(def form-message (util/ui-wrap "FormMessage"))
(def input (util/ui-wrap "Input"))
(def textarea (util/ui-wrap "Textarea"))
(def switch (util/ui-wrap "Switch"))
(def checkbox (util/ui-wrap "Checkbox"))
(def radio-group (util/ui-wrap "RadioGroup"))
(def radio-group-item (util/ui-wrap "RadioGroupItem"))
