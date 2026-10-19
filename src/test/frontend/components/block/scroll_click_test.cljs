(ns frontend.components.block.scroll-click-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.block :as block]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.format :as editor-format]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- fake-block-element
  "A DOM-less stand-in for the .ls-block a click lands in."
  []
  #js {:tagName "DIV"
       :classList #js {:contains (fn [c] (= c "ls-block"))}
       :getElementsByClassName (fn [_] #js [])
       :parentNode nil})

(defn- click!
  "Calls the block content's pointerdown handler with a plain left click
  while :ui/scrolling? is `scrolling?`, on desktop or mobile. Resolves to
  whether the click started editing the block."
  [mobile? scrolling?]
  (let [edited (atom false)
        previous (state/get-state :ui/scrolling?)
        target (fake-block-element)
        e #js {:target target :buttons 0 :shiftKey false :ctrlKey false :metaKey false
               :clientX 10 :clientY 10
               :preventDefault (fn [])
               :stopPropagation (fn [])}
        block {:db/id 1 :block/uuid (random-uuid) :block/title "a"}]
    (state/set-state! :ui/scrolling? scrolling?)
    (-> (p/with-redefs [util/mobile? (constantly mobile?)
                        state/get-selection-blocks (constantly [])
                        state/get-selection-start-block-or-first (constantly nil)
                        state/get-edit-block (constantly nil)
                        state/set-selection-start-block! (fn [_])
                        state/set-editing! (fn [& _] (reset! edited true))
                        editor-handler/clear-selection! (fn [])
                        editor-format/unhighlight-blocks! (fn [])
                        block/comments-area-target? (constantly false)
                        block/target-forbidden-edit? (constantly false)
                        block/video-embed-target? (constantly false)
                        block/caret-range-from-point (constantly nil)
                        block/remember-block-pointer! (fn [_])]
          (#'block/block-content-on-pointer-down e block (:block/uuid block) "edit-block-1" "a" {})
          ;; set-editing! runs after a p/do! step
          (p/delay 0))
        (p/then (fn [_] @edited))
        (p/finally (fn [] (state/set-state! :ui/scrolling? previous))))))

(deftest desktop-click-while-the-page-scrolls-edits-the-block-test
  (async done
    (-> (p/let [desktop-scrolling (click! false true)
                desktop-still (click! false false)
                mobile-scrolling (click! true true)]
          ;; moving a block scrolls it into view, so the page is often still
          ;; scrolling when the next click comes: on desktop it must edit
          (is (true? desktop-scrolling) "desktop click while the page scrolls")
          (is (true? desktop-still) "desktop click with no scroll")
          ;; on mobile the touch that scrolls is not a tap
          (is (false? mobile-scrolling) "mobile touch while the page scrolls"))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))
