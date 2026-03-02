import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // שליחת דיווח שגיאה (אופציונלי - אפשר להוסיף מאוחר יותר)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const errorLog = {
          timestamp: new Date().toISOString(),
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack
        };
        localStorage.setItem('last_error', JSON.stringify(errorLog));
      }
    } catch (e) {
      console.warn('Could not save error log:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = createPageUrl('Home');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-6"
          style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          dir="rtl"
        >
          <Card className="max-w-lg w-full bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                אופס! משהו השתבש
              </h2>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                נתקלנו בשגיאה טכנית. אנחנו עובדים על זה!
                <br />
                בינתיים, נסי לרענן את הדף או לחזור לדף הבית.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-right bg-red-50 p-4 rounded-lg border border-red-200">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    פרטי השגיאה (למפתחים)
                  </summary>
                  <pre className="text-xs text-red-700 overflow-auto max-h-40 text-left">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleReset}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  רענני את הדף
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Home className="w-4 h-4 ml-2" />
                  חזרי לדף הבית
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-6">
                אם הבעיה נמשכת, נסי להתנתק ולהתחבר מחדש
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
