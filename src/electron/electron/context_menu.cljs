(ns electron.context-menu
  (:require [clojure.string :as string]
            [electron.utils :as utils]
            ["electron" :refer [Menu MenuItem shell] :as electron]
            ["electron-dl" :refer [download]]))

;; context menu is registerd in window/setup-window-listeners!
(defn setup-context-menu!
  [^js win]
  (let [web-contents (. win -webContents)

        context-menu-handler
        (fn [_event params]
          (let [menu (Menu.)
                suggestions (.-dictionarySuggestions ^js params)
                edit-flags (.-editFlags ^js params)
                editable? (.-isEditable ^js params)
                selection-text (.-selectionText ^js params)
                has-text? (not (string/blank? (string/trim selection-text)))
                link-url (not-empty (.-linkURL ^js params))
                media-type (.-mediaType ^js params)]

            (doseq [suggestion suggestions]
              (. menu append
                 (MenuItem. (clj->js {:label
                                      suggestion
                                      :click
                                      #(. web-contents replaceMisspelling suggestion)}))))
            (when (not-empty suggestions)
              (. menu append (MenuItem. #js {:type "separator"})))
            (when-let [misspelled-word (not-empty (.-misspelledWord ^js params))]
              (. menu append
                 (MenuItem. (clj->js {:label
                                      "Add to dictionary"
                                      :click
                                      #(.. web-contents -session (addWordToSpellCheckerDictionary misspelled-word))}))))

            (. menu append (MenuItem. #js {:type "separator"}))

            (when (and utils/mac? has-text? (not link-url))
              (. menu append
                 (MenuItem. #js {:label (str "Look Up “" selection-text "”")
                                 :click #(. web-contents showDefinitionForSelection)})))
            (when has-text?
              (. menu append
                 (MenuItem. #js {:label "Search with Google"
                                 :click #(let [url (js/URL. "https://www.google.com/search")]
                                           (.. url -searchParams (set "q" selection-text))
                                           (.. shell (openExternal (.toString url))))})))
            (. menu append (MenuItem. #js {:type "separator"}))

            (when (and has-text? editable?)
              (when (.-canCut edit-flags)
                (. menu append
                   (MenuItem. #js {:label "Cut"
                                   :role "cut"})))
              (when (.-canCopy edit-flags)
                (. menu append
                   (MenuItem. #js {:label "Copy"
                                   :role "copy"}))))

            (when (and editable? (.-canPaste edit-flags))
              (. menu append
                 (MenuItem. #js {:label "Paste"
                                 :role "paste"})))

            (when (= media-type "image")
              (. menu append
                 (MenuItem. #js {:label "Save Image"
                                 :click (fn [menu-item]
                                          (let [url (.-srcURL ^js params)
                                                url (if (.-transform menu-item)
                                                      (. menu-item transform url)
                                                      url)]
                                            (download win url)))}))

              (. menu append
                 (MenuItem. #js {:label "Save Image As..."
                                 :click (fn [menu-item]
                                          (let [url (.-srcURL ^js params)
                                                url (if (.-transform menu-item)
                                                      (. menu-item transform url)
                                                      url)]
                                            (download win url #js {:saveAs true})))}))

              (. menu append
                 (MenuItem. #js {:label "Copy Image"
                                 :click #(. web-contents copyImageAt (.-x ^js params) (.-y ^js params))})))

            (. menu popup)))]

    (doto web-contents
      (.on "context-menu" context-menu-handler))

    context-menu-handler))
