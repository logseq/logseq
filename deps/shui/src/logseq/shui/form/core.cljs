(ns logseq.shui.form.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))


;; State
(def form (util/lsui-wrap "Form"))
(def form-field (util/lsui-wrap "FormField"))
(def form-control (util/lsui-wrap "FormControl"))

;; Hooks
;; https://react-hook-form.com/docs/useform#resolver
(def use-form (util/lsui-wrap "useForm"))
(def use-form-context (util/lsui-wrap "useFormContext"))

;; UI
(def form-item (util/lsui-wrap "FormItem"))
(def form-label (util/lsui-wrap "FormLabel"))
(def form-description (util/lsui-wrap "FormDescription"))
(def form-message (util/lsui-wrap "FormMessage"))