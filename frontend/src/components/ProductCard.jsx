export default function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} 
          alt={product.name} 
          className="product-image"
        />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">Rp {parseInt(product.price).toLocaleString('id-ID')}</span>
          {product.stock > 0 ? (
            <button className="btn-add" onClick={onAdd}>+ Tambah</button>
          ) : (
            <button className="btn-sold-out" disabled>Sold Out</button>
          )}
        </div>
      </div>
    </div>
  );
}
