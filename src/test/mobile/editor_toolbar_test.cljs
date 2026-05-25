(ns mobile.editor-toolbar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.commands :as commands]
            [frontend.context.i18n :as i18n]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.state :as state]
            [mobile.components.editor-toolbar :as editor-toolbar]))

(deftest mobile-toolbar-has-separate-photo-and-file-upload-actions
  (testing "the mobile toolbar keeps photo upload and adds generic file upload"
    (let [steps (atom [])
          photos (atom [])]
      (with-redefs [i18n/t (fn [k & _args] k)
                    state/get-edit-input-id (constantly "edit-input")
                    state/get-editor-args (constantly nil)
                    mobile-camera/embed-photo (fn [id]
                                                (swap! photos conj id))
                    commands/handle-step (fn [step format]
                                           (swap! steps conj [step format]))]
        (let [actions (:main (#'editor-toolbar/toolbar-actions))
              photo-action (some #(when (= "camera" (:id %)) %) actions)
              upload-action (some #(when (= "upload-asset" (:id %)) %) actions)]
          (is (some? photo-action))
          (is (some? upload-action))
          (is (= :mobile.toolbar/photo (:title photo-action)))
          (is (= :editor.slash/upload-asset (:title upload-action)))
          (when photo-action
            ((:handler photo-action))
            (is (= ["edit-input"] @photos)))
          (when upload-action
            ((:handler upload-action))
            (is (= [[[:editor/click-hidden-file-input :id] nil]]
                   @steps))))))))
