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

(defn- use-external-store-projection
  [subscribe! snapshot key project]
  (let [key (use-stable-key key)
        projection-ref (react/useRef nil)
        subscribe (react/useCallback
                   (fn [listener] (subscribe! key listener))
                   #js [subscribe! key])
        get-snapshot (react/useCallback
                      (fn []
                        (let [source (snapshot key)
                              cached (.-current projection-ref)]
                          (if (identical? source (:source cached))
                            (:snapshot cached)
                            (let [projected (if (= :ready (:status source))
                                              (update source :value project)
                                              source)
                                  projected (if (= projected (:snapshot cached))
                                              (:snapshot cached)
                                              projected)]
                              (set! (.-current projection-ref)
                                    {:source source :snapshot projected})
                              projected))))
                      #js [snapshot key project])
        {:keys [status value error] :as result}
        (react/useSyncExternalStore subscribe get-snapshot get-snapshot)]
    (case status
      :ready value
      (:loading :missing) nil
      :error (throw error)
      (throw (ex-info "Invalid renderer subscription snapshot"
                      {:key key :snapshot result})))))

(defn use-block
  [block-uuid]
  (use-external-store subs/subscribe-block! subs/block-snapshot block-uuid))

(defn use-block-prefetch
  "Keep canonical block loads alive for a render-ahead window."
  [block-uuids]
  (let [block-uuids (use-stable-key (vec block-uuids))]
    (react/useEffect
     (fn []
       (let [unsubscribes
             (mapv #(subs/subscribe-block! % (fn [])) block-uuids)]
         #(run! (fn [unsubscribe] (unsubscribe)) unsubscribes)))
     #js [block-uuids])))

(defn use-block-projection
  [block-uuid project]
  (use-external-store-projection subs/subscribe-block! subs/block-snapshot
                                 block-uuid project))

(defn use-children
  [parent-uuid]
  (use-external-store subs/subscribe-children! subs/children-snapshot parent-uuid))

(defn use-resource
  [resource-key]
  (use-external-store subs/subscribe-resource! subs/resource-snapshot resource-key))
