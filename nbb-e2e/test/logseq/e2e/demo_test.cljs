(ns logseq.e2e.demo-test
  (:require ["playwright$default" :as pw]
            ["playwright/test" :refer [expect]]
            [clojure.test :as t :refer [deftest async use-fixtures]]
            [promesa.core :as p]))

(def *page (atom nil))
(def *electron (atom nil))

(use-fixtures
  :once
  {:before
   #(async
     done
     (p/let [electron-app (.launch pw/_electron (clj->js {:args ["../static/electron.js"]}))
             page (.firstWindow electron-app)]
       (reset! *page page)
       (reset! *electron electron-app)
       (done)))
   :after
   #(async
     done
     (do (.close @*electron)
         (done)))})

(deftest electron-test
  (async
   done
   (p/let [page @*page
           locator (.first (.locator page ".block-title-wrap:has-text('asdf')"))
           _ (.toBeVisible (expect locator))
           c (.count locator)]
     (prn :locator locator c)
     (.click locator)
     (.press (.-keyboard page) "Escape")
     (done))))

(defn -main
  [& _args]
  (t/run-tests 'logseq.e2e.demo-test))
