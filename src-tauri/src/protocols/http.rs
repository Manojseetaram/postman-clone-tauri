use reqwest::Client;
use std::collections::HashMap;

pub async fn send(
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = Client::new();

    let method = method.parse::<reqwest::Method>()
        .map_err(|e| e.to_string())?;

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
