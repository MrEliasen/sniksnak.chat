import { type NextPage } from "next";
import Header from "~/components/header";
import Logo from "~/components/logo";
import { useRouter } from "next/router";
import AuthorDetails from "~/components/author-details";
import FeatureHighlight from "~/components/features-highlight";
import CreateRoom from "~/components/create-room";
import Main from "~/components/main";
import useCreateRoom from "~/hooks/use-create-room";

const Landing: NextPage = () => {
    const router = useRouter();

    const { encryptionKey, signingKey, createRoom, roomApi, status } =
        useCreateRoom();

    if (roomApi.data?.id && roomApi.isSuccess && signingKey !== null) {
        router.push(
            `/room/${roomApi.data?.id}#${encodeURIComponent(
                encryptionKey,
            )}|${encodeURIComponent(signingKey?.privateKey)}`,
        );
    }

    return (
        <>
            <Header />
            <Main>
                <div className="container flex flex-col items-center justify-center gap-12 pt-12 ">
                    <Logo />
                    <FeatureHighlight />

                    <CreateRoom
                        isDisable={status !== null}
                        status={status}
                        createRoomAction={createRoom}
                    />

                    <AuthorDetails />
                </div>
            </Main>
        </>
    );
};

export default Landing;
