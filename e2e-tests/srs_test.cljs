(ns srs-test
  (:require [clojure.test :as t :refer [deftest is async use-fixtures]]
            ["playwright$default" :refer [chromium]]
            [clojure.string :as str]
            [promesa.core :as p]))

;; TODO: Setup helpers and an electron test using fixture.fs for examples
;; See https://github.com/babashka/nbb#what-does-default-mean for syntax
;; https://shadow-cljs.github.io/docs/UsersGuide.html#_using_npm_packages may also
;; help but be warned we aren't using shadow-cljs here

;; Move to test-helper when this works for electron
(def browser (atom nil))
(def headless (boolean (.-CI js/process.env)))
(defn launch-browser []
  (p/->> (.launch chromium #js {:headless headless})
         (reset! browser)))
(def close-browser true)

;; Tests
(use-fixtures :once
  {:before
   (fn []
     (async done
            (->
             (launch-browser)
             (.catch js/console.log)
             (.finally done))))
   :after
   (fn []
     (async done
            (if close-browser
              (p/do
                (.close @browser)
                (done))
              (done))))})

;; Example test copied from https://github.com/babashka/nbb/blob/main/examples/playwright/example.cljs
(deftest example-test
  (async
   done
   (-> (p/let [page (.newPage @browser)
            _ (.goto page "https://clojure.org" #js{:waitUntil "networkidle"})
            _ (-> (.screenshot page #js{:path "screenshot.png"})
                  (.catch #(js/console.log %)))
            content (.content page)
            ;; uncomment to save content to variable for inspection
            ;; _ (def c content)
            ;; uncomment to pause execution to inspect state in browser
            ;; _ (pause)
            ]
           (is (str/includes? content "clojure")))
       (.catch (fn [err]
                 (js/console.log err)
                 (is false)))
       (.finally done))))
