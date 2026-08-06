(ns logseq.e2e.ime
  "Emulates dead-key input (IME composition) via CDP.
   On many international keyboard layouts, keys like ` ~ ^ ´ are dead keys:
   pressing one starts a composition; the char resolves on space
   (compositionend data = the char itself) or composes into an accented
   letter (e.g. ~ + a => ã)."
  (:require [jsonista.core :as json]
            [wally.main :as w])
  (:import [com.google.gson JsonParser]))

(defonce ^:private *sessions (atom {}))

(defn- json-params
  [m]
  (.getAsJsonObject (JsonParser/parseString (json/write-value-as-string m))))

(defn- cdp-session
  []
  (let [page (w/get-page)]
    (or (get @*sessions page)
        (let [session (.newCDPSession (.context page) page)]
          (swap! *sessions assoc page session)
          session))))

(defn- cdp-send!
  [method params]
  (.send (cdp-session) method (json-params params)))

;; Chromium reports keyCode 229 for key events that are part of a composition.
(def ^:private composition-key-code 229)

(defn- key-event!
  [m]
  (cdp-send! "Input.dispatchKeyEvent" m))

(defn dead-key!
  "Press a dead key: keydown (key \"Dead\", keyCode 229) + start/extend the
   composition to `text`. No commit happens until commit-with-space!,
   commit-with-letter! or another dead-key! press commits it.
   `key-code` is the key's real keyCode reported on keyup (e.g. 192 for `)."
  [text code key-code]
  (key-event! {:type "rawKeyDown"
               :key "Dead"
               :code code
               :windowsVirtualKeyCode composition-key-code
               :nativeVirtualKeyCode composition-key-code})
  (cdp-send! "Input.imeSetComposition" {:text text
                                        :selectionStart (count text)
                                        :selectionEnd (count text)})
  (key-event! {:type "keyUp"
               :key "Dead"
               :code code
               :windowsVirtualKeyCode key-code
               :nativeVirtualKeyCode key-code}))

(defn- commit!
  "Commit the active composition as `text` (fires input + compositionend)."
  [text]
  (cdp-send! "Input.insertText" {:text text}))

(defn commit-with-space!
  "Space resolves the pending dead key to its literal char, e.g. ` + space => `.
   Calibrated against a real macOS international-layout trace: the commit
   keydown is synthesized with the *resolved char* as its key (not the space),
   keyCode 229; the space keyup arrives afterwards with the real space keyCode."
  [text]
  (key-event! {:type "rawKeyDown"
               :key text
               :code "Space"
               :windowsVirtualKeyCode composition-key-code
               :nativeVirtualKeyCode composition-key-code})
  (commit! text)
  (key-event! {:type "keyUp"
               :key " "
               :code "Space"
               :windowsVirtualKeyCode 32
               :nativeVirtualKeyCode 32}))

(defn commit-with-letter!
  "A letter composes with the pending dead key into an accented char,
   e.g. ~ + a => ã. `key`/`code` are the letter's (\"a\"/\"KeyA\");
   `composed` is the resulting char (\"ã\")."
  [composed key code]
  (key-event! {:type "rawKeyDown"
               :key key
               :code code
               :windowsVirtualKeyCode composition-key-code
               :nativeVirtualKeyCode composition-key-code})
  (commit! composed)
  (key-event! {:type "keyUp"
               :key key
               :code code
               :windowsVirtualKeyCode composition-key-code
               :nativeVirtualKeyCode composition-key-code}))

(defn dead-key-twice!
  "Pressing the same dead key twice: the second press commits the first char
   and starts a new composition, e.g. ~ then ~ => \"~\" committed + \"~\" composing."
  [text code key-code]
  (dead-key! text code key-code)
  (key-event! {:type "rawKeyDown"
               :key "Dead"
               :code code
               :windowsVirtualKeyCode composition-key-code
               :nativeVirtualKeyCode composition-key-code})
  (commit! text)
  (cdp-send! "Input.imeSetComposition" {:text text
                                        :selectionStart (count text)
                                        :selectionEnd (count text)})
  (key-event! {:type "keyUp"
               :key "Dead"
               :code code
               :windowsVirtualKeyCode key-code
               :nativeVirtualKeyCode key-code}))

(defn backtick+space!
  []
  (dead-key! "`" "Backquote" 192)
  (commit-with-space! "`"))

(defn tilde+space!
  []
  (dead-key! "~" "Backquote" 192)
  (commit-with-space! "~"))

(defn caret+space!
  []
  (dead-key! "^" "Digit6" 54)
  (commit-with-space! "^"))

(defn acute+space!
  []
  (dead-key! "´" "Quote" 222)
  (commit-with-space! "´"))

(defn tilde+a!
  "~ + a => ã"
  []
  (dead-key! "~" "Backquote" 192)
  (commit-with-letter! "ã" "a" "KeyA"))
