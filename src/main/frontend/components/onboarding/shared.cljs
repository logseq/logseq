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
    :title "Tags as Classes"
    :description "Turn hashtags into reusable templates. Create #Book, #Person, or #Meeting classes with property templates attached."
    :example-text "Create a #Book class once, then use it anywhere. Each tag becomes an object with structured metadata."}
   {:id 2
    :title "Properties & Instances"
    :description "When you tag a block or page, you immediately get property fields to fill in metadata like Author, Status, or Participants."
    :example-text "Tag a block with #Person and fill in their name, role, and contact info right there."}
   {:id 3
    :title "Collections on Tag Pages"
    :description "Navigate to any tag page and see a collection of all objects that have that tag. It's like an automatic index that stays up to date."
    :example-text "Visit the #Book page to see all your books, complete with their metadata, all in one place."}
   {:id 4
    :title "Keep Your Markdown"
    :description "Don't worry - you can import your existing Markdown graph into Logseq DB, or start fresh with a new graph."
    :example-text "Your writing stays the same. Your graph just gets smarter with structured data."}])

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

