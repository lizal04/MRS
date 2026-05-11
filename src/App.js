import React, { useState} from 'react';

const MovieRecommender = () => {
  const [stage, setStage] = useState('welcome');
  const [darkMode, setDarkMode] = useState(false);
  const [answers, setAnswers] = useState({
    genre: '',
    mood: '',
    company: '',
    ageRating: '',
    duration: ''
  });
  const [allMovies, setAllMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const moviesPerPage = 30;

  const TMDB_API_KEY = 'f67cff7fa9eeb11dda710e16fd5b438a';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  const genreMap = {
    action: 28,
    comedy: 35,
    drama: 18,
    horror: 27,
    romance: 10749,
    scifi: 878,
    fantasy: 14,
    thriller: 53,
    animation: 16,
    documentary: 99
  };

  const moodToRating = {
    happy: { min: 7, max: 10 },
    sad: { min: 6, max: 10 },
    thrilling: { min: 7, max: 10 },
    relaxing: { min: 5, max: 8 },
    dark: { min: 6, max: 10 },
    lighthearted: { min: 6, max: 10 }
  };

  const fetchMovies = async () => {
  try {
    setStage('loading');
    setError('');
    setCurrentPage(1);

    const genreId = genreMap[answers.genre] || '';
    const ratingRange = moodToRating[answers.mood] || { min: 5, max: 10 };

    // Fetch from 5 pages to get 100+ movies
    let allResults = [];
    for (let page = 1; page <= 5; page++) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&vote_average.gte=${ratingRange.min}&vote_average.lte=${ratingRange.max}&sort_by=vote_average.desc&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch movies. Check your API key!');
      }

      const data = await response.json();
      allResults = allResults.concat(data.results || []);
    }

    let filtered = allResults;

    if (answers.duration === 'short') {
      filtered = filtered.filter(m => m.runtime && m.runtime <= 90);
    } else if (answers.duration === 'long') {
      filtered = filtered.filter(m => m.runtime && m.runtime >= 150);
    }

    if (answers.company === 'kids') {
      filtered = filtered.filter(m => !m.adult);
    }

    setAllMovies(filtered.slice(0, 200));
    setStage('results');
  } catch (err) {
    setError(err.message);
    setStage('quiz');
  }
};

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!answers.genre || !answers.mood || !answers.company || !answers.ageRating) {
      setError('Please answer all questions!');
      return;
    }
    fetchMovies();
  };

  const resetQuiz = () => {
    setAnswers({ genre: '', mood: '', company: '', ageRating: '', duration: '' });
    setStage('welcome');
    setAllMovies([]);
    setCurrentPage(1);
    setError('');
  };

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = allMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(allMovies.length / moviesPerPage);

  return (
    <div style={{...styles.container, backgroundColor: darkMode ? '#0f0f0f' : '#f5f5f5'}}>
      {stage === 'welcome' && <WelcomeStage onStart={() => setStage('quiz')} darkMode={darkMode} />}
      {stage === 'quiz' && (
        <QuizStage
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          error={error}
          darkMode={darkMode}
        />
      )}
      {stage === 'loading' && <LoadingStage darkMode={darkMode} />}
      {stage === 'results' && (
        <ResultsStage
          movies={currentMovies}
          answers={answers}
          onReset={resetQuiz}
          error={error}
          darkMode={darkMode}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          onPrevPage={() => setCurrentPage(p => Math.max(p - 1, 1))}
          totalMovies={allMovies.length}
        />
      )}
      
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: darkMode ? '#ffd700' : '#1a1a2e',
          border: 'none',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        title="Toggle dark mode"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

const WelcomeStage = ({ onStart, darkMode }) => (
  <div style={{...styles.stage, background: darkMode ? '#1a1a1a' : 'white', color: darkMode ? '#fff' : '#000'}}>
    <h1 style={{...styles.title, color: darkMode ? '#fff' : '#333'}}>🎬 Smart Movie Finder</h1>
    <p style={{...styles.subtitle, color: darkMode ? '#aaa' : '#666'}}>
      Tell us your mood, vibe, and preferences, and we'll recommend the perfect movie for you.
    </p>
    <button onClick={onStart} style={{...styles.primaryButton, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      Start Quiz →
    </button>
  </div>
);

const QuizStage = ({ answers, onAnswer, onSubmit, error, darkMode }) => (
  <div style={{...styles.stage, background: darkMode ? '#1a1a1a' : 'white', color: darkMode ? '#fff' : '#000'}}>
    <h2 style={{...styles.sectionTitle, color: darkMode ? '#fff' : '#333'}}>Let's Find Your Movie 🎯</h2>

    <div style={styles.questionGroup}>
      <label style={{...styles.label, color: darkMode ? '#fff' : '#333'}}>What genre are you in the mood for?</label>
      <div style={styles.optionGrid}>
        {['action', 'comedy', 'drama', 'horror', 'romance', 'scifi', 'fantasy', 'thriller'].map(g => (
          <button
            key={g}
            onClick={() => onAnswer('genre', g)}
            style={{
              ...styles.optionButton,
              background: answers.genre === g ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (darkMode ? '#2a2a2a' : 'white'),
              color: answers.genre === g ? 'white' : (darkMode ? '#fff' : '#333'),
              borderColor: answers.genre === g ? 'transparent' : (darkMode ? '#444' : '#ddd')
            }}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div style={styles.questionGroup}>
      <label style={{...styles.label, color: darkMode ? '#fff' : '#333'}}>What's the vibe you're feeling?</label>
      <div style={styles.optionGrid}>
        {['happy', 'sad', 'thrilling', 'relaxing', 'dark', 'lighthearted'].map(m => (
          <button
            key={m}
            onClick={() => onAnswer('mood', m)}
            style={{
              ...styles.optionButton,
              background: answers.mood === m ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (darkMode ? '#2a2a2a' : 'white'),
              color: answers.mood === m ? 'white' : (darkMode ? '#fff' : '#333'),
              borderColor: answers.mood === m ? 'transparent' : (darkMode ? '#444' : '#ddd')
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div style={styles.questionGroup}>
      <label style={{...styles.label, color: darkMode ? '#fff' : '#333'}}>Who are you watching with?</label>
      <div style={styles.optionGrid}>
        {['alone', 'couple', 'family', 'friends', 'kids'].map(c => (
          <button
            key={c}
            onClick={() => onAnswer('company', c)}
            style={{
              ...styles.optionButton,
              background: answers.company === c ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (darkMode ? '#2a2a2a' : 'white'),
              color: answers.company === c ? 'white' : (darkMode ? '#fff' : '#333'),
              borderColor: answers.company === c ? 'transparent' : (darkMode ? '#444' : '#ddd')
            }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div style={styles.questionGroup}>
      <label style={{...styles.label, color: darkMode ? '#fff' : '#333'}}>Age rating preference?</label>
      <div style={styles.optionGrid}>
        {['kids', 'teen', 'mature', 'adult'].map(a => (
          <button
            key={a}
            onClick={() => onAnswer('ageRating', a)}
            style={{
              ...styles.optionButton,
              background: answers.ageRating === a ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (darkMode ? '#2a2a2a' : 'white'),
              color: answers.ageRating === a ? 'white' : (darkMode ? '#fff' : '#333'),
              borderColor: answers.ageRating === a ? 'transparent' : (darkMode ? '#444' : '#ddd')
            }}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div style={styles.questionGroup}>
      <label style={{...styles.label, color: darkMode ? '#fff' : '#333'}}>Movie length preference?</label>
      <div style={styles.optionGrid}>
        {['any', 'short', 'long'].map(d => (
          <button
            key={d}
            onClick={() => onAnswer('duration', d || 'any')}
            style={{
              ...styles.optionButton,
              background: answers.duration === d || (d === 'any' && !answers.duration) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (darkMode ? '#2a2a2a' : 'white'),
              color: answers.duration === d || (d === 'any' && !answers.duration) ? 'white' : (darkMode ? '#fff' : '#333'),
              borderColor: answers.duration === d || (d === 'any' && !answers.duration) ? 'transparent' : (darkMode ? '#444' : '#ddd')
            }}
          >
            {d === 'short' ? 'Under 90 min' : d === 'long' ? 'Over 2.5 hrs' : 'Any length'}
          </button>
        ))}
      </div>
    </div>

    {error && <p style={{...styles.error, color: darkMode ? '#ff6b6b' : '#e74c3c'}}>{error}</p>}

    <button onClick={onSubmit} style={{...styles.primaryButton, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      Get Recommendations →
    </button>
  </div>
);

const LoadingStage = ({ darkMode }) => (
  <div style={{...styles.stage, background: darkMode ? '#1a1a1a' : 'white', color: darkMode ? '#fff' : '#000'}}>
    <h2 style={{...styles.sectionTitle, color: darkMode ? '#fff' : '#333'}}>Finding your perfect movies...</h2>
    <div style={{...styles.spinner, borderColor: darkMode ? '#333' : '#ddd', borderTopColor: '#667eea'}}></div>
  </div>
);

const ResultsStage = ({ movies, answers, onReset, error, darkMode, currentPage, totalPages, onNextPage, onPrevPage, totalMovies }) => (
  <div style={{...styles.stage, background: darkMode ? '#1a1a1a' : 'white', color: darkMode ? '#fff' : '#000'}}>
    <h2 style={{...styles.sectionTitle, color: darkMode ? '#fff' : '#333'}}>
      Perfect {answers.genre} movies for a {answers.mood} vibe 🎬
    </h2>

    <div style={{...styles.paginationInfo, color: darkMode ? '#aaa' : '#666'}}>
      Showing {(currentPage - 1) * 24 + 1}-{Math.min(currentPage * 24, totalMovies)} of {totalMovies} movies
    </div>

    {error && <p style={{...styles.error, color: darkMode ? '#ff6b6b' : '#e74c3c'}}>{error}</p>}

    {movies.length > 0 ? (
      <>
        <div style={styles.moviesGrid}>
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} darkMode={darkMode} />
          ))}
        </div>

        <div style={styles.paginationContainer}>
          <button 
            onClick={onPrevPage} 
            disabled={currentPage === 1}
            style={{...styles.paginationButton, opacity: currentPage === 1 ? 0.5 : 1}}
          >
            ← Previous
          </button>
          <span style={{...styles.pageIndicator, color: darkMode ? '#fff' : '#333'}}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            style={{...styles.paginationButton, opacity: currentPage === totalPages ? 0.5 : 1}}
          >
            Next →
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={onReset} style={{...styles.secondaryButton, background: darkMode ? '#2a2a2a' : 'white', color: darkMode ? '#667eea' : '#667eea', borderColor: '#667eea'}}>
            Start Over
          </button>
        </div>
      </>
    ) : (
      <p style={{...styles.noResults, color: darkMode ? '#aaa' : '#666'}}>
        No movies found for that combination. Try adjusting your preferences!
      </p>
    )}
  </div>
);

const MovieCard = ({ movie, darkMode }) => (
  <div style={{
    ...styles.movieCard,
    background: darkMode ? '#2a2a2a' : '#f8f8f8',
    transform: 'translateY(0)',
    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-8px)';
    e.currentTarget.style.boxShadow = darkMode ? '0 12px 24px rgba(102, 126, 234, 0.4)' : '0 12px 24px rgba(102, 126, 234, 0.3)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)';
  }}>
    {movie.poster_path ? (
      <img
        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
        alt={movie.title}
        style={styles.moviePoster}
      />
    ) : (
      <div style={{...styles.noPoster, background: darkMode ? '#1a1a1a' : '#ddd', color: darkMode ? '#666' : '#999'}}>No poster</div>
    )}
    <h3 style={{...styles.movieTitle, color: darkMode ? '#fff' : '#333'}}>{movie.title}</h3>
    <p style={{...styles.movieYear, color: darkMode ? '#999' : '#999'}}>{movie.release_date?.split('-')[0]}</p>
    <div style={{...styles.ratingContainer, borderTopColor: darkMode ? '#444' : '#eee'}}>
      <span style={{...styles.rating, color: '#667eea'}}>⭐ {movie.vote_average?.toFixed(1)}</span>
    </div>
  </div>
);

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    transition: 'background-color 0.3s ease'
  },
  stage: {
    maxWidth: '1000px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '50px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease'
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '15px',
    color: '#333',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '18px',
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '30px',
    color: '#333'
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    display: 'block',
    marginBottom: '15px',
    color: '#333'
  },
  questionGroup: {
    marginBottom: '35px'
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px'
  },
  optionButton: {
    padding: '14px 18px',
    border: '2px solid #ddd',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    color: '#333'
  },
  primaryButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  secondaryButton: {
    padding: '14px 28px',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '40px'
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    marginBottom: '20px',
    padding: '14px 16px',
    background: '#fadbd8',
    borderRadius: '10px',
    borderLeft: '4px solid #e74c3c'
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '40px auto',
    border: '4px solid #ddd',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  moviesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '20px',
    marginTop: '30px'
  },
  movieCard: {
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#f8f8f8',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  moviePoster: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  noPoster: {
    width: '100%',
    height: '200px',
    background: '#ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999'
  },
  movieTitle: {
    fontSize: '14px',
    fontWeight: '700',
    padding: '12px 10px 0',
    margin: '0',
    color: '#333',
    minHeight: '40px'
  },
  movieYear: {
    fontSize: '12px',
    color: '#999',
    padding: '4px 10px',
    margin: '0'
  },
  ratingContainer: {
    padding: '10px 10px',
    borderTop: '1px solid #eee'
  },
  rating: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#667eea'
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
    marginTop: '30px'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '40px',
    padding: '20px'
  },
  paginationButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  pageIndicator: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  paginationInfo: {
    textAlign: 'center',
    fontSize: '13px',
    marginTop: '20px',
    marginBottom: '20px',
    color: '#666'
  }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default MovieRecommender;