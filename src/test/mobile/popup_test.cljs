(ns mobile.popup-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [mobile.components.popup :as popup]
            [mobile.state :as mobile-state]))

(deftest native-sheet-is-presented-after-popup-content-renders
  (testing "the WebView is not moved before React can render the popup"
    (let [original-raf (.-requestAnimationFrame js/window)
          raf-callbacks (atom [])
          presented-data (atom [])
          plugin #js {:present (fn [data]
                                 (swap! presented-data conj
                                        {:data data
                                         :popup-data @mobile-state/*popup-data}))}]
      (set! (.-requestAnimationFrame js/window)
            (fn [callback]
              (swap! raf-callbacks conj callback)))
      (reset! mobile-state/*popup-data nil)
      (reset! mobile-state/*popup-presenting? false)
      (reset! popup/*pending-native-sheet-data nil)
      (try
        (with-redefs [mobile-util/native-bottom-sheet plugin
                      state/pub-event! (fn [& _])]
          (popup/popup-show! nil (fn [] [:div "Settings"]) {})

          (is (some? @mobile-state/*popup-data))
          (is (empty? @presented-data))
          (is (empty? @raf-callbacks))

          (popup/present-native-sheet-after-render!
           @mobile-state/*popup-data)
          (is (= 1 (count @raf-callbacks)))

          (when-let [first-frame (first @raf-callbacks)]
            (first-frame)
            (is (empty? @presented-data))
            (is (= 2 (count @raf-callbacks))))

          (when-let [second-frame (second @raf-callbacks)]
            (second-frame)
            (is (= @mobile-state/*popup-data
                   (:popup-data (first @presented-data))))))
        (finally
          (set! (.-requestAnimationFrame js/window) original-raf)
          (reset! mobile-state/*popup-data nil)
          (reset! mobile-state/*popup-presenting? false)
          (reset! popup/*pending-native-sheet-data nil))))))

(deftest cancelled-popup-is-not-presented
  (let [original-raf (.-requestAnimationFrame js/window)
        raf-callbacks (atom [])
        present-count (atom 0)
        dismiss-count (atom 0)
        plugin #js {:present (fn [_]
                               (swap! present-count inc))
                    :dismiss (fn [_]
                               (swap! dismiss-count inc))}]
    (set! (.-requestAnimationFrame js/window)
          (fn [callback]
            (swap! raf-callbacks conj callback)))
    (reset! mobile-state/*popup-data nil)
    (reset! mobile-state/*popup-presenting? false)
    (reset! popup/*pending-native-sheet-data nil)
    (try
      (with-redefs [mobile-util/native-bottom-sheet plugin
                    state/pub-event! (fn [& _])]
        (popup/popup-show! nil (fn [] [:div "Settings"]) {})
        (popup/present-native-sheet-after-render!
         @mobile-state/*popup-data)
        (popup/popup-hide!)
        (when-let [first-frame (first @raf-callbacks)]
          (first-frame))
        (when-let [second-frame (second @raf-callbacks)]
          (second-frame))
        (is (zero? @present-count))
        (is (zero? @dismiss-count))
        (is (nil? @mobile-state/*popup-data)))
      (finally
        (set! (.-requestAnimationFrame js/window) original-raf)
        (reset! mobile-state/*popup-data nil)
        (reset! mobile-state/*popup-presenting? false)
        (reset! popup/*pending-native-sheet-data nil)))))

(deftest native-sheet-content-ready-follows-popup-render
  (testing "the native sheet waits until its WebView content has painted"
    (let [original-raf (.-requestAnimationFrame js/window)
          raf-callbacks (atom [])
          content-ready-count (atom 0)
          plugin #js {:contentReady (fn [_]
                                      (swap! content-ready-count inc))}]
      (set! (.-requestAnimationFrame js/window)
            (fn [callback]
              (swap! raf-callbacks conj callback)))
      (reset! mobile-state/*popup-presenting? false)
      (try
        (with-redefs [mobile-util/native-bottom-sheet plugin]
          (#'popup/handle-native-sheet-state! #js {:presenting true})

          (is @mobile-state/*popup-presenting?)
          (is (zero? @content-ready-count))
          (is (= 1 (count @raf-callbacks)))

          (when-let [first-frame (first @raf-callbacks)]
            (first-frame)
            (is (zero? @content-ready-count))
            (is (= 2 (count @raf-callbacks))))

          (when-let [second-frame (second @raf-callbacks)]
            (second-frame)
            (is (= 1 @content-ready-count))))
        (finally
          (set! (.-requestAnimationFrame js/window) original-raf)
          (reset! mobile-state/*popup-presenting? false))))))

(deftest opening-popup-inside-presented-native-sheet-replaces-content
  (testing "a nested popup reuses the presented sheet instead of revealing the app layer"
    (let [content-fn (fn [] [:div "Login"])
          plugin #js {}]
      (reset! mobile-state/*popup-data {:open? true
                                        :content-fn (fn [] [:div "Settings"])
                                        :opts {}})
      (reset! mobile-state/*popup-presenting? true)
      (reset! popup/*pending-native-sheet-data nil)
      (try
        (with-redefs [mobile-util/native-bottom-sheet plugin
                      state/pub-event! (fn [& _])]
          (popup/popup-show! nil content-fn {:id :login})

          (is @mobile-state/*popup-presenting?)
          (is (nil? @popup/*pending-native-sheet-data))
          (is (= content-fn (:content-fn @mobile-state/*popup-data)))
          (is (:replace-presented? @mobile-state/*popup-data)))
        (finally
          (reset! mobile-state/*popup-data nil)
          (reset! mobile-state/*popup-presenting? false)
          (reset! popup/*pending-native-sheet-data nil))))))
