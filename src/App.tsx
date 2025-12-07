import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import "./App.css"
export default function RustmanUI() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("params");
  
 

const sendToBackend = async () => {
  if (!url.trim()) return alert("Enter URL");
  setLoading(true);
  setResponse(null);

  // Build query params
  const queryString = queryParams
    .filter(q => q.key.trim())
    .map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
    .join("&");

  const finalUrl = queryString ? `${url}?${queryString}` : url;

  // Parse body if it's valid JSON
  let finalBody: string | null = null;

  if (body.trim()) {
    try {
      finalBody = JSON.stringify(JSON.parse(body)); // normalize JSON
    } catch {
      // If invalid JSON, still send raw string
      finalBody = body;
    }
  }

  // Auto-json header if method requires a body
  const autoHeaders =
    ["POST", "PUT", "PATCH"].includes(method)
      ? { "Content-Type": "application/json" }
      : {};

  const userHeaders = Object.fromEntries(
    headers
      .filter(h => h.key.trim())
      .map(h => [h.key.trim(), h.value])
  );

  const payload = {
    method,
    url: finalUrl,
    headers: { ...autoHeaders, ...userHeaders }, // user headers override auto ones
    body: finalBody,
  };

  try {
    const res = await invoke("send_request", { payload });
    setResponse(res);
  } catch (err) {
    setResponse({ error: String(err) });
  }

  setLoading(false);
};

  const addRow = (setter: any, rows: any[]) =>
    setter([...rows, { key: "", value: "" }]);

  const tabButton = (tab: string) => ({
    padding: "10px 25px",
    borderRadius: 14,
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    background: activeTab === tab ? "#00ffaa" : "rgba(255,255,255,0.12)",
    color: activeTab === tab ? "#000" : "#fff",
    boxShadow: activeTab === tab ? "0 0 10px #00ffaa75" : "none",
    transition: "0.3s",
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #0e0f17, #151726, #0e0f17)",
        padding: 20,
        boxSizing: "border-box",
        color: "white",
        fontFamily: "'Inter', sans-serif",
        gap: 20,
      }}
    >
      {/* LEFT SIDE (Request Builder) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Request Bar */}
        <div
          style={{
            display: "flex",
            gap: 15,
            padding: 20,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          }}
        >
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: "12px 20px",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              fontWeight: "600",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="https://api.example.com/user"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              background: "rgba(0,0,0,0.30)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 15,
            }}
          />

          <button
            onClick={sendToBackend}
            style={{
              padding: "12px 30px",
              background: "#ffb300",
              color: "#000",
              fontWeight: "700",
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button style={tabButton("params")} onClick={() => setActiveTab("params")}>
            Params
          </button>
          <button style={tabButton("headers")} onClick={() => setActiveTab("headers")}>
            Headers
          </button>
          <button style={tabButton("body")} onClick={() => setActiveTab("body")}>
            Body
          </button>
        </div>

        {/* Tab Content */}
        <div
          style={{
            marginTop: 20,
            flex: 1,
            overflow: "auto",
            padding: 20,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
          }}
        >
          {/* PARAMS */}
          {activeTab === "params" && (
            <>
              {queryParams.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <input
                    placeholder="Key"
                    value={p.key}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].key = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 10,
                      flex: 1,
                      background: "rgba(0,0,0,0.25)",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <input
                    placeholder="Value"
                    value={p.value}
                    onChange={(e) => {
                      const arr = [...queryParams];
                      arr[i].value = e.target.value;
                      setQueryParams(arr);
                    }}
                    style={{
                      padding: 10,
                      flex: 1,
                      background: "rgba(0,0,0,0.25)",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() => addRow(setQueryParams, queryParams)}
                style={{
                  padding: "8px 18px",
                  background: "rgba(0,255,170,0.1)",
                  borderRadius: 12,
                  color: "#00ffaa",
                  border: "1px solid #00ffaa50",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                + Add Query
              </button>
            </>
          )}

          {/* HEADERS */}
          {activeTab === "headers" && (
            <>
              {headers.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <input
                    placeholder="Header Key"
                    value={h.key}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].key = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 10,
                      flex: 1,
                      background: "rgba(0,0,0,0.25)",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <input
                    placeholder="Header Value"
                    value={h.value}
                    onChange={(e) => {
                      const arr = [...headers];
                      arr[i].value = e.target.value;
                      setHeaders(arr);
                    }}
                    style={{
                      padding: 10,
                      flex: 1,
                      background: "rgba(0,0,0,0.25)",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() => addRow(setHeaders, headers)}
                style={{
                  padding: "8px 18px",
                  background: "rgba(0,255,170,0.1)",
                  borderRadius: 12,
                  color: "#00ffaa",
                  border: "1px solid #00ffaa50",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                + Add Header
              </button>
            </>
          )}

          {/* BODY */}
          {activeTab === "body" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder='{"name": "Manoj"}'
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 12,
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontFamily: "monospace",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          )}
        </div>
      </div>

      {/* RIGHT SIDE (Response Viewer) */}
      <div
        style={{
          width: "40%",
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          whiteSpace: "pre-wrap",
          overflow: "auto",
          fontFamily: "monospace",
        }}
      >
        <h2 style={{ marginBottom: 15 }}>Response</h2>

        {loading
          ? "⏳ Loading..."
          : response
          ? JSON.stringify(response, null, 2)
          : "No response yet"}
      </div>
    </div>
  );
}
