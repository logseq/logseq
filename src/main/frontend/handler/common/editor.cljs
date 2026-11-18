(ns ^:no-doc frontend.handler.common.editor
  (:require [frontend.commands :as commands]
            [frontend.state :as state]
            [promesa.core :as p]))

(defonce ^:private *command-tails (atom {}))

(defn <enqueue-command!
  "Run a graph's edit commands in order, including their async preparation.
  Each command returns its own result; a rejected command releases the queue."
  [repo command]
  (let [generation (state/get-state :editor/graph-generation)
        previous (get @*command-tails repo (p/resolved nil))
        result (p/then previous
                       (fn [_]
                         (when (and (= repo (state/get-current-repo))
                                    (= generation (state/get-state :editor/graph-generation)))
                           (command))))
        tail (p/catch result (constantly nil))]
    (swap! *command-tails assoc repo tail)
    (p/finally tail
               (fn []
                 (swap! *command-tails
                        (fn [tails]
                          (if (identical? tail (get tails repo))
                            (dissoc tails repo)
                            tails)))))
    result))

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
