import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
function parseCoapUrl(url: string) {
  const clean = url.replace(/^coap:\/\//, "");
  const [hostPort, ...pathParts] = clean.split("/");
  return { host: hostPort, path: pathParts.join("/") };
}



export default function PostmanUI() {
  const [protocol, setProtocol] = useState("HTTP");

  // HTTP
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");

  // MQTT / MQTT-SN
  const [broker, setBroker] = useState("");
  const [port, setPort] = useState(1883);
  const [topic, setTopic] = useState("");
  const [qos, setQos] = useState(0);

  // COAP
  const [coapMethod, setCoapMethod] = useState("GET");
  const [coapUrl, setCoapUrl] = useState("");

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("params");

  /* ---------- RESET UI WHEN PROTOCOL CHANGES ---------- */
  useEffect(() => {
    setBody("");
    setResponse(null);

    if (protocol !== "HTTP") {
      setActiveTab("body");
      setHeaders([{ key: "", value: "" }]);
      setQueryParams([{ key: "", value: "" }]);
    }
  }, [protocol]);

  /* ---------- SEND ---------- */
  const sendToBackend = async () => {
    setLoading(true);
    setResponse(null);

    let payload: any;

    if (protocol === "COAP") {
  const { host, path } = parseCoapUrl(coapUrl.trim());

  if (!host || !host.includes(":")) {
    setResponse({ error: "Invalid CoAP URL. Use coap://host:port/path" });
    setLoading(false);
    return;
  }

  payload = {
    protocol: "COAP",
    method: coapMethod,
    host,
    path: path || "test", // ✅ fallback
    payload: body || null,
  };
}


    if (protocol === "MQTT") {
      payload = { protocol: "MQTT", broker, port, topic, qos, message: body };
    }

    if (protocol === "MQTT-SN") {
      payload = { protocol: "MQTT-SN", gateway: broker, port, data: body };
    }

   if (protocol === "COAP") {
  const { host, path } = parseCoapUrl(coapUrl.trim());

  if (!host || !host.includes(":")) {
    setResponse({ error: "Invalid CoAP URL. Use coap://host:port/path" });
    setLoading(false);
    return;
  }

  payload = {
    protocol: "COAP",
    method: coapMethod,
    host,
    path: path || "test", // fallback if user only typed host
    payload: body || null,
  };
}



    try {
      const res = await invoke("send_universal", { payload });
      setResponse(res);
    } catch (e) {
      setResponse({ error: String(e) });
    }

    setLoading(false);
  };

  /* ---------- STYLES ---------- */
  const card = { background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: 20 };
  const input = { padding: 12, borderRadius: 12, background: "#1c1c2b", color: "white", width: "100%" };

  return (
    <div style={{ height: "100vh", padding: 30, display: "flex", gap: 20, background: "#0b0b16", color: "white" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* ---------- TOP BAR ---------- */}
        <div style={{ ...card, display: "flex", gap: 12 }}>
          <select value={protocol} onChange={e => setProtocol(e.target.value)} style={input}>
            <option>HTTP</option>
            <option>MQTT</option>
            <option>MQTT-SN</option>
            <option>COAP</option>
          </select>

          {protocol === "HTTP" && (
            <>
              <select value={method} onChange={e => setMethod(e.target.value)} style={input}>
                {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m}>{m}</option>)}
              </select>
              <input placeholder="https://api.example.com" value={url} onChange={e => setUrl(e.target.value)} style={input} />
            </>
          )}

          {(protocol === "MQTT" || protocol === "MQTT-SN") && (
            <>
              <input placeholder="Broker (test.mosquitto.org)" value={broker} onChange={e => setBroker(e.target.value)} style={input} />
              <input type="number" placeholder="1883" value={port} onChange={e => setPort(+e.target.value)} style={input} />
              {protocol === "MQTT" && (
                <input placeholder="Topic" value={topic} onChange={e => setTopic(e.target.value)} style={input} />
              )}
              <select value={qos} onChange={e => setQos(+e.target.value)} style={input}>
                <option value={0}>QoS 0</option>
                <option value={1}>QoS 1</option>
                <option value={2}>QoS 2</option>
              </select>
            </>
          )}

          {protocol === "COAP" && (
            <>
              <select value={coapMethod} onChange={e => setCoapMethod(e.target.value)} style={input}>
                {["GET","POST","PUT","DELETE"].map(m => <option key={m}>{m}</option>)}
              </select>
              <input placeholder="coap://host:port/path" value={coapUrl} onChange={e => setCoapUrl(e.target.value)} style={input} />
            </>
          )}

          <button onClick={sendToBackend} style={{ padding: "12px 30px", background: "#ffb300", fontWeight: 800 }}>
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

        {/* ---------- BODY / PARAMS ---------- */}
        <div style={{ ...card, flex: 1 }}>
          {protocol === "HTTP" && (
            <div style={{ marginBottom: 10 }}>
              <button onClick={() => setActiveTab("params")}>Params</button>
              <button onClick={() => setActiveTab("headers")}>Headers</button>
              <button onClick={() => setActiveTab("body")}>Body</button>
            </div>
          )}

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={protocol.includes("MQTT") ? "MQTT Payload" : "Payload"}
            style={{ ...input, height: "90%", fontFamily: "monospace" }}
          />
        </div>
      </div>

      {/* ---------- RESPONSE ---------- */}
      <div style={{ width: "35%", ...card }}>
        <h3>Response</h3>
        <pre>{response ? JSON.stringify(response, null, 2) : "No response"}</pre>
      </div>
    </div>
  );
}
