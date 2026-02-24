(ns frontend.mobile.camera-test
  (:require [cljs.test :refer [is testing]]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.state :as state]
            [frontend.test.helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(deftest-async embed-photo-uses-provided-id
  (testing "Uses explicit editor id so capture/upload still works if focused input id is temporarily nil"
    (let [upload-id (atom nil)]
      (p/with-redefs
       [mobile-camera/take-or-choose-photo (fn [] (p/resolved #js {:name "photo.jpeg"}))
        state/get-edit-block (constantly {:block/format :markdown})
        editor-handler/upload-asset! (fn [id _files _format _uploading? _drop-or-paste?]
                                       (reset! upload-id id)
                                       (p/resolved nil))]
        (p/let [_ (mobile-camera/embed-photo "editor-id")]
          (is (= "editor-id" @upload-id)))))))

(deftest-async embed-photo-skips-upload-when-no-photo
  (testing "Doesn't trigger upload pipeline when camera returns nil photo"
    (let [upload-called? (atom false)]
      (p/with-redefs
       [mobile-camera/take-or-choose-photo (fn [] (p/resolved nil))
        state/get-edit-block (constantly {:block/format :markdown})
        editor-handler/upload-asset! (fn [& _]
                                       (reset! upload-called? true)
                                       (p/resolved nil))]
        (p/let [_ (mobile-camera/embed-photo "editor-id")]
          (is (false? @upload-called?)))))))

(deftest-async embed-photo-still-allows-photo-picking-when-camera-permission-denied
  (testing "Does not pre-block getPhoto by camera permission so users can still pick existing photos"
    (let [upload-called? (atom false)
          get-photo-called? (atom false)
          warning (atom nil)]
      (p/with-redefs
       [mobile-camera/*camera-get-photo* (fn [_]
                                           (reset! get-photo-called? true)
                                           (p/resolved #js {:base64String "AA=="}))
        state/get-edit-block (constantly {:block/format :markdown})
        notification/show! (fn [content & _]
                             (reset! warning content))
        editor-handler/upload-asset! (fn [& _]
                                       (reset! upload-called? true)
                                       (p/resolved nil))]
        (p/let [_ (mobile-camera/embed-photo "editor-id")]
          (is (true? @get-photo-called?))
          (is (true? @upload-called?))
          (is (nil? @warning)))))))

(deftest-async embed-photo-warns-only-for-camera-denied
  (testing "Shows camera warning only for camera denied errors, not photo-library denied"
    (let [warning (atom nil)]
      (p/with-redefs
       [mobile-camera/*camera-get-photo* (fn [_]
                                           (p/rejected (js/Error. "User denied access to photos")))
        state/get-edit-block (constantly {:block/format :markdown})
        notification/show! (fn [content & _]
                             (reset! warning content))
        editor-handler/upload-asset! (fn [& _] (p/resolved nil))]
        (p/let [_ (mobile-camera/embed-photo "editor-id")]
          (is (nil? @warning)))))))

(deftest-async embed-photo-warns-when-camera-access-denied
  (testing "Shows camera warning when take picture is denied by camera permission"
    (let [warning (atom nil)]
      (p/with-redefs
       [mobile-camera/*camera-get-photo* (fn [_]
                                           (p/rejected (js/Error. "User denied access to camera")))
        state/get-edit-block (constantly {:block/format :markdown})
        notification/show! (fn [content & _]
                             (reset! warning content))
        editor-handler/upload-asset! (fn [& _] (p/resolved nil))]
        (p/let [_ (mobile-camera/embed-photo "editor-id")]
          (is (string? @warning))
          (is (re-find #"Settings" @warning)))))))
