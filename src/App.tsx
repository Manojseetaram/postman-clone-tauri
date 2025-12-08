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
      headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])
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
    padding: "10px 22px",
    borderRadius: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: activeTab === tab ? "#8b5cf6" : "rgba(255,255,255,0.12)",
    color: activeTab === tab ? "#fff" : "#d1d1d1",
    boxShadow:
      activeTab === tab ? "0 0 12px rgba(139,92,246,0.6)" : "none",
    transition: "0.25s",
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(135deg, #0a0a12, #121428, #1a1035, #120f23)",
        padding: 30,
        boxSizing: "border-box",
        color: "white",
        fontFamily: "'Inter', sans-serif",
        gap: 20,
        paddingTop: 40,
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Request Bar */}
        <div
          style={{
            display: "flex",
            gap: 15,
            padding: 22,
            borderRadius: 18,
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: "12px 20px",
              background: "#1c1c2b",
              color: "white",
              fontWeight: 600,
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
              background: "#1c1c2b",
              border: "1px solid rgba(255,255,255,0.15)",
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
              fontWeight: 700,
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
            overflowY: "auto",
            padding: 22,
            borderRadius: 18,
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
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
                      background: "#1c1c2b",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
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
                      background: "#1c1c2b",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => addRow(setQueryParams, queryParams)}
                style={{
                  padding: "8px 18px",
                  background: "rgba(139,92,246,0.15)",
                  borderRadius: 12,
                  color: "#b794f4",
                  border: "1px solid rgba(139,92,246,0.3)",
                  cursor: "pointer",
                  fontWeight: 600,
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
                      background: "#1c1c2b",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
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
                      background: "#1c1c2b",
                      color: "white",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => addRow(setHeaders, headers)}
                style={{
                  padding: "8px 18px",
                  background: "rgba(139,92,246,0.15)",
                  borderRadius: 12,
                  color: "#b794f4",
                  border: "1px solid rgba(139,92,246,0.3)",
                  cursor: "pointer",
                  fontWeight: 600,
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
              // placeholder='{"name": "Manoj"}'
              style={{
                width: "90%",
                padding: 16,
                borderRadius: 12,
                background: "#1c1c2b",
                color: "white",
                fontFamily: "monospace",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
          )}
        </div>
      </div>

      {/* RIGHT SIDE RESPONSE */}
      <div
        style={{
          width: "40%",
          padding: 5,
          borderRadius: 18,
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
          whiteSpace: "pre-wrap",
          overflowY: "auto",
          fontFamily: "monospace",
          height: "calc(100vh - 80px)",
        }}
      >
        <h2 style={{ marginBottom: 15, color: "#b794f4" }}>Response</h2>

        {loading
          ? " Loading..."
          : response
          ? JSON.stringify(response, null, 2)
          : "No response yet"}
      </div>
    </div>
  );
}
