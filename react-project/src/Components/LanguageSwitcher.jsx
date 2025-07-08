import React, { useState, useEffect } from 'react';
import i18n from '../main/i18n';
import "./LanguageSwitcher.scss"

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState(i18n.language);
  
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const toggleLanguage = () => {
    const newLanguage = currentLang === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLanguage)
      .then(() => {
        localStorage.setItem('lang', newLanguage);
      })
      .catch(error => {
        console.error('Language change failed:', error);
      });
  };

  return (
    <div className="language-switcher">
      <div 
        className="toggle-switch"
        onClick={toggleLanguage}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleLanguage()}
      >
        <span className="language-option">
          {currentLang === 'en' ? 'EN' : 'RU'}
        </span>
      </div>
    </div>
  );
};

export default LanguageSwitcher;