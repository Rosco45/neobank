import { useState, useEffect } from 'react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [cards, setCards] = useState([])
  const [currentView, setCurrentView] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Formulaires
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Création de carte
  const [showCreateCard, setShowCreateCard] = useState(false)
  const [cardType, setCardType] = useState('simple')
  const [holderName, setHolderName] = useState('')

  // Transferts
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferType, setTransferType] = useState('internal')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferDescription, setTransferDescription] = useState('')
  const [transferIban, setTransferIban] = useState('')
  const [transferRecipientName, setTransferRecipientName] = useState('')

  // Prêts
  const [loans, setLoans] = useState([])
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanDuration, setLoanDuration] = useState('24')
  const [loanPurpose, setLoanPurpose] = useState('')

  // Crypto
  const [cryptoWallets, setCryptoWallets] = useState([])
  const [cryptoPrices, setCryptoPrices] = useState({})
  const [cryptoTransactions, setCryptoTransactions] = useState([])
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [cryptoAction, setCryptoAction] = useState('buy') // buy ou sell
  const [selectedCrypto, setSelectedCrypto] = useState('BTC')
  const [cryptoAmount, setCryptoAmount] = useState('')

  // Admin
  const [pendingLoans, setPendingLoans] = useState([])

  // Admin détaillé
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [adminView, setAdminView] = useState('overview') // overview, users, loans, transactions
  const [allTransactions, setAllTransactions] = useState([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neobank-backend-7jga.onrender.com'

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setToken(savedToken)
      setUser(parsedUser)
      setIsLoggedIn(true)
      
      // Charger les données utilisateur
      fetchBalance(savedToken)
      fetchTransactions(savedToken)
      fetchCards(savedToken)
      fetchLoans(savedToken)
      fetchCryptoWallets(savedToken)
      fetchCryptoPrices()
      fetchCryptoTransactions(savedToken)

      // Si admin, charger les données admin
      if (parsedUser.role === 'admin' || parsedUser.role === 'super_admin') {
        fetchPendingLoans(savedToken)
        fetchAllUsers(savedToken)
        fetchAllTransactions(savedToken)
      }
    }

    // Rafraîchir les prix crypto toutes les 10 secondes
    const priceInterval = setInterval(() => {
      if (isLoggedIn) {
        fetchCryptoPrices()
      }
    }, 10000)

    return () => clearInterval(priceInterval)
  }, []) // ⚠️ Important : array vide pour n'exécuter qu'une fois

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      setIsLoggedIn(true)

      fetchBalance(data.token)
      fetchTransactions(data.token)
      fetchCards(data.token)
      fetchLoans(data.token)
      // Lignes ~75, ~115, ~145
fetchCryptoWallets(data.token)
fetchCryptoPrices()
fetchCryptoTransactions(data.token)

