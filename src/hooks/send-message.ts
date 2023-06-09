import { RefObject, useEffect, useState } from "react";
import { api } from "~/utils/api";
import { encrypt, sign } from "~/utils/crypto-helper";

const useSendMessage = (
    roomId: string | null,
    cryptoKey: CryptoKey | null,
    signingKey: CryptoKey | null,
    authorKeys: CryptoKeyPair | null,
    chatMessages,
    inputField: RefObject<HTMLInputElement>
) => {
    const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
    const sendMessage = api.room.addMessage.useMutation();

    const sendNewMessage = async (message: string): Promise<boolean> => {
        const formattedText = message.trim();

        if (roomId === null || !cryptoKey || !signingKey || !authorKeys || isSendingMessage || formattedText === '') {
            return false;
        }

        setIsSendingMessage(true);

        const payload = await encrypt(formattedText, cryptoKey);
        const signature = await sign(`${payload.ciphertext}|${payload.iv}`, signingKey);
        const authorSignature = await sign(signature, authorKeys.privateKey);

        sendMessage.mutate({
            roomId: roomId,
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            messageSignature: signature,
            authorSignature: authorSignature,
        });

        setIsSendingMessage(false);
        return true;
    };


    // pull messages when message is sent
    useEffect(() => {
        if (sendMessage.isLoading) {
            return;
        }

        chatMessages.refetch();
        inputField.current?.focus();
    }, [sendMessage.isLoading]);

    return {
        sendNewMessage,
        isSendingMessage,
    }
}

export default useSendMessage;