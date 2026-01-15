use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Deserialize)]
#[serde(tag = "protocol")]
pub enum UniversalPayload {
    HTTP {
        method: String,
        url: String,
        headers: Option<HashMap<String, String>>,
        body: Option<String>,
    },
    MQTT {
        broker: String,
        port: u16,
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
        host: String,
        path: String,
        payload: Option<String>,
    },
}

#[derive(Serialize)]
pub struct UniversalResponse {
    pub status: serde_json::Value,
}
