(ns mobile.components.recorder
  "Audio record"
  (:require [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [goog.functions :as gfun]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui] ;; [mobile.speech :as speech]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce audio-file-format "MM-dd HH:mm")

(def *last-edit-block (atom nil))
(defn set-last-edit-block! [block] (reset! *last-edit-block block))

(defn ms-to-time-format [ms]
  (let [total-seconds (quot ms 1000)
        minutes (quot total-seconds 60)
        seconds (mod total-seconds 60)]
    (str (.padStart (str minutes) 2 "0") ":"
         (.padStart (str seconds) 2 "0"))))

(defn save-asset-audio!
  [blob]
  (let [ext (some-> blob
                    (.-type)
                    (string/split ";")
                    (first)
                    (string/split "/")
                    (last))
        ext (case ext
              "mp4" "m4a"
              ext)]

    ;; save local
    (when-let [filename (some->> ext (str "Audio-"
                                          (date/get-date-time-string (t/now)
                                                                     {:formatter-str audio-file-format})
                                          "."))]
      (p/let [file (js/File. [blob] filename #js {:type (.-type blob)})
              result (editor-handler/db-based-save-assets! (state/get-current-repo)
                                                           [file]
                                                           {:last-edit-block @*last-edit-block})
              asset-entity (first result)]
        (when asset-entity
          (p/let [buffer-data (.arrayBuffer blob)
                  unit8-data (js/Uint8Array. buffer-data)]
            (-> (.transcribeAudio2Text mobile-util/ui-local #js {:audioData (js/Array.from unit8-data)})
                (p/then (fn [^js r]
                          (let [content (.-transcription r)]
                            (when-not (string/blank? content)
                              (editor-handler/api-insert-new-block! content
                                                                    {:block-uuid (:block/uuid asset-entity)
                                                                     :sibling? false
                                                                     :replace-empty-target? true
                                                                     :edit-block? false})))))
                (p/catch #(js/console.error "Error(transcribeAudio2Text):" %)))))))))

(rum/defc ^:large-vars/cleanup-todo audio-recorder-aux
  []
  (let [*wave-ref (rum/use-ref nil)
        *micid-ref (rum/use-ref nil)
        *timer-ref (rum/use-ref nil)
        *save-ref (rum/use-ref false)
        [^js wavesurfer set-wavesurfer!] (rum/use-state nil)
        [^js recorder set-recorder!] (rum/use-state nil)
        [mic-devices set-mic-devices!] (rum/use-state nil)
        [_ set-status-pulse!] (rum/use-state 0)
        recording? (some-> recorder (.isRecording))]

    (hooks/use-effect!
     (fn [] #(some-> wavesurfer (.destroy)))
     [])

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
                                 :barRadius 6})
             ^js r (.registerPlugin w
                                    (.create js/window.WaveSurfer.Record
                                             #js {:renderRecordedAudio false
                                                  :scrollingWaveform false
                                                  :continuousWaveform true
                                                  :mimeType "audio/mp4"          ;; m4a
                                                  :audioBitsPerSecond 128000   ;; 128kbps，适合 AAC-LC
                                                  :continuousWaveformDuration 30 ;; optional
                                                  }))]
         (set-wavesurfer! w)
         (set-recorder! r)

         ;; events
         (let [handle-status-changed! (fn []
                                        (set-status-pulse! (js/Date.now)))]
           (doto r
             (.on "record-end" (fn [^js blob]
                                 (when (true? (rum/deref *save-ref))
                                   (save-asset-audio! blob)
                                   (rum/set-ref! *save-ref false)
                                   (mobile-state/close-popup!))
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
             (.on "record-resume" handle-status-changed!))
           ;; auto start
           (.startRecording r))
         #()))
     [])

    [:div.app-audio-recorder-inner
     [:h1.text-xl.p-6.relative
      [:span.font-bold "REC"]
      [:small (date/get-date-time-string (t/now) {:formatter-str audio-file-format})]]

     [:div.px-6
      [:div.flex.justify-between.items-center.hidden
       [:span "&nbsp;"]
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
              (let [micid (some-> (rum/deref *micid-ref) (.-value))]
                (-> (.startRecording recorder #js {:deviceId micid})
                    (.catch #(notification/show! (.-message %) :error)))))]

        [:div.flex.justify-between.items-center.w-full
         [:span.flex.flex-col.timer-wrap
          [:strong.timer {:ref *timer-ref} "00:00"]
          [:small "05:00"]]
         (shui/button {:variant :outline
                       :class "record-ctrl-btn rounded-full recording"
                       :on-click (fn []
                                   (if recording?          ;; save audio
                                     (do
                                       (rum/set-ref! *save-ref true)
                                       (.stopRecording recorder))
                                     (handle-record!)))}
                      (shui/tabler-icon "player-stop" {:size 22}))])]]))

(defn- show-recorder
  []
  (mobile-state/set-popup! {:open? true
                            :content-fn (fn [] (audio-recorder-aux))
                            :opts {:id :ls-audio-record}}))

(defn record!
  []
  (let [editing-id (state/get-edit-input-id)
        quick-add? (mobile-state/quick-add-open?)]
    (set-last-edit-block! nil)
    (if-not (string/blank? editing-id)
      (p/do!
       (editor-handler/save-current-block!)
       (let [block (db-model/query-block-by-uuid (:block/uuid (state/get-edit-block)))]
         (if quick-add?
           (p/do!
            (state/clear-edit!)
            (init/keyboard-hide)
            (show-recorder))
           (do (set-last-edit-block! block)
               (show-recorder)))))
      (show-recorder))))
