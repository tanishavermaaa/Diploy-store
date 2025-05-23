import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Auth Context
const AuthContext = React.createContext();

// Components

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data.user);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      
        <div className="app">
          <header className="app-header">
            <h1>Diploy Seller Portal</h1>
            {user && (
              <nav>
                <button onClick={logout}>Logout</button>
              </nav>
            )}
          </header>
          <main>
            <Routes>
              <Route path="/" element={user ? <ProductList /> : <Navigate to="/login" />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
              <Route path="/products/new" element={user ? <ProductForm /> : <Navigate to="/login" />} />
              <Route path="/products/:id/edit" element={user ? <ProductForm edit /> : <Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      
    </AuthContext.Provider>
  );
}

// Login Page
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
}

// Register Page
function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await register(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}

// Product List
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data);
      } catch (err) {
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(product => product.id !== id));
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Your Products</h2>
        <button onClick={() => navigate('/products/new')}>Add New Product</button>
      </div>
      {error && <div className="error">{error}</div>}
      {products.length === 0 ? (
        <p>No products found. Create your first product!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price}</td>
                <td>{product.status}</td>
                <td>
                  <button onClick={() => navigate(`/products/${product.id}/edit`)}>Edit</button>
                  <button onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Product Form
function ProductForm({ edit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (edit && id) {
      const fetchProduct = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const product = res.data;
          setName(product.name);
          setDescription(product.description);
          setPrice(product.price);
          setImageUrl(product.image_url);
        } catch (err) {
          setError('Failed to fetch product');
        }
      };
      fetchProduct();
    }
  }, [edit, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      image_url: imageUrl
    };

    try {
      const token = localStorage.getItem('token');
      if (edit) {
        await axios.put(`${API_BASE_URL}/products/${id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <h2>{edit ? 'Edit Product' : 'Create New Product'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Product Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label>Price:</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Image URL:</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" onClick={() => navigate('/')}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default App;