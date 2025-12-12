(ns logseq.e2e.fixtures
  (:require [com.climate.claypoole :as cp]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.config :as config]
            [logseq.e2e.const :refer [*page1 *page2]]
            [logseq.e2e.custom-report :as custom-report]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.page :as page]
            [logseq.e2e.playwright-page :as pw-page]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.settings :as settings]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

;; TODO: save trace
;; TODO: parallel support
(defn open-page
  [f & {:keys [headless port]}]
  (w/with-page-open
    (w/make-page {:headless (or headless @config/*headless)
                  :persistent false
                  :slow-mo @config/*slow-mo})
    (w/grant-permissions :clipboard-write :clipboard-read)
    (binding [custom-report/*pw-contexts* #{(.context (w/get-page))}
              custom-report/*pw-page->console-logs* (atom {})]
      (w/navigate (pw-page/get-test-url port))
      (settings/developer-mode)
      (w/refresh)
      (assert/assert-graph-loaded?)
      (let [p (w/get-page)]
        (.onConsoleMessage p (fn [msg]
                               (when custom-report/*pw-page->console-logs*
                                 (swap! custom-report/*pw-page->console-logs* update p conj (.text msg))))))
      (f))))

(defn open-2-pages
  "Use `*page1` and `*page2` in `f`"
  [f & {:keys [headless port]}]
  (let [headless (or headless @config/*headless)
        page-opts {:headless headless
                   :persistent false
                   :slow-mo @config/*slow-mo}
        p1 (w/make-page page-opts)
        p2 (w/make-page page-opts)
        port' (or port @config/*port)]
    (reset! *page1 p1)
    (reset! *page2 p2)
    (binding [custom-report/*pw-contexts* (set [(.context @p1) (.context @p2)])
              custom-report/*pw-page->console-logs* (atom {})
              w/*page* (delay (throw (ex-info "Don't use *page*, use *page1* and *page2* instead" {})))]
      (run!
       #(w/with-page %
          (w/navigate (pw-page/get-test-url port))
          (settings/developer-mode)
          (w/refresh)
          (assert/assert-graph-loaded?)
          (let [p (w/get-page)]
            (.onConsoleMessage
             p
             (fn [msg]
               (when custom-report/*pw-page->console-logs*
                 (swap! custom-report/*pw-page->console-logs* update p conj (.text msg)))))))
       [p1 p2])
      (f))

    ;; use with-page-open to release resources
    (w/with-page-open p1)
    (w/with-page-open p2)
    (reset! *page1 nil)
    (reset! *page2 nil)))

(def ^:dynamic *pw-ctx* nil)
(defn open-new-context
  "create a new playwright-context in `*pw-ctx*`"
  [f]
  (let [page-opts {:headless @config/*headless
                   :persistent false
                   :slow-mo @config/*slow-mo}
        p @(w/make-page page-opts)
        ctx (.newContext (.browser (.context p)))]
    ;; context for p is no longer needed
    (.close (.context p))
    (w/with-page-open p)              ; use with-page-open to close playwright instance
    (binding [custom-report/*pw-contexts* #{ctx}
              *pw-ctx* ctx]
      (f)
      (.close (.browser *pw-ctx*)))))

(defonce *page-number (atom 0))

(defn create-page
  [& [page-name]]
  (let [page-name (or page-name (str "page " (swap! *page-number inc)))]
    (page/new-page page-name)
    page-name))

(defn new-logseq-page
  [f]
  (create-page)
  (f))

(defn new-logseq-page-in-rtc*
  "create a logseq page and switch to this page on both `*page1` and `*page2`"
  [& [page-name]]
  (let [*page-name (atom nil)
        {:keys [_local-tx remote-tx]}
        (w/with-page @*page1
          (rtc/with-wait-tx-updated
            (reset! *page-name (create-page page-name))))]
    (w/with-page @*page2
      (rtc/wait-tx-update-to remote-tx)
      (page/goto-page @*page-name))))

(defn new-logseq-page-in-rtc
  [f]
  (new-logseq-page-in-rtc*)
  (f))

(defn validate-graph
  [f]
  (f)
  (if (and @*page1 @*page2)
    (doseq [p [@*page1 @*page2]]
      (w/with-page p
        (graph/validate-graph)))

    (graph/validate-graph)))

(def ^:private formatter (java.time.format.DateTimeFormatter/ofPattern "yyyy-MM-dd'T'HH-mm-ss"))
(defn- inst-string
  [inst]
  (.format formatter (.atZone inst (java.time.ZoneId/of "UTC"))))

(defn prepare-rtc-graph-fixture
  "open 2 app instances, add a rtc graph, check this graph available on other instance"
  [graph-name-prefix f]
  (let [graph-name (str graph-name-prefix "-" (inst-string (java.time.Instant/now)))]
    (cp/prun!
     2
     #(w/with-page %
        (settings/developer-mode)
        (w/refresh)
        (util/login-test-account))
     [@*page1 @*page2])
    (w/with-page @*page1
      (graph/new-graph graph-name true))
    (w/with-page @*page2
      (graph/wait-for-remote-graph graph-name)
      (graph/switch-graph graph-name true))

    (binding [custom-report/*preserve-graph* false]
      (f)
      ;; cleanup
      (if custom-report/*preserve-graph*
        (println "Don't remove graph: " graph-name)
        (w/with-page @*page2
          (graph/remove-remote-graph graph-name))))))
