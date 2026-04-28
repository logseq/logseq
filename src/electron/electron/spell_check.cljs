(ns electron.spell-check)

(defn session-spellcheck-enabled?
  [value]
  (not= false value))

(defn apply-window-spellcheck!
  [^js win enabled?]
  (when-let [^js session (some-> win .-webContents .-session)]
    (.setSpellCheckerEnabled session enabled?))
  win)
