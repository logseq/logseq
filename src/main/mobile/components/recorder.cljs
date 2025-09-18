(ns mobile.components.recorder
  "Audio record"
  (:require ["@capacitor/device" :refer [Device]]
            ["@xyhp915/simple-wave-record" :refer [BeatsObserver Recorder renderWaveform]]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.functions :as gfun]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce audio-file-format "yyyy-MM-dd HH:mm:ss")
(def audio-length-limit 10)     ; 10 minutes

(def *last-edit-block (atom nil))
(defn set-last-edit-block! [block] (reset! *last-edit-block block))

(defn ms-to-time-format [ms]
  (let [total-seconds (quot ms 1000)
        minutes (quot total-seconds 60)
        seconds (mod total-seconds 60)]
    (str (.padStart (str minutes) 2 "0") ":"
         (.padStart (str seconds) 2 "0"))))

(defn- get-locale
  []
  (->
   (p/let [^js lang (.getLanguageTag ^js Device)
           value (.-value lang)]
     (if (= value "en_CN")
       "zh"
       (string/replace value "-" "_")))
   (p/catch (fn [e]
              (js/console.error e)
              "en_US"))))

(defn save-asset-audio!
  [blob locale]
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
                                           (t/now)
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
            (-> (.transcribeAudio2Text mobile-util/ui-local #js {:audioData (js/Array.from unit8-data)
                                                                 :locale locale})
                (p/then (fn [^js r]
                          (let [content (.-transcription r)]
                            (when-not (string/blank? content)
                              (editor-handler/api-insert-new-block! content
                                                                    {:block-uuid (:block/uuid asset-entity)
                                                                     :sibling? false
                                                                     :replace-empty-target? true
                                                                     :edit-block? false})))))
                (p/catch #(js/console.error "Error(transcribeAudio2Text):" %)))))))))

(rum/defc record-button
  [*locale]
  (let [*timer-ref (hooks/use-ref nil)
        *save? (hooks/use-ref nil)
        [*recorder _] (hooks/use-state (atom nil))
        [locale set-locale!] (hooks/use-state nil)]

    (hooks/use-effect!
     (fn []
       (let [^js node (js/document.getElementById "wave-container")
             ^js wave-l (.querySelector node ".wave-left")
             ^js wave-r (.querySelector node ".wave-right")
             ^js beats (BeatsObserver.)
             ^js w1 (renderWaveform wave-l #js {:beatsObserver beats})
             ^js w2 (renderWaveform wave-r #js {})
             ^js r (Recorder.create #js {:mimeType "audio/mp4"
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
                               (stop)
                               (when (true? (rum/deref *save?))
                                 (save-asset-audio! blob @*locale))
                               (mobile-state/close-popup!)))
           (.on "record-progress" (gfun/throttle
                                   (fn [time]
                                     (if (>= time (* audio-length-limit 60 1000))
                                       (.click (js/document.getElementById "recording-button"))
                                       (try
                                         (let [t (ms-to-time-format time)]
                                           (set! (. (rum/deref *timer-ref) -textContent) t))
                                         (catch js/Error e
                                           (js/console.warn "WARN: bad progress time:" e)))))
                                   33))
           (.on "record-beat" (fn [value]
                                (let [value' (cond
                                               (= value 0) 10
                                               (< value 20) (+ value 20)
                                               (and (> value 0) (< value 50)) (+ value 30)
                                               :else value)]
                                  (.notify beats value')))))

         ;; auto start
         (.startRecording r)
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
                                 (rum/set-ref! *save? true)
                                 (.stopRecording ^js @*recorder))}
                    (shui/tabler-icon "player-stop" {:size 22}))]]

     (when locale
       (when-not (string/starts-with? locale "en_")
         (shui/button {:variant :outline
                       :on-click (fn []
                                   (reset! *locale "en_US")
                                   (set-locale! "en_US"))}
                      "English transcribe")))]))

(rum/defc audio-recorder-aux < rum/static
  []
  (let [[locale set-locale!] (hooks/use-state nil)
        [*locale] (hooks/use-state (atom nil))]

    (hooks/use-effect!
     (fn []
       (p/let [locale (get-locale)]
         (set-locale! locale)
         (reset! *locale locale)))
     [])

    [:div.app-audio-recorder
     [:div.flex.flex-row.justify-between.items-center.font-medium
      [:div.opacity-70 (date/get-date-time-string (t/now) {:formatter-str "yyyy-MM-dd"})]
      (when (util/ios?)
        (let [non-en-locale? (and locale (not (string/starts-with? locale "en_")))]
          (shui/button
           {:variant :outline
            :class (str "rounded-full " (if (= locale "en_US") "opacity-100" "opacity-70"))
            :disabled (and (not= locale "en_US") (not non-en-locale?))
            :on-click (fn []
                        (reset! *locale "en_US")
                        (set-locale! "en_US"))}
           "EN transcribe")))]

     [:div#wave-container.app-wave-container
      [:div.app-wave-needle]
      [:div.wave-left]
      [:div.wave-right.mirror]]

     (record-button *locale)]))

(defn- show-recorder
  []
  (mobile-state/set-popup! {:open? true
                            :content-fn (fn [] (audio-recorder-aux))
                            :opts {:id :ls-audio-record
                                   :default-height 300}}))

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
