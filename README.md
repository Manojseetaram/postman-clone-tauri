
# create tauri project

1. pnpm create tauri-app
2. cd tauri-app
3. pnpm install
4. pnpm tauri dev

#  Cargo dependency with enabled features.

1. reqwest = { version = "0.11", features = ["json", "blocking", "gzip", "rustls-tls"] }

{
  "Mqttsn": {
    "gateway": "127.0.0.1",
    "port": 1884,
    "data": "{\"topic\":\"test/topic\",\"message\":\"Hello MQTT-SN\"}"
  }
}
