# CLI Login with Username and Password

## Problem

`logseq login` requires a browser authorization flow and a local callback. This
prevents unattended login in CI, containers, and remote servers. Disabling
browser opening does not remove the authorization-code callback requirement.
Users need an explicit username/password login mode that can create the existing
CLI auth file without opening a browser or starting a callback server.

Context: [db-test issue #1017](https://github.com/logseq/db-test/issues/1017)
and [PR #12910](https://github.com/logseq/logseq/pull/12910). Their proposed
ClojureScript implementation targets an earlier CLI. The current implementation
is OCaml under `cli/`; this document uses the requested option names
`--username` and `--password`, not the issue's `--user` and `--pass`.

### Implementation before this change

- `cli/lib/cli_parse.ml`: login accepts no command options and produces
  `Auth_command.Parsed_login` without credentials.
- `cli/lib/auth_command.ml`: login builds a payload-free `Login` action and calls
  `Auth_state.login`. Its output always includes `authorize-url` and `opened`.
- `cli/lib/auth_state.ml`: login builds a PKCE authorization URL, starts the
  callback flow, exchanges the authorization code, and writes the auth file.
  The default path is `~/logseq/auth.json`; `auth_path` resolves any configured
  override. `resolve_auth` refreshes expired file credentials through the
  configured OAuth token endpoint.
- `cli/lib/command_registry.ml`: login has no option metadata.
- `cli/spec/commands/auth_command.mli` and `cli/spec/runtime/auth_state.mli`:
  current public types cannot carry login credentials or represent a successful
  login without a browser URL.
- `cli/test/cli_parity_test_cases.ml` and `cli/test/test_cases.ml`: existing
  coverage includes parsing, auth persistence, token refresh, and browser PKCE.

### Production capability evidence

On 2026-09-17, the current source's default Cognito app client was
`69cs1lgme7p8kbgld8n5kseii6`, with the hosted domain
`logseq-prod.auth.us-east-1.amazoncognito.com`.

One direct request to `https://cognito-idp.us-east-1.amazonaws.com/` used
`InitiateAuth`, `AuthFlow: USER_PASSWORD_AUTH`, that client ID, and a randomly
invented username under `example.invalid` with a random password. No client
secret or real account credentials were supplied. The response was HTTP 400:

```json
{"__type":"NotAuthorizedException","message":"Incorrect username or password."}
```

This is evidence that the default client accepts the password flow and reaches
credential verification. AWS documents a different error when that flow is
not enabled: `InvalidParameterException` with
`USER_PASSWORD_AUTH flow not enabled for this client`.
See [AWS troubleshooting guidance](https://www.repost.aws/knowledge-center/cognito-migration-lambda-trigger-errors).

This was a capability probe, not a successful login or refresh test. A separate
`DescribeUserPoolClient` request using the available AWS credentials returned
`ResourceNotFoundException`; the administrative `ExplicitAuthFlows` setting was
therefore not inspected. The frontend E2E helper accepts a separate client ID
and secret and is not proof of the CLI client's configuration. Configured client
ID overrides also require their own capability verification.

## Decision

### Command behavior

Provide two login-only options:

```sh
logseq login --username user@example.com --password '<password>'
```

The current OCaml CLI implements these options.
`username` is a Cognito sign-in identifier, including an email address when
supported by the user pool. Do not impose an email-only validator.

| Input | Behavior |
| --- | --- |
| Neither option | Use the existing browser PKCE login mode. |
| Both options with non-empty values | Use direct password authentication. |
| Only one option, a missing value, or an empty value | Fail before making a network request or starting a browser/callback server. |
| Password authentication fails | Return an error and a nonzero exit status; do not start browser login. |

Preserve password bytes exactly, including spaces. Do not trim or normalize the
password. Do not add short aliases, `--user`/`--pass` compatibility aliases,
implicit credential discovery, or credentials in `cli.edn`.

### Authentication and persistence

1. Parse the optional pair, validate it, and build a typed login mode:
   browser login or password login containing both credentials.
2. For password mode, send one HTTPS JSON request to the Cognito IDP endpoint
   with `X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth` and
   `Content-Type: application/x-amz-json-1.1`. Include the configured client ID,
   `AuthFlow: USER_PASSWORD_AUTH`, and `AuthParameters.USERNAME`/`PASSWORD`.
   Use the current public-client model without `SECRET_HASH`.
3. Reuse the existing HTTP platform abstraction and request timeout. Keep the
   Cognito IDP endpoint distinct from the hosted UI `/oauth2/token` endpoint and
   the Logseq sync API base. Do not derive it from a custom sync `http-base`.
   The initial production target is the existing us-east-1 pool; use the existing
   test HTTP abstraction or a focused injection seam for fixtures instead of
   adding an unrelated public endpoint option.
4. Parse Cognito's `AuthenticationResult` fields explicitly: `IdToken`,
   `AccessToken`, and `RefreshToken`. Require non-empty tokens and valid ID-token
   claims needed for identity and expiry before persisting. Do not extend the
   OAuth response parser with alternate field-name fallbacks.
5. Construct the existing `auth_data` and use the resolved auth path and shared
   writer. Store tokens and identity metadata, never the username/password pair
   or the raw request. Leave the auth-file schema unchanged.
6. Reuse existing token resolution and refresh only after confirming a token
   issued by this flow works with the current refresh endpoint and downstream
   sync authentication. If that fails, revise this proposal explicitly before
   introducing a separate refresh path.

The initial scope does not implement challenge continuation. If Cognito returns
`ChallengeName` for MFA, a new password, or another challenge, return an explicit
unsupported-challenge error with the challenge name, without exposing `Session`
or challenge payloads. Do not write partial credentials or treat HTTP 200 alone
as successful login. The user can explicitly choose browser login separately.

Use bounded, structured errors for rejected credentials, disabled auth flow,
challenges, malformed responses, timeout, and transport failure. Preserve the
existing auth file on authentication or response-validation failure. Never echo
credentials, tokens, raw auth request bodies, or raw Cognito responses in errors,
verbose logs, or human/JSON/EDN output.

### Result and interface changes

Represent mode-specific login information with an OCaml variant rather than
inventing an empty authorization URL. Keep common successful result fields
`auth-path`, `updated-at`, and optional `email`/`sub`. For browser mode, include
`authorize-url` and `opened`; omit both browser-specific fields for password
mode. No placeholder values or legacy output adapter are needed.

Implementation locations:

| Area | Files and intended changes |
| --- | --- |
| Public command types | `cli/spec/commands/auth_command.mli`: carry raw optional credentials in parsed login and a validated mode in its action. |
| Public auth types | `cli/spec/runtime/auth_state.mli`: define login mode, pass it to `login`, and model browser-specific result data as a variant. |
| Parsing and help | `cli/lib/cli_parse.ml`, `cli/lib/command_registry.ml`: accept login-only options and expose accurate help. |
| Command execution | `cli/lib/auth_command.ml`: validate the pair, build the mode, and serialize mode-specific results. |
| Authentication | `cli/lib/auth_state.ml`: dispatch explicitly and implement the Cognito password request and response validation. |
| Error contract | `cli/lib/error.ml`, `cli/spec/core/error.mli`: add only missing structured authentication error categories. |
| Tests and documentation | `cli/test/cli_parity_test_cases.ml`, `cli/test/test_cases.ml`, `docs/cli/logseq-cli.md`: cover observable behavior and explain the new mode. |

`cli/AGENTS.md` prohibits changing `spec/` `.mli` files without an explicit
request. On 2026-09-17, the user explicitly authorized the scoped changes to
`cli/spec/commands/auth_command.mli`, `cli/spec/runtime/auth_state.mli`, and,
if needed for new error categories, `cli/spec/core/error.mli`. The implementation changes only those authorized interfaces. No dune file was
changed.

### Scope boundaries

This change covers CLI account authentication only. It does not change the
Desktop login UI, db-worker-node APIs, sync authorization, or E2EE password
handling. An account password is not an E2EE password. No MFA prompt, password
reset, social-provider password login, client-secret support, environment-variable
credential source, or stdin password input is included in the initial proposal.

## Alternatives considered

### Continue requiring browser login

This keeps the current implementation small but does not satisfy unattended
login. Suppressing browser opening still requires a callback.

### Copy a previously generated auth file

This can bootstrap an environment but still requires prior interactive login
and external secret distribution. It does not provide the requested login mode.

### Apply the older ClojureScript PR directly

The current executable uses OCaml, so the historical file changes do not
implement the feature here. Reuse the protocol idea, not obsolete code paths
or the shorter option aliases.

### Add password prompts, stdin, or environment variables immediately

These can reduce command-line password exposure but introduce additional input
sources and precedence rules. Keep them as a separate decision unless requested
for this initial scope.

## Acceptance criteria

- Help lists `--username` and `--password` only for login. Invalid pairs fail
  before external side effects; neither option still selects browser PKCE.
- Password login succeeds against a Cognito fixture without opening a browser
  or binding a callback port. The request uses the configured client ID, exact
  credentials, and the expected Cognito flow and headers.
- Successful password login writes the existing auth format to the resolved
  auth path, with the existing private file-permission behavior. Human, JSON,
  and EDN results contain useful identity/path information and no secrets.
- Invalid credentials, disabled flow, timeout, transport failure, challenge
  responses, missing tokens, and invalid required claims all return nonzero
  status without replacing an existing auth file or falling back to browser
  login. Error/log fixtures verify that secret markers are absent.
- Existing browser PKCE, logout, and refresh behavior remain covered. Tests
  assert externally observable outcomes rather than mirroring helper structure.
- Run `pnpm --dir cli test` and `pnpm --dir cli bundle`; exercise the newly built
  CLI with isolated auth/config paths, then run the non-sync CLI E2E suite using
  the repository's documented selection mechanism and existing db-worker-node.
  Here, CLI E2E means `cli-e2e/`, not app E2E in `clj-e2e/`.
- Before declaring production readiness, use an authorized test account and an
  isolated auth path to verify successful password login, token refresh, and a
  read-only authenticated sync request. Do not report the capability probe or
  mocked responses as proof of these checks. If unavailable, record this gap.

## Consequences

- Password arguments can appear in shell history and process listings. CLI
  redaction cannot remove that OS/shell exposure; document it in usage guidance.
- Cognito may require a challenge even for an account with a correct password.
  The initial scope intentionally fails clearly instead of completing it.
- Password-issued tokens may differ from hosted UI tokens in scopes or refresh
  requirements. Production login, refresh, and sync verification are release
  gates; the live capability probe establishes only flow availability.
- Cognito configuration can change, and custom clients may not enable this
  flow. Handle the server response directly without runtime retries through a
  different authentication mode.
- The current public interfaces encode browser-only assumptions. Avoid hiding
  credentials in global state or config to bypass the required spec changes.

## Questions

No open questions remain. The user confirmed both decisions on 2026-09-17:

1. The three scoped `.mli` interface changes listed above are authorized.
2. The initial release provides only `--username` and `--password` as credential
   inputs and returns a clear error for MFA, forced password changes, and other
   authentication challenges. Challenge continuation and additional credential
   input sources remain outside this change.

## Implementation and validation

Implemented on `feat/cli-password-login`, based on `origin/master` at
`94e1db7ac108f7b6324545b3edb0186696f45cfe` fetched on 2026-09-17.

- `Auth_command` carries the optional raw pair and validates it before command
  execution. `Auth_state.login_mode` distinguishes browser and password login;
  `login_details` distinguishes their successful output. Invalid login
  positional arguments use a bounded error so an incorrectly supplied password
  beginning with `-` cannot be echoed by the generic unknown-command error.
- Password authentication uses the existing HTTP abstraction, timeout, client
  selection, auth path, and private auth writer. No new endpoint configuration,
  alternate refresh implementation, or auth-file schema was introduced.
- The dedicated Cognito parser requires all three non-empty tokens, a non-empty
  subject, and an integral future expiry representable by the existing time
  model. Malformed responses never reach the writer.
- New error categories are `invalid-auth-response`, `password-auth-rejected`,
  `password-auth-disabled`, `password-auth-failed`, and
  `unsupported-auth-challenge`; timeout reuses `login-timeout`. Only documented
  challenge names can appear in errors. Unknown or malformed challenge names
  are invalid responses, preventing arbitrary response text from being echoed.
- Process-level fixtures intercept `fetch` and reject any browser or callback
  side effect. They check the exact request, configured client, whitespace in
  passwords, auth persistence and permissions, identity output, malformed
  claims/tokens, challenges, transport/timeout failures, and secret exclusion.
  Existing browser PKCE, logout, and refresh tests remain in the suite.
- RED validation against the baseline failed because login did not recognize
  `--username`; the final CLI test suite passes all 272 tests. A separate RED
  regression demonstrated that `login ... --password -secret-password` echoed
  the value; its safe-error regression now passes.
- `pnpm --dir cli bundle`, `dune build @all` from `cli/`, formatting checks on
  changed OCaml files, and `git diff --check` pass. An additional 15 isolated
  bundled-CLI checks covered success, rejection, challenge, transport failure,
  and timeout in human, JSON, and EDN output.

The complete non-sync CLI E2E suite passed: 98 cases, 0 failures, using
`bb -f cli-e2e/bb.edn test --skip-build`. The initial run had 17 failures because
the existing worker artifact reported revision `2f9ee71e6b-dirty` while the CLI
used `94e1db7ac1-dirty`; CLI/worker logs showed repeated worker termination and
`fetch failed`. Rebuilding the existing worker with
`pnpm db-worker-node:compile:bundle` (zero compiler warnings) and rerunning the
same suite resolved all 17 failures. No worker source was changed.

### Production verification

On 2026-09-17, an authorized user-provided account was tested with the newly
built CLI against the default production Cognito client and sync service.
Credentials, tokens, account identifiers, and graph names are omitted here.

- Real `login --username ... --password ...` exited 0, returned `status: ok`,
  and wrote all three tokens with a subject and future expiry to an isolated
  auth path. File permissions were `0600`. Command output contained neither
  the password nor any token, and omitted browser-specific result fields.
  The existing default auth file remained unchanged.
- Created an isolated local graph solely to provide the worker context required
  by `sync remote-graphs`. No sync upload or remote mutation was performed.
  The authenticated read-only request exited 0 and returned 14 remote graphs.
- Set only the isolated auth file's `expires-at` to zero, then ran the same
  read-only command. The existing OAuth token endpoint refresh succeeded:
  `updated-at` advanced, a different ID token was persisted, future expiry was
  restored, the subject stayed the same, and file permissions remained `0600`.
  The subsequent sync request again exited 0 and returned 14 remote graphs.
- A separate real request with a randomly invented `example.invalid` account
  exited 1 with `password-auth-rejected`, preserved an existing sentinel auth
  file, and did not echo the submitted credentials.
- Stopped the isolated worker and removed the temporary auth file, config,
  local graph, and verification artifacts after testing.

These checks satisfy the production login, refresh, and read-only sync gate for
this account and the default client at the time tested. Custom clients and
challenge-requiring accounts remain configuration-dependent; challenge
continuation is outside this feature.

AWS documents that tokens issued by `InitiateAuth` can use the OAuth token
endpoint when remembered devices are not active in the user pool:
[AWS token endpoint documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html).
The live test above confirms the retained refresh path works for the tested
production account/client combination.
