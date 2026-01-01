import React from 'react';
import LoginForm from './components/LoginForm';

const App: React.FC = () => {
    return (
        <div className="app">
            <h1>Login Page</h1>
            <LoginForm />
        </div>
    );
};

export default App;