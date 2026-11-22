(ns electron.lifecycle
  (:require [promesa.core :as p]))

(defn enqueue!
  "Serialize lifecycle operations and continue after an earlier operation fails."
  [lifecycle-op operation]
  (let [next-op (-> @lifecycle-op
                    (p/catch (fn [_] nil))
                    (p/then (fn [_] (operation))))]
    (vreset! lifecycle-op next-op)
    next-op))

(defn handle-before-quit!
  "Block Electron quit until teardown finishes.

  preventDefault once, run teardown (including a waiting sidecar stop),
  then exit. A second before-quit while teardown is running is a no-op."
  [{:keys [event already-started? prevent-default! teardown! exit!]}]
  (when-not @already-started?
    (reset! already-started? true)
    (when (and prevent-default! event)
      (prevent-default! event))
    (-> (try
          (p/do (when teardown! (teardown!)))
          (catch :default error
            (p/rejected error)))
        (p/catch (fn [_] nil))
        (p/finally (fn []
                     (when exit!
                       (exit!)))))))
