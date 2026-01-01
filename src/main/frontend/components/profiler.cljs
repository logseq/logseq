(ns frontend.components.profiler
  "Profiler UI"
  (:require [clojure.set :as set]
            [fipp.edn :as fipp]
            [frontend.handler.profiler :as profiler-handler]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defcs profiler < rum/reactive
  (rum/local nil ::reports)
  (rum/local nil ::mem-leak-reports)
  (rum/local nil ::register-fn-name)
  [state]
  (let [profiling-fns (keys (rum/react profiler-handler/*fn-symbol->origin-fn))
        *reports (get state ::reports)
        *mem-leak-reports (get state ::mem-leak-reports)
        *register-fn-name (get state ::register-fn-name)]
    [:div
     [:b "Profiling fns(Only support UI thread now):"]
     [:div.pb-4
      (for [f-name profiling-fns]
        [:div.flex.flex-row.items-center.gap-2
         [:pre.select-text (str f-name)]
         [:a.inline.close.flex.transition-opacity.duration-300.ease-in
          {:title "Unregister"
           :on-pointer-down
           (fn [e]
             (util/stop e)
             (profiler-handler/unregister-fn! f-name))}
          (shui/tabler-icon "x")]])]
     [:div.flex.flex-row.items-center.gap-2
      (shui/button
       {:on-click (fn []
                    (when-let [fn-sym (some-> @*register-fn-name symbol)]
                      (profiler-handler/register-fn! fn-sym)))}
       "Register fn")
      [:input.form-input.my-2.py-1
       {:on-change (fn [e] (reset! *register-fn-name (util/evalue e)))
        :on-focus (fn [e] (let [v (.-value (.-target e))]
                            (when (= v "input fn name here")
                              (set! (.-value (.-target e)) ""))))
        :placeholder "input fn name here"}]]
     [:div.flex.gap-2.flex-wrap.items-center.pb-3
      (shui/button
       {:size :sm
        :on-click (fn [_] (reset! *reports (profiler-handler/profile-report)))}
       (shui/tabler-icon "refresh") "Refresh reports")
      (shui/button
       {:size :sm
        :on-click (fn [_] (profiler-handler/reset-report!)
                    (reset! *reports (profiler-handler/profile-report)))}
       (shui/tabler-icon "x") "Reset reports")]
     (let [update-time-sum
           (fn [m] (update-vals m (fn [m2] (update-vals m2 #(.toFixed % 6)))))]
       [:div.pb-4
        [:pre.select-text
         (when @*reports
           (-> @*reports
               (update :time-sum update-time-sum)
               (fipp/pprint {:width 20})
               with-out-str))]])
     [:hr]
     [:b "Atom/Volatile Mem Leak Detect(Only support UI thread now):"]
     [:pre "Only check atoms/volatiles with a value type of `coll`.
The report shows refs with coll-size > 5k and atom's watches-count > 1k.
`ref` means atom or volatile.
`ref-hash` means `(hash ref)`."]
     [:div.flex.flex-row.items-center.gap-2
      (if (= 2 (count (set/difference #{'cljs.core/reset! 'cljs.core/vreset!} (set profiling-fns))))
        (shui/button
         {:on-click (fn []
                      (profiler-handler/mem-leak-detect))}
         "Start to detect")
        (shui/button
         {:size :sm
          :on-click (fn [_] (reset! *mem-leak-reports (profiler-handler/mem-leak-report)))}
         (shui/tabler-icon "refresh") "Refresh reports"))]
     [:pre.select-text
      (when @*mem-leak-reports
        (let [ref-hash->ref (:ref-hash->ref @*mem-leak-reports)]
          (-> @*mem-leak-reports
              (dissoc :ref-hash->ref)
              (assoc :ref-hash->take-3-items (update-vals ref-hash->ref (fn [ref] (take 3 @ref)))
                     :ref-hash->take-3-watch-keys (update-vals ref-hash->ref (fn [ref] (take 3 (.-watches ^js ref)))))
              (fipp/pprint {:width 20})
              with-out-str)))]]))
