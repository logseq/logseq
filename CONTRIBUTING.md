# Contributing to Logseq

First of all, thank you for taking an interest in our open source project. Without contributors like you, we would not be where we are today!

Before you get started, please read the [Code of Conduct][coc].

As a contributor, here is an overview of things to learn about and ways to get involved:

## How Can I Help?

There are many ways to help make logseq more reliable outside of direct code contributions. You can:

- Answer questions and help on our [Discord][discord] or [Reddit][reddit].
- Contribute to the documentation by:
   - Updating existing documents
   - Creating new documentation on features and troubleshooting
- Confirm and contribute in the [issue tracker][issue-tracker] by including reproducable steps and other important information.
- [Translations][translations] are always helpful!
- Contribute to the Code base itself! (see below for more details)

## Code contributions

To get started:
 - Get your instance running with the [New Dev Setup Guide][new-dev-setup-guide]
 - Check out the [list of good first issues][good-first-issues]

 If you would rather create a [plugin][plugins], you are welcome to submit your work to the [marketplace][marketplace] for the logeq community to enjoy!

 Consider checking out the community contributions for inspiration at [Logseq - Develop Together
💪](https://github.com/orgs/logseq/projects/5?query=is%3Aopen+sort%3Aupdated-desc).

## I know what I want to work on, now what?

Fork this repository and create a branch for the fix you chose. Once you make changes youll be able to submit a pull request (PR) to the logseq repository.

Follow this [GitHub
guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) for more details on pull requests from a fork, and see [these
guides](https://docs.github.com/en/pull-requests) on general pull request guides.

### Submitting a Pull Request

**Before submitting your pull request, please check the following**:
-  Search [GitHub][search-pr] for related PRs that may effect your submission.
- Be sure that an issue describes the problem you're fixing or the feature
behavior and design you'd like to add.
- Please sign our [Contributor License Agreement (CLA)](#cla). We cannot accept
code without a signed CLA.

If everything checks out from above, make sure:

- The PR is **ready for review**. If you you have work you know how to do, then please keep your changes local until they are ready. If you need help with your PR, feel free to submit with questions.
- The PR tests and [lint checks](https://github.com/logseq/logseq/blob/master/docs/dev-practices.md#linting) are **passing**.
- The PR has **no merge conflicts**.
- The PR has the **nessasary** [test(s)](https://github.com/logseq/logseq/blob/master/docs/dev-practices.md#testing) for enhancements, features and bug fixes to reduce regression.
- The PR has a **descriptive title** that a user can understand. We use these titles to generate changelogs for the user. Format these titles with a prefix and description (e.g. `PREFIX: DESCRIPTION ...`). Some examples of prefixes are:
   * `chore` - Misc changes that aren't dev, feat or fix
   * `dev` - Developer related changes
   * `enhance` - Enhancements i.e. changes to existing features
   * `feat` or `feature` - New features
   * `fix` - Bug fixes
   * `test` - Test only changes
-  The PR has **"allow edits from maintainers" enabled** to help us help your contribution.

### Avoid these PR changes
   - Unrelated refactoring or heavy refactoring
   - Code or doc formatting changes including whitespace changes
   - Dependency updates e.g. in package.json
   - Changes that contain multiple unverified resources. This is risky for our users and is a lot of work to verify. A change with one resource that can be verified is acceptable.

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


## Got a Question or a Problem?

Please do not open issues for general support questions or feature requests as we want to keep GitHub issues for bug reports.
Instead, we recommend using [Logseq forum][forum] to ask support-related questions.

The Logseq forum is a much better place to ask questions since:

- there are more people willing to help on the forum
- questions and answers stay available for public viewing so your question/answer might help someone else
- The forum's voting system assures that the best answers are prominently visible.

To save your and our time, we will systematically close all issues that are requests for general support and redirect people to the forum.

If you would like to chat about the question in real-time, you can reach out via [our Discord server][discord].

## Found a Bug?

If you find a bug, you can help us by [submitting an issue](#submit-issue) to our [GitHub Repository][github].
Even better, you can [submit a Pull Request](#submit-pr) with a fix.

## Missing a Feature?

You can *request* a new feature by [Creating a thread][feature-request] in our forum.
If you would like to *implement* a new feature, please open an issue and outline your proposal so that it can be discussed.

## Submit an Issue

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

You can find a list of issue-labels [here](docs\issue-labels.md).


## Thank You

Your contributions to open source, large or small, make great projects like this possible. Thank you for taking the time to contribute.

[coc]: https://github.com/logseq/logseq/blob/master/CODE_OF_CONDUCT.md "Logseq Code Of Conduct"
[translations]: https://github.com/logseq/logseq/blob/master/docs/contributing-to-translations.md "contributing to translations"
[github]: https://github.com/logseq/logseq "Logseq Repo"
[discord]: https://discord.gg/KpN4eHY "Logseq Discord Server"
[reddit]: https://www.reddit.com/r/logseq "Logseq Reddit"
[individual-cla]: https://cla-assistant.io/logseq/logseq "Individual CLA"
[feature-request]: https://discuss.logseq.com/c/feature-requests/ "Submit Feature Request"
[forum]: https://discuss.logseq.com "Logseq Forum"
[search-pr]: https://github.com/logseq/logseq/pulls "Search open PRs"
[new-issue]: https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=bug_report.yaml "Submit a New issue"
[issue-tracker]: https://github.com/logseq/logseq/issues "Logseq Issue Tracker"
[good-first-issues]: https://github.com/logseq/logseq/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22
[new-dev-setup-guide]: docs\dev-setup-guide.md
[plugins]: https://docs.logseq.com/#/page/Plugins
[marketplace]: https://github.com/logseq/marketplace
