(ns logseq.cli.format
  "Formatting helpers for CLI output."
  (:require [clojure.walk :as walk]))

(defn- normalize-json
  [value]
  (walk/postwalk (fn [entry]
                   (if (uuid? entry)
                     (str entry)
                     entry))
                 value))

(defn- ->json
  [{:keys [status data error]}]
  (let [obj (js-obj)]
    (set! (.-status obj) (name status))
    (cond
      (= status :ok)
      (set! (.-data obj) (clj->js (normalize-json data)))

      (= status :error)
      (set! (.-error obj) (clj->js (normalize-json (update error :code name)))))
    (js/JSON.stringify obj)))

(defn- ->human
  [{:keys [status data error]}]
  (case status
    :ok
    (if (and (map? data) (contains? data :message))
      (:message data)
      (pr-str data))

    :error
    (str "error: " (:message error))

    (pr-str {:status status :data data :error error})))

(defn- ->edn
  [{:keys [status data error]}]
  (pr-str (cond-> {:status status}
            (= status :ok) (assoc :data data)
            (= status :error) (assoc :error error))))

(defn format-result
  [result {:keys [json? output-format]}]
  (let [format (cond
                 (= output-format :edn) :edn
                 (= output-format :json) :json
                 json? :json
                 :else :human)]
    (case format
      :json (->json result)
      :edn (->edn result)
      (->human result))))
