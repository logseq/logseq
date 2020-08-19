(ns frontend.tools.tongue
  (:require [tongue.core :as tongue]
            [frontend.state :as state]
            [clojure.string :as string]))


;; TODO
;; - [ ] Localizing Number Formats
;; - [ ] Localizing Dates

(def dicts
  {:en {:on-boaring {:title "Hi, welcome to Logseq!"
                     :notice "Notice that this project is in its early days and under quick development, files might be corrupted."}
        :right-side-bar {:help "Help"
                         :switch-theme #(str "Switch to " % " theme")
                         :theme #(cond
                                   (= "white" %) "White theme"
                                   (= "dark" %) "Dark theme")
                         :page "Page graph"
                         :recent "Recent"
                         :contents "Contents"
                         :graph-ref "Graph of "
                         :block-ref "Block reference"}
        :git {:set-access-token "Set Github personal access token"
              :token-is-encrypted "The token will be encrypted and stored in the browser local storage"
              :token-server "The server will never store it"
              :create-personal-access-token "How to create a Github personal access token?"
              :push "Push now"
              :local-changes-synced "All local changes are synced!"
              :pull "Pull now"
              :last-pull "Last pulled at"
              :version "Version"
              :import-notes "Import your notes"
              :import-notes-helper "You can import your notes from a repo on Github."
              :add-another-repo "Add another repo"
              :re-index "Clone again and re-index the db"
              :commit {:message "Your commit message"
                       :commit-and-push "Commit and push!"}
              :diff {:use-remote "Use remote"
                      :keep-local "Keep local"
                      :edit "Edit"
                      :title "Diff"
                      :no-diffs "No diffs"
                      :commit-message "Commit message (optional)"
                      :pushing "Pushing"
                      :force-push "Commit and force pushing"
                      :a-force-push "A force push"}}
        :format {:preferred-mode "What's your preferred mode?"
                 :markdown "Markdown"
                 :org-mode "Org Mode"}
        :reference {:linked "Linked Reference"
                    :unlinked-ref "Unlinked References"}
        :project {:setup "Setup a public project on Logseq"
                  :location "All published pages will be located under"}
        :page {:presentation-mode "Presentation mode (Powered by Reveal.js)"
               :delete-success #(str "Page " % " was delted successfully!")
               :delete-confirmation "Are you sure you want to delte this page?"
               :rename-to #(str "Rename \"" % "\" to:")
               :priority #(str "Priority \"" (string/upper-case %) "\"")
               :re-index "Re-index this page"
               :copy-to-json "Copi the whole page as JSON"
               :rename "Rename page"
               :delete "Delete page (will delete the file too)"
               :publish "Publish this page on Logseq"
               :publish-as-slide "Publish this page as a slide on Logseq"
               :unpublish "Un-publish this page on Logseq"
               :show-journals "Show Journals"
               :show-name "Show page name"
               :hide-name "Hide page name"
               :name "Page name"
               :last-modified "Last modified at"
               :new-title "What's your new page title?"}
        :journal {:multiple-files-with-different-formats "It seems that you have multiple journal files (with different formats) for the same month, please only keep one journal file for each month."
                  :go-to "Go to files"}
        :file {:name "File name"
               :last-modified-at "Last modified at"
               :no-data "No data"
               :format-not-supported #(str "Format ." % " is not supported.")}
        :editor {:block-search "Search for a block"
                 :image-uploading "Uploading"}
        :draw {:invalid-file "Could not load this invalid excalidraw file"
               :specify-title "Please specify a title first!"
               :rename-success "File was renamed successfully!"
               :rename-failure "Rename file failed, reason: "
               :title-placeholder "Untitled"
               :save "Save"
               :save-changes "Save changes"
               :new-file "New file"
               :list-files "List files"
               :delete "Delete"
               :more-options "More options"
               :back-to-logseq "Back to logseq"}
        :content {:copy "Copy"
                  :cut "Cut"
                  :make-todos #(str "Make " % "s")
                  :copy-block-ref "Copy block ref"
                  :focus-on-block "Focus on block"
                  :open-in-sidebar "Open in sidebar"
                  :copy-as-json "Copy as JSON"
                  :click-to-edit "Click to edit"}
        :commands {}
        :logseq "Logseq"
        :dot-mode "Dot mode"
        :on "ON"
        :more-options "More options"
        :to "to"
        :yes "Yes"
        :submit "Submit"
        :cancel "Cancel"
        :re-index "Re-index"
        :export-json "Export as JSON"
        :unlink "unlink"
        :search "Search"
        :new-page "New page"
        :graph "Graph"
        :all-repos "All repos"
        :all-pages "All pages"
        :all-files "All files"
        :settings "Settings"
        :join-community "Join the community"
        :discord-title "Our discord group!"
        :sign-out "Sign out"
        :help-shortcut-title "Click to check shortcuts and other tips"
        :loading "Loading"
        :cloning "Cloning"
        :parsing-files "Parsing files"
        :loading-files "Loading files"
        :login-github "Login with Github"
        :excalidraw-title "Draw with Excalidraw"
        :go-to "Go to "
        :or "or"
        :download "Download"}
                       
   :tongue/fallback :en})

(def languages [{:label "English" :value :en}])

(def translate
  (tongue/build-translate dicts))
