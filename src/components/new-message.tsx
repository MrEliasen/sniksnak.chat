import { RefObject, useState } from "react";
import { PaperAirplaneIcon, Cog8ToothIcon } from '@heroicons/react/24/solid';

interface NewMessageInputProps {
    disabled: boolean,
    inputRef: RefObject<HTMLInputElement>,
    sendMessage: (message: string) => Promise<boolean>,
}

const NewMessageInput = ({
    disabled,
    inputRef,
    sendMessage,
}: NewMessageInputProps) => {
    const [newMessageText, setNewMessageText] = useState<string>('');

    const handleSendNewMessage = async () => {
        sendMessage(newMessageText)
            .then((result: boolean) => setNewMessageText(result ? '' : newMessageText))
    }

    return (
        <div className="flex w-full max-w-4xl">
            <input
                type="text"
                placeholder="What do you want to say?"
                className="w-full focus:outline-none pl-6 mr-2 rounded-md py-3"
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
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-300 ease-in-out text-white bg-snakred hover:bg-snakred-600 focus:outline-none"
                disabled={disabled}
                onClick={() => handleSendNewMessage()}
            >
                <span className="font-bold sm:block hidden">Send</span>
                <PaperAirplaneIcon className=" pl-1 h-6 w-6 text-white" />
            </button>
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-300 ease-in-out focus:outline-none"
            >
                <Cog8ToothIcon className="h-6 w-6 rounded-lg transition duration-300 ease-in-out text-white hover:text-snakred" />
            </button>
        </div>
    );
};

export default NewMessageInput;
