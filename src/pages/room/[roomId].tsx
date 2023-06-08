import { type NextPage } from "next";
import { api } from "~/utils/api";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Message } from "@prisma/client";
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

type HashData = {
    readonly encryptionKey: string | null,
    readonly signingKey: string | null,
    readonly roomId: string,
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

    return { encryptionKey, signingKey, roomId: (query?.roomId ?? '') as string };
};

const Home: NextPage = () => {
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

    // RPC calls
    const sendMessageMutation = api.room.addMessage.useMutation();
    const roomDetails = api.room.getRoom.useQuery({
        roomId: hashData.roomId,
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retryDelay: 250,
        enabled: hashData.roomId !== '',
        retry(failureCount, error) {
            if (failureCount < 3 && hashData.roomId === '') {
                return true;
            }

            if (error.data?.code === "NOT_FOUND") {
                setIsInvalidRoom(true);
                return false;
            }

            return true;
        }
    });
    const chatMessages = api.room.getMessages.useQuery({
        roomId: hashData.roomId,
        timestamp: decryptedMessages.at(-1)?.createdAt ?? undefined,
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        enabled: hashData.roomId !== '',
        retry(failureCount, error) {
            if (failureCount < 3 && hashData.roomId === '') {
                return true;
            }

            if (error.data?.code === "NOT_FOUND") {
                setIsInvalidRoom(true);
                return false;
            }

            return true;
        }
    });

    const loadAuthorKeys = async () => {
        getAuthorKeys().then(async (keys: AuthorKeys) => {
            if (!keys.privateKey || !keys.publicKey) {
                await fakeWait(100);
                loadAuthorKeys();
                return;
            }

            const privateKey: CryptoKey = await importSigningKey(keys.privateKey);
            const publicKey: CryptoKey = await importVerifyKey(keys.publicKey);

            setAuthorKeys({
                publicKey,
                privateKey,
            });
        });
    };

    const onEnterKey = (c: Function) => (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            c();
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
            roomId: hashData.roomId,
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            messageSignature: signature,
            authorSignature: authorSignature,
        });

        setNewMessage('');
        setIsSendingMessage(false);
    };

    // import crypto key
    useEffect(() => {
        if (isInvalidRoom) {
            return;
        }

        if (hashData.roomId === '' || hashData.encryptionKey === null || hashData.signingKey === null) {
            return;
        }

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
        }

        loadAuthorKeys();
    }, [hashData.roomId]);

    // pull messages when message is sent
    useEffect(() => {
        if (isInvalidRoom) {
            return;
        }

        chatMessages.refetch();
        inputField.current?.focus();
    }, [sendMessageMutation.isLoading, chatMessages.isStale]);

    useEffect(() => {
        if (isInvalidRoom) {
            return;
        }

        if (!cryptoKey) {
            return;
        }

        if (!chatMessages.isFetched) {
            return;
        }

        if (!authorKeys?.publicKey) {
            return;
        }

        if (!authorKeys?.publicKey) {
            return;
        }

        if (!roomDetails?.data?.id) {
            return;
        }

        if (chatMessages.data?.messages && !chatMessages.data?.messages.length) {
            setupAutoFetch();
            return;
        }

        Promise
            .all((chatMessages.data!.messages).map<Promise<DecryptedMessage>>(decryptMessage))
            .then((messages: DecryptedMessage[]) => {
                setDecryptedMessages((existing) => [
                    ...existing,
                    ...messages,
                ]);

                setupAutoFetch();
            })
            .catch((err) => {
                setIsInvalidRoom(true);
            });
    }, [chatMessages.data?.messages, cryptoKey, authorKeys]);

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