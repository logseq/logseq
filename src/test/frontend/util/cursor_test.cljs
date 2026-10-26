(ns frontend.util.cursor-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.cursor :as cursor]
            [goog.object :as gobj]))

(deftest move-cursor-without-an-editor-is-a-no-op
  (testing "a shortcut that runs after its editor left the DOM gets a nil input and must not throw"
    (is (nil? (cursor/move-cursor-to nil 3)))
    (is (nil? (cursor/move-cursor-to-end nil)) "alt+e (end of block)")
    (is (nil? (cursor/move-cursor-to-start nil)) "alt+a (beginning of block)")))

(deftest move-cursor-to-sets-the-selection
  (let [calls (atom [])
        input #js {:value "abc"
                   :setSelectionRange (fn [s e] (swap! calls conj [s e]))
                   :focus (fn [] (swap! calls conj :focus))}
        original-document (gobj/get js/globalThis "document")]
    ;; the node test runner has no DOM: a document whose focused element is the input
    (gobj/set js/globalThis "document" #js {:activeElement input})
    (try
      (cursor/move-cursor-to-end input)
      (is (= [[3 3]] @calls) "the cursor goes to the end of the text of the focused input")
      (finally
        (if (some? original-document)
          (gobj/set js/globalThis "document" original-document)
          (gobj/remove js/globalThis "document"))))))
