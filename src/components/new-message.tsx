import { RefObject, useState } from "react";
import { PaperAirplaneIcon, Cog8ToothIcon } from "@heroicons/react/24/solid";

interface NewMessageInputProps {
    disabled: boolean;
    inputRef: RefObject<HTMLInputElement>;
    sendMessage: (message: string) => Promise<boolean>;
}

const NewMessageInput = ({
    disabled,
    inputRef,
    sendMessage,
}: NewMessageInputProps) => {
    const [newMessageText, setNewMessageText] = useState<string>("");

    const handleSendNewMessage = async () => {
        sendMessage(newMessageText).then((result: boolean) =>
            setNewMessageText(result ? "" : newMessageText),
        );
    };

    return (
        <div className="flex w-full max-w-4xl">
            <input
                type="text"
                placeholder="What do you want to say?"
                className="mr-2 w-full rounded-md py-3 pl-6 focus:outline-none"
                autoFocus={true}
                ref={inputRef}
                value={newMessageText}
                disabled={disabled}
                onChange={(event) => setNewMessageText(event.target.value)}
                onKeyPress={(event) => {
                    if (event.key === "Enter") {
                        handleSendNewMessage();
                    }
                }}
            />
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-snakred px-4 py-3 text-white transition duration-300 ease-in-out hover:bg-snakred-600 focus:outline-none"
                disabled={disabled}
                onClick={() => handleSendNewMessage()}
            >
                <span className="hidden font-bold sm:block">Send</span>
                <PaperAirplaneIcon className=" h-6 w-6 pl-1 text-white" />
            </button>
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-300 ease-in-out focus:outline-none"
            >
                <Cog8ToothIcon className="h-6 w-6 rounded-lg text-white transition duration-300 ease-in-out hover:text-snakred" />
            </button>
        </div>
    );
};

export default NewMessageInput;
