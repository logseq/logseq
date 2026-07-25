(ns frontend.test.noise
  "Shared helpers for muting noisy console output in passing test namespaces."
  (:require [clojure.string :as string]))

(def ^:private default-console-methods
  ["error" "warn" "log" "info" "debug"])

(defonce ^:private *console-state
  (atom {}))

(defn- reporter-failure-output?
  [args]
  (some (fn [arg]
          (and (string? arg)
               (or (string/includes? arg "FAIL in (")
                   (string/includes? arg "ERROR in ("))))
        args))

(defn- mute-console!
  [key methods*]
  (let [originals (zipmap methods* (map #(aget js/console %) methods*))
        forward? (atom false)]
    (swap! *console-state assoc key {:originals originals})
    (doseq [method methods*]
      (let [original (get originals method)]
        (aset js/console method
              (fn [& args]
                (when (or @forward?
                          (reporter-failure-output? args))
                  (reset! forward? true)
                  (when original
                    (apply original args)))))))))

(defn- restore-console!
  [key methods*]
  (when-let [{:keys [originals]} (get @*console-state key)]
    (doseq [method methods*]
      (when-let [original (get originals method)]
        (aset js/console method original)))
    (swap! *console-state dissoc key)))

(defn mute-console-fixture
  "Returns a cljs.test fixture map that mutes console output during the namespace run."
  ([key]
   (mute-console-fixture key default-console-methods))
  ([key methods*]
   {:before #(mute-console! key methods*)
    :after #(restore-console! key methods*)}))
