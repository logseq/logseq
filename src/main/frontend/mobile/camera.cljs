(ns frontend.mobile.camera
  (:require ["@capacitor/camera" :refer [Camera CameraResultType]]
            [frontend.date :as date]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- take-or-choose-photo []
  (-> (.getPhoto Camera (clj->js
                         {:allowEditing (get-in
                                         (state/get-config)
                                         [:mobile/photo :allow-editing?])
                          :quality (get-in (state/get-config)
                                           [:mobile/photo :quality] 80)
                          :saveToGallery true
                          :resultType (.-Base64 CameraResultType)}))
      (p/catch (fn [error]
                 (log/error :photo/get-failed {:error error})))
      (p/then (fn [photo]
                (let [id (state/get-edit-input-id)]
                  (if (or (nil? photo) (nil? id))
                    (p/resolved nil)
                    ;; NOTE: For iOS and Android, only jpeg format will be returned as base64 string.
                    ;; See-also: https://capacitorjs.com/docs/apis/camera#galleryphoto
                    (p/let [filename (str (date/get-date-time-string-2) ".jpeg")
                            _image-path (assets-handler/get-asset-path filename)
                            base64string (.-base64String photo)
                            file (js/File. #js [(util/base64string-to-unit8array base64string)]
                                           filename #js {:type "image/jpeg"})]
                      file)))))
      (p/catch (fn [error]
                 (log/error :file/write-failed {:error error})))))

(defn embed-photo [_id]
  (let [id (state/get-edit-input-id)
        block (state/get-edit-block)
        input (state/get-input)
        _content (gobj/get input "value")
        format (get block :block/format :markdown)]
    (p/let [file (take-or-choose-photo)
            _ret (editor-handler/upload-asset! id [file] format editor-handler/*asset-uploading? true)])))
