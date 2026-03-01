"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;

    const codeReader = new BrowserMultiFormatReader();
    let controls;

    async function start() {
      try {
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              onDetected?.(text);
              // stop after first scan so it doesn’t keep firing
              controls?.stop();
              setActive(false);
            }
          }
        );
      } catch (e) {
        console.error(e);
        alert("Camera failed. Use manual barcode input instead.");
        setActive(false);
      }
    }

    start();
    return () => {
      try { controls?.stop(); } catch {}
      try { codeReader.reset(); } catch {}
    };
  }, [active, onDetected]);

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
      {!active ? (
        <button onClick={() => setActive(true)} style={{ padding: 10 }}>
          Start Camera Scanner
        </button>
      ) : (
        <>
          <p>Point camera at barcode…</p>
          <video ref={videoRef} style={{ width: "100%", maxWidth: 480 }} />
          <button onClick={() => setActive(false)} style={{ padding: 10, marginTop: 10 }}>
            Stop
          </button>
        </>
      )}
    </div>
  );
}