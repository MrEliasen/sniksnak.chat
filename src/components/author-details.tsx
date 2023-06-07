import { exportSigningKey, generateSigningKey } from "~/utils/crypto-helper";

export type AuthorKeys = { privateKey: string, publicKey: string };

export const getAuthorKeys = async (): Promise<AuthorKeys> => {
    // load author keys, generate if none found
    let privateKey = localStorage.getItem("privateAuthorKey");
    let publicKey = localStorage.getItem("publicAuthorKey");

    if (!privateKey || !publicKey) {
        // author signing key
        const authorKeys = await generateSigningKey();
        const exportedAuthorKey = await exportSigningKey(authorKeys);

        let { privateKey, publicKey } = exportedAuthorKey;

        localStorage.setItem('privateAuthorKey', privateKey);
        localStorage.setItem('publicAuthorKey', publicKey);
    }

    return {
        privateKey: privateKey!,
        publicKey: publicKey!
    }
}

const AuthorDetails = () => {
    return (
        <></>
    );
};

export default AuthorDetails;