import { ChangeEventHandler, KeyboardEventHandler, MouseEventHandler, RefObject } from "react";

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
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-snakred hover:bg-snakred-600 focus:outline-none"
                disabled={disabled}
                onClick={sendNewMessage}
            >
                <span className="font-bold sm:block hidden">Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 ml-2 transform rotate-90">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
            </button>
        </div>
    );
};

export default NewMessageInput;