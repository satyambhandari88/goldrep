import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, DollarSign, Users, Package, Clock, Scale } from 'lucide-react';
import { dashboardAPI } from './dashboardAPI';
import { authService } from './services/authService';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Ensuring default values to prevent errors
    const [shopStats, setShopStats] = useState({
        totalBilling: 0,
        totalUdhaar: 0,
        newCustomers: 0
    });

    const [salesData, setSalesData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);

    const [udhaarData, setUdhaarData] = useState({
        totalUdhaar: 0,
        totalCustomers: [],
        averageUdhaar: 0
    });

    const [metalPrices, setMetalPrices] = useState([]);

    useEffect(() => {
        // ✅ Redirect to login if not authenticated
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [
                    statsResponse,
                    salesResponse,
                    inventoryResponse,
                    udhaarResponse,
                    metalResponse
                ] = await Promise.all([
                    dashboardAPI.getShopStats(),
                    dashboardAPI.getSalesAnalysis('weekly'),
                    dashboardAPI.getInventoryAnalysis(),
                    dashboardAPI.getUdhaarAnalysis(),
                    dashboardAPI.getMetalPrices()
                ]);

                setShopStats(statsResponse?.data || { totalBilling: 0, totalUdhaar: 0, newCustomers: 0 });
                setSalesData(salesResponse?.data || []);
                setInventoryData(inventoryResponse?.data || []);
                setUdhaarData(udhaarResponse?.data || { totalUdhaar: 0, totalCustomers: [], averageUdhaar: 0 });
                setMetalPrices(metalResponse?.data || []);

            } catch (err) {
                setError(err.message);
                console.error('Error fetching dashboard data:', err);

                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // Internal Styles
    const styles = {
        statsCard: {
            transition: 'transform 0.2s ease-in-out',
            ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }
        },
        metalPriceCard: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(10px)'
        },
        chartContainer: {
            position: 'relative',
            margin: '20px 0',
            padding: '20px',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        responsiveGrid: {
            '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr'
            }
        },
        animateCount: {
            animation: 'countUp 0.5s ease-out forwards'
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ color: '#ef4444', fontSize: '1.25rem' }}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '34px', maxWidth: '1280px', margin: '0 auto' }}>
            {/* Metal Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {metalPrices.map((metal, index) => (
                    <Card key={index} style={styles.metalPriceCard}>
                        <CardContent style={{ paddingTop: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{metal._id?.type || 'Metal'} Price (per gram)</p>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{metal.averagePrice?.toFixed(2) || '0.00'}</h2>
                                </div>
                                <Scale style={{ height: '48px', width: '48px', color: metal._id?.type === 'Gold' ? '#eab308' : '#9ca3af' }} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Today's Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <Card style={styles.statsCard}>
                    <CardContent style={{ paddingTop: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <DollarSign style={{ height: '32px', width: '32px', color: '#22c55e' }} />
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Today's Revenue</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{shopStats.totalBilling?.toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card style={styles.statsCard}>
                    <CardContent style={{ paddingTop: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Clock style={{ height: '32px', width: '32px', color: '#f97316' }} />
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Pending Udhaar</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{(shopStats.totalUdhaar || 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card style={styles.statsCard}>
                    <CardContent style={{ paddingTop: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Users style={{ height: '32px', width: '32px', color: '#3b82f6' }} />
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>New Customers</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{shopStats.newCustomers || '0'}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card style={styles.statsCard}>
                    <CardContent style={{ paddingTop: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Package style={{ height: '32px', width: '32px', color: '#a855f7' }} />
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Average Udhaar</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{(udhaarData?.averageUdhaar || 0).toFixed(0)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Sales Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalSales" name="Sales" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id.category" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="totalWeight" name="Total Weight (g)" fill="#ffd700" />
                                    <Bar dataKey="totalItems" name="Total Items" fill="#c0c0c0" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
