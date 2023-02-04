# Contributing to Logseq

We would love for you to contribute to Logseq and help make it even better than it is today!
As a contributor, here are the guidelines we would like you to follow:

- [Code of Conduct](#coc)
- [Question or Problem?](#question)
- [Issues and Bugs](#issue)
- [Feature Requests](#feature)
- [Submission Guidelines](#submit)
- [Pull Request Guidelines](#submit-pr)
- [Coding Rules](#rules)
- [Signing the CLA](#cla)

## <a name="coc"></a> Code of Conduct

Help us keep Logseq open and inclusive.
Please read and follow our [Code of Conduct][coc].

## <a name="question"></a> Got a Question or a Problem?

Do not open issues for general support questions or feature requests as we want to keep GitHub issues for bug reports.
Instead, we recommend using [Logseq forum][forum] to ask support-related questions.

The Logseq forum is a much better place to ask questions since:

- there are more people willing to help on the forum
- questions and answers stay available for public viewing so your question/answer might help someone else
- The forum's voting system assures that the best answers are prominently visible.

To save your and our time, we will systematically close all issues that are requests for general support and redirect people to the forum.

If you would like to chat about the question in real-time, you can reach out via [our Discord server][discord].

## <a name="issue"></a> Found a Bug?

If you find a bug in the source code, you can help us by [submitting an issue](#submit-issue) to our [GitHub Repository][github].
Even better, you can [submit a Pull Request](#submit-pr) with a fix.

## <a name="feature"></a> Missing a Feature?

You can *request* a new feature by [Creating a thread][feature-request] in our forum.
If you would like to *implement* a new feature, please open an issue and outline your proposal so that it can be discussed. This process allows us to better coordinate our efforts, prevent duplication of work, and help you to craft the change so that it is successfully accepted into the project.

## <a name="submit"></a> Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the [issue tracker][issue-tracker]. An issue for your problem might already exist and the discussion might inform you of workarounds readily available.

Please include the following with each issue:

- Version of Logseq
- Your operating system
- List of extensions that you have installed. Attempt to recreate the issue after disabling all extensions.
- Reproducible steps (1... 2... 3...) that cause the issue
- What you expected to see, versus what you actually saw
- Images, animations, or a link to a video showing the issue occurring
- A code snippet that demonstrates the issue or a link to a  code repository the developers can easily pull down to recreate the  issue locally
  - **Note:** Because the developers need to copy and paste the code snippet, including a code snippet as a media file (i.e. .gif)  is not sufficient.
- Errors from the Dev Tools Console (open from the menu: View > Toggle Developer Tools or press CTRL + Shift + i)

You can file new issues by selecting from our [new issue templates][new-issue] and filling out the issue template.

### <a name="submit-pr"></a> Pull Requests (PR)

> **Note**:
> To contribute to Logseq translation, please read our [translation contribution guidelines][translations].


> **Note**:
> Refer to our [developer documentation][dev-doc] for help on setting up a development enviorment for Logseq.

We have precise rules over how our PR titles and descriptions must be formatted.
This format leads to **easier to read commit history**. The format we use is based on [Conventional Commits](https://www.conventionalcommits.org/).

Each Pull Request consists of a **title**, a **description**, and a **footer**.

The `title` must conform to the [Pull Request Title](#pr-title) format.

The `description` is mandatory for all PRs except for those of type "docs".
When the body is present it must be at least 20 characters long and must conform to the [PR Description](#pr-body) format.

The `footer` is optional. The [PR Description Footer](#pr-footer) format describes what the footer is used for and the structure it must have.

#### <a name="pr-title"></a> PR Title

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ PR Scope: dev|API|rsapi|UX|Editor|sync|release|
  │                      UI|plugin|build|test|electron|whiteboards|
  │                      shortcut|e2e|mobile|nightly|
  │                      pdf|conf|packaging|changelog|android|iOS|desktop
  │
  │
  └─⫸ PR Type: build|ci|chore|docs|feat|fix|perf|refactor|test|revert|style
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

#### <a name="pr-type"></a> Type

Must be one of the following:

- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, yarn)
- **ci**: Changes to our CI configuration files and scripts (examples: GitHub Actions)
- **chore**: Other changes that don't modify src or test files
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **revert**: Reverts a previous commit
- **Style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)

#### <a name="pr-scope"></a> Scope

The scope should be the name of the component affected (as perceived by the person reading the changelog generated from commit messages).

The following is the list of supported scopes:

- `API`
- `rsapi`
- `UX`
- `Editor`
- `sync`
- `release`
- `UI`
- `plugin`
- `build`
- `test`
- `electron`
- `whiteboards`
- `shortcut`
- `e2e`
- `mobile`
- `pdf`
- `conf`
- `android`
- `iOS`
- `desktop`

There are currently a few exceptions to the "use component name" rule:

- `packaging`: used for changes that change how Logseq is packaged
- `dev`: used for dev-related changes within the directories /scripts and /tools
- none/empty string: useful for `test` and `refactor` changes that are done across all packages (e.g. `test: add missing unit tests`) and for docs changes that are not related to a specific package (e.g. `docs: fix typo in readme.md`).

#### <a name="pr-summary"></a> Summary

Use the summary field to provide a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end

#### <a name="pr-body"></a> PR Description

Just as in the summary, use the imperative, present tense: "fix" not "fixed" nor "fixes".

Explain the motivation for the change in the PR description. This PR description should explain *why* you are making the change.
You can include a comparison of the previous behavior with the new behavior in order to illustrate the impact of the change.

#### <a name="pr-footer"></a> PR Description Footer

The footer can contain information about breaking changes and deprecations and is also the place to reference GitHub issues and other PRs that this commit closes or is related to.
For example:

```
BREAKING CHANGE: <breaking change summary>
<BLANK LINE>
<breaking change description + migration instructions>
<BLANK LINE>
<BLANK LINE>
Fixes #<issue number>
```

or

```
DEPRECATED: <what is deprecated>
<BLANK LINE>
<deprecation description + recommended update path>
<BLANK LINE>
<BLANK LINE>
Closes #<pr number>
```

Breaking Change section should start with the phrase "BREAKING CHANGE: " followed by a summary of the breaking change, a blank line, and a detailed description of the breaking change that also includes migration instructions.

Similarly, a Deprecation section should start with "DEPRECATED: " followed by a short description of what is deprecated, a blank line, and a detailed description of the deprecation that also mentions the recommended update path.

Before you submit your Pull Request (PR) consider the following guidelines:

1. Search [GitHub][search-pr] for an open or closed PR that relates to your submission.
   You don't want to duplicate existing efforts.

2. Be sure that an issue describes the problem you're fixing, or documents the design for the feature you'd like to add.
   Discussing the design upfront helps to ensure that we're ready to accept your work.

3. Please sign our [Contributor License Agreement (CLA)](#cla) before sending PRs.
   We cannot accept code without a signed CLA.
   Make sure you author all contributed Git commits with an email address associated with your CLA signature.

4. Create a branch. The branch name should follow our [PR title guidelines](#pr-title)

5. Follow our [Coding Rules](#rules).

6. Run the full Logseq test suite, as described in the [developer documentation][dev-doc], and ensure that all tests pass.

### Reviewing a Pull Request

The Logseq team reserves the right not to accept pull requests from community members who haven't been good citizens of the community. Such behavior includes not following the [Logseq code of conduct][coc] and applies within or outside of Logseq-managed channels.

#### Addressing review feedback

If we ask for changes via code reviews then:

1. Make the required updates to the code.

2. Re-run the Logseq test suites to ensure tests are still passing.

3. Create a fixup commit and push it to your GitHub repository (this will update your Pull Request):

That's it! Thank you for your contribution!

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes from the main (upstream) repository.

## <a name="rules"></a> Coding Rules

To ensure consistency throughout the source code, keep these rules in mind as you are working:

- All features or bug fixes **must be tested** by one or more specs (unit-tests).
- All public API methods **must be documented**.
- We follow [The Clojure Style Guide][clojure-style-guide]
  - For more information on formatting see [developer documentation][dev-doc]

## <a name="cla"></a> Signing the CLA

Please sign our Contributor License Agreement (CLA) before sending pull requests. For any code
changes to be accepted, the CLA must be signed. It's a quick process, we promise!

- For individuals, we have a [simple click-through form][individual-cla].
- For corporations, please contact us.

If you have more than one GitHub accounts or multiple email addresses associated with a single GitHub account, you must sign the CLA using the primary email address of the GitHub account used to author Git commits and send pull requests.

The following documents can help you sort out issues with GitHub accounts and multiple email addresses:

- <https://help.github.com/articles/setting-your-commit-email-address-in-git/>
- <https://stackoverflow.com/questions/37245303/what-does-usera-committed-with-userb-13-days-ago-on-github-mean>
- <https://help.github.com/articles/about-commit-email-addresses/>
- <https://help.github.com/articles/blocking-command-line-pushes-that-expose-your-personal-email-address/>

## Thank You

Your contributions to open source, large or small, make great projects like this possible. Thank you for taking the time to contribute.

[coc]: https://github.com/logseq/logseq/blob/master/CODE_OF_CONDUCT.md "Logseq Code Of Conduct"
[translations]: https://github.com/logseq/logseq/blob/master/docs/contributing-to-translations.md "contributing to translations"
[dev-doc]: https://github.com/logseq/logseq/blob/master/docs/dev-practices.md "Dev Practices"
[github]: https://github.com/logseq/logseq "Logseq Repo"
[discord]: https://discord.gg/KpN4eHY "Logseq Discord Server"
[individual-cla]: https://cla-assistant.io/logseq/logseq "Individual CLA"
[clojure-style-guide]: https://guide.clojure.style/ "The Clojure Style Guide"
[feature-request]: https://discuss.logseq.com/c/feature-requests/ "Submit Feature Request"
[forum]: https://discuss.logseq.com "Logseq Forum"
[search-pr]: https://github.com/logseq/logseq/pulls "Search open PRs"
[new-issue]: https://github.com/logseq/logseq/issues/new/choose "Submit a New issue"
[issue-tracker]: https://github.com/logseq/logseq/issues "Logseq Issue Tracker"
