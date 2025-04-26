(ns logseq.e2e.util
  (:refer-clojure :exclude [type])
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [wally.main :as w]
            [wally.selectors :as ws])
  (:import [com.microsoft.playwright TimeoutError]))

(defn repeat-until-visible
  [n q repeat-fn]
  (when-not (w/visible? q)
    (loop [i n]
      (repeat-fn)
      (let [visible?
            (try
              (assert/assert-is-visible q)
              (catch TimeoutError e
                (if (zero? i)
                  (throw e)
                  false)))]
        (when-not visible?
          (recur (dec i)))))))

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

(defn double-esc
  "Exits editing mode and ensure there's no action bar"
  []
  (k/esc)
  (k/esc))

(defn search
  [text]
  (double-esc)
  (assert/assert-in-normal-mode?)
  (w/click :#search-button)
  (w/fill ".cp__cmdk-search-input" text))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  ;; (repl/pause)
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
  (k/enter)
  (input title))

(defn save-block
  [text]
  (input text))

(defn exit-edit
  []
  (k/esc))

(defn delete-blocks
  "Delete the current block if in editing mode, otherwise, delete all the selected blocks."
  []
  (let [editor (get-editor)]
    (when editor (exit-edit))
    (k/backspace)))

(defn get-text
  [locator]
  (if (string? locator)
    (.textContent (w/-query locator))
    (.textContent locator)))

(defn get-edit-content
  []
  (when-let [editor (get-editor)]
    (get-text editor)))

(defn bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn indent-outdent
  [indent?]
  (let [editor (get-editor)
        [x1 _] (bounding-xy editor)
        _ (if indent? (k/tab) (k/shift+tab))
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
  (double-esc)
  (assert/assert-in-normal-mode?)
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

;; TODO: support tree
(defn new-blocks
  [titles]
  (open-last-block)
  (let [value (get-edit-content)]
    (if (string/blank? value)           ; empty block
      (do
        (save-block (first titles))
        (doseq [title (rest titles)]
          (new-block title)))
      (doseq [title titles]
        (new-block title)))))

(defn repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (k/press shortcut)))

(defn get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block .block-title-wrap"))

(def mac? (= "Mac OS X" (System/getProperty "os.name")))

(defn login-test-account
  [& {:keys [username password]
      :or {username "e2etest"
           password "Logseq-e2e"}}]
  (w/eval-js "localStorage.setItem(\"login-enabled\",true);")
  (w/click "button[title=\"More\"]")
  (w/click "div:text(\"Login\")")
  (input username)
  (k/tab)
  (input password)
  (w/click "button[type=\"submit\"]:text(\"Sign in\")")
  (w/wait-for-not-visible ".cp__user-login"))
