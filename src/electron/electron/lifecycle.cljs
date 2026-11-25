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

(defn <handle-before-quit!
  "Pause Electron quit while teardown runs, then resume its normal quit flow.

  | Option              | Purpose                                |
  | ------------------- | -------------------------------------- |
  | `:event`            | The Electron quit event.               |
  | `:quit-state`       | An atom initialized to `:idle`.        |
  | `:prevent-default!` | Cancels the current quit event.        |
  | `:teardown!`        | Stops application resources.           |
  | `:quit!`            | Resumes quitting after teardown.       |
  | `:on-error!`        | Optionally reports a teardown failure. |"
  [{:keys [event quit-state prevent-default! teardown! quit! on-error!]}]
  (when-not (= :ready @quit-state)
    (prevent-default! event)
    (when (compare-and-set! quit-state :idle :stopping)
      (-> (p/do (teardown!))
          (p/catch (fn [error]
                     (when on-error!
                       (on-error! error))))
          (p/finally (fn []
                       (reset! quit-state :ready)
                       (quit!)))))))
