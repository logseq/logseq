(ns mobile.components.recorder
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [rum.core :as rum]
            [goog.functions :as gfun]
            [frontend.rum :as r]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [logseq.shui.silkhq :as silkhq]))

(defonce *open? (atom true))
(defn set-open? [v?] (reset! *open? v?))

(defn ms-to-time-format [ms]
  (let [total-seconds (quot ms 1000)
        minutes (quot total-seconds 60)
        seconds (mod total-seconds 60)
        centiseconds (quot (mod ms 1000) 10)]
    (str (.padStart (str minutes) 2 "0") ":"
      (.padStart (str seconds) 2 "0") "."
      (.padStart (str centiseconds) 2 "0"))))

(rum/defc audio-recorder-aux
  [{:keys [open?]}]
  (let [*wave-ref (rum/use-ref nil)
        *micid-ref (rum/use-ref nil)
        *timer-ref (rum/use-ref nil)
        [^js wavesurfer set-wavesurfer!] (rum/use-state nil)
        [^js recorder set-recorder!] (rum/use-state nil)
        [mic-devices set-mic-devices!] (rum/use-state nil)
        [_ set-status-pulse!] (rum/use-state 0)
        recording? (some-> recorder (.isRecording))
        paused? (some-> recorder (.isPaused))]

    (hooks/use-effect!
      (fn []
        (when (false? open?)
          (js/setTimeout
            #(some-> wavesurfer (.destroy)) 200))
        #())
      [open?])

    ;; load mic devices
    (hooks/use-effect!
      (fn []
        (when recorder
          (-> js/window.WaveSurfer.Record
            (.getAvailableAudioDevices)
            (.then (fn [^js devices]
                     (let [*vs (volatile! [])]
                       (.forEach devices
                         (fn [^js device]
                           (vswap! *vs conj {:text (or (.-label device) (.-deviceId device))
                                             :value (.-deviceId device)})))
                       (set-mic-devices! @*vs))))
            (.catch (fn [^js err]
                      (js/console.error "ERR: load mic devices" err)))))
        #())
      [recorder])

    (hooks/use-effect!
      (fn []
        (let [dark? (= "dark" (state/sub :ui/theme))
              ^js w (.create js/window.WaveSurfer
                      #js {:container (rum/deref *wave-ref)
                           :waveColor "rgb(167, 167, 167)"
                           :progressColor (if dark? "rgb(219, 216, 216)" "rgb(10, 10, 10)")
                           :barWidth 2
                           :barRadius 6
                           })
              ^js r (.registerPlugin w
                      (.create js/window.WaveSurfer.Record
                        #js {:renderRecordedAudio false
                             :scrollingWaveform false
                             :continuousWaveform true
                             :continuousWaveformDuration 30 ;; optional
                             }))]
          (set-wavesurfer! w)
          (set-recorder! r)

          ;; events
          (let [handle-status-changed! (fn []
                                         (set-status-pulse! (js/Date.now)))]
            (doto r
              (.on "record-end" (fn [^js blob]
                                  (js/console.log "===>> record saved (stopped)!" blob)
                                  (handle-status-changed!)))
              (.on "record-progress" (gfun/throttle
                                       (fn [time]
                                         (try
                                           (let [t (ms-to-time-format time)]
                                             (set! (. (rum/deref *timer-ref) -textContent) t))
                                           (catch js/Error e
                                             (js/console.warn "WARN: bad progress time:" e))))
                                       50))
              (.on "record-start" handle-status-changed!)
              (.on "record-pause" handle-status-changed!)
              (.on "record-resume" handle-status-changed!)))
          #()))
      [])

    [:div.app-audio-recorder-inner
     [:div.flex.items-center.justify-between
      [:h1.text-xl.p-6.bold "REC 🎙️"]
      (shui/button
        {:variant :icon
         :class "mr-2 opacity-60"
         :on-click #(set-open? false)}
        (shui/tabler-icon "x" {:size 20}))]

     [:div.px-6
      [:div.flex.justify-between.items-center
       [:span.timer {:ref *timer-ref} "00:00"]
       [:select.opacity-60
        {:name "mic-select"
         :style {:max-width "220px" :border "none"}
         :ref *micid-ref}
        (for [d mic-devices]
          [:option {:value (:value d)}
           (str "Mic: " (if (string/blank? (:text d)) "Default" (:text d)))])]]
      [:div.wave.border.rounded {:ref *wave-ref}]]

     [:div.p-6.flex.justify-between
      (let [handle-record!
            (fn []
              (cond
                (true? paused?)
                (.resumeRecording recorder)

                (true? recording?)
                (.pauseRecording recorder)

                ;; start recording
                :else
                (let [micid (some-> (rum/deref *micid-ref) (.-value))]
                  (.startRecording recorder #js {:deviceId micid}))
                ))]

        [:<>
         [:span.flex.justify-center
          (when (true? paused?)
            (shui/button {:variant :outline
                          :class "border-green-500"
                          :on-click #(.stopRecording recorder)}
              "✅ Save"))]

         [:span.flex.items-center.gap-1
          (if recording?
            (shui/button {:variant :outline
                          :on-click handle-record!}
              "🎙️ Recording ...")
            (shui/button
              {:variant :outline
               :on-click handle-record!}
              (if (true? paused?)
                "🔁 Resume"
                "▶️ Start")
              ))]])]]))

(rum/defc card
  []
  (let [[open?] (r/use-atom *open?)]
    [:<>
     (silkhq/card-sheet
       {:presented open?
        :onPresentedChange (fn [v?] (set-open? v?))}
       (silkhq/card-sheet-portal
         (silkhq/card-sheet-view
           {:onClickOutside (bean/->js {:dismiss false
                                        :stopOverlayPropagation false})}
           (silkhq/card-sheet-backdrop)
           (silkhq/card-sheet-content
             (audio-recorder-aux {:open? open? :set-open? set-open?})))))

     [:p.p-8
      (shui/button {:on-click #(set-open? true)} "🎙️ Record Audio")]]))

