import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import "./LanguageSwitcher.scss"

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isRuActive, setIsRuActive] = useState(i18n.language === 'ru');
  
  const toggleLanguage = () => {
    const newLanguage = isRuActive ? 'en' : 'ru';
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('lang', newLanguage);
    setIsRuActive(!isRuActive);
  };

  return (
    <div className="language-switcher">
      <div 
        className={`toggle-switch ${isRuActive ? 'ru-active' : 'en-active'}`}
        onClick={toggleLanguage}
      >
        <span className="language-option ru">RU</span>
        <span className="language-option en">EN</span>
        <div className="slider"></div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;