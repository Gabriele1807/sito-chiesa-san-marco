export type InstallPlatform = "ios-safari" | "ios-other" | "prompt" | "unsupported";
export interface InstallState {
    /** Aperta come app installata (standalone). */
    standalone: boolean;
    platform: InstallPlatform;
    installed: boolean;
}
/** Da chiamare una volta, il prima possibile (PwaManager). */
export declare function initInstallStore(): void;
/** Apre il dialogo di installazione del browser. Restituisce l'esito. */
export declare function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable">;
export declare function useInstallState(): InstallState;
/** True se il sito può offrire l'installazione su questo dispositivo. */
export declare function canOfferInstall(s: InstallState): boolean;
