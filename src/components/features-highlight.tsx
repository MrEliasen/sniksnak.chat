import SnikSnak from './sniksnak';

const FeatureHighlight = () => {
    return (
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">

                <div className="relative px-4">
                    <dt className="text-base font-semibold text-gray-300">
                        Zero-knowledge encryption
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        Encryption keys and signing keys never leaves the browser. <SnikSnak bold={true} /> wanted to, <SnikSnak bold={true} /> cannot decrypt messages or identify who wrote them.
                    </dd>
                </div>

                <div className="relative px-4">
                    <dt className="text-base font-semibold text-gray-300">
                        Completely anonymous
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        <SnikSnak bold={true} /> does not track you or require you to sign in. Signing keys never leaves your browser, so only you can identify which messages you sent.
                    </dd>
                </div>

            </dl>
        </div>
    );
};

export default FeatureHighlight;