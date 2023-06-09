import { MouseEventHandler } from "react";

type CreateRoomProps = {
    createRoomAction: MouseEventHandler<HTMLButtonElement>;
    status: string | null;
    isDisable: boolean;
};

const CreateRoom = ({
    createRoomAction,
    status,
    isDisable,
}: CreateRoomProps) => {
    return (
        <div className="w-full">
            <div className="mx-auto max-w-2xl p-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-200 sm:text-4xl">
                    Ready to get started?
                </h2>
                <div className="mt-6 flex items-center justify-center gap-x-6">
                    <div className="w-full max-w-md">
                        <div className="flex flex-col gap-y-4">
                            {!status ? (
                                <></>
                            ) : (
                                <code className="grow rounded-md border-0 bg-white/5 px-3.5 py-2 text-left text-white shadow-sm ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6">
                                    <p>{status}</p>
                                </code>
                            )}
                            <button
                                disabled={isDisable}
                                onClick={createRoomAction}
                                className="max-w-md rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                Create Free Chat Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;
