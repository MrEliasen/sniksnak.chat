import Link from "next/link";
import SnikSnak from "./sniksnak";

const Logo = () => {
    return (
        <div>
            <Link href="/">
                <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-[5rem]">
                    <SnikSnak bold={false} />
                </h1>
            </Link>
            <p className="text-right text-sm text-gray-300">
                A thing by{" "}
                <a className="text-logo" href="https://markeliasen.com">
                    ME
                </a>
            </p>
        </div>
    );
};

export default Logo;
