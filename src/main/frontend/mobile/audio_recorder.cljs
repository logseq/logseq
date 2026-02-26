(ns frontend.mobile.audio-recorder
  (:require [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- microphone-permission-denied-error?
  [error]
  (let [message (some-> error str string/lower-case)]
    (and (string/includes? message "microphone")
         (or (string/includes? message "denied")
             (string/includes? message "not authorized")
             (string/includes? message "permission")))))

(defn start-recording!
  [recorder]
  (-> (.startRecording ^js recorder)
      (p/catch (fn [error]
                 (log/error :audio/record-start-failed {:error error})
                 (when (microphone-permission-denied-error? error)
                   (notification/show!
                    "Microphone access is denied. Enable it in Settings > Logseq."
                    :warning)
                   (shui/popup-hide!))
                 nil))))
