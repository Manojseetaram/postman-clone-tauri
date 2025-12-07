import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

export default function PostmanUI() {
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

    const queryString = queryParams
      .filter((q) => q.key.trim())
      .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
      .join("&");

    const finalUrl = queryString ? `${url}?${queryString}` : url;

    let finalBody: string | null = null;
    if (body.trim()) {
      try {
        finalBody = JSON.stringify(JSON.parse(body));
      } catch {
        finalBody = body;
      }
    }

    const autoHeaders =
      ["POST", "PUT", "PATCH"].includes(method)
        ? { "Content-Type": "application/json" }
        : {};

    const userHeaders = Object.fromEntries(
      headers
        .filter((h) => h.key.trim())
        .map((h) => [h.key.trim(), h.value])
    );

    const payload = {
      method,
      url: finalUrl,
      headers: { ...autoHeaders, ...userHeaders },
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
    padding: "10px 20px",
    borderRadius: 12,
    border: "1px solid #00ffc855",
    background: activeTab === tab ? "#00ffc820" : "transparent",
    color: activeTab === tab ? "#00ffc8" : "#e0e0e0",
    cursor: "pointer",
    transition: "0.3s",
    fontWeight: "600",
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #020a13, #050d18, #02131f)",
        padding: 20,
        color: "white",
        fontFamily: "'Inter', sans-serif",
        gap: 20,
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Request Bar */}
        <div
          style={{
            display: "flex",
            gap: 15,
            padding: 18,
            borderRadius: 14,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid #00ffc855",
            boxShadow: "0 0 20px #00ffc822",
          }}
        >
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: "12px 15px",
              background: "rgba(0,0,0,0.4)",
              color: "#00ffc8",
              borderRadius: 10,
              border: "1px solid #00ffc855",
              fontWeight: "600",
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
              borderRadius: 10,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid #00ffc844",
              color: "#bfffea",
            }}
          />

          <button
            onClick={sendToBackend}
            style={{
              padding: "12px 30px",
              background: "#00ffc8",
              color: "#00100c",
              fontWeight: "700",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 0 15px #00ffc899",
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
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
            borderRadius: 14,
            background: "rgba(0,0,0,0.30)",
            border: "1px solid #00ffc833",
            boxShadow: "0 0 12px #00ffc822",
          }}
        >
          {/* PARAMS */}
          {activeTab === "params" &&
            queryParams.map((p, i) => (
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
                    border: "1px solid #00ffc844",
                    color: "#cafff5",
                    borderRadius: 10,
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
                    border: "1px solid #00ffc844",
                    color: "#cafff5",
                    borderRadius: 10,
                  }}
                />
              </div>
            ))}

          {activeTab === "params" && (
            <button
              onClick={() => addRow(setQueryParams, queryParams)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                color: "#00ffc8",
                background: "rgba(0,255,200,0.12)",
                border: "1px solid #00ffc855",
                fontWeight: "600",
              }}
            >
              + Add Query
            </button>
          )}

          {/* HEADERS */}
          {activeTab === "headers" &&
            headers.map((h, i) => (
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
                    border: "1px solid #00ffc855",
                    color: "#cafff5",
                    borderRadius: 10,
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
                    border: "1px solid #00ffc855",
                    color: "#cafff5",
                    borderRadius: 10,
                  }}
                />
              </div>
            ))}

          {activeTab === "headers" && (
            <button
              onClick={() => addRow(setHeaders, headers)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                color: "#00ffc8",
                background: "rgba(0,255,200,0.12)",
                border: "1px solid #00ffc855",
                fontWeight: "600",
              }}
            >
              + Add Header
            </button>
          )}

          {/* BODY */}
          {activeTab === "body" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
             
              style={{
                width: "90%",
                padding: 16,
                borderRadius: 12,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid #00ffc855",
                color: "#cafff5",
                fontFamily: "monospace",
              }}
            />
          )}
        </div>
      </div>

      {/* RESPONSE */}
      <div
        style={{
          width: "40%",
          padding: 20,
          borderRadius: 14,
          background: "rgba(0,0,0,0.35)",
          border: "1px solid #00ffc822",
          boxShadow: "0 0 20px #00ffc822",
          color: "#bfffea",
          overflow: "auto",
          fontFamily: "monospace",
        }}
      >
        <h2 style={{ marginBottom: 15, color: "#00ffc8" }}>Response</h2>
        {loading
          ? "⏳ Loading..."
          : response
          ? JSON.stringify(response, null, 2)
          : "No response yet"}
      </div>
    </div>
  );
}
