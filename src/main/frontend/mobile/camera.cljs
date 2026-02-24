(ns frontend.mobile.camera
  (:require ["@capacitor/camera" :refer [Camera CameraResultType]]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:dynamic *camera-get-photo*
  (fn [options]
    (.getPhoto Camera options)))

(defn- notify-camera-permission-denied!
  []
  (notification/show!
   "Camera access is denied. Enable it in Settings > Logseq."
   :warning))

(defn- camera-denied-error?
  [error]
  (let [message (some-> error str string/lower-case)]
    (and (string/includes? message "camera")
         (or (string/includes? message "denied")
             (string/includes? message "not authorized")
             (string/includes? message "permission")))))

(defn- take-or-choose-photo []
  (-> (*camera-get-photo*
       (clj->js
        {:allowEditing (get-in
                        (state/get-config)
                        [:mobile/photo :allow-editing?])
         :quality (get-in (state/get-config)
                          [:mobile/photo :quality] 80)
         :saveToGallery true
         :resultType (.-Base64 CameraResultType)}))
      (p/catch (fn [error]
                 (log/error :photo/get-failed {:error error})
                 (when (camera-denied-error? error)
                   (notify-camera-permission-denied!))
                 nil))
      (p/then (fn [photo]
                (if (nil? photo)
                  nil
                  ;; NOTE: For iOS and Android, only jpeg format will be returned as base64 string.
                  ;; See-also: https://capacitorjs.com/docs/apis/camera#galleryphoto
                  (let [filename (str (date/get-date-time-string-2) ".jpeg")
                        base64string (gobj/get photo "base64String")]
                    (when (seq base64string)
                      (js/File. #js [(util/base64string-to-unit8array base64string)]
                                filename #js {:type "image/jpeg"}))))))
      (p/catch (fn [error]
                 (log/error :file/write-failed {:error error})
                 nil))))

(defn embed-photo [id]
  (let [block (state/get-edit-block)
        format (get block :block/format :markdown)]
    (p/let [file (take-or-choose-photo)]
      (when (and id file)
        (editor-handler/upload-asset! id [file] format editor-handler/*asset-uploading? true)))))
