(ns frontend.handler.image
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.image :as image]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

(defn render-local-images!
  []
  (when-not (and (util/electron?)
                 (config/local-db? (state/get-current-repo)))
    (try
      (let [images (array-seq (gdom/getElementsByTagName "img"))
            get-src (fn [image] (.getAttribute image "src"))
            local-images (filter
                          (fn [image]
                            (let [src (get-src image)]
                              (and src
                                   (not (or (util/starts-with? src "http://")
                                            (util/starts-with? src "https://")
                                            (util/starts-with? src "blob:")
                                            (util/starts-with? src "data:"))))))
                          images)]
        (doseq [img local-images]
          (gobj/set img
                    "onerror"
                    (fn []
                      (gobj/set (gobj/get img "style")
                                "display" "none")))
          (let [path (get-src img)
                path (string/replace-first path "file:" "")
                path (if (= (first path) \.)
                       (subs path 1)
                       path)]
            (util/p-handle
             (fs/read-file (config/get-repo-dir (state/get-current-repo)) path {})
             (fn [blob]
               (let [blob (js/Blob. (array blob) (clj->js {:type "image"}))
                     img-url (image/create-object-url blob)]
                 (gobj/set img "src" img-url)
                 (gobj/set (gobj/get img "style")
                           "display" "initial")))
             (fn [error]
               (println "Can't read local image file: ")
               (js/console.dir error))))))
      (catch js/Error e
        nil))))

(defn request-presigned-url
  [file filename mime-type uploading? url-handler on-processing]
  (cond
    (> (gobj/get file "size") (* 12 1024 1024))
    (notification/show! [:p "Sorry, we don't support any file that's larger than 12MB."] :error)

    :else
    (do
      (reset! uploading? true)
      ;; start uploading?
      (util/post (str config/api "presigned_url")
                 {:filename filename
                  :mime-type mime-type}
                 (fn [{:keys [presigned-url s3-object-key] :as resp}]
                   (if presigned-url
                     (util/upload presigned-url
                                  file
                                  (fn [_result]
                                    ;; request cdn signed url
                                    (util/post (str config/api "signed_url")
                                               {:s3-object-key s3-object-key}
                                               (fn [{:keys [signed-url]}]
                                                 (reset! uploading? false)
                                                 (if signed-url
                                                   (do
                                                     (url-handler signed-url))
                                                   (prn "Something error, can't get a valid signed url.")))
                                               (fn [error]
                                                 (reset! uploading? false)
                                                 (prn "Something error, can't get a valid signed url."))))
                                  (fn [error]
                                    (reset! uploading? false)
                                    (prn "upload failed.")
                                    (js/console.dir error))
                                  (fn [e]
                                    (on-processing e)))
                     ;; TODO: notification, or re-try
                     (do
                       (reset! uploading? false)
                       (prn "failed to get any presigned url, resp: " resp))))
                 (fn [_error]
                   ;; (prn "Get token failed, error: " error)
                   (reset! uploading? false))))))
