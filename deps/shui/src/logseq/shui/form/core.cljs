(ns logseq.shui.form.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))


;; State
(def form-provider (util/lsui-wrap "Form" {:static? false}))
(def form-field' (util/lsui-wrap "FormField" {:static? false}))

(rum/defc form-field
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

(def form-control (util/lsui-wrap "FormControl" {:static? false}))

(def ^js yup (util/lsui-get "yup"))
(def yup-resolver (util/lsui-get "yupResolver"))

;; Hooks
;; https://react-hook-form.com/docs/useform#resolver
(def use-form' (util/lsui-get "useForm"))
(def use-form-context (util/lsui-get "useFormContext"))

(defn use-form
  ([] (use-form {}))
  ([opts]
   (let [yup-schema (:yupSchema opts)
         ^js methods (use-form' (bean/->js
                                  (cond-> opts
                                    (not (nil? yup-schema))
                                    (assoc :resolver (yup-resolver yup-schema)))))]
     ;; NOTE: just shallow convert return object!
     (bean/bean methods))))

;; UI
(def form-item (util/lsui-wrap "FormItem"))
(def form-label (util/lsui-wrap "FormLabel"))
(def form-description (util/lsui-wrap "FormDescription"))
(def form-message (util/lsui-wrap "FormMessage"))