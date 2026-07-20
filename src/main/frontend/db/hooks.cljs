(ns frontend.db.hooks
  "Hooks for DB-backed React integration."
  (:require ["react" :as react]
            [frontend.db.subs :as subs]))

(defn- use-stable-key
  [key]
  (let [key-ref (react/useRef key)]
    (when-not (= (.-current key-ref) key)
      (set! (.-current key-ref) key))
    (.-current key-ref)))

(defn- use-external-store
  [subscribe! snapshot key]
  (let [key (use-stable-key key)
        subscribe (react/useCallback
                   (fn [listener] (subscribe! key listener))
                   #js [subscribe! key])
        get-snapshot (react/useCallback
                      (fn [] (snapshot key))
                      #js [snapshot key])
        {:keys [status value error] :as result}
        (react/useSyncExternalStore
         subscribe
         get-snapshot
         get-snapshot)]
    (case status
      :ready value
      (:loading :missing) nil
      :error (throw error)
      (throw (ex-info "Invalid renderer subscription snapshot"
                      {:key key :snapshot result})))))

(defn use-block
  [block-uuid]
  (use-external-store subs/subscribe-block! subs/block-snapshot block-uuid))

(defn use-children
  [parent-uuid]
  (use-external-store subs/subscribe-children! subs/children-snapshot parent-uuid))

(defn use-resource
  [resource-key]
  (use-external-store subs/subscribe-resource! subs/resource-snapshot resource-key))
