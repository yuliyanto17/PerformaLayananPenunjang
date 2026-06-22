// src/pages/test/QRGeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRGeneratorPage = () => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [token] = useState('PET-RAD-198501012010011001-A1B2C3');
  
  useEffect(() => {
    generateQR();
  }, []);
  
  const generateQR = async () => {
    try {
      // Generate QR code
      const url = await QRCode.toDataURL(token, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };
  
  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `QR-${token}.png`;
    link.href = qrDataUrl;
    link.click();
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">QR Code Generator - Testing</h1>
          
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Token:</p>
              <p className="font-mono text-sm bg-white p-3 rounded border">
                {token}
              </p>
            </div>
            
            {/* QR Code Display */}
            {qrDataUrl && (
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-xl shadow-lg">
                  <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={downloadQR}
                    className="btn btn-primary w-full"
                  >
                    Download QR Code
                  </button>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold mb-2">Cara Testing:</p>
                    <ol className="list-decimal list-inside text-left space-y-1">
                      <li>Download QR code ini</li>
                      <li>Buka di device lain atau print</li>
                      <li>Buka aplikasi di HP</li>
                      <li>Scan QR code ini</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
            
            {/* Multiple Tokens */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Token Petugas Lain:</h3>
              <div className="space-y-2 text-sm">
                {[
                  { token: 'PET-RAD-198501012010011001-A1B2C3', nama: 'dr. Budi Santoso' },
                  { token: 'PET-RAD-198602022011012002-D4E5F6', nama: 'Siti Aminah' },
                  { token: 'PET-IRM-198703032012013003-G7H8I9', nama: 'Ahmad Yani' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">{item.nama}</p>
                    <p className="font-mono text-xs text-gray-600">{item.token}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGeneratorPage;