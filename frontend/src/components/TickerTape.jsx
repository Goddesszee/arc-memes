import "./TickerTape.css";

export default function TickerTape({ memes }) {
  if (!memes || memes.length === 0) return null;

  // duplicate the list so the CSS marquee loops seamlessly
  const row = [...memes, ...memes];

  return (
    <div className="ticker">
      <div className="ticker__track">
        {row.map((m, i) => (
          <span className="ticker__item" key={i}>
            <span className="ticker__symbol">${m.symbol}</span>
            <span className={`ticker__change ${m.up ? "up" : "down"}`}>
              {m.up ? "▲" : "▼"} {m.changeLabel || "—"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
