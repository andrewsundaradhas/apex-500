export default function Disclaimer() {
  return (
    <footer style={{
      padding: '12px 24px', borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-canvas)', color: 'var(--fg-tertiary)',
      fontSize: 11, lineHeight: 1.5, textAlign: 'center',
    }}>
      Apex 500 forecasts are educational research, not investment advice.
      Past performance does not guarantee future results. Models can and do
      produce wrong predictions; never trade based on output alone.
    </footer>
  );
}
