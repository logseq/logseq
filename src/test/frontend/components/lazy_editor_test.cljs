(ns frontend.components.lazy-editor-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.util :as util]
            [frontend.config :as config]
            [promesa.core :as p]
            [goog.async.Deferred]
            [frontend.components.lazy-editor :as lazy-editor]
            [shadow.loader :as loader]))

(deftest node-tests-bypass-the-async-code-editor-module-test
  (let [load-calls (atom [])]
    (with-redefs [loader/load (fn [& args]
                                (swap! load-calls conj args))]
      (#'lazy-editor/load-code-editor!))
    (is (empty? @load-calls))))

(deftest code-editor-waits-for-module-registration-test
  (async done
    (let [editor-atom @#'lazy-editor/*editor
          promise-atom @#'lazy-editor/*load-promise
          saved-editor @editor-atom
          saved-promise @promise-atom
          saved-loaded @lazy-editor/loaded?
          deferred (goog.async.Deferred.)
          editor (fn [& _] nil)
          finished? (atom false)
          saved-node-test util/node-test?
          saved-lsp config/lsp-enabled?
          loader-object (js/goog.module.get "shadow.loader")
          saved-load (.-load loader-object)
          registration-timer (atom nil)]
      (reset! editor-atom nil)
      (reset! promise-atom nil)
      (reset! lazy-editor/loaded? false)
      (set! util/node-test? false)
      (set! config/lsp-enabled? false)
      (set! (.-load loader-object)
            (fn [_module & [callback]]
              (when callback (.addCallback deferred callback))
              deferred))
      (-> (lazy-editor/load-code-editor!)
          (p/then (fn [_]
                    (reset! finished? true)
                    (is @lazy-editor/loaded?)
                    (is (identical? editor @editor-atom))))
          (p/catch (fn [error]
                     (reset! finished? true)
                     (is false (str "Module registration was checked before load: " error))))
          (p/finally (fn []
                       (when-let [timer @registration-timer] (js/clearTimeout timer))
                       (reset! editor-atom saved-editor)
                       (reset! promise-atom saved-promise)
                       (reset! lazy-editor/loaded? saved-loaded)
                       (set! util/node-test? saved-node-test)
                       (set! config/lsp-enabled? saved-lsp)
                       (set! (.-load loader-object) saved-load)
                       (done))))
      (reset! registration-timer
              (js/setTimeout
               (fn []
                 (is (false? @finished?) "Pending module must not finish early")
                 (lazy-editor/register-editor! editor)
                 (.callback deferred nil))
               50)))))

(deftest editor-placeholder-preserves-the-rendered-height-test
  (is (= 8133
         (#'lazy-editor/editor-placeholder-height
          #js {:height 8133}
          {:data-lang "calc"}
          (apply str (repeat 350 "1 + 2\n")))))
  (is (= 8120
         (#'lazy-editor/editor-placeholder-height
          nil
          {:data-lang "calc"}
          (apply str (repeat 350 "1 + 2\n")))))
  (is (= 1024
         (#'lazy-editor/editor-placeholder-height
          nil
          {:data-lang "clojure"}
          (apply str (repeat 350 "1 + 2\n"))))))
