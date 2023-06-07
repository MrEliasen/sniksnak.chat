type Props = {
  children: string | JSX.Element | JSX.Element[],
}

const Main = ({ children }: Props) => {
    return (
        <main className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#2e026d] to-[#15162c]" style={{height: "100dvh"}}>
            { children }
        </main>
    );
};

export default Main;