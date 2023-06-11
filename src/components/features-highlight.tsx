import SnikSnak from "./sniksnak";

const FeatureHighlight = () => {
    return (
        <div className="mx-auto max-w-2xl lg:max-w-5xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative px-2">
                    <dt className="text-xl font-semibold text-gray-300">
                        Zero-knowledge encryption
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        Encryption keys never leaves the browser. Even if
                        <SnikSnak/> wanted to, <SnikSnak/> cannot decrypt
                        any messages, it all happens in the browser.
                    </dd>
                </div>

                <div className="relative px-2">
                    <dt className="text-xl font-semibold text-gray-300">
                        Completely anonymous
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        <SnikSnak/> does not track you or require you to sign up.
                        The signing keys a stored locally in your browser, so
                        only you can identify which messages you sent.
                    </dd>
                </div>

                <div className="relative px-2">
                    <dt className="text-xl font-semibold text-gray-300">
                        Open Source
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        Review the code, contribute, create your own version.
                        <SnikSnak/> is open source (MIT) <a
                            className="text-logo"
                            href="https://github.com/MrEliasen/sniksnak.chat"
                        >
                            on GitHub
                        </a>
                    </dd>
                </div>

                <div className="relative px-4">
                    <dt className="text-xl font-semibold text-gray-300">
                        Auto Deletion
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                        Chat rooms, and all of its messages, will automatically
                        get deleted after 30 days of inactivity (since last message).
                    </dd>
                </div>
            </dl>
        </div>
    );
};

export default FeatureHighlight;
