(ns mobile.components.recorder
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [rum.core :as rum]
            [frontend.rum :as r]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [logseq.shui.silkhq :as silkhq]))

(defonce *open? (atom true))
(defn set-open? [v?] (reset! *open? v?))

(rum/defc audio-recorder-aux
  [{:keys [open?]}]
  (let [*wave-ref (rum/use-ref nil)
        *micid-ref (rum/use-ref nil)
        [^js wavesurfer set-wavesurfer!] (rum/use-state nil)
        [^js recorder set-recorder!] (rum/use-state nil)
        [mic-devices set-mic-devices!] (rum/use-state nil)
        [_ set-status-pulse!] (rum/use-state 0)
        recording? (some-> recorder (.isRecording))
        paused? (some-> recorder (.isPaused))]

    (hooks/use-effect!
      (fn []
        (when (false? open?)
          (some-> wavesurfer (.destroy)))
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
        (let [^js w (.create js/window.WaveSurfer
                      #js {:container (rum/deref *wave-ref)
                           :waveColor "rgb(200, 0, 200)"
                           :progressColor "rgb(100, 0, 100)"})
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
                                  (js/console.log "===>> record stopped!" blob)
                                  (handle-status-changed!)))
              (.on "record-progress" (fn [time]
                                       (js/console.log "===>> record progressing:" time)))
              (.on "record-start" handle-status-changed!)
              (.on "record-pause" handle-status-changed!)
              (.on "record-resume" handle-status-changed!)))
          #(js/console.log "==>> audio recorder aux: Destroy")))
      [])

    [:div.app-audio-recorder-inner
     [:h1.text-3xl.font-bold.p-8
      "REC 🎙️"]
     (silkhq/card-sheet-description
       [:div.p-8 {:style {:min-height 180}}
        [:p.timer "00 : 00"]
        [:div.wave.border {:ref *wave-ref}]])
     [:p.p-6.flex.justify-between
      [:span.flex.justify-center
       [:select
        {:name "mic-select"
         :style {:max-width "120px"}
         :ref *micid-ref}
        (for [d mic-devices]
          [:option {:value (:value d)}
           (str "Mic: " (if (string/blank? (:text d)) "Default" (:text d)))])]]
      [:span
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
                   (js/console.log "==>> deviceID: " micid)
                   (.startRecording recorder #js {:deviceId micid}))
                 ))]
         (if recording?
           (shui/button {:variant :outline
                         :on-click handle-record!}
             "🎙️ Recording ...")
           (shui/button {:on-click handle-record!}
             (if (true? paused?)
               "🔁 Resume"
               "▶️ Record")
             )))]]
     [:p.p-8.flex.justify-end
      (shui/button {:variant :outline
                    :on-click #(set-open? false)} "close")]
     ]))

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

