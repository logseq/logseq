(ns frontend.mobile.camera
  (:require ["@capacitor/camera" :refer [Camera CameraResultType]]
            ["@capacitor/filesystem" :refer [Filesystem]]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
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
                (if (nil? photo)
                  (p/resolved nil)
                  ;; NOTE: For iOS and Android, only jpeg format will be returned as base64 string.
                  ;; See-also: https://capacitorjs.com/docs/apis/camera#galleryphoto
                  (p/let [filename (str (date/get-date-time-string-2) ".jpeg")
                          image-path (editor-handler/get-asset-path filename)
                          _ret (.writeFile Filesystem (clj->js {:data (.-base64String photo)
                                                                :path image-path
                                                                :recursive true}))]
                    filename))))
      (p/catch (fn [error]
                 (log/error :file/write-failed {:error error})))))

(defn embed-photo [id]
  (let [block (state/get-edit-block)
        input (state/get-input)
        content (gobj/get input "value")
        pos (cursor/pos input)
        left-padding (cond
                       (cursor/beginning-of-line? input)
                       nil

                       (= (and (not (zero? pos))
                               (subs content (dec pos))) " ")
                       nil

                       :else " ")
        format (:block/format block)]
    (p/let [filename (take-or-choose-photo)]
      (when (not-empty filename)
        (commands/simple-insert!
         id
         (str left-padding
              (assets-handler/get-asset-file-link format (str "../assets/" filename) filename true)
              " ")
         {})))))
