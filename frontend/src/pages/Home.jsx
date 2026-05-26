import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';

export default function Home({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products and packages concurrently
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products').then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/packages').then(res => res.json())
    ])
    .then(([productsData, packagesData]) => {
      setProducts(productsData);
      setPackages(packagesData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      setLoading(false);
    });
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Helper function to group products by package
  const renderPackageSection = (pkg) => {
    const pkgProducts = products.filter(p => p.package_id === pkg.id);
    if (pkgProducts.length === 0) return null;

    return (
      <div key={pkg.id} className="package-section" style={{marginBottom: '60px'}}>
        <div style={{borderBottom: '2px solid var(--primary)', paddingBottom: '10px', marginBottom: '30px'}}>
          <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', margin: '0 0 5px 0', color: 'var(--primary)'}}>
            {pkg.name}
          </h2>
          <p style={{color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem'}}>{pkg.description}</p>
        </div>
        <div className="product-grid">
          {pkgProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={() => addToCart(product)} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="storefront-container">
      <Navbar cartCount={cartCount} />
      
      <main className="main-content">
        <div className="hero-section">
          <h1>Rasakan Sensasi <span>Nachos Fiesta</span></h1>
          <p>Lezatnya perpaduan keripik renyah, keju lumer, dan topping pilihan yang menggugah selera.</p>
        </div>

        {loading ? (
          <div className="loader">Memuat menu...</div>
        ) : (
          <div>
            {/* Render grouped products */}
            {packages.map(pkg => renderPackageSection(pkg))}

            {/* Render products without package */}
            {(() => {
              const noPkgProducts = products.filter(p => !p.package_id);
              if (noPkgProducts.length === 0) return null;
              return (
                <div key="no-pkg" className="package-section" style={{marginBottom: '60px'}}>
                  <div style={{borderBottom: '2px solid #555', paddingBottom: '10px', marginBottom: '30px'}}>
                    <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', margin: '0 0 5px 0', color: '#ccc'}}>
                      Menu Ala Carte
                    </h2>
                    <p style={{color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem'}}>Tambahan satuan untuk melengkapi pesananmu.</p>
                  </div>
                  <div className="product-grid">
                    {noPkgProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={() => addToCart(product)} 
                      />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
