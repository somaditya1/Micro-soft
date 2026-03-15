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

        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
            alert("Camera not supported here. Try HTTPS (Vercel/ngrok) or another browser.");
            setActive(false);
            return;
        }

        start();
        return () => {
            try { controls?.stop(); } catch { }
            try { codeReader.reset(); } catch { }
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
                    <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
                        <video
                            ref={videoRef}
                            style={{ width: "100%", borderRadius: 12 }}
                            muted
                            playsInline
                        />

                        {/* Overlay */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    width: "80%",
                                    maxWidth: 170,
                                    height: 140,
                                    border: "3px solid rgba(255,255,255,0.9)",
                                    borderRadius: 16,
                                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)", // darkens outside
                                }}
                            />
                        </div>

                        {/*Helper Text*/}
                        <div
                            style={{
                                position: "absolute",
                                bottom: 10,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                color: "white",
                                fontWeight: 600,
                                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                pointerEvents: "none",
                            }}
                        >
                            Align barcode inside the box
                        </div>
                    </div>
                    <button onClick={() => setActive(false)} style={{ padding: 10, marginTop: 10, backgroundColor: "white", color: "black" }}>
                        Stop
                    </button>
                </>
            )}
        </div>
    );
}