import { exportSigningKey, generateSigningKey } from "~/utils/crypto-helper";

export type AuthorKeys = { privateKey: string, publicKey: string };

export const getAuthorKeys = async (): Promise<AuthorKeys> => {
    // load author keys, generate if none found
    let authorPrivateKey = localStorage.getItem("privateAuthorKey");
    let authorPublicKey = localStorage.getItem("publicAuthorKey");

    if (!authorPrivateKey || !authorPublicKey) {
        // author signing key
        const authorKeys = await generateSigningKey();
        const exportedAuthorKey = await exportSigningKey(authorKeys);

        const { privateKey, publicKey } = exportedAuthorKey;
        authorPrivateKey = privateKey;
        authorPublicKey = publicKey;

        localStorage.setItem('privateAuthorKey', privateKey);
        localStorage.setItem('publicAuthorKey', publicKey);
    }

    return {
        privateKey: authorPrivateKey,
        publicKey: authorPublicKey
    }
}

const AuthorDetails = () => {
    return (
        <></>
    );
};

export default AuthorDetails;