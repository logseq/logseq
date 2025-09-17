(ns mobile.record
  "Web audio record"
  (:require [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defonce ^:private *stream   (atom nil))
(defonce ^:private *recorder (atom nil))
(defonce ^:private *chunks   (atom #js []))

(def mime "audio/mp4")

(defn destroy!
  []
  ;; cleanup media stream
  (when @*stream
    (doseq [t (.getTracks @*stream)] (.stop t)))
  (reset! *stream nil)
  (reset! *recorder nil)
  (reset! *chunks #js []))

(defn- listen-on-stop
  [recorder on-record-end]
  (set! (.-onstop recorder)
        (fn []
          (p/do!
           (p/delay 500)
           (let [blob (js/Blob. @*chunks #js {:type mime})]
             (destroy!)
             (on-record-end blob))))))

(defn start
  "Start recording mic to mp4."
  [{:keys [on-record-end timeslice]
    :or {timeslice 1000}}]
  (-> (.getUserMedia js/navigator.mediaDevices #js {:audio true})
      (p/then
       (fn [s]
         (reset! *chunks #js [])
         (reset! *stream s)
         (let [r (js/MediaRecorder. s #js {:mimeType mime
                                           :audioBitsPerSecond 128000})] ;; ~128 kbps AAC
           (reset! *recorder r)
           (listen-on-stop r on-record-end)
           (set! (.-ondataavailable r)
                 (fn [e]
                   (when (and e (> (.-size (.-data e)) 0))
                     (.push @*chunks (.-data e)))))
                   ;; optional: listen for errors
           (set! (.-onerror r) (fn [e] (js/console.error "MediaRecorder error:" e)))
           (.start r timeslice))))
      (p/catch (fn [error]
                 (log/error ::audio-record-failed error)))))

(defn stop
  []
  (.stop @*recorder))
