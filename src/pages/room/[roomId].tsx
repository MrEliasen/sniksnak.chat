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

type HashData = {
    readonly encryptionKey: string|null,
    readonly signingKey: string|null,
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

    return { encryptionKey, signingKey, roomId: (query?.roomId ?? '') as string};
};

const Home: NextPage = () => {
    const [newMessage, setNewMessage] = useState<string>('');
    const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
    const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
    const [signingKey, setSigningKey] = useState<CryptoKey | null>(null);
    const [authorKeys, setAuthorKeys] = useState<ImportedAuthorKeys | null>(null);
    const [autoFetchInterval, setAutoFetchInterval] = useState<NodeJS.Timer|null>(null);
    const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
    const hashData = getHashData();

    // when messages change, scroll to last message
    const inputField = useRef<HTMLInputElement>(null);

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
    const chatMessages = api.room.getMessages.useQuery({
        roomId: hashData.roomId,
        timestamp: decryptedMessages.at(-1)?.createdAt ?? undefined,
    }, { refetchOnMount: false, refetchOnWindowFocus: false});

    const loadAuthorKeys = async () => {
        getAuthorKeys().then(async (keys: AuthorKeys) => {
            if (!keys.privateKey || !keys.publicKey ) {
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
        if (hashData.roomId === '' || hashData.encryptionKey === null || hashData.signingKey === null) {
            return;
        }

        importEncryptionKey(hashData.encryptionKey)
            .then((key: CryptoKey) => {
                setCryptoKey(key);
        });

        importSigningKey(hashData.signingKey)
            .then((key: CryptoKey) => {
                setSigningKey(key);
        });

        loadAuthorKeys();
    }, [hashData.roomId]);

    // pull messages when message is sent
    useEffect(() => {
        chatMessages.refetch();
        inputField.current?.focus();
    }, [sendMessageMutation.isLoading, chatMessages.isStale]);

    useEffect(() => {
        if (!cryptoKey) {
            return;
        }

        if (!chatMessages.data?.messages.length) {
            return;
        }

        if (!chatMessages.isFetched) {
            return;
        }

        if (!authorKeys?.publicKey) {
            return;
        }

        Promise
            .all((chatMessages.data.messages).map<Promise<DecryptedMessage>>(decryptMessage))
            .then((messages: DecryptedMessage[]) => {
                setDecryptedMessages((existing) => [
                    ...existing,
                    ...messages,
                ]);

                if (autoFetchInterval !== null) {
                    return;
                }

                const intval = setInterval(() => {
                    if (chatMessages.isRefetching) {
                        return;
                    }

                    chatMessages.refetch();
                }, 1000);

                setAutoFetchInterval(intval);
            });
    }, [chatMessages.data?.messages, cryptoKey, authorKeys]);

    return (
        <>
            <Header/>
            <Main>
                <>
                    <Logo />
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
            </Main>
        </>
    );
};

export default Home;