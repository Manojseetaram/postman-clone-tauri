use coap_lite::{CoapRequest, RequestType};
use std::net::{UdpSocket, ToSocketAddrs};

pub fn send(
    method: String,
    host: String,
    path: String,
    payload: Option<String>,
) -> Result<serde_json::Value, String> {

    let mut req: CoapRequest<()> = CoapRequest::new();

    match method.as_str() {
        "GET" => req.set_method(RequestType::Get),
        "POST" => req.set_method(RequestType::Post),
        _ => return Err("Unsupported CoAP method".into()),
    }

    req.set_path(&path);

    if let Some(p) = payload {
        req.message.payload = p.into_bytes();
    }

    let packet = req.message.to_bytes().map_err(|e| e.to_string())?;

    let addr = host.to_socket_addrs()
        .map_err(|e| e.to_string())?
        .next()
        .ok_or("Invalid host")?;

    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| e.to_string())?;

    socket.send_to(&packet, addr).map_err(|e| e.to_string())?;

    let mut buf = [0u8; 1500];
    let (size, _) = socket.recv_from(&mut buf).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "response": String::from_utf8_lossy(&buf[..size])
    }))
}
