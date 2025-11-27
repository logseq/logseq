(ns frontend.components.onboarding.shared
  "Shared utilities, constants, and patterns for DB onboarding flows")

;; Entry point constants
(def entry-points
  {:none "none"
   :md-update-popup "md_update_popup"
   :db-first-run "db_first_run"
   :db-replay-tour "db_replay_tour"})

;; Status constants
(def statuses
  {:not-started "not_started"
   :in-progress "in_progress"
   :completed "completed"
   :skipped "skipped"})

;; Wizard path constants
(def wizard-paths
  {:import "import"
   :create-new "create_new"})

;; Carousel slide definitions
(def carousel-slides
  [{:id 1
    :title "Turn tags into smart templates"
    :description "Take a tag like #Book and give it fields such as Author, Status, or Rating.\n\nEvery time you use #Book, those fields appear, ready to fill in.\n\nIf you've used databases before: tags work like reusable \"classes\" for your notes."
    :example-text "Later, you can use the setup wizard to add more templates for your graph."}
   {:id 2
    :title "Add fields right where you write"
    :description "When you tag a block or page, Logseq adds fields you can fill in – like Author, Status, Date, or Participants.\n\nYou keep writing in bullets; the details sit right next to your notes."
    :example-text "For example, tag a block with #Person and store their name, role, and contact info there."}
   {:id 3
    :title "See everything in one place"
    :description "Each tag gets its own page with a list of all notes that use it.\n\nIt's like an automatic index: add a new #Book or #Meeting, and it appears in the list instantly."
    :example-text "Visit the #Book page to see all your books, with their metadata, in one view."}
   {:id 4
    :title "Keep your Markdown, add structure"
    :description "You don't have to start over. You can import your existing Markdown graph into Logseq DB, or create a new graph from scratch.\n\nYour daily notes, pages, and links keep working – they just gain smarter tags and fields."
    :example-text "You can run the setup wizard now or come back to it later from Settings."}])

;; Default tag templates for setup wizard
(def default-tag-templates
  [{:tag "#Person"
    :label "Person"
    :properties ["Name" "Role" "Email" "Company"]
    :example "Use for contacts, team members, or anyone you want to track."}
   {:tag "#Meeting"
    :label "Meeting"
    :properties ["Date" "Time" "Location" "Participants" "Notes"]
    :example "Perfect for keeping track of meetings and their details."}
   {:tag "#Book"
    :label "Book"
    :properties ["Author" "Title" "Status" "Rating" "Notes"]
    :example "Track your reading list with structured book information."}])

;; Helper function to get slide by id
(defn get-slide-by-id
  [slide-id]
  (first (filter #(= (:id %) slide-id) carousel-slides)))

;; Helper function to get total number of slides
(defn get-total-slides
  []
  (count carousel-slides))

;; Helper function to check if slide is last
(defn is-last-slide?
  [slide-id]
  (= slide-id (get-total-slides)))

;; Helper function to check if slide is first
(defn is-first-slide?
  [slide-id]
  (= slide-id 1))

