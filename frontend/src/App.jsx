import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import History from './pages/History';



function Checkout({ cart, setCart }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);
  const [calculatingFee, setCalculatingFee] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateDeliveryFee = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi.");
      return;
    }

    setCalculatingFee(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Koordinat Toko (Taman Anyelir 3 Blok M6 No 1, Depok)
        const storeLat = -6.428600;
        const storeLng = 106.820600;

        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${longitude},${latitude}?overview=false`);
          const data = await res.json();
          
          if (data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            const distanceKm = distanceMeters / 1000;
            
            // Tarif dasar 5rb, atau per KM 5rb
            const fee = Math.max(5000, Math.ceil(distanceKm) * 5000);
            
            setDeliveryDistanceKm(distanceKm.toFixed(1));
            setDeliveryFee(fee);
          } else {
            alert('Tidak dapat menghitung rute dari lokasi Anda.');
            setDeliveryFee(0);
            setDeliveryDistanceKm(0);
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat menghitung ongkir.');
        } finally {
          setCalculatingFee(false);
        }
      },
      (error) => {
        alert("Gagal mendapatkan lokasi. Pastikan Anda memberikan izin akses GPS.");
        setCalculatingFee(false);
      }
    );
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`https://nachoy.vercel.app/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: deliveryMethod === 'pickup' ? 'Ambil Sendiri' : customerAddress,
          items: cart,
          total_price: totalPrice + deliveryFee,
          delivery_method: deliveryMethod,
          delivery_fee: deliveryFee,
          delivery_distance_km: deliveryDistanceKm
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const existingOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        localStorage.setItem('myOrders', JSON.stringify([data.orderId, ...existingOrders]));
        
        const orderText = `Halo Admin Nachos Fiesta! 🌮\nSaya ingin memesan:\n\n*Pesanan #${data.orderId}*\n- Nama: ${customerName}\n- No HP: ${customerPhone}\n- Alamat: ${deliveryMethod === 'pickup' ? 'Ambil Sendiri' : customerAddress}\n\n*Menu:*\n${cart.map(item => `- ${item.name} (${item.quantity}x) = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`).join('\n')}\n\n*Pengiriman:* ${deliveryMethod === 'delivery' ? `Delivery (${deliveryDistanceKm} km)` : 'Pickup'}\n*Ongkir:* Rp ${deliveryFee.toLocaleString('id-ID')}\n*Total Bayar:* Rp ${(totalPrice + deliveryFee).toLocaleString('id-ID')}\n\nMohon segera diproses ya min!`;
        const waUrl = `https://wa.me/6281210845680?text=${encodeURIComponent(orderText)}`;
        
        alert('Checkout berhasil! Anda akan diarahkan ke WhatsApp untuk mengirim pesanan ke Admin.');
        window.location.href = waUrl;
        
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
      } else {
        alert('Gagal melakukan checkout');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="storefront-container" style={{paddingBottom: '50px'}}>
      <div className="navbar">
        <a href="/" className="logo">🌮 Nachos Fiesta</a>
      </div>
      <main className="main-content" style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{marginTop: '40px', marginBottom: '20px', color: 'var(--primary)'}}>Keranjang Belanja</h2>
        {cartCount === 0 ? (
          <p style={{color: '#aaa', fontSize: '1.2rem'}}>Keranjang masih kosong. Yuk belanja dulu!</p>
        ) : (
          <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
            <div style={{flex: '1', minWidth: '300px'}}>
              <h3 style={{borderBottom: '1px solid #444', paddingBottom: '10px'}}>Ringkasan Pesanan</h3>
              <ul style={{listStyle: 'none', padding: 0}}>
                {cart.map(item => (
                  <li key={item.id} style={{display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px', background: '#222', padding: '10px', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                      <span>{item.name}</span>
                      <span style={{color: 'var(--primary)'}}>Rp {parseInt(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px'}}>
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} style={{background: '#444', color: 'white', border: 'none', padding: '2px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem'}}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} style={{background: '#444', color: 'white', border: 'none', padding: '2px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem'}}>+</button>
                      <button type="button" onClick={() => removeItem(item.id)} style={{background: '#F44336', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto', fontSize: '0.8rem'}}>Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{marginTop: '20px', padding: '15px 0', borderTop: '2px solid #444', borderBottom: '1px solid #444'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                  <span>Subtotal:</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div style={{display: 'flex', justifyContent: 'space-between', color: '#aaa'}}>
                    <span>Ongkos Kirim {deliveryDistanceKm > 0 ? `(${deliveryDistanceKm} km)` : ''}:</span>
                    <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '15px'}}>
                <span>Total Bayar:</span>
                <span style={{color: 'var(--primary)'}}>Rp {(totalPrice + deliveryFee).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{flex: '1', minWidth: '300px', background: '#1a1a1a', padding: '20px', borderRadius: '12px'}}>
              <h3 style={{marginTop: 0, marginBottom: '20px'}}>Metode & Data Pengiriman</h3>
              
              <div style={{marginBottom: '20px', display: 'flex', gap: '15px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: deliveryMethod === 'pickup' ? '#333' : '#222', padding: '10px 15px', borderRadius: '8px', border: deliveryMethod === 'pickup' ? '1px solid var(--primary)' : '1px solid transparent'}}>
                  <input type="radio" name="delivery" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => { setDeliveryMethod('pickup'); setDeliveryFee(0); setDeliveryDistanceKm(0); }} style={{margin: 0}} />
                  Ambil Sendiri (Pickup)
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: deliveryMethod === 'delivery' ? '#333' : '#222', padding: '10px 15px', borderRadius: '8px', border: deliveryMethod === 'delivery' ? '1px solid var(--primary)' : '1px solid transparent'}}>
                  <input type="radio" name="delivery" value="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} style={{margin: 0}} />
                  Kirim ke Alamat (Delivery)
                </label>
              </div>

              <form onSubmit={handleCheckout} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Nama Lengkap</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{width: '100%', padding: '12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px'}} />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Nomor HP (WhatsApp)</label>
                  <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required style={{width: '100%', padding: '12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px'}} />
                </div>
                
                {deliveryMethod === 'delivery' && (
                  <>
                    <div style={{background: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #444'}}>
                      <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: '#aaa'}}>Ongkos kirim otomatis dihitung dari lokasi Anda ke Toko (Rp 5.000 / km)</p>
                      <button type="button" onClick={calculateDeliveryFee} disabled={calculatingFee} style={{background: '#4CAF50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', width: '100%', fontWeight: 'bold'}}>
                        {calculatingFee ? 'Mendeteksi Lokasi & Menghitung...' : '📍 Deteksi Lokasi & Hitung Ongkir'}
                      </button>
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', color: '#ccc'}}>Alamat Lengkap Pengiriman</label>
                      <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required style={{width: '100%', padding: '12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', minHeight: '80px'}} placeholder="Tulis detail patokan rumah Anda..." />
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{marginTop: '10px', width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold'}}>
                  {isSubmitting ? 'Memproses...' : 'Selesaikan Pesanan'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
        <Route path="/cart" element={<Checkout cart={cart} setCart={setCart} />} />
        <Route path="/history" element={<History cartCount={cartCount} />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
