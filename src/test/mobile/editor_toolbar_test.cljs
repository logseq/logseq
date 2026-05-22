(ns mobile.editor-toolbar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.commands :as commands]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.common.util.page-ref :as page-ref]
            [mobile.components.editor-toolbar :as editor-toolbar]))

(deftest comment-toolbar-actions-are-limited
  (testing "comment editing only exposes reference, photo, and audio"
    (with-redefs [state/get-editor-args (constantly [{} "edit-block-comment" {:comment-editor? true}])]
      (let [{:keys [main trailing]} (#'editor-toolbar/toolbar-actions)]
        (is (= ["page-ref" "camera" "audio"]
               (mapv :id main)))
        (is (nil? trailing))))))

(deftest comment-reference-action-inserts-page-ref
  (testing "comment reference action works without regular block editor state"
    (let [input-id "edit-block-comment"
          input #js {:value ""}
          insertions (atom [])]
      (with-redefs [editor-handler/get-state (constantly nil)
                    editor-handler/get-selection-and-format (constantly nil)
                    state/get-edit-input-id (constantly input-id)
                    state/get-input (constantly input)
                    gdom/getElement (fn [id]
                                      (when (= id input-id)
                                        input))
                    cursor/pos (constantly 0)
                    commands/simple-insert! (fn [id value opts]
                                              (swap! insertions conj
                                                     [id value (:backward-pos opts) (fn? (:check-fn opts))]))]
        ((:handler (#'editor-toolbar/page-ref-action)))
        (is (= [[input-id page-ref/left-and-right-brackets 2 true]]
               @insertions))))))
