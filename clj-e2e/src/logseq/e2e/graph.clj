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

(def ^:private e2ee-password-modal ".e2ee-password-modal-content")
(def ^:private e2ee-new-password-input (str e2ee-password-modal " input[placeholder=\"Enter password\"]"))
(def ^:private e2ee-new-password-confirm-input (str e2ee-password-modal " input[placeholder=\"Enter password again\"]"))
(def ^:private e2ee-password-input (str e2ee-password-modal " .ls-toggle-password-input input"))
(def ^:private e2ee-password-submit (str e2ee-password-modal " button:text(\"Submit\")"))
(def ^:private cloud-ready-indicator "button.cloud.on.idle")

(defn- input-e2ee-password
  []
  (if (w/visible? e2ee-new-password-confirm-input)
    (do
      (w/click e2ee-new-password-input)
      (util/input "e2etest")
      (w/click e2ee-new-password-confirm-input)
      (util/input "e2etest"))
    (do
      (w/click (.first (w/-query e2ee-password-input)))
      (util/input "e2etest")))
  (w/click e2ee-password-submit)
  (w/wait-for-not-visible e2ee-password-modal))

(defn- maybe-input-e2ee-password
  []
  ;; Password input prompt is optional for accounts with already initialized keys/password.
  (loop [remaining-ms 20000]
    (cond
      (w/visible? e2ee-password-modal)
      (input-e2ee-password)

      (w/visible? cloud-ready-indicator)
      nil

      (<= remaining-ms 0)
      nil

      :else
      (do
        (util/wait-timeout 250)
        (recur (- remaining-ms 250))))))

(defn- new-graph-helper
  [graph-name enable-sync?]
  (util/search-and-click "Add a DB graph")
  (w/wait-for "h2:text(\"Create a new graph\")")
  (w/click "input[placeholder=\"your graph name\"]")
  (util/input graph-name)
  (when enable-sync?
    (w/wait-for "button#rtc-sync" {:timeout 3000})
    (w/click "button#rtc-sync"))

  (w/click "button:not([disabled]):text(\"Submit\")")

  (when enable-sync?
    (maybe-input-e2ee-password)
    (w/wait-for cloud-ready-indicator {:timeout 20000}))

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
    (when need-input-password? (maybe-input-e2ee-password))
    (w/wait-for cloud-ready-indicator {:timeout 20000}))
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
