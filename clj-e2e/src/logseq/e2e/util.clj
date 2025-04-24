(ns logseq.e2e.util
  (:refer-clojure :exclude [type])
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [wally.main :as w]
            [wally.selectors :as ws])
  (:import [com.microsoft.playwright TimeoutError]
           [com.microsoft.playwright.assertions PlaywrightAssertions]))

(def assert-that PlaywrightAssertions/assertThat)

(defn wait-timeout
  [ms]
  (.waitForTimeout (w/get-page) ms))

(defn get-active-element
  []
  (w/-query "*:focus"))

(defn get-editor
  []
  (let [klass ".editor-wrapper textarea"
        editor (w/-query klass)]
    (when (w/visible? klass)
      editor)))

(defn get-edit-block-container
  []
  (first (w/query ".ls-block" {:has (w/-query ".editor-wrapper textarea")})))

(defn input
  "Notice this will replace the existing input value with `text`"
  [text]
  (w/fill "*:focus" text))

(defn type
  [text]
  (let [input-node (w/-query "*:focus")]
    (.type input-node text)))

(def press w/keyboard-press)

(defn cmdk
  [input-text]
  (press "ControlOrMeta+k")
  (input input-text))

(defn search
  [text]
  (w/click :#search-button)
  (w/fill ".cp__cmdk-search-input" text))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  (search title)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  (w/wait-for ".editor-wrapper textarea"))

(defn count-elements
  [q]
  (w/count* (w/-query q)))

(defn blocks-count
  "Blocks count including page title"
  []
  (count-elements ".ls-block"))

(defn page-blocks-count
  []
  (count-elements ".ls-page-blocks .ls-block"))

(defn new-block
  [title]
  (press "Enter")
  (input title))

(defn save-block
  [text]
  (input text))

(defn exit-edit
  []
  (press "Escape"))

(defn delete-blocks
  "Delete the current block if in editing mode, otherwise, delete all the selected blocks."
  []
  (let [editor (get-editor)]
    (when editor (exit-edit))
    (press "Backspace")))

(defn get-text
  [locator]
  (if (string? locator)
    (.textContent (w/-query locator))
    (.textContent locator)))

(defn get-edit-content
  []
  (when-let [editor (get-editor)]
    (get-text editor)))

;; TODO: support tree
(defn new-blocks
  [titles]
  (let [value (get-edit-content)]
    (if (string/blank? value)           ; empty block
      (do
        (save-block (first titles))
        (doseq [title (rest titles)]
          (new-block title)))
      (doseq [title titles]
        (new-block title)))))

(defn bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn indent-outdent
  [indent?]
  (let [editor (get-editor)
        [x1 _] (bounding-xy editor)
        _ (press (if indent? "Tab" "Shift+Tab"))
        [x2 _] (bounding-xy editor)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(defn indent
  []
  (indent-outdent true))

(defn outdent
  []
  (indent-outdent false))

(defn open-last-block
  []
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (press shortcut)))

(defn get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block .block-title-wrap"))

(def mac? (= "Mac OS X" (System/getProperty "os.name")))

(def mod-key (if mac? "Meta" "Control"))

(defn login-test-account
  [& {:keys [username password]
      :or {username "e2etest"
           password "Logseq-e2e"}}]
  (w/eval-js "localStorage.setItem(\"login-enabled\",true);")
  (w/click "button[title=\"More\"]")
  (w/click "div:text(\"Login\")")
  (input username)
  (press "Tab")
  (input password)
  (w/click "button[type=\"submit\"]:text(\"Sign in\")")
  (w/wait-for-not-visible ".cp__user-login"))

(defn new-graph
  [graph-name enable-sync?]
  (cmdk "add a db graph")
  (w/click (w/get-by-label "Add a DB graph"))
  (w/wait-for "h2:text(\"Create a new graph\")")
  (w/click "input[placeholder=\"your graph name\"]")
  (input graph-name)
  (when enable-sync?
    (w/click "button#rtc-sync"))
  (w/click "button:text(\"Submit\")")
  (when enable-sync?
    (w/wait-for "button.cloud.on.idle" {:timeout 20000})))

(defn wait-for-remote-graph
  [graph-name]
  (cmdk "all graphs")
  (w/click (w/get-by-label "Go to all graphs"))
  (let [max-try 5]
    (loop [i 0]
      (prn :wait-for-remote-graph-try i)
      (w/click "span:text(\"Refresh\")")
      (let [succ?
            (try
              (w/wait-for (str "span:has-text(\"" graph-name "\")"))
              true
              (catch TimeoutError e
                (if (= max-try i)
                  (throw e)
                  false)))]
        (when-not succ? (recur (inc i)))))))
