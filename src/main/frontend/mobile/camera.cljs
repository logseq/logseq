(ns frontend.mobile.camera
  (:require ["@capacitor/camera" :refer [Camera CameraResultType]]
            ["@capacitor/filesystem" :refer [Filesystem]]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- save-photo []
  (p/let [photo (p/catch
                    (.getPhoto Camera (clj->js
                                       {:allowEditing (get-in
                                                       (state/get-config)
                                                       [:mobile/photo :allow-editing?])
                                        :saveToGallery true
                                        :resultType (.-Base64 CameraResultType)}))
                    (fn [error]
                      (log/error :photo/get-failed {:error error})))
          filename (str (date/get-date-time-string-2) ".jpeg")
          path (editor-handler/get-asset-path filename)
          _file (p/catch
                    (.writeFile Filesystem (clj->js (merge
                                                     (mobile-util/handle-fs-opts path)
                                                     {:data (.-base64String photo)
                                                      :recursive true})))
                    (fn [error]
                      (log/error :file/write-failed {:path path
                                                     :error error})))]
    (p/resolved filename)))

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
    (p/let [filename (save-photo)
            url (util/format "../assets/%s" filename)]
      (commands/simple-insert!
       id
       (str left-padding
            (editor-handler/get-asset-file-link format url filename true)
        " ")
       {}))))
