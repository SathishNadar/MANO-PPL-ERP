import React from 'react';

const Header = ({ title, subtitle }) => {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
    );
};

export default Header;
