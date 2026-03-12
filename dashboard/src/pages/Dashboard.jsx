import React from 'react';
import { useBot } from '../context/BotContext';
import { MessageSquare, Users, TrendingUp, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const chatData = [
  { name: 'Mon', messages: 120 },
  { name: 'Tue', messages: 180 },
  { name: 'Wed', messages: 150 },
  { name: 'Thu', messages: 220 },
  { name: 'Fri', messages: 280 },
  { name: 'Sat', messages: 160 },
  { name: 'Sun', messages: 140 }
];

const topicData = [
  { name: 'Products', value: 35 },
  { name: 'Shipping', value: 25 },
  { name: 'Returns', value: 20 },
  { name: 'Support', value: 15 },
  { name: 'Other', value: 5 }
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'];

function Dashboard() {
  const { bot } = useBot();

  const stats = [
    { label: 'Total Messages', value: '1,247', change: '+12%', positive: true, icon: MessageSquare },
    { label: 'Active Sessions', value: '89', change: '+8%', positive: true, icon: Users },
    { label: 'Avg Response Time', value: '1.2s', change: '-15%', positive: true, icon: Zap },
    { label: 'Satisfaction', value: '94%', change: '+2%', positive: true, icon: TrendingUp }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your bot's performance and usage</p>
      </div>

      <div className="grid grid-4 stats-grid">
        {stats.map((stat, i) => (
          <div className="card stat-card" key={i}>
            <div className="stat-header">
              <stat.icon size={20} className="stat-icon" />
              <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {stat.change}
              </span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Message Volume</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chatData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Topics Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {topicData.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: COLORS[i] }}></span>
                  <span>{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Recent Conversations</h3>
          <button className="btn btn-secondary">View All</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Last Message</th>
              <th>Messages</th>
              <th>Started</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>sess_abc123</td>
              <td>What's your return policy?</td>
              <td>4</td>
              <td>2 mins ago</td>
              <td><span className="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td>sess_def456</td>
              <td>How do I track my order?</td>
              <td>6</td>
              <td>15 mins ago</td>
              <td><span className="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td>sess_ghi789</td>
              <td>Thanks for your help!</td>
              <td>3</td>
              <td>1 hour ago</td>
              <td><span className="badge badge-info">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
