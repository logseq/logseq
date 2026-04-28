(ns frontend.test.noise
  "Shared helpers for muting noisy console output in passing test namespaces.")

(def ^:private default-console-methods
  ["error" "warn" "log" "info" "debug"])

(defonce ^:private *console-state
  (atom {}))

(defn- mute-console!
  [key methods*]
  (let [originals (zipmap methods* (map #(aget js/console %) methods*))]
    (swap! *console-state assoc key originals)
    (doseq [method methods*]
      (aset js/console method (fn [& _] nil)))))

(defn- restore-console!
  [key methods*]
  (when-let [originals (get @*console-state key)]
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
