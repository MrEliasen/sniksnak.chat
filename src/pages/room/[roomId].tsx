import { type NextPage } from "next";
import { api } from "~/utils/api";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Message, Room } from "@prisma/client";
import { useRouter as UseRouter } from 'next/router'; // lint fix..
import { importEncryptionKey, importSigningKey, encrypt, decrypt, sign, importVerifyKey, verify } from "~/utils/crypto-helper";
import Logo from "~/components/logo";
import Header from "~/components/header";
import NewMessageInput from "~/components/new-message";
import { getAuthorKeys, AuthorKeys } from "~/components/author-details";
import ChatMessagesList from "~/components/chat-messages-list";
import { fakeWait } from "~/utils/misc";
import Main from "~/components/main";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";

type HashData = {
    readonly encryptionKey: string | null,
    readonly signingKey: string | null,
    readonly roomId: string | null,
};
export type DecryptedMessage = {
    readonly id: string,
    readonly message: string,
    readonly createdAt: Date,
    readonly isAuthor: boolean,
};
type roomData = {
    messages: Message[],
}

type ImportedAuthorKeys = {
    privateKey: CryptoKey,
    publicKey: CryptoKey,
};

const getHashData = (): HashData => {
    const { asPath, query } = UseRouter();
    const hashData = asPath.split('#')?.at(-1)?.split('|') ?? ['', ''];
    const encryptionKey = hashData[0] ? decodeURIComponent(hashData[0]) : null;
    const signingKey = hashData[1] ? decodeURIComponent(hashData[1]) : null;

    return { encryptionKey, signingKey, roomId: (query?.roomId ?? null) as string };
};

const loadAuthorKeys = async (): Promise<ImportedAuthorKeys> => {
    const keys: AuthorKeys = await getAuthorKeys()

    if (!keys.privateKey || !keys.publicKey) {
        await fakeWait(200);
        return loadAuthorKeys();
    }

    const privateKey: CryptoKey = await importSigningKey(keys.privateKey);
    const publicKey: CryptoKey = await importVerifyKey(keys.publicKey);

    return { privateKey, publicKey };
};

const onEnterKey = (c: Function) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        c();
    }
};

