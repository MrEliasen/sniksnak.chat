import { useState } from "react";
import { api } from "~/utils/api";
import { ExportedKey, encryptionAlgorithm, exportKey, exportSigningKey, generateEncryptionKey, generateSigningKey, signingAlgorithm } from "~/utils/crypto-helper";
import { fakeWait, getRandomNumber } from "~/utils/misc";

const useCreateRoom = () => {
    const [status, setStatus] = useState<string|null>(null);
    const [encryptionKey, setEncryptionKey] = useState<string>('');
    const [signingKey, setSigningKey] = useState<ExportedKey|null>(null);
    const roomApi = api.room.createRoom.useMutation();

    const createRoom = async () => {
        setStatus(`1/4: ⌨️ Loading/creating author signing key pair`);
        await fakeWait(getRandomNumber(300, 400));

        // private key
        setStatus(`2/4: 🤫 Generating 256bit ${encryptionAlgorithm.name} encryption key`);
        const sKey = await generateEncryptionKey();
        const privateStringKey = await exportKey(sKey);
        setEncryptionKey(privateStringKey.privateKey);
        await fakeWait(getRandomNumber(400, 600));

        // public key
        setStatus(`3/4: 📢 Generating ${signingAlgorithm.name} signing key`);
        const pKey = await generateSigningKey();
        const exportedSigningKey = await exportSigningKey(pKey);
        setSigningKey(exportedSigningKey);
        await fakeWait(getRandomNumber(300, 400));

        // create room
        setStatus(`4/4: 💬 Creating chat room, one moment`);
        await fakeWait(getRandomNumber(200, 300));

        roomApi.mutate({
            publicKey: exportedSigningKey.publicKey,
        });
    }

    return {
        createRoom,
        encryptionKey,
        signingKey,
        roomApi,
        status,
    }
};

export default useCreateRoom;