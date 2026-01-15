use std::net::UdpSocket;

pub fn send(
    gateway: String,
    port: u16,
    data: String,
) -> Result<serde_json::Value, String> {

    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| e.to_string())?;

    socket.send_to(
        data.as_bytes(),
        format!("{}:{}", gateway, port),
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "status": "MQTT-SN sent" }))
}
