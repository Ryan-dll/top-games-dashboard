export default function RawJsonPanel({ rawJson }) {
  const text = rawJson ? JSON.stringify(rawJson, null, 2) : 'No data loaded yet.';

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => alert('Copied!'));
  };

  return (
    <div>
      <div className="toolbar">
        <button className="btn" onClick={copy}>
          Copy JSON
        </button>
      </div>
      <div className="json-wrap">
        <pre>{text}</pre>
      </div>
    </div>
  );
}
