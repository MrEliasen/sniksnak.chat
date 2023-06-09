import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getAuthorKeys, AuthorKeys } from "~/components/author-details";
import {
    importEncryptionKey,
    importSigningKey,
    importVerifyKey,
} from "~/utils/crypto-helper";
import { fakeWait } from "~/utils/misc";
import { HashData } from "~/views/chat-room";

export type ImportedAuthorKeys = {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
};

const loadAuthorKeys = async (): Promise<ImportedAuthorKeys> => {
    const keys: AuthorKeys = await getAuthorKeys();

    if (!keys.privateKey || !keys.publicKey) {
        await fakeWait(200);
        return loadAuthorKeys();
    }

    const privateKey: CryptoKey = await importSigningKey(keys.privateKey);
    const publicKey: CryptoKey = await importVerifyKey(keys.publicKey);

    return { privateKey, publicKey };
};

const useImportKeys = (
    hashData: HashData,
    isInvalidRoom: boolean,
    setIsInvalidRoom: Dispatch<SetStateAction<boolean>>,
) => {
    const [isLoadingAuthorKeys, setIsLoadingAuthorKeys] =
        useState<boolean>(false);
    const [authorKeys, setAuthorKeys] = useState<ImportedAuthorKeys | null>(
        null,
    );
    const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
    const [signingKey, setSigningKey] = useState<CryptoKey | null>(null);

    // import crypto key
    useEffect(() => {
        if (isInvalidRoom) {
            return;
        }

        if (hashData.encryptionKey === null || hashData.signingKey === null) {
            return;
        }

        if (isLoadingAuthorKeys) {
            return;
        }

        setIsLoadingAuthorKeys(true);

        try {
            importEncryptionKey(hashData.encryptionKey).then(
                (key: CryptoKey) => {
                    setCryptoKey(key);
                },
            );

            importSigningKey(hashData.signingKey).then((key: CryptoKey) => {
                setSigningKey(key);
            });
        } catch (err) {
            setIsInvalidRoom(true);
            return;
        }

        loadAuthorKeys().then((keys: ImportedAuthorKeys) => {
            setAuthorKeys(keys);
        });
    }, [hashData, isInvalidRoom, isLoadingAuthorKeys, setIsInvalidRoom]);

    return {
        authorKeys,
        cryptoKey,
        signingKey,
    };
};

export default useImportKeys;
