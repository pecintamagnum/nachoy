import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function History({ cartCount }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update "now" every second so the cancel button disappears exactly at 5 mins
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    const savedOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
    if (savedOrderIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: savedOrderIds })
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${id}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchHistory();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="storefront-container" style={{paddingBottom: '50px'}}>
      <Navbar cartCount={cartCount} />
      
      <main className="main-content" style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{marginTop: '40px', marginBottom: '20px', color: 'var(--primary)'}}>Riwayat Pesanan Saya</h2>
        
        {loading ? (
          <p>Memuat data pesanan...</p>
        ) : orders.length === 0 ? (
          <p style={{color: '#aaa', fontSize: '1.2rem'}}>Belum ada riwayat pesanan.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {orders.map(order => {
              const orderTime = new Date(order.order_date).getTime();
              const isUnder5Mins = (now - orderTime) <= 300000;
              const canCancel = order.status === 'pending' && isUnder5Mins;

              return (
                <div key={order.id} style={{background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '15px'}}>
                    <div>
                      <h3 style={{margin: '0 0 5px 0'}}>Pesanan #{order.id}</h3>
                      <p style={{margin: 0, color: '#aaa', fontSize: '0.9rem'}}>{new Date(order.order_date).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: order.status === 'completed' ? '#4CAF50' : order.status === 'cancelled' ? '#F44336' : order.status === 'processing' ? '#FF9800' : '#444',
                        color: 'white'
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <ul style={{listStyle: 'none', padding: 0, margin: '0 0 15px 0'}}>
                    {order.items && order.items.map(item => (
                      <li key={item.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem'}}>
                        <span>{item.product_name} x {item.quantity}</span>
                        <span>Rp {parseInt(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                    {order.delivery_method === 'delivery' && (
                      <li style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: '#aaa', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px'}}>
                        <span>Ongkos Kirim ({order.delivery_distance_km} km)</span>
                        <span>Rp {parseInt(order.delivery_fee).toLocaleString('id-ID')}</span>
                      </li>
                    )}
                  </ul>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '1.1rem'}}>
                    <span>Total Bayar {order.delivery_method === 'pickup' && <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa'}}>(Ambil Sendiri)</span>}</span>
                    <span style={{color: 'var(--primary)'}}>Rp {parseInt(order.total_price).toLocaleString('id-ID')}</span>
                  </div>

                  {canCancel && (
                    <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px', textAlign: 'right'}}>
                      <p style={{fontSize: '0.8rem', color: '#ff9800', margin: '0 0 10px 0'}}>
                        Sisa waktu pembatalan: {Math.max(0, Math.floor((300000 - (now - orderTime)) / 1000))} detik
                      </p>
                      <button 
                        onClick={() => handleCancel(order.id)}
                        style={{background: '#F44336', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                      >
                        Batalkan Pesanan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
