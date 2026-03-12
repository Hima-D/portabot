import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BotProvider } from './context/BotContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Customize from './pages/Customize';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <BotProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="chat" element={<Chat />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="customize" element={<Customize />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BotProvider>
  );
}

export default App;
