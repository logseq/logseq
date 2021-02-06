(ns frontend.react-impl-test
  "To facilitate testing, imitate the behavior of react")

;{:component-key {:result nil
;                 :watches []}}
(def react-defines (atom {}))
(def ^:dynamic *react-fn* nil)

(defn react
  [react-ref]
  (let [f *react-fn*]
    (if (= :from-watching-fn f)
      @react-ref
      (let [component (get @react-defines f)]
        (when-not ((:watches component) react-ref)
          (let [new-component (update component :watches conj react-ref)]
            (add-watch react-ref react-ref
                       (fn [& _]
                         (binding [*react-fn* :from-watching-fn]
                           (reset! (:result component) (f)))))
            (swap! react-defines assoc f new-component)
            @react-ref))))))

(defn react-fn
  [f]
  {:pre [(fn? f)]}
  (let [result-ref (atom nil)
        ;; Each react-fn invoke will generate new *react-fn*, though the same f.
        f' (fn [] (f))]
    (binding [*react-fn* f']
      (swap! react-defines assoc f' {:result result-ref
                                     :watches #{}})
      (reset! result-ref (f'))
      {:clear-state-fn
       (fn [] (-> (swap! react-defines dissoc f')
                  (empty?)))
       :get-value-fn
       (fn [] (deref (get-in @react-defines [f' :result])))})))

(comment
  (let [react-ref (atom 1)
        f (fn []
            (let [haha (react react-ref)]
              (* haha 2)))
        {:keys [clear-state-fn get-value-fn]} (react-fn f)]
    (prn (get-value-fn))
    (reset! react-ref 2)
    (prn (get-value-fn))
    (clear-state-fn)))


