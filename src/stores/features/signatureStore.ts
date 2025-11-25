import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SignatureStore {
  signatures: Record<string, string>; // key -> base64 string
  saveSignature: (key: string, dataUrl: string) => void;
  getSignature: (key: string) => string | undefined;
  removeSignature: (key: string) => void;
  clearAllSignatures: () => void;
}

export const useSignatureStore = create<SignatureStore>()(
  persist(
    (set, get) => ({
      signatures: {},
      saveSignature: (key, dataUrl) =>
        set((state) => ({
          signatures: { ...state.signatures, [key]: dataUrl },
        })),
      getSignature: (key) => get().signatures[key],
      removeSignature: (key) =>
        set((state) => {
          const newSignatures = { ...state.signatures };
          delete newSignatures[key];
          return { signatures: newSignatures };
        }),
      clearAllSignatures: () => set({ signatures: {} }),
    }),
    {
      name: "signature-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
