const { subtle } = (typeof window !== "undefined") ? window.crypto : globalThis.crypto;

export type EncryptedPayload = { ciphertext: string, iv: string };
export type ExportedKey = { privateKey: string };
export type ExportedSigningKey = { privateKey: string, publicKey: string };

export const encryptionAlgorithm: AesKeyGenParams = {
    name: "AES-GCM",
    length: 256,
};
export const signingKeyAlgorithm: EcKeyGenParams = {
    name: "ECDSA",
    namedCurve: "P-256"
};
export const signingAlgorithm: EcdsaParams = {
    name: "ECDSA",
    hash: {name: "SHA-512"},
};

export function byteArrayToString(byteArray: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(byteArray)));
}

export function stringToByteArray(base64String: string): ArrayBuffer {
    return Uint8Array.from(atob(base64String), char => char.charCodeAt(0));
}

export function generateSigningKey(): Promise<CryptoKeyPair> {
    return subtle.generateKey(
        signingKeyAlgorithm,
        true,
        ["sign", "verify"]
    );
}

export function importSigningKey(cryptoKey: string): Promise<CryptoKey> {
    const jsonString = atob(cryptoKey);
    const jwk = JSON.parse(jsonString);

    return subtle.importKey(
        "jwk",
        jwk,
        signingKeyAlgorithm,
        true,
        jwk.key_ops,
    );
}

export function importVerifyKey(cryptoKey: string): Promise<CryptoKey> {
    const jsonString = atob(cryptoKey);
    const jwk = JSON.parse(jsonString);

    return subtle.importKey(
        "jwk",
        jwk,
        signingKeyAlgorithm,
        true,
        jwk.key_ops,
    );
}

export async function sign(message: string, cryptoKey: CryptoKey): Promise<string> {
    const enc = new TextEncoder();

    const signature = await subtle.sign(
        signingAlgorithm,
        cryptoKey,
        enc.encode(message),
    );

    return byteArrayToString(signature);
}

export function verify(message: string, signature: string, key: CryptoKey): Promise<boolean> {
    const enc = new TextEncoder();

    return subtle.verify(
        signingAlgorithm,
        key,
        stringToByteArray(signature),
        enc.encode(message)
    );
}

export function generateEncryptionKey(): Promise<CryptoKey> {
    return subtle.generateKey(
        encryptionAlgorithm,
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(message: string, encryptionKey: CryptoKey): Promise<EncryptedPayload> {
    const enc = new TextEncoder();

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await subtle.encrypt(
        {
            name: encryptionAlgorithm.name,
            iv: iv
        },
        encryptionKey,
        enc.encode(message)
    );

    return {
        ciphertext: byteArrayToString(ciphertext),
        iv: byteArrayToString(iv)
    }
}

export async function decrypt(payload: EncryptedPayload, decryptionKey: CryptoKey): Promise<string> {
    const dec = new TextDecoder();

    const decrypted = await subtle.decrypt(
        {
            name: encryptionAlgorithm.name,
            iv: stringToByteArray(payload.iv)
        },
        decryptionKey,
        stringToByteArray(payload.ciphertext),
    );

    return dec.decode(decrypted)
}

export function importEncryptionKey(cryptoKey: string): Promise<CryptoKey> {
    return subtle.importKey(
        "raw",
        stringToByteArray(cryptoKey),
        encryptionAlgorithm.name,
        false,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(cryptoKey: CryptoKey | CryptoKeyPair): Promise<ExportedKey> {
    const isKeyPair = !(cryptoKey instanceof CryptoKey);
    let privateKey: ArrayBuffer | null = null;
    let publicKey: ArrayBuffer | null = null;

    // export the private key
    privateKey = await subtle.exportKey(
        isKeyPair ? "pkcs8" : "raw",
        isKeyPair ? cryptoKey.privateKey : cryptoKey
    );

    if (isKeyPair) {
        // export the public key
        publicKey = await subtle.exportKey(
            "raw",
            cryptoKey.publicKey
        );
    }

    return {
        privateKey: byteArrayToString(privateKey),
    };
}

export async function exportSigningKey(cryptoKey: CryptoKeyPair): Promise<ExportedSigningKey> {
    let privateKey: JsonWebKey;
    let publicKey: JsonWebKey;

    // export the private key
    privateKey = await subtle.exportKey(
        "jwk",
        cryptoKey.privateKey,
    );

    // export the public key
    publicKey = await subtle.exportKey(
        "jwk",
        cryptoKey.publicKey
    );

    return {
        privateKey: btoa(JSON.stringify(privateKey)),
        publicKey: btoa(JSON.stringify(publicKey)),
    };
}