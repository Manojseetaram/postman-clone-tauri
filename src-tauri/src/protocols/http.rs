use reqwest::Client;
use std::collections::HashMap;

pub async fn send(
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<serde_json::Value, String> {

    println!("🌐 Sending HTTP request...");
    println!("➡ Method: {}", method);
    println!("➡ URL: {}", url);

    let client = Client::new();

    let method = method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    let mut req = client.request(method, &url);

    if let Some(h) = &headers {
        println!("➡ Headers:");
        for (k, v) in h {
            println!("   {}: {}", k, v);
            req = req.header(k, v);
        }
    }

    if let Some(b) = &body {
        println!("➡ Body: {}", b);
        req = req.body(b.clone());
    }

    let res = req.send().await.map_err(|e| format!("Request failed: {}", e))?;
    let status = res.status().as_u16();
    let text = res.text().await.map_err(|e| e.to_string())?;

    println!("⬅ HTTP Response");
    println!("⬅ Status: {}", status);
    println!("⬅ Body: {}", text);

    Ok(serde_json::json!({
        "status": status,
        "body": text
    }))
}
