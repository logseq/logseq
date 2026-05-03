(ns frontend.mobile.audio-recorder
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
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
                    (t :mobile/microphone-access-denied)
                    :warning)
                   (shui/popup-hide!))
                 nil))))
