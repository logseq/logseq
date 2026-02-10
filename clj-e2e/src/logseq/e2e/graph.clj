(ns logseq.e2e.graph
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn- refresh-all-remote-graphs
  []
  (w/click "span:text(\"Refresh\")"))

(defn goto-all-graphs
  []
  (util/search-and-click "Go to all graphs"))

(defn- input-e2ee-password
  []
  (try
    (w/wait-for "input[type=\"password\"]" {:timeout 20000})
    ;; The E2EE password dialog can be either:
    ;; - a single password input (unlock / confirm), or
    ;; - two inputs (set password + confirm password).
    ;; Playwright strict mode will explode if we `click` by selector, so we
    ;; always target specific elements.
    (let [inputs (vec (w/query "input[type=\"password\"]"))]
      (doseq [input (take 2 inputs)]
        (.click input)
        (util/input "e2etest")))
    (w/click "button:text(\"Submit\")")
    (catch com.microsoft.playwright.TimeoutError _e
      ;; Some transitions (especially re-downloading a graph) won't prompt
      ;; for a password if it's already been set for this session.
      nil)))

(defn- new-graph-helper
  [graph-name enable-sync?]
  (util/search-and-click "Add a DB graph")
  (w/wait-for "h2:text(\"Create a new graph\")")
  (w/click "input[placeholder=\"your graph name\"]")
  (util/input graph-name)
  (when enable-sync?
    (w/wait-for "button#rtc-sync" {:timeout 3000})
    (w/click "button#rtc-sync")
    (input-e2ee-password)
    (w/wait-for "button.cloud.on.idle" {:timeout 60000}))
  (when-not enable-sync?
    (w/click "button:not([disabled]):text(\"Submit\")"))
  ;; new graph can blocks the ui because the db need to be created and restored,
  ;; I have no idea why `search-and-click` failed to auto-wait sometimes.
  (util/wait-timeout 1000))

(defn new-graph
  [graph-name enable-sync?]
  (try
    (new-graph-helper graph-name enable-sync?)
    (catch com.microsoft.playwright.TimeoutError e
      ;; sometimes, 'Use Logseq Sync?' option not showing
      ;; because of user-group not recv from server yet
      ;; workaround: try again
      (if enable-sync?
        (do (w/click "button.ui__dialog-close")
            (new-graph-helper graph-name enable-sync?))
        (throw e)))))

(defn wait-for-remote-graph
  [graph-name]
  (goto-all-graphs)
  (util/repeat-until-visible 5
                             (format "div[data-testid='logseq_db_%s']" graph-name)
                             refresh-all-remote-graphs))

(defn remove-local-graph
  [graph-name]
  (wait-for-remote-graph graph-name)
  (let [action-btn
        (.first (w/-query (format "div[data-testid='logseq_db_%s'] .graph-action-btn" graph-name)))]
    (w/click action-btn)
    (w/click ".delete-local-graph-menu-item")
    (w/click "div[role='alertdialog'] button:text('ok')")))

(defn remove-remote-graph
  [graph-name]
  (wait-for-remote-graph graph-name)
  (let [action-btn
        (.first (w/-query (format "div[data-testid='logseq_db_%s'] .graph-action-btn" graph-name)))]
    (w/click action-btn)
    (w/click ".delete-remote-graph-menu-item")
    (w/click "div[role='alertdialog'] button:text('ok')")))

(defn switch-graph
  [to-graph-name wait-sync? need-input-password?]
  (goto-all-graphs)
  (w/click (.last (w/-query (format "div[data-testid='logseq_db_%1$s'] span:has-text('%1$s')" to-graph-name))))
  (when wait-sync?
    (when need-input-password? (input-e2ee-password))
    (w/wait-for "button.cloud.on.idle" {:timeout 60000}))
  (assert/assert-graph-loaded?))

(defn validate-graph
  []
  (k/esc)
  (k/esc)
  (util/search-and-click "(Dev) Validate current graph")
  (assert/assert-is-visible (loc/and ".notifications div.notification-success div" (w/get-by-text "Your graph is valid")))
  (let [content (.textContent (loc/and ".notifications div.notification-success div" (w/get-by-text "Your graph is valid")))
        summary (edn/read-string (subs content (string/index-of content "{")))]
    (w/click ".notifications div.notification-success .ls-icon-x")
    summary))
