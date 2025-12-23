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
#[serde(tag = "protocol")]
enum UniversalPayload {
    HTTP {
        method: String,
        url: String,
        headers: Option<HashMap<String, String>>,
        body: Option<String>,
    },
    MQTT {
        broker: String,
        topic: String,
        qos: u8,
        message: String,
    },
    MQTT_SN {
        gateway: String,
        port: u16,
        data: String,
    },
    COAP {
        method: String,
        url: String,
        payload: Option<String>,
    },
}


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

    let ( client, _connection) = Client::new(options, 10);

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


use coap_lite::{CoapRequest, RequestType};

#[derive(Deserialize)]
struct CoapPayload {
    host: String, // "127.0.0.1:5683"
    path: String, // "sensor/temp"
    body: Option<String>,
}

#[tauri::command]
fn coap_get(payload: CoapPayload) -> Result<String, String> {
    let mut request: CoapRequest<()> = CoapRequest::new();
    request.set_method(RequestType::Get);
    request.set_path(&payload.path);

    let packet = request
        .message
        .to_bytes()
        .map_err(|e| e.to_string())?;

    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| e.to_string())?;

    socket
        .send_to(&packet, &payload.host)
        .map_err(|e| e.to_string())?;

    let mut buf = [0u8; 1500];
    let (size, _) = socket
        .recv_from(&mut buf)
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&buf[..size]).to_string())
}

#[tauri::command]
fn coap_post(payload: CoapPayload) -> Result<String, String> {
    let mut request: CoapRequest<()> = CoapRequest::new();
    request.set_method(RequestType::Post);
    request.set_path(&payload.path);

    if let Some(body) = payload.body {
        request.message.payload = body.into_bytes();
    }

    let packet = request
        .message
        .to_bytes()
        .map_err(|e| e.to_string())?;

    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| e.to_string())?;

    socket
        .send_to(&packet, &payload.host)
        .map_err(|e| e.to_string())?;

    let mut buf = [0u8; 1500];
    let (size, _) = socket
        .recv_from(&mut buf)
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&buf[..size]).to_string())
}

#[tauri::command]
async fn send_universal(payload: UniversalPayload) -> Result<serde_json::Value, String> {
    match payload {
        UniversalPayload::HTTP { method, url, headers, body } => {
            let client = reqwest::Client::new();
            let method = method.parse::<reqwest::Method>().map_err(|e| e.to_string())?;
            let mut req = client.request(method, url);

            if let Some(h) = headers {
                for (k, v) in h {
                    req = req.header(k, v);
                }
            }
            if let Some(b) = body {
                req = req.body(b);
            }

            let res = req.send().await.map_err(|e| e.to_string())?;
            let status = res.status().as_u16();
            let text = res.text().await.map_err(|e| e.to_string())?;

            Ok(serde_json::json!({
                "status": status,
                "body": text
            }))
        }

        UniversalPayload::MQTT { broker, topic, qos, message } => {
    let mut options = MqttOptions::new("tauri-client", broker, 1883);
    options.set_keep_alive(Duration::from_secs(5));

    let (client, _conn) = Client::new(options, 10);

    let qos = match qos {
        0 => QoS::AtMostOnce,
        1 => QoS::AtLeastOnce,
        _ => QoS::ExactlyOnce,
    };

    client
        .publish(topic, qos, false, message)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "status": "MQTT published" }))
}


      UniversalPayload::MQTT_SN { gateway, port, data } => {
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket
        .send_to(data.as_bytes(), format!("{}:{}", gateway, port))
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "status": "MQTT-SN sent" }))
}


       UniversalPayload::COAP { method, url, payload } => {
    use coap_lite::{CoapRequest, RequestType};

    let mut req: CoapRequest<()> = CoapRequest::new();
    req.set_method(match method.as_str() {
        "POST" => RequestType::Post,
        "PUT" => RequestType::Put,
        _ => RequestType::Get,
    });

    // let parts: Vec<&str> = url.replace("coap://", "").split('/').collect();
    let cleaned_url = url.replace("coap://", "");
let parts: Vec<&str> = cleaned_url.split('/').collect();

    let host = parts[0];
    let path = parts[1..].join("/");

    req.set_path(&path);

    if let Some(p) = payload {
        req.message.payload = p.into_bytes();
    }

    let packet = req.message.to_bytes().map_err(|e| e.to_string())?;

    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;

    socket
        .send_to(&packet, host)
        .map_err(|e| e.to_string())?;

    let mut buf = [0u8; 1500];
    let (size, _) = socket
        .recv_from(&mut buf)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "response": String::from_utf8_lossy(&buf[..size])
    }))
}


    }
}


fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
        send_universal
            // send_request,

        
            // mqtt_publish,

     
            // mqtt_sn_send,

           
            // coap_get,
            // coap_post
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

