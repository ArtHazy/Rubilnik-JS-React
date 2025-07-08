import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export const Header = ({ title }) => {
    return (
      <div className="header-container">
        <header>{title}</header>
        <LanguageSwitcher />
      </div>
    );
};