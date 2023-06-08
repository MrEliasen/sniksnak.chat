import { type NextPage } from "next";
import Header from "~/components/header";
import Logo from "~/components/logo";
import { api } from "~/utils/api";
import { useState } from "react";
import { ExportedKey, generateEncryptionKey, generateSigningKey, encryptionAlgorithm, exportKey, sign, signingAlgorithm, exportSigningKey} from "~/utils/crypto-helper";
import { useRouter } from 'next/router';
import { fakeWait, getRandomNumber } from "~/utils/misc";
import AuthorDetails, { getAuthorKeys } from "~/components/author-details";
import FeatureHighlight from "~/components/features-highlight";
import CreateRoom from "~/components/create-room";
import Main from "~/components/main";

const Landing: NextPage = () => {
    const [status, setStatus] = useState<string|null>(null);
    const [encryptionKey, setEncryptionKey] = useState<string>('');
    const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
    const [signingKey, setSigningKey] = useState<ExportedKey|null>(null);
    const createRoom = api.room.createRoom.useMutation();
    const router = useRouter();

    const createNewRoom = async () => {
        setIsCreatingRoom(true);

        setStatus(`1/4: ⌨️ Loading/creating author signing key pair`);
        const authorKeys = getAuthorKeys();
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

        createRoom.mutate({
            publicKey: exportedSigningKey.publicKey!,
        });
    };

    if (createRoom.data?.id && createRoom.isSuccess) {
        router.push(`/room/${createRoom.data?.id}#${encodeURIComponent(encryptionKey)}|${encodeURIComponent(signingKey?.privateKey!)}`);
    }

    return (
        <>
            <Header />
            <Main>
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
                    <Logo />
                    <FeatureHighlight />

                    <CreateRoom isDisable={isCreatingRoom} status={status} createRoomAction={createNewRoom} />

                    <AuthorDetails />
                </div>
            </Main>
        </>
    );
};

export default Landing;