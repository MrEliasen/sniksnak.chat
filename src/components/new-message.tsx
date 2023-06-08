import { ChangeEventHandler, KeyboardEventHandler, MouseEventHandler, RefObject } from "react";
import { PaperAirplaneIcon, Cog8ToothIcon } from '@heroicons/react/24/solid';

interface NewMessageInputProps {
    value: string,
    disabled: boolean,
    onChange: ChangeEventHandler<HTMLInputElement>,
    onKeyPress: KeyboardEventHandler,
    autoFocus: boolean,
    inputRef: RefObject<HTMLInputElement>,
    sendNewMessage: MouseEventHandler,
}

const NewMessageInput = ({
    value,
    disabled,
    onChange,
    onKeyPress,
    autoFocus,
    inputRef,
    sendNewMessage,
}: NewMessageInputProps) => {
    return (
        <div className="flex w-full max-w-4xl">
            <input
                type="text"
                placeholder="What do you want to say?"
                className="w-full focus:outline-none pl-6 mr-2 rounded-md py-3"
                value={value}
                disabled={disabled}
                onChange={onChange}
                onKeyPress={onKeyPress}
                autoFocus={autoFocus}
                ref={inputRef}
            />
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-300 ease-in-out text-white bg-snakred hover:bg-snakred-600 focus:outline-none"
                disabled={disabled}
                onClick={sendNewMessage}
            >
                <span className="font-bold sm:block hidden">Send</span>
                <PaperAirplaneIcon className=" pl-1 h-6 w-6 text-white" />
            </button>
            </button>
        </div>
    );
};

export default NewMessageInput;