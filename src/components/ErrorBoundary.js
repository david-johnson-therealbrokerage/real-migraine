import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <h1>Something went wrong</h1>
                        <p>We're sorry, but something unexpected happened.</p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error details</summary>
                                <pre>{this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                        <div className="error-actions">
                            <button onClick={this.handleReset} className="btn btn-primary">
                                Try Again
                            </button>
                            <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;