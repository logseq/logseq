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

  preventDefault on every before-quit while teardown is in flight, run
  teardown once (including a waiting sidecar stop), then exit."
  [{:keys [event already-started? prevent-default! teardown! exit! on-error!]}]
  (when (and prevent-default! event)
    (prevent-default! event))
  (when-not @already-started?
    (reset! already-started? true)
    (-> (try
          (p/do (when teardown! (teardown!)))
          (catch :default error
            (p/rejected error)))
        (p/catch (fn [error]
                   (when on-error!
                     (on-error! error))
                   nil))
        (p/finally (fn []
                     (when exit!
                       (exit!)))))))
