(ns logseq.e2e.custom-report
  (:require [clojure.stacktrace :as stack]
            [clojure.string :as string]
            [clojure.test :as t]
            [logseq.e2e.playwright-page :as pw-page])
  (:import (com.microsoft.playwright Page$ScreenshotOptions)))

(def ^:dynamic *pw-contexts*
  "Set of pw-contexts.
  record all playwright contexts in this dynamic var"
  nil)

(defn- screenshot
  [page test-name]
  (println :screenshot test-name)
  (.screenshot
   page
   (-> (Page$ScreenshotOptions.)
       (.setPath (java.nio.file.Paths/get "e2e-dump/"
                                          (into-array [(format "./screenshot-%s-%s.png" test-name (System/currentTimeMillis))]))))))

(defmethod t/report :error
  [m]
  ;; copy from default impl
  (t/with-test-out
    (t/inc-report-counter :error)
    (println "\nERROR in" (t/testing-vars-str m))
    (when (seq t/*testing-contexts*) (println (t/testing-contexts-str)))
    (when-let [message (:message m)] (println message))
    (println "expected:" (pr-str (:expected m)))
    (print "  actual: ")
    (let [actual (:actual m)]
      (if (instance? Throwable actual)
        (stack/print-cause-trace actual t/*stack-trace-depth*)
        (prn actual))))

  ;; screenshot for all pw pages when :error
  (when-let [all-contexts (seq *pw-contexts*)]
    (doseq [page (mapcat pw-page/get-pages all-contexts)]
      (screenshot page (string/join "-" (map (comp str :name meta) t/*testing-vars*))))))
