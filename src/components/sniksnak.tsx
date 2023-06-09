type SnikSnakProps = {
    bold?: boolean;
};

const SnikSnak = ({ bold }: SnikSnakProps) => {
    return (
        <>
            <span className={`${bold ? "font-bold" : ""}`}>Snik</span>{" "}
            <span
                className={`text-[hsl(280,100%,70%)] ${
                    bold ? "font-bold" : ""
                }`}
            >
                Snak
            </span>
        </>
    );
};

export default SnikSnak;
