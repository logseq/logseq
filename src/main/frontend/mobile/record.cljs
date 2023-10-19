(ns frontend.mobile.record
  (:require ["@capacitor/filesystem" :refer [Filesystem]]
            ["capacitor-voice-recorder" :refer [VoiceRecorder]]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn request-audio-recording-permission []
  (p/then
   (.requestAudioRecordingPermission VoiceRecorder)
   (fn [^js result] (.-value result))))

(defn- has-audio-recording-permission? []
  (p/then
   (.hasAudioRecordingPermission VoiceRecorder)
   (fn [^js result] (.-value result))))

(defn- set-recording-state []
  (p/catch
   (p/then (.getCurrentStatus VoiceRecorder)
           (fn [^js result]
             (let [{:keys [status]} (js->clj result :keywordize-keys true)]
               (state/set-state! :editor/record-status status))))
   (fn [error]
     (js/console.error error))))

(defn start-recording []
  (p/let [permission-granted? (has-audio-recording-permission?)
          permission-granted? (or permission-granted?
                                  (request-audio-recording-permission))]
    (when permission-granted?
      (p/catch
       (p/then (.startRecording VoiceRecorder)
               (fn [^js _result]
                 (set-recording-state)
                 (js/console.log "Start recording...")))
       (fn [error]
         (log/error :start-recording-error error))))))

(defn- embed-audio [database64]
  (p/let [page (or (state/get-current-page) (string/lower-case (date/journal-name)))
          filename (str (date/get-date-time-string-2) ".aac")
          edit-block (state/get-edit-block)
          format (or (:block/format edit-block) (db/get-page-format page))
          path (editor-handler/get-asset-path filename)
          _file (p/catch
                 (.writeFile Filesystem (clj->js {:data database64
                                                  :path path
                                                  :recursive true}))
                 (fn [error]
                   (log/error :file/write-failed {:path path
                                                  :error error})))
          url (util/format "../assets/%s" filename)
          file-link (assets-handler/get-asset-file-link format url filename true)
          args (merge (if (parse-uuid page)
                        {:block-uuid (uuid page)}
                        {:page page})
                      {:edit-block? false
                       :replace-empty-target? true})]
    (if edit-block
      (editor-handler/insert file-link)
      (editor-handler/api-insert-new-block! file-link args))))

(defn stop-recording []
  (p/catch
   (p/then
    (.stopRecording VoiceRecorder)
    (fn [^js result]
      (let [value (.-value result)
            {:keys [_msDuration recordDataBase64 _mimeType]}
            (js->clj value :keywordize-keys true)]
        (set-recording-state)
        (when (string? recordDataBase64)
          (embed-audio recordDataBase64)
          (js/console.log "Stop recording...")))))
   (fn [error]
     (js/console.error error))))
