(ns frontend.mobile.camera
  (:require ["@capacitor/camera" :refer [Camera CameraResultType]]
            ["@capacitor/filesystem" :refer [Filesystem]]
            [promesa.core :as p]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.util :as util]
            [frontend.commands :as commands]))

(defn- get-photo []
  (p/let [photo (.getPhoto Camera (clj->js
                                   {:quality 90
                                    :allowEditing (get-in
                                                   (state/get-config)
                                                   [:mobile/photo :allow-editing?]
                                                   true)
                                    :saveToGallery true
                                    :resultType (.-Uri CameraResultType)}))
          photo-buffer (.readFile Filesystem (clj->js {:path (.-path photo)}))
          [repo-dir assets-dir] (editor-handler/ensure-assets-dir! (state/get-current-repo))
          filename (str (date/get-date-time-string-2) ".jpeg")
          path (str "file://" repo-dir "/" assets-dir "/" filename)
          _file (.writeFile Filesystem (clj->js
                                         {:data (.-data photo-buffer)
                                          :path path}))]
    (p/resolved filename)))

(defn embed-photo [id]
  (let [block (state/get-edit-block)
        format (:block/format block)]
    (p/let [filename (get-photo)]
      (commands/simple-insert!
       id
       (case format
         :org (util/format "[[../assets/%s]]" filename)
         (util/format "![%s](../assets/%s)" filename filename))
       {}))))
