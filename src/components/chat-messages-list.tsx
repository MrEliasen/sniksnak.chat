import { useEffect, useRef, useState } from "react";
import { type DecryptedMessage } from "~/pages/room/[roomId]";

type ChatMessagesListProps = {
    decryptedMessages: DecryptedMessage[],
}

const ChatMessagesList = ({ decryptedMessages }: ChatMessagesListProps) => {
    const [ autoScroll, setAutoScroll ] = useState<boolean>(true);
    const lastMessage = useRef<HTMLDivElement>(null);

    const scrollToLastMessage = () => lastMessage?.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (!autoScroll) {
            return;
        }

        scrollToLastMessage();
    }, [decryptedMessages, autoScroll]);

    const handleMouseEnter = () => {
        setAutoScroll(false);
    }

    const handleMouseLeave = () => {
        setAutoScroll(true);
        scrollToLastMessage();
    }

    return (
        <div
            className="relative flex-1 mt-12 mb-6 w-full overflow-y-auto rounded-lg max-w-4xl bg-gradient-to-b from-[#ffffff00] to-[#cc66ff1a] no-scrollbar border border-[#cc65ff14]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex flex-col overflow-none">
                <div className={`sticky top-0  w-full bg-[#cc66ff57] text-white text-center rounded-lg ${autoScroll ? 'invisible' : 'visible'}`}>
                    Auto Scroll is diabled while moused over.
                </div>
                {(
                    decryptedMessages.map((message: DecryptedMessage) => <div
                        key={message.id}
                        ref={lastMessage}
                        className={`flex items-end ${(message.isAuthor ? 'justify-end' : '')}`}
                    >
                        <p
                            className={`max-w-most break-words text-sm px-4 py-2 m-2 rounded-lg text-white ${(message.isAuthor ? 'bg-snakred rounded-br-none' : 'bg-blue-600 rounded-bl-none')}`}
                        >
                            {(message.message)}
                        </p>
                    </div>)
                )}
            </div>
        </div>
    );
};

export default ChatMessagesList;
