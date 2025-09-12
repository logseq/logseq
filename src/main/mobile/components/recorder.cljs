(ns mobile.components.recorder
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.util :as util]
            [rum.core :as rum]
            [goog.functions :as gfun]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.db.model :as db-model]
            [mobile.init :as init]
            [promesa.core :as p]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [logseq.shui.silkhq :as silkhq]))

(defonce *open? (atom false))
(defn set-open? [v?] (reset! *open? v?))
(def *last-edit-block (atom nil))
(defn set-last-edit-block! [block] (reset! *last-edit-block block))

(defn ms-to-time-format [ms]
  (let [total-seconds (quot ms 1000)
        minutes (quot total-seconds 60)
        seconds (mod total-seconds 60)
        centiseconds (quot (mod ms 1000) 10)]
    (str (.padStart (str minutes) 2 "0") ":"
      (.padStart (str seconds) 2 "0") "."
      (.padStart (str centiseconds) 2 "0"))))

(defn save-asset-audio!
  [blob]
  (let [ext (some-> blob
              (.-type)
              (string/split ";")
              (first)
              (string/split "/")
              (last))]
    (when-let [filename (some->> ext (str "record-" (date/get-date-time-string-2) "."))]
      (p/let [file (js/File. [blob] filename #js {:type (.-type blob)})
              asset-entity (editor-handler/db-based-save-assets! (state/get-current-repo) [file] {})
              asset-entity (some-> asset-entity (first))
              url (util/format "[[%s]]" (:block/uuid asset-entity))]
        (if-let [last-block @*last-edit-block]
          (if (string/blank? (:block/title last-block))
            (editor-handler/save-block! (state/get-current-repo)
              last-block url)
            (editor-handler/api-insert-new-block!
              url {:block-uuid (:block/uuid last-block)
                   :sibling? true}))
          (editor-handler/api-insert-new-block! url
            {:page (date/today)
             :container-id :unknown-container}))))))

(rum/defc audio-recorder-aux
  [{:keys [open?]}]
  (let [*wave-ref (rum/use-ref nil)
        *micid-ref (rum/use-ref nil)
        *timer-ref (rum/use-ref nil)
        *save-ref (rum/use-ref false)
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
                                  (when (true? (rum/deref *save-ref))
                                    (save-asset-audio! blob)
                                    (rum/set-ref! *save-ref false)
                                    (set-open? false))
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
                  (-> (.startRecording recorder #js {:deviceId micid})
                    (.catch #(notification/show! (.-message %) :error))))
                ))]

        [:<>
         [:span.flex.justify-center
          (when (true? paused?)
            (shui/button {:variant :outline
                          :class "border-green-500"
                          :on-click (fn []
                                      (rum/set-ref! *save-ref true)
                                      (.stopRecording recorder))}
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
                "⏯️ Resume"
                "▶️ Start")
              ))]])]]))

(rum/defc card
  []
  (let [[open?] (r/use-atom *open?)]
    (silkhq/card-sheet
      {:presented open?
       :onPresentedChange (fn [v?] (set-open? v?))}
      (silkhq/card-sheet-portal
        (silkhq/card-sheet-view
          {:onClickOutside (bean/->js {:dismiss false
                                       :stopOverlayPropagation false})}
          (silkhq/card-sheet-backdrop)
          (silkhq/card-sheet-content
            (audio-recorder-aux {:open? open? :set-open? set-open?})))))))

(defn open-dialog!
  []
  (let [editing-id (state/get-edit-input-id)]
    (set-last-edit-block! nil)
    (when-not (string/blank? editing-id)
      (p/do!
        (editor-handler/save-current-block!)
        (let [block (db-model/query-block-by-uuid (:block/uuid (state/get-edit-block)))]
          (set-last-edit-block! block)
          (state/clear-edit!)
          (init/keyboard-hide)
          (js/setTimeout #(set-open? true) 200)))
      (set-open? true))))
