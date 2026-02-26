(ns mobile.components.recorder
  "Audio record"
  (:require ["@capacitor/device" :refer [Device]]
            ["@logseq/simple-wave-record" :refer [BeatsObserver Recorder renderWaveform]]
            [cljs-time.local :as tl]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.audio-recorder :as audio-recorder]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.functions :as gfun]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce audio-file-format "yyyy-MM-dd HH:mm:ss")

(def audio-length-limit 10)     ; 10 minutes
(defonce *transcribe? (atom false))

(def *last-edit-block (atom nil))
(defn set-last-edit-block! [block] (reset! *last-edit-block block))

(defn ms-to-time-format [ms]
  (let [total-seconds (quot ms 1000)
        minutes (quot total-seconds 60)
        seconds (mod total-seconds 60)]
    (str (.padStart (str minutes) 2 "0") ":"
         (.padStart (str seconds) 2 "0"))))

(defn- >ios-26
  []
  (p/let [^js info (.getInfo ^js Device)
          os (.-operatingSystem info)
          vstr (.-osVersion info)
          ;; vstr is like "26.0.1"
          major (js/parseInt (first (.split vstr ".")) 10)]
    (and (= os "ios") (>= major 26))))

(defn save-asset-audio!
  [blob transcribe?]
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
                                          (date/get-date-time-string
                                           (tl/local-now)
                                           {:formatter-str audio-file-format})
                                          "."))]
      (p/let [file (js/File. [blob] filename #js {:type (.-type blob)})
              capture? (= "capture" @mobile-state/*tab)
              insert-opts (cond->
                           {:last-edit-block @*last-edit-block}
                            capture?
                            (assoc :save-to-page (ldb/get-built-in-page (db/get-db) common-config/quick-add-page-name)))
              result (editor-handler/db-based-save-assets! (state/get-current-repo) [file] insert-opts)
              asset-entity (first result)]
        (when (nil? asset-entity)
          (log/error ::empty-asset-entity {}))
        (when (and asset-entity transcribe?)
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
                (p/catch #(log/error :transcribe-audio-error %)))))))))

(rum/defc record-button
  []
  (let [*timer-ref (hooks/use-ref nil)
        [*recorder _] (hooks/use-state (atom nil))
        [*save? _] (hooks/use-state (atom nil))]

    (hooks/use-effect!
     (fn []
       (when-not @*transcribe?
         (p/let [transcribe? (>ios-26)]
           (reset! *transcribe? transcribe?)))
       (let [^js node (js/document.getElementById "wave-container")
             ^js wave-l (.querySelector node ".wave-left")
             ^js wave-r (.querySelector node ".wave-right")
             ^js beats (BeatsObserver.)
             ^js w1 (renderWaveform wave-l #js {:beatsObserver beats})
             ^js w2 (renderWaveform wave-r #js {})
             ^js r (Recorder.create #js {:mimeType (if (util/ios?) "audio/mp4" "audio/webm")
                                         :mediaRecorderTimeslice 1000})
             stop (fn []
                    (some-> @*recorder (.destroy))
                    (.stop w1)
                    (.stop w2))]

         (reset! *recorder r)

         ;; events
         (doto r
           (.on "record-start" (fn []
                                 (.start w1)
                                 (.start w2)))
           (.on "record-end" (fn [^js blob]
                               (when @*save?
                                 (save-asset-audio! blob @*transcribe?))
                               (shui/popup-hide!)))
           (.on "record-progress" (gfun/throttle
                                   (fn [time]
                                     (when @*recorder
                                       (if (>= time (* audio-length-limit 60 1000))
                                         (.click (js/document.getElementById "recording-button"))
                                         (try
                                           (let [t (ms-to-time-format time)]
                                             (when-let [node (rum/deref *timer-ref)]
                                               (set! (. node -textContent) t)))
                                           (catch js/Error e
                                             (log/warn :bad-progress-time e))))))
                                   33))
           (.on "record-beat" (fn [value]
                                (let [value' (cond
                                               (= value 0) 10
                                               (< value 20) (+ value 20)
                                               (and (> value 0) (< value 50)) (+ value 30)
                                               :else value)]
                                  (.notify beats value')))))

         ;; auto start
         (audio-recorder/start-recording! r)
         #(stop)))
     [])

    [:div
     [:div.p-2.flex.justify-between
      [:div.flex.justify-between.items-center.w-full
       [:span.flex.flex-col.timer-wrap
        [:strong.timer {:ref *timer-ref} "00:00"]
        [:small (if (> audio-length-limit 9)
                  (util/format "%d:00" audio-length-limit)
                  (util/format "0%d:00" audio-length-limit))]]
       (shui/button {:variant :outline
                     :class "record-ctrl-btn rounded-full recording"
                     :on-click (fn []
                                 (reset! *save? true)
                                 (.stopRecording ^js @*recorder))}
                    (shui/tabler-icon "player-stop" {:size 22}))]]]))

(rum/defc audio-recorder-aux < rum/static
  []
  [:div.app-audio-recorder
   [:div.flex.flex-row.justify-between.items-center.font-medium
    [:div.opacity-70 (date/get-date-time-string (tl/local-now) {:formatter-str "yyyy-MM-dd"})]]

   [:div#wave-container.app-wave-container
    [:div.app-wave-needle]
    [:div.wave-left]
    [:div.wave-right.mirror]]

   (record-button)])

(defn- show-recorder
  []
  (shui/popup-show! nil
                    (fn [] (audio-recorder-aux))
                    {:id :ls-audio-record
                     :default-height 300}))

(defn record!
  [& {:keys [save-to-today?]}]
  (let [editing-id (state/get-edit-input-id)
        quick-add? (= "capture" @mobile-state/*tab)]
    (set-last-edit-block! nil)
    (if-not (string/blank? editing-id)
      (p/do!
       (editor-handler/save-current-block!)
       (let [block (db-model/query-block-by-uuid (:block/uuid (state/get-edit-block)))]
         (if (or quick-add? save-to-today?)
           (p/do!
            (state/clear-edit!)
            (init/keyboard-hide)
            (show-recorder))
           (do (set-last-edit-block! block)
               (show-recorder)))))
      (show-recorder))))