const Home: NextPage = () => {
    const [appIsReady, setAppIsReady] = useState<boolean>(false);
    const [lastFetch, setLastFetch] = useState<number>(0);
    const [isInitialised, setIsInitialised] = useState<boolean>(false);
    const [isLoadingAuthorKeys, setIsLoadingAuthorKeys] = useState<boolean>(false);
    const [fetchInterval, setFetchInterval] = useState<NodeJS.Timer | null>(null);
    const [isInvalidRoom, setIsInvalidRoom] = useState<boolean>(false);
    const [newMessage, setNewMessage] = useState<string>('');
    const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
    const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
    const [signingKey, setSigningKey] = useState<CryptoKey | null>(null);
    const [authorKeys, setAuthorKeys] = useState<ImportedAuthorKeys | null>(null);
    const [autoFetchInterval, setAutoFetchInterval] = useState<NodeJS.Timer | null>(null);
    const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
    const hashData = getHashData();

    // when messages change, scroll to last message
    const inputField = useRef<HTMLInputElement>(null);

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
    }

    const decryptMessage = async (msg: Message): Promise<DecryptedMessage> => {
        const authorSignature = await verify(
            msg.messageSignature,
            msg.authorSignature,
            authorKeys!.publicKey
        );

        const text = await decrypt(
            {
                ciphertext: msg.message,
                iv: msg.iv
            },
            cryptoKey!
        );

        return {
            id: msg.id,
            message: text,
            createdAt: msg.createdAt,
            isAuthor: authorSignature,
        }
    };

    const sendNewMessage = async () => {
        if (!cryptoKey || !signingKey || !authorKeys || isSendingMessage || newMessage === '') {
            return;
        }

        setIsSendingMessage(true);

        const payload = await encrypt(newMessage, cryptoKey!);
        const signature = await sign(`${payload.ciphertext}|${payload.iv}`, signingKey!);
        const authorSignature = await sign(signature, authorKeys!.privateKey);

        sendMessageMutation.mutate({
            roomId: hashData.roomId ?? '',
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            messageSignature: signature,
            authorSignature: authorSignature,
        });

        setNewMessage('');
        setIsSendingMessage(false);
    };

    const apiRetryHandler = (failureCount: number, error: TRPCClientErrorLike<BuildProcedure<any, any, any>>): boolean => {
        if (failureCount < 3 && hashData.roomId === '') {
            return true;
        }

        if (error.data?.code === "NOT_FOUND") {
            setIsInvalidRoom(true);
            return false;
        }

        return true;
    };

    // RPC calls
    const sendMessageMutation = api.room.addMessage.useMutation();
    const roomDetails = api.room.getRoom.useQuery({
        roomId: hashData.roomId ?? '',
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retryDelay: 250,
        enabled: !!hashData.roomId,
        retry: apiRetryHandler,
    });
    const chatMessages = api.room.getMessages.useQuery({
        roomId: hashData.roomId ?? '',
        timestamp: decryptedMessages.at(-1)?.createdAt ?? undefined,
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        enabled: !!hashData.roomId,
        retry: apiRetryHandler,
    });

    // once all the details are loaded
    useEffect(() => {
        if (appIsReady || isInvalidRoom || !cryptoKey) {
            return;
        }
        if (!authorKeys?.publicKey || !authorKeys?.publicKey) {
            return;
        }

        if (!roomDetails?.data?.id) {
            return;
        }

        setAppIsReady(true);
    }, [appIsReady, isInvalidRoom, cryptoKey, authorKeys, roomDetails?.data?.id]);

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
            importEncryptionKey(hashData.encryptionKey)
                .then((key: CryptoKey) => {
                    setCryptoKey(key);
                });

            importSigningKey(hashData.signingKey)
                .then((key: CryptoKey) => {
                    setSigningKey(key);
                });
        } catch (err) {
            setIsInvalidRoom(true);
            return;
        }

        loadAuthorKeys().then((keys: ImportedAuthorKeys) => {
            setAuthorKeys(keys);
        });
    }, [hashData, isInvalidRoom, isLoadingAuthorKeys]);

    // pull messages when message is sent
    useEffect(() => {
        if (sendMessageMutation.isLoading) {
            return;
        }

        chatMessages.refetch();
        inputField.current?.focus();
    }, [sendMessageMutation.isLoading]);

    // when we have new messages, load them
    useEffect(() => {
        if (!appIsReady) {
            return;
        }

        if (chatMessages.isLoading || !chatMessages.data?.messages || chatMessages.dataUpdatedAt <= lastFetch) {
            return;
        }

        setLastFetch(chatMessages.dataUpdatedAt);

        if (!isInitialised) {
            setIsInitialised(true);
            setupAutoFetch();
        }

        Promise
            .all((chatMessages.data!.messages).map<Promise<DecryptedMessage>>(decryptMessage))
            .then((messages: DecryptedMessage[]) => {
                setDecryptedMessages((existing) => [
                    ...existing,
                    ...messages,
                ]);
            })
            .catch((err) => {
                setIsInvalidRoom(true);
            });
    }, [chatMessages.dataUpdatedAt, chatMessages.data, appIsReady]);

    return (
        <>
            <Header />
            <Main>
                <>
                    <Logo />
                    {
                        isInvalidRoom ?
                            <div className="rounded-md bg-yellow-50 p-4 mt-12">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Invalid Room</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>
                                                This room does not exist or the details are incorrect.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div> :
                            <>
                                <ChatMessagesList decryptedMessages={decryptedMessages} />
                                <NewMessageInput
                                    value={newMessage}
                                    disabled={isSendingMessage || sendMessageMutation.isLoading || !cryptoKey || !authorKeys}
                                    onChange={(event) => setNewMessage(event.target.value)}
                                    onKeyPress={onEnterKey(sendNewMessage)}
                                    autoFocus={true}
                                    inputRef={inputField}
                                    sendNewMessage={sendNewMessage}
                                />
                            </>
                    }
                </>
            </Main>
        </>
    );
};

export default Home;