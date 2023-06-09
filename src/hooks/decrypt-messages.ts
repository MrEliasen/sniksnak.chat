import { Message } from "@prisma/client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { api } from "~/utils/api";
import { decrypt, verify } from "~/utils/crypto-helper";
import { ImportedAuthorKeys } from "./import-keys";

export type DecryptedMessage = {
    readonly id: string;
    readonly message: string;
    readonly createdAt: Date;
    readonly isAuthor: boolean;
};

const decryptMessage =
    (cryptoKey: CryptoKey, authorKeys: ImportedAuthorKeys) =>
    async (msg: Message): Promise<DecryptedMessage> => {
        const authorSignature = await verify(
            msg.messageSignature,
            msg.authorSignature,
            authorKeys.publicKey,
        );

        const text = await decrypt(
            {
                ciphertext: msg.message,
                iv: msg.iv,
            },
            cryptoKey,
        );

        return {
            id: msg.id,
            message: text,
            createdAt: msg.createdAt,
            isAuthor: authorSignature,
        };
    };

const useDecryptedMessages = (
    roomId: string | null,
    appIsReady: boolean,
    isInvalidRoom: boolean,
    setIsInvalidRoom: Dispatch<SetStateAction<boolean>>,
    authorKeys: ImportedAuthorKeys | null,
    cryptoKey: CryptoKey | null,
) => {
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [fetchInterval, setFetchInterval] = useState<NodeJS.Timer | null>(
        null,
    );
    const [autoFetchInterval, setAutoFetchInterval] =
        useState<NodeJS.Timer | null>(null);
    const [decryptedMessages, setDecryptedMessages] = useState<
        DecryptedMessage[]
    >([]);
    const [isInitialised, setIsInitialised] = useState<boolean>(false);

    const chatMessages = api.room.getMessages.useQuery(
        {
            roomId: roomId ?? "",
            timestamp: decryptedMessages.at(-1)?.createdAt ?? undefined,
        },
        {
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            enabled: appIsReady,
            retry: (failureCount: number, error): boolean => {
                if (failureCount < 3 && roomId === "") {
                    return true;
                }

                if (error.data?.code === "NOT_FOUND") {
                    setIsInvalidRoom(true);
                    return false;
                }

                return true;
            },
        },
    );

    const setupAutoFetch = () => {
        if (fetchInterval !== null || autoFetchInterval !== null) {
            return;
        }

        const intval = setInterval(() => {
            if (isInvalidRoom && fetchInterval !== null) {
                clearInterval(fetchInterval);
                return;
            }

            if (chatMessages.isRefetching) {
                return;
            }

            chatMessages.refetch();
        }, 1000);

        setFetchInterval(intval);
        setAutoFetchInterval(intval);
    };

    // when we have new messages, load them
    useEffect(() => {
        if (!appIsReady || cryptoKey === null || authorKeys === null) {
            return;
        }

        if (
            chatMessages.isLoading ||
            !chatMessages.data?.messages ||
            chatMessages.dataUpdatedAt <= lastFetch
        ) {
            return;
        }

        setLastFetch(chatMessages.dataUpdatedAt);

        if (!isInitialised) {
            setIsInitialised(true);
            setupAutoFetch();
        }

        Promise.all(
            chatMessages.data.messages.map<Promise<DecryptedMessage>>(
                decryptMessage(cryptoKey, authorKeys),
            ),
        )
            .then((messages: DecryptedMessage[]) => {
                setDecryptedMessages((existing) => [...existing, ...messages]);
            })
            .catch(() => {
                setIsInvalidRoom(true);
            });
    }, [chatMessages.dataUpdatedAt, chatMessages.data, appIsReady]);

    return {
        decryptedMessages,
        chatMessages,
    };
};

export default useDecryptedMessages;
