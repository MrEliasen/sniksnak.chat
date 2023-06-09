import { type NextPage } from "next";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { useRouter as UseRouter } from 'next/router'; // lint fix..
import Logo from "~/components/logo";
import Header from "~/components/header";
import NewMessageInput from "~/components/new-message";
import ChatMessagesList from "~/components/chat-messages-list";
import Main from "~/components/main";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import useDecryptedMessages from "~/hooks/decrypt-messages";
import useImportKeys from "~/hooks/import-keys";
import useSendMessage from "~/hooks/send-message";

export type HashData = {
    readonly encryptionKey: string | null,
    readonly signingKey: string | null,
    readonly roomId: string | null,
};

const getHashData = (): HashData => {
    const { asPath, query } = UseRouter();
    const hashData = asPath.split('#')?.at(-1)?.split('|') ?? ['', ''];
    const encryptionKey = hashData[0] ? decodeURIComponent(hashData[0]) : null;
    const signingKey = hashData[1] ? decodeURIComponent(hashData[1]) : null;

    return { encryptionKey, signingKey, roomId: (query?.roomId ?? null) as string };
};

const ChatRoom: NextPage = () => {
    const [appIsReady, setAppIsReady] = useState<boolean>(false);
    const [isInvalidRoom, setIsInvalidRoom] = useState<boolean>(false);
    const hashData = getHashData();

    // when messages change, scroll to last message
    const inputField = useRef<HTMLInputElement>(null);

    const {
        authorKeys,
        cryptoKey,
        signingKey,
    } = useImportKeys(hashData, isInvalidRoom, setIsInvalidRoom);

    const { 
        decryptedMessages,
        chatMessages,
    } = useDecryptedMessages(
        hashData.roomId,
        appIsReady,
        isInvalidRoom,
        setIsInvalidRoom,
        authorKeys,
        cryptoKey
    );

    const {
        sendNewMessage,
        isSendingMessage,
    } = useSendMessage(
        hashData.roomId,
        cryptoKey,
        signingKey,
        authorKeys,
        chatMessages,
        inputField,
    );

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
    const roomDetails = api.room.getRoom.useQuery({
        roomId: hashData.roomId ?? '',
    }, {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retryDelay: 250,
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
                        </div>
                        :
                        <>
                            <ChatMessagesList decryptedMessages={decryptedMessages} />
                            <NewMessageInput
                                disabled={isSendingMessage || !cryptoKey || !authorKeys}
                                inputRef={inputField}
                                sendMessage={sendNewMessage}
                            />
                        </>
                    }
                </>
            </Main>
        </>
    );
};

export default ChatRoom;