(ns frontend.handler.editor-move-select-test
  "Shift+Up/Down and Up/Down on selected blocks wait for a running
  Alt+Shift+Up/Down to reselect the moved rows: before that the selection holds
  the rows drawn before the move, which are no longer in the page, and the key
  found no neighbour."
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest selection-keys-wait-for-a-pending-move-test
  (async done
         (let [calls (atom [])
               settle! (atom nil)
               pending (p/create (fn [resolve _reject] (reset! settle! resolve)))
               tail @#'editor/*move-up-down-tail]
           (reset! tail pending)
           (-> (p/with-redefs [util/stop (fn [_e] nil)
                               state/pub-event! (fn [_event] nil)
                               state/editing? (constantly false)
                               state/selection? (constantly true)
                               state/get-timestamp-block (constantly nil)
                               editor/auto-complete? (constantly false)
                               editor/in-page-preview? (constantly false)
                               editor/focus-in-shui-popup? (constantly false)
                               editor/select-block-up-down (fn [direction] (swap! calls conj [:extend direction]))
                               editor/select-up-down (fn [direction] (swap! calls conj [:move direction]))]
                 ;; p/with-redefs awaits each form, and a key waits for the
                 ;; move settled below: drop what the keys return
                 (do ((editor/shortcut-select-up-down :down) #js {})
                     ((editor/on-select-block :up) #js {})
                     ((editor/shortcut-up-down :down) #js {})
                     nil)
                 (is (empty? @calls)
                     "no selection key acts while the move has not reselected its rows")
                 (@settle! nil)
                 (p/delay 0))
               (p/then (fn [_]
                         (is (= #{[:extend :down] [:extend :up] [:move :down]} (set @calls))
                             "each key acts once the move settles")))
               (p/finally (fn []
                            (reset! tail nil)
                            (done)))))))

(deftest selection-keys-act-at-once-without-a-move-test
  (let [calls (atom [])]
    (reset! @#'editor/*move-up-down-tail nil)
    (with-redefs [util/stop (fn [_e] nil)
                  state/editing? (constantly false)
                  editor/select-block-up-down (fn [direction] (swap! calls conj direction))]
      ((editor/shortcut-select-up-down :down) #js {})
      (is (= [:down] @calls) "no move running: Shift+Down extends the selection right away"))))
