export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <span className="skeleton" style={{ width: c === 0 ? "70%" : "45%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <span className="skeleton skeleton--chip" />
          <div style={{ flex: 1 }}>
            <span className="skeleton" style={{ width: "40%", height: 22 }} />
            <span className="skeleton" style={{ width: "60%", marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
