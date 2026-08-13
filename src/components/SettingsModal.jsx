import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './SettingsModal.css';

const CURRENCIES = [
  'AED - United Arab Emirates Dirham',
  'ANG - Netherlands Antillean Guilder',
  'ARS - Argentine Peso',
  'AUD - Australian Dollar',
  'BDT - Bangladeshi Taka',
  'BHD - Bahraini Dinar',
  'BND - Brunei Dollar',
  'BOB - Bolivian Boliviano',
  'BRL - Brazilian Real',
  'BWP - Botswanan Pula',
  'CAD - Canadian Dollar',
  'CDF - Congolese Franc',
  'CLP - Chilean Peso',
  'CNY - Chinese Yuan',
  'COP - Colombian Peso',
  'CRC - Costa Rican Colón',
  'CZK - Czech Koruna',
  'DKK - Danish Krone',
  'DOP - Dominican Peso',
  'DZD - Algerian Dinar',
  'EGP - Egyptian Pound',
  'EUR - Euro',
  'FJD - Fijian Dollar',
  'GBP - British Pound',
  'GEL - Georgian Lari',
  'GHS - Ghanaian Cedi',
  'HKD - Hong Kong Dollar',
  'HNL - Honduran Lempira',
  'HRK - Croatian Kuna',
  'HUF - Hungarian Forint',
  'IDR - Indonesian Rupiah',
  'ILS - Israeli New Shekel',
  'INR - Indian Rupee',
  'IQD - Iraqi Dinar',
  'ISK - Icelandic Króna',
  'JMD - Jamaican Dollar',
  'JOD - Jordanian Dinar',
  'JPY - Japanese Yen',
  'KES - Kenyan Shilling',
  'KGS - Kyrgyzstani Som',
  'KHR - Cambodian Riel',
  'KRW - South Korean Won',
  'KWD - Kuwaiti Dinar',
  'KYD - Cayman Islands Dollar',
  'KZT - Kazakhstani Tenge',
  'LBP - Lebanese Pound',
  'LKR - Sri Lankan Rupee',
  'MAD - Moroccan Dirham',
  'MDL - Moldovan Leu',
  'MGA - Malagasy Ariary',
  'MKD - Macedonian Denar',
  'MMK - Myanmar Kyat',
  'MNT - Mongolian Tugrik',
  'MVR - Maldivian Rufiyaa',
  'MXN - Mexican Peso',
  'MYR - Malaysian Ringgit',
  'MZN - Mozambican Metical',
  'NAD - Namibian Dollar',
  'NGN - Nigerian Naira',
  'NIO - Nicaraguan Córdoba',
  'NOK - Norwegian Krone',
  'NPR - Nepalese Rupee',
  'NZD - New Zealand Dollar',
  'OMR - Omani Rial',
  'PAB - Panamanian Balboa',
  'PEN - Peruvian Sol',
  'PGK - Papua New Guinean Kina',
  'PHP - Philippine Peso',
  'PKR - Pakistani Rupee',
  'PLN - Polish Zloty',
  'PYG - Paraguayan Guarani',
  'QAR - Qatari Rial',
  'RON - Romanian Leu',
  'RSD - Serbian Dinar',
  'RUB - Russian Ruble',
  'RWF - Rwandan Franc',
  'SAR - Saudi Riyal',
  'SCR - Seychellois Rupee',
  'SEK - Swedish Krona',
  'SGD - Singapore Dollar',
  'SLL - Sierra Leonean Leone (1964—2022)',
  'SOS - Somali Shilling',
  'THB - Thai Baht',
  'TND - Tunisian Dinar',
  'TRY - Turkish Lira',
  'TTD - Trinidad & Tobago Dollar',
  'TWD - New Taiwan Dollar',
  'TZS - Tanzanian Shilling',
  'UAH - Ukrainian Hryvnia',
  'UGX - Ugandan Shilling',
  'USD - US Dollar ($)',
  'UYU - Uruguayan Peso',
  'UZS - Uzbekistani Som',
  'VES - Venezuelan Bolívar (2008—2018)',
  'VND - Vietnamese Dong',
  'XAF - Central African CFA Franc',
  'XOF - West African CFA Franc',
  'YER - Yemeni Rial',
  'ZAR - South African Rand',
  'ZMW - Zambian Kwacha'
];

const SettingsModal = ({ onClose }) => {
  const { settings, updateSettings, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('General');
  const [formData, setFormData] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(formData);
    showToast("Settings updated successfully", "success");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="settings-modal">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-modal-body">
          {/* Settings Sub-Sidebar */}
          <div className="settings-nav">
            {['General', 'Channel', 'Upload defaults', 'Permissions', 'Community', 'Agreements'].map(tab => (
              <div 
                key={tab} 
                className={`settings-nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="settings-tab-content">
            {activeTab === 'General' && (
              <div className="settings-panel">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Default units
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-secondary)', cursor: 'pointer' }}>info</span>
                </h3>
                <div className="form-group mt-3">
                  <label>Currency</label>
                  <select 
                    className="form-select" 
                    value={(formData.currency && CURRENCIES.includes(formData.currency)) ? formData.currency : 'INR - Indian Rupee'}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Channel' && (
              <div className="settings-panel">
                <h3>Basic info</h3>
                <div className="form-group mt-3">
                  <label>Country of residence</label>
                  <select 
                    className="form-select"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="form-group mt-3">
                  <label>Keywords (comma separated)</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  />
                </div>
              </div>
            )}

            {activeTab === 'Upload defaults' && (
              <div className="settings-panel">
                <h3>Basic info</h3>
                <div className="form-group mt-3">
                  <label>Default Visibility</label>
                  <select 
                    className="form-select"
                    value={formData.uploadDefaultVisibility}
                    onChange={(e) => setFormData({...formData, uploadDefaultVisibility: e.target.value})}
                  >
                    <option value="Public">Public</option>
                    <option value="Unlisted">Unlisted</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div className="form-group mt-3">
                  <label>Default Category</label>
                  <select 
                    className="form-select"
                    value={formData.defaultCategory}
                    onChange={(e) => setFormData({...formData, defaultCategory: e.target.value})}
                  >
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Howto & Style">Howto & Style</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Community' && (
              <div className="settings-panel">
                <h3>Automated Filters</h3>
                <div className="form-group mt-3">
                  <label>Blocked words (comma separated)</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    value={formData.blockedWords}
                    onChange={(e) => setFormData({...formData, blockedWords: e.target.value})}
                  />
                </div>
              </div>
            )}

            {['Permissions', 'Agreements'].includes(activeTab) && (
              <div className="settings-panel">
                <h3>{activeTab}</h3>
                <p className="text-secondary mt-3">All permissions & agreements are active and compliant with YouTube Partner Program standards.</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer settings-footer">
          <div className="right-footer">
            <button className="prev-btn" onClick={onClose}>CANCEL</button>
            <button className="save-btn" onClick={handleSave}>SAVE</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
