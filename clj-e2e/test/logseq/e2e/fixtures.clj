(ns logseq.e2e.fixtures
  (:require [com.climate.claypoole :as cp]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.config :as config]
            [logseq.e2e.const :refer [*page1 *page2 *graph-name*]]
            [logseq.e2e.custom-report :as custom-report]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.page :as page]
            [logseq.e2e.playwright-page :as pw-page]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.settings :as settings]
            [logseq.e2e.sync-server :as sync-server]
            [logseq.e2e.util :as util]
            [wally.main :as w])
  (:import (com.microsoft.playwright Page$NavigateOptions)
           (com.microsoft.playwright.options WaitUntilState)))

(def ^:private first-load-timeout-ms
  "The first load in a new browser context is cold: the browser downloads
  and compiles the app's JS, and the app creates a graph before it shows the
  header. It gets a long limit of its own, which only catches an app that
  never shows up. The strict checks run on the reload in
  `settings/refresh-test-env!`."
  60000)

(defn- open-app!
  [port]
  ;; returns once the server answers; the wait below covers the whole load
  (.navigate (w/get-page) (pw-page/get-test-url port)
             (doto (Page$NavigateOptions.) (.setWaitUntil WaitUntilState/COMMIT)))
  (w/wait-for "#search-button" {:timeout first-load-timeout-ms}))

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
      (settings/install-init-script! (.context (w/get-page)))
      (w/grant-permissions :clipboard-write :clipboard-read)
      (open-app! port)
      (settings/developer-mode)
      (settings/refresh-test-env!)
      (let [p (w/get-page)]
        (.onConsoleMessage p (fn [msg]
                               (when custom-report/*pw-page->console-logs*
                                 (swap! custom-report/*pw-page->console-logs* update p conj (.text msg))))))
      (f))))

(defn open-2-pages
  "Use `*page1` and `*page2` in `f`.

  Both pages are pointed at the shared local db-sync server and logged in as
  the injected test account before first navigation, so RTC tests never talk
  to api.logseq.io or Cognito."
  [f & {:keys [headless port]}]
  (let [headless (or headless @config/*headless)
        page-opts {:headless headless
                   :persistent false
                   :slow-mo @config/*slow-mo}
        sync (sync-server/test-login)
        _ (sync-server/seed-remote-graph! sync)
        p1 (w/make-page page-opts)
        p2 (w/make-page page-opts)]
    (run! #(settings/install-init-script! (.context @%) sync) [p1 p2])
    (reset! *page1 p1)
    (reset! *page2 p2)
    (binding [custom-report/*pw-contexts* (set [(.context @p1) (.context @p2)])
              custom-report/*pw-page->console-logs* (atom {})
              w/*page* (delay (throw (ex-info "Don't use *page*, use *page1* and *page2* instead" {})))]
      (run!
       #(w/with-page %
          (w/grant-permissions :clipboard-write :clipboard-read)
          (open-app! (or port @config/*port))
          (settings/developer-mode)
          (settings/refresh-test-env!)
          ;; The first page sets the account's remote-graphs password; the
          ;; second then finds RSA keys already on the server and goes straight
          ;; to the loaded remote list.
          (graph/ensure-remote-graphs-loaded)
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
      (settings/install-init-script! ctx)
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
  (when (w/visible? ".cp__right-sidebar.open")
    (w/click ".toggle-right-sidebar")
    (w/wait-for-not-visible ".cp__right-sidebar.open"))
  (w/eval-js
   "() => {
      const url = new URL(location.href);
      url.searchParams.delete('virtualized');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }")
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
        (settings/refresh-test-env!)
        (util/login-test-account))
     [@*page1 @*page2])
    (w/with-page @*page1
      (graph/new-graph graph-name true false))
    (w/with-page @*page2
      (graph/wait-for-remote-graph graph-name)
      (graph/switch-graph graph-name true true))

    (binding [custom-report/*preserve-graph* false
              *graph-name* graph-name]
      (f)
      ;; cleanup
      (if custom-report/*preserve-graph*
        (println "Don't remove graph: " graph-name)
        (w/with-page @*page2
          (graph/remove-remote-graph graph-name))))))
