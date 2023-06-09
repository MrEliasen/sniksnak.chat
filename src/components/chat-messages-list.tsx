import { useEffect, useRef, useState } from "react";
import { type DecryptedMessage } from "~/hooks/decrypt-messages";

type ChatMessagesListProps = {
    decryptedMessages: DecryptedMessage[];
};

const ChatMessagesList = ({ decryptedMessages }: ChatMessagesListProps) => {
    const [autoScroll, setAutoScroll] = useState<boolean>(true);
    const lastMessage = useRef<HTMLDivElement>(null);

    const scrollToLastMessage = () =>
        lastMessage?.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (!autoScroll) {
            return;
        }

        scrollToLastMessage();
    }, [decryptedMessages, autoScroll]);

    const handleMouseEnter = () => {
        setAutoScroll(false);
    };

    const handleMouseLeave = () => {
        setAutoScroll(true);
        scrollToLastMessage();
    };

    return (
        <div
            className="relative mb-6 mt-12 w-full max-w-4xl flex-1 overflow-y-auto rounded-lg border border-[#cc65ff14] bg-gradient-to-b from-[#ffffff00] to-[#cc66ff1a] no-scrollbar"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="overflow-none flex flex-col">
                <div
                    className={`sticky top-0  w-full rounded-lg bg-[#cc66ff57] text-center text-white ${
                        autoScroll ? "invisible" : "visible"
                    }`}
                >
                    Auto Scroll is diabled while moused over.
                </div>
                {decryptedMessages.map((message: DecryptedMessage) => (
                    <div
                        key={message.id}
                        ref={lastMessage}
                        className={`flex items-end ${
                            message.isAuthor ? "justify-end" : ""
                        }`}
                    >
                        <p
                            className={`m-2 max-w-most break-words rounded-lg px-4 py-2 text-sm text-white ${
                                message.isAuthor
                                    ? "rounded-br-none bg-snakred"
                                    : "rounded-bl-none bg-blue-600"
                            }`}
                        >
                            {message.message}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatMessagesList;
