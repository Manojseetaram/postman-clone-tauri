#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};

use std::collections::HashMap;

#[tauri::command]
async fn send_request(payload: RequestPayload) -> Result<ResponsePayload, String> {
    let client = reqwest::Client::new();

    
    let method = payload.method.parse::<reqwest::Method>().map_err(|e| e.to_string())?;

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

    let json: serde_json::Value = serde_json::from_str(&text)
        .unwrap_or_else(|_| serde_json::json!({ "raw": text }));

    Ok(ResponsePayload { status, body: json })
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
