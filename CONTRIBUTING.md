# Contributing to Logseq

Thanks for your interest! :heart: :man_dancing: :woman_dancing: We would love
for you to contribute to Logseq and help make it even better than it is today!

As a contributor, here is an overview of things to learn about and ways to get involved:

- [Code of Conduct](#coc)
- [How can I help?](#how-can-i-help)
- [Question or Problem?](#question)
- [Issues and Bugs](#issue)
- [Feature Requests](#feature)
- [Submit an Issue](#submit-issue)
- [Submit a Pull Request](#submit-pr)

## <a name="coc"></a> Code of Conduct

Help us keep Logseq open and inclusive.
Please read and follow our [Code of Conduct][coc].

## <a name="how-can-i-help"></a> How can I help?

There are many ways you can help. Here are some ways to help without coding:

- You can be help others on [Discord][discord] or [Reddit](https://www.reddit.com/r/logseq).
- You can [contribute to the official docs](https://github.com/logseq/docs/blob/master/CONTRIBUTING.md).
- You can confirm bugs on the [issue tracker][issue-tracker] and mention reproducible steps. It helps the core team to get more reports so we can fix the highest priority bugs.
- You can contribute [translations][translations] with a [pull request](#submit-pr).

For ways to help with coding, read the next section.

### <a name="code-contributions"></a> Code Contributions

For contributors who want to help with coding, we have a list of [good first
issues](https://github.com/logseq/logseq/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
to help you get started. These are issues that are beginner-friendly and do not
require advanced knowledge of the codebase. We encourage new contributors to
start with these issues and gradually work their way up to more challenging
tasks. We also have a project board to keep track of community contributions
[Logseq - Develop Together
💪](https://github.com/orgs/logseq/projects/5?query=is%3Aopen+sort%3Aupdated-desc).
Another way to help with coding is by extending Logseq with
[plugins](https://docs.logseq.com/#/page/Plugins) and submit them to the [marketplace](https://github.com/logseq/marketplace) so that the
whole community can benefit.

## <a name="question"></a> Got a Question or a Problem?

Please do not open issues for general support questions or feature requests as we want to keep GitHub issues for bug reports.
Instead, we recommend using [Logseq forum][forum] to ask support-related questions.

The Logseq forum is a much better place to ask questions since:

- there are more people willing to help on the forum
- questions and answers stay available for public viewing so your question/answer might help someone else
- The forum's voting system assures that the best answers are prominently visible.

To save your and our time, we will systematically close all issues that are requests for general support and redirect people to the forum.

If you would like to chat about the question in real-time, you can reach out via [our Discord server][discord].

## <a name="issue"></a> Found a Bug?

If you find a bug, you can help us by [submitting an issue](#submit-issue) to our [GitHub Repository][github].
Even better, you can [submit a Pull Request](#submit-pr) with a fix.

## <a name="feature"></a> Missing a Feature?

You can *request* a new feature by [Creating a thread][feature-request] in our forum.
If you would like to *implement* a new feature, please open an issue and outline your proposal so that it can be discussed.

## <a name="submit-issue"></a> Submit an Issue

Before you submit an issue, please search the [issue tracker][issue-tracker]. An issue for your problem might already exist and the discussion might inform you of workarounds readily available.

To submit an issue, [fill out the bug report template][new-issue]. Please file a
single issue per problem and do not enumerate multiple bugs in the same issue.

The template will ask you to include the following with each issue:

- Version of Logseq
- Your operating system
- List of extensions that you have installed. Attempt to recreate the issue after disabling all extensions.
- Reproducible steps (1... 2... 3...) that cause the issue
- What you expected to see, versus what you actually saw
- Images, animations, or a link to a video showing the issue occurring
- A code snippet that demonstrates the issue or a link to a  code repository the developers can easily pull down to recreate the  issue locally
  - **Note:** Because the developers need to copy and paste the code snippet, including a code snippet as a media file (i.e. .gif)  is not sufficient.
- Errors from the Dev Tools Console (open from the menu: View > Toggle Developer Tools or press CTRL + Shift + i)

## <a name="submit-pr"></a> Submit a Pull Request (PR)

Before working on your pull request, please check the following:

1. Search [GitHub][search-pr] for related PRs that may effect your submission.

2. Be sure that an issue describes the problem you're fixing or the feature
behavior and design you'd like to add.

3. Please sign our [Contributor License Agreement (CLA)](#cla). We cannot accept
code without a signed CLA.

After doing the above, you are ready to work on your PR! To create a PR, fork
this repository and then create a branch for the fix. Once you push your code to
your fork, you'll be able to open a PR to the Logseq repository. For more info
you can follow this [GitHub
guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).
For more github PR guides, see [these
guides](https://docs.github.com/en/pull-requests).

### PR Guidelines

When submitting a Pull Request (PR) or expecting a subsequent review, please follow these guidelines:

1. The PR is ready for review. If you you have work you know how to do, then please keep your changes local until they are ready. If you need help with your PR, feel free to submit with questions.

2. The PR checks which include tests and [lint checks](https://github.com/logseq/logseq/blob/master/docs/dev-practices.md#linting) are passing.

3. The PR has no merge conflicts.

4. The PR has [test(s)](https://github.com/logseq/logseq/blob/master/docs/dev-practices.md#testing) for features or enhancements. Tests for bug fixes are also appreciated as they help prevent regressions.

5. The PR has a descriptive title that a user can understand. We use these titles to generate changelogs for the user. Most titles use one these prefixes to categorize the PR e.g. `PREFIX: DESCRIPTION ...`:
   * `chore` - Misc changes that aren't dev, feat or fix
   * `dev` - Developer related changes
   * `enhance` - Enhancements i.e. changes to existing features
   * `feat` or `feature` - New features
   * `fix` - Bug fixes
   * `test` - Test only changes

6.  The PR having "allow edits from maintainers" enabled would be appreciated. Helps us help your contribution.

7. The PR avoids the following changes that are not helpful to the core team:
   * Unrelated refactoring or heavy refactoring
   * Code or doc formatting changes including whitespace changes
   * Dependency updates e.g. in package.json
   * Changes that contain multiple unverified resources. This is risky for our users and is a lot of work to verify. A change with one resource that can be verified is acceptable.

### PR Additional Links

* To run Logseq locally, see [this doc](https://github.com/logseq/logseq/blob/master/docs/develop-logseq.md) or [this doc for windows](https://github.com/logseq/logseq/blob/master/docs/develop-logseq-on-windows.md).
* To contribute to translations, please read our [translation contribution guidelines][translations].
* See [our development practices doc](https://github.com/logseq/logseq/blob/master/docs/dev-practices.md) to learn how we develop.
* See [the overview doc](CODEBASE_OVERVIEW.md) to get an overview of the codebase.

### <a name="cla"></a> Sign the CLA

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
[github]: https://github.com/logseq/logseq "Logseq Repo"
[discord]: https://discord.gg/KpN4eHY "Logseq Discord Server"
[individual-cla]: https://cla-assistant.io/logseq/logseq "Individual CLA"
[feature-request]: https://discuss.logseq.com/c/feature-requests/ "Submit Feature Request"
[forum]: https://discuss.logseq.com "Logseq Forum"
[search-pr]: https://github.com/logseq/logseq/pulls "Search open PRs"
[new-issue]: https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=bug_report.yaml "Submit a New issue"
[issue-tracker]: https://github.com/logseq/logseq/issues "Logseq Issue Tracker"
