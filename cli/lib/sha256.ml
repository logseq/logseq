let hex = Cli_platform.Crypto.sha256_hex
let base64url = Cli_platform.Crypto.sha256_base64url
let file_hex path = Cli_unix.read_binary_file path |> hex
