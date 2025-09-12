const Navbar = ({ currentPage, setCurrentPage, user, setUser }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setCurrentPage('home');
        setIsMenuOpen(false);
    };

    const navItems = user ? [
        { key: 'dashboard', icon: 'chart-bar', label: 'Dashboard' },
        { key: 'courses', icon: 'book', label: 'Courses' },
        { key: 'quiz', icon: 'question-circle', label: 'Quiz' },
        { key: 'chat', icon: 'comments', label: 'AI Chat' }
    ] : [
        { key: 'home', icon: 'home', label: 'Home' },
        { key: 'login', icon: 'sign-in-alt', label: 'Login' },
        { key: 'register', icon: 'user-plus', label: 'Register' }
    ];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <i className="fas fa-brain"></i>
                <span>Learnify</span>
            </div>

            {/* Desktop Menu */}
            <div className="nav-menu desktop-menu">
                {navItems.map(item => (
                    <button
                        key={item.key}
                        className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item.key)}
                    >
                        <i className={`fas fa-${item.icon}`}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
                
                {user && (
                    <button className="nav-btn logout" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button 
                className="mobile-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <i className={`fas fa-${isMenuOpen ? 'times' : 'bars'}`}></i>
            </button>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
                            onClick={() => {
                                setCurrentPage(item.key);
                                setIsMenuOpen(false);
                            }}
                        >
                            <i className={`fas fa-${item.icon}`}></i>
                            <span>{item.label}</span>
                        </button>
                    ))}
                    
                    {user && (
                        <button className="nav-btn logout" onClick={logout}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

window.Navbar = Navbar;