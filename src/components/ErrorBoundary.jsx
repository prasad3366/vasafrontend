import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    try {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught error:', error, info);
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 8, border: '1px solid #f3c6c6' }}>
          <h2 style={{ color: '#b91c1c', marginBottom: 8 }}>Something went wrong</h2>
          <div style={{ color: '#7f1d1d', fontSize: 14, whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <details style={{ marginTop: 12, color: '#4b5563' }}>
            {this.state.info && this.state.info.componentStack}
          </details>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
