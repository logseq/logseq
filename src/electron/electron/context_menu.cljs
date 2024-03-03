(ns electron.context-menu
  (:require [electron.utils :as utils]
            ["electron" :refer [Menu MenuItem shell nativeImage clipboard] :as electron]
            ["electron-dl" :refer [download]]))

;; context menu is registered in window/setup-window-listeners!
(defn setup-context-menu!
  [^js win]
  (let [web-contents (.-webContents win)

        context-menu-handler
        (fn [_event ^js params]
          (let [menu (Menu.)
                suggestions (.-dictionarySuggestions params)
                edit-flags (.-editFlags params)
                editable? (.-isEditable params)
                selection-text (.-selectionText params)
                has-text? (seq selection-text)
                link-url (not-empty (.-linkURL params))
                media-type (.-mediaType params)]

            (doseq [suggestion suggestions]
              (. menu append
                 (MenuItem. (clj->js {:label
                                      suggestion
                                      :click
                                      #(. web-contents replaceMisspelling suggestion)}))))
            (when-let [misspelled-word (not-empty (.-misspelledWord params))]
              (. menu append
                 (MenuItem. (clj->js {:label
                                      "Add to dictionary"
                                      :click
                                      #(.. web-contents -session (addWordToSpellCheckerDictionary misspelled-word))})))
              (. menu append (MenuItem. #js {:type "separator"})))

            (when (and utils/mac? has-text? (not link-url))
              (. menu append
                 (MenuItem. #js {:label (str "Look Up “" selection-text "”")
                                 :click #(. web-contents showDefinitionForSelection)})))
            (when has-text?
              (. menu append
                 (MenuItem. #js {:label "Search with Google"
                                 :click #(let [url (js/URL. "https://www.google.com/search")]
                                           (.. url -searchParams (set "q" selection-text))
                                           (.. shell (openExternal (.toString url))))}))
              (. menu append (MenuItem. #js {:type "separator"})))

            (when editable?
              (when has-text?
                (. menu append
                   (MenuItem. #js {:label "Cut"
                                   :enabled (.-canCut edit-flags)
                                   :role "cut"}))
                (. menu append
                   (MenuItem. #js {:label "Copy"
                                   :enabled (.-canCopy edit-flags)
                                   :role "copy"})))

              (. menu append
                 (MenuItem. #js {:label "Paste"
                                 :enabled (.-canPaste edit-flags)
                                 :role "paste"}))
              (. menu append
                 (MenuItem. #js {:label "Select All"
                                 :enabled (.-canSelectAll edit-flags)
                                 :role "selectAll"})))

            (when (= media-type "image")
              (. menu append
                 (MenuItem. #js {:label "Save Image"
                                 :click (fn [menu-item]
                                          (let [url (.-srcURL params)
                                                url (if (.-transform menu-item)
                                                      (. menu-item transform url)
                                                      url)]
                                            (download win url)))}))

              (. menu append
                 (MenuItem. #js {:label "Save Image As..."
                                 :click (fn [menu-item]
                                          (let [url (.-srcURL params)
                                                url (if (.-transform menu-item)
                                                      (. menu-item transform url)
                                                      url)]
                                            (download win url #js {:saveAs true})))}))

              (. menu append
                 (MenuItem. #js {:label "Copy Image"
                                 :click (fn []
                                          (. clipboard writeImage (. nativeImage createFromPath (subs (.-srcURL params) 7))))})))

            (when (not-empty (.-items menu))
              (. menu popup))))]

    (doto web-contents
      (.on "context-menu" context-menu-handler))

    context-menu-handler))
