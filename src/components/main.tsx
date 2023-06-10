type Props = {
    children: string | JSX.Element | JSX.Element[];
};

const Main = ({ children }: Props) => {
    return (
        <main
            className="flex flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] p-8"
            style={{ minHeight: "100dvh" }}
        >
            {children}
        </main>
    );
};

export default Main;
