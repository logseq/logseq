(ns logseq.e2e.util
  (:refer-clojure :exclude [type])
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [wally.main :as w]
            [wally.repl :as repl])
  (:import (com.microsoft.playwright Locator$PressSequentiallyOptions
                                     Locator$FilterOptions
                                     Page$GetByTextOptions)
           (com.microsoft.playwright TimeoutError)))

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

(def editor-q ".editor-wrapper textarea")

(defn get-editor
  []
  (let [editor (w/-query editor-q)]
    (when (w/visible? editor-q)
      ;; ensure cursor exists
      ;; Sometimes when the editor exists, there isn't a blinking cursor,
      ;; causing subsequent operations (like pressing Enter) to fail.
      (.focus editor)
      editor)))

(defn get-edit-block-container
  []
  (assert/assert-have-count editor-q 1)
  (first (w/query ".ls-block" {:has (w/-query editor-q)})))

(defn input
  "Notice this will replace the existing input value with `text`"
  [text]
  (w/fill "*:focus" text))

(defn press-seq
  [text & {:keys [delay] :or {delay 0}}]
  (let [input-node (w/-query "*:focus")]
    (.pressSequentially input-node text
                        (.setDelay (Locator$PressSequentiallyOptions.) delay))))

(defn exit-edit
  []
  (when (get-editor)
    (k/esc))
  (assert/assert-non-editor-mode))

(defn double-esc
  "Exits editing mode and ensure there's no action bar"
  []
  (when (.isVisible (.first (w/-query "div[data-radix-popper-content-wrapper]")))
    (k/esc))
  (exit-edit)
  (when (.isVisible (.first (w/-query "div[data-radix-popper-content-wrapper]")))
    (k/esc)))

(defn search
  [text]
  (if (w/visible? ".cp__cmdk-search-input")
    (w/fill ".cp__cmdk-search-input" text)
    (do
      (double-esc)
      (assert/assert-in-normal-mode?)
      (w/click :#search-button)
      (w/wait-for ".cp__cmdk-search-input")
      (w/fill ".cp__cmdk-search-input" text))))

(defn search-and-click
  [search-text]
  (search search-text)
  (w/click (.first (w/get-by-test-id search-text))))

(defn wait-editor-gone
  ([]
   (wait-editor-gone ".editor-wrapper textarea"))
  ([editor]
   (w/wait-for-not-visible editor)))

(defn wait-editor-visible
  []
  (w/wait-for ".editor-wrapper textarea"))

(defn wait-popup-visible
  []
  (w/wait-for "div[data-radix-popper-content-wrapper]"))

(defn count-elements
  [q]
  (w/count* (w/-query q)))

(defn blocks-count
  "Blocks count including page title"
  []
  (count-elements ".ls-block:not(.block-add-button)"))

(defn page-blocks-count
  []
  (count-elements ".ls-page-blocks .page-blocks-inner .ls-block"))

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

(defn repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (k/press shortcut {:delay 20})))

(defn get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block:not(.block-add-button) .block-title-wrap"))

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

(defn goto-journals
  []
  (search-and-click "Go to journals"))

(defn refresh-until-graph-loaded
  []
  (w/refresh)
  (assert/assert-graph-loaded?))

(defn move-cursor-to-end
  []
  (k/press ["ControlOrMeta+a" "ArrowRight"]
           {:delay 20}))

(defn move-cursor-to-start
  []
  (k/press ["ControlOrMeta+a" "ArrowLeft"]
           {:delay 20}))

(defn input-command
  [command]
  (let [content (get-edit-content)]
    (when (and (not= (str (last content)) " ")
               (not= content ""))
      (press-seq " ")))
  (press-seq "/" {:delay 20})
  (w/wait-for ".ui__popover-content")
  (press-seq command {:delay 20})
  (w/click "a.menu-link.chosen"))

(defn set-tag
  "`hidden?`: some tags may be hidden from the UI, e.g. Page"
  [tag & {:keys [hidden?]
          :or {hidden? false}}]
  (press-seq " #" {:delay 20})
  (press-seq tag)
  (w/click (first (w/query (format "a.menu-link:has-text(\"%s\")" tag))))
  (when (and (not= (string/lower-case tag) "task") (not hidden?))
    ;; wait tag added on ui
    (assert/assert-is-visible
     (-> ".ls-block:not(.block-add-button)"
         (loc/filter :has ".editor-wrapper textarea")
         (loc/filter :has (format ".block-tag :text('%s')" tag))))))

(defn -query-last
  [q]
  (.last (w/-query q)))

(defn get-by-text
  [text exact?]
  (if exact?
    (.getByText (w/get-page) text (.setExact (Page$GetByTextOptions.) true))
    (.getByText (w/get-page) text)))