// Si admin, charger toutes les données admin
if (data.user.role === 'admin' || data.user.role === 'super_admin') {
    fetchPendingLoans(data.token)
    fetchAllUsers(data.token)
    fetchAllTransactions(data.token)
  }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur d\'inscription')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      setIsLoggedIn(true)

      fetchBalance(data.token)
      fetchTransactions(data.token)
      fetchCards(data.token)
      fetchLoans(data.token)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      console.log('Users data:', data) // Pour débugger
      if (response.ok) {
        setAllUsers(data.data)
      } else {
        console.error('Error fetching users:', data)
      }
    } catch (err) {
      console.error('Erreur récupération utilisateurs:', err)
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setSelectedUser(data.data)
        setShowUserModal(true)
      }
    } catch (err) {
      alert('Erreur récupération détails utilisateur')
    }
  }

  const fetchAllTransactions = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/admin/transactions?limit=100`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      console.log('Transactions data:', data) // Pour débugger
      if (response.ok) {
        setAllTransactions(data.data)
      } else {
        console.error('Error fetching transactions:', data)
      }
    } catch (err) {
      console.error('Erreur récupération transactions:', err)
    }
  }

  const handleBlockUser = async (userId) => {
    const duration = prompt('Durée du blocage en heures (défaut: 24h):', '24')
    if (!duration) return

    const reason = prompt('Raison du blocage:')

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ duration: parseInt(duration), reason })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchAllUsers(token)
        if (selectedUser?.user.id === userId) {
          fetchUserDetails(userId)
        }
      }
    } catch (err) {
      alert('Erreur lors du blocage')
    }
  }

  const handleUnblockUser = async (userId) => {
    if (!confirm('Débloquer cet utilisateur ?')) return

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/unblock`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchAllUsers(token)
        if (selectedUser?.user.id === userId) {
          fetchUserDetails(userId)
        }
      }
    } catch (err) {
      alert('Erreur lors du déblocage')
    }
  }

  const handleDeleteUser = async (userId) => {
    const confirmation = prompt('⚠️ DANGER: Supprimer définitivement cet utilisateur ?\nTapez "SUPPRIMER" pour confirmer:')
    if (confirmation !== 'SUPPRIMER') return

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        setShowUserModal(false)
        fetchAllUsers(token)
      }
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleCard = async (cardId) => {
    try {
      const response = await fetch(`${API_URL}/admin/cards/${cardId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        if (selectedUser) {
          fetchUserDetails(selectedUser.user.id)
        }
      }
    } catch (err) {
      alert('Erreur lors du changement de statut')
    }
  }

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Supprimer cette carte ?')) return

    try {
      const response = await fetch(`${API_URL}/admin/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        if (selectedUser) {
          fetchUserDetails(selectedUser.user.id)
        }
      }
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  const handleAdjustBalance = async (userId) => {
    const amount = prompt('Montant à ajouter/retirer (ex: 100 ou -50):')
    if (!amount) return

    const reason = prompt('Raison de l\'ajustement:')

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), reason })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}\nNouveau solde: ${data.data.newBalance.toFixed(2)} €`)
        fetchAllUsers(token)
        if (selectedUser?.user.id === userId) {
          fetchUserDetails(userId)
        }
      }
    } catch (err) {
      alert('Erreur lors de l\'ajustement')
    }
  }

  const fetchBalance = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/accounts/balance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setBalance(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération solde:', err)
    }
  }

  const fetchTransactions = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/accounts/transactions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération transactions:', err)
    }
  }

  const fetchCards = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/cards`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCards(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération cartes:', err)
    }
  }

  const fetchLoans = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/loans`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setLoans(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération prêts:', err)
    }
  }

  const fetchPendingLoans = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/admin/loans/pending`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setPendingLoans(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération prêts en attente:', err)
    }
  }

  const handleApproveLoan = async (loanId) => {
    if (!confirm('Approuver ce prêt ?')) return

    try {
      const response = await fetch(`${API_URL}/admin/loans/${loanId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchPendingLoans(token)
      }
    } catch (err) {
      alert('Erreur lors de l\'approbation')
    }
  }

  const handleRejectLoan = async (loanId) => {
    const reason = prompt('Raison du rejet :')
    if (!reason) return

    try {
      const response = await fetch(`${API_URL}/admin/loans/${loanId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchPendingLoans(token)
      }
    } catch (err) {
      alert('Erreur lors du rejet')
    }
  }

  const handleCreateCard = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardType, holderName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur création carte')
      }

      alert('✅ Carte créée avec succès !')
      setShowCreateCard(false)
      setHolderName('')
      fetchCards(token)
      fetchLoans(data.token)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBlock = async (cardId) => {
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/toggle-block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchCards(token)
        fetchLoans(data.token)
      }
    } catch (err) {
      alert('Erreur lors du changement de statut')
    }
  }


  const handleTransfer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = transferType === 'internal' 
        ? `${API_URL}/transfers/internal`
        : `${API_URL}/transfers/external`

      const body = transferType === 'internal'
        ? {
            recipientAccountNumber: transferRecipient,
            amount: parseFloat(transferAmount),
            description: transferDescription
          }
        : {
            iban: transferIban,
            recipientName: transferRecipientName,
            amount: parseFloat(transferAmount),
            description: transferDescription
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du transfert')
      }

      alert(`✅ ${data.message}\nNouveau solde : ${data.data.newBalance.toFixed(2)} €`)
      setShowTransferModal(false)
      setTransferAmount('')
      setTransferRecipient('')
      setTransferDescription('')
      setTransferIban('')
      setTransferRecipientName('')
      
      fetchBalance(token)
      fetchTransactions(token)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLoanApply = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(loanAmount),
          durationMonths: parseInt(loanDuration),
          purpose: loanPurpose
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur demande prêt')
      }

      alert(`✅ ${data.message}\nMensualité : ${data.data.monthlyPayment.toFixed(2)} €`)
      setShowLoanModal(false)
      setLoanAmount('')
      setLoanDuration('24')
      setLoanPurpose('')
      fetchLoans(token)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLoanRepay = async (loanId, amount) => {
    if (!confirm(`Confirmer le remboursement de ${amount} € ?`)) return

    try {
      const response = await fetch(`${API_URL}/loans/${loanId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchLoans(token)
        fetchBalance(token)
        fetchTransactions(token)
      }
    } catch (err) {
      alert('Erreur lors du remboursement')
    }
  }

  const fetchCryptoWallets = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/crypto/wallets`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCryptoWallets(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération wallets crypto:', err)
    }
  }

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/crypto/prices`)
      const data = await response.json()
      if (response.ok) {
        setCryptoPrices(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération prix crypto:', err)
    }
  }

  const fetchCryptoTransactions = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/crypto/transactions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCryptoTransactions(data.data)
      }
    } catch (err) {
      console.error('Erreur récupération transactions crypto:', err)
    }
  }

  const handleCryptoTrade = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = cryptoAction === 'buy' 
        ? `${API_URL}/crypto/buy`
        : `${API_URL}/crypto/sell`

      const body = cryptoAction === 'buy'
        ? {
            cryptocurrency: selectedCrypto,
            fiatAmount: parseFloat(cryptoAmount)
          }
        : {
            walletId: cryptoWallets.find(w => w.cryptocurrency === selectedCrypto)?.id,
            amount: parseFloat(cryptoAmount)
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la transaction')
      }

      alert(`✅ ${data.message}`)
      setShowCryptoModal(false)
      setCryptoAmount('')
      
      fetchCryptoWallets(token)
      fetchBalance(token)
      fetchTransactions(token)
      fetchCryptoTransactions(token)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Recharger les données admin
  const refreshAdminData = () => {
    if (token && (user?.role === 'admin' || user?.role === 'super_admin')) {
      fetchPendingLoans(token)
      fetchAllUsers(token)
      fetchAllTransactions(token)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setToken(null)
    setUser(null)
    setBalance(null)
    setTransactions([])
    setCards([])
    setCurrentView('dashboard')
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      padding: '2rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '1rem',
      outline: 'none',
      marginBottom: '1rem',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
  }

  // LOGIN/REGISTER VIEW
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
          <div style={styles.card}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              🏦 NeoBank
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
              {showRegister ? 'Créer votre compte' : 'Connexion à votre espace'}
            </p>

            {error && (
              <div style={{
                padding: '1rem',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '10px',
                color: '#c33',
                marginBottom: '1rem',
              }}>
                ❌ {error}
              </div>
            )}

            {!showRegister ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowRegister(!showRegister)
                  setError('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                }}
              >
                {showRegister ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
              </button>
            </div>

            {!showRegister && (
              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: '#f3f4f6',
                borderRadius: '10px',
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  👤 Compte de test :
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0' }}>
                  Email : jean.dupont@email.com
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0' }}>
                  Mot de passe : Demo123!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // DASHBOARD VIEW
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem 2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              🏦 NeoBank
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              Bonjour {user?.firstName} !
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Déconnexion
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              background: currentView === 'dashboard' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setCurrentView('cards')}
            style={{
              background: currentView === 'cards' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            💳 Mes Cartes
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            style={{
              background: 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            💸 Faire un Transfert
          </button>
          <button
            onClick={() => setCurrentView('loans')}
            style={{
              background: currentView === 'loans' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            🏦 Mes Prêts
          </button>
          <button
            onClick={() => setCurrentView('crypto')}
            style={{
              background: currentView === 'crypto' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            ₿ Crypto
          </button>
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              onClick={() => setCurrentView('admin')}
              style={{
                background: currentView === 'admin' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              👨‍💼 Admin
            </button>
          )}
        </div>
      </div>

      {/* Modal Transfert */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              💸 Nouveau Transfert
            </h3>

            {error && (
              <div style={{
                padding: '1rem',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '10px',
                color: '#c33',
                marginBottom: '1rem',
              }}>
                ❌ {error}
              </div>
            )}

            {/* Type de transfert */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setTransferType('internal')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: transferType === 'internal' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: transferType === 'internal' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Vers un compte NeoBank
              </button>
              <button
                onClick={() => setTransferType('external')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: transferType === 'external' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: transferType === 'external' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Vers un compte externe (SEPA)
              </button>
            </div>

            <form onSubmit={handleTransfer}>
              {transferType === 'internal' ? (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Numéro de compte du destinataire
                    </label>
                    <input
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      placeholder="FR76..."
                      style={styles.input}
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '-0.75rem' }}>
                      💡 Compte de test : FR7698765432109876543210987 (Marie Martin)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      IBAN du bénéficiaire
                    </label>
                    <input
                      type="text"
                      value={transferIban}
                      onChange={(e) => setTransferIban(e.target.value)}
                      placeholder="FR76..."
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Nom du bénéficiaire
                    </label>
                    <input
                      type="text"
                      value={transferRecipientName}
                      onChange={(e) => setTransferRecipientName(e.target.value)}
                      placeholder="Pierre Dupont"
                      style={styles.input}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Montant (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="100.00"
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  placeholder="Ex: Remboursement restaurant"
                  style={styles.input}
                />
              </div>

              {/* Résumé */}
              <div style={{
                background: '#f3f4f6',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#666' }}>Montant</span>
                  <span style={{ fontWeight: 'bold' }}>{transferAmount || '0.00'} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#666' }}>Frais</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>0.00 €</span>
                </div>
                <div style={{
                  borderTop: '1px solid #ddd',
                  paddingTop: '0.5rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 'bold' }}>Total</span>
                  <span style={{ fontWeight: 'bold' }}>{transferAmount || '0.00'} €</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false)
                    setError('')
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: '#e5e7eb',
                    color: '#333',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Confirmer le transfert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {currentView === 'dashboard' && (
          <>
            {/* Carte de solde */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              padding: '2rem',
              color: 'white',
              marginBottom: '2rem',
            }}>
              <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>Solde disponible</p>
              <h2 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {balance ? `${balance.balance.toFixed(2)} €` : 'Chargement...'}
              </h2>
              {balance && (
                <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0 }}>
                  {balance.accountNumber}
                </p>
              )}
            </div>


            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '15px', padding: '1.5rem' }}>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Cartes actives</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {cards.filter(c => !c.isBlocked).length}
                </p>
              </div>
              <div style={{ background: 'white', borderRadius: '15px', padding: '1.5rem' }}>
                <p style={{ color: '#999', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Transactions ce mois</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {transactions.length}
                </p>
              </div>
            </div>

            {/* Transactions */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Transactions récentes
              </h3>

              {transactions.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                  Aucune transaction
                </p>
              ) : (
                <div>
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {tx.description}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            margin: 0,
                            color: tx.amount > 0 ? '#10b981' : '#333',
                          }}
                        >
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'cards' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Mes Cartes</h2>
              <button
                onClick={() => setShowCreateCard(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                + Nouvelle Carte
              </button>
            </div>

            {/* Modal Création Carte */}
            {showCreateCard && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    Créer une nouvelle carte
                  </h3>

                  {error && (
                    <div style={{
                      padding: '1rem',
                      background: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '10px',
                      color: '#c33',
                      marginBottom: '1rem',
                    }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCreateCard}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Type de carte
                      </label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        style={styles.input}
                      >
                        <option value="simple">Simple - 50€/mois (500€/jour)</option>
                        <option value="silver">Silver - 100€/mois (2000€/jour)</option>
                        <option value="gold">Gold - 150€/mois (10000€/jour)</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Nom du titulaire
                      </label>
                      <input
                        type="text"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        placeholder="JEAN DUPONT"
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateCard(false)
                          setError('')
                        }}
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: '#e5e7eb',
                          color: '#333',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Création...' : 'Créer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des cartes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {cards.map((card) => {
                const cardColors = {
                  simple: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  silver: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                  gold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                }

                return (
                  <div key={card.id}>
                    {/* Carte visuelle */}
                    <div style={{
                      background: cardColors[card.cardType],
                      borderRadius: '15px',
                      padding: '2rem',
                      color: 'white',
                      height: '220px',
                      position: 'relative',
                      marginBottom: '1rem',
                      opacity: card.isBlocked ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>
                            {card.cardType.toUpperCase()}
                          </p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                            NeoBank
                          </p>
                        </div>
                        <div style={{ fontSize: '2rem' }}>💳</div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>Numéro de carte</p>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '2px', margin: '0.5rem 0 0 0' }}>
                          •••• •••• •••• {card.cardNumberLast4}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0 }}>Titulaire</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                            {card.holderName}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0 }}>Expire</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0.25rem 0 0 0' }}>
                            {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                          </p>
                        </div>
                      </div>

                      {card.isBlocked && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: '#ef4444',
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          🔒 BLOQUÉE
                        </div>
                      )}
                    </div>

                    {/* Informations et actions */}
                    <div style={{ background: 'white', borderRadius: '15px', padding: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>Limite journalière</p>
                          <p style={{ fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                            {card.dailyLimit.toFixed(0)} €
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>Limite mensuelle</p>
                          <p style={{ fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                            {card.monthlyLimit.toFixed(0)} €
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleToggleBlock(card.id)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: card.isBlocked ? '#10b981' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          {card.isBlocked ? '🔓 Débloquer' : '🔒 Bloquer'}
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: '#f3f4f6',
                            color: '#666',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {cards.length === 0 && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '3rem',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>💳</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  Aucune carte
                </p>
                <p style={{ color: '#999' }}>
                  Créez votre première carte pour commencer
                </p>
              </div>
            )}
          </>
        )}

{currentView === 'loans' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Mes Prêts</h2>
              <button
                onClick={() => setShowLoanModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                + Demander un Prêt
              </button>
            </div>

            {/* Modal Demande Prêt */}
            {showLoanModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    🏦 Demande de Prêt
                  </h3>

                  {error && (
                    <div style={{
                      padding: '1rem',
                      background: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '10px',
                      color: '#c33',
                      marginBottom: '1rem',
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  <form onSubmit={handleLoanApply}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Montant (€)
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="500"
                        max="50000"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="10000"
                        style={styles.input}
                        required
                      />
                      <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '-0.75rem' }}>
                        Entre 500 € et 50 000 €
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Durée
                      </label>
                      <select
                        value={loanDuration}
                        onChange={(e) => setLoanDuration(e.target.value)}
                        style={styles.input}
                      >
                        <option value="12">12 mois</option>
                        <option value="24">24 mois</option>
                        <option value="36">36 mois</option>
                        <option value="48">48 mois</option>
                        <option value="60">60 mois (5 ans)</option>
                        <option value="84">84 mois (7 ans)</option>
                        <option value="120">120 mois (10 ans)</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Objet du prêt
                      </label>
                      <input
                        type="text"
                        value={loanPurpose}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                        placeholder="Ex: Travaux de rénovation"
                        style={styles.input}
                        required
                      />
                    </div>

                    {loanAmount && loanDuration && (
                      <div style={{
                        background: '#f3f4f6',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                          Estimation mensualité
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                          ~{((parseFloat(loanAmount || 0) * 1.035) / parseInt(loanDuration || 24)).toFixed(2)} €/mois
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                          Taux indicatif de 3,5% - Le taux exact sera calculé selon votre profil
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLoanModal(false)
                          setError('')
                        }}
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: '#e5e7eb',
                          color: '#333',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Envoi...' : 'Soumettre la demande'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des prêts */}
            <div className="space-y-6">
              {loans.map((loan) => (
                <div key={loan.id} style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                        {loan.amount.toFixed(2)} €
                      </h3>
                      <p style={{ color: '#666' }}>Prêt personnel - {loan.durationMonths} mois</p>
                      {loan.purpose && <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '0.25rem' }}>{loan.purpose}</p>}
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      background: loan.status === 'active' ? '#d1fae5' : loan.status === 'pending' ? '#fef3c7' : loan.status === 'completed' ? '#dbeafe' : '#fee2e2',
                      color: loan.status === 'active' ? '#065f46' : loan.status === 'pending' ? '#92400e' : loan.status === 'completed' ? '#1e40af' : '#991b1b',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}>
                      {loan.status === 'active' ? '✅ Actif' : loan.status === 'pending' ? '⏳ En attente' : loan.status === 'completed' ? '🎉 Remboursé' : '❌ Rejeté'}
                    </div>
                  </div>

                  {loan.status === 'active' && (
                    <>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                      }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: '0 0 0.25rem 0' }}>Taux d'intérêt</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: '0 0 0.25rem 0' }}>Mensualité</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{loan.monthlyPayment.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: '0 0 0.25rem 0' }}>Restant dû</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>{loan.remainingAmount.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#999', margin: '0 0 0.25rem 0' }}>Prochain paiement</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {new Date(loan.nextPaymentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        background: '#f3f4f6',
                        borderRadius: '10px',
                        height: '12px',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          height: '100%',
                          width: `${(loan.paidAmount / loan.totalAmount) * 100}%`,
                          transition: 'width 0.3s',
                        }}></div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center', marginBottom: '1.5rem' }}>
                        {((loan.paidAmount / loan.totalAmount) * 100).toFixed(1)}% remboursé
                      </p>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => handleLoanRepay(loan.id, loan.monthlyPayment)}
                          style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Payer la mensualité ({loan.monthlyPayment.toFixed(2)} €)
                        </button>
                        <button
                          onClick={() => {
                            const amount = prompt('Montant du remboursement anticipé (€) :')
                            if (amount) handleLoanRepay(loan.id, amount)
                          }}
                          style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#f3f4f6',
                            color: '#333',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Remboursement anticipé
                        </button>
                      </div>
                    </>
                  )}

                  {loan.status === 'pending' && (
                    <p style={{ color: '#92400e', background: '#fef3c7', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                      ⏳ Votre demande est en cours d'examen. Vous recevrez une réponse sous 48h.
                    </p>
                  )}

                  {loan.status === 'completed' && (
                    <p style={{ color: '#1e40af', background: '#dbeafe', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                      🎉 Félicitations ! Ce prêt est entièrement remboursé.
                    </p>
                  )}
                </div>
              ))}

              {loans.length === 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '3rem',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🏦</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    Aucun prêt
                  </p>
                  <p style={{ color: '#999' }}>
                    Demandez votre premier prêt pour financer vos projets
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        {currentView === 'crypto' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Cryptomonnaies</h2>
              <button
                onClick={() => {
                  setShowCryptoModal(true)
                  setCryptoAction('buy')
                }}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                + Acheter Crypto
              </button>
            </div>

            {/* Valeur totale */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '20px',
              padding: '2rem',
              color: 'white',
              marginBottom: '2rem',
            }}>
              <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>Valeur totale du portefeuille</p>
              <h2 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {cryptoWallets.reduce((sum, w) => sum + w.valueEUR, 0).toFixed(2)} €
              </h2>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0 }}>
                {cryptoWallets.length} {cryptoWallets.length > 1 ? 'cryptomonnaies' : 'cryptomonnaie'}
              </p>
            </div>

            {/* Modal Achat/Vente */}
            {showCryptoModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    {cryptoAction === 'buy' ? '₿ Acheter Crypto' : '💰 Vendre Crypto'}
                  </h3>

                  {error && (
                    <div style={{
                      padding: '1rem',
                      background: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '10px',
                      color: '#c33',
                      marginBottom: '1rem',
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  {/* Type d'action */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => setCryptoAction('buy')}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: cryptoAction === 'buy' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                        color: cryptoAction === 'buy' ? 'white' : '#666',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Acheter
                    </button>
                    <button
                      onClick={() => setCryptoAction('sell')}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: cryptoAction === 'sell' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#f3f4f6',
                        color: cryptoAction === 'sell' ? 'white' : '#666',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Vendre
                    </button>
                  </div>

                  <form onSubmit={handleCryptoTrade}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Cryptomonnaie
                      </label>
                      <select
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        style={styles.input}
                      >
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="USDT">Tether (USDT)</option>
                        <option value="BNB">Binance Coin (BNB)</option>
                      </select>
                      {cryptoPrices[selectedCrypto] && (
                        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '-0.75rem' }}>
                          Prix actuel : {cryptoPrices[selectedCrypto].toFixed(2)} €
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {cryptoAction === 'buy' ? 'Montant en € à dépenser' : `Quantité de ${selectedCrypto} à vendre`}
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        min={cryptoAction === 'buy' ? '10' : '0.00000001'}
                        value={cryptoAmount}
                        onChange={(e) => setCryptoAmount(e.target.value)}
                        placeholder={cryptoAction === 'buy' ? '100.00' : '0.01'}
                        style={styles.input}
                        required
                      />
                      {cryptoAction === 'sell' && (
                        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '-0.75rem' }}>
                          Disponible : {cryptoWallets.find(w => w.cryptocurrency === selectedCrypto)?.balance.toFixed(8) || '0.00'} {selectedCrypto}
                        </p>
                      )}
                    </div>

                    {/* Estimation */}
                    {cryptoAmount && cryptoPrices[selectedCrypto] && (
                      <div style={{
                        background: '#f3f4f6',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666' }}>
                            {cryptoAction === 'buy' ? 'Vous recevrez' : 'Vous recevrez'}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>
                            {cryptoAction === 'buy' 
                              ? `~${(parseFloat(cryptoAmount) / cryptoPrices[selectedCrypto]).toFixed(8)} ${selectedCrypto}`
                              : `~${(parseFloat(cryptoAmount) * cryptoPrices[selectedCrypto]).toFixed(2)} €`
                            }
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666' }}>Frais (1%)</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {cryptoAction === 'buy'
                              ? `${(parseFloat(cryptoAmount || 0) * 0.01).toFixed(2)} €`
                              : `${(parseFloat(cryptoAmount || 0) * cryptoPrices[selectedCrypto] * 0.01).toFixed(2)} €`
                            }
                          </span>
                        </div>
                        <div style={{
                          borderTop: '1px solid #ddd',
                          paddingTop: '0.5rem',
                          marginTop: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}>
                          <span style={{ fontWeight: 'bold' }}>Total</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {cryptoAction === 'buy'
                              ? `${(parseFloat(cryptoAmount || 0) * 1.01).toFixed(2)} €`
                              : `${(parseFloat(cryptoAmount || 0) * cryptoPrices[selectedCrypto] * 0.99).toFixed(2)} €`
                            }
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCryptoModal(false)
                          setError('')
                        }}
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: '#e5e7eb',
                          color: '#333',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: cryptoAction === 'buy' 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Traitement...' : (cryptoAction === 'buy' ? 'Acheter' : 'Vendre')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des wallets */}
            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
              {cryptoWallets.map((wallet) => {
                const icons = { BTC: '₿', ETH: 'Ξ', USDT: '₮', BNB: 'Ⓑ' };
                const colors = {
                  BTC: 'from-orange-400 to-orange-600',
                  ETH: 'from-blue-400 to-blue-600',
                  USDT: 'from-green-400 to-green-600',
                  BNB: 'from-yellow-400 to-yellow-600',
                };

                return (
                  <div key={wallet.id} style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors[wallet.cryptocurrency]})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        fontWeight: 'bold',
                      }}>
                        {icons[wallet.cryptocurrency]}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                          {wallet.cryptocurrency === 'BTC' ? 'Bitcoin' : wallet.cryptocurrency === 'ETH' ? 'Ethereum' : wallet.cryptocurrency === 'USDT' ? 'Tether' : 'Binance Coin'}
                        </h4>
                        <p style={{ color: '#666', margin: 0 }}>{wallet.balance.toFixed(8)} {wallet.cryptocurrency}</p>
                        <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0 0' }}>{wallet.address.substring(0, 20)}...</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                        {wallet.valueEUR.toFixed(2)} €
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 1rem 0' }}>
                        1 {wallet.cryptocurrency} = {wallet.currentPrice.toFixed(2)} €
                      </p>
                      <button
                        onClick={() => {
                          setShowCryptoModal(true)
                          setCryptoAction('sell')
                          setSelectedCrypto(wallet.cryptocurrency)
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Vendre
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historique des transactions crypto */}
            {cryptoTransactions.length > 0 && (
              <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  Historique des transactions crypto
                </h3>
                <div>
                  {cryptoTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {tx.type === 'buy' ? '🟢 Achat' : '🔴 Vente'} {tx.cryptocurrency}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                          {tx.amount.toFixed(8)} {tx.cryptocurrency}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                          {tx.fiatAmount.toFixed(2)} € {tx.type === 'buy' ? '(débit)' : '(crédit)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cryptoWallets.length === 0 && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '3rem',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>₿</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  Aucun portefeuille crypto
                </p>
                <p style={{ color: '#999', marginBottom: '1.5rem' }}>
                  Commencez à investir dans les cryptomonnaies
                </p>
                <button
                  onClick={() => setShowCryptoModal(true)}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Acheter ma première crypto
                </button>
              </div>
            )}
          </>
        )}
        {currentView === 'admin' && (user?.role === 'admin' || user?.role === 'super_admin') && (
          <>
            <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  👨‍💼 Administration NeoBank
                </h2>
                <p style={{ color: '#666' }}>Contrôle total de la plateforme</p>
              </div>
              <button
                onClick={refreshAdminData}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🔄 Rafraîchir les données
              </button>
            </div>
              <p style={{ color: '#666' }}>Contrôle total de la plateforme</p>
            </div>

            {/* Navigation admin */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setAdminView('overview')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: adminView === 'overview' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: adminView === 'overview' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                📊 Vue d'ensemble
              </button>
              <button
                onClick={() => setAdminView('users')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: adminView === 'users' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: adminView === 'users' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                👥 Utilisateurs ({allUsers.length})
              </button>
              <button
                onClick={() => setAdminView('loans')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: adminView === 'loans' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: adminView === 'loans' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🏦 Prêts ({pendingLoans.length})
              </button>
              <button
                onClick={() => setAdminView('transactions')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: adminView === 'transactions' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                  color: adminView === 'transactions' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                💸 Transactions ({allTransactions.length})
              </button>
            </div>

            {/* Vue d'ensemble */}
            {adminView === 'overview' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    color: 'white',
                  }}>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Utilisateurs totaux</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{allUsers.length}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                      {allUsers.filter(u => u.isLocked).length} bloqués
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    color: 'white',
                  }}>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Solde total plateforme</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                      {allUsers.reduce((sum, u) => sum + u.balance, 0).toFixed(2)} €
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    color: 'white',
                  }}>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Prêts en attente</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{pendingLoans.length}</p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    color: 'white',
                  }}>
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Cartes émises</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                      {allUsers.reduce((sum, u) => sum + u.cardsCount, 0)}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    🚨 Actions rapides
                  </h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <button
                      onClick={() => setAdminView('users')}
                      style={{
                        padding: '1rem',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      👥 Gérer les utilisateurs →
                    </button>
                    <button
                      onClick={() => setAdminView('loans')}
                      style={{
                        padding: '1rem',
                        background: pendingLoans.length > 0 ? '#fef3c7' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: pendingLoans.length > 0 ? '#92400e' : '#333',
                      }}
                    >
                      🏦 Valider les prêts ({pendingLoans.length}) →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Vue Utilisateurs */}
            {adminView === 'users' && (
              <>
                <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    👥 Gestion des utilisateurs
                  </h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {allUsers.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          border: `2px solid ${user.isLocked ? '#fee2e2' : '#e5e7eb'}`,
                          borderRadius: '15px',
                          padding: '1.5rem',
                          background: user.isLocked ? '#fef2f2' : 'white',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                                {user.firstName} {user.lastName}
                              </h4>
                              {user.isLocked && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  borderRadius: '10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                }}>
                                  🔒 BLOQUÉ
                                </span>
                              )}
                            </div>
                            <p style={{ color: '#666', margin: '0 0 0.25rem 0' }}>📧 {user.email}</p>
                            <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
                              💰 Solde: {user.balance.toFixed(2)} € | 
                              💳 {user.cardsCount} carte(s) | 
                              🏦 {user.loansCount} prêt(s) | 
                              📊 {user.transactionsCount} transaction(s)
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => fetchUserDetails(user.id)}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                              }}
                            >
                              👁️ Détails
                            </button>
                            {user.isLocked ? (
                              <button
                                onClick={() => handleUnblockUser(user.id)}
                                style={{
                                  padding: '0.75rem 1rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                }}
                              >
                                🔓 Débloquer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user.id)}
                                style={{
                                  padding: '0.75rem 1rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                }}
                              >
                                🔒 Bloquer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Détails Utilisateur */}
                {showUserModal && selectedUser && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem',
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '2rem',
                      maxWidth: '900px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflow: 'auto',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                            {selectedUser.user.firstName} {selectedUser.user.lastName}
                          </h3>
                          <p style={{ color: '#666' }}>{selectedUser.user.email}</p>
                        </div>
                        <button
                          onClick={() => setShowUserModal(false)}
                          style={{
                            padding: '0.5rem',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Actions rapides */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                          onClick={() => handleAdjustBalance(selectedUser.user.id)}
                          style={{
                            padding: '1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          💰 Ajuster solde
                        </button>
                        {selectedUser.user.isLocked ? (
                          <button
                            onClick={() => handleUnblockUser(selectedUser.user.id)}
                            style={{
                              padding: '1rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            🔓 Débloquer
                          </button>
                        ) : (
                          <button
                          onClick={() => handleBlockUser(selectedUser.user.id)}
                            style={{
                              padding: '1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            🔒 Bloquer
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(selectedUser.user.id)}
                          style={{
                            padding: '1rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>

                      {/* Informations */}
                      <div style={{ background: '#f9fafb', borderRadius: '15px', padding: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Solde</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                              {selectedUser.user.balance.toFixed(2)} €
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Compte</p>
                            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                              {selectedUser.user.accountNumber}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Statut KYC</p>
                            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                              {selectedUser.user.kycStatus}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Inscription</p>
                            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                              {new Date(selectedUser.user.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cartes */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                          💳 Cartes ({selectedUser.cards.length})
                        </h4>
                        {selectedUser.cards.length === 0 ? (
                          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Aucune carte</p>
                        ) : (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {selectedUser.cards.map((card) => (
                              <div
                                key={card.id}
                                style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                                    •••• {card.card_number_last4} - {card.card_type.toUpperCase()}
                                  </p>
                                  <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                                    {card.holder_name} | Expire {card.expiry_month}/{card.expiry_year}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleToggleCard(card.id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: card.is_blocked ? '#10b981' : '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {card.is_blocked ? '🔓' : '🔒'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: '#f3f4f6',
                                      color: '#666',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Prêts */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                          🏦 Prêts ({selectedUser.loans.length})
                        </h4>
                        {selectedUser.loans.length === 0 ? (
                          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Aucun prêt</p>
                        ) : (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {selectedUser.loans.map((loan) => (
                              <div
                                key={loan.id}
                                style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                                      {parseFloat(loan.amount).toFixed(2)} € sur {loan.duration_months} mois
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                                      Restant: {parseFloat(loan.remaining_amount).toFixed(2)} € | Mensualité: {parseFloat(loan.monthly_payment).toFixed(2)} €
                                    </p>
                                  </div>
                                  <span style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    background: loan.status === 'active' ? '#dcfce7' : loan.status === 'pending' ? '#fef3c7' : '#dbeafe',
                                    color: loan.status === 'active' ? '#166534' : loan.status === 'pending' ? '#92400e' : '#1e40af',
                                  }}>
                                    {loan.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Wallets Crypto */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                          ₿ Crypto ({selectedUser.cryptoWallets.length})
                        </h4>
                        {selectedUser.cryptoWallets.length === 0 ? (
                          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Aucun wallet</p>
                        ) : (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {selectedUser.cryptoWallets.map((wallet) => (
                              <div
                                key={wallet.id}
                                style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                }}
                              >
                                <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                                  {wallet.cryptocurrency}: {parseFloat(wallet.balance).toFixed(8)}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                                  {wallet.address.substring(0, 30)}...
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Transactions récentes */}
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                          📊 Transactions récentes
                        </h4>
                        {selectedUser.transactions.length === 0 ? (
                          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Aucune transaction</p>
                        ) : (
                          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                            {selectedUser.transactions.slice(0, 10).map((tx) => (
                              <div
                                key={tx.id}
                                style={{
                                  borderBottom: '1px solid #f0f0f0',
                                  padding: '0.75rem 0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div>
                                  <p style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                                    {tx.description}
                                  </p>
                                  <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
                                    {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <p style={{
                                  fontWeight: 'bold',
                                  color: parseFloat(tx.amount) > 0 ? '#10b981' : '#333',
                                }}>
                                  {parseFloat(tx.amount) > 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(2)} €
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Vue Prêts */}
            {adminView === 'loans' && (
              <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  🏦 Demandes de prêt en attente
                </h3>

                {pendingLoans.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#999',
                  }}>
                    <p style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>✅</p>
                    <p>Aucune demande de prêt en attente</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {pendingLoans.map((loan) => (
                      <div
                        key={loan.id}
                        style={{
                          border: '2px solid #e5e7eb',
                          borderRadius: '15px',
                          padding: '1.5rem',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '1rem',
                        }}>
                          <div>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                              {loan.amount.toFixed(2)} €
                            </h4>
                            <p style={{ color: '#666', margin: '0 0 0.25rem 0' }}>
                              👤 {loan.userName}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
                              📧 {loan.userEmail}
                            </p>
                          </div>
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                          }}>
                            ⏳ En attente
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '1rem',
                          marginBottom: '1rem',
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '10px',
                        }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Durée</p>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{loan.durationMonths} mois</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Taux</p>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{loan.interestRate}%</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Mensualité</p>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{loan.monthlyPayment.toFixed(2)} €</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 0.25rem 0' }}>Solde compte</p>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{loan.accountBalance.toFixed(2)} €</p>
                          </div>
                        </div>

                        {loan.purpose && (
                          <div style={{
                            padding: '1rem',
                            background: '#eff6ff',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                          }}>
                            <p style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                              Objet du prêt
                            </p>
                            <p style={{ color: '#1e40af', margin: 0 }}>{loan.purpose}</p>
                          </div>
                        )}

                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          marginBottom: '1rem',
                        }}>
                          Demandé le {new Date(loan.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            onClick={() => handleApproveLoan(loan.id)}
                            style={{
                              flex: 1,
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '1rem',
                            }}
                          >
                            ✅ Approuver
                          </button>
                          <button
                            onClick={() => handleRejectLoan(loan.id)}
                            style={{
                              flex: 1,
                              padding: '1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '1rem',
                            }}
                          >
                            ❌ Rejeter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vue Transactions */}
            {adminView === 'transactions' && (
              <div style={{ background: 'white', borderRadius: '20px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  💸 Transactions de la plateforme
                </h3>

                {allTransactions.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Aucune transaction</p>
                ) : (
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                            Utilisateur
                          </th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                            Type
                          </th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                            Description
                          </th>
                          <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                            Montant
                          </th>
                          <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#666' }}>
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '1rem' }}>
                              <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>{tx.userName}</p>
                              <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>{tx.userEmail}</p>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: '#f3f4f6',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                              {tx.description}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <span style={{
                                fontWeight: 'bold',
                                color: tx.amount > 0 ? '#10b981' : '#333',
                              }}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                              {new Date(tx.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
  
}