val capture : id:Plugin_protocol.plugin_id ->
  Plugin_broker.services * Plugin_broker.read_services
val capture_editor : id:Plugin_protocol.plugin_id ->
  Plugin_broker.services * Plugin_broker.read_services * Plugin_broker.write_services
