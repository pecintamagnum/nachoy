import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', image: null, stock: '', package_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [newPackage, setNewPackage] = useState({ name: '', description: '' });
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [editingPkg, setEditingPkg] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchPackages();
      fetchOrders();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('https://nachoy.vercel.app/api/products');
      setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('https://nachoy.vercel.app/api/packages');
      setPackages(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Login gagal, pastikan backend berjalan.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  // --- PRODUCT CRUD ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    if (newProduct.package_id) formData.append('package_id', newProduct.package_id);
    if (newProduct.image) formData.append('image', newProduct.image);

    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Hapus Content-Type agar browser set otomatis multipart/form-data
        body: formData
      });
      if (res.ok) {
        setNewProduct({ name: '', description: '', price: '', image: null, stock: '', package_id: '' });
        // Reset input file value workaround (if any)
        document.getElementById('file-upload-new').value = '';
        fetchProducts();
      } else alert('Gagal menambah produk');
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/products/${id}', {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleSaveEdit = async () => {
    const formData = new FormData();
    formData.append('name', editingProduct.name);
    formData.append('description', editingProduct.description);
    formData.append('price', editingProduct.price);
    formData.append('stock', editingProduct.stock);
    if (editingProduct.package_id) formData.append('package_id', editingProduct.package_id);
    if (editingProduct.image_url) formData.append('image_url', editingProduct.image_url); // existing URL
    if (editingProduct.image) formData.append('image', editingProduct.image); // new file

    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/products/${editingId}', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setEditingId(null);
        setEditingProduct(null);
        fetchProducts();
      } else alert('Gagal menyimpan perubahan');
    } catch (err) { console.error(err); }
  };

  // --- PACKAGE CRUD ---
  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newPackage)
      });
      if (res.ok) {
        setNewPackage({ name: '', description: '' });
        fetchPackages();
      } else alert('Gagal menambah paket');
    } catch (err) { console.error(err); }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Yakin ingin menghapus paket ini? Menu di dalamnya akan menjadi tanpa paket.')) return;
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/packages/${id}', {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { fetchPackages(); fetchProducts(); }
    } catch (err) { console.error(err); }
  };

  const handleSavePkgEdit = async () => {
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/packages/${editingPkgId}', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingPkg)
      });
      if (res.ok) {
        setEditingPkgId(null);
        setEditingPkg(null);
        fetchPackages();
        fetchProducts();
      } else alert('Gagal menyimpan perubahan');
    } catch (err) { console.error(err); }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const res = await fetch('https://nachoy.vercel.app/api/admin/orders/${id}/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
      } else alert('Gagal update status pesanan');
    } catch (err) { console.error(err); }
  };

  if (!token) {
    return (
      <div className="login-container">
        <h2>Login Admin</h2>
        <form className="admin-form" onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-add">Masuk</button>
          <a href="/" style={{marginTop: '15px', display: 'block'}}>Kembali ke Toko</a>
        </form>
      </div>
    );
  }

  return (
    <div className="storefront-container" style={{paddingTop: '30px', paddingBottom: '50px'}}>
      <div className="admin-header">
        <h2>Dashboard Admin</h2>
        <div>
          <button onClick={() => navigate('/')} className="btn-add" style={{marginRight: '10px', background: '#333'}}>Lihat Toko</button>
          <button onClick={handleLogout} className="btn-danger btn-add">Logout</button>
        </div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '40px'}}>
        {/* DAFTAR PESANAN MASUK */}
        <div style={{flex: '1 1 100%', minWidth: '300px', marginBottom: '20px'}}>
          <h3>Daftar Pesanan Masuk</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pemesan</th>
                <th>Detail Pesanan</th>
                <th>Total Harga</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.order_date).toLocaleString('id-ID')}</td>
                  <td>
                    <strong>{order.customer_name}</strong><br/>
                    <small>{order.customer_phone}</small><br/>
                    <small style={{color: '#aaa'}}>{order.customer_address}</small><br/>
                    <span style={{
                      display: 'inline-block', 
                      marginTop: '5px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      background: order.delivery_method === 'delivery' ? '#2196F3' : '#FF9800', 
                      color: 'white', 
                      fontWeight: 'bold'
                    }}>
                      {order.delivery_method === 'delivery' ? `🛵 Delivery (${order.delivery_distance_km} km)` : '🛍️ Ambil Sendiri'}
                    </span>
                  </td>
                  <td>
                    <ul style={{margin: 0, paddingLeft: '15px'}}>
                      {order.items && order.items.map(item => (
                        <li key={item.id}>{item.product_name} ({item.quantity}x)</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    Rp {parseInt(order.total_price).toLocaleString('id-ID')}
                    {order.delivery_method === 'delivery' && (
                      <div style={{fontSize: '0.8rem', color: '#aaa', marginTop: '5px'}}>
                        (Termasuk Ongkir Rp {parseInt(order.delivery_fee).toLocaleString('id-ID')})
                      </div>
                    )}
                  </td>
                  <td>
                    <select 
                      value={order.status} 
                      onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                      style={{
                        padding: '5px', 
                        borderRadius: '4px',
                        background: order.status === 'completed' ? '#4CAF50' : order.status === 'cancelled' ? '#F44336' : order.status === 'processing' ? '#FF9800' : '#222',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="pending" style={{background: '#222'}}>Pending</option>
                      <option value="processing" style={{background: '#222'}}>Diproses</option>
                      <option value="completed" style={{background: '#222'}}>Selesai</option>
                      <option value="cancelled" style={{background: '#222'}}>Dibatalkan</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>Belum ada pesanan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* KELOLA PAKET KATEGORI */}
        <div style={{flex: '1', minWidth: '300px'}}>
          <h3>Manajemen Paket Kategori</h3>
          <form className="admin-form" onSubmit={handleAddPackage}>
            <input type="text" placeholder="Nama Paket (cth: Paket Hemat)" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} required />
            <textarea placeholder="Deskripsi Singkat" value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} required />
            <button type="submit" className="btn-add">Tambah Paket</button>
          </form>

          <table className="admin-table">
            <thead>
              <tr><th>Paket</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  {editingPkgId === pkg.id ? (
                    <>
                      <td>
                        <input type="text" value={editingPkg.name} onChange={e => setEditingPkg({...editingPkg, name: e.target.value})} style={{width: '90%', padding: '5px', background: '#222', color: 'white', border: '1px solid #444', marginBottom: '5px'}} />
                        <input type="text" value={editingPkg.description} onChange={e => setEditingPkg({...editingPkg, description: e.target.value})} style={{width: '90%', padding: '5px', background: '#222', color: 'white', border: '1px solid #444'}} />
                      </td>
                      <td>
                        <button onClick={handleSavePkgEdit} className="btn-add btn-small" style={{marginRight: '5px'}}>Simpan</button>
                        <button onClick={() => setEditingPkgId(null)} className="btn-danger btn-small" style={{background: '#555'}}>Batal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{pkg.name}</strong><br/><small style={{color: '#aaa'}}>{pkg.description}</small></td>
                      <td>
                        <button onClick={() => { setEditingPkgId(pkg.id); setEditingPkg(pkg); }} className="btn-add btn-small" style={{marginRight: '5px', background: '#4CAF50'}}>Edit</button>
                        <button onClick={() => handleDeletePackage(pkg.id)} className="btn-danger btn-small">Hapus</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KELOLA MENU PRODUK */}
        <div style={{flex: '2', minWidth: '400px'}}>
          <h3>Tambah Menu Baru</h3>
          <form className="admin-form" onSubmit={handleAddProduct} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <input type="text" placeholder="Nama Produk" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            <select value={newProduct.package_id} onChange={e => setNewProduct({...newProduct, package_id: e.target.value})} style={{padding: '12px', borderRadius: '6px', background: '#111', color: 'white', border: '1px solid #444'}}>
              <option value="">-- Pilih Paket --</option>
              {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
            </select>
            <input type="number" placeholder="Harga (Rp)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
            <input type="number" placeholder="Stok Awal" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
            <textarea placeholder="Deskripsi Menu" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} required style={{gridColumn: '1 / -1'}} />
            <div style={{gridColumn: '1 / -1'}}>
              <label style={{display: 'block', marginBottom: '5px'}}>Upload Foto Menu:</label>
              <input id="file-upload-new" type="file" accept="image/*" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} style={{width: '100%', padding: '10px', background: '#111', color: 'white', border: '1px solid #444'}} />
            </div>
            <button type="submit" className="btn-add" style={{gridColumn: '1 / -1'}}>Simpan Menu Baru</button>
          </form>
        </div>
      </div>

      <div>
        <h3>Daftar Menu Tersedia</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Menu</th>
              <th>Paket</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  <>
                    <td>
                      <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{width: '90%', padding: '5px', background: '#222', color: 'white', border: '1px solid #444', marginBottom: '5px'}} />
                      <input type="file" accept="image/*" onChange={e => setEditingProduct({...editingProduct, image: e.target.files[0]})} style={{width: '90%', padding: '5px', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.8rem'}} title="Ganti foto" />
                    </td>
                    <td>
                      <select value={editingProduct.package_id || ''} onChange={e => setEditingProduct({...editingProduct, package_id: e.target.value})} style={{padding: '5px', background: '#222', color: 'white', border: '1px solid #444'}}>
                        <option value="">Tanpa Paket</option>
                        {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} style={{width: '90px', padding: '5px', background: '#222', color: 'white', border: '1px solid #444'}} /></td>
                    <td><input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} style={{width: '60px', padding: '5px', background: '#222', color: 'white', border: '1px solid #444'}} /></td>
                    <td>
                      <button onClick={handleSaveEdit} className="btn-add btn-small" style={{marginRight: '5px'}}>Simpan</button>
                      <button onClick={() => setEditingId(null)} className="btn-danger btn-small" style={{background: '#555'}}>Batal</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{p.name}</td>
                    <td>{p.package_name || <span style={{color: '#888'}}>-</span>}</td>
                    <td>Rp {parseInt(p.price).toLocaleString('id-ID')}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button onClick={() => { setEditingId(p.id); setEditingProduct(p); }} className="btn-add btn-small" style={{marginRight: '5px', background: '#4CAF50'}}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="btn-danger btn-small">Hapus</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Belum ada produk</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
