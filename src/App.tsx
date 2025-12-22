import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

export default function PostmanUI() {

  const [protocol, setProtocol] = useState("HTTP");

 
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");

  
  const [broker, setBroker] = useState("");
  const [topic, setTopic] = useState("");
  const [qos, setQos] = useState(0);

  
  const [coapMethod, setCoapMethod] = useState("GET");
  const [coapUrl, setCoapUrl] = useState("");

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("params");


  const sendToBackend = async () => {
    setLoading(true);
    setResponse(null);

    let payload: any = { protocol };


    if (protocol === "HTTP") {
      const query = queryParams
        .filter(q => q.key)
        .map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
        .join("&");

      const finalUrl = query ? `${url}?${query}` : url;

      const headerObj = Object.fromEntries(
        headers.filter(h => h.key).map(h => [h.key, h.value])
      );

      payload = {
        protocol,
        method,
        url: finalUrl,
        headers: {
          "Content-Type": "application/json",
          ...headerObj,
        },
        body,
      };
    }

  
    if (protocol === "MQTT" || protocol === "MQTT-SN") {
      payload = {
        protocol,
        broker,
        topic,
        qos,
        message: body,
      };
    }

    if (protocol === "COAP") {
      payload = {
        protocol,
        method: coapMethod,
        url: coapUrl,
        payload: body,
      };
    }

    try {
      const res = await invoke("send_request", { payload });
      setResponse(res);
    } catch (err) {
      setResponse({ error: String(err) });
    }

    setLoading(false);
  };


  const card = {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(14px)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 10px 35px rgba(0,0,0,0.5)",
  };

  const input = {
    padding: "12px 14px",
    borderRadius: 12,
    background: "#1c1c2b",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    fontSize: 14,
    width: "100%",
  };

  const tab = (active: boolean) => ({
    padding: "10px 22px",
    borderRadius: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "#8b5cf6" : "rgba(255,255,255,0.12)",
    color: active ? "#fff" : "#d1d1d1",
  });


  return (
    <div
      style={{
        height: "100vh",
        padding: 30,
        display: "flex",
        gap: 20,
        background:
          "linear-gradient(135deg, #0a0a12, #121428, #1a1035, #120f23)",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
     
        <div style={{ ...card, padding: 20, display: "flex", gap: 12 }}>
          <select value={protocol} onChange={(e) => setProtocol(e.target.value)} style={input}>
            <option>HTTP</option>
            <option>MQTT</option>
            <option>MQTT-SN</option>
            <option>COAP</option>
          </select>

          {protocol === "HTTP" && (
            <>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={input}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input
                placeholder="https://api.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={input}
              />
            </>
          )}

          {(protocol === "MQTT" || protocol === "MQTT-SN") && (
            <>
              <input
                placeholder="mqtt://broker:port"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                style={input}
              />
              <input
                placeholder="Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={input}
              />
              <select value={qos} onChange={(e) => setQos(Number(e.target.value))} style={input}>
                <option value={0}>QoS 0</option>
                <option value={1}>QoS 1</option>
                <option value={2}>QoS 2</option>
              </select>
            </>
          )}

          {protocol === "COAP" && (
            <>
              <select value={coapMethod} onChange={(e) => setCoapMethod(e.target.value)} style={input}>
                {["GET", "POST", "PUT", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input
                placeholder="coap://host:port/resource"
                value={coapUrl}
                onChange={(e) => setCoapUrl(e.target.value)}
                style={input}
              />
            </>
          )}

          <button
            onClick={sendToBackend}
            style={{
              padding: "12px 30px",
              background: "#ffb300",
              color: "#000",
              fontWeight: 800,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

    
        <div style={{ ...card, padding: 20, flex: 1 }}>
        
          {protocol === "HTTP" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button style={tab(activeTab === "params")} onClick={() => setActiveTab("params")}>
                Params
              </button>
              <button style={tab(activeTab === "headers")} onClick={() => setActiveTab("headers")}>
                Headers
              </button>
              <button style={tab(activeTab === "body")} onClick={() => setActiveTab("body")}>
                Body
              </button>
            </div>
          )}

        
          {activeTab === "params" &&
            queryParams.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <input
                  placeholder="Key"
                  value={p.key}
                  onChange={(e) => {
                    const c = [...queryParams];
                    c[i].key = e.target.value;
                    setQueryParams(c);
                  }}
                  style={input}
                />
                <input
                  placeholder="Value"
                  value={p.value}
                  onChange={(e) => {
                    const c = [...queryParams];
                    c[i].value = e.target.value;
                    setQueryParams(c);
                  }}
                  style={input}
                />
              </div>
            ))}

          {activeTab === "headers" &&
            headers.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <input
                  placeholder="Header"
                  value={h.key}
                  onChange={(e) => {
                    const c = [...headers];
                    c[i].key = e.target.value;
                    setHeaders(c);
                  }}
                  style={input}
                />
                <input
                  placeholder="Value"
                  value={h.value}
                  onChange={(e) => {
                    const c = [...headers];
                    c[i].value = e.target.value;
                    setHeaders(c);
                  }}
                  style={input}
                />
              </div>
            ))}

          
          {activeTab === "body" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="JSON / Payload"
              style={{ ...input, height: "90%", width : "95%" , fontFamily: "monospace" }}
            />
          )}
        </div>
      </div>

   
      <div style={{ width: "38%", ...card, padding: 20 }}>
        <h2 style={{ color: "#b794f4" }}>Response</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
          {loading ? "Loading…" : response ? JSON.stringify(response, null, 2) : "No response"}
        </pre>
      </div>
    </div>
  );
}
