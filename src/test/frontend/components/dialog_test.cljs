(ns frontend.components.dialog-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.shui.dialog.core :as shui-dialog]))

(defn- fake-open-change-event
  [reason]
  (let [native #js {:defaultPrevented false}
        details #js {:reason reason
                     :event native
                     :isCanceled false}]
    (set! (.-preventDefault native)
          (fn []
            (set! (.-defaultPrevented native) true)))
    (set! (.-cancel details)
          (fn []
            (set! (.-isCanceled details) true)))
    details))

(defn- open-test-dialog!
  [id]
  (shui-dialog/open! [:div "delete confirm"] {:id id}))

(deftest opening-outside-press?-test
  (testing "the completing click of an opening pointer-down is ignored"
    (is (true? (#'shui-dialog/opening-outside-press? "outside-press" 200 100))))
  (testing "later outside presses still dismiss"
    (is (false? (#'shui-dialog/opening-outside-press? "outside-press" 100 200))))
  (testing "non outside-press reasons are unchanged"
    (is (false? (#'shui-dialog/opening-outside-press? "escape-key" 200 100)))))

(deftest open!-records-ignore-opening-outside-press-until-test
  (let [id :dialog-open-ignore-until]
    (try
      (open-test-dialog! id)
      (let [[_ config] (shui-dialog/get-dialog id)
            until (:ignore-opening-outside-press-until config)]
        (is (true? (shui-dialog/has-dialog?)))
        (is (number? until))
        (is (< (js/Date.now) until)))
      (finally
        (shui-dialog/close-all!)))))

(deftest dialog-stays-open-on-opening-outside-press-test
  (let [id :dialog-opening-outside-press]
    (try
      (open-test-dialog! id)
      (let [[_ config] (shui-dialog/get-dialog id)
            e (fake-open-change-event "outside-press")]
        (#'shui-dialog/on-root-open-change config false e)
        (is (true? (shui-dialog/has-dialog?))
            "the pointerup/click that finishes the opening press must not close the dialog")
        (is (true? (.-isCanceled e))))
      (finally
        (shui-dialog/close-all!)))))

(deftest dialog-closes-on-later-outside-press-test
  (let [id :dialog-later-outside-press]
    (try
      (open-test-dialog! id)
      (let [[_ config] (shui-dialog/get-dialog id)
            e (fake-open-change-event "outside-press")]
        (#'shui-dialog/on-root-open-change
         (assoc config :ignore-opening-outside-press-until 0)
         false
         e)
        (is (false? (shui-dialog/has-dialog?))
            "a later outside press should still dismiss the dialog"))
      (finally
        (shui-dialog/close-all!)))))
