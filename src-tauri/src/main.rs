#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use std::net::UdpSocket;

/* =========================
   HTTP / HTTPS
   ========================= */

#[derive(Deserialize)]
struct RequestPayload {
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Serialize)]
struct ResponsePayload {
    status: u16,
    body: serde_json::Value,
}

#[tauri::command]
async fn send_request(payload: RequestPayload) -> Result<ResponsePayload, String> {
    let client = reqwest::Client::new();

    let method = payload
        .method
        .parse::<reqwest::Method>()
        .map_err(|e| e.to_string())?;

    let mut request = client.request(method, &payload.url);

    if let Some(headers) = &payload.headers {
        for (k, v) in headers {
            request = request.header(k, v);
        }
    }

    if let Some(body) = &payload.body {
        request = request.body(body.clone());
    }

    let resp = request.send().await.map_err(|e| e.to_string())?;
    let status = resp.status().as_u16();
    let text = resp.text().await.map_err(|e| e.to_string())?;

    let json: serde_json::Value =
        serde_json::from_str(&text).unwrap_or_else(|_| serde_json::json!({ "raw": text }));

    Ok(ResponsePayload { status, body: json })
}

/* =========================
   MQTT
   ========================= */

use rumqttc::{Client, MqttOptions, QoS};

#[derive(Deserialize)]
struct MqttPublishPayload {
    broker: String,
    port: u16,
    topic: String,
    payload: String,
    qos: u8,
}

#[tauri::command]
fn mqtt_publish(payload: MqttPublishPayload) -> Result<String, String> {
    let mut options = MqttOptions::new(
        "tauri-mqtt-client",
        payload.broker,
        payload.port,
    );

    options.set_keep_alive(Duration::from_secs(5));

    let (mut client, _connection) = Client::new(options, 10);

    let qos = match payload.qos {
        0 => QoS::AtMostOnce,
        1 => QoS::AtLeastOnce,
        _ => QoS::ExactlyOnce,
    };

    client
        .publish(payload.topic, qos, false, payload.payload)
        .map_err(|e| e.to_string())?;

    Ok("MQTT message published".into())
}

/* =========================
   MQTT-SN (Gateway / UDP)
   ========================= */

#[derive(Deserialize)]
struct MqttSnPayload {
    gateway: String,
    port: u16,
    data: String,
}

#[tauri::command]
fn mqtt_sn_send(payload: MqttSnPayload) -> Result<String, String> {
    let socket =
        UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Bind error: {}", e))?;

    socket
        .send_to(
            payload.data.as_bytes(),
            format!("{}:{}", payload.gateway, payload.port),
        )
        .map_err(|e| format!("Send error: {}", e))?;

    Ok("MQTT-SN packet sent (gateway mode)".into())
}

/* =========================
   CoAP
   ========================= */

use coap::CoAPClient;

#[derive(Deserialize)]
struct CoapPayload {
    url: String,
    body: Option<String>,
}

#[tauri::command]
fn coap_get(payload: CoapPayload) -> Result<String, String> {
    let response = CoAPClient::get(&payload.url)
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&response.message.payload).to_string())
}

#[tauri::command]
fn coap_post(payload: CoapPayload) -> Result<String, String> {
    let body = payload.body.unwrap_or_default();

    let response = CoAPClient::post(&payload.url, body.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&response.message.payload).to_string())
}

/* =========================
   MAIN
   ========================= */

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // HTTP
            send_request,

            // MQTT
            mqtt_publish,

            // MQTT-SN
            mqtt_sn_send,

            // CoAP
            coap_get,
            coap_post
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

