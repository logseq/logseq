(ns ^:no-doc frontend.handler.common.editor
  (:require [frontend.commands :as commands]
            [promesa.core :as p]))

(defn insert-command!
  [id command-output format {:keys [restore?]
                             :or {restore? true}
                             :as option}]
  (letfn [(restore! []
            (when restore?
              (commands/restore-state)))
          (insert-value! [value]
            (commands/insert! id value option)
            (restore!))]
    (cond
      ;; replace string
      (string? command-output)
      (insert-value! command-output)

      ;; steps
      (vector? command-output)
      (do
        (commands/handle-steps command-output format)
        (restore!))

      (p/promise? command-output)
      (p/then command-output insert-value!)

      (fn? command-output)
      (let [value (command-output)]
        (if (p/promise? value)
          (p/then value insert-value!)
          (insert-value! value)))

      :else
      (restore!))))
