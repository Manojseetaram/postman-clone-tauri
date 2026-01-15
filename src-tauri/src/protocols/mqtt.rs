use rumqttc::{Client, MqttOptions, QoS};
use std::time::Duration;

pub fn publish(
    broker: String,
    port: u16,
    topic: String,
    qos: u8,
    message: String,
) -> Result<serde_json::Value, String> {

    let mut options = MqttOptions::new("tauri-client", broker, port);
    options.set_keep_alive(Duration::from_secs(10));

    let (client, mut connection) = Client::new(options, 10);

    std::thread::spawn(move || {
        for _ in connection.iter() {}
    });

    let qos = match qos {
        0 => QoS::AtMostOnce,
        1 => QoS::AtLeastOnce,
        _ => QoS::ExactlyOnce,
    };

    client.publish(topic, qos, false, message)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "status": "MQTT sent" }))
}
