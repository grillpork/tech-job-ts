"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import SignaturePad from "signature_pad";
import { useSignatureStore } from "@/stores/features/signatureStore";

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
  fromDataURL: (dataUrl: string) => void;
  getSignaturePad: () => SignaturePad | null;
}

interface SignaturePadComponentProps {
  storageKey?: string;
  penColor?: string;
  backgroundColor?: string;
  onEnd?: () => void;
  onBegin?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

const SignaturePadComponent = forwardRef<SignaturePadRef, SignaturePadComponentProps>(
  (
    {
      storageKey,
      penColor = "#000000",
      backgroundColor = "white",
      onEnd,
      onBegin,
      className = "",
      width,
      height = 200,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);

    const { saveSignature, getSignature, removeSignature } = useSignatureStore();

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const parent = canvas.parentElement;

      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const canvasWidth = width || parent?.clientWidth || 500;

        // Save strokes
        const existingData = padRef.current?.toData() || [];

        canvas.width = canvasWidth * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        ctx?.scale(ratio, ratio);

        // Restore
        if (padRef.current) {
          padRef.current.clear();
          if (existingData.length > 0) {
            padRef.current.fromData(existingData);
          }
        }
      };

      resizeCanvas();

      const pad = new SignaturePad(canvas, {
        penColor,
        backgroundColor,
      });

      padRef.current = pad;

      const handleEndStroke = () => {
        onEnd?.();
        if (storageKey) {
          const dataUrl = pad.toDataURL();
          saveSignature(storageKey, dataUrl);
        }
      };

      const handleBeginStroke = () => onBegin?.();

      pad.addEventListener("endStroke", handleEndStroke);
      pad.addEventListener("beginStroke", handleBeginStroke);

      // Load saved signature
      if (storageKey) {
        const saved = getSignature(storageKey);
        if (saved) {
          pad.fromDataURL(saved);
        }
      }

      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        pad.removeEventListener("endStroke", handleEndStroke);
        pad.removeEventListener("beginStroke", handleBeginStroke);
      };
    }, [penColor, backgroundColor, height, width]);

    // expose API
    useImperativeHandle(ref, () => ({
      clear: () => {
        if (padRef.current) {
          padRef.current.clear();
          if (storageKey) removeSignature(storageKey);
        }
      },
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toDataURL: (type = "image/png") =>
        padRef.current?.isEmpty() ? "" : padRef.current?.toDataURL(type) ?? "",
      fromDataURL: (dataUrl: string) => padRef.current?.fromDataURL(dataUrl),
      getSignaturePad: () => padRef.current,
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`border border-gray-300 rounded ${className}`}
        style={{ touchAction: "none" }}
      />
    );
  }
);

SignaturePadComponent.displayName = "SignaturePadComponent";

export default SignaturePadComponent;
